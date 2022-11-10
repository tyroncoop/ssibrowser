import * as tyron from 'tyron'
import { ZIlPayInject } from '../../src/types/zil-pay'
import { operationKeyPair } from '../../src/lib/dkms'
import { toast } from 'react-toastify'
import { updateShowZilpay } from '../../src/store/modal'

type Params = {
  contractAddress: string
  transition: string
  params: Record<string, unknown>[]
  amount: string
}

const zutil = tyron.Util.default.Zutil()
const window = global.window as any
const DEFAULT_GAS = {
  gasPrice: '2000',
  gaslimit: '10000',
}

export class ZilPayBase {
  public zilpay: () => Promise<ZIlPayInject>
  constructor() {
    this.zilpay = () =>
      new Promise((resolve, reject) => {
        if (!(process as any).browser) {
          return resolve({} as any)
        }
        let k = 0
        const i = setInterval(() => {
          if (k >= 10) {
            clearInterval(i)
            toast.error('ZilPay is not installed.', {
              position: 'top-right',
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: 'dark',
              toastId: 5,
            })
            updateShowZilpay(false)
          }

          if (typeof window['zilPay'] !== 'undefined') {
            clearInterval(i)
            return resolve(window['zilPay'])
          }

          k++
        }, 100)
      })
  }

  async getSubState(contract: string, field: string, params: string[] = []) {
    if (!(process as any).browser) {
      return null
    }

    const zilPay = await this.zilpay()
    const res = await zilPay.blockchain.getSmartContractSubState(
      contract,
      field,
      params
    )

    if (res.error) {
      throw new Error(res.error.message)
    }

    if (res.result && res.result[field] && params.length === 0) {
      return res.result[field]
    }

    if (res.result && res.result[field] && params.length === 1) {
      const [arg] = params
      return res.result[field][arg]
    }

    if (res.result && res.result[field] && params.length > 1) {
      return res.result[field]
    }

    return null
  }

  async getState(contract: string) {
    if (!(process as any).browser) {
      return null
    }
    const zilPay = await this.zilpay()
    const res = await zilPay.blockchain.getSmartContractState(contract)

    if (res.error) {
      throw new Error(res.error.message)
    }

    return res.result
  }

  async getBlockchainInfo() {
    if (!(process as any).browser) {
      return null
    }

    const zilPay = await this.zilpay()
    const { error, result } = await zilPay.blockchain.getBlockChainInfo()

    if (error) {
      throw new Error(error.message)
    }

    return result
  }

  async call(data: Params, gas?: any) {
    let this_gas = DEFAULT_GAS
    if (gas !== undefined) {
      this_gas = gas
    }
    const zilPay = await this.zilpay()
    const { contracts, utils } = zilPay
    const contract = contracts.at(data.contractAddress)
    const gasPrice = utils.units.toQa(
      this_gas.gasPrice,
      utils.units.Units.Li
    )
    const gasLimit = utils.Long.fromNumber(this_gas.gaslimit)
    const amount_ = zutil.units.toQa(data.amount, zutil.units.Units.Zil)

    const amount = amount_ || '0'

    return await contract.call(data.transition, data.params, {
      amount,
      gasPrice,
      gasLimit,
    })
  }

