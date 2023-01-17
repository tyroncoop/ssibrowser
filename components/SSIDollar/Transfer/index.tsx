import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import * as tyron from 'tyron'
import { RootState } from '../../../src/app/reducers'
import { ZilPayBase } from '../../../components/ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'
import { Spinner } from '../..'
import Image from 'next/image'
import ContinueArrow from '../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../src/assets/icons/tick_blue.svg'

function TransferSSIDollar({ setBalance, balance$SI, loading, setLoading }) {
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const [amount, setAmount] = useState('')
    const [address, setAdress] = useState('')
    const [savedAddress, setSavedAddress] = useState(false)
    const [savedAmount, setSavedAmount] = useState(false)
    const $SIproxy = '0xc23cA8BE034b27B0d5d80CB08CE0EF10e336865d' // @todo

    const handleOnChange = (event: { target: { value: any; name: any } }) => {
        if (event.target.name === 'amount') {
            setSavedAmount(false)
            setAmount(event.target.value)
        } else {
            setSavedAddress(false)
            setSavedAmount(false)
            setAdress('')
            setAmount('')
            setAdress(event.target.value)
        }
    }

    const handleSaveAddr = () => {
        const addr = tyron.Address.default.verification(address)
        if (addr !== '') {
            setSavedAddress(true)
            setAdress(addr)
        } else {
            toast.error('Wrong address.', {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
                toastId: 5,
            })
        }
    }

    const handleSaveAmount = () => {
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
            setSavedAmount(true)
        }
    }

    const handleOnKeyPressAddr = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveAddr()
        }
    }

    const handleOnKeyPressAmount = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveAmount()
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        const zilpay = new ZilPayBase()
        const tx_params = await tyron.TyronZil.default.AddFunds(
            address,
            String(Number(amount) * 1e12)
        )
        let tx = await tyron.Init.default.transaction(net)

        dispatch(setTxStatusLoading('true'))
        resetState()
        updateModalTxMinimized(false)
        updateModalTx(true)
        try {
            await zilpay
                .call({
                    contractAddress: $SIproxy,
                    transition: 'Transfer',
                    params: tx_params as unknown as Record<string, unknown>[],
                    amount: '0',
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
    }

    const resetState = () => {
        setBalance(0)
        setLoading(false)
        setAmount('')
        setAdress('')
    }

    return (
        <div className={styles.contentWrapper}>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <div style={{ marginTop: '20%' }}>
                        Balance: {balance$SI} $SI
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            marginTop: '10%',
                            width: '100%',
                        }}
                    >
                        <input
                            name="address"
                            type="text"
                            className={styles.inputBox}
                            onChange={handleOnChange}
                            onKeyPress={handleOnKeyPressAddr}
                            placeholder="Type the recipient's address"
                        />
                        <div className={styles.arrowWrapper}>
                            <div
                                className="continueBtnBlue"
                                onClick={handleSaveAddr}
                            >
                                <Image
                                    width={35}
                                    height={35}
                                    src={savedAddress ? TickIco : ContinueArrow}
                                    alt="arrow"
                                />
                            </div>
                        </div>
                    </div>
                    {savedAddress && (
                        <div
                            style={{
                                display: 'flex',
                                marginTop: '10%',
                            }}
                        >
                            <input
                                name="amount"
                                type="text"
                                className={styles.inputBox}
                                onChange={handleOnChange}
                                onKeyPress={handleOnKeyPressAmount}
                                placeholder="Type the amount of $SI"
                            />
                            <div className={styles.arrowWrapper}>
                                <div
                                    className="continueBtnBlue"
                                    onClick={handleSaveAmount}
                                >
                                    <Image
                                        width={35}
                                        height={35}
                                        src={
                                            savedAmount
                                                ? TickIco
                                                : ContinueArrow
                                        }
                                        alt="arrow"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {savedAmount && (
                        <div
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                display: 'flex',
                                marginTop: '20%',
                            }}
                        >
                            <div
                                onClick={handleSubmit}
                                className="actionBtnBlue"
                            >
                                <span>TRANSFER {amount} $SI</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default TransferSSIDollar
