import styles from './styles.module.scss'
import { useTranslation } from 'next-i18next'
import * as tyron from 'tyron'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../src/app/reducers'
import { useStore } from 'effector-react'
import { $donation, updateDonation } from '../../../src/store/donation'
import Donate from '../../Donate'
import toastTheme from '../../../src/hooks/toastTheme'
import { toast } from 'react-toastify'
import { $resolvedInfo } from '../../../src/store/resolvedInfo'
import { ZilPayBase } from '../../ZilPay/zilpay-base'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'

function Component({ pause, xwallet }) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const net = useSelector((state: RootState) => state.modal.net)
    const donation = useStore($donation)
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const v09 =
        parseFloat(resolvedInfo?.version?.slice(-5)!) >= 0.9 ||
        resolvedInfo?.version?.slice(10)! == 'ZILxWALLET'

    const handleSubmit = async () => {
        const txID = pause ? 'Pause' : 'Unpause'
        try {
            const zilpay = new ZilPayBase()

            dispatch(setTxStatusLoading('true'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            let tx = await tyron.Init.default.transaction(net)

            const params: any = []

            const tyron__ = await tyron.Donation.default.tyron(donation!)
            const tyron_ = {
                vname: 'tyron',
                type: 'Option Uint128',
                value: tyron__,
            }
            params.push(tyron_)

            if (!v09 && xwallet === 'zil') {
                const username_ = {
                    vname: 'username',
                    type: 'String',
                    value: username,
                }
                params.push(username_)
            }

            await zilpay
                .call({
                    contractAddress: resolvedInfo?.addr!,
                    transition: txID,
                    params: params as unknown as Record<string, unknown>[],
                    amount: String(donation),
                })
                .then(async (res) => {
                    updateDonation(null)
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
                        }
                    } catch (err) {
                        dispatch(setTxStatusLoading('rejected'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        toast.error(t(String(err)), {
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
    }

    const btnClass = () => {
        if (xwallet === 'zil') {
            if (isLight) {
                return 'actionBtnBlueLight'
            } else {
                return 'actionBtnBlue'
            }
        } else {
            if (isLight) {
                return 'actionBtnLight'
            } else {
                return 'actionBtn'
            }
        }
    }

    return (
        <div className={styles.container}>
            <Donate />
            {donation !== null && (
                <div className={styles.btnWrapper}>
                    <div
                        style={{ width: '100%' }}
                        className={btnClass()}
                        onClick={handleSubmit}
                    >
                        <div
                            className={
                                username!.length > 10
                                    ? styles.txtBtn2
                                    : styles.txtBtn
                            }
                        >
                            <div>
                                {pause ? 'Pause' : 'Unpause'}&nbsp;
                                <span style={{ textTransform: 'none' }}>
                                    {domain}
                                </span>
                                @
                            </div>
                            <div>{username}.did</div>
                        </div>
                    </div>
                    <p className={styles.gascost}>Gas: around 1.3 ZIL</p>
                </div>
            )}
        </div>
    )
}

export default Component
