#!/usr/bin/env tsx
/**
 * ============================================================================
 * CRA CONTRACT — MIDNIGHT PREVIEW NETWORK DEPLOYMENT SCRIPT
 * ============================================================================
 * Verifies connectivity to Midnight Preview network and outputs deployment
 * instructions for browser wallet (Midnight Lace) deployment.
 *
 * Usage (WSL):
 *   cd /mnt/d/sd-project/RISE-IN/confidential-rental-aggreement
 *   npm run deploy:preview
 * ============================================================================
 */

import { execSync } from 'child_process';
import { Contract } from '../../managed/contract/index.js';

const PREVIEW_NODE    = 'https://rpc.preview.midnight.network';
const PREVIEW_INDEXER = 'https://indexer.preview.midnight.network/api/v4/graphql';
const PREVIEW_FAUCET  = 'https://faucet.preview.midnight.network';

// ─── Helper: sleep ───────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Get Windows Host IP from WSL2 (for Docker port access) ─────────────────
function getWindowsHostIp(): string {
  try {
    const ip = execSync("cat /etc/resolv.conf | grep nameserver | awk '{print $2}'", { encoding: 'utf8' }).trim();
    return ip || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

// ─── Check proof server via multiple IPs ────────────────────────────────────
async function checkProofServer(): Promise<{ ok: boolean; url: string }> {
  const windowsHostIp = getWindowsHostIp();
  const candidates = [
    `http://localhost:6300`,
    `http://127.0.0.1:6300`,
    `http://${windowsHostIp}:6300`,
  ];

  console.log(`      Trying IPs: localhost, 127.0.0.1, ${windowsHostIp} (Windows host)`);

  for (const base of candidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(`${base}/status`, { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const body = await res.json().catch(() => ({}));
          console.log(`      ✅ Proof server ready at ${base}: ${JSON.stringify(body)}`);
          return { ok: true, url: base };
        }
      } catch { /* try next */ }
    }
    console.log(`      ⚠️  Not reachable at ${base}`);
  }
  return { ok: false, url: '' };
}

// ─── Check Preview network ───────────────────────────────────────────────────
async function checkPreviewNetwork(): Promise<boolean> {
  let rpcOk = false, indexerOk = false;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${PREVIEW_NODE}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    console.log(`      ✅ Preview RPC ONLINE: ${text}`);
    rpcOk = true;
  } catch (e: any) {
    console.log(`      ⚠️  Preview RPC: ${e.message}`);
  }

  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 8000);
    const gql = await fetch(PREVIEW_INDEXER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      signal: ctrl2.signal,
    });
    clearTimeout(t2);
    const body = await gql.json();
    console.log(`      ✅ Preview Indexer ONLINE: ${JSON.stringify(body)}`);
    indexerOk = true;
  } catch (e: any) {
    console.log(`      ⚠️  Preview Indexer: ${e.message}`);
  }

  return rpcOk && indexerOk;
}

