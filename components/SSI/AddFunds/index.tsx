import React, { useState, useCallback, useEffect } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { $donation, updateDonation } from '../../../src/store/donation'
import {
    OriginatorAddress,
    Donate,
    Selector,
    Spinner,
    ConnectButton,
    WalletInfo,
} from '../..'
import { ZilPayBase } from '../../ZilPay/zilpay-base'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import {
    $originatorAddress,
    updateOriginatorAddress,
} from '../../../src/store/originatorAddress'
import { setTxStatusLoading, setTxId } from '../../../src/app/actions'
import { $doc } from '../../../src/store/did-doc'
import { RootState } from '../../../src/app/reducers'
import { $buyInfo, updateBuyInfo } from '../../../src/store/buyInfo'
import {
    updateModalAddFunds,
    updateModalTx,
    updateTxType,
    updateModalTxMinimized,
} from '../../../src/store/modal'
import { useTranslation } from 'next-i18next'
import { $resolvedInfo } from '../../../src/store/resolvedInfo'
import smartContract from '../../../src/utils/smartContract'
import ContinueArrow from '../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../src/assets/icons/tick.svg'
import toastTheme from '../../../src/hooks/toastTheme'
import wallet from '../../../src/hooks/wallet'

interface InputType {
    type: string
    coin?: string
}

