import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import styles from './styles.module.scss'
import { Donate, Selector } from '../../../..'
import { useState } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { $donation, updateDonation } from '../../../../../src/store/donation'
import SwapRequest from '../../../../../src/assets/icons/swap_request.svg'
import SwapConfirm from '../../../../../src/assets/icons/swap_confirm.svg'
import SwapReject from '../../../../../src/assets/icons/swap_reject.svg'
import SwapRevoke from '../../../../../src/assets/icons/swap_revoke.svg'
import ContinueArrow from '../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../src/assets/icons/tick_blue.svg'
import CloseIcoReg from '../../../../../src/assets/icons/ic_cross.svg'
import CloseIcoBlack from '../../../../../src/assets/icons/ic_cross_black.svg'
import { toast } from 'react-toastify'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../../../src/app/reducers'
import { setTxId, setTxStatusLoading } from '../../../../../src/app/actions'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import { $resolvedInfo } from '../../../../../src/store/resolvedInfo'
import smartContract from '../../../../../src/utils/smartContract'
import toastTheme from '../../../../../src/hooks/toastTheme'

function DelegatorSwap() {
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const dispatch = useDispatch()
    const resolvedInfo = useStore($resolvedInfo)
    let contractAddress = resolvedInfo?.addr
    const zilAddr = useSelector((state: RootState) => state.modal.zilAddr)
    const donation = useStore($donation)
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const actionBtn = isLight ? 'actionBtnBlueLight' : 'actionBtnBlue'
    const CloseIco = isLight ? CloseIcoBlack : CloseIcoReg
    const [active, setActive] = useState('')
    const [legend2, setLegend2] = useState('CONTINUE')
    const [address, setAddress] = useState('')
    const [currentD, setCurrentD] = useState('')
    const [newD, setNewD] = useState('')

    const toggleActive = (id: string) => {
        resetState()
        if (id === active) {
            setActive('')
        } else {
            setActive(id)
        }
    }

    const handleInputAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAddress('')
        setLegend2('CONTINUE')
        updateDonation(null)
        setAddress(event.target.value)
    }

    const handleSaveAddress = () => {
        const addr = tyron.Address.default.verification(address)
        if (addr !== '') {
            if (addr === contractAddress) {
                toast.error('The recipient and sender must be different.', {
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
            } else {
                setLegend2('SAVED')
                setAddress(addr)
            }
        } else {
            toast.error('Wrong address.', {
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

    const handleOnKeyPressAddr = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveAddress()
        }
    }

    const resetState = () => {
        updateDonation(null)
        setLegend2('CONTINUE')
        setCurrentD('')
        setNewD('')
    }

    const handleSubmit = async (id: string) => {
        const zilpay = new ZilPayBase()
        let tx = await tyron.Init.default.transaction(net)
        let txID
        let tx_params: any = []

        const tyron_ = await tyron.Donation.default.tyron(donation!)
        const tyron__ = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron_,
        }
        // const tx_username = {
        //     vname: 'username',
        //     type: 'String',
        //     value: username,
        // }
        const stakeId = {
            vname: 'stakeID',
            type: 'String',
            value: 'zilstaking',
        }
        const requestor = {
            vname: 'requestor',
            type: 'ByStr20',
            value: address,
        }

        switch (id) {
            case 'requestDelegatorSwap':
                txID = 'RequestDelegatorSwap'
                let newAddr: { vname: string; type: string; value: any }
                if (currentD === 'zilliqa') {
                    newAddr = {
                        vname: 'new_deleg_addr',
                        type: 'ByStr20',
                        value: contractAddress,
                    }
                    await tyron.SearchBarUtil.default
                        .fetchAddr(net, 'init', 'did')
                        .then(async (init_addr) => {
                            return await getSmartContract(init_addr, 'services')
                        })
                        .then((res) => {
                            contractAddress = res.result.services.zilstaking
                            console.log(contractAddress)
                        })
                } else {
                    newAddr = {
                        vname: 'newDelegAddr',
                        type: 'ByStr20',
                        value: zilAddr.base16,
                    }
                    // tx_params.push(tx_username)
                    tx_params.push(stakeId)
                    tx_params.push(tyron__)
                }
                tx_params.push(newAddr)
                break
            case 'confirmDelegatorSwap':
                txID = 'ConfirmDelegatorSwap'
                // tx_params.push(tx_username)
                tx_params.push(stakeId)
                tx_params.push(requestor)
                tx_params.push(tyron__)
                break
            case 'revokeDelegatorSwap':
                txID = 'RevokeDelegatorSwap'
                // tx_params.push(tx_username)
                tx_params.push(stakeId)
                tx_params.push(tyron__)
                break
            case 'rejectDelegatorSwap':
                txID = 'RejectDelegatorSwap'
                // tx_params.push(tx_username)
                tx_params.push(stakeId)
                tx_params.push(requestor)
                tx_params.push(tyron__)
                break
        }

        dispatch(setTxStatusLoading('true'))
        updateModalTxMinimized(false)
        updateModalTx(true)

        let _amount = '0'
        if (donation !== null) {
            _amount = String(donation)
        }

        await zilpay
            .call({
                contractAddress: contractAddress!,
                transition: txID,
                params: tx_params as unknown as Record<string, unknown>[],
                amount: _amount,
            })
            .then(async (res) => {
                dispatch(setTxId(res.ID))
                dispatch(setTxStatusLoading('submitted'))
                tx = await tx.confirm(res.ID)
                resetState()
                if (tx.isConfirmed()) {
                    dispatch(setTxStatusLoading('confirmed'))
                    setTimeout(() => {
                        window.open(
                            `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                        )
                    }, 1000)
                } else if (tx.isRejected()) {
                    dispatch(setTxStatusLoading('failed'))
                }
            })
            .catch((err) => {
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
                    toastId: 12,
                })
            })
    }

    const optionWallet = [
        {
            key: 'tyron',
            name: 'xWallet',
        },
        {
            key: 'zilliqa',
            name: 'ZilPay',
        },
    ]
    const handleOnChangeCurrentD = (value: any) => {
        updateDonation(null)
        setNewD('')
        setCurrentD(value)
    }

    const handleOnChangeNewD = (value: any) => {
        updateDonation(null)
        if (currentD === value) {
            toast.warn('Unsupported yet. Suggest it on xPoints.', {
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
        } else {
            setNewD(value)
            setLegend2('CONTINUE')
        }
    }

    return (
        <div className={styles.container}>
            {active !== '' && (
                <div
                    className={styles.closeWrapper}
                    onClick={() => toggleActive('')}
                />
            )}
            <div className={styles.cardWrapper}>
                <div className={styles.cardActiveWrapper}>
                    <div
                        onClick={() => toggleActive('requestDelegatorSwap')}
                        className={
                            active === 'requestDelegatorSwap'
                                ? styles.cardActive
                                : styles.card
                        }
                    >
                        <div>REQUEST</div>
                        <div className={styles.icoWrapper}>
                            <Image
                                src={SwapRequest}
                                alt="requestDelegatorSwap-ico"
                            />
                        </div>
                    </div>
                    {active === 'requestDelegatorSwap' && (
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
                            <div style={{ width: '100%' }}>
                                <div>Current Delegator&apos;s wallet</div>
                                <Selector
                                    option={optionWallet}
                                    onChange={handleOnChangeCurrentD}
                                    placeholder="Select wallet"
                                />
                            </div>
                            {currentD !== '' && (
                                <div
                                    style={{ width: '100%', marginTop: '20px' }}
                                >
                                    <div>New Delegator&apos;s wallet</div>
                                    <Selector
                                        option={optionWallet}
                                        onChange={handleOnChangeNewD}
                                        placeholder="Select wallet"
                                    />
                                </div>
                            )}
                            {currentD !== '' && newD !== '' ? (
                                <>
                                    {currentD !== 'zilliqa' && <Donate />}
                                    {(donation !== null ||
                                        currentD === 'zilliqa') && (
                                        <>
                                            <div
                                                onClick={() =>
                                                    handleSubmit(
                                                        'requestDelegatorSwap'
                                                    )
                                                }
                                                style={{
                                                    width: '100%',
                                                    marginTop: '24px',
                                                }}
                                                className={actionBtn}
                                            >
                                                <div>
                                                    REQUEST DELEGATOR SWAP
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                    )}
                </div>
                <div className={styles.cardActiveWrapper}>
                    <div
                        onClick={() => toggleActive('confirmDelegatorSwap')}
                        className={
                            active === 'confirmDelegatorSwap'
                                ? styles.cardActive
                                : styles.card
                        }
                    >
                        <div>CONFIRM</div>
                        <div className={styles.icoWrapper}>
                            <Image
                                src={SwapConfirm}
                                alt="confirmDelegatorSwap-ico"
                            />
                        </div>
                    </div>
                    {active === 'confirmDelegatorSwap' && (
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
                                    width: '100%',
                                    justifyContent: 'space-between',
                                }}
                                className={styles.formAmount}
                            >
                                <input
                                    style={{ width: '70%' }}
                                    type="text"
                                    placeholder={t('Type address')}
                                    onChange={handleInputAddress}
                                    onKeyPress={handleOnKeyPressAddr}
                                />
                                <div
                                    onClick={handleSaveAddress}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        className={
                                            legend2 === 'CONTINUE'
                                                ? 'continueBtnBlue'
                                                : ''
                                        }
                                    >
                                        {legend2 === 'CONTINUE' ? (
                                            <Image
                                                src={ContinueArrow}
                                                alt="arrow"
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    marginTop: '5px',
                                                }}
                                            >
                                                <Image
                                                    width={40}
                                                    src={TickIco}
                                                    alt="tick"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {legend2 === 'SAVED' && <Donate />}
                            {donation !== null && (
                                <>
                                    <div
                                        onClick={() =>
                                            handleSubmit('confirmDelegatorSwap')
                                        }
                                        style={{
                                            marginTop: '24px',
                                            width: '100%',
                                        }}
                                        className={actionBtn}
                                    >
                                        <div className={styles.txtBtn}>
                                            CONFIRM DELEGATOR SWAP
                                        </div>
                                    </div>
                                    <div className={styles.gasTxt}>
                                        {t('GAS_AROUND')} 1-2 ZIL
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className={styles.cardActiveWrapper}>
                    <div
                        onClick={() => toggleActive('revokeDelegatorSwap')}
                        className={
                            active === 'revokeDelegatorSwap'
                                ? styles.cardActive
                                : styles.card
                        }
                    >
                        <div>REVOKE</div>
                        <div className={styles.icoWrapper}>
                            <Image
                                src={SwapRevoke}
                                alt="revokeDelegatorSwap-ico"
                            />
                        </div>
                    </div>
                    {active === 'revokeDelegatorSwap' && (
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
                                    marginTop: '-12%',
                                    marginBottom: '-12%',
                                }}
                            >
                                <Donate />
                            </div>
                            {donation !== null && (
                                <>
                                    <div
                                        onClick={() =>
                                            handleSubmit('revokeDelegatorSwap')
                                        }
                                        style={{
                                            marginTop: '24px',
                                            width: '100%',
                                        }}
                                        className={actionBtn}
                                    >
                                        <div className={styles.txtBtn}>
                                            REVOKE DELEGATOR SWAP
                                        </div>
                                    </div>
                                    <div className={styles.gasTxt}>
                                        {t('GAS_AROUND')} 1-2 ZIL
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className={styles.cardActiveWrapper}>
                    <div
                        onClick={() => toggleActive('rejectDelegatorSwap')}
                        className={
                            active === 'rejectDelegatorSwap'
                                ? styles.cardActive
                                : styles.card
                        }
                    >
                        <div>REJECT</div>
                        <div className={styles.icoWrapper}>
                            <Image
                                src={SwapReject}
                                alt="rejectDelegatorSwap-ico"
                            />
                        </div>
                    </div>
                    {active === 'rejectDelegatorSwap' && (
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
                                    width: '100%',
                                    justifyContent: 'space-between',
                                }}
                                className={styles.formAmount}
                            >
                                <input
                                    style={{ width: '70%' }}
                                    type="text"
                                    placeholder={t('Type address')}
                                    onChange={handleInputAddress}
                                    onKeyPress={handleOnKeyPressAddr}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        onClick={handleSaveAddress}
                                        className={
                                            legend2 === 'CONTINUE'
                                                ? 'continueBtnBlue'
                                                : ''
                                        }
                                    >
                                        {legend2 === 'CONTINUE' ? (
                                            <Image
                                                src={ContinueArrow}
                                                alt="arrow"
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    marginTop: '5px',
                                                }}
                                            >
                                                <Image
                                                    width={40}
                                                    src={TickIco}
                                                    alt="tick"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {legend2 === 'SAVED' && <Donate />}
                            {donation !== null && (
                                <>
                                    <div
                                        onClick={() =>
                                            handleSubmit('rejectDelegatorSwap')
                                        }
                                        style={{
                                            marginTop: '24px',
                                            width: '100%',
                                        }}
                                        className={actionBtn}
                                    >
                                        <div className={styles.txtBtn}>
                                            REJECT DELEGATOR SWAP
                                        </div>
                                    </div>
                                    <div className={styles.gasTxt}>
                                        {t('GAS_AROUND')} 1-2 ZIL
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DelegatorSwap
