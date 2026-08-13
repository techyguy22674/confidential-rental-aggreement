# Project Proposal: Confidential Rental Agreement (CRA)

> **Zero-Knowledge Tenant Qualification, Financial Verification & Lease Signing Protocol on Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight_Preview-8b5cf6?style=flat-square)](https://explorer.preview.midnight.network)
[![Compact Language](https://img.shields.io/badge/Compact-v0.23-e11d48?style=flat-square)](https://midnight.network)
[![Framework](https://img.shields.io/badge/Framework-Next.js_14-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## ❓ Question 1: What is the project about?

**Confidential Rental Agreement (CRA)** is a privacy-preserving decentralized application (dApp) built on the **Midnight Network** utilizing **Compact zero-knowledge (ZK) smart contracts**. CRA enables prospective tenants to prove rental deposit capability, income qualification, and background check eligibility **without exposing personal identity, exact monthly income, bank account balances, social security numbers, or full credit report histories** to landlords, property management companies, or third-party listing platforms.

Traditional rental application processes are invasive surveillance pipelines: tenants are forced to upload unencrypted tax returns, bank statements, and credit reports to centralized databases that are vulnerable to data breaches, identity theft, and algorithmic discrimination. CRA replaces this with a ZK architecture where:

- **Private proofs are generated client-side inside the tenant's browser**
- **Only a cryptographic lease commitment hash is written to the Midnight chain**
- **No raw income numbers, personal identity attributes, or financial records touch the network**

The smart contract (`contracts/confidential_rental_agreement.compact`) implements 6 circuits that handle the full lifecycle: lease signing, agreement verification, lease revocation/termination, landlord authority setup, property rotation, and session management.

---

## ❓ Question 2: What problem does it solve?

### The Privacy & Discrimination Crisis in Rental Applications

1. **Mass Over-Disclosure**: Tenants must submit tax returns, pay stubs, W-2s, and bank statements to prove they meet income ratios (e.g. 3x monthly rent), exposing full financial histories to strangers.

2. **Centralized Data Breaches**: Property management databases holding thousands of unencrypted SSNs, bank details, and identity documents are prime targets for identity theft and ransomware attacks.

3. **Algorithmic & Identity Discrimination**: Access to raw personal data allows implicit bias and demographic discrimination in tenant selection.

4. **Lease Replay & Fraud**: Without ZK commitment binding and session nonces, fraudulent applicants can reuse static proof documents or forge rental references across multiple properties.

5. **No Trustless Lease Revocation**: Existing systems rely on legal disputes to verify lease terminations without cryptographically auditable revocation records.

### How CRA Solves This

| Problem | CRA Solution |
|---|---|
| Identity exposure | `tenantSecretKey()` witness — calculated locally, never leaves device |
| Income over-disclosure | `tenantIncomeBalance()` witness — compared privately to threshold (`assert(income >= minimumIncomeRequirement)`) |
| Credit & record leaks | `rentalRecordHash()` — SHA-256 hashed locally before ZK proof |
| Application replay fraud | `leaseProofNonce()` + `activeSession` epoch counter |
| Unauthorized revocation | `revokeAgreement()` circuit with ZK landlord authority proof |
| Property impersonation | `landlordCommitment` anchor — `setLandlordCommitment()` circuit |

---

## ❓ Question 3: How does the Midnight ZK architecture work?

### Compact Smart Contract Design (`contracts/confidential_rental_agreement.compact`)

CRA uses Midnight's **dual-state model**: private witnesses computed locally on-device vs. public ledger state stored on-chain.

#### Ledger State (8 public fields)

| Ledger Field | Type | Description |
|---|---|---|
| `agreementCount` | `Counter` | Total signed lease agreements |
| `revokedCount` | `Counter` | Total revoked/terminated agreements |
| `activeSession` | `Counter` | Epoch nonce for replay protection |
| `propertyId` | `Bytes<32>` | Current active rental property ID |
| `landlordCommitment` | `Bytes<32>` | Landlord public authority commitment |
| `lastAgreementCommitment` | `Bytes<32>` | Most recent tenant ZK lease hash |
| `lastRevokedCommitment` | `Bytes<32>` | Most recent revoked commitment hash |
| `minimumIncomeRequirement` | `Uint<32>` | Minimum required monthly income |

#### Witnesses (5 private inputs — never disclosed)

| Witness | Type | Purpose |
|---|---|---|
| `tenantSecretKey()` | `Bytes<32>` | Tenant private identity key |
| `leaseProofNonce()` | `Bytes<32>` | Entropy nonce (replay-resistance) |
| `rentalRecordHash()` | `Bytes<32>` | Hashed credit/background record |
| `tenantIncomeBalance()` | `Uint<32>` | Private monthly income (vs. threshold) |
| `landlordSigningKey()` | `Bytes<32>` | Landlord admin authorization key |

#### Circuit Architecture (6 circuits)

| Circuit | Inputs | Witnesses Used | Business Logic |
|---|---|---|---|
| `signAgreement` | `Bytes<32>` propertyId | tenantSecretKey, leaseProofNonce, rentalRecordHash, tenantIncomeBalance | ZK lease signing with private income threshold check |
| `verifyAgreement` | `Bytes<32>` commitment | — | Public on-chain commitment verification |
| `revokeAgreement` | `Bytes<32>` commitment | landlordSigningKey | Revoke a lease — ZK landlord authority required |
| `setLandlordCommitment` | `Uint<32>` threshold | landlordSigningKey | Anchor landlord authority + set income threshold |
| `resetProperty` | `Bytes<32>`, `Uint<32>` | — | New property epoch with updated threshold |
| `incrementSession` | — | — | Bump session nonce (replay protection) |

#### ZK Privacy Flow

```
[Tenant's Device]
  ├─ tenantSecretKey()        →  ZK witness (private, never disclosed)
  ├─ leaseProofNonce()        →  ZK witness (private, never disclosed)
  ├─ rentalRecordHash()       →  ZK witness (private, never disclosed)
  ├─ tenantIncomeBalance()    →  assert(income >= minimumIncomeRequirement) ← ZK constraint
  └─ persistentHash<Vector<5, Bytes<32>>>([domain, key, nonce, record, session])
                              →  agreementCommitment (only this is disclosed on-chain)

[Midnight Chain]
  └─ lastAgreementCommitment: 0x0df73463... ← only the hash is stored
```

---

## ❓ Question 4: What are the privacy guarantees and threat model?

### What an Observer CANNOT Learn (Strictly Private)

| Sensitive Data | Protected By | Guarantee |
|---|---|---|
| Tenant real identity | `tenantSecretKey()` ZK witness | Never transmitted — local device only |
| Actual monthly income | `tenantIncomeBalance()` ZK witness | Compared privately to threshold — balance never disclosed |
| Bank/credit records | `rentalRecordHash()` ZK witness | SHA-256 hashed locally — only hash in proof |
| Entropy/nonce | `leaseProofNonce()` ZK witness | Per-application entropy — replay-resistant |
| Landlord signing key | `landlordSigningKey()` ZK witness | Derived locally for authorization — key never on-chain |

### What an Observer CAN Learn (Public Ledger)

| Public Data | Ledger Field | Rationale |
|---|---|---|
| Total signed leases | `agreementCount` | Auditability & operational metric — no user attribution |
| Active property ID | `propertyId` | Prospective tenants must know which property is active |
| Most recent commitment | `lastAgreementCommitment` | Landlords use `verifyAgreement()` to verify lease claims |
| Total revocations | `revokedCount` | Transparency for terminated leases |
| Minimum income threshold | `minimumIncomeRequirement` | Transparent qualification standard for applicants |
| Session epoch | `activeSession` | Verifiers can detect stale proofs |

### Threat Model

| Threat | Mitigation |
|---|---|
| On-chain eavesdropping | ZK commitments reveal zero identity or financial data |
| Replay attacks | `leaseProofNonce()` + session binding in `Vector<5, Bytes<32>>` hash |
| Landlord impersonation | `landlordCommitment` anchor + `assert(derivedCommitment == landlordCommitment)` |
| Fraudulent lease claim | `revokeAgreement()` with ZK landlord authorization |
| Income ratio manipulation | `minimumIncomeRequirement` set on-chain by verified landlord |
| Cross-property forgery | `assert(propertyId == expectedPropertyId)` enforces property binding |

---

## 🌐 Deployment & Infrastructure

- **Network**: Midnight Preview Testnet
- **Contract Address**: `0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0`
- **Explorer**: [https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0](https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0)
- **Proof Server**: Docker `midnightntwrk/proof-server:8.1.0` at `localhost:6300`
- **Indexer**: `https://indexer.preview.midnight.network/api/v4/graphql`
- **Frontend**: Next.js 14 App Router deployed on Vercel
- **Live Demo**: [https://confidential-rental-aggreement.vercel.app/](https://confidential-rental-aggreement.vercel.app/)

---

## 🗺️ Level 3 Compliance Checklist

- [x] **Rich Contract Logic (v2)**: 6 circuits, 8 ledger fields, 5 witnesses — ZK income threshold assertion, lease revocation, landlord authority.
- [x] **Compact Smart Contract**: Written in `Compact v0.23` with `persistentHash`, `disclose`, `assert`, Counter, and `Uint<32>` types.
- [x] **Managed Contract Output**: Pre-compiled `managed/contract/index.js` + `index.d.ts` with full TypeScript type bindings.
- [x] **Vitest Unit Test Suite**: 10/10 tests passing — covers circuit structure, witness isolation, income threshold, ZK privacy, landlord auth.
- [x] **CI Pipeline**: GitHub Actions verifies Compact source, managed output, runs tests, and builds Next.js on every push.
- [x] **Next.js 14 App Router UI**: Full dApp with ZK architecture diagrams, income threshold slider, verify/revoke panels.
- [x] **On-Chain Preview Deployment**: Deployed at [Midnight Explorer](https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0).
- [x] **Live Vercel Demo**: [https://confidential-rental-aggreement.vercel.app/](https://confidential-rental-aggreement.vercel.app/).
- [x] **Video Demo**: [YouTube](https://youtu.be/m5JKf-RWM-o).