  async deployDid(net: string, address: string, arConnect: any) {
    try {
      const zilPay = await this.zilpay()
      const { contracts } = zilPay

      //@xalkan
      let XWALLET = 'zil1u267scqjs6rrgfs5c326el23hh78g9j38ng58m'
      let xInit = '0x2d7e1a96ac0592cd1ac2c58aa1662de6fe71c5b9'

      if (net === 'testnet') {
        XWALLET = '0x50ceA538f957a920A93a3890062Dfb58eAf42914'
        xInit = '0xec194d20eab90cfab70ead073d742830d3d2a91b'
      }
      const xwallet = contracts.at(XWALLET)
      const code = await xwallet.getCode()

      let verification_methods: any = []
      const did_methods: Array<{ key: string; val: string }> = []
      const did_dkms: Array<{ key: string; val: string }> = []
      if (arConnect !== null) {
        const key_input = [
          {
            id: tyron.VerificationMethods.PublicKeyPurpose.Update,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose
              .SocialRecovery,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose.General,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose.Auth,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose
              .Assertion,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose
              .Agreement,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose
              .Invocation,
          },
          {
            id: tyron.VerificationMethods.PublicKeyPurpose
              .Delegation,
          },
        ]
        for (const input of key_input) {
          // Creates the cryptographic DID key pair
          const doc = await operationKeyPair({
            arConnect: arConnect,
            id: input.id,
            addr: address,
          })
          verification_methods.push(doc.element.key)
        }
        for (let i = 0; i < verification_methods.length; i += 1) {
          did_methods.push({
            key: verification_methods[i].id,
            val: verification_methods[i].key,
          })
          did_dkms.push({
            key: verification_methods[i].id,
            val: verification_methods[i].encrypted,
          })
        }
      } else {
        did_methods.push({
          key: `${'update'}`,
          val: `${'0x000000000000000000000000000000000000000000000000000000000000000000'}`,
        })
        did_dkms.push({
          key: `${'null'}`,
          val: `${'null'}`,
        })
      }

      const init = [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'init_controller',
          type: 'ByStr20',
          value: `${address}`,
        },
        {
          vname: 'init',
          type: 'ByStr20',
          value: `${xInit}`,
        },
        {
          vname: 'did_methods',
          type: 'Map String ByStr33',
          value: did_methods,
        },
        {
          vname: 'did_dkms',
          type: 'Map String String',
          value: did_dkms,
        },
      ]
      const contract = contracts.new(code, init)
      const [tx, deployed_contract] = await contract.deploy({
        gasLimit: '55000',
        gasPrice: '2000000000',
      })
      return [tx, deployed_contract]
    } catch (error) {
      throw error
    }
  }

  async deployDomain(net: string, domain: string, address: string) {
    try {
      const zilPay = await this.zilpay()
      const { contracts } = zilPay
      let addr = ''

      // mainnet
      switch (domain) {
        case 'stake':
          addr = '0x6ae25f8df1f7f3fae9b8f9630e323b456c945e88'
          break
        case 'vc':
          addr = '0x6ae25f8df1f7f3fae9b8f9630e323b456c945e88'
          break
        case 'ssi':
          addr = ''
          break
      }
      if (net === 'testnet') {
        switch (domain) {
          case 'vc':
            addr = '0x25B4B343ba84D53c2f9Db964Fd966BB1a579EF25'
            break
          case 'ssi':
            addr = 'zil1jnc7wsynp4q9cvtmrkeea9eu2qmyvwdy8dxl53'
            break
        }
      }

      const template = contracts.at(addr)
      const code = await template.getCode()

      const init = [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'init_controller',
          type: 'ByStr20',
          value: `${address}`,
        },
      ]

      const contract = contracts.new(code, init)
      const [tx, deployed_contract] = await contract.deploy({
        gasLimit: '35000',
        gasPrice: '2000000000',
      })
      return [tx, deployed_contract]
    } catch (error) {
      throw error
    }
  }

  async deployDomainBeta(net: string, username: string) {
    try {
      //@xalkan
      let init_ = '0x2d7e1a96ac0592cd1ac2c58aa1662de6fe71c5b9'

      if (net === 'testnet') {
        init_ = '0xec194d20eab90cfab70ead073d742830d3d2a91b'
      }

      const zilPay = await this.zilpay()
      const { contracts } = zilPay

      //@xalkan
      const code = `
      (* v0.10.1
        ZILxWALLET: $ZIL Staking Smart Contract Wallet <> NFT Domain Name System
        Self-Sovereign Identity Protocol
        Copyright Tyron Mapu Community Interest Company 2022. All rights reserved.
        You acknowledge and agree that Tyron Mapu Community Interest Company (Tyron) own all legal right, title and interest in and to the work, software, application, source code, documentation and any other documents in this repository (collectively, the Program), including any intellectual property rights which subsist in the Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist), whether in source code or any other form.
        Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy, modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise attempt to extract the source code of, the Program or any part thereof, except that you may contribute to this repository.
        You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify, merge, combine with another program or create derivative works of the Program (such resulting program, collectively, the Resulting Program) solely for Non-Commercial Use as long as you:
        1. give prominent notice (Notice) with each copy of the Resulting Program that the Program is used in the Resulting Program and that the Program is the copyright of Tyron; and
        2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith, combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial Use restriction set forth herein.
        Non-Commercial Use means each use as described in clauses (1)-(3) below, as reasonably determined by Tyron in its sole discretion:
        1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each case without any anticipated commercial application;
        2. use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization or government institution; or
        3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally do not exceed 10,000 at any time.
        You will not use any trade mark, service mark, trade name, logo of Tyron or any other company or organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks, names or logos.
        If you have any questions, comments or interest in pursuing any other use cases, please reach out to us at mapu@ssiprotocol.com.*)
        
        scilla_version 0
        
        import PairUtils BoolUtils
        
        library ZILxWallet
          let one_msg =
            fun( msg: Message ) =>
            let nil_msg = Nil{ Message } in Cons{ Message } msg nil_msg
          
          let zero = Uint128 0
          let zeroByStr20 = 0x0000000000000000000000000000000000000000
          let zeroByStr64 = 0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
          
          let option_value = tfun 'A => fun( default: 'A ) => fun( input: Option 'A) =>
            match input with
            | Some v => v
            | None => default end
          let option_uint128_value = let f = @option_value Uint128 in f zero
          let option_bystr20_value = let f = @option_value ByStr20 in f zeroByStr20
          let option_bystr64_value = let f = @option_value ByStr64 in f zeroByStr64
         
          let true = True
          let false = False
          let null = ""
          let did = "did"
        
          type Beneficiary =
            | NftUsername of String String (* username & domain *)
            | Recipient of ByStr20
        
        contract ZILxWallet(
          init_username: String,
          init: ByStr20 with contract field dApp: ByStr20 with contract
            field dns: Map String ByStr20,
            field did_dns: Map String ByStr20 with contract
              field controller: ByStr20,
              field services: Map String ByStr20,
              field did_domain_dns: Map String ByStr20 end end end
          )
          field nft_username: String = init_username
          field pending_username: String = null
          field paused: Bool = false
        
          (* A monotonically increasing number representing the amount of transactions that have taken place *)
          field tx_number: Uint128 = zero
          field services: Map String ByStr20 = Emp String ByStr20
          field version: String = "ZILxWALLET_0.10.1" (* @todo *)
        
        procedure SupportTyron( tyron: Option Uint128 )
          match tyron with
          | None => | Some donation =>
              current_init <-& init.dApp; donateDApp = "donate";
              get_addr <-& current_init.dns[donateDApp]; addr = option_bystr20_value get_addr;
              accept; msg = let m = { _tag: "AddFunds"; _recipient: addr; _amount: donation } in one_msg m; send msg end end
        
        procedure VerifyController( tyron: Option Uint128 )
          current_username <- nft_username; current_init <-& init.dApp;
          get_did <-& current_init.did_dns[current_username]; match get_did with
          | None => e = { _exception : "ZILxWallet-DidIsNull" }; throw e
          | Some did_ =>
              current_controller <-& did_.controller;
              verified = builtin eq _origin current_controller; match verified with
              | True => SupportTyron tyron
              | False => e = { _exception : "ZILxWallet-WrongCaller" }; throw e end end end
        
        procedure Timestamp()
          latest_tx_number <- tx_number; new_tx_number = let incrementor = Uint128 1 in builtin add latest_tx_number incrementor;
          tx_number := new_tx_number end
        
        procedure ThrowIfSameAddr(
          a: ByStr20,
          b: ByStr20
          )
          is_self = builtin eq a b; match is_self with
            | False => | True => e = { _exception : "ZILxWallet-SameAddress" }; throw e end end
        
        procedure ThrowIfSameName(
          a: String,
          b: String
          )
          is_same = builtin eq a b; match is_same with
            | False => | True => e = { _exception: "ZILxWallet-SameUsername" }; throw e end end
        
        procedure IsNotPaused()
          is_paused <- paused; match is_paused with
            | False => | True => e = { _exception : "ZILxWallet-WrongStatus" }; throw e end end
          
        procedure IsPaused()
          is_paused <- paused; match is_paused with
            | True => | False => e = { _exception : "ZILxWallet-WrongStatus" }; throw e end end
        
        transition UpdateUsername(
          username: String,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          current_username <- nft_username; ThrowIfSameName current_username username;
          current_init <-& init.dApp;
          get_did <-& current_init.did_dns[username]; match get_did with
            | Some did_ => pending_username := username
            | None => e = { _exception: "ZILxWallet-DidIsNull" }; throw e end;
          Timestamp end
        
        transition AcceptPendingUsername()
          IsNotPaused; current_pending <- pending_username;
          current_init <-& init.dApp;
          get_did <-& current_init.did_dns[current_pending]; match get_did with
            | None => e = { _exception: "ZILxWallet-DidIsNull" }; throw e
            | Some did_ =>
              current_controller <-& did_.controller;
              verified = builtin eq _origin current_controller; match verified with
                | True => | False => e = { _exception: "ZILxWallet-WrongCaller" }; throw e end;
              nft_username := current_pending; pending_username := null end;
          Timestamp end
          
        transition Pause( tyron: Option Uint128 )
          IsNotPaused; VerifyController tyron; paused := true;
          e = { _eventname: "DidDomainPaused";
            pauser: _sender }; event e;
          Timestamp end
        
        transition Unpause( tyron: Option Uint128 )
          IsPaused; VerifyController tyron; paused := false;
          e = { _eventname: "DidDomainUnpaused";
            pauser: _sender }; event e;
          Timestamp end
        
        (* Receive $ZIL native funds *)
        transition AddFunds()
          IsNotPaused; accept; Timestamp end
        
        (* Send $ZIL to any recipient that implements the tag, e.g. "AddFunds", "", etc. *)
        transition SendFunds(
          tag: String,
          beneficiary: Beneficiary,
          amount: Uint128,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          match beneficiary with
          | NftUsername username_ domain_ =>
            current_init <-& init.dApp;
            is_null = builtin eq domain_ null; match is_null with
              | True =>
                get_addr <-& current_init.dns[username_]; addr = option_bystr20_value get_addr; ThrowIfSameAddr _this_address addr;
                msg = let m = { _tag: tag; _recipient: addr; _amount: amount } in one_msg m; send msg
              | False =>
                get_did <-& current_init.did_dns[username_]; match get_did with
                  | None => e = { _exception : "ZILxWallet-DidIsNull" }; throw e
                  | Some did_ =>
                    is_did = builtin eq domain_ did; match is_did with
                      | True => ThrowIfSameAddr _this_address did_; msg = let m = { _tag: tag; _recipient: did_; _amount: amount } in one_msg m; send msg
                      | False =>
                        get_domain_addr <-& did_.did_domain_dns[domain_]; domain_addr = option_bystr20_value get_domain_addr; ThrowIfSameAddr _this_address domain_addr;
                        msg = let m = { _tag: tag; _recipient: domain_addr; _amount: amount } in one_msg m; send msg end end end
          | Recipient addr_ =>
            ThrowIfSameAddr _this_address addr_;
            msg = let m = { _tag: tag; _recipient: addr_; _amount: amount } in one_msg m; send msg end;
          Timestamp end
        
        procedure FetchServiceAddr( id: String )
          current_init <-& init.dApp; initDApp = "init";
          get_did <-& current_init.did_dns[initDApp]; match get_did with
            | None => e = { _exception : "ZILxWallet-DidIsNull" }; throw e
            | Some did_ =>
              get_service <-& did_.services[id]; addr = option_bystr20_value get_service;
              services[id] := addr end end
        
        transition DelegateStake(
          stakeID: String,
          ssnID: String,
          amount: Uint128,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          FetchServiceAddr ssnID; get_ssnaddr <- services[ssnID]; ssnaddr = option_bystr20_value get_ssnaddr;
          accept; msg = let m = { _tag: "DelegateStake"; _recipient: addr; _amount: amount;
            ssnaddr: ssnaddr } in one_msg m; send msg end
        
        transition DelegateStakeSuccessCallBack( ssnaddr: ByStr20, amount: Uint128 ) IsNotPaused end
        
        transition WithdrawStakeRewards(
          stakeID: String,
          ssnID: String,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          FetchServiceAddr ssnID; get_ssnaddr <- services[ssnID]; ssnaddr = option_bystr20_value get_ssnaddr;
          msg = let m = { _tag: "WithdrawStakeRewards"; _recipient: addr; _amount: zero;
            ssnaddr: ssnaddr } in one_msg m; send msg end
        
        transition WithdrawStakeRewardsSuccessCallBack( ssnaddr: ByStr20, rewards: Uint128 ) IsNotPaused end  
        
        transition WithdrawStakeAmt(
          stakeID: String,
          ssnID: String,
          amount: Uint128,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          FetchServiceAddr ssnID; get_ssnaddr <- services[ssnID]; ssnaddr = option_bystr20_value get_ssnaddr;
          msg = let m = { _tag: "WithdrawStakeAmt"; _recipient: addr; _amount: zero;
            ssnaddr: ssnaddr;
            amt: amount } in one_msg m; send msg end
        
        transition WithdrawStakeAmtSuccessCallBack( ssnaddr: ByStr20, amount: Uint128 ) IsNotPaused end
        
        transition CompleteWithdrawal(
          stakeID: String,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          msg = let m = { _tag: "CompleteWithdrawal"; _recipient: addr; _amount: zero } in one_msg m; send msg end
        
        transition CompleteWithdrawalNoUnbondedStakeCallBack( amount: Uint128 ) IsNotPaused end
        
        transition CompleteWithdrawalSuccessCallBack( amount: Uint128 ) IsNotPaused end
        
        transition ReDelegateStake(
          stakeID: String,
          ssnID: String,
          tossnID: String,
          amount: Uint128,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          FetchServiceAddr ssnID; get_ssnaddr <- services[ssnID]; ssnaddr = option_bystr20_value get_ssnaddr;
          FetchServiceAddr tossnID; get_tossnaddr <- services[tossnID]; to_ssnaddr = option_bystr20_value get_tossnaddr;
          msg = let m = { _tag: "ReDelegateStake"; _recipient: addr; _amount: zero;
            ssnaddr: ssnaddr;
            to_ssn: to_ssnaddr;
            amount: amount } in one_msg m; send msg end
        
        transition ReDelegateStakeSuccessCallBack( ssnaddr: ByStr20, tossn: ByStr20, amount: Uint128 ) IsNotPaused end
        
        transition RequestDelegatorSwap(
          stakeID: String,
          newDelegAddr: ByStr20,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          msg = let m = { _tag: "RequestDelegatorSwap"; _recipient: addr; _amount: zero;
            new_deleg_addr: newDelegAddr } in one_msg m; send msg end
        
        (* Sent by the new delegator *)
        transition ConfirmDelegatorSwap(
          stakeID: String,
          requestor: ByStr20, (* The previous delegator *)
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          msg = let m = { _tag: "ConfirmDelegatorSwap"; _recipient: addr; _amount: zero;
            requestor: requestor } in one_msg m; send msg end
        
        transition RevokeDelegatorSwap(
          stakeID: String,
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          msg = let m = { _tag: "RevokeDelegatorSwap"; _recipient: addr; _amount: zero } in one_msg m; send msg end
        
        (* Sent by the new delegator *)
        transition RejectDelegatorSwap(
          stakeID: String,
          requestor: ByStr20, (* The previous delegator *)
          tyron: Option Uint128
          )
          IsNotPaused; VerifyController tyron;
          FetchServiceAddr stakeID; get_addr <- services[stakeID]; addr = option_bystr20_value get_addr;
          msg = let m = { _tag: "RejectDelegatorSwap"; _recipient: addr; _amount: zero;
            requestor: requestor } in one_msg m; send msg end
      `

      const contract_init = [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'init_username',
          type: 'String',
          value: `${username}`,
        },
        {
          vname: 'init',
          type: 'ByStr20',
          value: `${init_}`,
        },
      ]

      const contract = contracts.new(code, contract_init)
      const [tx, deployed_contract] = await contract.deploy({
        gasLimit: '35000',
        gasPrice: '2000000000',
      })
      return [tx, deployed_contract]
    } catch (error) {
      throw error
    }
  }

  async deployDomainBetaVC(net: string, username: string, domain: string) {
    try {
      //@xalkan
      let init_ = '0x2d7e1a96ac0592cd1ac2c58aa1662de6fe71c5b9'

      if (net === 'testnet') {
        init_ = '0xec194d20eab90cfab70ead073d742830d3d2a91b'
      }

      const zilPay = await this.zilpay()
      const { contracts } = zilPay

      //@xalkan
      const code = `
            (* v1.4.1
              SBTxWALLET: Soulbound Smart Contract Wallet <> DID Domain Name System
              Self-Sovereign Identity Protocol
              Copyright Tyron Mapu Community Interest Company 2022. All rights reserved.
              You acknowledge and agree that Tyron Mapu Community Interest Company (Tyron) own all legal right, title and interest in and to the work, software, application, source code, documentation and any other documents in this repository (collectively, the Program), including any intellectual property rights which subsist in the Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist), whether in source code or any other form.
              Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy, modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise attempt to extract the source code of, the Program or any part thereof, except that you may contribute to this repository.
              You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify, merge, combine with another program or create derivative works of the Program (such resulting program, collectively, the Resulting Program) solely for Non-Commercial Use as long as you:
              1. give prominent notice (Notice) with each copy of the Resulting Program that the Program is used in the Resulting Program and that the Program is the copyright of Tyron; and
              2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith, combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial Use restriction set forth herein.
              Non-Commercial Use means each use as described in clauses (1)-(3) below, as reasonably determined by Tyron in its sole discretion:
              1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each case without any anticipated commercial application;
              2. use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization or government institution; or
              3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally do not exceed 10,000 at any time.
              You will not use any trade mark, service mark, trade name, logo of Tyron or any other company or organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks, names or logos.
              If you have any questions, comments or interest in pursuing any other use cases, please reach out to us at mapu@ssiprotocol.com.*)
              
              scilla_version 0
              
              library SBT
                let one_msg =
                  fun( msg: Message ) =>
                  let nil_msg = Nil{ Message } in Cons{ Message } msg nil_msg
              
                let null = ""
                let zero = Uint128 0
                let zeroByStr20 = 0x0000000000000000000000000000000000000000
                let zeroByStr33 = 0x000000000000000000000000000000000000000000000000000000000000000000
                let zeroByStr64 = 0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
                
                let option_value = tfun 'A => fun( default: 'A ) => fun( input: Option 'A) =>
                  match input with
                  | Some v => v
                  | None => default end
                let option_bystr20_value = let f = @option_value ByStr20 in f zeroByStr20
                let option_bystr33_value = let f = @option_value ByStr33 in f zeroByStr33
                let option_bystr64_value = let f = @option_value ByStr64 in f zeroByStr64
              
                let true = True
                let false = False
              
              contract SBT(
                init_username: String,
                domain: String,
                init: ByStr20 with contract field dApp: ByStr20 with contract
                  field dns: Map String ByStr20,
                  field did_dns: Map String ByStr20 with contract
                    field controller: ByStr20, 
                    field verification_methods: Map String ByStr33 end end end
                )
                field nft_username: String = init_username
                field pending_username: String = null
                field paused: Bool = false
                
                field tx_number: Uint128 = zero
                field public_encryption: String = "bYACKEqduFtw5iZQVra42h1UAINo4ujJRYNNGNxVlCL-Fs46bBdo_S4EJRrgMJRhiqeUPKHRuu_daZFRHBWCjILdC5cc5mjSkQVIu30jJiaA_7G9FCYqVQnnKa0ZKn52DsT2f8bYSNHpDLpcmqcKqdW4Z8tgCtd9zhzZ4TchO9_-xPQ7T7v4Y-AIB0-Al8HwU2cvA_N17f7VHps2ZfMG88qVxOUlBJTlb6n60vZX_4laKavvyLz3zvbOUVhnI4L0VURiM_Z_1rF5rna7QNK9wU-40FqK8VMNW3DJFAVCVMvsMCUwqXnVZo35gKcG1LW8A7TBdTPlJ7ICtTRaS45QZ7fIz1pLiEg0R4n0NPP5N12YJQCnrZyLfsRPPjUZXfHdaKSxsYDDsiDOhWxkBCx3ScvIKYJDLK1jh0YhmQiATiCMMrM0mBFZ6cfNifCXDGV97dpKxnFfLNUMlV1sIUiSoryf8cK2DV15fbBWw8UqO254yqO4Eczf1LvDd4sXIUR9x9DhRAi_MYb4owiY8xBdRmggrlHrH2cducqX8znKOfQ_o6u7H3wU_f7qjzVfOFUsKnZC4mPp6dPTKyqK9fCAXGKIgxzL3Cd22v6zxo54-eovWHbESaj9h6PZ64duumrq3HAzHdn20XtynFJxwo9bNxXx0WxgVkrc-Hak64iazWVjQbGK6J-NJ996qpPZt-71YIbFqMI-fgZvt3eZZxfOsvtE7R8sbeThrZmWC42j94pvbmik3jcYsaAoSD_ct2b9qKWzSKqj-o_ZQAPvblpT9YeKY7tgygJgll_p75eQe38A8fpKDAMtTW1rOagzBGA2I1lYe_wu_BB6SuT2Mdq_Hh5_C5zDQRXs6klKxft2NB3siM4C4B6VH0hE2bZXl7KdnNdCAEdyPuRpXP5_XkYmWGBI6ZJvf6iP1wpTjQfpz54dGK-GQGo0FEH0zDtzbUUHs7oq5a7KiUeQEPmrzluphfcUIv7vMROn-UYoMsz38nd3W5VPKVVofe756p_MsjGu"
                field ivms101: Map String String = Emp String String
                field sbt: Map String ByStr64 = Emp String ByStr64
                field version: String = "SBTxWallet-1.4.1" (* @todo *)
              
              procedure SupportTyron( tyron: Option Uint128 )
                match tyron with
                | None => | Some donation =>
                    current_init <-& init.dApp; donateDApp = "donate";
                    get_addr <-& current_init.dns[donateDApp]; addr = option_bystr20_value get_addr;
                    accept; msg = let m = { _tag: "AddFunds"; _recipient: addr; _amount: donation } in one_msg m; send msg end end
              
              procedure VerifyController( tyron: Option Uint128 )
                current_username <- nft_username; current_init <-& init.dApp;
                get_did <-& current_init.did_dns[current_username]; match get_did with
                | None => e = { _exception : "SBTxWallet-DidIsNull" }; throw e
                | Some did_ =>
                    current_controller <-& did_.controller;
                    verified = builtin eq _origin current_controller; match verified with
                    | True => SupportTyron tyron
                    | False => e = { _exception : "SBTxWallet-WrongCaller" }; throw e end end end
              
              procedure Timestamp()
                latest_tx_number <- tx_number; new_tx_number = let incrementor = Uint128 1 in builtin add latest_tx_number incrementor;
                tx_number := new_tx_number end
              
              procedure IsNotPaused()
                is_paused <- paused; match is_paused with
                  | False => | True => e = { _exception: "SBTxWallet-WrongStatus" }; throw e end end
                
              procedure IsPaused()
                is_paused <- paused; match is_paused with
                  | True => | False => e = { _exception: "SBTxWallet-WrongStatus" }; throw e end end
              
              procedure ThrowIfSameName(
                a: String,
                b: String
                )
                is_same = builtin eq a b; match is_same with
                  | False => | True => e = { _exception: "SBTxWallet-SameUsername" }; throw e end end
              
              transition UpdateUsername(
                username: String,
                tyron: Option Uint128
                )
                IsNotPaused; VerifyController tyron;
                current_username <- nft_username; ThrowIfSameName current_username username;
                current_init <-& init.dApp;
                get_did <-& current_init.did_dns[username]; match get_did with
                  | Some did_ => pending_username := username
                  | None => e = { _exception: "SBTxWallet-DidIsNull" }; throw e end;
                Timestamp end
              
              transition AcceptPendingUsername()
                IsNotPaused; current_pending <- pending_username;
                current_init <-& init.dApp;
                get_did <-& current_init.did_dns[current_pending]; match get_did with
                  | None => e = { _exception: "SBTxWallet-DidIsNull" }; throw e
                  | Some did_ =>
                    current_controller <-& did_.controller;
                    verified = builtin eq _origin current_controller; match verified with
                      | True => | False => e = { _exception: "SBTxWallet-WrongCaller" }; throw e end;
                    nft_username := current_pending; pending_username := null end;
                Timestamp end
              
              transition Pause( tyron: Option Uint128 )
                IsNotPaused; VerifyController tyron; paused := true;
                e = { _eventname: "DidDomainPaused";
                  pauser: _sender }; event e;
                Timestamp end
              
              transition Unpause( tyron: Option Uint128 )
                IsPaused; VerifyController tyron; paused := false;
                e = { _eventname: "DidDomainUnpaused";
                  pauser: _sender }; event e;
                Timestamp end
              
              transition UpdatePublicEncryption(
                new: String,
                tyron: Option Uint128
                )
                VerifyController tyron;
                IsNotPaused; public_encryption := new end
              
              transition Ivms101(
                issuerName: String,
                message: String,   (* encrypted IVMS101 message *)
                userSignature: Option ByStr64,
                tyron: Option Uint128
                )
                IsNotPaused;
                current_username <- nft_username;
                current_init <-& init.dApp; get_did <-& current_init.did_dns[current_username]; match get_did with
                  | None => e = { _exception: "SBTxWallet-DidIsNull" }; throw e
                  | Some did_ =>
                      current_controller <-& did_.controller;
                      verified = builtin eq _origin current_controller; match verified with
                      | True => SupportTyron tyron
                      | False =>
                        get_didkey <-& did_.verification_methods[domain]; did_key = option_bystr33_value get_didkey;
                        signed_data = let hash = builtin sha256hash message in builtin to_bystr hash;
                        signature = option_bystr64_value userSignature;
                        is_right_signature = builtin schnorr_verify did_key signed_data signature; match is_right_signature with
                          | True => | False => e = { _exception: "SBTxWallet-WrongSignature" }; throw e end end end;
                ivms101[issuerName] := message;
                e = { _eventname: "NewIvms101";
                  issuerName: issuerName }; event e;
                Timestamp end
              
              transition Verifiable_Credential(
                issuerName: String,
                issuerDomain: String,
                issuerSignature: ByStr64
                )
                IsNotPaused; get_msg <- ivms101[issuerName];
                current_init <-& init.dApp; get_did <-& current_init.did_dns[issuerName]; match get_did with
                  | None => e = { _exception: "SBTxWallet-DidIsNull" }; throw e
                  | Some did_ =>
                      get_didkey <-& did_.verification_methods[issuerDomain]; did_key = option_bystr33_value get_didkey;
                      match get_msg with
                      | None => e = { _exception: "SBTxWallet-MsgIsNull" }; throw e
                      | Some msg =>
                          signed_data = let hash = builtin sha256hash msg in builtin to_bystr hash;
                          is_right_signature = builtin schnorr_verify did_key signed_data issuerSignature; match is_right_signature with
                          | False => e = { _exception: "SBTxWallet-WrongSignature" }; throw e
                          | True => sbt[issuerName] := issuerSignature end end end;
                Timestamp end
            `

      const contract_init = [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'init_username',
          type: 'String',
          value: `${username}`,
        },
        {
          vname: 'domain',
          type: 'String',
          value: `${domain}`,
        },
        {
          vname: 'init',
          type: 'ByStr20',
          value: `${init_}`,
        },
      ]

      const contract = contracts.new(code, contract_init)
      const [tx, deployed_contract] = await contract.deploy({
        gasLimit: '35000',
        gasPrice: '2000000000',
      })
      return [tx, deployed_contract]
    } catch (error) {
      throw error
    }
  }
}
