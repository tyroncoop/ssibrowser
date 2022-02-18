import React, { useState, useCallback } from 'react';
import { useStore } from 'effector-react';
import * as tyron from 'tyron';
import * as zcrypto from '@zilliqa-js/crypto';
import { toast } from 'react-toastify';
import { $donation, updateDonation } from '../../../src/store/donation';
import { ZilPayBase } from '../../ZilPay/zilpay-base';
import styles from './styles.module.scss';
import { $net } from '../../../src/store/wallet-network';
import { $contract } from '../../../src/store/contract';
import { HashGuardians } from '../../../src/lib/util';
import { TyronDonate } from '../..';
import { $arconnect } from '../../../src/store/arconnect';
import { $doc } from '../../../src/store/did-doc';
import { decryptKey } from '../../../src/lib/dkms';

function Component() {
    const callbackRef = useCallback(inputElement => {
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const arConnect = useStore($arconnect);
    const contract = useStore($contract);
    const dkms = useStore($doc)?.dkms;
    const donation = useStore($donation);
    const net = useStore($net);

    const [error, setError] = useState('');
    const [input, setInput] = useState(0);   // the amount of guardians
    const input_ = Array(input);
    const select_input = Array();
    for (let i = 0; i < input_.length; i += 1) {
        select_input[i] = i;
    }
    const [input2, setInput2] = useState([]);
    const guardians: string[] = input2;

    const [legend, setLegend] = useState('continue');
    const [button, setButton] = useState('button primary');

    const [hideDonation, setHideDonation] = useState(true);
    const [hideSubmit, setHideSubmit] = useState(true);
    const [txID, setTxID] = useState('');

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(''); setInput(0); setInput2([]); setHideSubmit(true); setHideDonation(true);
        setLegend('continue');
        setButton('button primary');
        let _input = event.target.value;
        const re = /,/gi;
        _input = _input.replace(re, ".");
        const input = Number(_input);

        if (
            !isNaN(input) && Number.isInteger(input) && input >= 3
        ) {
            setInput(input);
        } else if (isNaN(input)) {
            setError('the input is not a number')
        } else if (!Number.isInteger(input)) {
            setError('the number of guardians must be an integer')
        } else if (input < 3 && input !== 0) {
            setError('the number of guardians must be at least three')
        }
    };

    const handleSave = async () => {
        setError('');
        if (guardians.length === input_.length) {
            setButton('button'); setLegend('saved');
            setHideDonation(false); setHideSubmit(false);
        } else {
            setError('the input is incomplete')
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (arConnect !== null && contract !== null && donation !== null) {
            try {
                const zilpay = new ZilPayBase();
                const txID = 'ConfigureSocialRecovery';
                let tyron_;
                const donation_ = String(donation * 1e12);
                switch (donation) {
                    case 0:
                        tyron_ = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.none, 'Uint128');
                        break;
                    default:
                        tyron_ = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.some, 'Uint128', donation_);
                        break;
                }
                const [guardians_, hash] = await HashGuardians(guardians);
                const encrypted_key = dkms.get('update');
                const update_private_key = await decryptKey(arConnect, encrypted_key);
                const update_public_key = zcrypto.getPubKeyFromPrivateKey(update_private_key);
                const sig = '0x' + zcrypto.sign(Buffer.from(hash, 'hex'), update_private_key, update_public_key);

                const params = Array();
                const _guardians: tyron.TyronZil.TransitionParams = {
                    vname: 'guardians',
                    type: 'List ByStr32',
                    value: guardians_,
                };
                params.push(_guardians);
                const _sig: tyron.TyronZil.TransitionParams = {
                    vname: 'sig',
                    type: 'ByStr64',
                    value: sig,
                };
                params.push(_sig);
                const _tyron: tyron.TyronZil.TransitionParams = {
                    vname: 'tyron',
                    type: 'Option Uint128',
                    value: tyron_,
                };
                params.push(_tyron);

                //const tx_params: tyron.TyronZil.TransitionValue[] = [tyron_];
                const _amount = String(donation);

                toast.info(`You're about to submit a transaction to configure social recovery. You're also donating ${donation} ZIL to donate.did, which gives you ${donation} xPoints!`, {
                    position: "top-left",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'dark',
                });
                await zilpay.call({
                    contractAddress: contract.addr,
                    transition: txID,
                    params: params as unknown as Record<string, unknown>[],
                    amount: _amount   //@todo-ux would u like to top up your wallet as well?
                })
                    .then(res => {
                        setTxID(res.ID);
                        updateDonation(null);
                    })
                    .catch(err => setError(err))
            } catch (error) {
                setError('identity verification unsuccessful')
            }
        }
    };

    return (
        <div style={{ marginTop: '14%' }}>
            <h3 style={{ color: 'lightblue', marginBottom: '7%' }}>
                social recovery
            </h3>
            {
                txID === '' &&
                <>
                    <code style={{ width: '70%' }}>
                        <ul>
                            <li>
                                How many guardians would you like?
                            </li>
                        </ul>
                    </code>
                    <div style={{ marginLeft: '50%', marginBottom: '7%' }}>
                        <input
                            ref={callbackRef}
                            style={{ width: '70%' }}
                            type="text"
                            placeholder="Type amount"
                            onChange={handleInput}
                            autoFocus
                        />
                    </div>
                    {
                        input >= 3 &&
                        select_input.map((res: any) => {
                            return (
                                <section key={res} className={styles.container}>
                                    <code style={{ width: '50%' }}>
                                        Guardian #{res + 1}
                                    </code>
                                    <input
                                        ref={callbackRef}
                                        style={{ width: '70%' }}
                                        type="text"
                                        placeholder="Type NFT Username"
                                        onChange={
                                            (event: React.ChangeEvent<HTMLInputElement>) => {
                                                setButton('button primary'); setLegend('continue');
                                                setHideDonation(true); setHideSubmit(true);
                                                guardians[res] = (event.target.value).toLowerCase();
                                            }
                                        }
                                        autoFocus
                                    />
                                    <code>.did</code>
                                </section>
                            )
                        })
                    }
                    {
                        input >= 3 &&
                        <input style={{ marginTop: "7%" }} type="button" className={button} value={legend}
                            onClick={() => {
                                handleSave();
                            }}
                        />
                    }
                    {
                        !hideDonation &&
                        <TyronDonate />
                    }
                    {
                        !hideSubmit && donation !== null && error === '' &&
                        <div style={{ marginTop: '10%' }}>
                            <button className={styles.button} onClick={handleSubmit}>
                                Configure{' '}
                                <span className={styles.x}>
                                    did social recovery
                                </span>
                            </button>
                            <p className={styles.gascost}>
                                Gas: 1-2 ZIL
                            </p>
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
                    Error: {error}
                </p>
            }
        </div>
    );
}

export default Component;
