
# Bitstamp

##Demo Video : https://www.youtube.com/watch?v=S_jlvszppgI&feature=youtu.be

Bitstamp is a proof-of-provenance NFT application designed to capture, verify and monetize authentic media. By combining on-device photo capture, embedded GPS/timestamp metadata, IPFS storage and an EIP-712-based NFT minting flow, Bitstamp delivers an immutable, publicly verifiable record of every image’s origin. 

Bitstamp is deployed on Citrea Testnet and now is develop for WaveGack

---

## 📖 Overview

1. **Capture**  
   - Live photo taken in-browser (desktop) or via file input (mobile).  
   - Immediately tag with `latitude,longitude` and UNIX timestamp.

2. **Pin to IPFS**  
   - Photo blob → pinned via Pinata → returns an IPFS CID.  
   - JSON metadata (name, description, image URI, attributes) → pinned → metadata CID.

3. **Lazy-Mint as NFT**  
   - Frontend requests an EIP-712 “voucher” signed by a backend wallet.  
   - User submits voucher + signature to the `BitstampNFT` contract’s `redeem` function.  
   - Contract verifies signature, prevents replay, mints ERC-721 token with the metadata URI.

4. **Verify & Embed**  
   - Anyone can call `tokenURI(tokenId)` → retrieve IPFS JSON → verify location/time/image.  
   - Embed snippet:
     ```html
     <a href="https://your-app.com/view/4" target="_blank" rel="noopener">
       <img src="https://gateway.ipfs/<CID>" alt="NFT #4" />
     </a>
     ```

5. **Tipping**  
   - On the NFT detail page, viewers can send ETH tips directly to the NFT owner’s address.

---

## ⚙️ Tech Stack

- **Frontend**  
  - React + Create React App  
  - HTML5 MediaDevices & Geolocation APIs  
  - Bootstrap (layout & components)  
  - ethers.js v6 (BrowserProvider, Contract, EIP-712 signing)  

- **Backend / Proxy**  
  - Node.js + Express  
  - pinata-sdk + multer (IPFS pinning)  
  - cors, dotenv, stream (Readable)  
  - ethers.js Wallet (voucher signing)

- **Smart Contract**  
  - Solidity ^0.8.17  
  - OpenZeppelin ERC721URIStorage & EIP712 + ECDSA  
  - Lazy-mint via `NFTVoucher` + `redeem`  

- **Infrastructure / Dev Tools**  
  - IPFS (decentralized file storage) via Pinata.cloud  
  - ngrok or Cloudflare Tunnel (HTTPS for local dev)  
  - MetaMask (wallet & signer)  
  - Git / GitHub (source control)  
  - VS Code (editor)  

- **Standards & Protocols**  
  - HTTP(S), REST for API endpoints  
  - JSON-RPC (Ethereum node communication)  
  - EIP-712 (secure off-chain message signing)  
  - ERC-721 (NFT metadata URI standard)  

---

## 🚀 Quickstart

### 1. Backend

1. Copy `.env.example` → `.env`, fill in:
   ```
   PINATA_API_KEY=…
   PINATA_SECRET_API_KEY=…
   BACKEND_PRIVATE_KEY=…      
   CHAIN_ID=…                 
   NFT_CONTRACT_ADDRESS=…     
   ```
2. Install & start:
   ```bash
   cd server
   npm install
   npm start
   ```
3. Verify health:
   ```bash
   curl http://localhost:8787/ping
   ```

### 2. Frontend

1. Copy `.env.example` → `.env`, fill in:
   ```
   REACT_APP_BACKEND=http://localhost:8787
   REACT_APP_NFT_CONTRACT=0x...
   ```
2. Install & start:
   ```bash
   cd client
   npm install
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

### 3. Deploy Smart Contract

1. Compile & deploy `BitstampNFT` (e.g. via Remix or Hardhat).  
2. Note the deployed address and update `.env` accordingly.

---

## 🛠️ Usage

1. **Capture Photo**  
   - Desktop: grant camera & geolocation → click **Capture Photo**.  
   - Mobile: use file input → grant geolocation.

2. **Upload & Preview**  
   - Enter optional caption → **Upload & Preview**.  
   - Preview IPFS-hosted image + metadata URI appears.

3. **Mint NFT**  
   - Click **Mint NFT** → MetaMask popup → confirm transaction.  
   - On success, you’ll see the transaction hash.

4. **View & Tip**  
   - Navigate to NFT detail (e.g. `/view/4`), view image, metadata, and owner.  
   - Enter ETH amount → **Tip** → directly reward the creator.

---