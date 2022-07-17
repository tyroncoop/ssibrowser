import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import styles from './styles.module.scss'
import {
    Donate,
    InputZil,
    OriginatorAddress,
    OriginatorSelector,
    Selector,
    SSNSelector,
} from '../../..'
import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { $user } from '../../../../src/store/user'
import { $donation, updateDonation } from '../../../../src/store/donation'
import PauseIco from '../../../../src/assets/icons/pause.svg'
import UnpauseIco from '../../../../src/assets/icons/unpause.svg'
import ContinueArrow from '../../../../src/assets/icons/continue_arrow.svg'
import DelegateStake from '../../../../src/assets/icons/delegate_stake.svg'
import WithdrawStakeRewards from '../../../../src/assets/icons/withdraw_stake_rewards.svg'
import WithdrawStakeAmount from '../../../../src/assets/icons/withdraw_stake_amount.svg'
import CompleteStakeWithdrawal from '../../../../src/assets/icons/complete_stake_withdrawal.svg'
import RedelegateStake from '../../../../src/assets/icons/redelegate_stake.svg'
import TickIco from '../../../../src/assets/icons/tick.svg'
import { toast } from 'react-toastify'
import { ZilPayBase } from '../../../ZilPay/zilpay-base'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../../src/app/reducers'
import { setTxId, setTxStatusLoading } from '../../../../src/app/actions'
import { $net } from '../../../../src/store/wallet-network'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../src/store/modal'
import { $originatorAddress } from '../../../../src/store/originatorAddress'

