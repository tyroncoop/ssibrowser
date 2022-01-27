import React from 'react';
// import { useStore } from 'effector-react';
import { $isAdmin, updateIsAdmin } from '../src/store/admin';
import styles from '../styles/AccessWallet.module.css';

function AccessWallet() {
    // const is_admin = useStore($isAdmin);

    // const handleShow = () => {
    //     updateIsAdmin({
    //         verified: true,
    //         hideWallet: false,
    //         legend: 'hide wallet'
    //     })
    // };
    // const handleHide = () => {
    //     updateIsAdmin({
    //         verified: true,
    //         hideWallet: true,
    //         legend: 'access DID wallet'
    //     })
    // };

    return (
        <>
            {
                //is_admin?.verified && is_admin.hideWallet &&
                <button
                    type="button"
                    className={styles.button}
                >
                    <p className={styles.buttonShow}>

                    </p>
                </button>
            }
            {
                //is_admin?.verified && !is_admin.hideWallet &&
                <button
                    type="button"
                    className={styles.button}

                >
                    <p className={styles.buttonHide}>

                    </p>
                </button>
            }
        </>
    );
}

export default AccessWallet;
