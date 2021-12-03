import * as tyron from 'tyron';

export const isValidUsername = (username: string) =>
    /^[\w\d_]+$/.test(username) && username.length > 6;

export const fetchAddr = async ({
    net,
    username,
    domain
}: {
    net: string;
    username: string;
    domain: string;
}) => {
    let network = tyron.DidScheme.NetworkNamespace.Mainnet;
    let init_tyron = '0xe574a9e78f60812be7c544d55d270e75481d0e93';
    if (net === 'testnet') {
        network = tyron.DidScheme.NetworkNamespace.Testnet;
        init_tyron = '0x8b7e67164b7fba91e9727d553b327ca59b4083fc';
    }
    const addr = await tyron.Resolver.default
        .resolveDns(network, init_tyron, username, domain)
        .catch((err) => {
            throw err;
        });
    return addr;
};

export const resolve = async ({
    net,
    addr
}: {
    net: string;
    addr: string;
}) => {
    let network = tyron.DidScheme.NetworkNamespace.Mainnet;
    if (net === 'testnet') {
        network = tyron.DidScheme.NetworkNamespace.Testnet;
    }
    const did_doc: any[] = [];
    const state = await tyron.State.default.fetch(network, addr);

    let did;
    if (state.did == '') {
        did = 'not created yet.'
    } else {
        did = state.did
    }
    did_doc.push(['Decentralized identifier', did]);

    const controller = state.controller;

    if (state.services_ && state.services_?.size !== 0) {

        const services = [];
        for (const id of state.services_.keys()) {
            const result = state.services_.get(id);
            if (result && result[1] !== '') {
                services.push([id, result[1]])
            }
        }
        did_doc.push(['DID services', services]);
    }

    if (state.verification_methods) {
        if (state.verification_methods.get('socialrecovery')) {
            did_doc.push([
                'DID social recovery key',
                [state.verification_methods.get('socialrecovery')]
            ]);
        }
        if (state.verification_methods.get('dex')) {
            did_doc.push([
                'DID decentralized exchange key',
                [state.verification_methods.get('dex')]
            ]);
        }
        if (state.verification_methods.get('stake')) {
            did_doc.push([
                'DID staking key',
                [state.verification_methods.get('stake')]
            ]);
        }
        if (state.verification_methods.get('general')) {
            did_doc.push([
                'General-purpose key',
                [state.verification_methods.get('general')]
            ]);
        }
        if (state.verification_methods.get('authentication')) {
            did_doc.push([
                'Authentication key',
                [state.verification_methods.get('authentication')]
            ]);
        }
        if (state.verification_methods.get('assertion')) {
            did_doc.push([
                'Assertion key',
                [state.verification_methods.get('assertion')]
            ]);
        }
        if (state.verification_methods.get('agreement')) {
            did_doc.push([
                'Agreement key',
                [state.verification_methods.get('agreement')]
            ]);
        }
        if (state.verification_methods.get('invocation')) {
            did_doc.push([
                'Invocation key',
                [state.verification_methods.get('invocation')]
            ]);
        }
        if (state.verification_methods.get('delegation')) {
            did_doc.push([
                'Delegation key',
                [state.verification_methods.get('delegation')]
            ]);
        }
        if (state.verification_methods.get('vc')) {
            did_doc.push([
                'Verifiable credentials key',
                [state.verification_methods.get('vc')]
            ]);
        }
    }

    const init = new tyron.ZilliqaInit.default(network);

    let guardians;
    try {
        const social_recovery = await init.API.blockchain.getSmartContractSubState(
            addr,
            'social_guardians'
        );
        guardians = await resolveSubState(social_recovery.result.social_guardians);
    } catch (error) {
        throw new Error(
            ('no guardians found')
        )
    }

    let version: any = '0';
    try {
        await init.API.blockchain.getSmartContractSubState(
            addr,
            'version'
        )
            .then(substate => {
                if (substate.result !== null) {
                    version = substate.result.version as string;
                    if (Number(version.substr(8, 1)) >= 4 && Number(version.substr(10, 1)) < 3) {
                        throw new Error("There is a newer version. Get in contact with Tralcan on Discord for instructions.");

                    }
                } else {
                    throw new Error(
                        `Tyron recommends upgrading this account.
                        If you're the owner, create a new SSI account to deploy the latest contract.
                        Then transfer this NFT Username to your new account address.`
                    )
                }
            })
            .catch(err => {
                throw err
            })
    } catch (error) {
        alert(error)
    }
    return {
        did: did,
        version: version,
        status: state.did_status,
        controller: controller,
        doc: did_doc,
        dkms: state.dkms,
        guardians: guardians
    };
};

export async function resolveSubState(object: any): Promise<any[]> {
    const entries = Object.entries(object);
    const result: any[] = [];
    entries.forEach((value: [string, unknown]) => {
        result.push(value[0])
    });
    return result;
}
