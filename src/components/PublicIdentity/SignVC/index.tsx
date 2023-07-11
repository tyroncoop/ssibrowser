import React, { useState, useCallback } from 'react';
import { useStore } from 'effector-react';
import * as zcrypto from '@zilliqa-js/crypto';
import styles from './styles.module.scss';
import { $doc } from 'src/store/did-doc';
import { $arconnect } from 'src/store/arconnect';
import { decryptData, decryptKey } from 'src/lib/dkms';
import { $keyfile } from 'src/store/keyfile';
import { HashString } from 'src/lib/util';

function Component() {
    const callbackRef = useCallback(inputElement => {
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const dkms = useStore($doc)?.dkms;
    let soul_key = ''

    Object.entries(dkms).forEach(([key, value]) => {
        if (key === 'soul') {
            soul_key = value as string//{ key, value }; // Store the matching key-value pair
        }
    });
    console.log(soul_key)
    const arConnect = useStore($arconnect);
    const keyfile = useStore($keyfile);

    // const [input, setInput] = useState('');
    const [inputB, setInputB] = useState('');
    const [msg, setMsg] = useState({});

    const [legend, setLegend] = useState('continue')
    const [button, setButton] = useState('button primary')

    const [error, setError] = useState('');
    const [hideSubmit, setHideSubmit] = useState(true);

    const [signature, setSignature] = useState('');

    // const handleInput = (event: { target: { value: any; }; }) => {
    //     const input = event.target.value;
    //     setInput(String(input).toLowerCase());
    // };

    const handleInputB = async (event: { target: { value: any; }; }) => {
        setError(''); setInputB(''); setHideSubmit(true)
        setLegend('continue'); setButton('button primary');
        const input = event.target.value;
        if (keyfile !== null) {
            setInputB(input);
        } else {
            setError('Connect keyfile')
        }
    };
    const handleOnKeyPress = ({
        key
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    };
    const handleSave = async () => {
        try {
            const msg = await decryptData(inputB, keyfile)
            setMsg(msg);
            setLegend('saved');
            setButton('button');
            setHideSubmit(false);
        } catch (error) {
            setError('could not decrypt')
        }
    };

    const handleSubmit = async () => {
        if (arConnect !== null) {
            try {
                console.log('arconnect')
                // const encrypted_key = dkms.get('soul');
                console.log('soul DID key', soul_key!)
                const private_key = await decryptKey(arConnect, soul_key!);
                const public_key = zcrypto.getPubKeyFromPrivateKey(private_key);
                console.log(public_key)

                const hash_ = await HashString(inputB);
                console.log(hash_)

                const signature_ = '0x' + zcrypto.sign(Buffer.from(hash_, 'hex'), private_key, public_key);
                setSignature(signature_);
                console.log('sig_', signature_)
            } catch (error) {
                setError('identity verification unsuccessful')
            }
        }
    };

    return (
        <div className={styles.container}>
            <h2 style={{ color: 'lightblue', marginBottom: '7%' }}>
                Sign an IVMS101 Message
            </h2>
            {
                signature === '' &&
                <div className={styles.containerInput}>
                    {/* <input
                        ref={callbackRef}
                        type="text"
                        placeholder="Type NFT Username without .did"
                        onChange={handleInput}
                        autoFocus
                        style={{ width: '60%' }}
                    /> */}
                    <input
                        ref={callbackRef}
                        type="text"
                        style={{ width: '70%' }}
                        placeholder="Type encrypted message"
                        onChange={handleInputB}
                        onKeyPress={handleOnKeyPress}
                        autoFocus
                    />
                    <input style={{ marginLeft: '2%' }} type="button" className={button} value={legend}
                        onClick={() => {
                            handleSave();
                        }}
                    />
                </div>
            }
            {
                !hideSubmit && error === '' && signature === '' &&
                <div style={{ marginTop: '10%' }}>
                    <button className={styles.button} onClick={handleSubmit}>
                        make{' '}
                        <span className={styles.x}>
                            signature
                        </span>
                    </button>
                </div>
            }
            {
                msg !== '' &&
                <>
                    <p>
                        {JSON.stringify(msg)}
                    </p>
                </>
            }
            {
                signature !== '' &&
                <code>
                    <ul>
                        <li>
                            Your VC signature: {signature}
                        </li>
                    </ul>
                </code>
            }
            {
                error !== '' &&
                <p className={styles.error}>
                    Error: {error}
                </p>
            }
        </div>
    );
}

export default Component;
