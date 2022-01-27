//import React from 'react';
//import { connect, ConnectedProps } from 'react-redux';
import styles from '../styles/Connect.module.css';
import { showSignInModal } from '../src/app/actions';
import { ConnectModal } from '../src/Modals/ConnectModal/index';

const mapDispatchToProps = {
    dispatchShowModal: showSignInModal
};

//const connector = connect(undefined, mapDispatchToProps);

//type Props = ConnectedProps<typeof connector>;

//function Connect(props: Props) {
function Connect() {
    //const { dispatchShowModal } = props;

    // const handleOnClick = () => {
    //     dispatchShowModal();
    // };

    return (
        <>
            {/* <ConnectModal /> */}
            {/* <button className={styles.buttonSignIn} onClick={handleOnClick}> */}
            <button className={styles.buttonSignIn}>
                Connect
            </button>
        </>
    );
}

//export default connector(Connect);
export default Connect;