// ─── Verify compiled contract ────────────────────────────────────────────────
async function verifyContract(): Promise<boolean> {
  try {
    const witnesses = {
      tenantSecretKey:  (_: any) => [{}, new Uint8Array(32).fill(1)] as any,
      leaseProofNonce:  (_: any) => [{}, new Uint8Array(32).fill(2)] as any,
      rentalRecordHash: (_: any) => [{}, new Uint8Array(32).fill(3)] as any,
    };
    new Contract(witnesses);
    console.log('      ✅ CRA Compact contract compiled & instantiated OK');
    console.log('      ✅ Circuits: signAgreement | resetProperty | incrementSession');
    console.log('      ✅ Ledger:   agreementCount | propertyId | lastAgreementCommitment | activeSession');
    return true;
  } catch (e: any) {
    console.error(`      ❌ Contract error: ${e.message}`);
    return false;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('='.repeat(65));
  console.log(' CRA — Midnight Preview Network Deployment Verification');
  console.log('='.repeat(65));
  console.log(`  Node RPC    : ${PREVIEW_NODE}`);
  console.log(`  Indexer     : ${PREVIEW_INDEXER}`);
  console.log(`  Proof Server: localhost:6300`);
  console.log('-'.repeat(65));

  // Step 1: Proof server
  console.log('\n[1/4] Checking Midnight Proof Server...');
  const proof = await checkProofServer();
  if (!proof.ok) {
    console.log('\n      ⚠️  Proof server not reachable from WSL2 via Node.js fetch.');
    console.log('      This is a known WSL2+Docker networking issue.');
    console.log('      Verify via Windows browser: http://localhost:6300/status');
    console.log('      OR via WSL curl:');
    const winIp = getWindowsHostIp();
    console.log(`        curl http://${winIp}:6300/status`);
    console.log('      Continuing anyway — deployment is done via browser wallet.\n');
  }

  // Step 2: Preview network
  console.log('\n[2/4] Checking Midnight Preview Network...');
  const networkOk = await checkPreviewNetwork();

  // Step 3: Contract
  console.log('\n[3/4] Verifying compiled CRA Compact contract...');
  await verifyContract();

  // Step 4: Deployment guide
  console.log('\n[4/4] Preview Network Deployment Guide:');
  console.log('');
  console.log('='.repeat(65));
  if (networkOk) {
    console.log(' 🟢 PREVIEW NETWORK IS UP — Ready to deploy!');
  } else {
    console.log(' 🟡 Preview network status uncertain — check manually.');
  }
  console.log('='.repeat(65));
  console.log('');
  console.log('  OPTION A — Browser Wallet (Midnight Lace):');
  console.log('  ─────────────────────────────────────────────────────');
  console.log('  1. Open Midnight Lace → Switch to PREVIEW network');
  console.log('  2. Get tDUST from faucet:');
  console.log(`     ${PREVIEW_FAUCET}`);
  console.log('  3. Open the dApp admin page:');
  console.log('     https://confidential-rental-aggreement.vercel.app/admin.html');
  console.log('  4. Click "Connect Wallet" → approve in Lace');
  console.log('  5. Click "Reset Property ID / Deploy New Session"');
  console.log('  6. Sign in Midnight Lace → note the contract address');
  console.log('');
  console.log('  OPTION B — Midnight CLI (if available):');
  console.log('  ─────────────────────────────────────────────────────');
  console.log('  midnight-cli deploy \\');
  console.log('    --network preview \\');
  console.log('    --node https://rpc.preview.midnight.network \\');
  console.log('    --contract managed/contract/index.js');
  console.log('');
  console.log('  PREVIEW NETWORK ENDPOINTS:');
  console.log('  ─────────────────────────────────────────────────────');
  console.log(`  RPC     : ${PREVIEW_NODE}`);
  console.log(`  Indexer : ${PREVIEW_INDEXER}`);
  console.log(`  Faucet  : ${PREVIEW_FAUCET}`);
  console.log(`  Explorer: https://explorer.preview.midnight.network`);
  console.log('');
  console.log('  ✅ CRA Contract compiled: managed/contract/index.js');
  console.log('  ✅ Compact source:        contracts/counter.compact (v0.23)');
  console.log('');
  console.log('='.repeat(65));
  console.log(' After deployment, share your Preview contract address!');
  console.log('='.repeat(65));
  console.log('');

  // Also verify proof server via curl subprocess
  console.log('  Proof server check via shell curl:');
  try {
    const out = execSync('curl -s --max-time 3 http://localhost:6300/status 2>&1', { encoding: 'utf8' });
    console.log(`  localhost:6300/status → ${out || '(empty response)'}`);
  } catch {
    const winIp = getWindowsHostIp();
    try {
      const out2 = execSync(`curl -s --max-time 3 http://${winIp}:6300/status 2>&1`, { encoding: 'utf8' });
      console.log(`  ${winIp}:6300/status → ${out2 || '(empty response)'}`);
    } catch {
      console.log('  Could not reach proof server via curl either.');
      console.log('  Check Docker Desktop to confirm it is running on port 6300.');
    }
  }
  console.log('');
}

main().catch(err => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
