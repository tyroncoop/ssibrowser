import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { ZilPayBase } from '../ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { Donate, Selector } from '..'
import { $donation, updateDonation } from '../../src/store/donation'
import { $doc } from '../../src/store/did-doc'
import { updateModalTx, updateModalTxMinimized } from '../../src/store/modal'
import { decryptKey } from '../../src/lib/dkms'
import { setTxStatusLoading, setTxId } from '../../src/app/actions'
import { RootState } from '../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import { $resolvedInfo } from '../../src/store/resolvedInfo'
import { $arconnect } from '../../src/store/arconnect'
import toastTheme from '../../src/hooks/toastTheme'

function Component() {
    const zcrypto = tyron.Util.default.Zcrypto()
    const zutil = tyron.Util.default.Zutil()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const arConnect = useStore($arconnect)
    const resolvedInfo = useStore($resolvedInfo)
    const dkms = useStore($doc)?.dkms
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const donation = useStore($donation)

    const [currency, setCurrency] = useState('')
    const [input, setInput] = useState(0) //the amount to add into the pool
    const [legend, setLegend] = useState('continue')
    const [button, setButton] = useState('button primary')
    const [hideDonation, setHideDonation] = useState(true)
    const [hideSubmit, setHideSubmit] = useState(true)

    const handleOnChange = (value) => {
        setCurrency(value)
    }

    const handleInput = (event: { target: { value: any } }) => {
        setInput(0)
        setHideSubmit(true)
        setLegend('continue')
        setButton('button primary')
        let input = event.target.value
        const re = /,/gi
        input = input.replace(re, '.')
        input = Number(input)
        if (!isNaN(input)) {
            setInput(input)
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
        if (input !== 0) {
            setLegend('saved')
            setButton('button')
            setHideDonation(false)
            setHideSubmit(false)
        }
    }

    const handleSubmit = async () => {
        if (arConnect !== null && resolvedInfo !== null && donation !== null) {
            if (dkms.get('dex')) {
                const encrypted_key = dkms.get('dex')
                const did_private_key = await decryptKey(
                    arConnect,
                    encrypted_key
                )
                const did_public_key =
                    zcrypto.getPubKeyFromPrivateKey(did_private_key)

                const elements = Array()
                const txID = 'AddLiquidity'
                elements.push(txID)

                const zilpay = new ZilPayBase()
                const txnumber = (await zilpay.getState(resolvedInfo?.addr!))
                    .tx_number
                const txnumber_bn = new zutil.BN(txnumber)
                const uint_txnumber = Uint8Array.from(
                    txnumber_bn.toArrayLike(Buffer, undefined, 16)
                )
                elements.push(uint_txnumber)

                const currency_ = currency.toLowerCase()
                elements.push(currency_)
                elements.push(currency_)

                const amount = input * 1e12
                const amount_bn = new zutil.BN(amount)
                const uint_amt = Uint8Array.from(
                    amount_bn.toArrayLike(Buffer, undefined, 16)
                )

                elements.push(uint_amt)
                elements.push(uint_amt)
                elements.push(uint_amt)

                const donation_ = donation * 1e12
                const donation_bn = new zutil.BN(txnumber)
                const uint_donation = Uint8Array.from(
                    donation_bn.toArrayLike(Buffer, undefined, 16)
                )

                elements.push(uint_donation)

                const hash = (await tyron.Util.default.HashDexOrder(
                    elements
                )) as string

                const signature = zcrypto.sign(
                    Buffer.from(hash, 'hex'),
                    did_private_key,
                    did_public_key
                )

                let tyron_
                switch (donation) {
                    case 0:
                        tyron_ = await tyron.TyronZil.default.OptionParam(
                            tyron.TyronZil.Option.none,
                            'Uint128'
                        )
                        break
                    default:
                        tyron_ = await tyron.TyronZil.default.OptionParam(
                            tyron.TyronZil.Option.some,
                            'Uint128',
                            donation_
                        )
                        break
                }
                const tx_params = await tyron.Defi.default.AddLiquidity(
                    await tyron.TyronZil.default.OptionParam(
                        tyron.TyronZil.Option.some,
                        'ByStr64',
                        '0x' + signature
                    ),
                    currency_,
                    String(amount),
                    tyron_
                )

                toast.info(
                    `You're about to submit a transaction to add liquidity on ${currency}. You're also donating ${donation} ZIL to donate.did, which gives you ${donation} xPoints!`,
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

                const _amount = String(donation)

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)
                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
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
                            toast.error(t(String(err)), {
                                position: 'top-right',
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: toastTheme(isLight),
                            })
                        }
                    })
            } else {
                toast.error('Could not fetch dex.', {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
            }
        }
    }

    const option = [
        {
            key: 'TYRON',
            name: 'TYRON',
        },
        {
            key: 'zWBTC',
            name: 'zWBTC',
        },
        {
            key: 'zETH',
            name: 'zETH',
        },
        {
            key: 'zUSDT',
            name: 'zUSDT',
        },
    ]

    return (
        <>
            <div className={styles.container2}>
                <div style={{ width: '30%' }}>
                    <Selector
                        option={option}
                        onChange={handleOnChange}
                        placeholder={t('Select coin')}
                    />
                </div>
                {currency !== '' && (
                    <>
                        <code>{currency}</code>
                        <input
                            style={{ width: '30%' }}
                            type="text"
                            placeholder="Type amount"
                            onChange={handleInput}
                            onKeyPress={handleOnKeyPress}
                        />
                        <input
                            style={{ marginLeft: '2%' }}
                            type="button"
                            className={button}
                            value={legend}
                            onClick={() => {
                                handleSave()
                            }}
                        />
                    </>
                )}
            </div>
            {!hideDonation && <Donate />}
            {!hideSubmit && donation !== null && (
                <div style={{ marginTop: '6%' }}>
                    <button className={styles.button} onClick={handleSubmit}>
                        <span className={styles.x}>add liquidity</span>
                    </button>
                </div>
            )}
        </>
    )
}

export default Component
