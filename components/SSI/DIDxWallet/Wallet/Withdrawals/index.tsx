import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import React, { useState, useCallback, useRef } from 'react'
import { Donate, SearchBarWallet, Selector } from '../../../..'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { $donation, updateDonation } from '../../../../../src/store/donation'
import {
    updateModalTx,
    $selectedCurrency,
    updateModalWithdrawal,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import { setTxStatusLoading, setTxId } from '../../../../../src/app/actions'
import { RootState } from '../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import { $resolvedInfo } from '../../../../../src/store/resolvedInfo'
import smartContract from '../../../../../src/utils/smartContract'
import ContinueArrow from '../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../src/assets/icons/tick.svg'
import toastTheme from '../../../../../src/hooks/toastTheme'

function Component() {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const searchInput = useRef(null)

    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const donation = useStore($donation)
    const resolvedInfo = useStore($resolvedInfo)
    const currency = useStore($selectedCurrency)

    const [source, setSource] = useState('')
    const [input, setInput] = useState<any>(0) // the amount to transfer
    const [recipientType, setRecipientType] = useState('')

    const [username, setUsername] = useState('')
    const [search, setSearch] = useState('')
    const [domain, setDomain] = useState('default')
    // const [inputB, setInputB] = useState('')
    const [input2, setInput2] = useState('') // the recipient (address)

    const [legend, setLegend] = useState('continue')
    const [legendCurrency, setLegendCurrency] = useState('continue')
    const [button, setButton] = useState('button primary')
    const [hideDonation, setHideDonation] = useState(true)
    const [hideSubmit, setHideSubmit] = useState(true)
    const [loadingUser, setLoadingUser] = useState(false)

    const handleOnChange = (value) => {
        setSource(value)
        setInput(0)
        setUsername('')
        setDomain('default')
        // setInputB('')
        setInput2('')
        setRecipientType('')
        setHideDonation(true)
        setHideSubmit(true)
    }

    const handleOnChangeRecipientType = (value) => {
        setUsername('')
        setDomain('default')
        setInput2('')
        updateDonation(null)
        setHideDonation(true)
        setHideSubmit(true)
        setLegend('continue')
        setButton('button primary')
        setRecipientType(value)
    }

    // const handleOnChangeB = (value) => {
    //     setInputB(value)
    // }

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHideDonation(true)
        setHideSubmit(true)
        setLegendCurrency('continue')
        setButton('button primary')
        let input = event.target.value
        setInput(input)
    }

    const handleInput2 = (event: { target: { value: any } }) => {
        setHideDonation(true)
        setHideSubmit(true)
        setLegend('continue')
        setButton('button primary')
        let addr_input = event.target.value
        try {
            addr_input = zcrypto.fromBech32Address(addr_input)
            setInput2(addr_input)
        } catch (error) {
            try {
                addr_input = zcrypto.toChecksumAddress(addr_input)
                setInput2(addr_input)
            } catch {
                toast.error('Wrong address format.', {
                    position: 'top-right',
                    autoClose: 3000,
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
    }

    const handleOnKeyPress = async ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveCurrency()
        }
    }

    const handleOnKeyPress2 = async ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    }

    const handleSave = async () => {
        if (input === 0) {
            toast.error(t('The amount cannot be zero.'), {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 4,
            })
        } else if (input2 === '') {
            toast.error('The address of the recipient cannot be null.', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 5,
            })
        } else {
            // if (currency === 'ZIL' && inputB === '') {
            //     toast.error('Choose the type of recipient.', {
            //         position: 'top-right',
            //         autoClose: 3000,
            //         hideProgressBar: false,
            //         closeOnClick: true,
            //         pauseOnHover: true,
            //         draggable: true,
            //         progress: undefined,
            //         theme: toastTheme(isLight),
            //         toastId: 6,
            //     })
            // } else {
            setLegend('saved')
            setButton('button')
            setHideDonation(false)
            setHideSubmit(false)
            // }
        }
    }

    const handleSaveCurrency = () => {
        const input_ = Number(input)
        if (!isNaN(input_)) {
            if (input_ === 0) {
                toast.error(t('The amount cannot be zero.'), {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 1,
                })
            } else {
                if (input_ < 6) {
                    toast.warn(
                        'This transaction costs 4-6 ZIL, thus greater than the amount you want to send.',
                        {
                            position: 'top-right',
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
                }
                setLegendCurrency('saved')
            }
        } else {
            toast.error(t('The input is not a number.'), {
                position: 'top-right',
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

    const handleSubmit = async () => {
        if (resolvedInfo !== null) {
            const zilpay = new ZilPayBase()
            const _currency = tyron.Currency.default.tyron(currency!, input)
            const txID = _currency.txID
            const amount = _currency.amount

            let beneficiary: tyron.TyronZil.Beneficiary
            if (source === 'DIDxWallet' && recipientType === 'username') {
                await tyron.SearchBarUtil.default
                    .Resolve(net, resolvedInfo.addr!)
                    .then(async (res: any) => {
                        console.log(Number(res?.version.slice(8, 11)))
                        if (Number(res?.version.slice(8, 11)) < 5.6) {
                            const domainId =
                                '0x' +
                                (await tyron.Util.default.HashString(username))
                            const recipient =
                                await tyron.SearchBarUtil.default.fetchAddr(
                                    net,
                                    domainId,
                                    domain
                                )
                            beneficiary = {
                                constructor:
                                    tyron.TyronZil.BeneficiaryConstructor
                                        .Recipient,
                                addr: recipient,
                            }
                        } else {
                            const domainId =
                                '0x' +
                                (await tyron.Util.default.HashString(username))
                            beneficiary = {
                                constructor:
                                    tyron.TyronZil.BeneficiaryConstructor
                                        .NftUsername,
                                username: domainId,
                                domain: domain,
                            }
                        }
                    })
                    .catch((err) => {
                        throw err
                    })
            } else {
                beneficiary = {
                    constructor:
                        tyron.TyronZil.BeneficiaryConstructor.Recipient,
                    addr: input2,
                }
            }

            try {
                switch (source) {
                    case 'DIDxWallet':
                        let tx_params: unknown
                        try {
                            let donation_ = donation
                            if (donation_ === null) {
                                donation_ = 0
                            }
                            const tyron_ = await tyron.Donation.default.tyron(
                                donation_
                            )

                            switch (txID) {
                                case 'SendFunds':
                                    {
                                        let tag = 'AddFunds'
                                        // if (inputB === 'contract') {
                                        //     tag = 'AddFunds'
                                        // }
                                        tx_params =
                                            await tyron.TyronZil.default.SendFunds(
                                                resolvedInfo?.addr!,
                                                tag,
                                                beneficiary!,
                                                String(amount),
                                                tyron_
                                            )
                                    }
                                    break
                                default:
                                    tx_params =
                                        await tyron.TyronZil.default.Transfer(
                                            resolvedInfo?.addr!,
                                            currency!.toLowerCase(),
                                            beneficiary!,
                                            String(amount),
                                            tyron_
                                        )
                                    break
                            }
                        } catch (error) {
                            throw new Error('DIDxWallet withdrawal error.')
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
                                toastId: 10,
                            }
                        )
                        dispatch(setTxStatusLoading('true'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        let tx = await tyron.Init.default.transaction(net)

                        await zilpay
                            .call({
                                contractAddress: resolvedInfo?.addr!,
                                transition: txID,
                                params: tx_params as unknown as Record<
                                    string,
                                    unknown
                                >[],
                                amount: String(donation),
                            })
                            .then(async (res: any) => {
                                dispatch(setTxId(res.ID))
                                dispatch(setTxStatusLoading('submitted'))
                                tx = await tx.confirm(res.ID)
                                if (tx.isConfirmed()) {
                                    dispatch(setTxStatusLoading('confirmed'))
                                    updateDonation(null)
                                    updateModalWithdrawal(false)
                                    window.open(
                                        `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                    )
                                } else if (tx.isRejected()) {
                                    updateModalWithdrawal(false)
                                    dispatch(setTxStatusLoading('failed'))
                                }
                            })
                            .catch((err: any) => {
                                dispatch(setTxStatusLoading('idle'))
                                throw new Error(
                                    'Could not withdraw from DIDxWallet.'
                                )
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
                                currency!.toLowerCase()
                            )

                            const tx_params = Array()
                            const tx_to = {
                                vname: 'to',
                                type: 'ByStr20',
                                value: input2,
                            }
                            tx_params.push(tx_to)

                            const amount_ = {
                                vname: 'amount',
                                type: 'Uint128',
                                value: String(amount),
                            }
                            tx_params.push(amount_)

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
                                        toastId: 11,
                                    }
                                )
                                dispatch(setTxStatusLoading('true'))
                                updateModalTxMinimized(false)
                                updateModalTx(true)
                                let tx = await tyron.Init.default.transaction(
                                    net
                                )
                                await zilpay
                                    .call({
                                        contractAddress: token_addr,
                                        transition: txID,
                                        params: tx_params,
                                        amount: '0',
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
                                            updateDonation(null)
                                            updateModalWithdrawal(false)
                                            setTimeout(() => {
                                                window.open(
                                                    `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                                )
                                            }, 1000)
                                        } else if (tx.isRejected()) {
                                            updateModalWithdrawal(false)
                                            dispatch(
                                                setTxStatusLoading('failed')
                                            )
                                        }
                                    })
                                    .catch((err) => {
                                        dispatch(setTxStatusLoading('rejected'))
                                        updateModalTxMinimized(false)
                                        updateModalTx(true)
                                        throw new Error(
                                            'Could not withdraw from ZilPay.'
                                        )
                                    })
                            } else {
                                throw new Error(
                                    'Transaction not supported yet.'
                                )
                            }
                        }
                        break
                }
            } catch (error) {
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
        } else {
            toast.warning('Reload contract.', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 8,
            })
        }
    }

    const resolveUser = async () => {
        setLoadingUser(true)
        try {
            let username_ = search.toLowerCase()
            let domain_ = ''
            if (search.includes('@')) {
                username_ = search
                    .split('@')[1]
                    .replace('.did', '')
                    .replace('.ssi', '')
                    .toLowerCase()
                domain_ = search.split('@')[0]
            } else if (search.includes('.')) {
                if (search.split('.')[1] === 'did') {
                    username_ = search.split('.')[0].toLowerCase()
                    domain_ = 'did'
                } else if (search.split('.')[1] === 'ssi') {
                    username_ = search.split('.')[0].toLowerCase()
                } else {
                    throw Error()
                }
            }
            const domainId =
                '0x' + (await tyron.Util.default.HashString(username_))
            await tyron.SearchBarUtil.default
                .fetchAddr(net, domainId, domain_)
                .then(() => {
                    setUsername(username_)
                    setDomain(domain_)
                    setLegend('saved')
                    setHideDonation(false)
                    setHideSubmit(false)
                })
                .catch(() => {
                    throw Error
                })
        } catch (error) {
            toast.error('Verification unsuccessful.', {
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
        }
        setLoadingUser(false)
    }

    const handleInputSearch = ({
        currentTarget: { value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        updateDonation(null)
        setHideDonation(true)
        setLegend('continue')
        setSearch(value)
    }

    const optionSource = [
        {
            key: 'DIDxWallet',
            name: 'DIDxWallet',
        },
        {
            key: 'zilliqa',
            name: 'ZilPay',
        },
    ]

    // const optionType = [
    //     {
    //         key: '',
    //         name: 'Select type',
    //     },
    //     {
    //         key: 'contract',
    //         name: 'Smart contract',
    //     },
    //     {
    //         key: 'EOA',
    //         name: 'Regular address',
    //     },
    // ]

    const optionRecipient = [
        {
            key: 'username',
            name: t('NFT Username'),
        },
        {
            key: 'addr',
            name: t('Address'),
        },
    ]

    return (
        <div>
            <div className={styles.container}>
                <div className={styles.wrapperSelector}>
                    <Selector
                        option={optionSource}
                        onChange={handleOnChange}
                        placeholder={t('Select source')}
                    />
                </div>
            </div>
            {currency !== '' && source !== '' && (
                <>
                    <div className={styles.container}>
                        <code className={styles.txt}>{currency}</code>
                        <input
                            className={styles.inputCurrency}
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
                                handleSaveCurrency()
                            }}
                        >
                            <div
                                className={
                                    legendCurrency === 'continue'
                                        ? 'continueBtn'
                                        : ''
                                }
                            >
                                {legendCurrency === 'continue' ? (
                                    <Image src={ContinueArrow} alt="arrow" />
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
                    {legendCurrency === 'saved' && (
                        <>
                            {/* {currency === 'ZIL' && (
                                <div className={styles.container}>
                                    <div style={{ width: '60%' }}>
                                        <Selector
                                            option={optionType}
                                            onChange={handleOnChangeB}
                                        />
                                    </div>
                                </div>
                            )} */}
                            {source === 'DIDxWallet' && (
                                <div className={styles.container}>
                                    <div className={styles.wrapperSelector}>
                                        <Selector
                                            option={optionRecipient}
                                            onChange={
                                                handleOnChangeRecipientType
                                            }
                                            placeholder={t('SELECT_RECIPIENT')}
                                        />
                                    </div>
                                </div>
                            )}
                            {recipientType === 'username' && (
                                <div className={styles.searchBarWallet}>
                                    <SearchBarWallet
                                        resolveUsername={resolveUser}
                                        handleInput={handleInputSearch}
                                        input={search}
                                        loading={loadingUser}
                                        saved={legend === 'saved'}
                                    />
                                </div>
                            )}
                            {(source === 'zilliqa' && currency !== 'ZIL') ||
                            // (source === 'zilliqa' &&
                            //     currency === 'ZIL' &&
                            //     inputB !== '')
                            // ||
                            (source === 'DIDxWallet' &&
                                recipientType === 'addr') ? (
                                <div className={styles.containerInput}>
                                    <div className={styles.wrapperSelector}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder={t(
                                                'Type beneficiary address'
                                            )}
                                            onChange={handleInput2}
                                            onKeyPress={handleOnKeyPress2}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginLeft: '2%',
                                        }}
                                        onClick={() => {
                                            handleSave()
                                        }}
                                    >
                                        <div
                                            className={
                                                legend === 'continue'
                                                    ? 'continueBtn'
                                                    : ''
                                            }
                                        >
                                            {legend === 'continue' ? (
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
                            ) : (
                                <></>
                            )}
                        </>
                    )}
                </>
            )}
            {!hideDonation &&
                source === 'DIDxWallet' &&
                ((username !== '' && domain !== 'default') ||
                    input2 !== '') && <Donate />}
            {!hideSubmit && (donation !== null || source == 'zilliqa') && (
                <div
                    style={{
                        marginTop: '10%',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        <span>{t('TRANSFER')}&nbsp;</span>
                        <span style={{ textTransform: 'none' }}>
                            {input} {currency}
                        </span>
                    </div>
                    {currency === 'ZIL' && (
                        <h5 className={styles.gasTxt}>
                            {t('GAS_AROUND')} 2 ZIL
                        </h5>
                    )}
                    {currency !== 'ZIL' && (
                        <h5 className={styles.gasTxt}>
                            {t('GAS_AROUND')} 4-6 ZIL
                        </h5>
                    )}
                </div>
            )}
        </div>
    )
}

export default Component
