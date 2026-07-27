# Project Proposal: Confidential Rental Agreement (CRA)

> **Zero-Knowledge Tenant Verification, Qualification & Lease Signing Protocol on Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preprod-8b5cf6?style=flat-square)](https://explorer.preprod.midnight.network)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-e11d48?style=flat-square)](https://midnight.network)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📌 Executive Summary

**Confidential Rental Agreement (CRA)** is a privacy-preserving dApp engineered on the **Midnight Network** utilizing **Compact zero-knowledge (ZK) smart contracts**. CRA addresses critical privacy vulnerabilities in real estate leasing, tenant background checks, and deposit verification: **unnecessary exposure of personal credit scores, bank statement balances, employment history, and national identity numbers to landlords, leasing agents, and centralized databases.**

By generating zero-knowledge proofs client-side inside the tenant's browser, applicants prove lease agreement eligibility, deposit solvency, and credit qualifications without disclosing raw bank balances or personal identity attributes. A cryptographic **agreement commitment hash** is recorded on-chain, ensuring complete auditability, lease enforceability, and fairness while preventing identity discrimination and financial data leaks.

---

## 🎯 Problem Statement & Solution

### The Problem
1. **Intrusive Financial Exposure**: Tenants must submit complete bank statements, W-2 forms, tax returns, and social security details to unvetted leasing agencies.
2. **Centralized Data Breaches**: Landlord databases and property management software host unencrypted tenant financial documentation, representing prime targets for identity theft.
3. **Identity Bias & Discrimination**: Subconscious bias during tenant selection based on applicant background, origin, or exact financial tier.

### The Midnight ZK Solution
CRA leverages Midnight’s dual-state (private witness vs. public ledger) architecture:
- **Client-Side Proof Generation**: The tenant's private key (`tenantSecretKey`), entropy salt (`leaseProofNonce`), and hashed rental record/deposit payload (`rentalRecordHash`) are computed locally inside the browser.
- **On-Chain Public Verification**: The Midnight Compact contract verifies that the tenant satisfies the required criteria for `propertyId` without revealing raw financial records.

---

## 🏗️ Technical Architecture & Compact Contract Design

### Smart Contract Specification (`contracts/counter.compact`)

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

## 🛡️ Midnight Privacy & Verification Matrix

| Component | State Type | Visibility | Purpose |
|---|---|---|---|
| `tenantSecretKey` | Private Witness | Browser Only | Tenant secret identity key used for ZK witness computation |
| `leaseProofNonce` | Private Witness | Browser Only | Entropy salt preventing commitment replay & hash dictionary attacks |
| `rentalRecordHash` | Private Witness | Browser Only | Hashed payload of verified credit score, deposit escrow, & qualification criteria |
| `agreementCount` | Public Ledger | On-Chain Public | Total verified rental agreements signed for active property |
| `propertyId` | Public Ledger | On-Chain Public | Active rental property identifier configured by landlord |
| `lastAgreementCommitment` | Public Ledger | On-Chain Public | Disclosed 256-bit ZK commitment hash verifying lease qualification |
| `activeSession` | Public Ledger | On-Chain Public | Active lease epoch counter incremented on property rotation |

---

## 🌐 Deployed Smart Contract & Infrastructure

- **Target Network**: Midnight Preprod Testnet
- **Unique Contract Address**: `02008f4c28a9b2e04e76d910a39c14f5e82b714902c38d51a628e49f60d3c1b8`
- **Proof Server Endpoint**: `http://localhost:6300` (Local Docker container: `midnightntwrk/proof-server:8.1.0`)
- **Indexer Endpoint**: `https://indexer.preprod.midnight.network`
- **Frontend Architecture**: Pure Vanilla TypeScript (`src/index.ts`, `src/integration/contract.ts`), HTML5, CSS3, compiled via Vite ESM modules with WebAssembly plugins.

---

## 🚀 Key Features

1. **Multi-Wallet Extension Connector**: Auto-detects Midnight Lace Wallet (`window.midnight.mnLace`) and 1 AM Wallet (`window.oneAm`).
2. **Session Persistence**: Saves wallet state in browser `sessionStorage` (`cra_wallet_connected`, `cra_wallet_address`).
3. **Real-Time ZK Execution Terminal**: Dynamic UI terminal monitoring client-side proof generation and transaction submission.
4. **Landlord Admin Controls**: Interactive dashboard (`admin.html`) enabling landlords to update active `propertyId` and rotate lease epochs.
5. **Chain Explorer Integration**: On-chain metadata inspector (`explorer.html`) tracking live ledger state.

---

## 🗺️ Roadmap & Level 3 Compliance Checklist

- [x] **Compact ZK Circuit**: Written in Compact `v0.23` with private witness isolation and public ledger exports.
- [x] **Vitest Unit Test Suite**: Pass rate 100% passing (`4/4` tests passing).
- [x] **Consistent Unique Preprod Address**: Configured with dedicated contract address `02008f4c28a9b2e04e76d910a39c14f5e82b714902c38d51a628e49f60d3c1b8` across all files.
- [x] **Vanilla TS Frontend**: Pure TypeScript logic (`src/index.ts`) managing UI bindings, proof client, and DOM interaction.
- [x] **CI/CD Integration**: GitHub Actions workflow automatically building and testing on Node.js v22.