function StakeWallet() {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const callbackRef = useCallback((inputElement) => {
        if (inputElement) {
            inputElement.focus()
        }
    }, [])
    const resolvedUsername = useSelector(
        (state: RootState) => state.modal.resolvedUsername
    )
    const user = useStore($user)
    const donation = useStore($donation)
    const net = useStore($net)
    const originatorAddress = useStore($originatorAddress)
    const [active, setActive] = useState('')
    const [legend, setLegend] = useState('CONTINUE')
    const [legend2, setLegend2] = useState('CONTINUE')
    const [input, setInput] = useState(0)
    const [recipient, setRecipient] = useState('')
    const [username, setUsername] = useState('')
    const [domain, setDomain] = useState('default')
    const [ssn, setSsn] = useState('')
    const [ssn2, setSsn2] = useState('')
    const [originator, setOriginator] = useState<any>(null)
    const [originator2, setOriginator2] = useState<any>(null)
    const [address, setAddress] = useState('')
    const [loading, setLoading] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    const toggleActive = (id: string) => {
        resetState()
        if (id === active) {
            setActive('')
        } else {
            if (isPaused) {
                if (id === 'unpause') {
                    setActive(id)
                } else {
                    toast.error('To continue, unpause your Web3 wallet.', {
                        position: 'top-right',
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'dark',
                    })
                }
            } else {
                setActive(id)
            }
        }
    }

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(0)
        setLegend('CONTINUE')
        let input = event.target.value
        const re = /,/gi
        input = input.replace(re, '.')
        const input_ = Number(input)
        if (!isNaN(input_)) {
            setInput(input_)
        } else {
            toast.error(t('The input is not a number.'), {
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
        }
    }

    const handleInputAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAddress('')
        setLegend2('CONTINUE')
        const addr = tyron.Address.default.verification(event.target.value)
        if (addr !== '') {
            setAddress(addr)
            handleSave2()
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

    const handleInputAddress2 = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setAddress('')
        const addr = tyron.Address.default.verification(event.target.value)
        if (addr !== '') {
            if (addr === resolvedUsername.addr) {
                toast.error('The recipient and sender must be different.', {
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
            } else {
                setAddress(addr)
                handleSave2()
            }
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

    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    }

    const handleSave = () => {
        if (input === 0) {
            toast.error(t('The amount cannot be zero.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
            })
        } else if (input < 10) {
            toast.error(t('Minimum input are 10 ZIL.'), {
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
            setLegend('SAVED')
        }
    }

    const handleSave2 = () => {
        setLegend2('SAVED')
    }

    const handleOnChangeRecipient = (value) => {
        setDomain('default')
        setLegend2('CONTINUE')
        updateDonation(null)
        setRecipient(value)
    }

    const handleOnChangeUsername = (event: { target: { value: any } }) => {
        setUsername(event.target.value)
        if (user?.name === event.target.value && user?.domain === domain) {
            toast.error('The recipient and sender must be different.', {
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

    const handleOnChangeDomain = (value) => {
        setDomain(value)
        if (user?.name === username && user?.domain === value) {
            toast.error('The recipient and sender must be different.', {
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

    const handleOnChangeSsn = (value) => {
        setSsn(value)
    }

    const handleOnChangeSsn2 = (value) => {
        setSsn2(value)
    }

    const resetState = () => {
        updateDonation(null)
        setLegend('CONTINUE')
        setLegend2('CONTINUE')
        setInput(0)
        setRecipient('')
        setUsername('')
        setDomain('default')
        setSsn('')
        setSsn2('')
        setOriginator(null)
        setOriginator2(null)
    }

    const fetchPause = async () => {
        setLoading(true)
        let network = tyron.DidScheme.NetworkNamespace.Mainnet
        if (net === 'testnet') {
            network = tyron.DidScheme.NetworkNamespace.Testnet
        }
        const init = new tyron.ZilliqaInit.default(network)
        init.API.blockchain
            .getSmartContractSubState(resolvedUsername.addr, 'paused')
            .then(async (res) => {
                const paused = res.result.paused.constructor === 'True'
                setIsPaused(paused)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }

    const handleSubmit = async (id: string) => {
        const zilpay = new ZilPayBase()
        let tx = await tyron.Init.default.transaction(net)
        let txID
        let tx_params: any = []
        let contractAddress = resolvedUsername?.addr!

        const tyron_ = await tyron.Donation.default.tyron(donation!)
        const tyron__ = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron_,
        }
        const username_ = {
            vname: 'username',
            type: 'String',
            value: user?.name,
        }
        const stakeId = {
            vname: 'stakeID',
            type: 'String',
            value: 'zilstaking',
        }
        const ssnId = {
            vname: 'ssnID',
            type: 'String',
            value: ssn,
        }
        const amount = {
            vname: 'amount',
            type: 'Uint128',
            value: String(input),
        }
        const requestor = {
            vname: 'requestor',
            type: 'ByStr20',
            value: address,
        }

        switch (id) {
            case 'pause':
                txID = 'Pause'
                tx_params.push(username_)
                tx_params.push(tyron__)
                break
            case 'unpause':
                txID = 'Unpause'
                tx_params.push(username_)
                tx_params.push(tyron__)
                break
            case 'withdrawZil':
                txID = 'SendFunds'
                let beneficiary: tyron.TyronZil.Beneficiary
                if (recipient === 'nft') {
                    const addr = await tyron.SearchBarUtil.default.fetchAddr(
                        net,
                        user?.name!,
                        'did'
                    )
                    await tyron.SearchBarUtil.default
                        .Resolve(net, addr)
                        .then(async (res: any) => {
                            console.log(Number(res?.version.slice(8, 11)))
                            if (Number(res?.version.slice(8, 11)) < 5.6) {
                                const recipient =
                                    await tyron.SearchBarUtil.default.fetchAddr(
                                        net,
                                        username,
                                        domain
                                    )
                                beneficiary = {
                                    constructor:
                                        tyron.TyronZil.BeneficiaryConstructor
                                            .Recipient,
                                    addr: recipient,
                                }
                            } else {
                                beneficiary = {
                                    constructor:
                                        tyron.TyronZil.BeneficiaryConstructor
                                            .NftUsername,
                                    username: username,
                                    domain: domain,
                                }
                            }
                        })
                        .catch((err) => {
                            toast.error(err, {
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
                        })
                } else {
                    beneficiary = {
                        constructor:
                            tyron.TyronZil.BeneficiaryConstructor.Recipient,
                        addr: address,
                    }
                }
                tx_params = await tyron.TyronZil.default.SendFunds(
                    resolvedUsername.addr,
                    'AddFunds',
                    beneficiary!,
                    String(input * 1e12),
                    tyron_
                )
                const usernameWithdraw = {
                    vname: 'username',
                    type: 'String',
                    value: user?.name,
                }
                tx_params.push(usernameWithdraw)
                break
            case 'delegateStake':
                txID = 'DelegateStake'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(ssnId)
                tx_params.push(amount)
                tx_params.push(tyron__)
                break
            case 'withdrawStakeRewards':
                txID = 'WithdrawStakeRewards'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(ssnId)
                tx_params.push(tyron__)
                break
            case 'withdrawStakeAmount':
                txID = 'WithdrawStakeAmt'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(ssnId)
                tx_params.push(amount)
                tx_params.push(tyron__)
                break
            case 'completeStakeWithdrawal':
                txID = 'CompleteWithdrawal'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(tyron__)
                break
            case 'redelegateStake':
                txID = 'ReDelegateStake'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(ssnId)
                tx_params.push(amount)
                tx_params.push(tyron__)
                const tossnId = {
                    vname: 'tossnID',
                    type: 'String',
                    value: ssn2,
                }
                tx_params.push(tossnId)
                break
            case 'requestDelegatorSwap':
                txID = 'RequestDelegatorSwap'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(tyron__)
                const newAddr = {
                    vname: 'newDelegAddr',
                    type: 'ByStr20',
                    value: originator2?.value,
                }
                tx_params.push(newAddr)
                if (originator?.value === 'zilpay') {
                    // let network = tyron.DidScheme.NetworkNamespace.Mainnet
                    // if (net === 'testnet') {
                    //     network = tyron.DidScheme.NetworkNamespace.Testnet
                    // }
                    // const init = new tyron.ZilliqaInit.default(network)
                    // await tyron.SearchBarUtil.default
                    //     .fetchAddr(net, 'init', 'did')
                    //     .then(async (init_addr) => {
                    //         return await init.API.blockchain.getSmartContractSubState(
                    //             init_addr,
                    //             'services'
                    //         )
                    //     }).then((res) => {
                    //         console.log(res)
                    //     })
                    contractAddress = contractAddress // @todo: provide addr @tralkan
                } else {
                    contractAddress = originator?.value
                }
                break
            case 'confirmDelegatorSwap':
                txID = 'ConfirmDelegatorSwap'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(requestor)
                tx_params.push(tyron__)
                break
            case 'revokeDelegatorSwap':
                txID = 'RevokeDelegatorSwap'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(tyron__)
                break
            case 'rejectDelegatorSwap':
                txID = 'RejectDelegatorSwap'
                tx_params.push(username_)
                tx_params.push(stakeId)
                tx_params.push(requestor)
                tx_params.push(tyron__)
                break
        }

        dispatch(setTxStatusLoading('true'))
        updateModalTxMinimized(false)
        updateModalTx(true)
        await zilpay
            .call({
                contractAddress: contractAddress,
                transition: txID,
                params: tx_params as unknown as Record<string, unknown>[],
                amount: String(donation),
            })
            .then(async (res) => {
                dispatch(setTxId(res.ID))
                dispatch(setTxStatusLoading('submitted'))
                tx = await tx.confirm(res.ID)
                resetState()
                if (tx.isConfirmed()) {
                    dispatch(setTxStatusLoading('confirmed'))
                    setTimeout(() => {
                        window.open(
                            `https://devex.zilliqa.com/tx/${
                                res.ID
                            }?network=https%3A%2F%2F${
                                net === 'mainnet' ? '' : 'dev-'
                            }api.zilliqa.com`
                        )
                    }, 1000)
                } else if (tx.isRejected()) {
                    dispatch(setTxStatusLoading('failed'))
                }
            })
            .catch((err) => {
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
                    theme: 'dark',
                    toastId: 12,
                })
            })
    }

    useEffect(() => {
        fetchPause()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const option = [
        {
            key: '',
            name: 'Address',
        },
        {
            key: 'nft',
            name: ' NFT Username',
        },
        {
            key: 'address',
            name: 'Address',
        },
    ]

    const optionDomain = [
        {
            key: 'default',
            name: t('Domain'),
        },
        {
            key: '',
            name: 'NFT',
        },
        {
            key: 'did',
            name: '.did',
        },
        {
            key: 'zil',
            name: '.zil',
        },
        // {
        //     key: 'defi',
        //     name: '.defi',
        // },
    ]

    const spinner = (
        <i
            style={{ color: '#ffff32' }}
            className="fa fa-lg fa-spin fa-circle-notch"
            aria-hidden="true"
        ></i>
    )

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>ZIL STAKING WALLET</h4>
            <div className={styles.cardWrapper}>
                {loading ? (
                    spinner
                ) : (
                    <>
                        {isPaused ? (
                            <div className={styles.cardActiveWrapper}>
                                <div
                                    onClick={() => toggleActive('unpause')}
                                    className={styles.cardActive}
                                >
                                    <div>UNPAUSE</div>
                                    <div className={styles.icoWrapper}>
                                        <Image
                                            src={UnpauseIco}
                                            alt="unpause-ico"
                                        />
                                    </div>
                                </div>
                                {active === 'unpause' && (
                                    <div className={styles.cardRight}>
                                        <div
                                            style={{
                                                marginTop: '-12%',
                                                marginBottom: '-12%',
                                            }}
                                        >
                                            <Donate />
                                        </div>
                                        {donation !== null && (
                                            <>
                                                <div
                                                    onClick={() =>
                                                        handleSubmit('unpause')
                                                    }
                                                    style={{
                                                        width: '100%',
                                                        marginTop: '24px',
                                                    }}
                                                    className="actionBtnBlue"
                                                >
                                                    <div
                                                        className={
                                                            styles.txtBtn
                                                        }
                                                    >
                                                        UNPAUSE {user?.name}
                                                        .zil
                                                    </div>
                                                </div>
                                                <div className={styles.gasTxt}>
                                                    Cost is less than 1 ZIL
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.cardActiveWrapper}>
                                <div
                                    onClick={() => toggleActive('pause')}
                                    className={
                                        active === 'pause'
                                            ? styles.cardActive
                                            : styles.card
                                    }
                                >
                                    <div>PAUSE</div>
                                    <div className={styles.icoWrapper}>
                                        <Image src={PauseIco} alt="pause-ico" />
                                    </div>
                                </div>
                                {active === 'pause' && (
                                    <div className={styles.cardRight}>
                                        <div
                                            style={{
                                                marginTop: '-12%',
                                                marginBottom: '-12%',
                                            }}
                                        >
                                            <Donate />
                                        </div>
                                        {donation !== null && (
                                            <>
                                                <div
                                                    onClick={() =>
                                                        handleSubmit('pause')
                                                    }
                                                    style={{
                                                        width: '100%',
                                                        marginTop: '24px',
                                                    }}
                                                    className="actionBtnBlue"
                                                >
                                                    <div
                                                        className={
                                                            styles.txtBtn
                                                        }
                                                    >
                                                        PAUSE {user?.name}
                                                        .zil
                                                    </div>
                                                </div>
                                                <div className={styles.gasTxt}>
                                                    Cost is less than 2 ZIL
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => toggleActive('withdrawalZil')}
                                className={
                                    active === 'withdrawalZil'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>SEND ZIL</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={ContinueArrow}
                                        alt="withdrawal-zil-ico"
                                    />
                                </div>
                            </div>
                            {active === 'withdrawalZil' && (
                                <div className={styles.cardRight}>
                                    <div>
                                        <InputZil
                                            onChange={handleInput}
                                            legend={legend}
                                            handleSave={handleSave}
                                        />
                                    </div>
                                    {legend === 'SAVED' && (
                                        <>
                                            <div
                                                style={{
                                                    marginTop: '16px',
                                                    width: '100%',
                                                }}
                                            >
                                                <Selector
                                                    option={option}
                                                    onChange={
                                                        handleOnChangeRecipient
                                                    }
                                                    value={recipient}
                                                />
                                            </div>
                                            {recipient === 'nft' ? (
                                                <div
                                                    className={
                                                        styles.domainSelectorWrapper
                                                    }
                                                >
                                                    <input
                                                        ref={callbackRef}
                                                        type="text"
                                                        style={{
                                                            width: '100%',
                                                            marginRight: '10px',
                                                        }}
                                                        onChange={
                                                            handleOnChangeUsername
                                                        }
                                                        onKeyPress={
                                                            handleOnKeyPress
                                                        }
                                                        placeholder={t(
                                                            'TYPE_USERNAME'
                                                        )}
                                                        autoFocus
                                                    />
                                                    <div
                                                        style={{ width: '50%' }}
                                                    >
                                                        <Selector
                                                            option={
                                                                optionDomain
                                                            }
                                                            onChange={
                                                                handleOnChangeDomain
                                                            }
                                                            value={domain}
                                                        />
                                                    </div>
                                                </div>
                                            ) : recipient === 'address' ? (
                                                <div
                                                    style={{
                                                        marginTop: '16px',
                                                        width: '100%',
                                                        justifyContent:
                                                            'space-between',
                                                    }}
                                                    className={
                                                        styles.formAmount
                                                    }
                                                >
                                                    <input
                                                        style={{ width: '70%' }}
                                                        type="text"
                                                        placeholder={t(
                                                            'Type address'
                                                        )}
                                                        onChange={
                                                            handleInputAddress2
                                                        }
                                                        onKeyPress={
                                                            handleOnKeyPress
                                                        }
                                                        autoFocus
                                                    />
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                legend2 ===
                                                                'CONTINUE'
                                                                    ? 'continueBtn'
                                                                    : ''
                                                            }
                                                            onClick={() => {
                                                                handleSave2()
                                                            }}
                                                        >
                                                            {legend2 ===
                                                            'CONTINUE' ? (
                                                                <Image
                                                                    src={
                                                                        ContinueArrow
                                                                    }
                                                                    alt="arrow"
                                                                />
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        marginTop:
                                                                            '5px',
                                                                    }}
                                                                >
                                                                    <Image
                                                                        width={
                                                                            40
                                                                        }
                                                                        src={
                                                                            TickIco
                                                                        }
                                                                        alt="tick"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <></>
                                            )}
                                        </>
                                    )}
                                    {domain !== 'default' ||
                                    legend2 === 'SAVED' ? (
                                        <div>
                                            <Donate />
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                    {donation !== null && (
                                        <>
                                            <div
                                                style={{ width: '100%' }}
                                                onClick={() =>
                                                    handleSubmit('withdrawZil')
                                                }
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    WITHDRAW {input} ZIL from{' '}
                                                    {user?.name}
                                                    .zil
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 3 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => toggleActive('delegateStake')}
                                className={
                                    active === 'delegateStake'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>DELEGATE STAKE</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={DelegateStake}
                                        alt="delegate-stake-ico"
                                    />
                                </div>
                            </div>
                            {active === 'delegateStake' && (
                                <div className={styles.cardRight}>
                                    <SSNSelector
                                        onChange={handleOnChangeSsn}
                                        title="Staked Seed Node ID"
                                        value={ssn}
                                    />
                                    {ssn !== '' && (
                                        <div style={{ marginTop: '16px' }}>
                                            <InputZil
                                                onChange={handleInput}
                                                legend={legend}
                                                handleSave={handleSave}
                                            />
                                        </div>
                                    )}
                                    {legend === 'SAVED' && <Donate />}
                                    {donation !== null && (
                                        <>
                                            <div
                                                style={{ width: '100%' }}
                                                onClick={() =>
                                                    handleSubmit(
                                                        'delegateStake'
                                                    )
                                                }
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    DELEGATE {input} ZIL to{' '}
                                                    {ssn}
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('withdrawStakeRewards')
                                }
                                className={
                                    active === 'withdrawStakeRewards'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>GET REWARDS</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={WithdrawStakeRewards}
                                        alt="withdrwa-stake-ico"
                                    />
                                </div>
                            </div>
                            {active === 'withdrawStakeRewards' && (
                                <div className={styles.cardRight}>
                                    <SSNSelector
                                        onChange={handleOnChangeSsn}
                                        title="Staked Seed Node ID"
                                        value={ssn}
                                    />
                                    {ssn !== '' && (
                                        <div>
                                            <Donate />
                                        </div>
                                    )}
                                    {donation !== null && (
                                        <>
                                            <div
                                                style={{ width: '100%' }}
                                                onClick={() =>
                                                    handleSubmit(
                                                        'withdrawStakeRewards'
                                                    )
                                                }
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    WITHDRAW REWARDS
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('withdrawStakeAmount')
                                }
                                className={
                                    active === 'withdrawStakeAmount'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>WITHDRAW STAKE</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={WithdrawStakeAmount}
                                        alt="withdraw-stake-amount-ico"
                                    />
                                </div>
                            </div>
                            {active === 'withdrawStakeAmount' && (
                                <div className={styles.cardRight}>
                                    <SSNSelector
                                        onChange={handleOnChangeSsn}
                                        title="Staked Seed Node ID"
                                        value={ssn}
                                    />
                                    {ssn !== '' && (
                                        <div style={{ marginTop: '16px' }}>
                                            <InputZil
                                                onChange={handleInput}
                                                legend={legend}
                                                handleSave={handleSave}
                                            />
                                        </div>
                                    )}
                                    {legend === 'SAVED' && (
                                        <div>
                                            <Donate />
                                        </div>
                                    )}
                                    {donation !== null && (
                                        <>
                                            <div
                                                style={{ width: '100%' }}
                                                onClick={() =>
                                                    handleSubmit(
                                                        'withdrawStakeAmount'
                                                    )
                                                }
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    WITHDRAW {input} ZIL from
                                                    SSN
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('completeStakeWithdrawal')
                                }
                                className={
                                    active === 'completeStakeWithdrawal'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>COMPLETE STAKE WITHDRAWAL</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={CompleteStakeWithdrawal}
                                        alt="completeStakeWithdrawal-ico"
                                    />
                                </div>
                            </div>
                            {active === 'completeStakeWithdrawal' && (
                                <div className={styles.cardRight}>
                                    <div
                                        style={{
                                            marginTop: '-12%',
                                            marginBottom: '-12%',
                                        }}
                                    >
                                        <Donate />
                                    </div>
                                    {donation !== null && (
                                        <>
                                            <div
                                                onClick={() =>
                                                    handleSubmit(
                                                        'completeStakeWithdrawal'
                                                    )
                                                }
                                                style={{
                                                    marginTop: '24px',
                                                    width: '100%',
                                                }}
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    COMPLETE WITHDRAWAL
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() => toggleActive('redelegateStake')}
                                className={
                                    active === 'redelegateStake'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>REDELEGATE STAKE</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={RedelegateStake}
                                        alt="redelegateStake-ico"
                                    />
                                </div>
                            </div>
                            {active === 'redelegateStake' && (
                                <div className={styles.cardRight}>
                                    <SSNSelector
                                        onChange={handleOnChangeSsn}
                                        title="Current Staked Seed Node ID"
                                        value={ssn}
                                    />
                                    {ssn !== '' && (
                                        <div
                                            style={{
                                                marginTop: '16px',
                                                width: '100%',
                                            }}
                                        >
                                            <SSNSelector
                                                onChange={handleOnChangeSsn2}
                                                title="New Staked Seed Node ID"
                                                value={ssn2}
                                            />
                                        </div>
                                    )}
                                    {ssn2 !== '' && (
                                        <div style={{ marginTop: '16px' }}>
                                            <InputZil
                                                onChange={handleInput}
                                                legend={legend}
                                                handleSave={handleSave}
                                            />
                                        </div>
                                    )}
                                    {legend === 'SAVED' && <Donate />}
                                    {donation !== null && (
                                        <>
                                            <div
                                                onClick={() =>
                                                    handleSubmit(
                                                        'redelegateStake'
                                                    )
                                                }
                                                style={{
                                                    marginTop: '24px',
                                                    width: '100%',
                                                }}
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    REDELEGATE {input} ZIL from{' '}
                                                    {ssn} to {ssn2}
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('requestDelegatorSwap')
                                }
                                className={
                                    active === 'requestDelegatorSwap'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>REQUEST DELEGATOR SWAP</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={ContinueArrow}
                                        alt="requestDelegatorSwap-ico"
                                    />
                                </div>
                            </div>
                            {active === 'requestDelegatorSwap' && (
                                <div className={styles.cardRight}>
                                    <div style={{ width: '100%' }}>
                                        <div>Current Delegator</div>
                                        <OriginatorSelector
                                            updateOriginator={setOriginator}
                                        />
                                    </div>
                                    {originator !== null && (
                                        <div style={{ width: '100%' }}>
                                            <div>New Delegator</div>
                                            <OriginatorSelector
                                                updateOriginator={
                                                    setOriginator2
                                                }
                                            />
                                        </div>
                                    )}
                                    {/* <div
                                        style={{
                                            width: '100%',
                                            justifyContent: 'space-between',
                                        }}
                                        className={styles.formAmount}
                                    >
                                        <input
                                            style={{ width: '70%' }}
                                            type="text"
                                            placeholder={t('Type address')}
                                            onChange={handleInputAddress}
                                            onKeyPress={handleOnKeyPress}
                                            autoFocus
                                        />
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        />
                                    </div> */}
                                    {originator !== null &&
                                        originator2 !== null && <Donate />}
                                    {originator !== null &&
                                        originator2 !== null &&
                                        donation !== null && (
                                            <>
                                                <div
                                                    onClick={() =>
                                                        handleSubmit(
                                                            'requestDelegatorSwap'
                                                        )
                                                    }
                                                    style={{
                                                        marginTop: '24px',
                                                    }}
                                                    className="buttonBlack"
                                                >
                                                    <div>
                                                        REQUEST DELEGATOR SWAP
                                                    </div>
                                                </div>
                                                <div className={styles.gasTxt}>
                                                    {t('GAS_AROUND')} 1-2 ZIL
                                                </div>
                                            </>
                                        )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('confirmDelegatorSwap')
                                }
                                className={
                                    active === 'confirmDelegatorSwap'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>CONFIRM DELEGATOR SWAP</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={ContinueArrow}
                                        alt="confirmDelegatorSwap-ico"
                                    />
                                </div>
                            </div>
                            {active === 'confirmDelegatorSwap' && (
                                <div className={styles.cardRight}>
                                    <div
                                        style={{
                                            width: '100%',
                                            justifyContent: 'space-between',
                                        }}
                                        className={styles.formAmount}
                                    >
                                        <input
                                            style={{ width: '70%' }}
                                            type="text"
                                            placeholder={t('Type address')}
                                            onChange={handleInputAddress}
                                            onKeyPress={handleOnKeyPress}
                                            autoFocus
                                        />
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div
                                                className={
                                                    legend2 === 'CONTINUE'
                                                        ? 'continueBtn'
                                                        : ''
                                                }
                                                onClick={() => {
                                                    handleSave2()
                                                }}
                                            >
                                                {legend2 === 'CONTINUE' ? (
                                                    <Image
                                                        src={ContinueArrow}
                                                        alt="arrow"
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            marginTop: '5px',
                                                        }}
                                                    >
                                                        <Image
                                                            width={40}
                                                            src={TickIco}
                                                            alt="tick"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {legend2 === 'SAVED' && <Donate />}
                                    {donation !== null && (
                                        <>
                                            <div
                                                onClick={() =>
                                                    handleSubmit(
                                                        'confirmDelegatorSwap'
                                                    )
                                                }
                                                style={{
                                                    marginTop: '24px',
                                                    width: '100%',
                                                }}
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    CONFIRM DELEGATOR SWAP
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('revokeDelegatorSwap')
                                }
                                className={
                                    active === 'revokeDelegatorSwap'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>REVOKE DELEGATOR SWAP</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={ContinueArrow}
                                        alt="revokeDelegatorSwap-ico"
                                    />
                                </div>
                            </div>
                            {active === 'revokeDelegatorSwap' && (
                                <div className={styles.cardRight}>
                                    <div
                                        style={{
                                            marginTop: '-12%',
                                            marginBottom: '-12%',
                                        }}
                                    >
                                        <Donate />
                                    </div>
                                    {donation !== null && (
                                        <>
                                            <div
                                                onClick={() =>
                                                    handleSubmit(
                                                        'revokeDelegatorSwap'
                                                    )
                                                }
                                                style={{
                                                    marginTop: '24px',
                                                    width: '100%',
                                                }}
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    REVOKE DELEGATOR SWAP
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActiveWrapper}>
                            <div
                                onClick={() =>
                                    toggleActive('rejectDelegatorSwap')
                                }
                                className={
                                    active === 'rejectDelegatorSwap'
                                        ? styles.cardActive
                                        : styles.card
                                }
                            >
                                <div>REJECT DELEGATOR SWAP</div>
                                <div className={styles.icoWrapper}>
                                    <Image
                                        src={ContinueArrow}
                                        alt="rejectDelegatorSwap-ico"
                                    />
                                </div>
                            </div>
                            {active === 'rejectDelegatorSwap' && (
                                <div className={styles.cardRight}>
                                    <div
                                        style={{
                                            width: '100%',
                                            justifyContent: 'space-between',
                                        }}
                                        className={styles.formAmount}
                                    >
                                        <input
                                            style={{ width: '70%' }}
                                            type="text"
                                            placeholder={t('Type address')}
                                            onChange={handleInputAddress}
                                            onKeyPress={handleOnKeyPress}
                                            autoFocus
                                        />
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div
                                                className={
                                                    legend2 === 'CONTINUE'
                                                        ? 'continueBtn'
                                                        : ''
                                                }
                                                onClick={() => {
                                                    handleSave2()
                                                }}
                                            >
                                                {legend2 === 'CONTINUE' ? (
                                                    <Image
                                                        src={ContinueArrow}
                                                        alt="arrow"
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            marginTop: '5px',
                                                        }}
                                                    >
                                                        <Image
                                                            width={40}
                                                            src={TickIco}
                                                            alt="tick"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {legend2 === 'SAVED' && <Donate />}
                                    {donation !== null && (
                                        <>
                                            <div
                                                onClick={() =>
                                                    handleSubmit(
                                                        'rejectDelegatorSwap'
                                                    )
                                                }
                                                style={{
                                                    marginTop: '24px',
                                                    width: '100%',
                                                }}
                                                className="actionBtnBlue"
                                            >
                                                <div className={styles.txtBtn}>
                                                    REJECT DELEGATOR SWAP
                                                </div>
                                            </div>
                                            <div className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default StakeWallet