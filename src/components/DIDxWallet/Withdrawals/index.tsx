import styles from './styles.module.scss';
import { useStore } from 'effector-react';
import React, { useState, useCallback } from 'react';
import { $net } from 'src/store/wallet-network';
import { TyronDonate } from 'src/components';
import * as zcrypto from '@zilliqa-js/crypto';
import * as tyron from 'tyron';
import { $donation, updateDonation } from 'src/store/donation';
import { $contract } from 'src/store/contract';
import { ZilPayBase } from 'src/components/ZilPay/zilpay-base';

function Component() {
    const callbackRef = useCallback(inputElement => {
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const [error, setError] = useState('');
    const [txID, setTxID] = useState('');
    const net = useStore($net);
    const donation = useStore($donation);
    const contract = useStore($contract);

    const [currency, setCurrency] = useState('');
    const [input, setInput] = useState(0);   // the amount to transfer
    const [inputB, setInputB] = useState('');
    const [input2, setInput2] = useState('');   // the amount to transfer

    const [legend, setLegend] = useState('continue');
    const [button, setButton] = useState('button primary');
    const [hideDonation, setHideDonation] = useState(true);
    const [hideSubmit, setHideSubmit] = useState(true);

    const handleOnChange = (event: { target: { value: any; }; }) => {
        setError('');
        setCurrency(event.target.value);
    };
    const handleOnChangeB = (event: { target: { value: any; }; }) => {
        setError('');
        setInputB(event.target.value);
    };

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(''); setInput(0); setHideDonation(true); setHideSubmit(true);
        setLegend('continue'); setButton('button primary');
        let input = event.target.value;
        const re = /,/gi;
        input = input.replace(re, ".");
        const input_ = Number(input);
        if (!isNaN(input_)) {
            if (input_ === 0) {
                setError('the amount cannot be zero')
            } else {
                setInput(input_);
            }
        } else {
            setError('the input it not a number')
        }
    }

    const handleInput2 = (event: { target: { value: any; }; }) => {
        setError(''); setInput2(''); setHideDonation(true); setHideSubmit(true);
        setLegend('continue'); setButton('button primary');
        let input = event.target.value;
        try {
            input = zcrypto.fromBech32Address(input);
            setInput2(input);
        } catch (error) {
            try {
                input = zcrypto.toChecksumAddress(input);
                setInput2(input);
            } catch {
                setError('wrong address')
            }
        }
    };
    const handleOnKeyPress2 = async ({
        key
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    };

    const handleSave = async () => {
        if (error === '') {
            if (input === 0) {
                setError('the amount cannot be zero')
            } else if (input2 === '') {
                setError('the recipient address cannot be null')
            } else {
                if (currency === 'ZIL' && inputB === '') {
                    setError('choose type of recipient')
                } else {
                    setLegend('saved');
                    setButton('button');
                    setHideDonation(false);
                    setHideSubmit(false);
                }
            }
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (contract !== null && donation !== null) {
            const zilpay = new ZilPayBase();
            const addr_name = currency.toLowerCase();

            let txID = 'Transfer';
            let amount = 0;

            switch (addr_name) {
                case 'zil':
                    txID = 'SendFunds';
                    amount = input * 1e12;
                    break;
                case 'tyron':
                    amount = input * 1e12;
                    break;
                case 'gzil':
                    amount = input * 1e15;
                    break;
                case 'xsgd':
                    amount = input * 1e6;
                    break;
                case 'xcad':
                    amount = input * 1e18;
                    break;
                case 'zwbtc':
                    amount = input * 1e8;
                    break;
                case 'zeth':
                    amount = input * 1e18;
                    break;
                case 'zusdt':
                    amount = input * 1e6;
                    break;
            }

            const beneficiary = {
                constructor: tyron.TyronZil.BeneficiaryConstructor.Recipient,
                addr: input2
            };

            try {
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

                const addr = contract.addr;
                let tx_params;
                switch (txID) {
                    case 'SendFunds': {
                        let tag = "";
                        if (inputB === 'contract') {
                            tag = 'AddFunds'
                        }
                        tx_params = await tyron.TyronZil.default.SendFunds(
                            addr,
                            tag,
                            beneficiary,
                            String(amount),
                            tyron_
                        );
                    }
                        break;
                    default:
                        tx_params = await tyron.TyronZil.default.Transfer(
                            addr,
                            addr_name,
                            beneficiary,
                            String(amount),
                            tyron_
                        );
                        break;
                }

                alert(`You're about to submit a transaction to transfer ${input} ${currency} to ${zcrypto.toBech32Address(input2)}. You're also donating ${donation} ZIL to donate.did, which gives you ${donation} xPoints!`);
                await zilpay.call({
                    contractAddress: addr,
                    transition: txID,
                    params: tx_params as unknown as Record<string, unknown>[],
                    amount: String(donation)   //@todo-ux would u like to top up your wallet as well?
                })
                    .then((res: any) => {
                        setTxID(res.ID);
                        updateDonation(null);
                    })
                    .catch((err: any) => setError(String(err)))
            } catch (error) {
                setError('issue found')
            }
        }
    };

    return (
        <div style={{ marginTop: '14%', textAlign: 'center' }}>
            <h2 style={{ color: 'lightblue', marginBottom: '7%' }}>
                withdrawals
            </h2>
            {
                txID === '' &&
                <>
                    <div className={styles.container}>
                        <select style={{ width: '40%' }} onChange={handleOnChange}>
                            <option value="">Select coin</option>
                            <option value="TYRON">TYRON</option>
                            <option value="ZIL">ZIL</option>
                            <option value="gZIL">gZIL</option>
                            <option value="XSGD">XSGD</option>
                            <option value="XCAD">XCAD</option>
                        </select>
                    </div>
                    {
                        currency !== '' &&
                        <>
                            <div className={styles.container}>
                                <code>{currency}</code>
                                <input
                                    ref={callbackRef}
                                    style={{ width: '30%' }}
                                    type="text"
                                    placeholder="Type amount"
                                    onChange={handleInput}
                                    autoFocus
                                />
                            </div>
                            <p style={{ textAlign: 'left', marginTop: '10%' }}>
                                Recipient:
                            </p>
                            {
                                currency === 'ZIL' &&
                                <div className={styles.container}>
                                    <select style={{ width: '40%' }} onChange={handleOnChangeB}>
                                        <option value="">Select type</option>
                                        <option value="EOA">EOA</option>
                                        <option value="contract">Smart contract</option>
                                    </select>
                                </div>
                            }
                            <div className={styles.containerInput}>
                                <input
                                    ref={callbackRef}
                                    type="text"
                                    style={{ width: '100%' }}
                                    placeholder="Type beneficiary address"
                                    onChange={handleInput2}
                                    onKeyPress={handleOnKeyPress2}
                                    autoFocus
                                />
                                <input style={{ marginLeft: '2%' }} type="button" className={button} value={legend}
                                    onClick={() => {
                                        handleSave()
                                    }}
                                />
                            </div>
                        </>
                    }
                    {
                        !hideDonation &&
                        <TyronDonate />
                    }
                    {
                        !hideSubmit && donation !== null &&
                        <div style={{ marginTop: '10%' }}>
                            <button className={styles.button} onClick={handleSubmit}>
                                Transfer{' '}
                                <span className={styles.x}>
                                    {input} {currency}
                                </span>
                            </button>
                            {
                                currency === 'ZIL' &&
                                <p className={styles.gascost}>
                                    Gas: around 2 ZIL
                                </p>
                            }
                            {
                                currency !== 'ZIL' &&
                                <p className={styles.gascost}>
                                    Gas: 4-6 ZIL
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
                    Error: {error}
                </p>
            }
        </div>
    )

}

export default Component
