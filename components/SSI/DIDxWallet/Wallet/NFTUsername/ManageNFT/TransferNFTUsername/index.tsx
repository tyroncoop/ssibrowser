import React, { useState, useRef, useEffect } from 'react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { ZilPayBase } from '../../../../../../ZilPay/zilpay-base'
import { $resolvedInfo } from '../../../../../../../src/store/resolvedInfo'
import { $doc } from '../../../../../../../src/store/did-doc'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../../src/store/modal'
import {
    setTxStatusLoading,
    setTxId,
} from '../../../../../../../src/app/actions'
import { Donate, Selector } from '../../../../../..'
import {
    $donation,
    updateDonation,
} from '../../../../../../../src/store/donation'
import controller from '../../../../../../../src/hooks/isController'
import { RootState } from '../../../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import ContinueArrow from '../../../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../../../src/assets/icons/tick.svg'
import toastTheme from '../../../../../../../src/hooks/toastTheme'

function Component() {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { isController } = controller()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark

    useEffect(() => {
        isController()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const resolvedInfo = useStore($resolvedInfo)
    const doc = useStore($doc)
    const net = useSelector((state: RootState) => state.modal.net)
    const donation = useStore($donation)

    const [input, setInput] = useState('') // the recipient (address)
    const [legend, setLegend] = useState('save')
    const [button, setButton] = useState('button primary')

    const [inputAddr, setInputAddr] = useState('')
    const [address, setAddress] = useState('')
    const [legend2, setLegend2] = useState('save')
    const [selectedAddress, setSelectedAddress] = useState('')
    const [usernameType, setUsernameType] = useState('')
    const [username, setUsername] = useState('')
    const [currency, setCurrency] = useState('')

    const handleSave = async () => {
        const addr = tyron.Address.default.verification(input)
        if (addr !== '') {
            setLegend('saved')
            setButton('button')
            setInput(addr)
        } else {
            toast.error(t('Wrong address.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 5,
            })
        }
    }
    const handleInput = (event: { target: { value: any } }) => {
        setInput('')
        setSelectedAddress('')
        setInputAddr('')
        setAddress('')
        updateDonation(null)
        setLegend('save')
        setButton('button primary')
        setInput(event.target.value)
    }
    const handleOnKeyPress = async ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    }

    const handleSubmit = async () => {
        if (resolvedInfo !== null && donation !== null) {
            try {
                const zilpay = new ZilPayBase()
                let txID = 'TransferNftUsername'
                if (Number(doc?.version.slice(8, 9)) < 5) {
                    txID = 'TransferNFTUsername'
                }

                const tx_username =
                    usernameType === 'default' ? resolvedInfo?.name! : username
                const guardianship = await tyron.TyronZil.default.OptionParam(
                    tyron.TyronZil.Option.some,
                    'ByStr20',
                    input
                )
                const tx_did =
                    selectedAddress === 'SSI'
                        ? resolvedInfo?.addr!
                        : selectedAddress === 'ADDR'
                            ? address
                            : input
                const tyron_ = await tyron.Donation.default.tyron(donation!)

                const params = await tyron.TyronZil.default.TransferNftUsername(
                    tx_username,
                    guardianship,
                    currency.toLowerCase(),
                    input,
                    tx_did,
                    tyron_,
                    doc?.version
                )

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)

                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
                        transition: txID,
                        params: params as unknown as Record<string, unknown>[],
                        amount: String(donation),
                    })
                    .then(async (res) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        try {
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                dispatch(setTxStatusLoading('confirmed'))
                                window.open(
                                    `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                )
                                updateDonation(null)
                            } else if (tx.isRejected()) {
                                dispatch(setTxStatusLoading('failed'))
                            }
                        } catch (err) {
                            updateModalTx(false)
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
                toastId: 12,
            })
        }
    }

    const handleOnChangeSelectedAddress = (value) => {
        setAddress('')
        setInputAddr('')
        setSelectedAddress(value)
    }

    const handleInputAddr = (event: { target: { value: any } }) => {
        setAddress('')
        setLegend2('save')
        setInputAddr(event.target.value)
    }

    const handleOnKeyPress2 = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            validateInputAddr()
        }
    }

    const validateInputAddr = () => {
        const addr = tyron.Address.default.verification(inputAddr)
        if (addr !== '') {
            setAddress(addr)
            setLegend2('saved')
        } else {
            toast.error(t('Wrong address.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 5,
            })
        }
    }

    const handleOnChangeUsername = (value) => {
        setUsernameType(value)
    }

    const handleOnChangeCurrency = (value) => {
        updateDonation(null)
        setCurrency(value)
    }

    const handleInputUsername = ({
        currentTarget: { value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(value.toLowerCase())
    }

    const optionUsername = [
        {
            key: 'default',
            name: resolvedInfo?.name,
        },
        {
            key: 'input',
            name: t('Input Username'),
        },
    ]

    const optionBeneficiary = [
        {
            key: 'SSI',
            name: t('This SSI'),
        },
        {
            key: 'RECIPIENT',
            name: t('The recipient'),
        },
        {
            key: 'ADDR',
            name: t('Another address'),
        },
    ]

    const optionCurrency = [
        {
            key: 'TYRON',
            name: '15 TYRON',
        },
        {
            key: 'FREE',
            name: t('FREE'),
        },
    ]

    return (
        <div className={styles.wrapper}>
            <h3 style={{ color: '#ffff32', marginBottom: '10%' }}>
                {t('TRANSFER')}{' '}
                <span className={styles.username}>
                    {usernameType === 'default'
                        ? resolvedInfo?.name
                        : usernameType === 'input'
                            ? username
                            : ''}
                </span>{' '}
                {t('NFT Username')}
            </h3>
            <div className={styles.contentWrapper}>
                <div>
                    <Selector
                        option={optionUsername}
                        onChange={handleOnChangeUsername}
                        placeholder={t('Select Username')}
                    />
                </div>
                {usernameType === 'input' && (
                    <div className={styles.container}>
                        <input
                            type="text"
                            style={{ width: '100%' }}
                            onChange={handleInputUsername}
                            placeholder={t('Type username')}
                            value={username}
                        />
                    </div>
                )}
                {usernameType !== '' && (
                    <div style={{ marginTop: '14%' }}>
                        <h4 className={styles.txt}>{t('RECIPIENT')}</h4>
                        <div className={styles.containerInput}>
                            <input
                                type="text"
                                className={styles.input}
                                style={{ marginRight: '2%' }}
                                placeholder={t('Type address')}
                                onChange={handleInput}
                                onKeyPress={handleOnKeyPress}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <div
                                    className={
                                        legend === 'save' ? 'continueBtn' : ''
                                    }
                                    onClick={handleSave}
                                >
                                    {legend === 'save' ? (
                                        <Image
                                            src={ContinueArrow}
                                            alt="arrow"
                                        />
                                    ) : (
                                        <div style={{ marginTop: '5px' }}>
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
                    </div>
                )}
                {legend === 'saved' && (
                    <div style={{ marginTop: '14%' }}>
                        <h4 className={styles.txt}>{t('BENEFICIARY DID')}</h4>
                        <div style={{ marginBottom: '5%' }}>
                            <Selector
                                option={optionBeneficiary}
                                onChange={handleOnChangeSelectedAddress}
                                placeholder={t('Select DID')}
                            />
                        </div>
                    </div>
                )}
                {selectedAddress === 'ADDR' && (
                    <div className={styles.wrapperInputAddr}>
                        <input
                            type="text"
                            className={styles.input}
                            style={{ marginRight: '2%' }}
                            onChange={handleInputAddr}
                            onKeyPress={handleOnKeyPress2}
                            placeholder={t('Type address')}
                        />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <div
                                className={
                                    legend2 === 'save' ? 'continueBtn' : ''
                                }
                                onClick={validateInputAddr}
                            >
                                {legend2 === 'save' ? (
                                    <Image src={ContinueArrow} alt="arrow" />
                                ) : (
                                    <div style={{ marginTop: '5px' }}>
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
                )}
                {legend === 'saved' &&
                    (selectedAddress === 'SSI' ||
                        selectedAddress === 'RECIPIENT' ||
                        (selectedAddress === 'ADDR' && address !== '')) && (
                        <div>
                            <div style={{ marginTop: '14%' }}>
                                <h4 className={styles.txt}>{t('PAYMENT')}</h4>
                                <div>
                                    <Selector
                                        option={optionCurrency}
                                        onChange={handleOnChangeCurrency}
                                        placeholder={t('Select Currency')}
                                    />
                                </div>
                            </div>
                            {currency !== '' && <Donate />}
                            {donation !== null && (
                                <div
                                    style={{
                                        marginTop: '14%',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
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
                                            <span className={styles.username}>
                                                {usernameType === 'default'
                                                    ? resolvedInfo?.name!
                                                    : username}
                                            </span>{' '}
                                            {t('NFT Username')}
                                        </div>
                                    </div>
                                    <h5
                                        className={styles.txt}
                                        style={{ marginTop: '3%' }}
                                    >
                                        {t('GAS_AROUND')} 14 ZIL
                                    </h5>
                                </div>
                            )}
                        </div>
                    )}
            </div>
        </div>
    )
}

export default Component
