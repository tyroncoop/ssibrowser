import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import * as tyron from 'tyron'
import Image from 'next/image'
import { RootState } from '../../../src/app/reducers'
import { ZilPayBase } from '../../../components/ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'
import Spinner from '../../Spinner'
import ContinueArrow from '../../../src/assets/icons/continue_arrow.svg'

function GetSSIDollar({
    fetchBalance,
    balance,
    setBalance,
    balance$SI,
    loading,
    setLoading,
}) {
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const [currency, setCurrency] = useState('')
    const [amount, setAmount] = useState('')
    const $SIproxy = '0xc23cA8BE034b27B0d5d80CB08CE0EF10e336865d' // @todo
    const $SIimpl = '0xf930df14b7ce8c133c40f53f5db39cae4a27fac7' // @todo

    const handleOnChangeCurrency = (event: { target: { value: any } }) => {
        const value = event.target.value
        setCurrency(value)
        fetchBalance(value.toLowerCase())
        fetchBalance('$si')
    }

    const handleOnChange = (event: { target: { value: any; name: any } }) => {
        setAmount(event.target.value)
    }

    const handleSubmitMint = async () => {
        if (isNaN(Number(amount))) {
            toast.error('Please input a valid number', {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
                toastId: 1,
            })
        } else {
            setLoading(true)
            const zilpay = new ZilPayBase()
            const tx_params: any[] = []
            const addrName = {
                vname: 'addrName',
                type: 'String',
                value: currency.toLowerCase(),
            }
            tx_params.push(addrName)
            const amount_ = {
                vname: 'amount',
                type: 'Uint128',
                value: String(Number(amount) * 1e12),
            }
            tx_params.push(amount_)

            let tx = await tyron.Init.default.transaction(net)

            dispatch(setTxStatusLoading('true'))
            resetState()
            updateModalTxMinimized(false)
            updateModalTx(true)

            switch (currency) {
                case 'zUSDT':
                    const tx_params_: any[] = []
                    const spender = {
                        vname: 'spender',
                        type: 'ByStr20',
                        value: $SIimpl,
                    }
                    tx_params_.push(spender)
                    tx_params_.push(amount_)
                    try {
                        await zilpay
                            .call({
                                contractAddress:
                                    '0x53934bdad86b8ba4df24cc6c5fe3ff35a6bd5fee', // zUSDT proxy
                                transition: 'IncreaseAllowance',
                                params: tx_params_ as unknown as Record<
                                    string,
                                    unknown
                                >[],
                                amount: '0',
                            })
                            .then(async () => {
                                setTimeout(async () => {
                                    await zilpay
                                        .call({
                                            contractAddress: $SIproxy,
                                            transition: 'Mint',
                                            params: tx_params as unknown as Record<
                                                string,
                                                unknown
                                            >[],
                                            amount: '0',
                                        })
                                        .then(async (res) => {
                                            dispatch(setTxId(res.ID))
                                            dispatch(
                                                setTxStatusLoading('submitted')
                                            )
                                            tx = await tx.confirm(res.ID)
                                            if (tx.isConfirmed()) {
                                                setLoading(false)
                                                dispatch(
                                                    setTxStatusLoading(
                                                        'confirmed'
                                                    )
                                                )
                                                setTimeout(() => {
                                                    window.open(
                                                        `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                                    )
                                                }, 1000)
                                            }
                                        })
                                        .catch((err) => {
                                            throw err
                                        })
                                }, 6000)
                            })
                            .catch((err) => {
                                throw err
                            })
                    } catch (error) {
                        setLoading(false)
                        dispatch(setTxStatusLoading('rejected'))
                        toast.error(String(error), {
                            position: 'top-right',
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'dark',
                            toastId: 12,
                        })
                    }
                    break

                default:
                    try {
                        await zilpay
                            .call({
                                contractAddress: $SIproxy,
                                transition: 'Mint',
                                params: tx_params as unknown as Record<
                                    string,
                                    unknown
                                >[],
                                amount: amount,
                            })
                            .then(async (res) => {
                                dispatch(setTxId(res.ID))
                                dispatch(setTxStatusLoading('submitted'))
                                tx = await tx.confirm(res.ID)
                                if (tx.isConfirmed()) {
                                    setLoading(false)
                                    dispatch(setTxStatusLoading('confirmed'))
                                    setTimeout(() => {
                                        window.open(
                                            `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                        )
                                    }, 1000)
                                }
                            })
                            .catch((err) => {
                                throw err
                            })
                    } catch (error) {
                        setLoading(false)
                        dispatch(setTxStatusLoading('rejected'))
                        toast.error(String(error), {
                            position: 'top-right',
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'dark',
                            toastId: 12,
                        })
                    }
                    break
            }
        }
    }

    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSubmitMint()
        }
    }

    const resetState = () => {
        setCurrency('')
        setBalance(0)
        setLoading(false)
        setAmount('')
    }

    return (
        <div className={styles.contentWrapper}>
            {loading ? (
                <Spinner />
            ) : (
                <div>
                    <select value={currency} onChange={handleOnChangeCurrency}>
                        <option value="">Select Currency</option>
                        <option value="ZIL">ZIL</option>
                        <option value="zUSDT">zUSDT</option>
                    </select>
                    <div
                        style={{
                            marginTop: '20px',
                            marginLeft: '15px',
                        }}
                    >
                        $SI Balance: {balance$SI} $SI
                    </div>
                    {currency !== '' && (
                        <div
                            style={{
                                marginTop: '5px',
                                marginLeft: '15px',
                            }}
                        >
                            {currency} Balance: {balance} {currency}
                        </div>
                    )}
                    {currency !== '' && (
                        <div
                            style={{
                                display: 'flex',
                                marginTop: '20%',
                            }}
                        >
                            <input
                                name="amount"
                                type="text"
                                className={styles.inputBox}
                                onChange={handleOnChange}
                                onKeyPress={handleOnKeyPress}
                                placeholder={`Type amount of ${currency}`}
                            />
                            <div className={styles.arrowWrapper}>
                                <div
                                    className="continueBtnBlue"
                                    onClick={handleSubmitMint}
                                >
                                    <Image
                                        width={35}
                                        height={35}
                                        src={ContinueArrow}
                                        alt="arrow"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default GetSSIDollar
