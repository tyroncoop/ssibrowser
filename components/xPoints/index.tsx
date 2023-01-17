import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import Image from 'next/image'
import {
    $dashboardState,
    $xpointsBalance,
    updateModalTx,
    updateModalTxMinimized,
    updateNewMotionsModal,
    updateShowZilpay,
    updateXpointsBalance,
} from '../../src/store/modal'
import { useSelector } from 'react-redux'
import { RootState } from '../../src/app/reducers'
import ArrowUpWhite from '../../src/assets/icons/arrow_up.svg'
import ArrowUpBlack from '../../src/assets/icons/arrow_up_dark.svg'
import AddIconYellow from '../../src/assets/icons/add_icon_yellow.svg'
import MinusIcon from '../../src/assets/icons/minus_icon.svg'
import ContinueArrow from '../../src/assets/icons/continue_arrow.svg'
import { toast } from 'react-toastify'
import { setTxId, setTxStatusLoading } from '../../src/app/actions'
import { ZilPayBase } from '../ZilPay/zilpay-base'
import { useTranslation } from 'next-i18next'
import { $resolvedInfo, updateResolvedInfo } from '../../src/store/resolvedInfo'
import smartContract from '../../src/utils/smartContract'
import { Spinner } from '..'
import toastTheme from '../../src/hooks/toastTheme'

