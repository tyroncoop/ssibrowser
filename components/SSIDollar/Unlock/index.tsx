import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import * as tyron from 'tyron'
import { RootState } from '../../../src/app/reducers'
import { ZilPayBase } from '../../../components/ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'
import { Spinner } from '../..'
import Image from 'next/image'
import ContinueArrow from '../../../src/assets/icons/continue_arrow.svg'

function UnlockSSIDollar({ loan, balance, balance$SI, loading, setLoading }) {
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('')
    const $SIproxy = '0xc23cA8BE034b27B0d5d80CB08CE0EF10e336865d' // @todo

    const handleOnChange = (event: { target: { value: any; name: any } }) => {
        setAmount(event.target.value)
    }

    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSubmitBurn()
        }
    }

    const handleSubmitBurn = async () => {
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
        } else if (Number(amount) < loan.$si) {
            toast.error('You must return the total loan amount', {
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
                value: 'zil', //currency.toLowerCase(),
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
                    break
                default:
                    try {
                        await zilpay
                            .call({
                                contractAddress: $SIproxy,
                                transition: 'Burn',
                                params: tx_params as unknown as Record<
                                    string,
                                    unknown
                                >[],
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
                    break
            }
        }
    }

    const resetState = () => {
        setCurrency('')
        setLoading(false)
        setAmount('')
    }

    return (
        <div className={styles.contentWrapper}>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <div style={{ marginTop: '20%' }}>
                        $SI Balance: {balance$SI} $SI
                    </div>
                    <div style={{ marginTop: '5%' }}>
                        ZIL Balance: {balance} ZIL
                    </div>
                    <div style={{ marginTop: '5%' }}>
                        $SI Loan: {loan.$si} $SI
                    </div>
                    <div style={{ marginTop: '5%' }}>
                        ZIL Locked: {loan.zil} ZIL
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            marginTop: '10%',
                        }}
                    >
                        <input
                            name="amountUnlock"
                            type="text"
                            className={styles.inputBox}
                            onChange={handleOnChange}
                            onKeyPress={handleOnKeyPress}
                            placeholder="Type the amount of $SI to return"
                        />
                        <div className={styles.arrowWrapper}>
                            <div
                                className="continueBtnBlue"
                                onClick={handleSubmitBurn}
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
                </>
            )}
        </div>
    )
}

export default UnlockSSIDollar
