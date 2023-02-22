import React, { useState } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { $donation, updateDonation } from '../../../../../src/store/donation'
import styles from './styles.module.scss'
import { Donate, Spinner } from '../../../..'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import { $doc } from '../../../../../src/store/did-doc'
import { $resolvedInfo } from '../../../../../src/store/resolvedInfo'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import { setTxStatusLoading, setTxId } from '../../../../../src/app/actions'
import { RootState } from '../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import toastTheme from '../../../../../src/hooks/toastTheme'
import ContinueArrow from '../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../src/assets/icons/tick.svg'
import fetch from '../../../../../src/hooks/fetch'

function Component() {
    const { t } = useTranslation()
    const { checkUserExists, versionAbove58 } = fetch()
    const dispatch = useDispatch()
    const _guardians = useStore($doc)?.guardians.length as number

    let min_guardians = parseInt(String(_guardians / 2 + 1))
    if (min_guardians < 3) {
        min_guardians = 3
    }
    const resolvedInfo = useStore($resolvedInfo)
    const donation = useStore($donation)
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)

    const input_ = Array(min_guardians)
    const select_input = Array()
    for (let i = 0; i < input_.length; i += 1) {
        select_input[i] = i
    }
    const guardians_: string[][] = []
    const [guardians, setGuardians] = useState(guardians_)

    const empty_tx_value = [
        {
            argtypes: ['String', 'ByStr64'],
            arguments: ['', ''],
            constructor: 'Pair',
        },
    ]
    const [txvalue, setTxValue] = useState(empty_tx_value)

    const [legendB, setLegendB] = useState('continue')

    //@todo-i review buttonB
    const [buttonB, setButtonB] = useState('button primary')

    const [hideDonation, setHideDonation] = useState(true)
    const [hideSubmit, setHideSubmit] = useState(true)

    const [input, setInput] = useState('') //the new address
    const [legend, setLegend] = useState('Save')
    const [button, setButton] = useState('button primary')
    const [loadingInput, setLoadingInput] = useState(false)
    const [mount, setMount] = useState(true)

    const handleInput = (event: { target: { value: any } }) => {
        setInput('')
        setLegend('save')
        setButton('button primary')
        const addr = tyron.Address.default.verification(event.target.value)
        if (addr !== '') {
            setInput(addr)
        } else {
            toast.error(t('Wrong address.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 5,
            })
        }
    }
    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    }
    const handleSave = async () => {
        if (input !== '') {
            setLegend('saved')
            setButton('button')
        }
    }

    const handleReset = async () => {
        setButtonB('button primary')
        setLegendB('continue')
        setHideDonation(true)
        setHideSubmit(true)
    }

    const handleContinue = async () => {
        setLoadingInput(true)
        const signatures: any[] = []
        if (guardians.length !== 0) {
            for (let i = 0; i < guardians.length; i += 1) {
                const this_input = guardians[i]
                if (this_input[0] !== '' && this_input[1] !== '') {
                    if (versionAbove58()) {
                        const hash = await tyron.Util.default.HashString(
                            this_input[0]
                        )
                        signatures.push({
                            argtypes: ['ByStr32', 'ByStr64'],
                            arguments: [`${hash}`, `${this_input[1]}`],
                            constructor: 'Pair',
                        })
                    } else {
                        signatures.push({
                            argtypes: ['String', 'ByStr64'],
                            arguments: [`${this_input[0]}`, `${this_input[1]}`],
                            constructor: 'Pair',
                        })
                    }
                }
            }
        }
        if (signatures.length !== min_guardians) {
            toast.error(t('The input is incomplete'), {
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
        } else {
            for (let i = 0; i < guardians.length; i += 1) {
                const this_input = guardians[i]
                const validUsername = await checkUserExists(this_input[0])
                if (!validUsername) {
                    break
                }
                if (this_input[1].slice(0, 2) !== '0x') {
                    toast.error('Signature should start with 0x', {
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
                    break
                }
                if (validUsername && i + 1 === guardians.length) {
                    setTxValue(signatures)
                    setButtonB('button')
                    setLegendB('saved')
                    setHideDonation(false)
                    setHideSubmit(false)
                }
            }
        }
        setLoadingInput(false)
    }

    const handleSubmit = async () => {
        if (resolvedInfo !== null && donation !== null) {
            const zilpay = new ZilPayBase()
            const txID = 'DidSocialRecovery'

            const tyron_: tyron.TyronZil.TransitionValue =
                await tyron.Donation.default.tyron(donation)

            let params
            if (versionAbove58()) {
                params = await tyron.TyronZil.default.DidSocialRecover(
                    input,
                    txvalue,
                    tyron_
                )
            } else {
                params = await tyron.TyronZil.default.DidSocialRecovery(
                    input,
                    txvalue,
                    tyron_
                )
            }

            const _amount = String(donation)

            toast.info(
                `You're about to submit a DID Social Recovery operation!`,
                {
                    position: 'top-center',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
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
                        })
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
                    })
                })
        }
    }

    const pasteFromClipboard = async (res) => {
        setMount(false)
        const text = navigator.clipboard.readText()
        handleReset()
        const value = text
        if (guardians[res] === undefined) {
            guardians[res] = ['', '']
        }
        guardians[res][1] = (await value).toLowerCase()
        setGuardians(guardians)
        setTimeout(() => {
            setMount(true)
        }, 1)
    }

    return (
        <div style={{ marginTop: '2%' }}>
            <h3 style={{ marginBottom: '7%', color: 'silver' }}>
                {t('SOCIAL RECOVER YOUR SELF-SOVEREIGN IDENTITY')}
            </h3>
            <section className={styles.container}>
                <h4>
                    {t(
                        'UPDATE X’S DID CONTROLLER ADDRESS WITH THE HELP OF THEIR GUARDIANS',
                        { name: resolvedInfo?.name }
                    )}
                </h4>
                <div className={styles.containerInput}>
                    <input
                        type="text"
                        placeholder={t('Type new address')}
                        onChange={handleInput}
                        onKeyPress={handleOnKeyPress}
                    />
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '1rem',
                        }}
                    >
                        <div
                            className={
                                legend.toUpperCase() === 'SAVE'
                                    ? 'continueBtn'
                                    : ''
                            }
                            onClick={handleSave}
                        >
                            {legend.toUpperCase() === 'SAVE' ? (
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
                        </div>
                    </div>
                </div>
            </section>
            {input !== '' && legend === 'saved' && (
                <>
                    <p style={{ marginTop: '7%' }}>
                        You need {min_guardians} guardian signatures:
                    </p>
                    {select_input.map((res: number) => {
                        return (
                            <section key={res} className={styles.containerX}>
                                <input
                                    style={{ width: '40%' }}
                                    type="text"
                                    placeholder={t('Guardian’s NFT Domain')}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                        handleReset()
                                        const value = event.target.value
                                        if (guardians[res] === undefined) {
                                            guardians[res] = ['', '']
                                        }
                                        guardians[res][0] = value.toLowerCase()
                                        setGuardians(guardians)
                                    }}
                                />
                                <input
                                    style={{ width: '80%' }}
                                    type="text"
                                    placeholder={t(
                                        'Paste guardian’s signature'
                                    )}
                                    value={
                                        guardians[res] === undefined
                                            ? ''
                                            : guardians[res][1]
                                    }
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                        setMount(false)
                                        handleReset()
                                        const value = event.target.value
                                        if (guardians[res] === undefined) {
                                            guardians[res] = ['', '']
                                        }
                                        guardians[res][1] = value.toLowerCase()
                                        setGuardians(guardians)
                                        setTimeout(() => {
                                            setMount(true)
                                        }, 1)
                                    }}
                                />
                                <div
                                    onClick={() => pasteFromClipboard(res)}
                                    className="button"
                                >
                                    PASTE
                                </div>
                            </section>
                        )
                    })}
                    {mount && <div />}
                    {
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                className={
                                    loadingInput
                                        ? ''
                                        : legendB.toUpperCase() === 'CONTINUE'
                                        ? 'continueBtn'
                                        : ''
                                }
                                onClick={handleContinue}
                            >
                                {loadingInput ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        {legendB.toUpperCase() ===
                                        'CONTINUE' ? (
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
                    }
                </>
            )}
            {!hideDonation && <Donate />}
            {!hideSubmit && donation !== null && txvalue !== empty_tx_value && (
                <div
                    style={{
                        marginTop: '10%',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        {t('EXECUTE')}&nbsp;
                        <span>{t('DID SOCIAL RECOVERY')}</span>
                    </div>
                    <p className={styles.gascost}>{t('GAS_AROUND')} 1.5 ZIL</p>
                </div>
            )}
        </div>
    )
}

export default Component
