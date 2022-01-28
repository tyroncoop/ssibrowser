import React from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

function App() {
    return (
        <>
            <Head><title>SSI Browser</title></Head>
            <div id="bg"></div>
            <div id="wrapper">
                <Header />
                <Footer />
            </div>
        </>
    );
}

export default App;
