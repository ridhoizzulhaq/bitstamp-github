// server/server.js
import express from 'express';
import pinataSDK from '@pinata/sdk';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { Wallet, ethers } from 'ethers';

dotenv.config();
const app = express();

// 1) ENABLE CORS UNTUK SEMUA ORIGIN
app.use(cors());

// 2) JSON parser
app.use(express.json());

// Inisialisasi Pinata SDK
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

// Multer untuk parsing multipart/form-data
const upload = multer();

// Backend wallet untuk sign vouchers
const wallet     = new Wallet(process.env.BACKEND_PRIVATE_KEY);
const chainId    = Number(process.env.CHAIN_ID);
const nftAddress = process.env.NFT_CONTRACT_ADDRESS;

// 3) Health‐check endpoint
app.get('/ping', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// 4) Endpoint untuk pin file ke IPFS
app.post('/pinata/pin-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Ubah buffer jadi Readable stream
  const stream = new Readable({
    read() {
      this.push(req.file.buffer);
      this.push(null);
    }
  });

  pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: req.file.originalname }
  })
    .then(result => res.json({ cid: result.IpfsHash }))
    .catch(err => {
      console.error('pin-file error:', err);
      res.status(500).json({ error: err.message });
    });
});

// 5) Endpoint untuk pin JSON metadata ke IPFS
app.post('/pinata/pin-json', (req, res) => {
  pinata.pinJSONToIPFS(req.body, {
    pinataMetadata: { name: 'metadata' }
  })
    .then(result => res.json({ cid: result.IpfsHash }))
    .catch(err => {
      console.error('pin-json error:', err);
      res.status(500).json({ error: err.message });
    });
});

// 6) Endpoint untuk generate EIP-712 voucher dan signature
app.post('/voucher', async (req, res) => {
  const { recipient, uri } = req.body;
  if (!ethers.isAddress(recipient) || !uri) {
    return res.status(400).json({ error: 'Invalid recipient or uri' });
  }

  const domain = {
    name:              'BitstampNFT',
    version:           '1',
    chainId,
    verifyingContract: nftAddress
  };
  const types = {
    NFTVoucher: [
      { name: 'recipient', type: 'address' },
      { name: 'uri',       type: 'string'  }
    ]
  };
  const voucher = { recipient, uri };

  try {
    const signature = await wallet.signTypedData(domain, types, voucher);
    res.json({ voucher, signature });
  } catch (err) {
    console.error('voucher error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7) Start server
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Proxy & Voucher server listening on http://localhost:${PORT}`);
});