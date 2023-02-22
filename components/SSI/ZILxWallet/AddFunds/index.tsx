import { useStore } from 'effector-react'
import { useTranslation } from 'next-i18next'
import { useDispatch, useSelector } from 'react-redux'
import * as tyron from 'tyron'
import Image from 'next/image'
import {
    ConnectButton,
    Donate,
    OriginatorAddress,
    Spinner,
    WalletInfo,
} from '../../..'
import { RootState } from '../../../../src/app/reducers'
import {
    $originatorAddress,
    updateOriginatorAddress,
} from '../../../../src/store/originatorAddress'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { $donation, updateDonation } from '../../../../src/store/donation'
import { ZilPayBase } from '../../../ZilPay/zilpay-base'
import { setTxId, setTxStatusLoading } from '../../../../src/app/actions'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../src/store/modal'
import ContinueArrow from '../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../src/assets/icons/tick_blue.svg'
import { $resolvedInfo } from '../../../../src/store/resolvedInfo'
import React from 'react'
import toastTheme from '../../../../src/hooks/toastTheme'
import wallet from '../../../../src/hooks/wallet'

function StakeAddFunds() {
    const { t } = useTranslation()
    const { checkBalance } = wallet()
    const dispatch = useDispatch()
    const originator = useStore($originatorAddress)
    const donation = useStore($donation)
    const net = useSelector((state: RootState) => state.modal.net)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain

    const [legend, setLegend] = useState('CONTINUE')
    const [input, setInput] = useState(0)
    const [hideDonation, setHideDonation] = useState(true)
    const [loadingInfoBal, setLoadingInfoBal] = useState(false)

    const recipient = resolvedInfo?.addr!

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(0)
        setHideDonation(true)
        setLegend('CONTINUE')
        let input = event.target.value
        const re = /,/gi
        input = input.replace(re, '.')
        const input_ = Number(input)
        if (!isNaN(input_)) {
            setInput(input_)
        } else {
            toast.error(t('The input is not a number.'), {
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
        updateDonation(null)
        const isEnough = await checkBalance('zil', input, setLoadingInfoBal)
        if (input === 0) {
            toast.error(t('The amount cannot be zero.'), {
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
        } else if (!isEnough) {
            toast.error('Insufficient balance.', {
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
            setLegend('SAVED')
            setHideDonation(false)
        }
    }

    const showSubmitBtn = () => {
        if (originator?.value === 'zilliqa' && legend === 'SAVED') {
            return true
        } else if (
            originator?.value !== 'zilliqa' &&
            donation !== null &&
            legend === 'SAVED'
        ) {
            return true
        } else {
            return false
        }
    }

    useEffect(() => {
        setLegend('CONTINUE')
        setHideDonation(true)
    }, [originator?.value])

    const handleSubmit = async () => {
        try {
            if (originator?.value !== null) {
                const zilpay = new ZilPayBase()
                const currency = 'zil'
                const _currency = tyron.Currency.default.tyron(currency, input)
                const txID = _currency.txID
                const amount = _currency.amount

                let tx = await tyron.Init.default.transaction(net)

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                switch (originator?.value!) {
                    case 'zilliqa':
                        await zilpay
                            .call({
                                contractAddress: recipient,
                                transition: 'AddFunds',
                                params: [],
                                amount: String(input),
                            })
                            .then(async (res) => {
                                dispatch(setTxId(res.ID))
                                dispatch(setTxStatusLoading('submitted'))
                                tx = await tx.confirm(res.ID)
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
                                throw err
                            })
                    default: {
                        const addr = originator?.value
                        let beneficiary: tyron.TyronZil.Beneficiary
                        if (originator?.domain === 'did') {
                            await tyron.SearchBarUtil.default
                                .Resolve(net, addr!)
                                .then(async (res: any) => {
                                    if (
                                        Number(res?.version.slice(8, 11)) < 5.6
                                    ) {
                                        beneficiary = {
                                            constructor:
                                                tyron.TyronZil
                                                    .BeneficiaryConstructor
                                                    .Recipient,
                                            addr: recipient,
                                        }
                                    } else {
                                        const domainId =
                                            '0x' +
                                            (await tyron.Util.default.HashString(
                                                username!
                                            ))
                                        beneficiary = {
                                            constructor:
                                                tyron.TyronZil
                                                    .BeneficiaryConstructor
                                                    .NftUsername,
                                            username: domainId,
                                            domain: domain,
                                        }
                                    }
                                })
                                .catch((err) => {
                                    throw err
                                })
                        } else {
                            const domainId =
                                '0x' +
                                (await tyron.Util.default.HashString(username!))
                            beneficiary = {
                                constructor:
                                    tyron.TyronZil.BeneficiaryConstructor
                                        .NftUsername,
                                username: domainId,
                                domain: domain,
                            }
                        }

                        if (donation !== null) {
                            const tyron_ = await tyron.Donation.default.tyron(
                                donation
                            )
                            const tx_params =
                                await tyron.TyronZil.default.SendFunds(
                                    addr!,
                                    'AddFunds',
                                    beneficiary!,
                                    String(amount),
                                    tyron_
                                )
                            const _amount = String(donation)

                            toast.info(
                                `${t(
                                    'You’re about to transfer'
                                )} ${input} ${currency}`,
                                {
                                    position: 'top-center',
                                    autoClose: 6000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                }
                            )
                            await zilpay
                                .call({
                                    contractAddress: originator?.value!,
                                    transition: txID,
                                    params: tx_params as unknown as Record<
                                        string,
                                        unknown
                                    >[],
                                    amount: _amount,
                                })
                                .then(async (res) => {
                                    dispatch(setTxId(res.ID))
                                    dispatch(setTxStatusLoading('submitted'))
                                    tx = await tx.confirm(res.ID)
                                    if (tx.isConfirmed()) {
                                        dispatch(
                                            setTxStatusLoading('confirmed')
                                        )
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
                                    throw err
                                })
                        }
                    }
                }
            }
        } catch (error) {
            dispatch(setTxStatusLoading('rejected'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            toast.error(String(error), {
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
        }
        updateOriginatorAddress(null)
        updateDonation(null)
    }

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>{t('ADD FUNDS')}</h4>
            {/* <p className={styles.subTitle}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p> */}

            {loginInfo.zilAddr === null ? (
                <ConnectButton />
            ) : (
                <div className={styles.wrapper}>
                    <div className={styles.originatorWrapper}>
                        <OriginatorAddress />
                    </div>
                    {originator?.value && (
                        <div className={styles.walletInfo}>
                            <WalletInfo currency="ZIL" />
                        </div>
                    )}
                    {originator?.value && (
                        <>
                            <div className={styles.formAmount}>
                                <input
                                    style={{ width: '50%' }}
                                    type="text"
                                    placeholder={t('Type amount')}
                                    onChange={handleInput}
                                    onKeyPress={handleOnKeyPress}
                                    className={styles.input}
                                />
                                <code className={styles.txt}>ZIL</code>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginLeft: '5%',
                                    }}
                                >
                                    <div
                                        className={
                                            loadingInfoBal
                                                ? ''
                                                : legend === 'CONTINUE'
                                                ? 'continueBtnBlue'
                                                : ''
                                        }
                                        onClick={() => {
                                            if (legend === 'CONTINUE') {
                                                handleSave()
                                            }
                                        }}
                                    >
                                        {loadingInfoBal ? (
                                            <Spinner />
                                        ) : legend === 'CONTINUE' ? (
                                            <Image
                                                src={ContinueArrow}
                                                alt="arrow"
                                            />
                                        ) : (
                                            <div style={{ marginTop: '5px' }}>
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
                            {!hideDonation && originator?.value !== 'zilliqa' && (
                                <div className={styles.donateWrapper}>
                                    <Donate />
                                </div>
                            )}
                            {showSubmitBtn() && (
                                <>
                                    <div className={styles.addFundsInfo}>
                                        <div className={styles.txt}>
                                            Send funds into&nbsp;
                                            <span
                                                style={{
                                                    color: isLight
                                                        ? '#000'
                                                        : '#dbe4eb',
                                                }}
                                            >
                                                {username}@{domain}.did
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: '40px',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <div
                                            onClick={handleSubmit}
                                            className={
                                                isLight
                                                    ? 'actionBtnBlueLight'
                                                    : 'actionBtnBlue'
                                            }
                                        >
                                            <div>TRANSFER {input} ZIL</div>
                                        </div>
                                        <p className={styles.gasTxt}>
                                            {t('GAS_AROUND')} 1 ZIL
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default StakeAddFunds
