import React from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';
//import './styles/scss/application.scss';

function App() {
    return (
        <>
            <Head><title>SSI Browser</title></Head>
            <div id="wrapper">
                <Header />
                <Footer />
            </div>
        </>
    );
}

export default App;
