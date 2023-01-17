import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { $resolvedInfo } from '../../../src/store/resolvedInfo'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../src/app/reducers'
import { ZilPayBase } from '../../ZilPay/zilpay-base'
import { setTxId, setTxStatusLoading } from '../../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../../src/store/modal'
import ThreeDots from '../../Spinner/ThreeDots'
import Tydra from '../../../src/assets/logos/tydra.json'
import arweave from '../../../src/config/arweave'
import routerHook from '../../../src/hooks/router'
import smartContract from '../../../src/utils/smartContract'
import { $arconnect } from '../../../src/store/arconnect'
import { toast } from 'react-toastify'
import toastTheme from '../../../src/hooks/toastTheme'

function Component() {
    const { getSmartContract } = smartContract()
    const { navigate } = routerHook()
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const resolvedInfo = useStore($resolvedInfo)
    const [isLoading, setIsLoading] = useState(false)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const domainNavigate = domain !== '' ? domain + '@' : ''
    const arConnect = useStore($arconnect)

    const submitAr = async () => {
        setIsLoading(true)
        try {
            if (arConnect === null) {
                toast.info(`You need ArConnect enabled to continue.`, {
                    position: 'top-center',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
            } else {
                const data = {
                    name: 'Nessy',
                    net: 'tyron.network',
                    first_owner: loginInfo?.arAddr,
                    resource: Tydra.img,
                }

                const transaction = await arweave.createTransaction({
                    data: JSON.stringify(data),
                })

                transaction.addTag('Content-Type', 'application/json')

                window.arweaveWallet.dispatch(transaction).then((res) => {
                    sendTxn(res.id)
                })
            }
        } catch (err) {
            console.log(err)
        }
        setIsLoading(false)
    }

    const sendTxn = async (tokenUri) => {
        setIsLoading(true)
        let freeList = false
        const init_addr = await tyron.SearchBarUtil.default.fetchAddr(
            net,
            'init',
            'did'
        )
        try {
            const get_free_list = await getSmartContract(
                init_addr,
                'tydra_free_list'
            )
            const freelist: Array<string> = get_free_list.result.tydra_free_list
            const is_free = freelist.filter(
                (val) => val === loginInfo.zilAddr.base16.toLowerCase()
            )
            if (is_free.length !== 0) {
                freeList = true
            }
        } catch {
            freeList = false
        }
        const zilpay = new ZilPayBase()
        let tx = await tyron.Init.default.transaction(net)
        const domainId =
            '0x' + (await tyron.Util.default.HashString(resolvedInfo?.name!))
        let params: any = []
        const id = {
            vname: 'id',
            type: 'String',
            value: freeList ? 'free' : 'zil',
        }
        params.push(id)
        const token_id = {
            vname: 'token_id',
            type: 'ByStr32',
            value: domainId,
        }
        params.push(token_id)
        const token_uri = {
            vname: 'token_uri',
            type: 'String',
            value: tokenUri,
        }
        params.push(token_uri)

        dispatch(setTxStatusLoading('true'))
        updateModalTxMinimized(false)
        updateModalTx(true)
        await zilpay
            .call({
                contractAddress: init_addr,
                transition: 'MintTydraNft',
                params: params as unknown as Record<string, unknown>[],
                amount: String(freeList ? 0 : 1000),
            })
            .then(async (res) => {
                dispatch(setTxId(res.ID))
                dispatch(setTxStatusLoading('submitted'))
                tx = await tx.confirm(res.ID)
                if (tx.isConfirmed()) {
                    setIsLoading(false)
                    dispatch(setTxStatusLoading('confirmed'))
                    setTimeout(() => {
                        window.open(
                            `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                        )
                    }, 1000)
                    navigate(`/${domainNavigate}${username}/didx`)
                } else if (tx.isRejected()) {
                    setIsLoading(false)
                    dispatch(setTxStatusLoading('failed'))
                }
            })
            .catch((err) => {
                setIsLoading(false)
                dispatch(setTxStatusLoading('rejected'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                throw err
            })
    }

    return (
        <div className={styles.cardActiveWrapper}>
            <div onClick={submitAr} className={styles.card}>
                <div className={styles.cardTitle3}>
                    {isLoading ? <ThreeDots color="basic" /> : 'DEPLOY TYDRA'}
                </div>
            </div>
        </div>
    )
}

export default Component
