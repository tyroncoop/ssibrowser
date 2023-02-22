import React, { useState, useEffect } from 'react'
import { useStore } from 'effector-react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import styles from './styles.module.scss'
import { $resolvedInfo } from '../../../../../src/store/resolvedInfo'
import { decryptKey, encryptData } from '../../../../../src/lib/dkms'
import { setTxStatusLoading, setTxId } from '../../../../../src/app/actions'
import { RootState } from '../../../../../src/app/reducers'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import { useTranslation } from 'next-i18next'
import smartContract from '../../../../../src/utils/smartContract'
import { $arconnect } from '../../../../../src/store/arconnect'
import toastTheme from '../../../../../src/hooks/toastTheme'
import { Donate, Spinner } from '../../../..'
import TickIco from '../../../../../src/assets/icons/tick.svg'
import ContinueArrow from '../../../../../src/assets/icons/continue_arrow.svg'
import InfoDefaultReg from '../../../../../src/assets/icons/info_default.svg'
import InfoDefaultBlack from '../../../../../src/assets/icons/info_default_black.svg'
import InfoYellow from '../../../../../src/assets/icons/warning.svg'
import { $donation, updateDonation } from '../../../../../src/store/donation'
import defaultCheckmark from '../../../../../src/assets/icons/default_checkmark.svg'
import selectedCheckmark from '../../../../../src/assets/icons/selected_checkmark.svg'
import { $doc } from '../../../../../src/store/did-doc'
import useArConnect from '../../../../../src/hooks/useArConnect'

