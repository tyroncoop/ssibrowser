import { useStore } from 'effector-react';
import React, { useState } from 'react';
import { $arconnect } from 'src/store/arconnect';
import { NFTUsernameDomain, TransferNFTUsername } from '..';
import styles from './styles.module.scss';

function Component() {
    const arConnect = useStore($arconnect);

    const [hideVC, setHideVC] = useState(true);
    const [vcLegend, setVCLegend] = useState('.vc');
    const [hideDex, setHideDex] = useState(true);
    const [dexLegend, setDexLegend] = useState('.dex');
    const [hideStake, setHideStake] = useState(true);
    const [stakeLegend, setStakeLegend] = useState('.stake');
    const [hideTransfer, setHideTransfer] = useState(true);
    const [transferLegend, setTransferLegend] = useState('transfer NFT username');

    return (
        <div style={{ marginTop: '14%', textAlign: 'center' }}>
            {
                hideTransfer && hideDex && hideStake && hideVC &&
                <h3 style={{ marginBottom: '7%' }}>
                    Available <span style={{ textTransform: 'lowercase' }}>x</span>Wallet domains:
                </h3>
            }
            {
                hideTransfer &&
                <>
                    <div>
                        {
                            hideStake && hideVC && <>{
                                hideDex
                                    ? <button
                                        type="button"
                                        className={styles.button}
                                        onClick={() => {
                                            setHideDex(false);
                                            setDexLegend('back');
                                        }}
                                    >
                                        <p className={styles.buttonColorText}>
                                            {dexLegend}
                                        </p>
                                    </button>
                                    : <>
                                        <h2>
                                            <span style={{ color: 'lightblue' }}>decentralized exchange</span>{' '}<span style={{ textTransform: 'lowercase' }}>x</span>Wallet domain
                                        </h2>
                                    </>
                            }</>
                        }
                        {
                            !hideDex &&
                            <p>
                                Coming soon!
                            </p>
                        }
                    </div>
                    <div>
                        {
                            hideDex && hideVC && <>{
                                hideStake
                                    ? <button
                                        type="button"
                                        className={styles.button}
                                        onClick={() => {
                                            setHideStake(false);
                                            setStakeLegend('back');
                                        }}
                                    >
                                        <p className={styles.buttonColorText}>
                                            {stakeLegend}
                                        </p>
                                    </button>
                                    : <>
                                        <h2>
                                            <span style={{ color: 'lightblue' }}>staking</span>{' '}<span style={{ textTransform: 'lowercase' }}>x</span>Wallet domain
                                        </h2>
                                    </>
                            }</>
                        }
                        {
                            !hideStake &&
                            <p>
                                Coming soon!
                            </p>
                        }
                    </div>
                    <div>
                        {
                            hideDex && hideStake && <>{
                                hideVC
                                    ? <>
                                        <h4 style={{ marginTop: '10%' }}>
                                            exclusive for self-sovereign communities:
                                        </h4>
                                        <button
                                            type="button"
                                            className={styles.button}
                                            onClick={() => {
                                                if (arConnect === null) {
                                                    alert('To continue, connect your SSI Private Key: Click on Connect -> SSI Private Key')
                                                } else {
                                                    alert('If you want a Tyron VC, go to tyron.vc instead!')
                                                    setHideVC(false);
                                                    setVCLegend('back');
                                                }
                                            }}
                                        >
                                            <p className={styles.buttonBlueText}>
                                                {vcLegend}
                                            </p>
                                        </button>
                                    </>
                                    : <>
                                        <h2>
                                            <span style={{ color: 'lightblue' }}>verifiable credentials</span>{' '}<span style={{ textTransform: 'lowercase' }}>x</span>Wallet domain
                                        </h2>
                                    </>
                            }</>
                        }
                        {
                            !hideVC &&
                            <NFTUsernameDomain
                                {...{
                                    domain: 'vc',
                                }}
                            />
                        }
                    </div>
                </>
            }
            {
                hideDex && hideStake && hideVC &&
                hideTransfer &&
                <div style={{ marginTop: '14%' }}>
                    <p>
                        danger zone
                    </p>
                    <button
                        type="button"
                        className={styles.button}
                        onClick={() => {
                            setHideTransfer(false);
                            setTransferLegend('back');
                        }}
                    >
                        <p className={styles.buttonColorDText}>
                            {transferLegend}
                        </p>
                    </button>
                </div>
            }
            {
                !hideTransfer &&
                <TransferNFTUsername />
            }
        </div>
    );
}

export default Component
