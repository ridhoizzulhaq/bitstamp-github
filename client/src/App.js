// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MintVoucherNFT from './MintVoucherNFT';
import NFTDetail      from './NFTDetail';

export default function App() {
  return (
    <BrowserRouter>
      <header style={{ padding:20, background:'#f5f5f5', textAlign:'center' }}>
        <Link to="/" style={{ marginRight:20, textDecoration:'none' }}>
          BITSTAMP
        </Link>
      </header>
      <main style={{ padding:20 }}>
        <Routes>
          <Route path="/"       element={<MintVoucherNFT />} />
          <Route path="/view/:id" element={<NFTDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}