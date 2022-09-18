import React, { useState } from 'react';
import * as tyron from 'tyron';
import * as zcrypto from '@zilliqa-js/crypto';
import { SubmitUpdateDoc, TyronDonate } from '../..';
import styles from './styles.module.scss';
import { useStore } from 'effector-react';
import { $user } from 'src/store/user';

function Component() {
    const user = useStore($user)
    const [id, setID] = useState('');
    const [addr, setInput] = useState('');

    const [legend, setLegend] = useState('Save');
    const [button, setButton] = useState('button primary');
    const [error, setError] = useState('');

    const handleID = (event: { target: { value: any; }; }) => {
        setLegend('Save');
        setButton('button primary');
        const input = event.target.value;

        setID(String(input).toLowerCase());
    };
    const handleInput = (event: { target: { value: any; }; }) => {
        setLegend('Save');
        setButton('button primary');
        let input = event.target.value;
        try {
            input = zcrypto.fromBech32Address(input);
            setInput(input);
        } catch (error) {
            try {
                zcrypto.toChecksumAddress(input);
                setInput(input);
            } catch {
                setError('wrong address.')
            }
        }
    };

    const services: tyron.DocumentModel.ServiceModel[] = [];
    // if( id !== '' && addr !== '' ){
    //     services.push({
    //         id: id,
    //         endpoint: tyron.DocumentModel.ServiceEndpoint.Web3Endpoint,
    //         address: addr
    //     })
    // }

    //@todo process all patches
    const patches: tyron.DocumentModel.PatchModel[] = [
        {
            action: tyron.DocumentModel.PatchAction.AddServices,
            services: services
        }
    ];

    return (
        <>
            {
                user?.nft === 'init' &&
                <div>
                    <h4>Services</h4>
                    <section className={styles.containerInput}>
                        <input
                            style={{ width: '20%' }}
                            type="text"
                            placeholder="Type service ID"
                            onChange={handleID}
                            autoFocus
                        />
                        <input
                            style={{ marginLeft: '1%', width: '60%' }}
                            type="text"
                            placeholder="Type service address"
                            onChange={handleInput}
                            autoFocus
                        />
                        <input style={{ marginLeft: '2%' }} type="button" className={button} value={legend}
                            onClick={() => {
                                try {
                                    zcrypto.fromBech32Address(addr);
                                    setLegend('Saved'); setButton('button');
                                } catch (error) {
                                    try {
                                        zcrypto.toChecksumAddress(addr);
                                        setLegend('Saved'); setButton('button');
                                    } catch {
                                        setError('wrong address.')
                                    }
                                }
                            }}
                        />
                    </section>
                    <TyronDonate />
                    <SubmitUpdateDoc
                        {...{
                            patches: patches
                        }} />
                </div>
            }
            {
                user?.nft !== 'init' &&
                <p>
                    Coming soon!
                </p>
            }
            {
                error !== '' &&
                <code>
                    Error: {error}
                </code>
            }
        </>
    );
}

export default Component
