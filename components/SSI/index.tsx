import { useStore } from "effector-react";
import React, { ReactNode, useEffect, useState } from "react";
import { $doc } from "../../src/store/did-doc";
import { updateLoggedIn } from "../../src/store/loggedIn";
import { $user } from "../../src/store/user";
import { $ssi_interface, updateSSIInterface } from "../../src/store/ssi_interface";
import { $isAdmin, updateIsAdmin } from "../../src/store/admin";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";

interface LayoutProps {
  children: ReactNode;
}

function Component(props: LayoutProps) {
  const { children } = props;
  const Router = useRouter();
  const user = useStore($user);
  const doc = useStore($doc);
  const ssi_interface = useStore($ssi_interface);
  const is_admin = useStore($isAdmin);
  const [path, setPath] = useState('');

  const resetWalletState = () => {
    updateIsAdmin({
      verified: false,
      hideWallet: true,
      legend: "access DID wallet",
    });
  };

  useEffect(() => {
    const path = window.location.pathname.replace('/', '').split('/')[1]
    setPath(path)

    return () => {
      if (path === 'xwallet' || path === 'funds' || path === 'recovery' || path === 'did') {
        updateSSIInterface("");
        resetWalletState();
      }
    }
  }, [setPath])

  return (
    <div style={{ textAlign: "center", marginTop: "7%" }}>
      <h1 style={{ marginBottom: "10%" }}>
        <span style={{ color: "lightgrey" }}>
          Self-sovereign identity
          <p style={{ textTransform: "lowercase" }}>
            of
          </p>
        </span>
        <p className={styles.username}>
          <span style={{ color: "whitesmoke" }}>{user?.name}</span>
        </p>
      </h1>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {
          ssi_interface == "xwallet"
            ? (
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  updateSSIInterface("");
                  resetWalletState();
                  Router.back();
                }}
              >
                <p className={styles.buttonText}>back</p>
              </button>
            ) : ssi_interface === 'funds' ? (
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  updateSSIInterface("");
                  updateLoggedIn(null);
                  resetWalletState();
                  Router.back();
                }}
              >
                <p className={styles.buttonText}>back</p>
              </button>
            ) : ssi_interface === 'recovery' ? (
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  updateSSIInterface("");
                  resetWalletState();
                  Router.back();
                }}
              >
                <p className={styles.buttonText}>back</p>
              </button>
            ) : (
              <></>
            )}
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        {children}
      </div>
      {path !== 'did' ? (
        <div
          style={{
            marginTop: "7%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {ssi_interface === null || ssi_interface === "" ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <h2>
                  <div
                    className={styles.card}
                    onClick={() => {
                      Router.push(`/${user?.name}/did`);
                      updateSSIInterface('did');
                      resetWalletState();
                    }}
                  >
                    <p className={styles.cardTitle3}>did</p>
                    <p className={styles.cardTitle2}>
                      Decentralized Identifier document
                    </p>
                  </div>
                </h2>
                {
                  is_admin?.verified &&
                  <>
                    <div className={styles.xText}>
                      <h5>x</h5>
                    </div>
                    <h2>
                      <div
                        className={styles.card}
                        onClick={() => {
                          updateSSIInterface('xwallet');
                          resetWalletState();
                          Router.push(`/${user?.name}/xwallet`);
                        }}
                      >
                        <p className={styles.cardTitle}>wallet</p>
                        <p className={styles.cardTitle2}>
                          Access your wallet
                        </p>
                      </div>
                    </h2>
                  </>
                }
              </div>
              <h2>
                <div
                  className={styles.card}
                  onClick={() => {
                    if (
                      Number(doc?.version.substr(8, 1)) >= 4 ||
                      doc?.version.substr(0, 4) === "init" ||
                      doc?.version.substr(0, 3) === "dao"
                    ) {
                      updateSSIInterface('funds');
                      resetWalletState();
                      Router.push(`/${user?.name}/funds`);
                    } else {
                      toast.info(`This feature is available from version 4. Upgrade ${user?.name}'s SSI.`, {
                        position: "top-left",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'dark',
                      });
                    }
                  }}
                >
                  <p className={styles.cardTitle3}>add funds</p>
                  <p className={styles.cardTitle2}>
                    Donate to {user?.name}
                  </p>
                </div>
              </h2>
              <h2>
                <div
                  className={styles.card}
                  onClick={() => {
                    updateSSIInterface('recovery');
                    resetWalletState();
                    Router.push(`/${user?.name}/recovery`);
                  }}
                >
                  <p className={styles.cardTitle3}>social recovery</p>
                  <p className={styles.cardTitle2}>
                    Update DID Controller
                  </p>
                </div>
              </h2>
            </>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}
    </div >
  );
}

export default Component;
