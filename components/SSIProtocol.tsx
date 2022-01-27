import React from 'react';
import styles from '../styles/SSIProtocol.module.css';

function SSIProtocol() {
    const handleOnClick = () => {
        window.open("https://ssiprotocol.com")
    };

    return (
        <>
            <button className={styles.button} onClick={handleOnClick}>
                SSI Protocol
            </button>
        </>
    );
}

export default SSIProtocol;
