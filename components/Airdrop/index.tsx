import React, { useState } from 'react'
import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../src/app/reducers'
import { toast } from 'react-toastify'
import { ZilPayBase } from '../ZilPay/zilpay-base'
import { setTxId, setTxStatusLoading } from '../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../src/store/modal'
// import { useTranslation } from 'next-i18next'
import { $resolvedInfo } from '../../src/store/resolvedInfo'
import toastTheme from '../../src/hooks/toastTheme'
import ThreeDots from '../Spinner/ThreeDots'
import smartContract from '../../src/utils/smartContract'

function Component() {
    // const { t } = useTranslation()

    const dispatch = useDispatch()

    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const resolvedInfo = useStore($resolvedInfo)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const { getSmartContract } = smartContract()

    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (resolvedInfo !== null) {
            setLoading(true)
            try {
                const addr = await tyron.SearchBarUtil.default.fetchAddr(
                    net,
                    '0x13bc8e27d5c8abbfee06fadf6c210524b57316a2222181960a6b175b8f387e0c', // airdrop id
                    ''
                )
                const get_list = await getSmartContract(addr!, 'airdrop_list')
                const list: Array<string> = get_list.result.airdrop_list
                const is_list = list.filter(
                    (val) => val === loginInfo.zilAddr.base16.toLowerCase()
                )
                if (is_list.length === 0) {
                    throw new Error('You are not on the airdrop list')
                }
                const txID = 'Airdrop'
                const zilpay = new ZilPayBase()
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
                    .then(async (res: any) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        tx = await tx.confirm(res.ID)
                        if (tx.isConfirmed()) {
                            dispatch(setTxStatusLoading('confirmed'))
                            window.open(
                                `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                            )
                        } else if (tx.isRejected()) {
                            dispatch(setTxStatusLoading('failed'))
                        }
                        setLoading(false)
                    })
                    .catch(() => {
                        setLoading(false)
                        dispatch(setTxStatusLoading('idle'))
                        // throw new Error('Could not confirm the transaction.') @todo-x not thrown
                    })
            } catch (error) {
                setLoading(false)
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
                    toastId: 7,
                })
            }
        }
    }

    return (
        <div>
            <h1 style={{ marginBottom: '14%' }}>airdrop.ssi</h1>
            <div
                className={isLight ? 'actionBtnLight' : 'actionBtn'}
                onClick={handleSubmit}
            >
                {loading ? (
                    <ThreeDots color="yellow" />
                ) : (
                    <>Claim $TYRON rewards</>
                )}
            </div>
        </div>
    )
}

export default Component