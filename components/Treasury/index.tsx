import React, { useState, useCallback } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { ZilPayBase } from '../ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { $resolvedInfo } from '../../src/store/resolvedInfo'
import { decryptKey } from '../../src/lib/dkms'
import { setTxStatusLoading, setTxId } from '../../src/app/actions'
import { updateModalTx, updateModalTxMinimized } from '../../src/store/modal'
import { RootState } from '../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import Selector from '../Selector'
import smartContract from '../../src/utils/smartContract'
import { $arconnect } from '../../src/store/arconnect'
import toastTheme from '../../src/hooks/toastTheme'

function Component() {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const dispatch = useDispatch()
    const arConnect = useStore($arconnect)
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)

    const [txName, setTxName] = useState('')
    const [inputA, setInputA] = useState(0)
    const [inputB, setInputB] = useState('')

    const map = new Map()
    const [balances, setBalances] = useState(map)
    const [price, setPrice] = useState('')

    const handleOnChange = async (value) => {
        setInputA(0)
        setInputB('')
        setBalances(map)
        setPrice('')
        const selection = value
        if (arConnect === null) {
            toast.warning('Connect with ArConnect.', {
                position: 'top-center',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
            })
        } else if (resolvedInfo !== null) {
            setTxName(selection)

            try {
                const balances_ = await getSmartContract(
                    resolvedInfo?.addr!,
                    'balances'
                )
                const balances = await tyron.SmartUtil.default.intoMap(
                    balances_.result.balances
                )
                setBalances(balances)
                const price_ = await getSmartContract(
                    resolvedInfo?.addr!,
                    'price'
                )
                setPrice(price_.result.price)
            } catch (error) {
                throw new Error('could not fetch balances')
            }
        }
    }

    const handleInputA = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputA(0)
        let input = event.target.value
        const re = /,/gi
        input = input.replace(re, '.')
        const input_ = Number(input)
        if (!isNaN(input_)) {
            if (input_ === 0) {
                toast.error(t('The amount cannot be zero.'), {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
            } else {
                setInputA(input_)
            }
        } else {
            toast.error(t('The input is not a number.'), {
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

    const handleInputB = (event: { target: { value: any } }) => {
        setInputB('')
        const input = event.target.value
        setInputB(String(input).toLowerCase())
    }

    const handleSubmit = async () => {
        if (arConnect !== null && resolvedInfo !== null) {
            try {
                const zilpay = new ZilPayBase()
                let params = Array()
                let amount_ = '0'
                if (txName === 'Buy_Tyron') {
                    if (inputA === 0 || inputB === '') {
                        throw new Error('required input is missing')
                    }
                    amount_ = String(inputA * Number(price))
                    const t_amount = inputA * 1e12
                    const zil_amount = String(t_amount * Number(price))
                    const data = inputB + zil_amount
                    const hash = await tyron.Util.default.HashString(data)

                    const domainId =
                        '0x' + (await tyron.Util.default.HashString(inputB))
                    const result: any = await tyron.SearchBarUtil.default
                        .fetchAddr(net, domainId, 'did')
                        .then(async (addr) => {
                            return await tyron.SearchBarUtil.default.Resolve(
                                net,
                                addr
                            )
                        })
                        .catch(() => {
                            throw new Error('Unregistered NFT Domain Name')
                        })

                    let signature: string
                    try {
                        const encrypted_key = result.dkms?.get('authentication')
                        const private_key = await decryptKey(
                            arConnect,
                            encrypted_key
                        )
                        const public_key =
                            zcrypto.getPubKeyFromPrivateKey(private_key)
                        signature =
                            '0x' +
                            zcrypto.sign(
                                Buffer.from(hash, 'hex'),
                                private_key,
                                public_key
                            )
                    } catch (error) {
                        throw new Error('Identity verification unsuccessful.')
                    }

                    params = await tyron.TyronZil.default.Treasury(
                        inputB,
                        signature
                    )
                }

                if (txName === 'Buy_Tyron') {
                    toast.info(
                        `You're about to buy ${inputA} $TYRON from the Tyron Coop!`,
                        {
                            position: 'top-center',
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        }
                    )
                }

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)
                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
                        transition: txName,
                        params: params,
                        amount: amount_,
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
                        } else if (tx.isRejected()) {
                            dispatch(setTxStatusLoading('failed'))
                            setTimeout(() => {
                                toast.error(t('Transaction failed.'), {
                                    position: 'top-right',
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                })
                            }, 1000)
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
                            theme: toastTheme(isLight),
                        })
                    })
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
                    toastId: 12,
                })
            }
        }
    }

    const option = [
        {
            key: 'Buy_Tyron',
            name: 'Buy $TYRON',
        },
        {
            key: 'Join_PSC',
            name: 'Join our Profit-Sharing Community',
        },
    ]

    return (
        <div style={{ marginTop: '100px', textAlign: 'center' }}>
            <h1 className={styles.headline}>
                <span style={{ textTransform: 'lowercase' }}>
                    {username}&apos;s
                </span>{' '}
                SSI
            </h1>
            <h2 style={{ color: 'silver', marginBottom: '70px' }}>
                treasury decentralized application
            </h2>
            <h3 style={{ marginBottom: '7%' }}>
                <a
                    href={`https://ssiprotocol.notion.site/ssiprotocol/Buy-TYRON-from-the-Tyron-Coop-02749fd685584b119b12f263d9685d98`}
                    rel="noreferrer"
                    target="_blank"
                >
                    buy TYRON tokens from the tyron coop
                </a>
            </h3>
            <div style={{ width: '55%' }}>
                <Selector
                    option={option}
                    onChange={handleOnChange}
                    placeholder="Select action"
                />
            </div>
            {txName === 'Buy_Tyron' && (
                <div className={styles.container}>
                    <p>
                        In this dapp, you can{' '}
                        <strong>buy $TYRON at {price} ZIL per token</strong>.
                    </p>
                    <p>
                        It&apos;s only available for self-sovereign identities
                        that have a Tyron Verifiable Credential. Get yours at
                        tyron.vc!
                    </p>
                    <div style={{ marginTop: '7%', marginBottom: '7%' }}>
                        <code>
                            <ul>
                                <li>
                                    Available for sale:{' '}
                                    {balances.get('tyron') / 1e12} TYRON
                                </li>
                            </ul>
                        </code>
                    </div>
                    <div className={styles.containerBuy}>
                        <code>TYRON</code>
                        <input
                            style={{ width: '30%' }}
                            type="text"
                            placeholder="Type amount that you want to buy"
                            onChange={handleInputA}
                        />
                        {inputA !== 0 && (
                            <code>Cost: {inputA * Number(price)} ZIL</code>
                        )}
                    </div>
                    <section className={styles.containerBuy}>
                        <label>NFT</label>
                        username
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Type your NFT Username without .did"
                            onChange={handleInputB}
                        />
                        {inputB !== '' && (
                            <code>
                                Your current balance:{' '}
                                {balances.get(inputB) / 1e12} TYRON
                            </code>
                        )}
                    </section>
                </div>
            )}
            {txName === 'Join_PSC' && (
                <section className={styles.containerX}>
                    <p style={{ marginTop: '10%' }}>Coming soon!</p>
                </section>
            )}
            {txName === 'Buy_Tyron' && (
                <div style={{ marginTop: '10%' }}>
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        <span>{txName}</span>
                    </div>
                    {txName === 'Buy_Tyron' && (
                        <p className={styles.gascost}>Gas: around 2 ZIL</p>
                    )}
                </div>
            )}
        </div>
    )
}

export default Component
