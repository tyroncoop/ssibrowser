import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { $resolvedInfo } from '../../../src/store/resolvedInfo'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useTranslation } from 'next-i18next'
import { toast } from 'react-toastify'
import { useState } from 'react'
import toastTheme from '../../../src/hooks/toastTheme'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../src/app/reducers'
import smartContract from '../../../src/utils/smartContract'
import { ZilPayBase } from '../../ZilPay/zilpay-base'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'
import ThreeDots from '../../Spinner/ThreeDots'

function Component({ title }) {
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const dispatch = useDispatch()
    const zcrypto = tyron.Util.default.Zcrypto()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const net = useSelector((state: RootState) => state.modal.net)
    const zilAddr = useSelector((state: RootState) => state.modal.zilAddr)
    const resolvedInfo = useStore($resolvedInfo)
    const [isLoading, setIsLoading] = useState(false)
    const isZil = window.location.pathname.includes('/zil')

    const handleSubmit = async () => {
        if (resolvedInfo !== null) {
            //@info aren't we using a global variable for loading?: yes, but this one we need local loading so it won't trigger useeffect
            setIsLoading(true)
            const res: any = await getSmartContract(
                resolvedInfo?.addr!,
                'pending_username'
            )
            setIsLoading(false)
            const pending_username = res?.result?.pending_username
            if (
                pending_username === '' ||
                res?.result?.pending_username === undefined
            ) {
                toast.error('There is no pending NFT Domain Name', {
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
            } else {
                setIsLoading(true)
                const domainId =
                    '0x' +
                    (await tyron.Util.default.HashString(pending_username))
                const addrPendingUsername =
                    await tyron.SearchBarUtil.default.fetchAddr(
                        net,
                        domainId,
                        'did'
                    )
                const result: any = await tyron.SearchBarUtil.default.Resolve(
                    net,
                    addrPendingUsername
                )
                const pending_controller = zcrypto.toChecksumAddress(
                    result.controller
                )

                setIsLoading(false)
                if (pending_controller !== zilAddr?.base16) {
                    toast.error(
                        t('Only X’s DID Controller can access this wallet.', {
                            name: pending_username,
                        }),
                        {
                            position: 'bottom-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                            toastId: 1,
                        }
                    )
                } else {
                    try {
                        const zilpay = new ZilPayBase()
                        const txID = 'AcceptPendingUsername'

                        dispatch(setTxStatusLoading('true'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        let tx = await tyron.Init.default.transaction(net)

                        await zilpay
                            .call({
                                contractAddress: resolvedInfo?.addr!,
                                transition: txID,
                                params: [],
                                amount: String(0),
                            })
                            .then(async (res) => {
                                dispatch(setTxId(res.ID))
                                dispatch(setTxStatusLoading('submitted'))
                                try {
                                    tx = await tx.confirm(res.ID)
                                    if (tx.isConfirmed()) {
                                        dispatch(
                                            setTxStatusLoading('confirmed')
                                        )
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
                toastId: 12,
            })
        }
    }

    const handleSubmitDIDxWallet = async () => {
        if (resolvedInfo !== null) {
            setIsLoading(true)
            const res: any = await getSmartContract(
                resolvedInfo?.addr!,
                'pending_controller'
            )
            setIsLoading(false)
            const pending_controller = res.result.pending_controller
            if (
                pending_controller ===
                '0x0000000000000000000000000000000000000000'
            ) {
                toast.error('There is no pending DID Controller', {
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
            } else {
                console.log('pending controller', pending_controller)
                console.log('zilpay', zilAddr?.base16.toLowerCase())
                if (pending_controller !== zilAddr?.base16.toLowerCase()) {
                    toast.error(
                        // @todo-a Only username's pending DID Controller can claim this wallet.
                        t('Only X’s DID Controller can access this wallet.', {
                            name: resolvedInfo?.name,
                        }),
                        {
                            position: 'bottom-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                            toastId: 1,
                        }
                    )
                } else {
                    try {
                        const zilpay = new ZilPayBase()
                        const txID = 'AcceptPendingController'

                        dispatch(setTxStatusLoading('true'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        let tx = await tyron.Init.default.transaction(net)

                        await zilpay
                            .call({
                                contractAddress: resolvedInfo?.addr!,
                                transition: txID,
                                params: [],
                                amount: String(0),
                            })
                            .then(async (res) => {
                                dispatch(setTxId(res.ID))
                                dispatch(setTxStatusLoading('submitted'))
                                try {
                                    tx = await tx.confirm(res.ID)
                                    if (tx.isConfirmed()) {
                                        dispatch(
                                            setTxStatusLoading('confirmed')
                                        )
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
            }
        } else {
            toast.error('Some data is missing.', {
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

    return (
        <div className={styles.cardActiveWrapper}>
            <div
                onClick={
                    title === 'CLAIM DIDxWALLET'
                        ? handleSubmitDIDxWallet
                        : handleSubmit
                }
                className={isZil ? styles.cardZil : styles.card}
            >
                <div className={styles.cardTitle3}>
                    {isLoading ? <ThreeDots color="basic" /> : title}
                </div>
            </div>
        </div>
    )
}

export default Component
