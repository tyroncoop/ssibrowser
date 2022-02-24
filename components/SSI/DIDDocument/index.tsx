import React, { useState } from "react";
import { useStore } from "effector-react";
import { $user } from "../../../src/store/user";
import { updateSSIInterface } from "../../../src/store/ssi_interface";
import styles from "./styles.module.scss";
import { useRouter } from 'next/router'
import { $doc } from "../../../src/store/did-doc";

function Component() {
  const username = useStore($user)?.name;
  const doc = useStore($doc)?.doc;
  const Router = useRouter();

  let exists = false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10%' }}>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          updateSSIInterface('');
          Router.push(`/${username}`);
        }}
      >
        <p className={styles.buttonText}>back</p>
      </button>
      <div style={{ marginTop: "70px" }}>
        <h2 className={styles.title}>DID Document</h2>
        {doc !== null &&
          doc?.map((res: any) => {
            if (res[0] === "Decentralized identifier") {
              const did = res[1] as string;
              switch (did) {
                case "Not activated yet.":
                  return (
                    <div key={res} className={styles.docInfo}>
                      <h3 className={styles.blockHead}>{res[0]}</h3>
                      <p className={styles.didkey}>{did}</p>
                    </div>
                  );
                default: {
                  exists = true;
                  let network = did.substring(14, 18);
                  switch (network) {
                    case "test":
                      network = "testnet";
                      break;
                    case "main":
                      network = "mainnet";
                      break;
                  }
                  const addr = did.substring(19);
                  return (
                    <div key={res} className={styles.docInfo}>
                      <h3 className={styles.blockHead}>{res[0]}</h3>
                      <p className={styles.did}>
                        {did.substring(0, 19)}
                        <a
                          style={{ color: '#ffff32' }}
                          href={`https://viewblock.io/zilliqa/address/${addr}?network=${network}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {addr}
                        </a>
                      </p>
                    </div>
                  );
                }
              }
            }
          })}
        {
          exists &&
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className={styles.card}
              onClick={() => {
                updateSSIInterface("")
                Router.push(`/${username}/did/keys`)
              }}
            >
              <p className={styles.cardTitle}>
                KEYS
              </p>
              <p className={styles.cardTitle2}>
                VERIFICATION METHODS
              </p>
            </div>
            <div
              className={styles.card}
              onClick={() => {
                updateSSIInterface("")
                Router.push(`/${username}/did/services`)
              }}
            >
              <p className={styles.cardTitle}>
                SERVICES
              </p>
              <p className={styles.cardTitle2}>
                WEBSITES
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

export default Component;
