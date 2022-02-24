import React, { useState } from "react";
import { useRouter } from "next/router";
import * as zcrypto from "@zilliqa-js/crypto";
import { toast } from "react-toastify";
import ZilpayIcon from "../../src/assets/logos/lg_zilpay.svg";
import styles from "./styles.module.scss";
import { useStore } from "effector-react";
import { ZilPayBase } from "./zilpay-base";
import { Block, Net } from "../../src/types/zil-pay";
import { $wallet, updateAddress, Wallet } from "../../src/store/wallet";
import {
  $transactions,
  updateTxList,
  clearTxList,
  writeNewList,
} from "../../src/store/transactions";
import { $net, updateNet } from "../../src/store/wallet-network";
import { $contract } from "../../src/store/contract";
import { updateIsAdmin } from "../../src/store/admin";
import { $user, updateUser } from "../../src/store/user";
import { connect, ConnectedProps } from "react-redux";
import { hideSignInModal } from "../../src/app/actions";
import { RootState } from "../../src/app/reducers";
import Image from "next/image";

const mapStateToProps = (state: RootState) => ({
  modal: state.modal.signInModal,
});

const mapDispatchToProps = {
  dispatchHideModal: hideSignInModal,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type ModalProps = ConnectedProps<typeof connector>;

let observer: any = null;
let observerNet: any = null;
let observerBlock: any = null;

function ZilPay(props: ModalProps) {
  const { dispatchHideModal } = props;
  const zil_address = useStore($wallet);
  const net = useStore($net);
  const user = useStore($user);
  const username = user?.name!;
  const domain = user?.domain!;
  const [account, setAccount] = useState("");
  const Router = useRouter();

  const transactions = useStore($transactions);
  const contract = useStore($contract);
  let zilpay_eoa;

  if (account !== undefined && account !== "") {
    zilpay_eoa = zcrypto.toBech32Address(account);
    if (contract !== null) {
      const zilpay_eoa = account.toLowerCase();

      if (contract.controller === zilpay_eoa) {
        updateIsAdmin({
          verified: true,
          hideWallet: true,
          legend: "access DID wallet",
        });
      } else {
        updateIsAdmin({
          verified: false,
          hideWallet: true,
          legend: "access DID wallet",
        });
      }
    }
  }

  const hanldeObserverState = React.useCallback(
    (zp) => {
      if (zp.wallet.defaultAccount) {
        const address = zp.wallet.defaultAccount;
        updateAddress(address);
        setAccount(address.base16);
        if (window.location.pathname.replace("/", "").toLowerCase() === 'buynftusername') {
          dispatchHideModal()
          Router.push(`/${username}`)
        }
        if (zil_address === null) {
          toast.info(`ZilPay account previously connected to: ${ address.bech32.slice(0, 5) }...${ address.bech32.slice(-9) }`, {
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
      } else {
        updateIsAdmin({
          verified: false,
          hideWallet: true,
          legend: "access DID wallet",
        });
      }

      if (zp.wallet.net) {
        updateNet(zp.wallet.net);
      }

      if (observerNet) {
        observerNet.unsubscribe();
      }
      if (observer) {
        observer.unsubscribe();
      }
      if (observerBlock) {
        observerBlock.unsubscribe();
      }

      observerNet = zp.wallet.observableNetwork().subscribe((net: Net) => {
        updateNet(net);
      });

      observer = zp.wallet
        .observableAccount()
        .subscribe(async (address: Wallet) => {
          if (zil_address?.base16 !== address.base16) {
            updateAddress(address);
            setAccount(address.base16);
          }

          clearTxList();

          const cache = window.localStorage.getItem(
            String(zp.wallet.defaultAccount?.base16)
          );

          if (cache) {
            updateTxList(JSON.parse(cache));
          }
        });

      observerBlock = zp.wallet
        .observableBlock()
        .subscribe(async (block: Block) => {
          let list = $transactions.getState();
          for (let index = 0; index < block.TxHashes.length; index++) {
            const element = block.TxHashes[index];

            for (let i = 0; i < list.length; i++) {
              const tx = list[i];

              if (tx.confirmed) {
                continue;
              }

              if (element.includes(tx.hash)) {
                try {
                  const res = await zp.blockchain.getTransaction(tx.hash);
                  if (res && res.receipt && res.receipt.errors) {
                    tx.error = true;
                  }
                  list[i].confirmed = true;
                } catch {
                  continue;
                }
              }
            }
          }
          const listOrPromises = list.map(async (tx) => {
            if (tx.confirmed) {
              return tx;
            }

            try {
              const res = await zp.blockchain.getTransaction(tx.hash);

              if (res && res.receipt && res.receipt.errors) {
                tx.error = true;
              }

              tx.confirmed = true;
              return tx;
            } catch {
              return tx;
            }
          });

          list = await Promise.all(listOrPromises);
          writeNewList(list);
        });

      const cache = window.localStorage.getItem(
        String(zp.wallet.defaultAccount?.base16)
      );

      if (cache) {
        updateTxList(JSON.parse(cache));
      }
    },
    [zil_address, dispatchHideModal, Router, username]
  );
  //@todo update when changing zilpay wallets
  const handleConnect = React.useCallback(async () => {
    //@todo configure spinner
    try {
      const wallet = new ZilPayBase();
      const zp = await wallet.zilpay();
      const connected = await zp.wallet.connect();

      const network = zp.wallet.net;
      updateNet(network);

      if (connected && zp.wallet.defaultAccount) {
        const address = zp.wallet.defaultAccount;
        updateAddress(address);
        setAccount(address.base16);
        toast.info(`ZilPay account connected to: ${ address.bech32.slice(0, 5) }...${ address.bech32.slice(-9) }`, {
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

      const cache = window.localStorage.getItem(
        String(zp.wallet.defaultAccount?.base16)
      );
      if (cache) {
        updateTxList(JSON.parse(cache));
      }
    } catch (err) {
      toast.error(`Connection error: ${err}`, {
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
  }, []);

  React.useEffect(() => {
    const wallet = new ZilPayBase();

    wallet
      .zilpay()
      .then((zp: any) => {
        hanldeObserverState(zp);
      })
      .catch(() => {
        toast.info(`Install or connect to ZilPay.`, {
          position: "top-left",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark',
          toastId: 1
        });
      });

    return () => {
      if (observer) {
        observer.unsubscribe();
      }
      if (observerNet) {
        observerNet.unsubscribe();
      }
      if (observerBlock) {
        observerBlock.unsubscribe();
      }
    };
  });

  return (
    <>
      {zil_address === null && (
        <button
          type="button"
          className={styles.button}
          onClick={() => handleConnect()}
        >
          <div className={styles.zilpayIcon}>
            <Image alt="zilpay-ico" src={ZilpayIcon} />
          </div>
          <p className={styles.buttonText}>ZilPay</p>
        </button>
      )}
      {zil_address !== null && zilpay_eoa !== undefined && (
        <div className={styles.button}>
          <div className={styles.zilpayIcon}>
            <Image alt="zilpay-ico" src={ZilpayIcon} />
          </div>
          <p className={styles.buttonText2}>
            <a
              href={`https://viewblock.io/zilliqa/address/${zilpay_eoa}?network=${net}`}
              rel="noreferrer"
              target="_blank"
            >
              {zilpay_eoa.substr(0, 5)}...{zilpay_eoa.substr(33)}
            </a>
          </p>
        </div>
      )}
    </>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(ZilPay);
