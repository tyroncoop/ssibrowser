import React from 'react'
import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { $donation, updateDonation } from '../../../../../../src/store/donation'
import { operationKeyPair } from '../../../../../../src/lib/dkms'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../src/store/modal'
import { ZilPayBase } from '../../../../../ZilPay/zilpay-base'
import { $resolvedInfo } from '../../../../../../src/store/resolvedInfo'
import { setTxStatusLoading, setTxId } from '../../../../../../src/app/actions'
import { RootState } from '../../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import routerHook from '../../../../../../src/hooks/router'
import { $arconnect } from '../../../../../../src/store/arconnect'
import toastTheme from '../../../../../../src/hooks/toastTheme'

function Component({
    services,
}: {
    services: tyron.DocumentModel.ServiceModel[]
}) {
    const { t } = useTranslation()
    const { navigate } = routerHook()
    const dispatch = useDispatch()
    const donation = useStore($donation)
    const resolvedInfo = useStore($resolvedInfo)
    const arConnect = useStore($arconnect)
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const domainNavigate =
        resolvedInfo?.domain !== '' ? resolvedInfo?.domain + '@' : ''

    const handleSubmit = async () => {
        const key_input = [
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.SocialRecovery,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.General,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Auth,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Assertion,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Agreement,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Invocation,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Delegation,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Update,
            },
            {
                id: tyron.VerificationMethods.PublicKeyPurpose.Recovery,
            },
        ]

        if (arConnect !== null && resolvedInfo !== null && donation !== null) {
            const zilpay = new ZilPayBase()
            const verification_methods: tyron.TyronZil.TransitionValue[] = []
            for (const input of key_input) {
                // Creates the cryptographic DID key pair
                const doc = await operationKeyPair({
                    arConnect: arConnect,
                    id: input.id,
                    addr: resolvedInfo.addr,
                })
                verification_methods.push(doc.parameter)
            }

            let tyron_: tyron.TyronZil.TransitionValue
            tyron_ = await tyron.Donation.default.tyron(donation)

            const tx_params = await tyron.DidCrud.default.Create({
                addr: resolvedInfo?.addr!,
                verificationMethods: verification_methods,
                services: services,
                tyron_: tyron_,
            })
            dispatch(setTxStatusLoading('true'))
            updateModalTxMinimized(false)
            updateModalTx(true)

            let tx = await tyron.Init.default.transaction(net)

            toast.info(`You're about to submit a DID Create transaction!`, {
                position: 'top-center',
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
            })
            await zilpay
                .call(
                    {
                        contractAddress: resolvedInfo?.addr!,
                        transition: 'DidCreate',
                        params: tx_params.txParams as unknown as Record<
                            string,
                            unknown
                        >[],
                        amount: String(donation),
                    },
                    {
                        gasPrice: '2000',
                        gaslimit: '20000',
                    }
                )
                .then(async (res) => {
                    dispatch(setTxId(res.ID))
                    dispatch(setTxStatusLoading('submitted'))
                    try {
                        tx = await tx.confirm(res.ID)
                        if (tx.isConfirmed()) {
                            dispatch(setTxStatusLoading('confirmed'))
                            updateDonation(null)
                            window.open(
                                `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                            )
                            navigate(
                                `/${domainNavigate}${resolvedInfo.name}/didx/doc`
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
                    } catch (err) {
                        dispatch(setTxStatusLoading('rejected'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        toast.error(String(err), {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        })
                    }
                })
                .catch(() => {
                    updateModalTx(false)
                })
        }
    }

    return (
        <>
            {donation !== null && (
                <div style={{ marginTop: '14%', textAlign: 'center' }}>
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        create did
                    </div>
                    <h5 style={{ marginTop: '3%', color: 'lightgrey' }}>
                        around 7 ZIL
                    </h5>
                </div>
            )}
        </>
    )
}

export default Component
