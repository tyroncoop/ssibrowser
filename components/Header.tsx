import React from 'react';
//import { SearchBar, Connect, SSIProtocol, FAQ, AccessWallet } from '../index';
//import AccessWallet from '../components/AccessWallet';
import SearchBar from '../components/SearchBar';
import Connect from '../components/Connect'
import SSIProtocol from '../components/SSIProtocol';
import FAQ from '../components/FAQ'

function Header() {
    return (
        <>
            <div id="header">
                <div className="content">
                    <div className="inner">
                        <SearchBar />
                        {/* <AccessWallet /> */}
                    </div>
                </div>
            </div>
            <Connect />
            <SSIProtocol />
            <FAQ />
        </>
    );
}

export default Header;
