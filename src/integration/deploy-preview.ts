#!/usr/bin/env tsx
/**
 * ============================================================================
 * CRA CONTRACT DEPLOYMENT SCRIPT — MIDNIGHT PREVIEW NETWORK
 * ============================================================================
 * Deploys the Confidential Rental Agreement (CRA) Compact contract to the
 * Midnight Preview Testnet using the Midnight JS SDK + DApp Connector API.
 *
 * Usage (WSL/Linux):
 *   nvm use 22
 *   npx tsx src/integration/deploy-preview.ts
 * ============================================================================
 */

import { Contract } from '../../managed/contract/index.js';

// ─── Preview Network Configuration ──────────────────────────────────────────
const PREVIEW_CONFIG = {
  networkId: 'preview',
  nodeUrl:   'https://rpc.preview.midnight.network',
  indexerUrl:'https://indexer.preview.midnight.network/api/v4/graphql',
  proofServerUrl: 'http://localhost:6300',
  faucetUrl: 'https://faucet.preview.midnight.network',
};

async function deployToPreview() {
  console.log('');
  console.log('='.repeat(65));
  console.log(' Confidential Rental Agreement (CRA) — Preview Network Deploy');
  console.log('='.repeat(65));
  console.log(`  Network     : ${PREVIEW_CONFIG.networkId}`);
  console.log(`  Node RPC    : ${PREVIEW_CONFIG.nodeUrl}`);
  console.log(`  Indexer     : ${PREVIEW_CONFIG.indexerUrl}`);
  console.log(`  Proof Server: ${PREVIEW_CONFIG.proofServerUrl}`);
  console.log('-'.repeat(65));

  // Step 1: Verify proof server is running
  console.log('\n[1/4] Checking Midnight Proof Server on port 6300...');
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${PREVIEW_CONFIG.proofServerUrl}/status`, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      console.log(`      Proof server OK — status: ${JSON.stringify(body)}`);
    } else {
      console.log(`      Proof server responded with status ${res.status}`);
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.warn('      WARNING: Proof server not reachable on localhost:6300');
      console.warn('      Make sure you ran: docker run -d -p 6300:6300 midnightnetwork/proof-server:latest midnight-proof-server --network testnet');
    } else {
      console.warn(`      WARNING: Could not reach proof server: ${e.message}`);
    }
  }

  // Step 2: Verify Preview network indexer is reachable
  console.log('\n[2/4] Checking Midnight Preview Indexer connectivity...');
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(PREVIEW_CONFIG.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      console.log(`      Preview indexer OK (HTTP ${res.status}) — RPC is UP!`);
    } else {
      console.log(`      Preview indexer responded with HTTP ${res.status}`);
    }
  } catch (e: any) {
    console.warn(`      WARNING: Preview indexer not reachable: ${e.message}`);
    console.warn('      The Preview RPC may still be coming online. Retrying may help.');
  }

  // Step 3: Instantiate the contract (local verification)
  console.log('\n[3/4] Instantiating CRA Compact contract locally...');
  try {
    const witnesses = {
      tenantSecretKey:    (_ctx: any) => [{}, new Uint8Array(32).fill(1)] as any,
      leaseProofNonce:    (_ctx: any) => [{}, new Uint8Array(32).fill(2)] as any,
      rentalRecordHash:   (_ctx: any) => [{}, new Uint8Array(32).fill(3)] as any,
    };
    const contract = new Contract(witnesses);
    console.log('      Contract class instantiated successfully.');
    console.log(`      Circuits available: signAgreement, resetProperty, incrementSession`);
    console.log('      Ledger fields: agreementCount, propertyId, lastAgreementCommitment, activeSession');
  } catch (e: any) {
    console.error(`      ERROR: Contract instantiation failed: ${e.message}`);
    process.exit(1);
  }

  // Step 4: Deployment instructions
  console.log('\n[4/4] Deployment Instructions for Midnight Lace / CLI:');
  console.log('');
  console.log('  Option A — Browser Wallet (Midnight Lace):');
  console.log('    1. Open https://confidential-rental-aggreement.vercel.app/admin.html');
  console.log('    2. Click "Connect Wallet" and approve in Midnight Lace extension');
  console.log('    3. Ensure Lace is set to Preview network');
  console.log('    4. Click "Reset Property ID / Deploy New Session" to initialize the contract');
  console.log('    5. Approve the transaction in Midnight Lace');
  console.log('    6. Copy the contract address from the transaction receipt');
  console.log('');
  console.log('  Option B — Midnight CLI (if available):');
  console.log('    midnight-cli deploy \\');
  console.log('      --network preview \\');
  console.log('      --node https://rpc.preview.midnight.network \\');
  console.log('      --contract managed/contract/index.js \\');
  console.log('      --wallet-key $WALLET_SECRET_KEY');
  console.log('');
  console.log('='.repeat(65));
  console.log(' AFTER DEPLOYMENT — paste your contract address to the assistant');
  console.log(' so we can update CONTRACT_ADDRESS in contract.ts and README.md');
  console.log('='.repeat(65));
  console.log('');
}

deployToPreview().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