function Component() {
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const ArrowUp = isLight ? ArrowUpBlack : ArrowUpWhite
    const xpointsBalance = useStore($xpointsBalance)
    const dashboardState = useStore($dashboardState)
    const [hideAdd, setHideAdd] = useState(true)
    const [loading, setLoading] = useState(true)
    const [amount, setAmount] = useState(0)
    const [addLegend, setAddLegend] = useState('new motion')
    const [selectedId, setSelectedId] = useState('')
    const [readMore, setReadMore] = useState('')
    const [selectedMotion, setSelectedMotion] = useState('')
    const [selectedXpoints, setSelectedXpoints] = useState(0)
    const [motionData, setMotionData] = useState(Array())
    const loginInfo = useSelector((state: RootState) => state.modal)
    const resolvedInfo = useStore($resolvedInfo)

    let addr = ''
    if (resolvedInfo) {
        addr = resolvedInfo?.addr!
    }

    const [xpoints_addr, setAddr] = useState(addr)

    useEffect(() => {
        setLoading(true)
        if (resolvedInfo?.name !== 'xpoints') {
            resolveXpoints()
        }
        fetchXpoints()
            .then(() => {
                fetchMotion()
                    .then(() => {
                        setLoading(false)
                    })
                    .catch((error) => {
                        toast.error(String(error), {
                            position: 'top-right',
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        })
                    })
            })
            .catch((error) => {
                toast.error(String(error), {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboardState])

    const resolveXpoints = async () => {
        try {
            const domainId =
                '0x' + (await tyron.Util.default.HashString('xpoints'))
            await tyron.SearchBarUtil.default
                .fetchAddr(net, domainId, '')
                .then((addr) => {
                    updateResolvedInfo({
                        name: 'xpoints',
                        domain: '',
                        addr: addr,
                    })
                })
        } catch (err) {
            setLoading(false)
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
    }

    const fetchXpoints = async () => {
        updateXpointsBalance(0)
        const domainId = '0x' + (await tyron.Util.default.HashString('donate'))
        await tyron.SearchBarUtil.default
            .fetchAddr(net, domainId, '')
            .then(async (donate_addr) => {
                return await getSmartContract(donate_addr, 'xpoints')
            })
            .then(async (balances) => {
                return await tyron.SmartUtil.default.intoMap(
                    balances.result.xpoints
                )
            })
            .then((balances_) => {
                // Get balance of the logged in address
                const balance = balances_.get(
                    loginInfo.zilAddr?.base16.toLowerCase()
                )
                if (balance !== undefined) {
                    updateXpointsBalance(balance / 1e12)
                }
            })
            .catch(() => {
                setLoading(false)
                throw new Error('Donate DApp: Not able to fetch balance.')
            })
    }

    const fetchMotion = async () => {
        let network = tyron.DidScheme.NetworkNamespace.Mainnet
        if (net === 'testnet') {
            network = tyron.DidScheme.NetworkNamespace.Testnet
        }
        const init = new tyron.ZilliqaInit.default(network)
        const domainId = '0x' + (await tyron.Util.default.HashString('xpoints'))
        await tyron.SearchBarUtil.default
            .fetchAddr(net, domainId, '')
            .then(async (addr) => {
                setAddr(addr)
                await init.API.blockchain
                    .getSmartContractState(addr)
                    .then(async (state_) => {
                        console.log('res', state_)
                        const data = await tyron.SmartUtil.default.intoMap(
                            state_.result.motions
                        )
                        const data2 = await tyron.SmartUtil.default.intoMap(
                            state_.result.ranking
                        )
                        const motions = Array.from(data.values())
                        const id = Array.from(data.keys())
                        const xp = Array.from(data2.values())
                        let arr: any = []

                        for (let i = 0; i < motions.length; i += 1) {
                            const obj = {
                                id: id[i],
                                motion: motions[i],
                                xp: xp[i],
                            }
                            arr = [obj, ...arr]
                        }

                        var res = arr.sort(
                            (a: { xp: number }, b: { xp: number }) =>
                                b.xp - a.xp
                        )
                        setMotionData(res)
                    })
                    .catch(() => {
                        setLoading(false)
                        throw new Error(
                            t('Error: xPoints DApp: Not able to fetch motions')
                        )
                    })
            })
    }

    const webHookAddPoints = async () => {
        const totAmount = Number(amount) + selectedXpoints
        const request = {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: `TYRON ${net}\n\nMotion: ${selectedMotion}\n\nUpdated xPoints balance: ${totAmount}\n\nxPoints DApp: https://tyron.network/xpoints`,
        }
        await fetch(`${process.env.NEXT_PUBLIC_WEBHOOK_ADDPOINTS_URL}`, request)
    }

    const handleSubmit = async () => {
        if (isNaN(amount)) {
            toast.error('Please input a valid number.', {
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
            if (Number(amount) > xpointsBalance!) {
                toast.error('Not enough xPoints.', {
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
                if (loginInfo.zilAddr !== null) {
                    try {
                        const zilpay = new ZilPayBase()

                        const tx_params = Array()

                        const tx_action = {
                            vname: 'action',
                            type: 'String',
                            value: 'add',
                        }
                        tx_params.push(tx_action)

                        let id = await tyron.TyronZil.default.OptionParam(
                            tyron.TyronZil.Option.some,
                            'ByStr32',
                            selectedId
                        )
                        const tx_id = {
                            vname: 'id',
                            type: 'Option ByStr32',
                            value: id,
                        }
                        tx_params.push(tx_id)

                        let motion_ = await tyron.TyronZil.default.OptionParam(
                            tyron.TyronZil.Option.none,
                            'String'
                        )
                        const tx_motion = {
                            vname: 'motion',
                            type: 'Option String',
                            value: motion_,
                        }
                        tx_params.push(tx_motion)

                        const tx_amount = {
                            vname: 'amount',
                            type: 'Uint128',
                            value: String(Number(amount) * 1e12),
                        }
                        tx_params.push(tx_amount)

                        dispatch(setTxStatusLoading('true'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        let tx = await tyron.Init.default.transaction(net)

                        await zilpay
                            .call({
                                contractAddress: xpoints_addr,
                                transition: 'RaiseYourVoice',
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
                                    dispatch(setTxStatusLoading('confirmed'))
                                    window.open(
                                        `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                    )
                                    webHookAddPoints()
                                } else if (tx.isRejected()) {
                                    dispatch(setTxStatusLoading('failed'))
                                }
                            })
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
                        toastId: 13,
                    })
                }
            }
        }
    }

    const handleChange = (e: { target: { value: any } }) => {
        let value = e.target.value
        setAmount(value)
    }

    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSubmit()
        }
    }

    const vote = (id: React.SetStateAction<string>) => {
        if (id === selectedId) {
            setSelectedId('')
        } else {
            setSelectedId(id)
        }
    }

    const showNewMotion = () => {
        updateNewMotionsModal(true)
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '7%' }}>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <h1 style={{ marginBottom: '10%', color: '#ffff32' }}>
                        <span className={styles.x}>x</span>POINTS DApp
                    </h1>
                    {
                        <div style={{ marginTop: '14%' }}>
                            <h3 className={styles.raiseTxt}>
                                {t('RAISE YOUR VOICE')}
                            </h3>
                            <div style={{ marginTop: '14%' }}>
                                {hideAdd ? (
                                    <button
                                        type="button"
                                        className={styles.button}
                                        onClick={showNewMotion}
                                    >
                                        <p className={styles.buttonText}>
                                            {addLegend}
                                        </p>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className={styles.button}
                                            onClick={() => {
                                                setHideAdd(true)
                                                setAddLegend('new motion')
                                            }}
                                        >
                                            <p className={styles.buttonText}>
                                                {t(addLegend.toUpperCase())}
                                            </p>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    }
                    {hideAdd && (
                        <>
                            <div className={styles.wrapperMotion}>
                                {motionData.map((val, i) => {
                                    return (
                                        <div key={i} className={styles.motion}>
                                            <div
                                                className={styles.motionContent}
                                            >
                                                <div
                                                    className={
                                                        styles.wrapperArrowUp
                                                    }
                                                >
                                                    <div
                                                        onClick={() =>
                                                            vote(val.id)
                                                        }
                                                        style={{
                                                            cursor: 'pointer',
                                                            width: '35px',
                                                            height: '35px',
                                                        }}
                                                    >
                                                        <Image
                                                            alt="arrow"
                                                            src={ArrowUp}
                                                            width={35}
                                                            height={35}
                                                        />
                                                    </div>
                                                    <div
                                                        className={styles.txt}
                                                        style={{
                                                            marginTop: '10px',
                                                        }}
                                                    >
                                                        {Number(val.xp) / 1e12}
                                                    </div>
                                                </div>
                                                {val.id === readMore ? (
                                                    <div
                                                        className={
                                                            styles.motionTxtWrapper
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection:
                                                                    'column',
                                                            }}
                                                        >
                                                            {val.motion
                                                                .split(
                                                                    new RegExp(
                                                                        '\\\\n',
                                                                        'g'
                                                                    )
                                                                )
                                                                .map(
                                                                    (
                                                                        item,
                                                                        i
                                                                    ) => {
                                                                        if (
                                                                            i ===
                                                                            val.motion.split(
                                                                                new RegExp(
                                                                                    '\\\\n',
                                                                                    'g'
                                                                                )
                                                                            )
                                                                                .length -
                                                                            1
                                                                        ) {
                                                                            return (
                                                                                <div
                                                                                    className={
                                                                                        styles.txt
                                                                                    }
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        item
                                                                                    }{' '}
                                                                                    <span
                                                                                        onClick={() =>
                                                                                            setReadMore(
                                                                                                ''
                                                                                            )
                                                                                        }
                                                                                        style={{
                                                                                            cursor: 'pointer',
                                                                                            width: 'fit-content',
                                                                                        }}
                                                                                    >
                                                                                        <Image
                                                                                            src={
                                                                                                MinusIcon
                                                                                            }
                                                                                            alt="add-ico"
                                                                                        />
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        } else {
                                                                            return (
                                                                                <div
                                                                                    className={
                                                                                        styles.txt
                                                                                    }
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        item
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        }
                                                                    }
                                                                )}
                                                        </div>
                                                    </div>
                                                ) : val.motion.length > 100 ? (
                                                    <div
                                                        className={
                                                            styles.motionTxtWrapper
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection:
                                                                    'column',
                                                            }}
                                                        >
                                                            {val.motion
                                                                .slice(0, 100)
                                                                .split(
                                                                    new RegExp(
                                                                        '\\\\n',
                                                                        'g'
                                                                    )
                                                                )
                                                                .map(
                                                                    (
                                                                        item,
                                                                        i
                                                                    ) => {
                                                                        if (
                                                                            i ===
                                                                            val.motion
                                                                                .slice(
                                                                                    0,
                                                                                    100
                                                                                )
                                                                                .split(
                                                                                    new RegExp(
                                                                                        '\\\\n',
                                                                                        'g'
                                                                                    )
                                                                                )
                                                                                .length -
                                                                            1
                                                                        ) {
                                                                            return (
                                                                                <div
                                                                                    className={
                                                                                        styles.txt
                                                                                    }
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        item
                                                                                    }
                                                                                    ...
                                                                                    <span
                                                                                        onClick={() =>
                                                                                            setReadMore(
                                                                                                val.id
                                                                                            )
                                                                                        }
                                                                                        style={{
                                                                                            cursor: 'pointer',
                                                                                            width: 'fit-content',
                                                                                        }}
                                                                                    >
                                                                                        <Image
                                                                                            src={
                                                                                                AddIconYellow
                                                                                            }
                                                                                            alt="add-ico"
                                                                                        />
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        } else {
                                                                            return (
                                                                                <div
                                                                                    className={
                                                                                        styles.txt
                                                                                    }
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        item
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        }
                                                                    }
                                                                )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                        className={
                                                            styles.motionTxtWrapper
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection:
                                                                    'column',
                                                            }}
                                                        >
                                                            {val.motion
                                                                .split(
                                                                    new RegExp(
                                                                        '\\\\n',
                                                                        'g'
                                                                    )
                                                                )
                                                                .map(
                                                                    (
                                                                        item,
                                                                        i
                                                                    ) => {
                                                                        return (
                                                                            <div
                                                                                className={
                                                                                    styles.txt
                                                                                }
                                                                                key={
                                                                                    i
                                                                                }
                                                                            >
                                                                                {
                                                                                    item
                                                                                }
                                                                            </div>
                                                                        )
                                                                    }
                                                                )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {selectedId === val.id && (
                                                <div
                                                    className={
                                                        styles.addXpointsWrapper
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.inputWrapper
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'center',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    marginRight:
                                                                        '2%',
                                                                }}
                                                            >
                                                                <input
                                                                    className={
                                                                        styles.input
                                                                    }
                                                                    type="text"
                                                                    placeholder={t(
                                                                        'Type amount'
                                                                    )}
                                                                    onChange={
                                                                        handleChange
                                                                    }
                                                                    onKeyPress={(
                                                                        e
                                                                    ) => {
                                                                        setSelectedMotion(
                                                                            val.motion
                                                                        )
                                                                        setSelectedXpoints(
                                                                            Number(
                                                                                val.xp
                                                                            ) /
                                                                            1e12
                                                                        )
                                                                        handleOnKeyPress(
                                                                            e
                                                                        )
                                                                    }}
                                                                />
                                                                <code
                                                                    className={
                                                                        styles.txt
                                                                    }
                                                                >
                                                                    xP
                                                                </code>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                }}
                                                            >
                                                                <div
                                                                    className="continueBtn"
                                                                    onClick={() => {
                                                                        setSelectedMotion(
                                                                            val.motion
                                                                        )
                                                                        setSelectedXpoints(
                                                                            Number(
                                                                                val.xp
                                                                            ) /
                                                                            1e12
                                                                        )
                                                                        handleSubmit()
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={
                                                                            ContinueArrow
                                                                        }
                                                                        alt="arrow"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.xpointsTxt
                                                        }
                                                    >
                                                        Balance:{' '}
                                                        <span
                                                            style={{
                                                                color: '#ffff32',
                                                            }}
                                                        >
                                                            {xpointsBalance?.toFixed(
                                                                2
                                                            )}
                                                        </span>{' '}
                                                        xPoint
                                                        {xpointsBalance! > 1
                                                            ? 's'
                                                            : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default Component
