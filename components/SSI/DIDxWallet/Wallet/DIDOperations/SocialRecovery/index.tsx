import React, { useState, useCallback, useEffect } from 'react'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { $donation, updateDonation } from '../../../../../../src/store/donation'
import { ZilPayBase } from '../../../../../ZilPay/zilpay-base'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { Donate, Sign, Spinner } from '../../../../..'
import { $doc } from '../../../../../../src/store/did-doc'
import { decryptKey } from '../../../../../../src/lib/dkms'
import { $resolvedInfo } from '../../../../../../src/store/resolvedInfo'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../src/store/modal'
import { setTxStatusLoading, setTxId } from '../../../../../../src/app/actions'
import controller from '../../../../../../src/hooks/isController'
import { RootState } from '../../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import routerHook from '../../../../../../src/hooks/router'
import { $arconnect } from '../../../../../../src/store/arconnect'
import ContinueArrow from '../../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../../src/assets/icons/tick.svg'
import CloseIcoReg from '../../../../../../src/assets/icons/ic_cross.svg'
import CloseIcoBlack from '../../../../../../src/assets/icons/ic_cross_black.svg'
import toastTheme from '../../../../../../src/hooks/toastTheme'
import useArConnect from '../../../../../../src/hooks/useArConnect'
import fetch from '../../../../../../src/hooks/fetch'

