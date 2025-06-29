// src/NFTDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import nftAbi from './BitstampNFTABI.json';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';

export default function NFTDetail() {
  const { id } = useParams();
  const [meta, setMeta]           = useState(null);
  const [status, setStatus]       = useState('');
  const [owner, setOwner]         = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [showImageModal, setShowImageModal]     = useState(false);
  const [showSnippetModal, setShowSnippetModal] = useState(false);

  const provider     = useMemo(() => new BrowserProvider(window.ethereum), []);
  const contractAddr = process.env.REACT_APP_NFT_CONTRACT;
  const appUrl       = process.env.REACT_APP_APP_URL || window.location.origin;

  // Fetch metadata
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const contract = new Contract(contractAddr, nftAbi, provider);
        const uri      = await contract.tokenURI(id);
        const res      = await fetch(uri);
        const data     = await res.json();
        if (!cancelled) setMeta(data);
      } catch (err) {
        if (!cancelled) setStatus(`Error: ${err.message}`);
      }
    })();
    return () => { cancelled = true; };
  }, [id, provider, contractAddr]);

  // Fetch owner
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const contract = new Contract(contractAddr, nftAbi, provider);
        const addr     = await contract.ownerOf(id);
        if (!cancelled) setOwner(addr);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [id, provider, contractAddr]);

  // Format timestamp
  const formatTime = ts => {
    const n = Number(ts);
    return isNaN(n) ? ts : new Date(n * 1000).toLocaleString();
  };

  // Render small embedded map
  const renderMap = loc => {
    if (typeof loc !== 'string') return null;
    const parts = loc.split(',').map(s => s.trim());
    if (parts.length < 2) return null;
    const [lat, lng] = parts;
    const src = `https://maps.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&z=13&output=embed`;
    return (
      <div style={{ width:'100%', height:200, overflow:'hidden', borderRadius:8, marginBottom:16 }}>
        <iframe
          title="location-map"
          src={src}
          style={{ width:'100%', height:'100%', border:0 }}
          allowFullScreen
        />
      </div>
    );
  };

  // Handle tip
  const handleTip = async () => {
    if (!tipAmount || isNaN(Number(tipAmount))) {
      setStatus('Invalid tip amount');
      return;
    }
    try {
      setStatus('Sending tip…');
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const tx     = await signer.sendTransaction({
        to: owner,
        value: parseEther(tipAmount)
      });
      setStatus(`Sent: ${tx.hash}`);
      await tx.wait();
      setStatus('Tip successful');
      setTipAmount('');
    } catch (err) {
      setStatus(`Tip failed: ${err.message}`);
    }
  };

  // Build embed snippet
  const embedSnippet = () => {
    return `<a href="${appUrl}/view/${id}" target="_blank" rel="noopener noreferrer" style="display:block;max-width:400px;margin:16px auto;text-decoration:none;">\n` +
           `  <img src="${meta.image}" alt="NFT #${id}" style="width:100%;height:auto;border-radius:8px;" />\n` +
           `</a>`;
  };

  // Extract timestamp & location from metadata
  const attrs = Array.isArray(meta?.attributes) ? meta.attributes : [];
  const tsAttr  = attrs.find(a => (a.trait_type||a.name).toLowerCase() === 'timestamp');
  const locAttr = attrs.find(a => (a.trait_type||a.name).toLowerCase() === 'location');
  const formattedTime  = tsAttr ? formatTime(tsAttr.value ?? tsAttr.val) : '-';
  const locationValue  = locAttr ? (locAttr.value ?? locAttr.val) : '';

  if (!meta) {
    return (
      <div className="container my-4 text-center">
        <h2>BITSTAMP (ID: {id})</h2>
        <p>{status || 'Loading…'}</p>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        {/* Clickable image */}
        <img
          src={meta.image}
          alt="NFT"
          className="card-img-top"
          style={{ objectFit:'cover', height:300, cursor:'pointer' }}
          onClick={()=>setShowImageModal(true)}
        />

        <div className="card-body">
          <h3 className="card-title mb-4">BITSTAMP (ID: {id})</h3>
          {status && <p className="text-muted">{status}</p>}

          {/* Details */}
          <div className="row mb-2">
            <div className="col-md-3 fw-bold">Name</div>
            <div className="col-md-9">{meta.name}</div>
          </div>
          <div className="row mb-2">
            <div className="col-md-3 fw-bold">Description</div>
            <div className="col-md-9">{meta.description}</div>
          </div>
          <div className="row mb-2">
            <div className="col-md-3 fw-bold">Date & Time</div>
            <div className="col-md-9">{formattedTime}</div>
          </div>

          {/* Owner */}
          <div className="row mb-3">
            <div className="col-md-3 fw-bold">Owner</div>
            <div className="col-md-9">{owner}</div>
          </div>

          {/* Tip section */}
          <div className="row align-items-center mb-4">
            <div className="col-md-3 fw-bold">Tip Owner</div>
            <div className="col-md-5">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Amount in cBTC"
                value={tipAmount}
                onChange={e=>setTipAmount(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-warning btn-sm"
                onClick={handleTip}
              >
                Send Tip
              </button>
            </div>
          </div>

          {/* Location */}
          {locationValue && (
            <>
              <div className="row mb-2">
                <div className="col-md-3 fw-bold">Location</div>
                <div className="col-md-9">{locationValue}</div>
              </div>
              {renderMap(locationValue)}
            </>
          )}

          {/* Embed Snippet */}
          <div className="d-grid">
            <Button
              variant="secondary"
              size="sm"
              onClick={()=>setShowSnippetModal(true)}
            >
              Show Embed Snippet
            </Button>
          </div>
        </div>
      </div>

      {/* Full-size Image Modal */}
      <Modal show={showImageModal} onHide={()=>setShowImageModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Full-size Image</Modal.Title></Modal.Header>
        <Modal.Body className="text-center">
          <img src={meta.image} alt="Full NFT" className="img-fluid" />
        </Modal.Body>
      </Modal>

      {/* Embed Snippet Modal */}
      <Modal show={showSnippetModal} onHide={()=>setShowSnippetModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Embed HTML Snippet</Modal.Title></Modal.Header>
        <Modal.Body>
          <pre style={{ background:'#f8f9fa', padding:12, borderRadius:4 }}>
            {embedSnippet()}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={()=>{navigator.clipboard.writeText(embedSnippet())}}>
            Copy to Clipboard
          </Button>
          <Button variant="secondary" onClick={()=>setShowSnippetModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}