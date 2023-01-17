import { useStore } from 'effector-react'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import * as tyron from 'tyron'
import { setTxId, setTxStatusLoading } from '../../../../../src/app/actions'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import { $donation, updateDonation } from '../../../../../src/store/donation'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { Donate, Selector } from '../../../..'
import controller from '../../../../../src/hooks/isController'
import { RootState } from '../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import { $resolvedInfo } from '../../../../../src/store/resolvedInfo'
import toastTheme from '../../../../../src/hooks/toastTheme'

function Component() {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const resolvedInfo = useStore($resolvedInfo)
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const donation = useStore($donation)
    const { isController } = controller()

    const [menu, setMenu] = useState('')
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [spender, setSpender] = useState('')
    const [currency, setCurrency] = useState('')
    const [legend, setLegend] = useState('save')
    const [button, setButton] = useState('button primary')
    const [legend2, setLegend2] = useState('save')
    const [button2, setButton2] = useState('button primary')
    const [legend3, setLegend3] = useState('save')
    const [button3, setButton3] = useState('button primary')

    useEffect(() => {
        isController()
    })

    const handleInput = (event: { target: { value: any; name: any } }) => {
        let input = event.target.value

        if (event.target.name === 'name') {
            setLegend('save')
            setButton('button primary')
            setName(input)
        } else if (event.target.name === 'amount') {
            setLegend2('save')
            setButton2('button primary')
            setAmount(input)
        } else {
            setSpender('')
            setLegend3('save')
            setButton3('button primary')
            let value = tyron.Address.default.verification(event.target.value)
            if (value !== '') {
                setSpender(value)
                setLegend3('saved')
                setButton3('button')
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
    }

    const handleSave = (id) => {
        if (id === 'name') {
            setLegend('saved')
            setButton('button')
        } else if (id === 'amount') {
            setLegend2('saved')
            setButton2('button')
        }
    }

    const handleSubmit = async () => {
        if (resolvedInfo !== null) {
            try {
                const zilpay = new ZilPayBase()
                let txId: string
                txId =
                    menu === 'increase'
                        ? 'IncreaseAllowance'
                        : 'DecreaseAllowance'

                const _currency = tyron.Currency.default.tyron(
                    currency.toLowerCase()
                )

                const tyron_ = await tyron.Donation.default.tyron(donation!)

                const params = await tyron.TyronZil.default.Allowances(
                    name,
                    spender,
                    String(Number(amount) * _currency.decimals),
                    tyron_
                )

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)
                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
                        transition: txId,
                        params: params as unknown as Record<string, unknown>[],
                        amount: String(0),
                    })
                    .then(async (res) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        try {
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                dispatch(setTxStatusLoading('confirmed'))
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
            } catch (error) {
                updateModalTx(false)
                dispatch(setTxStatusLoading('idle'))
                toast.error(t(String(error)), {
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
        } else {
            toast.error('some data is missing.', {
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
        updateDonation(null)
    }

    const handleOnChange = (value) => {
        setCurrency(value)
    }

    const resetState = () => {
        setMenu('')
        setName('')
        setAmount('')
        setSpender('')
        setCurrency('')
        setLegend('save')
        setButton('button primary')
        setLegend2('save')
        setButton2('button primary')
        setLegend3('save')
        setButton3('button primary')
        updateDonation(null)
    }

    const listCoin = tyron.Options.default.listCoin()
    const option = [...listCoin]

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                alignItems: 'center',
            }}
        >
            {menu === '' && (
                <>
                    <h2>
                        <div
                            onClick={() => setMenu('increase')}
                            className={styles.flipCard}
                        >
                            <div className={styles.flipCardInner}>
                                <div className={styles.flipCardFront}>
                                    <p className={styles.cardTitle3}>
                                        INCREASE
                                    </p>
                                </div>
                                <div className={styles.flipCardBack}>
                                    <p className={styles.cardTitle2}>
                                        Add spender allowance
                                    </p>
                                </div>
                            </div>
                        </div>
                    </h2>
                    <h2>
                        <div
                            onClick={() => setMenu('decrease')}
                            className={styles.flipCard}
                        >
                            <div className={styles.flipCardInner}>
                                <div className={styles.flipCardFront}>
                                    <p className={styles.cardTitle3}>
                                        DECREASE
                                    </p>
                                </div>
                                <div className={styles.flipCardBack}>
                                    <p className={styles.cardTitle2}>
                                        remove spender allowance
                                    </p>
                                </div>
                            </div>
                        </div>
                    </h2>
                </>
            )}
            {menu !== '' && (
                <>
                    <button
                        onClick={resetState}
                        style={{ marginBottom: '20%' }}
                        className="button"
                    >
                        <p>Back</p>
                    </button>
                    <div className={styles.inputWrapper}>
                        <div>
                            <code>Name</code>
                        </div>
                        <input
                            name="name"
                            style={{
                                width: '100%',
                                marginLeft: '2%',
                                marginRight: '2%',
                            }}
                            type="text"
                            onChange={handleInput}
                            onKeyPress={() => {
                                setLegend('saved')
                                setButton('button')
                            }}
                        />
                        <input
                            type="button"
                            className={button}
                            value={legend}
                            onClick={() => {
                                handleSave('name')
                            }}
                        />
                    </div>
                    {legend === 'saved' && (
                        <>
                            <div className={styles.inputWrapper}>
                                <div>
                                    <code>Spender</code>
                                </div>
                                <input
                                    name="spender"
                                    style={{
                                        width: '100%',
                                        marginLeft: '2%',
                                        marginRight: '2%',
                                    }}
                                    type="text"
                                    onChange={handleInput}
                                    onKeyPress={() => {
                                        setLegend3('saved')
                                        setButton3('button')
                                    }}
                                />
                                <input
                                    type="button"
                                    className={button3}
                                    value={legend3}
                                />
                            </div>
                            {legend3 === 'saved' && (
                                <>
                                    <div
                                        style={{
                                            width: '70%',
                                            marginTop: '5%',
                                        }}
                                    >
                                        <Selector
                                            option={option}
                                            onChange={handleOnChange}
                                            placeholder={t('Select coin')}
                                        />
                                    </div>
                                    {currency !== '' && (
                                        <>
                                            <div
                                                className={styles.inputWrapper}
                                            >
                                                <div>
                                                    <code>Amount</code>
                                                </div>
                                                <input
                                                    name="amount"
                                                    style={{
                                                        width: '100%',
                                                        marginLeft: '2%',
                                                        marginRight: '2%',
                                                    }}
                                                    type="text"
                                                    onChange={handleInput}
                                                    onKeyPress={() => {
                                                        setLegend2('saved')
                                                        setButton2('button')
                                                    }}
                                                />
                                                <input
                                                    type="button"
                                                    className={button2}
                                                    value={legend2}
                                                    onClick={() => {
                                                        handleSave('amount')
                                                    }}
                                                />
                                            </div>
                                            {legend2 === 'saved' && (
                                                <>
                                                    <Donate />
                                                    {donation !== null && (
                                                        <div
                                                            onClick={
                                                                handleSubmit
                                                            }
                                                            style={{
                                                                marginTop:
                                                                    '10%',
                                                            }}
                                                            className={
                                                                isLight
                                                                    ? 'actionBtnLight'
                                                                    : 'actionBtn'
                                                            }
                                                        >
                                                            <div>
                                                                {menu ===
                                                                    'increase'
                                                                    ? 'Increase'
                                                                    : 'Decrease'}{' '}
                                                                Allowance
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default Component
