// src/NFTViewer.jsx
import React, { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import nftAbi from './BitstampNFTABI.json';

export default function NFTViewer() {
  const [tokenId, setTokenId]   = useState('');
  const [metadata, setMetadata] = useState(null);
  const [status, setStatus]     = useState('');

  // provider read‐only via MetaMask
  const provider      = new BrowserProvider(window.ethereum);
  const contractAddr  = process.env.REACT_APP_NFT_CONTRACT;
  const IPFS_GATEWAY  = 'https://lavender-adorable-hummingbird-774.mypinata.cloud/ipfs';

  const fetchMetadata = async () => {
    try {
      setStatus('⏳ Fetching tokenURI from chain…');
      const contract = new Contract(contractAddr, nftAbi, provider);
      const uri      = await contract.tokenURI(tokenId);

      // ubah ipfs://Qm… → https://gateway/ipfs/Qm…
      const url = uri.startsWith('ipfs://')
        ? `${IPFS_GATEWAY}/${uri.slice(7)}`
        : uri;

      setStatus('⏳ Fetching metadata JSON…');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetadata(data);
      setStatus('');
    } catch (err) {
      console.error(err);
      setStatus(`❌ ${err.message}`);
      setMetadata(null);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '20px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h3>🔍 View NFT by ID</h3>
      <input
        type="number"
        placeholder="Enter Token ID"
        value={tokenId}
        onChange={e => setTokenId(e.target.value)}
        style={{ width:'100%', padding:8, marginBottom:10 }}
      />
      <button
        onClick={fetchMetadata}
        disabled={!tokenId}
        style={{ width:'100%', padding:8, marginBottom:10 }}
      >
        View NFT
      </button>
      <p>{status}</p>

      {metadata && (
        <div style={{ textAlign:'center' }}>
          <img
            src={metadata.image}
            alt="NFT"
            style={{ width:'100%', borderRadius:4, marginBottom:10 }}
          />
          <p>{metadata.description}</p>
          <ul style={{ textAlign:'left' }}>
            {metadata.attributes?.map(attr => (
              <li key={attr.trait_type}>
                <strong>{attr.trait_type}:</strong> {attr.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}