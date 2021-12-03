import React, { useState } from 'react';
import { useStore } from 'effector-react';
import * as tyron from 'tyron';
import * as zcrypto from '@zilliqa-js/crypto';
import { $donation, updateDonation } from 'src/store/donation';
import styles from './styles.module.scss';
import { $net } from 'src/store/wallet-network';
import { $contract } from 'src/store/contract';
import { ZilPayBase } from 'src/components/ZilPay/zilpay-base';
import { TyronDonate } from 'src/components';
import { $doc } from 'src/store/did-doc';
import { $user } from 'src/store/user';
import { $arconnect } from 'src/store/arconnect';
import { decryptKey } from 'src/lib/dkms';
import { HashString } from 'src/lib/util';

function Component() {
    const user = useStore($user);
    const doc = useStore($doc);
    const arConnect = useStore($arconnect);
    const contract = useStore($contract);
    const donation = useStore($donation);
    const net = useStore($net);

    const [error, setError] = useState('');
    const [txID, setTxID] = useState('');

    const handleSubmit = async () => {
        if (doc?.did !== undefined && arConnect !== null && contract !== null && donation !== null) {
            try {
                const zilpay = new ZilPayBase();
                const txID = 'Lock';
                const encrypted_key = doc?.dkms.get('socialrecovery'); //@todo-hand if not, throw err
                const sr_private_key = await decryptKey(arConnect, encrypted_key);
                const sr_public_key = zcrypto.getPubKeyFromPrivateKey(sr_private_key);

                const hash = await HashString(doc?.did);

                const signature = '0x' + zcrypto.sign(Buffer.from(hash, 'hex'), sr_private_key, sr_public_key);

                let tyron_;
                const donation_ = donation * 1e12;
                switch (donation) {
                    case 0:
                        tyron_ = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.none, 'Uint128');
                        break;
                    default:
                        tyron_ = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.some, 'Uint128', donation_);
                        break;
                }

                const tx_params: tyron.TyronZil.TransitionParams[] = [
                    {
                        vname: 'signature',
                        type: 'ByStr64',
                        value: signature,
                    },
                    {
                        vname: 'tyron',
                        type: 'Option Uint128',
                        value: tyron_,
                    }
                ];
                const _amount = String(donation);

                alert(`You're about to submit a transaction to lock your account. You're also donating ${donation} ZIL to donate.did, which gives you ${donation} xPoints!`);
                await zilpay.call({
                    contractAddress: contract.addr,
                    transition: txID,
                    params: tx_params as unknown as Record<string, unknown>[],
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
        <div className={styles.container}>
            <h3 style={{ color: 'red' }}>
                lock account
            </h3>
            {
                txID === '' &&
                <>
                    <p style={{ marginTop: '7%', marginBottom: '7%' }}>
                        Only the owner of {user?.nft}&apos;s account can lock it.
                    </p>
                    <div>
                        <TyronDonate />
                    </div>
                    {
                        donation !== null &&
                        <button className={styles.button} onClick={handleSubmit}>
                            <span className={styles.x}>
                                lock
                            </span>
                            {' '}
                            <span style={{ textTransform: 'lowercase' }}>
                                {user?.nft}
                            </span>
                        </button>
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
                <code>
                    Error: {error}
                </code>
            }
        </div>
    );
}

export default Component;