function Component(props: InputType) {
    const { type, coin } = props
    const dispatch = useDispatch()
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const { checkBalance } = wallet()
    const doc = useStore($doc)
    const donation = useStore($donation)
    const net = useSelector((state: RootState) => state.modal.net)
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const buyInfo = useStore($buyInfo)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const originator_address = useStore($originatorAddress)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark

    let coin_: string = ''
    if (coin !== undefined) {
        coin_ = coin
    }

    const [currency, setCurrency] = useState(coin_)
    const [input, setInput] = useState(0) // the amount to transfer
    const [legend, setLegend] = useState('CONTINUE')

    const [hideDonation, setHideDonation] = useState(true)
    const [hideSubmit, setHideSubmit] = useState(true)
    const [isBalanceAvailable, setIsBalanceAvailable] = useState(true)
    const [loadingInfoBal, setLoadingInfoBal] = useState(false)

    let recipient: string
    if (type === 'buy') {
        recipient = loginInfo.address
    } else {
        recipient = resolvedInfo?.addr!
    }

    useEffect(() => {
        if (
            doc?.version.slice(8, 9) === undefined ||
            Number(doc?.version.slice(8, 9)) >= 4 ||
            doc?.version.slice(0, 4) === 'init' ||
            doc?.version.slice(0, 3) === 'dao' ||
            doc?.version.slice(0, 10) === 'DIDxWALLET'
        ) {
            if (currency !== '' && currency !== 'ZIL' && isBalanceAvailable) {
                paymentOptions(currency.toLowerCase(), recipient.toLowerCase())
            }
        } else {
            toast.warning(`Feature unavailable. Upgrade SSI.`, {
                position: 'bottom-left',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 1,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const paymentOptions = async (id: string, addr: string) => {
        try {
            // Fetch token address
            let token_addr: string
            await tyron.SearchBarUtil.default
                .fetchAddr(net, 'init', 'did')
                .then(async (init_addr) => {
                    return await getSmartContract(init_addr, 'services')
                })
                .then(async (get_services) => {
                    return await tyron.SmartUtil.default.intoMap(
                        get_services.result.services
                    )
                })
                .then(async (services) => {
                    // Get token address
                    token_addr = services.get(id)
                    const balances = await getSmartContract(
                        token_addr,
                        'balances'
                    )
                    return await tyron.SmartUtil.default.intoMap(
                        balances.result.balances
                    )
                })
                .then((balances_) => {
                    // Get balance of the logged in address
                    const balance = balances_.get(addr)
                    if (balance !== undefined) {
                        const _currency = tyron.Currency.default.tyron(id)
                        updateBuyInfo({
                            recipientOpt: buyInfo?.recipientOpt,
                            anotherAddr: buyInfo?.anotherAddr,
                            currency: currency,
                            currentBalance: balance / _currency.decimals,
                        })
                        let price: number
                        switch (id.toLowerCase()) {
                            case 'xsgd':
                                price = 15
                                break
                            default:
                                price = 10
                                break
                        }
                        if (balance >= price * _currency.decimals) {
                            updateBuyInfo({
                                recipientOpt: buyInfo?.recipientOpt,
                                anotherAddr: buyInfo?.anotherAddr,
                                currency: currency,
                                currentBalance: balance / _currency.decimals,
                                isEnough: true,
                            })
                        }
                    }
                })
                .catch(() => {
                    throw new Error('Not able to fetch balance')
                })
        } catch (error) {
            setIsBalanceAvailable(false)
            toast.error(String(error), {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 2,
            })
        }
    }

    const fetchBalance = async () => {
        if (currency !== 'ZIL') {
            updateBuyInfo({
                recipientOpt: buyInfo?.recipientOpt,
                anotherAddr: buyInfo?.anotherAddr,
                currency: currency,
                currentBalance: 0,
                isEnough: false,
            })
            paymentOptions(currency.toLowerCase(), recipient.toLowerCase())
        }
    }

    const handleOnChange = (value) => {
        setInput(0)
        setHideDonation(true)
        setHideSubmit(true)
        setLegend('CONTINUE')
        setCurrency(value)
    }

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(0)
        setHideDonation(true)
        setHideSubmit(true)
        setLegend('CONTINUE')
        let input = event.target.value
        const re = /,/gi
        input = input.replace(re, '.')
        const input_ = Number(input)
        if (!isNaN(input_)) {
            setInput(input_)
        } else {
            toast.error(t('The input is not a number.'), {
                position: 'bottom-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 3,
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

    const handleSave = async () => {
        const isEnough = await checkBalance(currency, input, setLoadingInfoBal)
        if (input === 0) {
            toast.error(t('The amount cannot be zero.'), {
                position: 'bottom-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 4,
            })
        } else if (!isEnough) {
            toast.error('Insufficient balance.', {
                position: 'bottom-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 5,
            })
        } else {
            setLegend('SAVED')
            setHideDonation(false)
            setHideSubmit(false)
        }
    }

    const handleSubmit = async () => {
        // @todo-checked add loading/spinner: loading will not show up because tx modal pop up - if we add loading/setState it will cause error "can't perform react state update.."
        try {
            if (originator_address?.value !== null) {
                const zilpay = new ZilPayBase()
                const _currency = tyron.Currency.default.tyron(currency, input)
                const txID = _currency.txID
                const amount = _currency.amount

                let tx = await tyron.Init.default.transaction(net)

                dispatch(setTxStatusLoading('true'))
                resetOriginator()
                updateTxType('AddFunds')
                updateModalTxMinimized(false)
                updateModalTx(true)
                switch (originator_address?.value!) {
                    case 'zilliqa':
                        switch (txID) {
                            case 'SendFunds':
                                await zilpay
                                    .call({
                                        contractAddress: recipient,
                                        transition: 'AddFunds',
                                        params: [],
                                        amount: String(input),
                                    })
                                    .then(async (res) => {
                                        dispatch(setTxId(res.ID))
                                        dispatch(
                                            setTxStatusLoading('submitted')
                                        )
                                        tx = await tx.confirm(res.ID)
                                        if (tx.isConfirmed()) {
                                            dispatch(
                                                setTxStatusLoading('confirmed')
                                            )
                                            setTimeout(() => {
                                                window.open(
                                                    `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                                )
                                            }, 1000)
                                            if (type === 'modal') {
                                                updateModalAddFunds(false)
                                            }
                                        } else if (tx.isRejected()) {
                                            dispatch(
                                                setTxStatusLoading('failed')
                                            )
                                        }
                                    })
                                    .catch((err) => {
                                        throw err
                                    })
                                break
                            default:
                                {
                                    const init_addr =
                                        await tyron.SearchBarUtil.default.fetchAddr(
                                            net,
                                            'init',
                                            'did'
                                        )
                                    const services = await getSmartContract(
                                        init_addr!,
                                        'services'
                                    )
                                    const services_ =
                                        await tyron.SmartUtil.default.intoMap(
                                            services.result.services
                                        )
                                    const token_addr = services_.get(
                                        currency.toLowerCase()
                                    )

                                    const tx_params =
                                        await tyron.TyronZil.default.AddFunds(
                                            recipient,
                                            String(amount)
                                        )

                                    if (token_addr !== undefined) {
                                        toast.info(
                                            `${t(
                                                'You’re about to transfer'
                                            )} ${input} ${currency}`,
                                            {
                                                position: 'top-center',
                                                autoClose: 6000,
                                                hideProgressBar: false,
                                                closeOnClick: true,
                                                pauseOnHover: true,
                                                draggable: true,
                                                progress: undefined,
                                                theme: toastTheme(isLight),
                                                toastId: 6,
                                            }
                                        )
                                        await zilpay
                                            .call({
                                                contractAddress: token_addr,
                                                transition: txID,
                                                params: tx_params as unknown as Record<
                                                    string,
                                                    unknown
                                                >[],
                                                amount: '0',
                                            })
                                            .then(async (res) => {
                                                dispatch(setTxId(res.ID))
                                                dispatch(
                                                    setTxStatusLoading(
                                                        'submitted'
                                                    )
                                                )
                                                tx = await tx.confirm(res.ID)
                                                if (tx.isConfirmed()) {
                                                    fetchBalance().then(() => {
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
                                                    })
                                                    if (type === 'modal') {
                                                        updateModalAddFunds(
                                                            false
                                                        )
                                                    }
                                                } else if (tx.isRejected()) {
                                                    dispatch(
                                                        setTxStatusLoading(
                                                            'failed'
                                                        )
                                                    )
                                                }
                                            })
                                            .catch((err) => {
                                                throw err
                                            })
                                    } else {
                                        throw new Error(
                                            'Token not supported yet.'
                                        )
                                    }
                                }
                                break
                        }
                        break
                    default: {
                        const addr = originator_address?.value
                        let beneficiary: tyron.TyronZil.Beneficiary
                        if (type === 'buy') {
                            beneficiary = {
                                constructor:
                                    tyron.TyronZil.BeneficiaryConstructor
                                        .Recipient,
                                addr: recipient,
                            }
                        } else {
                            await tyron.SearchBarUtil.default
                                .Resolve(net, addr!)
                                .then(async (res: any) => {
                                    if (
                                        Number(res?.version.slice(8, 11)) < 5.6
                                    ) {
                                        beneficiary = {
                                            constructor:
                                                tyron.TyronZil
                                                    .BeneficiaryConstructor
                                                    .Recipient,
                                            addr: recipient,
                                        }
                                    } else {
                                        const domainId =
                                            '0x' +
                                            (await tyron.Util.default.HashString(
                                                username!
                                            ))
                                        beneficiary = {
                                            constructor:
                                                tyron.TyronZil
                                                    .BeneficiaryConstructor
                                                    .NftUsername,
                                            username: domainId,
                                            domain: domain,
                                        }
                                    }
                                })
                                .catch(async (err) => {
                                    const domainId =
                                        '0x' +
                                        (await tyron.Util.default.HashString(
                                            username!
                                        ))
                                    beneficiary = {
                                        constructor:
                                            tyron.TyronZil
                                                .BeneficiaryConstructor
                                                .NftUsername,
                                        username: domainId,
                                        domain: domain,
                                    }
                                })
                        }
                        let _amount = '0'
                        if (donation !== null) {
                            _amount = String(donation)
                            const tyron_ = await tyron.Donation.default.tyron(
                                donation
                            )
                            let tx_params = Array()
                            switch (txID) {
                                case 'SendFunds':
                                    tx_params =
                                        await tyron.TyronZil.default.SendFunds(
                                            addr!,
                                            'AddFunds',
                                            beneficiary!,
                                            String(amount),
                                            tyron_
                                        )
                                    break
                                default:
                                    tx_params =
                                        await tyron.TyronZil.default.Transfer(
                                            addr!,
                                            currency.toLowerCase(),
                                            beneficiary!,
                                            String(amount),
                                            tyron_
                                        )
                                    break
                            }

                            toast.info(
                                `${t(
                                    'You’re about to transfer'
                                )} ${input} ${currency}`,
                                {
                                    position: 'top-center',
                                    autoClose: 6000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                    toastId: 7,
                                }
                            )
                            await zilpay
                                .call({
                                    contractAddress: originator_address?.value!,
                                    transition: txID,
                                    params: tx_params as unknown as Record<
                                        string,
                                        unknown
                                    >[],
                                    amount: _amount,
                                })
                                .then(async (res) => {
                                    dispatch(setTxId(res.ID))
                                    dispatch(setTxStatusLoading('submitted'))
                                    tx = await tx.confirm(res.ID)
                                    if (tx.isConfirmed()) {
                                        fetchBalance().then(() => {
                                            dispatch(
                                                setTxStatusLoading('confirmed')
                                            )
                                            setTimeout(() => {
                                                window.open(
                                                    `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                                )
                                            }, 1000)
                                            if (type === 'modal') {
                                                updateModalAddFunds(false)
                                            }
                                        })
                                    } else if (tx.isRejected()) {
                                        dispatch(setTxStatusLoading('failed'))
                                    }
                                })
                                .catch((err) => {
                                    throw err
                                })
                        }
                    }
                }
            }
        } catch (error) {
            dispatch(setTxStatusLoading('rejected'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            toast.error(String(error), {
                position: 'bottom-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 8,
            })
        }
        updateOriginatorAddress(null)
        updateDonation(null)
    }

    const resetOriginator = () => {
        updateOriginatorAddress(null)
        setInput(0)
        setLegend('CONTINUE')
    }

    const domainCheck = () => {
        if (domain !== '') {
            return `.${domain}`
        } else {
            return ''
        }
    }

    useEffect(() => {
        setHideDonation(true)
        updateDonation(null)
        setLegend('CONTINUE')
    }, [originator_address])

    const listCoin = tyron.Options.default.listCoin()
    const option = [...listCoin]

    return (
        <>
            {type === 'buy' ? (
                <div>
                    <p className={styles.addFundsTitle}>{t('ADD_FUNDS')}</p>
                    {loginInfo.address !== null && (
                        <p className={styles.addFundsToAddress}>
                            {t('ADD_FUNDS_INTO', {
                                name: loginInfo?.username
                                    ? `${loginInfo?.username}.did`
                                    : `did:tyron:zil...${loginInfo.address.slice(
                                          -10
                                      )}`,
                            })}
                        </p>
                    )}
                    <OriginatorAddress />
                    {originator_address?.value && (
                        <>
                            <div className={styles.walletInfo}>
                                <WalletInfo currency={currency} />
                            </div>
                            {
                                <>
                                    {currency !== '' &&
                                        originator_address.value !== '' && (
                                            <div
                                                className={styles.fundsWrapper}
                                            >
                                                <code className={styles.txt}>
                                                    {currency}
                                                </code>
                                                <input
                                                    className={styles.inputCoin}
                                                    type="text"
                                                    onChange={handleInput}
                                                    onKeyPress={
                                                        handleOnKeyPress
                                                    }
                                                />
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginLeft: '2%',
                                                    }}
                                                    onClick={() => {
                                                        if (
                                                            legend ===
                                                            'CONTINUE'
                                                        ) {
                                                            handleSave()
                                                        }
                                                    }}
                                                >
                                                    <div
                                                        className={
                                                            legend ===
                                                            'CONTINUE'
                                                                ? 'continueBtn'
                                                                : ''
                                                        }
                                                    >
                                                        {loadingInfoBal ? (
                                                            <Spinner />
                                                        ) : legend ===
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
                                                                    width={40}
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
                                        )}
                                </>
                            }
                        </>
                    )}
                    {!hideDonation &&
                        originator_address?.value !== 'zilliqa' && <Donate />}
                    {!hideSubmit &&
                        (donation !== null ||
                            originator_address?.value == 'zilliqa') && (
                            <>
                                {legend !== 'CONTINUE' && (
                                    <>
                                        <div
                                            className={
                                                styles.transferInfoWrapper
                                            }
                                        >
                                            <div
                                                className={styles.transferInfo}
                                            >
                                                {t('TRANSFER')}:&nbsp;
                                            </div>
                                            <div
                                                className={
                                                    styles.transferInfoYellow
                                                }
                                            >
                                                {input}{' '}
                                                <span
                                                    style={{
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    {currency}
                                                </span>
                                                &nbsp;
                                            </div>
                                            <div
                                                className={styles.transferInfo}
                                            >
                                                {t('TO')}&nbsp;
                                            </div>
                                            <div
                                                className={
                                                    styles.transferInfoYellow
                                                }
                                            >
                                                {loginInfo.username
                                                    ? `${loginInfo.username}.did`
                                                    : `did:tyron:zil...${loginInfo.address.slice(
                                                          -10
                                                      )}`}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                width: 'fit-content',
                                                marginTop: '10%',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div
                                                className={
                                                    isLight
                                                        ? 'actionBtnLight'
                                                        : 'actionBtn'
                                                }
                                                onClick={handleSubmit}
                                            >
                                                {t('PROCEED')}
                                            </div>
                                        </div>
                                        <h5 className={styles.gasTxt}>
                                            {t('GAS_AROUND')} 4 -7 ZIL
                                        </h5>
                                    </>
                                )}
                            </>
                        )}
                </div>
            ) : (
                <div className={type !== 'modal' ? styles.wrapperNonBuy : ''}>
                    <h2 className={styles.title}>{t('ADD_FUNDS')}</h2>
                    <>
                        <p className={styles.subtitle}>
                            {t('ADD_FUNDS_INTO', {
                                name: `${username}${domainCheck()}`,
                            })}
                        </p>
                        {loginInfo.zilAddr === null && <ConnectButton />}
                        {type !== 'modal' && loginInfo.zilAddr !== null && (
                            <div className={styles.container2}>
                                <div className={styles.select}>
                                    <Selector
                                        option={option}
                                        onChange={handleOnChange}
                                        placeholder={t('Select coin')}
                                    />
                                </div>
                            </div>
                        )}
                        {currency !== '' && (
                            <div className={styles.wrapperOriginator}>
                                <OriginatorAddress />
                            </div>
                        )}
                        {/* {originator_address?.username && (
                            <p
                                style={{
                                    marginTop: '10%',
                                    marginBottom: '10%',
                                }}
                            >
                                {t('Send funds from X into X', {
                                    source: `${originator_address?.username}@${originator_address?.domain}.did`,
                                    recipient: '',
                                })}
                                <span style={{ color: '#ffff32' }}>
                                    {username}
                                    {domainCheck()}{' '}
                                </span>
                            </p>
                        )} */}
                        {originator_address?.value && (
                            <>
                                <WalletInfo currency={currency} />
                                <h3
                                    className={styles.txt}
                                    style={{
                                        marginTop: '7%',
                                        textAlign: 'left',
                                    }}
                                >
                                    {t('ADD_FUNDS_INTO_TITLE')}{' '}
                                    <span className={styles.username}>
                                        {username}
                                        {domainCheck()}
                                    </span>
                                </h3>
                                <div className={styles.container2}>
                                    {currency !== '' && (
                                        <>
                                            <code className={styles.txt}>
                                                {currency}
                                            </code>
                                            <input
                                                className={styles.inputCoin2}
                                                type="text"
                                                placeholder={t('Type amount')}
                                                onChange={handleInput}
                                                onKeyPress={handleOnKeyPress}
                                            />

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginLeft: '2%',
                                                }}
                                                onClick={() => {
                                                    if (legend === 'CONTINUE') {
                                                        handleSave()
                                                    }
                                                }}
                                            >
                                                <div
                                                    className={
                                                        legend === 'CONTINUE' &&
                                                        !loadingInfoBal
                                                            ? 'continueBtn'
                                                            : ''
                                                    }
                                                >
                                                    {loadingInfoBal ? (
                                                        <Spinner />
                                                    ) : legend ===
                                                      'CONTINUE' ? (
                                                        <Image
                                                            src={ContinueArrow}
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
                                                                width={40}
                                                                src={TickIco}
                                                                alt="tick"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* <input
                                                        style={{
                                                            marginLeft: '2%',
                                                        }}
                                                        type="button"
                                                        className={button}
                                                        value={t(legend)}
                                                        onClick={() => {
                                                            handleSave()
                                                        }}
                                                    /> */}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {!hideDonation &&
                            originator_address?.value !== 'zilliqa' && (
                                <Donate />
                            )}
                        {!hideSubmit &&
                            (donation !== null ||
                                originator_address?.value == 'zilliqa') && (
                                <div
                                    style={{
                                        marginTop: '14%',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexDirection: 'column',
                                        marginLeft: '1%',
                                    }}
                                >
                                    <div
                                        className={
                                            isLight
                                                ? 'actionBtnLight'
                                                : 'actionBtn'
                                        }
                                        onClick={handleSubmit}
                                    >
                                        <div>
                                            {t('TRANSFER')}{' '}
                                            <span
                                                style={{
                                                    textTransform: 'none',
                                                }}
                                            >
                                                {input} {currency}
                                            </span>{' '}
                                            <span
                                                style={{
                                                    textTransform: 'lowercase',
                                                }}
                                            >
                                                {t('TO')}
                                            </span>{' '}
                                            <span
                                                style={{
                                                    textTransform: 'lowercase',
                                                }}
                                            >
                                                {username}
                                                {domainCheck()}
                                            </span>
                                        </div>
                                    </div>
                                    <h5
                                        style={{
                                            marginTop: '3%',
                                            color: 'lightgrey',
                                        }}
                                    >
                                        {currency === 'ZIL' ? (
                                            <p className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 1-2 ZIL
                                            </p>
                                        ) : (
                                            <p className={styles.gasTxt}>
                                                {t('GAS_AROUND')} 4-7 ZIL
                                            </p>
                                        )}
                                    </h5>
                                </div>
                            )}
                    </>
                </div>
            )}
        </>
    )
}

export default Component
