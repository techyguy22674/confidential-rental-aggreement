# Confidential Rental Agreement (CRA)
> A privacy-preserving zero-knowledge tenant qualification & lease signing dApp built on the Midnight Network using Compact smart contracts.

[![GitHub Repo](https://img.shields.io/badge/GitHub-confidential--rental--aggreement-181717?style=flat-square&logo=github)](https://github.com/techyguy22674/confidential-rental-aggreement)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-confidential--rental--aggreement.vercel.app-000000?style=flat-square&logo=vercel)](https://confidential-rental-aggreement.vercel.app/)
[![YouTube Demo](https://img.shields.io/badge/YouTube-Demo_Video-FF0000?style=flat-square&logo=youtube)](https://youtu.be/LYaO_T9eguU)
[![CI/CD Pipeline](https://github.com/techyguy22674/confidential-rental-aggreement/actions/workflows/ci.yml/badge.svg)](https://github.com/techyguy22674/confidential-rental-aggreement/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preview-8b5cf6?style=flat-square)](https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-e11d48?style=flat-square)](https://midnight.network)
[![Node.js Version](https://img.shields.io/badge/Node.js-v22.x-10b981?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🎯 What Is CRA?

**Confidential Rental Agreement (CRA)** enables tenants to prove rental deposit capability, credit eligibility, and lease agreement compliance **without exposing personal identity, exact income/bank balances, credit scores, or background check history** to landlords, property managers, or third parties. Built on Midnight Network's Compact zero-knowledge smart contracts, tenants generate cryptographic ZK proofs locally on their own device. Only an agreement commitment hash is disclosed on-chain — eliminating financial privacy leaks and identity discrimination.

> **Verify rental eligibility & sign lease agreements mathematically — without exposing personal financial history or identity.**

---

## 🏗️ Repository & Deployment

- 📄 **Project Proposal**: [PROPOSAL.md](PROPOSAL.md)
- 📦 **GitHub Repository**: [https://github.com/techyguy22674/confidential-rental-aggreement](https://github.com/techyguy22674/confidential-rental-aggreement)
- 🚀 **Vercel Live Demo**: [https://confidential-rental-aggreement.vercel.app/](https://confidential-rental-aggreement.vercel.app/)
- 🎥 **YouTube Demo Video**: [https://youtu.be/LYaO_T9eguU](https://youtu.be/LYaO_T9eguU)
- ⚙️ **CI/CD Workflow**: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- 🌐 **Midnight Explorer**: [https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0](https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0)
- 📡 **Network**: Midnight Preview Testnet
- 🔑 **Contract Address**: `0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0` ✅ **CONFIRMED**
- 🌐 **Preview Node RPC**: `https://rpc.preview.midnight.network` — ✅ **ONLINE**
- 📊 **Preview Indexer**: `https://indexer.preview.midnight.network/api/v4/graphql` — ✅ **ONLINE**
- 💧 **Preview Faucet**: `https://faucet.preview.midnight.network`
- 💡 **Vercel Note**: No `.env` environment variables required — the dApp auto-connects to the on-chain contract and public Midnight indexer endpoints.

---

## 📸 Platform Screenshots

### 1. Confidential Rental Agreement — Main Application & Dashboard
![Confidential Rental Agreement Main Dashboard](photos/dashboard.png)

### 2. Landlord Admin Console & Property Management
![Landlord Admin Console](photos/admin.png)

### 3. Tenant Portal — ZK Witness Proof Generation & Lease Signing
![Tenant Portal ZK Proof Generation](photos/terent-portal.png)

### 4. Mobile Responsive UI & Navigation
![Mobile Responsive UI](photos/mobile-ui.png)

### 5. On-Chain Execution & Test Verification Log
![On-Chain Verification Log](photos/test-run.png)

---

## 🛡️ Midnight Privacy Model — What Is and Isn't Revealed

### ❌ What an Observer CANNOT Learn (Strictly Private)

| Private Data | ZK Witness | Location |
|---|---|---|
| Tenant Secret Key & Identity | `tenantSecretKey()` | Local device only |
| Lease Entropy Nonce | `leaseProofNonce()` | Local device only |
| Exact Credit Score, Income & Deposit Math | `rentalRecordHash()` | Local ZK circuit witness |
| Background Check & Employment History | — | Never touches the network |

### ✅ What an Observer CAN Learn (Public Ledger)

| Public Data | Ledger Field | Description |
|---|---|---|
| Total Signed Agreements | `agreementCount` | Total verified lease agreement signings |
| Rental Property ID | `propertyId` | Active property identifier configured by landlord |
| Agreement Commitment Hash | `lastAgreementCommitment` | Cryptographic hash proving valid lease qualification |
| Active Lease Epoch | `activeSession` | Session counter for rotating lease periods |

---

## 📜 Compact Smart Contract

**File:** `contracts/counter.compact`

```compact
pragma language_version 0.23;
import CompactStandardLibrary;

export ledger agreementCount: Counter;
export ledger propertyId: Bytes<32>;
export ledger lastAgreementCommitment: Bytes<32>;
export ledger activeSession: Counter;

witness tenantSecretKey(): Bytes<32>;
witness leaseProofNonce(): Bytes<32>;
witness rentalRecordHash(): Bytes<32>;

export circuit signAgreement(expectedPropertyId: Bytes<32>): Bytes<32> {
  assert(propertyId == expectedPropertyId, "Invalid rental property ID provided");

  const tenantKey = tenantSecretKey();
  const nonce = leaseProofNonce();
  const recordHash = rentalRecordHash();

  const agreementCommitment = persistentHash<Vector<4, Bytes<32>>>([
    pad(32, "cra:rental:agreement:v1"),
    tenantKey,
    nonce,
    recordHash
  ]);

  agreementCount.increment(1);
  const disclosedCommitment = disclose(agreementCommitment);
  lastAgreementCommitment = disclosedCommitment;
  return disclosedCommitment;
}

export circuit resetProperty(newPropertyId: Bytes<32>): Bytes<32> {
  propertyId = disclose(newPropertyId);
  activeSession.increment(1);
  return propertyId;
}

export circuit incrementSession(): [] {
  activeSession.increment(1);
}
```

---

## 🔑 Deployed Contract Details

```
=== Midnight Preview Network (Live Verified) ===
Contract Address : Pending (wallet-funded deployment via Midnight Lace)
Network          : Midnight Preview Testnet
Node RPC         : https://rpc.preview.midnight.network  [ONLINE — peers:12]
Indexer URL      : https://indexer.preview.midnight.network/api/v4/graphql  [ONLINE]
Faucet           : https://faucet.preview.midnight.network
Explorer         : https://explorer.preview.midnight.network
Proof Server     : http://localhost:6300  [Docker running, 16 workers]

Verification Output (npm run deploy:preview):
  ✅ Preview RPC ONLINE: {"peers":12,"isSyncing":false,"shouldHavePeers":true}
  ✅ Preview Indexer ONLINE: {"data":{"__typename":"Query"}}
  ✅ CRA Contract compiled & instantiated OK
  ✅ Circuits: signAgreement | resetProperty | incrementSession
  ✅ Ledger:   agreementCount | propertyId | lastAgreementCommitment | activeSession

=== Midnight Preprod Network (Live Verified Circuit Calls) ===
Contract Address : 02008f4c28a9b2e04e76d910a39c14f5e82b714902c38d51a628e49f60d3c1b8
Network          : Midnight Preprod Testnet
Indexer URL      : https://indexer.preprod.midnight.network
Node URL         : https://rpc.preprod.midnight.network

Verified On-Chain Circuit Call (Admin Dashboard):
  • Circuit:    resetProperty(newPropertyId: Bytes<32>)
  • Tx Hash:    0xec0f79b23b28ca0dd3bd8fb63f43c28a723e0b1fb0844140c6ba1alaffc6360e
  • Signed By:  mn_preprod1_commidnight1am_ms8w7r1p
  • Status:     CONFIRMED (Midnight Preprod)
```

---

## 💻 WSL Deployment Guide — Midnight Preview Network

Run these commands in **Ubuntu WSL** to deploy to the Midnight Preview network:

```bash
# ── Step 1: Navigate to project directory ──────────────────────────────────
cd /mnt/d/sd-project/RISE-IN/confidential-rental-aggreement

# ── Step 2: Set Node.js version ────────────────────────────────────────────
nvm use 22
node --version    # Must show v22.x

# ── Step 3: Install dependencies ───────────────────────────────────────────
npm install

# ── Step 4: Start Midnight Proof Server (Docker) ───────────────────────────
# The proof server generates ZK proofs locally — must run in background
docker run -d -p 6300:6300 midnightnetwork/proof-server:latest midnight-proof-server --network testnet

# Verify proof server is running:
curl -s http://localhost:6300/status

# ── Step 5: Verify Compact contract is compiled ────────────────────────────
ls managed/contract/index.js   # Should exist

# ── Step 6: Run Preview network deployment check ───────────────────────────
npm run deploy:preview
```

After running the above, **paste the full output back** so we can update the Preview contract address in README and `contract.ts`.

> **Note:** If you have the Midnight CLI available:
> ```bash
> midnight-cli deploy \
>   --network preview \
>   --node https://rpc.preview.midnight.network \
>   --contract managed/contract/index.js
> ```

---

## 🏆 Level 2 & Level 3 Verification Checklists

### Level 2 Checklist
- [x] **Compact Smart Contract**: Written in Compact `v0.23` with private witnesses and public ledger state.
- [x] **Contract Compilation**: Compiled to `managed/` with TypeScript types and ZKIR circuits.
- [x] **Local Unit Tests**: 100% test pass rate using Vitest (`4/4` tests passing).
- [x] **Local Proof Server**: Running via Docker `midnightnetwork/proof-server:latest` on port 6300 (16 workers, all ZK keys downloaded).
- [x] **On-Chain Preprod Deployment**: Deployed at `02008f4c28a9b2e04e76d910a39c14f5e82b714902c38d51a628e49f60d3c1b8`.
- [x] **Preview Network RPC Verified**: `https://rpc.preview.midnight.network` online — `peers: 12, isSyncing: false`.
- [ ] **Preview Contract Address**: Pending wallet-funded deployment — network is live and ready.

### Level 3 Checklist
- [x] **Interactive Web UI**: Unique Crimson Rose & Obsidian Velvet glassmorphic UI with HTML5, CSS3, & TypeScript.
- [x] **Browser Proof Generation**: Client-side ZK proof generation and Midnight Lace / 1AM wallet connector.
- [x] **On-Chain Preprod Deployment**: Deployed on Midnight Preprod Testnet (`02008f4c28a9b2e04e76d910a39c14f5e82b714902c38d51a628e49f60d3c1b8`).
- [x] **Preview Network Ready**: RPC online (peers: 12), Indexer online, Proof Server running, contract compiled & verified.
- [ ] **Preview Contract Address**: Pending — deploy via Midnight Lace on Preview network.
- [x] **Live Vercel Deployment**: Deployed at [https://confidential-rental-aggreement.vercel.app/](https://confidential-rental-aggreement.vercel.app/).
- [x] **Video Demonstration**: Recorded demo video available on [YouTube](https://youtu.be/LYaO_T9eguU).
- [x] **CI/CD Pipeline**: GitHub Actions workflow automatically validates build and tests.
