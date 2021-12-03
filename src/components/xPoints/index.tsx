import { useStore } from 'effector-react';
import React, { useState } from 'react';
import * as tyron from 'tyron';
import { ZilPayBase } from '../ZilPay/zilpay-base';
import styles from './styles.module.scss';
import { $net } from 'src/store/wallet-network';

function Component() {
    const net = useStore($net);
    const [hideAdd, setHideAdd] = useState(true);
    const [addLegend, setAddLegend] = useState('new motion');
    const [hideList, setHideList] = useState(true);

    const [error, setError] = useState('');

    const handleTest = async () => {
        try {
            const zilpay = new ZilPayBase();
            const id = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.none, 'ByStr32');
            const motion = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.some, 'String', 'let us be self-sovereign!');
            const tyron_ = await tyron.TyronZil.default.OptionParam(tyron.TyronZil.Option.none, 'Uint128');

            const params = [];
            const action = {
                vname: 'action',
                type: 'String',
                value: 'new',
            };
            params.push(action);
            const id_ = {
                vname: 'id',
                type: 'Option ByStr32',
                value: id,
            };
            params.push(id_);
            const motion_ = {
                vname: 'motion',
                type: 'Option String',
                value: motion,
            };
            params.push(motion_);
            const amount_ = {
                vname: 'amount',
                type: 'Uint128',
                value: '500000000000',
            };
            params.push(amount_);
            const tyron__ = {
                vname: 'tyron',
                type: 'Option Uint128',
                value: tyron_,
            };
            params.push(tyron__);
            await zilpay.call(
                {
                    contractAddress: '0x274850d6d7dda91efa32bf0f6d9992f07950eeab',   //@todo-test user
                    transition: 'XPoints',
                    params: params as unknown as Record<string, unknown>[],
                    amount: String(0)
                }
            )
                .then(res => {
                    window.open(
                        `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                    );
                })
        } catch (error) {
            const err = error as string;
            setError(err)
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '14%' }}>
            <h1 style={{ marginBottom: '7%' }}>
                <span className={styles.username}>
                    x
                </span>
                POINTS{' '}
                <span className={styles.username}>
                    dapp
                </span>
            </h1>
            {
                hideList &&
                <div style={{ marginTop: '14%' }}>
                    <h3 style={{ marginBottom: '7%' }}>
                        Raise Your Voice!
                    </h3>
                    <div style={{ marginTop: '14%' }}>
                        {
                            hideAdd
                                ? <button
                                    type="button"
                                    className={styles.button}
                                    onClick={() => {
                                        setHideAdd(false);
                                        setAddLegend('back');
                                    }}
                                >
                                    <p className={styles.buttonBlueText}>
                                        {addLegend}
                                    </p>
                                </button>
                                : <>
                                    <button
                                        type="button"
                                        className={styles.button}
                                        onClick={() => {
                                            setHideAdd(true);
                                            setAddLegend('new motion');
                                            //handleTest();
                                        }}
                                    >
                                        <p className={styles.buttonText}>
                                            {addLegend}
                                        </p>
                                    </button>
                                </>
                        }
                    </div>
                    {
                        !hideAdd &&
                        <div style={{ marginTop: '10%' }}>
                            <h2 style={{ color: 'lightblue' }}>your motion</h2>
                            <p>
                                TRANSACTIONS ON THE TYRON NETWORK ARE FOR FREE - YOU ONLY HAVE TO PAY FOR THE BLOCKCHAIN GAS. HOWEVER, WE NEED YOUR HELP TO independently DEVELOP THIS OPEN-SOURCE PROJECT THAT WANTS TO GIVE PEOPLE SOVEREIGNTY OVER THEIR DATA.
                            </p>
                            <p>
                                Donations are optional on every transaction, natively. These go to the donate.did self-sovereign account, which has three stakeholders:
                            </p>
                            <code>
                                <ol>
                                    <li>
                                        10% will get periodically donated by wfp.did to the UN WFP
                                    </li>
                                    <li>
                                        10% allocated to an insurance fund for the community
                                    </li>
                                    <li>
                                        and 80% to the tyron.coop - the protocol&apos;s cooperative team to pay for more working hours. The coop gets 50% of its funding from its TYRON allocation
                                    </li>
                                </ol>
                            </code>
                            <p>
                                more coming soon!
                            </p>
                        </div>
                    }
                </div>
            }
            {
                hideAdd &&
                <div style={{ marginTop: '10%' }}>
                    <p>
                        coming soon!
                    </p>
                </div>
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