function Component() {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const { navigate } = routerHook()
    const { connect } = useArConnect()
    const { checkUserExists, versionAbove58 } = fetch()

    const dispatch = useDispatch()
    const arConnect = useStore($arconnect)
    const resolvedInfo = useStore($resolvedInfo)
    const dkms = useStore($doc)?.dkms
    const donation = useStore($donation)
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const CloseIco = isLight ? CloseIcoBlack : CloseIcoReg

    const [input, setInput] = useState(0) // the amount of guardians
    const [loadingUserCheck, setLoadingUserCheck] = useState(false)
    const input_ = Array(input)
    const select_input = Array()
    for (let i = 0; i < input_.length; i += 1) {
        select_input[i] = i
    }
    const [input2, setInput2] = useState([])
    const guardians: string[] = input2

    const [legend, setLegend] = useState('continue')
    const [txName, setTxName] = useState('')

    const [hideDonation, setHideDonation] = useState(true)
    const [hideSubmit, setHideSubmit] = useState(true)
    const { isController } = controller()

    const domainNavigate =
        resolvedInfo?.domain !== '' ? resolvedInfo?.domain + '@' : ''

    useEffect(() => {
        isController()
    })

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(0)
        setInput2([])
        setHideSubmit(true)
        setHideDonation(true)
        setLegend('continue')
        let _input = event.target.value
        const re = /,/gi
        _input = _input.replace(re, '.')
        const input = Number(_input)

        if (!isNaN(input) && Number.isInteger(input) && input >= 3) {
            setInput(input)
        } else if (isNaN(input)) {
            toast.error('the input is not a number', {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 1,
            })
        } else if (!Number.isInteger(input)) {
            toast.error('The number of guardians must be an integer.', {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 2,
            })
        } else if (input < 3 && input !== 0) {
            toast.error(t('The number of guardians must be at least three'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 3,
            })
        }
    }

    const handleSave = async () => {
        setLoadingUserCheck(true)
        if (guardians.length === input_.length) {
            var arr = guardians.map((v) => v.toLowerCase())
            const duplicated = new Set(arr).size !== arr.length
            if (duplicated) {
                toast.error(
                    'Guardians must be unique, so you cannot submit repeated domain names.',
                    {
                        position: 'top-right',
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 4,
                    }
                )
            } else {
                for (let i = 0; i < guardians.length; i++) {
                    const res = await checkUserExists(
                        guardians[i].toLowerCase()
                    )
                    if (!res) {
                        break
                    }
                    if (res && i + 1 === guardians.length) {
                        setLegend('saved')
                        setHideDonation(false)
                        setHideSubmit(false)
                    }
                }
            }
        } else {
            toast.error(t('The input is incomplete'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 4,
            })
        }
        setLoadingUserCheck(false)
    }

    const handleSubmit = async (txID) => {
        if (arConnect !== null && resolvedInfo !== null && donation !== null) {
            try {
                const zilpay = new ZilPayBase()
                const tyron_ = await tyron.Donation.default.tyron(donation)
                const [guardians_, hash]: any =
                    await tyron.Util.default.HashGuardians(guardians)

                let params
                if (txID === 'AddGuardians' || txID === 'RemoveGuardians') {
                    params = await tyron.TyronZil.default.Guardians(
                        guardians_,
                        tyron_
                    )
                } else {
                    const encrypted_key = dkms.get('update')
                    const update_private_key = await decryptKey(
                        arConnect,
                        encrypted_key
                    )
                    const update_public_key =
                        zcrypto.getPubKeyFromPrivateKey(update_private_key)
                    const sig =
                        '0x' +
                        zcrypto.sign(
                            Buffer.from(hash, 'hex'),
                            update_private_key,
                            update_public_key
                        )

                    params =
                        await tyron.TyronZil.default.ConfigureSocialRecovery(
                            guardians_,
                            sig,
                            tyron_
                        )
                }

                //const tx_params: tyron.TyronZil.TransitionValue[] = [tyron_];
                const _amount = String(donation)

                toast.info(
                    t(
                        'You’re about to submit a transaction to configure DID Social Recovery'
                    ),
                    {
                        position: 'top-center',
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 6,
                    }
                )
                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)
                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
                        transition: txID,
                        params: params as unknown as Record<string, unknown>[],
                        amount: _amount,
                    })
                    .then(async (res) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        try {
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                dispatch(setTxStatusLoading('confirmed'))
                                updateDonation(null)
                                window.open(
                                    `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                )
                                navigate(
                                    `/${domainNavigate}${resolvedInfo?.name}/didx/recovery`
                                )
                            } else if (tx.isRejected()) {
                                dispatch(setTxStatusLoading('failed'))
                                setTimeout(() => {
                                    toast.error(t('Transaction failed.'), {
                                        position: 'top-right',
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                        theme: toastTheme(isLight),
                                        toastId: 7,
                                    })
                                }, 1000)
                            }
                        } catch (err) {
                            dispatch(setTxStatusLoading('rejected'))
                            updateModalTxMinimized(false)
                            updateModalTx(true)
                            toast.error(String(err), {
                                position: 'top-right',
                                autoClose: 2000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: toastTheme(isLight),
                                toastId: 8,
                            })
                            throw err
                        }
                    })
                    .catch((err) => {
                        updateModalTx(false)
                        toast.error(err, {
                            position: 'top-right',
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                            toastId: 9,
                        })
                    })
            } catch (error) {
                toast.error('Identity verification unsuccessful.', {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 10,
                })
            }
        }
    }

    const toggleActive = (id: string) => {
        updateDonation(null)
        if (id === txName) {
            setTxName('')
        } else {
            setTxName(id)
        }
    }

    if (versionAbove58()) {
        return (
            <div>
                {txName !== '' && (
                    <div
                        className={styles.closeWrapper}
                        onClick={() => {
                            toggleActive('')
                            setInput(0)
                        }}
                    />
                )}
                <div className={styles.content}>
                    <div className={styles.cardWrapper}>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => {
                                    toggleActive('AddGuardians')
                                }}
                                className={
                                    txName === 'AddGuardians'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>ADD GUARDIANS</div>
                            </div>
                            {txName === 'AddGuardians' && (
                                <div className={styles.cardRight}>
                                    <div className={styles.closeIcoWrapper}>
                                        <div
                                            onClick={() => toggleActive('')}
                                            className={styles.closeIco}
                                        >
                                            <Image
                                                width={10}
                                                src={CloseIco}
                                                alt="close-ico"
                                            />
                                        </div>
                                    </div>
                                    <GuardiansList
                                        handleInput={handleInput}
                                        input={input}
                                        select_input={select_input}
                                        setLegend={setLegend}
                                        legend={legend}
                                        handleSave={handleSave}
                                        guardians={guardians}
                                        setHideDonation={setHideDonation}
                                        hideDonation={hideDonation}
                                        setHideSubmit={setHideSubmit}
                                        hideSubmit={hideSubmit}
                                        handleSubmit={() =>
                                            handleSubmit('AddGuardians')
                                        }
                                        title="ADD GUARDIANS"
                                        loadingUserCheck={loadingUserCheck}
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => {
                                    toggleActive('RemoveGuardians')
                                }}
                                className={
                                    txName === 'RemoveGuardians'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>REMOVE GUARDIANS</div>
                            </div>
                            {txName === 'RemoveGuardians' && (
                                <div className={styles.cardRight}>
                                    <div className={styles.closeIcoWrapper}>
                                        <div
                                            onClick={() => toggleActive('')}
                                            className={styles.closeIco}
                                        >
                                            <Image
                                                width={10}
                                                src={CloseIco}
                                                alt="close-ico"
                                            />
                                        </div>
                                    </div>
                                    <GuardiansList
                                        handleInput={handleInput}
                                        input={input}
                                        select_input={select_input}
                                        setLegend={setLegend}
                                        legend={legend}
                                        handleSave={handleSave}
                                        guardians={guardians}
                                        setHideDonation={setHideDonation}
                                        hideDonation={hideDonation}
                                        setHideSubmit={setHideSubmit}
                                        hideSubmit={hideSubmit}
                                        handleSubmit={() =>
                                            handleSubmit('RemoveGuardians')
                                        }
                                        title="REMOVE GUARDIANS"
                                        loadingUserCheck={loadingUserCheck}
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => {
                                    toggleActive('SignAddress')
                                }}
                                className={
                                    txName === 'SignAddress'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>SIGN ADDRESS</div>
                            </div>
                            {txName === 'SignAddress' && (
                                <div className={styles.cardRight}>
                                    <div className={styles.closeIcoWrapper}>
                                        <div
                                            onClick={() => toggleActive('')}
                                            className={styles.closeIco}
                                        >
                                            <Image
                                                width={10}
                                                src={CloseIco}
                                                alt="close-ico"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: '-10%',
                                            width: '100%',
                                        }}
                                    >
                                        <Sign />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div>
                {txName !== '' && (
                    <div
                        className={styles.closeWrapper}
                        onClick={() => {
                            toggleActive('')
                            setInput(0)
                        }}
                    />
                )}
                <div className={styles.content}>
                    <div className={styles.cardWrapper}>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => {
                                    toggleActive('AddGuardians')
                                }}
                                className={
                                    txName === 'AddGuardians'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>ADD GUARDIANS</div>
                            </div>
                            {txName === 'AddGuardians' && (
                                <div className={styles.cardRight}>
                                    <div className={styles.closeIcoWrapper}>
                                        <div
                                            onClick={() => toggleActive('')}
                                            className={styles.closeIco}
                                        >
                                            <Image
                                                width={10}
                                                src={CloseIco}
                                                alt="close-ico"
                                            />
                                        </div>
                                    </div>
                                    <GuardiansList
                                        handleInput={handleInput}
                                        input={input}
                                        select_input={select_input}
                                        setLegend={setLegend}
                                        legend={legend}
                                        handleSave={handleSave}
                                        guardians={guardians}
                                        setHideDonation={setHideDonation}
                                        hideDonation={hideDonation}
                                        setHideSubmit={setHideSubmit}
                                        hideSubmit={hideSubmit}
                                        handleSubmit={() =>
                                            handleSubmit(
                                                'ConfigureSocialRecovery'
                                            )
                                        }
                                        title="ADD GUARDIANS"
                                        loadingUserCheck={loadingUserCheck}
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => {
                                    toggleActive('SignAddress')
                                }}
                                className={
                                    txName === 'SignAddress'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>SIGN ADDRESS</div>
                            </div>
                            {txName === 'SignAddress' && (
                                <div className={styles.cardRight}>
                                    <div className={styles.closeIcoWrapper}>
                                        <div
                                            onClick={() => toggleActive('')}
                                            className={styles.closeIco}
                                        >
                                            <Image
                                                width={10}
                                                src={CloseIco}
                                                alt="close-ico"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: '-10%',
                                            width: '100%',
                                        }}
                                    >
                                        <Sign />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Component

const GuardiansList = ({
    handleInput,
    input,
    select_input,
    setLegend,
    legend,
    handleSave,
    guardians,
    setHideDonation,
    hideDonation,
    setHideSubmit,
    hideSubmit,
    handleSubmit,
    title,
    loadingUserCheck,
}) => {
    const { t } = useTranslation()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const donation = useStore($donation)
    return (
        <div>
            <div className={styles.container}>
                {t('How many guardians would you like?')}
                <input
                    className={styles.inputAmount}
                    type="text"
                    placeholder={t('Type amount')}
                    onChange={handleInput}
                />
            </div>
            {input >= 3 &&
                select_input.map((res: any) => {
                    return (
                        <section key={res} className={styles.container}>
                            <code style={{ width: '50%' }}>
                                {t('Guardian')} #{res + 1}
                            </code>
                            <input
                                className={styles.inputGuardians}
                                type="text"
                                placeholder={t('TYPE_USERNAME')}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                    setLegend('continue')
                                    setHideDonation(true)
                                    setHideSubmit(true)
                                    guardians[res] =
                                        event.target.value.toLowerCase()
                                }}
                            />
                            <code>.did</code>
                        </section>
                    )
                })}
            {input >= 3 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '7%',
                    }}
                >
                    <div
                        className={
                            loadingUserCheck
                                ? ''
                                : legend.toUpperCase() === 'CONTINUE'
                                ? 'continueBtn'
                                : ''
                        }
                        onClick={() => {
                            handleSave()
                        }}
                    >
                        {loadingUserCheck ? (
                            <Spinner />
                        ) : (
                            <>
                                {legend.toUpperCase() === 'CONTINUE' ? (
                                    <Image
                                        width={50}
                                        height={50}
                                        src={ContinueArrow}
                                        alt="arrow"
                                    />
                                ) : (
                                    <div style={{ marginTop: '5px' }}>
                                        <Image
                                            width={50}
                                            src={TickIco}
                                            alt="tick"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            {!hideDonation && <Donate />}
            {!hideSubmit && donation !== null && (
                <div
                    style={{
                        marginTop: '10%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        {title}
                    </div>
                    <div className={styles.txt} style={{ marginTop: '20px' }}>
                        {t('GAS_AROUND')}: 1-2 ZIL
                    </div>
                </div>
            )}
        </div>
    )
}
