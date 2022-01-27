import React from 'react';
//import { SearchBar, Connect, SSIProtocol, FAQ, AccessWallet } from '../index';
//import AccessWallet from '../components/AccessWallet';
import Connect from '../components/Connect'
import FAQ from '../components/FAQ'

function Header() {
    return (
        <>
            <div id="header">
                <div className="content">
                    <div className="inner">
                        {/* <SearchBar /> */}
                        {/* <AccessWallet /> */}
                    </div>
                </div>
            </div>
            <Connect />
            <FAQ />
        </>
    );
}

export default Header;
