import React, { useEffect } from 'react'
import { useStore } from 'effector-react'
import { $doc } from '../../../../src/store/did-doc'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { $loading, $loadingDoc } from '../../../../src/store/loading'
import fetch from '../../../../src/hooks/fetch'
import { useTranslation } from 'next-i18next'
import { useSelector } from 'react-redux'
import { RootState } from '../../../../src/app/reducers'
import { toast } from 'react-toastify'
import { $resolvedInfo } from '../../../../src/store/resolvedInfo'
import { Spinner } from '../../..'
import toastTheme from '../../../../src/hooks/toastTheme'
import routerHook from '../../../../src/hooks/router'
import useArConnect from '../../../../src/hooks/useArConnect'
import { $arconnect } from '../../../../src/store/arconnect'

function Component() {
    const { t } = useTranslation()
    const { navigate } = routerHook()
    const { connect } = useArConnect()
    const net = useSelector((state: RootState) => state.modal.net)
    const loadingDoc = useStore($loadingDoc)
    const loading = useStore($loading)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const controller_ = useStore($doc)?.controller
    const zilAddr = useSelector((state: RootState) => state.modal.zilAddr)
    const styles = isLight ? stylesLight : stylesDark
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const doc = useStore($doc)?.doc
    let exists = false
    const domain = resolvedInfo?.domain
    const domainNavigate = domain !== '' ? domain + '@' : ''

    const { fetchDoc } = fetch()

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.info('Key copied to clipboard!', {
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

    useEffect(() => {
        fetchDoc()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const spinner = <Spinner />

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                alignItems: 'center',
            }}
        >
            {loadingDoc || loading ? (
                spinner
            ) : (
                <>
                    {doc !== null &&
                        doc?.map((res: any) => {
                            if (res[0] === 'Decentralized identifier') {
                                const did = res[1] as string
                                switch (did) {
                                    case 'Not activated yet.':
                                        return (
                                            <div
                                                key={res}
                                                className={styles.docInfo}
                                            >
                                                <p className={styles.didkey}>
                                                    This DID has not been
                                                    created by {username} yet.
                                                </p>
                                            </div>
                                        )
                                    default: {
                                        exists = true
                                        const addr = did.substring(19)
                                        return (
                                            <div
                                                key={res}
                                                className={styles.docInfo}
                                                style={{ marginBottom: '10%' }}
                                            >
                                                <span className={styles.did}>
                                                    <a
                                                        href={`https://viewblock.io/zilliqa/address/${addr}?network=${net}`}
                                                        rel="noreferrer"
                                                        target="_blank"
                                                    >
                                                        {did
                                                            .substring(0, 19)
                                                            .replace(
                                                                'main',
                                                                net ===
                                                                    'mainnet'
                                                                    ? 'main'
                                                                    : 'test'
                                                            )}
                                                        {addr}
                                                    </a>
                                                </span>
                                            </div>
                                        )
                                    }
                                }
                            }
                        })}
                    {exists && (
                        <>
                            <h3 className={styles.title}>
                                {t('VERIFICATION METHODS')}
                            </h3>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    textAlign: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {doc !== null &&
                                    doc?.map((res: any) => {
                                        if (
                                            res[0] !==
                                            'Decentralized identifier' &&
                                            res[0] !== 'DID services'
                                        ) {
                                            return (
                                                <div
                                                    key={res}
                                                    className={styles.docInfo}
                                                >
                                                    <h3
                                                        className={
                                                            styles.blockHead
                                                        }
                                                    >
                                                        {t(`${res[0]}`)}
                                                    </h3>
                                                    {res[1].map(
                                                        (element: any) => {
                                                            return (
                                                                <p
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                    }}
                                                                    onClick={() =>
                                                                        copyToClipboard(
                                                                            element
                                                                        )
                                                                    }
                                                                    key={
                                                                        element
                                                                    }
                                                                    className={
                                                                        styles.didkey
                                                                    }
                                                                >
                                                                    {element}
                                                                </p>
                                                            )
                                                        }
                                                    )}
                                                </div>
                                            )
                                        }
                                    })}
                            </div>
                            {controller_ === zilAddr?.base16 && (
                                <div
                                    onClick={async () => {
                                        await connect().then(() => {
                                            const arConnect =
                                                $arconnect.getState()
                                            if (arConnect) {
                                                navigate(
                                                    `/${domainNavigate}${resolvedInfo?.name}/didx/wallet/doc/update`
                                                )
                                            }
                                        })
                                    }}
                                    className="button"
                                    style={{ marginTop: '50px' }}
                                >
                                    {t('UPDATE KEYS')}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default Component
