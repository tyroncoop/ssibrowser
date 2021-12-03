import React, { useState, useCallback } from 'react';
import { useStore } from 'effector-react';
import * as tyron from 'tyron';
import * as zcrypto from '@zilliqa-js/crypto';
import { ZilPayBase } from '../ZilPay/zilpay-base';
import styles from './styles.module.scss';
import { $net } from 'src/store/wallet-network';
import { $contract } from 'src/store/contract';
import { $user } from 'src/store/user';
import { $arconnect } from 'src/store/arconnect';
import { HashString } from 'src/lib/util';
import { decryptKey, encryptData } from 'src/lib/dkms';
import { fetchAddr, resolve } from '../SearchBar/utils';

function Component() {
    const callbackRef = useCallback(inputElement => {
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const user = useStore($user);
    const arConnect = useStore($arconnect);

    const contract = useStore($contract);
    const net = useStore($net);

    const [error, setError] = useState('');
    const [txName, setTxName] = useState('');
    const [input, setInput] = useState('');
    const [inputB, setInputB] = useState('');
    const [inputC, setInputC] = useState('');
    const [inputD, setInputD] = useState('');
    const [inputE, setInputE] = useState('');
    const [inputF, setInputF] = useState('');

    const [hideSubmit, setHideSubmit] = useState(true);
    const [txID, setTxID] = useState('');

    const handleOnChange = (event: { target: { value: any; }; }) => {
        setError('');
        const selection = event.target.value;
        if (selection === 'Ivms101') {
            if (arConnect === null) {
                alert('To continue, connect your SSI Private Key: Click on Connect -> SSI Private Key')
            } else {
                setTxName(selection)
            }
        } else {
            setTxName(selection)
        }
    };

    const handleReset = async () => {
        setError(''); setHideSubmit(true);
    };

    const handleInput = (event: { target: { value: any; }; }) => {
        handleReset();
        const input = event.target.value;
        setInput(String(input).toLowerCase());
    };
    const handleInputB = (event: { target: { value: any; }; }) => {
        handleReset();
        const input = event.target.value;
        setInputB(String(input).toLowerCase());
    };
    const handleInputC = (event: { target: { value: any; }; }) => {
        handleReset();
        const input = event.target.value;
        setInputC(String(input).toLowerCase());
    };
    const handleInputD = (event: { target: { value: any; }; }) => {
        handleReset();
        const input = event.target.value;
        setInputD(String(input).toLowerCase());
    };
    const handleInputE = (event: { target: { value: any; }; }) => {
        handleReset();
        const input = event.target.value;
        setInputE(String(input).toLowerCase());
    };
    const handleInputF = (event: { target: { value: any; }; }) => {
        handleReset();
        const input = event.target.value;
        setInputF(String(input).toLowerCase());
    };

    const handleSubmit = async () => {
        setError('');
        if (arConnect !== null && contract !== null) {
            try {
                const zilpay = new ZilPayBase();
                const params = [];
                let is_complete;
                if (txName === 'Ivms101') {
                    is_complete = input !== '' && inputB !== '' && inputC !== '' && inputD !== '' && inputE !== '' && inputF !== '';
                    if (is_complete) {
                        let msg: any = {
                            discord: inputB,
                            firstname: inputC,
                            lastname: inputD,
                            country: inputE,
                            passport: inputF
                        };
                        //msg = JSON.stringify(msg);

                        // encrypt message
                        let network = tyron.DidScheme.NetworkNamespace.Mainnet;
                        if (net === 'testnet') {
                            network = tyron.DidScheme.NetworkNamespace.Testnet;
                        }
                        const init = new tyron.ZilliqaInit.default(network);

                        let public_encryption;
                        try {
                            const public_enc = await init.API.blockchain.getSmartContractSubState(
                                contract.addr,
                                'public_encryption'
                            );
                            public_encryption = public_enc.result.public_encryption;
                        } catch (error) {
                            throw new Error(
                                'no public encryption found'
                            )
                        }
                        msg = await encryptData(msg, public_encryption);
                        const data = input + msg;
                        const hash = await HashString(data);

                        const result = await fetchAddr({ net, username: input, domain: 'did' })
                            .then(async (addr) => {
                                return await resolve({ net, addr })
                            })
                            .catch(err => { throw err })

                        let signature;
                        try {
                            const encrypted_key = result.dkms?.get('assertion');
                            const private_key = await decryptKey(arConnect, encrypted_key);
                            const public_key = zcrypto.getPubKeyFromPrivateKey(private_key);
                            signature = '0x' + zcrypto.sign(Buffer.from(hash, 'hex'), private_key, public_key);
                        } catch (error) {
                            throw new Error(
                                'identity verification unsuccessful'
                            )
                        }
                        const username_ = {
                            vname: 'username',
                            type: 'String',
                            value: input,
                        };
                        params.push(username_);
                        const message_ = {
                            vname: 'message',
                            type: 'String',
                            value: msg,
                        };
                        params.push(message_);

                        const signature_ = {
                            vname: 'signature',
                            type: 'ByStr64',
                            value: signature,
                        };
                        params.push(signature_);
                    } else {
                        throw new Error(
                            'input data is missing'
                        )
                    }
                } else if (txName === 'Verifiable_Credential') {
                    is_complete = input !== '' && inputB !== '';
                    const username_ = {
                        vname: 'username',
                        type: 'String',
                        value: input,
                    };
                    params.push(username_);

                    const signature_ = {
                        vname: 'signature',
                        type: 'ByStr64',
                        value: inputB,
                    };
                    params.push(signature_);
                }

                if (is_complete) {
                    if (txName === 'Ivms101') {
                        alert(`You're about to submit your encrypted IVMS101 Message!`);
                    } else {
                        alert(`You're about to submit ${user?.nft}'s DID signature to authenticate your Verifiable Credential.`);
                    }

                    await zilpay.call({
                        contractAddress: contract.addr,
                        transition: txName,
                        params: params,
                        amount: '0'
                    })
                        .then(res => {
                            setTxID(res.ID);
                        })
                        .catch(err => { throw err })
                }
            } catch (error) {
                setError(String(error));
            }
        }
    };

    return (
        <div style={{ marginTop: '14%', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '7%' }}>
                {user?.nft}&apos;s{' '}
                <span style={{ color: 'lightblue', marginBottom: '7%' }}>
                    verifiable credentials
                </span>
                {' '}dapp
            </h2>
            {
                txID === '' &&
                <>
                    <h3 style={{ marginBottom: '7%' }}>
                        Let&apos;s build a web of trust!
                    </h3>
                    <select style={{ width: '40%' }} onChange={handleOnChange}>
                        <option value="">Select action</option>
                        <option value="Ivms101">Submit Travel Rule</option>
                        <option value="Verifiable_Credential">Submit {user?.nft}&apos;s DID signature</option>
                    </select>
                    {
                        txName === 'Ivms101' &&
                        <div className={styles.container}>
                            <p>
                                Complete the following information to present your{' '}
                                <a
                                    href={`https://intervasp.org/wp-content/uploads/2020/05/IVMS101-interVASP-data-model-standard-issue-1-FINAL.pdf`}
                                    rel="noreferrer" target="_blank"
                                >
                                    IVMS101 Message
                                </a>
                                {' '}to {user?.nft}.
                            </p>
                            <p>
                                Then, your self-sovereign identity can comply with the FATF Travel Rule, making sure
                                you are not a terrorist or involved in illicit activities like money laundering.
                            </p>
                            <code>
                                All your personal, private data will get encrypted! Only the Tyron Coop can decrypt it.
                            </code>
                            <section className={styles.container2}>
                                <label>NFT</label>
                                username
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your NFT Username (without .did)"
                                    onChange={handleInput}
                                    autoFocus
                                />
                            </section>
                            <section className={styles.container2}>
                                <label>discord</label>
                                contact
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your Discord username"
                                    onChange={handleInputB}
                                    autoFocus
                                />
                            </section>
                            <section className={styles.container2}>
                                <label>first</label>
                                name
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your first name"
                                    onChange={handleInputC}
                                    autoFocus
                                />
                            </section>
                            <section className={styles.container2}>
                                <label>last</label>
                                name
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your last name"
                                    onChange={handleInputD}
                                    autoFocus
                                />
                            </section>
                            <section className={styles.container2}>
                                <label>country</label>
                                of residence
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your country of residence"
                                    onChange={handleInputE}
                                    autoFocus
                                />
                            </section>
                            <section className={styles.container2}>
                                <label>passport</label>
                                number
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your passport number or national ID"
                                    onChange={handleInputF}
                                    autoFocus
                                />
                            </section>
                        </div>
                    }
                    {
                        txName === 'Verifiable_Credential' &&
                        <section className={styles.containerX}>
                            <input
                                ref={callbackRef}
                                type="text"
                                placeholder="Type your NFT Username without .did"
                                onChange={handleInput}
                                autoFocus
                                style={{ width: '55%' }}
                            />
                            <input
                                style={{ width: '80%' }}
                                type="text"
                                placeholder={`Paste ${user?.nft}'s signature`}
                                ref={callbackRef}
                                onChange={handleInputB}
                            />
                        </section>
                    }
                    {
                        txName !== '' && !hideSubmit &&
                        <div style={{ marginTop: '10%' }}>
                            <button className={styles.button} onClick={handleSubmit}>
                                Submit{' '}
                                <span className={styles.x}>
                                    {txName}
                                </span>
                            </button>
                            {
                                txName === 'Ivms101' &&
                                <p className={styles.gascost}>
                                    Gas: around 1.8 ZIL
                                </p>
                            }
                            {
                                txName === 'Verifiable_Credential' &&
                                <p className={styles.gascost}>
                                    Gas: around 1.3 ZIL
                                </p>
                            }
                        </div>
                    }
                </>
            }
            {
                txID !== '' &&
                <code>
                    Transaction ID:{' '}
                    <a
                        href={`https://viewblock.io/zilliqa/tx/${txID}?network=${net}`}
                        rel="noreferrer" target="_blank"
                    >
                        {txID.substr(0, 11)}...
                    </a>
                </code>
            }
            {
                error !== '' &&
                <p className={styles.error}>
                    {error}
                </p>
            }
        </div>
    );
}

export default Component;
