// src/CaptureUploadMint.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import nftAbi from './BitstampNFTABI.json';

export default function CaptureUploadMint() {
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);

  // 1) Local capture state
  const [capturedFile, setCapturedFile] = useState(null);
  const [localPreview, setLocalPreview] = useState('');

  // 2) IPFS result state
  const [ipfsImageUrl, setIpfsImageUrl] = useState('');
  const [ipfsMetaUrl,  setIpfsMetaUrl]  = useState('');

  // 3) Metadata fields
  const [caption,   setCaption]   = useState('');
  const [location,  setLocation]  = useState('');
  const [timestamp, setTimestamp] = useState(0);

  // 4) UI & wallet
  const [status,   setStatus]   = useState('Loading…');
  const [provider, setProvider] = useState(null);

  // env
  const BACKEND_URL  = process.env.REACT_APP_BACKEND;  
  const NFT_ADDRESS  = process.env.REACT_APP_NFT_CONTRACT;  
  const IPFS_GATEWAY = 'https://lavender-adorable-hummingbird-774.mypinata.cloud/ipfs';

  // detect mobile
  const isMobile = useMemo(() => /Mobi|Android/i.test(navigator.userAgent), []);

  // init MetaMask & desktop camera
  useEffect(() => {
    if (window.ethereum) {
      const prov = new BrowserProvider(window.ethereum);
      setProvider(prov);
      setStatus(isMobile
        ? 'Mobile detected—use file input below'
        : 'Desktop detected—ready to capture');
    } else {
      setStatus('Please install MetaMask');
    }
    if (!isMobile && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        })
        .catch(err => {
          console.warn(err);
          setStatus('Cannot access camera');
        });
    }
  }, [isMobile]);

  // desktop capture
  const handleCaptureDesktop = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      setCapturedFile(blob);
      setLocalPreview(URL.createObjectURL(blob));
      const ts = Math.floor(Date.now()/1000);
      setTimestamp(ts);
      setStatus('Photo captured');
    }, 'image/jpeg');
  };

  // mobile file input
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturedFile(file);
    setLocalPreview(URL.createObjectURL(file));
    const ts = Math.floor(Date.now()/1000);
    setTimestamp(ts);
    setStatus('Photo selected');
  };

  // upload to Pinata + pin metadata
  const handleUploadToIpfs = async () => {
    if (!capturedFile) {
      alert('Please capture or select a photo first');
      return;
    }
    try {
      // 1) upload image
      setStatus('Uploading image to Pinata…');
      const form = new FormData();
      form.append('file', capturedFile, `photo_${timestamp}.jpg`);
      const imgRes = await fetch(`${BACKEND_URL}/pinata/pin-file`, {
        method: 'POST',
        body: form
      });
      if (!imgRes.ok) throw new Error(await imgRes.text());
      const { cid: imgCid } = await imgRes.json();
      const imageURI = `${IPFS_GATEWAY}/${imgCid}`;
      setIpfsImageUrl(imageURI);

      // 2) get real location, fallback to 0,0
      setStatus('Getting location…');
      let locString = '0,0';
      try {
        const pos = await new Promise((res, rej) => {
          if (!navigator.geolocation) {
            return rej(new Error('Geolocation not available'));
          }
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });
        locString = `${pos.coords.latitude},${pos.coords.longitude}`;
      } catch {
        alert('Cannot get location; using fallback.');
      }
      setLocation(locString);

      // 3) upload metadata JSON
      setStatus('Uploading metadata to Pinata…');
      const metadata = {
        name:        `BitstampNFT #${timestamp}`,
        description: caption || `Captured @ ${new Date(timestamp*1000).toLocaleString()}`,
        image:       imageURI,
        attributes: [
          { trait_type:'location',  value: locString },
          { trait_type:'timestamp', value: timestamp.toString() }
        ]
      };
      const metaRes = await fetch(`${BACKEND_URL}/pinata/pin-json`, {
        method:  'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify(metadata)
      });
      if (!metaRes.ok) throw new Error(await metaRes.text());
      const { cid: metaCid } = await metaRes.json();
      setIpfsMetaUrl(`${IPFS_GATEWAY}/${metaCid}`);

      setStatus('Preview ready—tap Mint NFT');
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  // mint: fetch voucher → redeem
  const handleMint = async () => {
    if (!ipfsMetaUrl || !provider) {
      alert('Generate preview first');
      return;
    }
    try {
      setStatus('Minting NFT…');
      await provider.send('eth_requestAccounts', []);
      const signer  = await provider.getSigner();
      const address = await signer.getAddress();

      // fetch voucher
      const resp = await fetch(`${BACKEND_URL}/voucher`, {
        method:  'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify({ recipient: address, uri: ipfsMetaUrl })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const { voucher, signature } = await resp.json();

      // redeem
      const contract = new Contract(NFT_ADDRESS, nftAbi, signer);
      const tx       = await contract.redeem(voucher, signature);
      setStatus(`⛓️ Pending tx: ${tx.hash}`);
      await tx.wait();
      setStatus(`Minted! TxHash: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  return (
    <div style={{ maxWidth:400, margin:'auto', padding:20, fontFamily:'sans-serif' }}>
      <p>{status}</p>

      {isMobile ? (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display:'block', width:'100%', padding:12, marginBottom:10 }}
        />
      ) : (
        <video
          ref={videoRef}
          muted
          style={{ width:'100%', border:'1px solid #ccc', borderRadius:4, marginBottom:10 }}
        />
      )}
      <canvas ref={canvasRef} style={{ display:'none' }} />

      {!isMobile && !capturedFile && (
        <button
          onClick={handleCaptureDesktop}
          style={{ width:'100%', padding:8, marginBottom:10 }}
        >
          Capture Photo
        </button>
      )}

      {localPreview && (
        <>
          <p>Local preview:</p>
          <img
            src={localPreview}
            alt="Local preview"
            style={{ width:'100%', borderRadius:4, marginBottom:10 }}
          />
        </>
      )}

      {capturedFile && !ipfsImageUrl && (
        <>
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ width:'100%', padding:8, marginBottom:10 }}
          />
          <button
            onClick={handleUploadToIpfs}
            style={{ width:'100%', padding:8, marginBottom:10 }}
          >
            Upload & Preview
          </button>
        </>
      )}

      {ipfsImageUrl && (
        <>
          <p>IPFS Image:</p>
          <img
            src={ipfsImageUrl}
            alt="IPFS preview"
            style={{ width:'100%', borderRadius:4, marginBottom:10 }}
          />
        </>
      )}

      {ipfsMetaUrl && (
        <>
          <p>Metadata URL:</p>
          <p style={{ wordBreak:'break-all', marginBottom:10 }}>{ipfsMetaUrl}</p>
          <button
            onClick={handleMint}
            style={{ width:'100%', padding:8 }}
          >
            Mint NFT
          </button>
        </>
      )}
    </div>
  );
}