import React, { useState, useCallback } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { $resolvedInfo } from '../../../../../src/store/resolvedInfo'
import { setTxStatusLoading, setTxId } from '../../../../../src/app/actions'
import { RootState } from '../../../../../src/app/reducers'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import { useTranslation } from 'next-i18next'
import toastTheme from '../../../../../src/hooks/toastTheme'
import { Spinner } from '../../../..'
import TickIco from '../../../../../src/assets/icons/tick.svg'
import ContinueArrow from '../../../../../src/assets/icons/continue_arrow.svg'

function Component({
    txName,
    handleIssuer,
    issuerName,
    issuerDomain,
    setIssuerInput,
    savedIssuer,
    setSavedIssuer,
    loading,
}) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)

    const [issuerSignature, setIssuerSignature] = useState('')
    const [savedSignature, setSavedSignature] = useState(false)

    const onChangeIssuer = (event: { target: { value: any } }) => {
        setSavedIssuer(false)
        setIssuerInput('')
        setIssuerSignature('')
        const input = String(event.target.value)
        setIssuerInput(input)
    }

    const handleOnKeyPressIssuer = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleIssuer()
        }
    }

    const handleOnKeyPressSignature = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveSignature()
        }
    }

    const handleSaveSignature = () => {
        if (
            issuerSignature.length > 2 &&
            issuerSignature.slice(0, 2) !== '0x'
        ) {
            toast.error('A DID Signature must start with 0x', {
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
            setSavedSignature(true)
        }
    }

    const handleIssuerSignature = (event: { target: { value: any } }) => {
        setSavedSignature(false)
        const input = event.target.value
        setIssuerSignature(String(input).toLowerCase())
    }

    const handleSubmit = async () => {
        if (resolvedInfo !== null) {
            try {
                const zilpay = new ZilPayBase()
                let params = Array()
                let is_complete: boolean
                is_complete = is_complete =
                    issuerName !== '' && issuerSignature !== ''
                if (is_complete) {
                    params = await tyron.TyronZil.default.VerifiableCredential(
                        issuerName,
                        issuerDomain,
                        issuerSignature
                    )
                } else {
                    throw new Error('input data is missing')
                }

                if (is_complete) {
                    toast.info(
                        `You're about to mint a Soulbound Token for ${domain}@${username}.did`,
                        {
                            position: 'top-center',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        }
                    )

                    dispatch(setTxStatusLoading('true'))
                    updateModalTxMinimized(false)
                    updateModalTx(true)
                    let tx = await tyron.Init.default.transaction(net)
                    await zilpay
                        .call({
                            contractAddress: resolvedInfo?.addr!,
                            transition: txName,
                            params: params,
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
                    toastId: 12,
                })
            }
        }
    }

    return (
        <div className={styles.container}>
            <section className={styles.containerX}>
                <label>VC Issuer</label>
                <div>
                    <section className={styles.container2}>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="soul@tyron.did"
                            onChange={onChangeIssuer}
                            onKeyPress={handleOnKeyPressIssuer}
                            // value={ }
                        />
                        <div className={styles.arrowWrapper}>
                            <div
                                className={
                                    savedIssuer || loading
                                        ? 'continueBtnSaved'
                                        : 'continueBtn'
                                }
                                onClick={() => {
                                    if (!savedIssuer) {
                                        handleIssuer()
                                    }
                                }}
                            >
                                {loading ? (
                                    <Spinner />
                                ) : (
                                    <Image
                                        width={50}
                                        height={50}
                                        src={
                                            savedIssuer
                                                ? TickIco
                                                : ContinueArrow
                                        }
                                        alt="arrow"
                                    />
                                )}
                            </div>
                        </div>
                    </section>
                    {savedIssuer && (
                        <section className={styles.container2}>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder={`Paste DID Signature`}
                                onChange={handleIssuerSignature}
                                onKeyPress={handleOnKeyPressSignature}
                            />
                            <div className={styles.arrowWrapper}>
                                <div
                                    onClick={handleSaveSignature}
                                    className={
                                        savedSignature
                                            ? 'continueBtnSaved'
                                            : 'continueBtn'
                                    }
                                >
                                    <Image
                                        width={50}
                                        height={50}
                                        src={
                                            savedSignature
                                                ? TickIco
                                                : ContinueArrow
                                        }
                                        alt="arrow"
                                    />
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </section>
            {savedIssuer && savedSignature && (
                <div className={styles.btnWrapper}>
                    <div
                        style={{ width: '100%' }}
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        MINT SBT
                    </div>
                    <p className={styles.gascost}>Gas: around 1.3 ZIL</p>
                </div>
            )}
        </div>
    )
}

export default Component
