import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import React from 'react'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { Donate } from '../../../../..'
import { $donation, updateDonation } from '../../../../../../src/store/donation'
import { decryptKey, operationKeyPair } from '../../../../../../src/lib/dkms'
import { $doc } from '../../../../../../src/store/did-doc'
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
    ids,
    patches,
}: {
    ids: string[]
    patches: tyron.DocumentModel.PatchModel[]
}) {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const { navigate } = routerHook()
    const dispatch = useDispatch()
    const donation = useStore($donation)
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const arConnect = useStore($arconnect)
    const dkms = useStore($doc)?.dkms
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)

    const handleSubmit = async () => {
        try {
            if (
                arConnect !== null &&
                resolvedInfo !== null &&
                donation !== null
            ) {
                const zilpay = new ZilPayBase()

                let key_input: Array<{ id: string }> = []
                for (let i = 0; i < ids.length; i += 1) {
                    key_input.push({
                        id: ids[i],
                    })
                }
                const verification_methods: tyron.TyronZil.TransitionValue[] =
                    []
                const elements: tyron.DocumentModel.DocumentElement[] = []

                console.log(arConnect)
                for (const input of key_input) {
                    // Creates the cryptographic DID key pair
                    const doc = await operationKeyPair({
                        arConnect: arConnect,
                        id: input.id,
                        addr: resolvedInfo.addr,
                    })
                    elements.push(doc.element)
                    verification_methods.push(doc.parameter)
                }

                let document = verification_methods
                await tyron.Sidetree.Sidetree.processPatches(
                    resolvedInfo?.addr!,
                    patches
                )
                    .then(async (res) => {
                        for (let i = 0; i < res.updateDocument.length; i++) {
                            document.push(res.updateDocument[i])
                            elements.push(res.documentElements[i])
                        }
                        const hash = await tyron.DidCrud.default.HashDocument(
                            elements
                        )
                        let signature: string | tyron.TyronZil.TransitionValue
                        try {
                            const encrypted_key = dkms.get('update')
                            const private_key = await decryptKey(
                                arConnect,
                                encrypted_key
                            )
                            const public_key =
                                zcrypto.getPubKeyFromPrivateKey(private_key)
                            signature = zcrypto.sign(
                                Buffer.from(hash, 'hex'),
                                private_key,
                                public_key
                            )
                            signature =
                                await tyron.TyronZil.default.OptionParam(
                                    tyron.TyronZil.Option.some,
                                    'ByStr64',
                                    '0x' + signature
                                )
                        } catch (error) {
                            signature =
                                await tyron.TyronZil.default.OptionParam(
                                    tyron.TyronZil.Option.none,
                                    'ByStr64'
                                )
                        }
                        // Donation
                        const tyron_ = await tyron.Donation.default.tyron(
                            donation
                        )

                        const tx_params =
                            await tyron.TyronZil.default.CrudParams(
                                resolvedInfo?.addr!,
                                document,
                                signature,
                                tyron_
                            )

                        dispatch(setTxStatusLoading('true'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)

                        let tx = await tyron.Init.default.transaction(net)

                        toast.info(
                            t('You’re about to submit a DID Update operation!'),
                            {
                                position: 'top-center',
                                autoClose: 6000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: toastTheme(isLight),
                            }
                        )
                        await zilpay
                            .call({
                                contractAddress: resolvedInfo?.addr!,
                                transition: 'DidUpdate',
                                params: tx_params as unknown as Record<
                                    string,
                                    unknown
                                >[],
                                amount: String(donation),
                            })
                            .then(async (res) => {
                                dispatch(setTxId(res.ID))
                                dispatch(setTxStatusLoading('submitted'))

                                tx = await tx.confirm(res.ID)
                                if (tx.isConfirmed()) {
                                    dispatch(setTxStatusLoading('confirmed'))
                                    updateDonation(null)
                                    window.open(
                                        `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                    )
                                } else if (tx.isRejected()) {
                                    dispatch(setTxStatusLoading('failed'))
                                }
                            })
                            .catch((err) => {
                                throw err
                            })
                    })
                    .catch((err) => {
                        throw err
                    })
            }
        } catch (error) {
            dispatch(setTxStatusLoading('rejected'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            toast.error(String(error), {
                position: 'top-right',
                autoClose: 3000,
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

    return (
        <div>
            <Donate />
            {donation !== null && (
                <div
                    style={{
                        marginTop: '14%',
                        textAlign: 'center',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                    >
                        {t('UPDATE')} did
                    </div>
                </div>
            )}
        </div>
    )
}

export default Component
