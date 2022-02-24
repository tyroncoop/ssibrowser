import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  SMART_CONTRACTS_URLS,
  VALID_SMART_CONTRACTS,
} from "../../src/constants/tyron";
import { DOMAINS } from "../../src/constants/domains";
import { fetchAddr, isValidUsername, resolve } from "./utils";
import styles from "./styles.module.scss";
import { $user, updateUser } from "../../src/store/user";
import { useStore } from "effector-react";
import { updateContract } from "../../src/store/contract";
import { updateDoc } from "../../src/store/did-doc";
import { updateLoggedIn } from "../../src/store/loggedIn";
import { updateDonation } from "../../src/store/donation";
import { $wallet } from "../../src/store/wallet";
import { $isAdmin, updateIsAdmin } from "../../src/store/admin";
import { $net } from "../../src/store/wallet-network";
import { updateSSIInterface } from "../../src/store/ssi_interface";

function Component() {
  const callbackRef = useCallback((inputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  const Router = useRouter();
  const net = useStore($net);
  const zil_address = useStore($wallet);
  const user = useStore($user);
  const username = user?.name!;
  const domain = user?.domain!;
  const is_admin = useStore($isAdmin);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const spinner = (
    <i className="fa fa-lg fa-spin fa-circle-notch" aria-hidden="true"></i>
  );

  const checkPath = () => {
    const input = window.location.pathname.replace("/", "").toLowerCase();
    if (input === "") {
      return false;
    } else if (
      input === "buynftusername" ||
      input === "didxwallet" ||
      input === "treasury" ||
      input === "verifiablecredentials" ||
      input === "xpoints"
    ) {
      return false;
    } else if (
      input.split("/")[1] === "did" ||
      input.split("/")[1] === "xwallet" ||
      input.split("/")[1] === "recovery" ||
      input.split("/")[1] === "funds" ||
      input.split(".")[1] === "vc" ||
      input.split(".")[1] === "treasury" ||
      input.split(".")[1] === "did"
    ) {
      return false;
    } else {
      return true;
    }
  };

  const checkDomain = () => {
    const path = window.location.pathname.replace("/", "").toLowerCase();
    if (path.split('.')[1] === 'did' || path.split('.')[1] === 'vc' || path.split('.')[1] === 'treasury') {
      return true
    } else {
      return false
    }
  }

  const handleOnChange = ({
    currentTarget: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    Router.push("/");
    setError("");
    updateSSIInterface(null);
    updateLoggedIn(null);
    updateDonation(null);
    updateContract(null);
    updateIsAdmin({
      verified: false,
      hideWallet: true,
      legend: "access DID wallet",
    });

    const input = value.toLowerCase();
    if (value.includes(".")) {
      const [username = "", domain = ""] = input.split(".");
      updateUser({
        name: username,
        domain: domain
      })
    } else {
      updateUser({
        name: input,
        domain: 'did'
      })
    }
  };

  const handleOnKeyPress = ({ key }: React.KeyboardEvent<HTMLInputElement>) => {
    if (key === "Enter") {
      getResults();
    }
  };

  const resolveDid = async () => {
    const path = window.location.pathname.replace("/", "").toLowerCase();
    const _username = checkPath() ? path : checkDomain() ? path.split('.')[0] : path.split('/')[1] === 'did' ?  path.split('/')[0] : username
    const _domain = checkPath() ? 'did' : checkDomain() ? path.split('.')[1] : path.split('/')[1] === 'did' ?  'did' : domain
    if (
      isValidUsername(_username) ||
      _username === "init" ||
      _username === "tyron" ||
      _username === "donate" ||
      _username === "wfp"
    ) {
      await fetchAddr({ net, _username, _domain })
        .then(async (addr) => {
          if (_username === "xpoints") {
            Router.push("/XPoints");
          } else {
            try {
              await resolve({ net, addr })
                .then((result) => {
                  if (path === "") {
                    updateSSIInterface("");
                    Router.push(`/${_username}`);
                  }
                  const controller = result.controller.toLowerCase();
                  updateContract({
                    addr: addr,
                    controller: controller,
                    status: result.status,
                  });
                  if (controller === zil_address?.base16.toLowerCase()) {
                    if (path !== "") {
                      updateIsAdmin({
                        verified: true,
                        hideWallet: true,
                        legend: "access DID wallet",
                      });
                    }
                  } else {
                    updateIsAdmin({
                      verified: false,
                      hideWallet: true,
                      legend: "access DID wallet",
                    });
                  }
                  updateDoc({
                    did: result.did,
                    version: result.version,
                    doc: result.doc,
                    dkms: result.dkms,
                    guardians: result.guardians,
                  });
                })
                .catch((err) => {
                  throw err;
                });
            } catch (error) {
              toast('Coming soon!', {
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
          }
        })
        .catch(() => {
          Router.push("/BuyNFTUsername");
        });
    } else {
      if (checkPath()) {
        Router.push("/");
        setTimeout(() => {
          toast.error("Invalid username. Names with less than seven characters are premium and will be for sale later on.", {
            position: "top-left",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
          });
        }, 1000);
      }
      setError(
        "Invalid username. Names with less than seven characters are premium and will be for sale later on."
      );
    }
  };

  const resolveDomain = async () => {
    await fetchAddr({ net, _username: username, _domain: "did" })
      .then(async (addr) => {
        const result = await resolve({ net, addr });
        await fetchAddr({ net, _username: username, _domain: domain })
          .then(async (domain_addr) => {
            const controller = result.controller;
            if (
              controller.toLowerCase() === zil_address?.base16.toLowerCase()
            ) {
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
            updateContract({
              addr: domain_addr,
              controller: controller,
              status: result.status,
            });
            updateDoc({
              did: result.did,
              version: result.version,
              doc: result.doc,
              dkms: result.dkms,
              guardians: result.guardians,
            });
            switch (domain) {
              case DOMAINS.VC:
                Router.push(`/${username}.vc`);
                break;
              case DOMAINS.TREASURY:
                Router.push(`/${username}.treasury`);
                break;
              default:
                updateSSIInterface("");
                Router.push(`/${username}`);
                break;
            }
          })
          .catch(() => {
            setError(
              `Initialize this xWallet domain  at ${username}'s NFT Username DNS.`
            );
          });
      })
      .catch(() => {
        Router.push("/BuyNFTUsername");
      });
  };

  const getResults = async () => {
    setLoading(true);
    setError("");
    updateDonation(null);
    updateIsAdmin({
      verified: false,
      hideWallet: true,
      legend: "access DID wallet",
    });
    const path = window.location.pathname.replace("/", "").toLowerCase();
    updateUser({
      name: checkPath() ? path : checkDomain() ? path.split('.')[0] : path.split('/')[1] === 'did' ?  path.split('/')[0] : username,
      domain: checkPath() ? 'did' : checkDomain() ? path.split('.')[1] : path.split('/')[1] === 'did' ?  'did' : domain
    });
    switch (checkPath() ? 'did' : checkDomain() ? path.split('.')[1] : path.split('/')[1] === 'did' ?  'did' : domain) {
      case DOMAINS.TYRON:
        if (VALID_SMART_CONTRACTS.includes(username))
          window.open(
            SMART_CONTRACTS_URLS[
            username as unknown as keyof typeof SMART_CONTRACTS_URLS
            ]
          );
        else setError("Invalid smart contract");
        break;
      case DOMAINS.DID:
        await resolveDid();
        break;
      case DOMAINS.VC:
        await resolveDomain();
        break;
      case DOMAINS.TREASURY:
        await resolveDomain();
        break;
      case DOMAINS.PSC:
        toast('Coming soon!', {
          position: "top-left",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark',
        }); //await resolveDomain();
        break;
      case DOMAINS.DEX:
        await resolveDomain();
        break;
      case DOMAINS.STAKE:
        await resolveDomain();
        break;
      default:
        setError("Invalid domain.");
        break;
    }
    setLoading(false);
  };

  useEffect(() => {
    const path = window.location.pathname.replace("/", "").toLowerCase();
    if (path !== "") {
      getResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.searchDiv}>
        <label htmlFor="">Type an SSI username</label>
        <input
          ref={callbackRef}
          type="text"
          className={styles.searchBar}
          onChange={handleOnChange}
          onKeyPress={handleOnKeyPress}
          value={username}
          placeholder={username}
          autoFocus
        />
        <div>
          <button onClick={getResults} className={styles.searchBtn}>
            {loading ? spinner : <i className="fa fa-search"></i>}
          </button>
        </div>
      </div>
      {error !== "" && <code>Error: {error}</code>}
    </div>
  );
}

export default Component;