function Component({
    txName,
    handleIssuer,
    savedIssuer,
    setSavedIssuer,
    loading,
    issuerInput,
    setIssuerInput,
    issuerName,
    publicEncryption,
}) {
    const { connect } = useArConnect()
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const { getSmartContract } = smartContract()
    const dispatch = useDispatch()
    const donation = useStore($donation)
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const InfoDefault = isLight ? InfoDefaultBlack : InfoDefaultReg
    const doc = useStore($doc)
    const controller = doc?.controller
    const dkms = doc?.dkms
    const zilAddr = useSelector((state: RootState) => state.modal.zilAddr)
    const isController = controller === zilAddr?.base16
    const [firstname, setFirstName] = useState('')
    const [lastname, setLastName] = useState('')
    const [country, setCountry] = useState('')
    const [passport, setPassport] = useState('')
    const [userSign, setUserSign] = useState('')
    // const [userSignAuto, setUserSignAuto] = useState('') //@todo-i-? review: this used to be to generate auto sign, but atm disabled since need arconnect and we don't have it on mobile
    const [savedFirstname, setSavedFirstName] = useState(false)
    const [savedLastname, setSavedLastName] = useState(false)
    const [savedCountry, setSavedCountry] = useState(false)
    const [savedPassport, setSavedPassport] = useState(false)
    const [savedSign, setSavedSign] = useState(false)
    const [isUserSignature, setIsUserSignature] = useState(false)
    const [isLoadingSign, setIsLoadingSign] = useState(false)
    const [signature, setSignature] = useState('')

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.info('Signature copied to clipboard.', {
            position: 'top-center',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: toastTheme(isLight),
        })
    }
    const onChangeIssuer = (event: { target: { value: any } }) => {
        setSavedIssuer(false)
        setIssuerInput('')
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

    const handleFirstName = (event: { target: { value: any } }) => {
        setSavedFirstName(false)
        setSavedLastName(false)
        setSavedCountry(false)
        setSavedPassport(false)
        setIsUserSignature(false)
        setSavedSign(false)
        setFirstName('')
        setLastName('')
        setCountry('')
        setPassport('')
        const input = event.target.value
        setFirstName(String(input))
    }
    const handleLastName = (event: { target: { value: any } }) => {
        setSavedLastName(false)
        setSavedCountry(false)
        setSavedPassport(false)
        setIsUserSignature(false)
        setSavedSign(false)
        setLastName('')
        setCountry('')
        setPassport('')
        const input = event.target.value
        setLastName(String(input))
    }
    const handleCountry = (event: { target: { value: any } }) => {
        setSavedCountry(false)
        setSavedPassport(false)
        setIsUserSignature(false)
        setSavedSign(false)
        setCountry('')
        setPassport('')
        const input = event.target.value
        setCountry(String(input))
    }
    const handlePassport = (event: { target: { value: any } }) => {
        setSavedPassport(false)
        setIsUserSignature(false)
        setSavedSign(false)
        setPassport('')
        const input = event.target.value
        setPassport(String(input))
    }
    const handleSign = (event: { target: { value: any } }) => {
        setSavedSign(false)
        const input = event.target.value
        setUserSign(String(input))
    }

    const handleSaveSignature = () => {
        if (userSign.slice(0, 2) !== '0x') {
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
            setSavedSign(true)
        }
    }

    const checkIsEmpty = (val, action) => {
        if (val === '') {
            toast.error("Can't be empty", {
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
            action()
        }
    }

    const handleOnKeyPressFirstName = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            checkIsEmpty(firstname, () => setSavedFirstName(true))
        }
    }

    const handleOnKeyPressLastName = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            checkIsEmpty(lastname, () => setSavedLastName(true))
        }
    }

    const handleOnKeyPressCountry = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            checkIsEmpty(country, () => setSavedCountry(true))
        }
    }

    const handleOnKeyPressPassport = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            checkIsEmpty(passport, () => setSavedPassport(true))
        }
    }

    const handleOnKeyPressSign = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveSignature()
        }
    }

    const is_complete =
        issuerName !== '' &&
        issuerInput !== '' &&
        // inputB !== '' &&
        savedFirstname &&
        savedLastname &&
        savedCountry &&
        savedPassport

    const webHookIvms = async (message) => {
        const request = {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: `${domain}@${username}.did\nMessage: ${message}`,
        }
        await fetch(`${process.env.NEXT_PUBLIC_WEBHOOK_IVMS_URL}`, request)
    }

    const handleSubmit = async () => {
        if (resolvedInfo !== null) {
            let message: any = {
                firstname: firstname,
                lastname: lastname,
                country: country,
                passport: passport,
            }
            try {
                const zilpay = new ZilPayBase()
                let params = Array()

                if (is_complete) {
                    // encrypt message
                    //@todo-x-check move to HandleIssuer in index (issuer addr must be an SBTxWallet with a public encryption !== ""
                    // have public_encryption as function input (to avoid running the following here)

                    console.log('Public encryption', publicEncryption)
                    message = await encryptData(message, publicEncryption)

                    let userSignature =
                        await tyron.TyronZil.default.OptionParam(
                            tyron.TyronZil.Option.none,
                            'ByStr64'
                        )

                    if (isUserSignature && !isController) {
                        // submitted by an SSI Agent
                        userSignature =
                            await tyron.TyronZil.default.OptionParam(
                                tyron.TyronZil.Option.some,
                                'ByStr64',
                                userSign
                            )
                    }
                    const tyron_ = await tyron.Donation.default.tyron(donation!)

                    params = await tyron.TyronZil.default.Ivms101(
                        issuerName,
                        message,
                        userSignature,
                        tyron_
                    )
                } else {
                    throw new Error('Input data is missing')
                }

                if (is_complete) {
                    toast.info(
                        `You're about to submit an encrypted Travel Rule!`,
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

                    dispatch(setTxStatusLoading('true'))
                    updateModalTxMinimized(false)
                    updateModalTx(true)
                    let tx = await tyron.Init.default.transaction(net)
                    await zilpay
                        .call({
                            contractAddress: resolvedInfo.addr!,
                            transition: txName,
                            params: params,
                            amount: String(donation),
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
                                if (issuerName === 'tyron') {
                                    webHookIvms(message)
                                }
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

    const renderSubmitBtn = () => {
        if (isController) {
            if (!isUserSignature) {
                if (donation !== null && is_complete) {
                    return true
                } else {
                    return false
                }
            }
        }
        // if (!isUserSignature) {
        //     if (donation !== null && is_complete) {
        //         return true
        //     } else {
        //         return false
        //     }
        // } else {
        //     if (!isController && !savedSign) {
        //         return false
        //     } else {
        //         return is_complete
        //     }
        // }
    }

    const generateSign = async () => {
        await connect().then(async () => {
            const arConnect = $arconnect.getState()
            if (arConnect) {
                try {
                    let message: any = {
                        firstname: firstname,
                        lastname: lastname,
                        country: country,
                        passport: passport,
                    }
                    const public_encryption = await getSmartContract(
                        issuerInput,
                        'public_encryption'
                    )
                        .then((public_enc) => {
                            return public_enc.result.public_encryption
                        })
                        .catch(() => {
                            throw new Error('No public encryption found')
                        })
                    message = await encryptData(message, public_encryption)
                    const hash = await tyron.Util.default.HashString(message)
                    try {
                        const encrypted_key = dkms.get(domain)
                        const private_key = await decryptKey(
                            arConnect,
                            encrypted_key
                        )
                        const public_key =
                            zcrypto.getPubKeyFromPrivateKey(private_key)
                        const userSignature = zcrypto.sign(
                            Buffer.from(hash, 'hex'),
                            private_key,
                            public_key
                        )
                        setSignature(userSignature)
                    } catch (error) {
                        throw new Error('Identity verification unsuccessful.')
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
                        toastId: 13,
                    })
                }
            }
        })
    }

    const toggleCheck = async () => {
        updateDonation(null)
        setIsUserSignature(!isUserSignature)
    }

    useEffect(() => {
        setSavedFirstName(false)
        setSavedLastName(false)
        setSavedCountry(false)
        setSavedPassport(false)
        setSavedSign(false)
    }, [handleIssuer])

    return (
        <div className={styles.container}>
            <div>
                <p>
                    Complete the following information for an{' '}
                    <a
                        href={`https://intervasp.org/wp-content/uploads/2020/05/IVMS101-interVASP-data-model-standard-issue-1-FINAL.pdf`}
                        rel="noreferrer"
                        target="_blank"
                    >
                        IVMS101 Message
                    </a>
                    .
                    <span className={styles.tooltip}>
                        <div className={styles.ico}>
                            <div className={styles.icoDefault}>
                                <Image
                                    alt="info-ico"
                                    src={InfoDefault}
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <div className={styles.icoColor}>
                                <Image
                                    alt="info-ico"
                                    src={InfoYellow}
                                    width={20}
                                    height={20}
                                />
                            </div>
                        </div>
                        <span className={styles.tooltiptext}>
                            <div
                                style={{
                                    fontSize: '14px',
                                }}
                            >
                                So that your self-sovereign identity complies
                                with the FATF Travel Rule (to make sure you are
                                not a terrorist or involved in illicit
                                activities like money laundering).
                            </div>
                        </span>
                    </span>
                </p>
                <h6>
                    All your personal, private data will get encrypted, and only
                    the Issuer can decrypt it.
                </h6>
                <div>
                    <label className={styles.label}>VC Issuer</label>
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
                </div>
                {/* <section className={styles.container2}>
                    <label>discord</label>
                    contact
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="Type your Discord username"
                        onChange={handleInputB}
                    />
                </section> */}
                {savedIssuer && (
                    <div>
                        <div>
                            <label className={styles.label}>first name</label>
                            <section className={styles.container2}>
                                <input
                                    className={styles.input}
                                    type="text"
                                    // placeholder="Type your first name"
                                    onChange={handleFirstName}
                                    onKeyPress={handleOnKeyPressFirstName}
                                />
                                <div className={styles.arrowWrapper}>
                                    <div
                                        className={
                                            savedFirstname
                                                ? 'continueBtnSaved'
                                                : 'continueBtn'
                                        }
                                        onClick={() =>
                                            checkIsEmpty(firstname, () =>
                                                setSavedFirstName(true)
                                            )
                                        }
                                    >
                                        <Image
                                            width={50}
                                            height={50}
                                            src={
                                                savedFirstname
                                                    ? TickIco
                                                    : ContinueArrow
                                            }
                                            alt="arrow"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                        {savedFirstname && (
                            <div>
                                <label className={styles.label}>
                                    last name
                                </label>
                                <section className={styles.container2}>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        // placeholder="Type your last name"
                                        onChange={handleLastName}
                                        onKeyPress={handleOnKeyPressLastName}
                                    />
                                    <div className={styles.arrowWrapper}>
                                        <div
                                            className={
                                                savedLastname
                                                    ? 'continueBtnSaved'
                                                    : 'continueBtn'
                                            }
                                            onClick={() =>
                                                checkIsEmpty(lastname, () =>
                                                    setSavedLastName(true)
                                                )
                                            }
                                        >
                                            <Image
                                                width={50}
                                                height={50}
                                                src={
                                                    savedLastname
                                                        ? TickIco
                                                        : ContinueArrow
                                                }
                                                alt="arrow"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                        {savedLastname && (
                            <div>
                                <label className={styles.label}>
                                    country of residence
                                </label>
                                <section className={styles.container2}>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        // placeholder="Type your country of residence"
                                        onChange={handleCountry}
                                        onKeyPress={handleOnKeyPressCountry}
                                    />
                                    <div className={styles.arrowWrapper}>
                                        <div
                                            className={
                                                savedCountry
                                                    ? 'continueBtnSaved'
                                                    : 'continueBtn'
                                            }
                                            onClick={() =>
                                                checkIsEmpty(country, () =>
                                                    setSavedCountry(true)
                                                )
                                            }
                                        >
                                            <Image
                                                width={50}
                                                height={50}
                                                src={
                                                    savedCountry
                                                        ? TickIco
                                                        : ContinueArrow
                                                }
                                                alt="arrow"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                        {savedCountry && (
                            <div>
                                <label className={styles.label}>
                                    passport number
                                </label>
                                <section className={styles.container2}>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        // placeholder="Type your passport number or national ID"
                                        onChange={handlePassport}
                                        onKeyPress={handleOnKeyPressPassport}
                                    />
                                    <div className={styles.arrowWrapper}>
                                        <div
                                            className={
                                                savedPassport
                                                    ? 'continueBtnSaved'
                                                    : 'continueBtn'
                                            }
                                            onClick={() => {
                                                checkIsEmpty(passport, () =>
                                                    setSavedPassport(true)
                                                )
                                            }}
                                        >
                                            <Image
                                                width={50}
                                                height={50}
                                                src={
                                                    savedPassport
                                                        ? TickIco
                                                        : ContinueArrow
                                                }
                                                alt="arrow"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {savedPassport && (
                <>
                    <div
                        className={styles.checkBoxWrapper}
                        onClick={toggleCheck}
                    >
                        <div>
                            <Image
                                src={
                                    isUserSignature
                                        ? selectedCheckmark
                                        : defaultCheckmark
                                }
                                alt="arrow"
                            />
                        </div>
                        <div>&nbsp;User&apos;s DID Signature</div>
                    </div>
                    {isUserSignature && (
                        <>
                            {isController ? (
                                // make signature
                                <div
                                    style={{
                                        marginTop: '10%',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        className={
                                            isLight
                                                ? 'actionBtnLight'
                                                : 'actionBtn'
                                        }
                                        onClick={generateSign}
                                    >
                                        {t('MAKE')}&nbsp;
                                        <span>{t('SIGNATURE')}</span>
                                    </div>
                                    {signature !== '' && (
                                        <>
                                            <h4>
                                                {t(
                                                    'YOUR DID SOCIAL RECOVERY SIGNATURE:'
                                                )}
                                            </h4>
                                            <p
                                                onClick={() =>
                                                    copyToClipboard(signature)
                                                }
                                            >
                                                {signature}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // input signature
                                <section className={styles.container2}>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        placeholder="Type signature"
                                        onChange={handleSign}
                                        onKeyPress={handleOnKeyPressSign}
                                    />
                                    <div className={styles.arrowWrapper}>
                                        <div
                                            className={
                                                savedSign
                                                    ? 'continueBtnSaved'
                                                    : 'continueBtn'
                                            }
                                            onClick={handleSaveSignature}
                                        >
                                            <Image
                                                width={50}
                                                height={50}
                                                src={
                                                    savedSign
                                                        ? TickIco
                                                        : ContinueArrow
                                                }
                                                alt="arrow"
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {/* {isController && (
                        <div className={styles.txtSign}>
                            {isLoadingSign ? <Spinner /> : userSignAuto}
                        </div>
                    )} */}
                </>
            )}
            {isController && is_complete && !isUserSignature && <Donate />}
            {/* {!isUserSignature && !isLoadingSign && savedPassport && <Donate />} */}
            {renderSubmitBtn() && (
                <div className={styles.btnWrapper}>
                    <div
                        className={isLight ? 'actionBtnLight' : 'actionBtn'}
                        onClick={handleSubmit}
                        style={{ width: '100%' }}
                    >
                        Submit Travel Rule
                    </div>
                    <div className={styles.gasTxt}>Cost is less than 2 ZIL</div>
                </div>
            )}
        </div>
    )
}

export default Component
