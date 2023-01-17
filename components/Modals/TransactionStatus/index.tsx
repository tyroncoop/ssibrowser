import React from 'react'
import { connect, ConnectedProps, useSelector } from 'react-redux'
import { useStore } from 'effector-react'
import { toast } from 'react-toastify'
import { setTxStatusLoading } from '../../../src/app/actions'
import { RootState } from '../../../src/app/reducers'
import {
    $modalTx,
    updateModalTx,
    updateModalTxMinimized,
    updateTxType,
} from '../../../src/store/modal'
import CloseIconReg from '../../../src/assets/icons/ic_cross.svg'
import CloseIconBlack from '../../../src/assets/icons/ic_cross_black.svg'
import MinimizeIconReg from '../../../src/assets/icons/minimize.svg'
import MinimizeIconBlack from '../../../src/assets/icons/minimize_black.svg'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { Spinner } from '../..'
import toastTheme from '../../../src/hooks/toastTheme'

const mapStateToProps = (state: RootState) => ({
    loading: state.modal.txStatusLoading,
    txId: state.modal.txId,
})

const mapDispatchToProps = {
    dispatchSetTxStatus: setTxStatusLoading,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

type ModalProps = ConnectedProps<typeof connector>

function TransactionStatus(props: ModalProps) {
    const { t } = useTranslation()
    const { dispatchSetTxStatus, loading, txId } = props
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const CloseIcon = isLight ? CloseIconBlack : CloseIconReg
    const MinimizeIcon = isLight ? MinimizeIconBlack : MinimizeIconReg
    const modalTx = useStore($modalTx)

    const hideModal = () => {
        if (loading === 'true') {
            toast.error(t('Confirm or reject the transaction with ZilPay.'), {
                position: 'top-right',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 1,
            })
        } else if (loading === 'submitted') {
            updateModalTxMinimized(true)
            updateModalTx(false)
        } else {
            updateModalTx(false)
            dispatchSetTxStatus('idle')
            updateTxType(null)
        }
    }

    const minimize = () => {
        updateModalTx(false)
        updateModalTxMinimized(true)
    }

    const spinner = <Spinner />

    const tx = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <h5 className={styles.txt}>
                {loading === 'true'
                    ? t('SIGN THE TRANSACTION TO SEND IT TO THE BLOCKCHAIN')
                    : loading === 'submitted'
                        ? t(
                            'TRANSACTION PROCESSED ON THE ZILLIQA BLOCKCHAIN, PLEASE WAIT'
                        )
                        : loading === 'confirmed'
                            ? t('TRANSACTION SUCCESSFULLY CONFIRMED!')
                            : loading === 'failed'
                                ? t('TRANSACTION FAILED')
                                : loading === 'rejected'
                                    ? t('TRANSACTION REJECTED BY THE USER')
                                    : t('SIGN THE TRANSACTION TO SEND IT TO THE BLOCKCHAIN')}
            </h5>
            {loading !== 'true' && loading !== 'rejected' && (
                <h5 className={styles.txt}>
                    ID:{' '}
                    <a
                        href={`https://viewblock.io/zilliqa/tx/${txId}?network=${net}`}
                        rel="noreferrer"
                        target="_blank"
                    >
                        0x{txId.slice(0, 22)}...
                    </a>
                </h5>
            )}
            {loading !== 'idle' &&
                loading !== 'confirmed' &&
                loading !== 'failed' &&
                loading !== 'rejected' &&
                spinner}
        </div>
    )

    if (!modalTx) {
        return null
    }

    return (
        <>
            <div onClick={hideModal} className={styles.outerWrapper} />
            <div className={styles.container}>
                <div className={styles.innerContainer}>
                    <div className={styles.actionIcoWrapper}>
                        <div className={styles.closeIcon}>
                            <Image
                                alt="minimize-ico"
                                src={MinimizeIcon}
                                onClick={minimize}
                            />
                        </div>
                        <div className={styles.closeIcon}>
                            <Image
                                alt="close-ico"
                                src={CloseIcon}
                                onClick={hideModal}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: '7%', marginBottom: '5%' }}>
                        {tx}
                    </div>
                </div>
            </div>
        </>
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(TransactionStatus)
