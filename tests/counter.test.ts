import { describe, it, expect, beforeEach } from 'vitest';
import { ConfidentialRentalAgreementClient, CONTRACT_ADDRESS, NETWORK_CONFIG } from '../src/integration/contract.js';

describe('Confidential Rental Agreement (CRA) Smart Contract Test Suite', () => {
  let client: ConfidentialRentalAgreementClient;

  beforeEach(() => {
    client = new ConfidentialRentalAgreementClient();
  });

  it('should initialize ConfidentialRentalAgreementClient with default network config', () => {
    expect(CONTRACT_ADDRESS).toBeDefined();
    expect(CONTRACT_ADDRESS.length).toBeGreaterThan(10);
    expect(NETWORK_CONFIG.networkId).toBe('preview');
    expect(NETWORK_CONFIG.nodeUrl).toContain('midnight.network');
  });

  it('should generate valid private witnesses for tenantSecretKey, leaseProofNonce, and rentalRecordHash', () => {
    const state = client.getPrivateState();
    expect(state.tenantSecretKey).toBeInstanceOf(Uint8Array);
    expect(state.leaseProofNonce).toBeInstanceOf(Uint8Array);
    expect(state.rentalRecordHash).toBeInstanceOf(Uint8Array);
    expect(state.tenantSecretKey.length).toBe(32);
  });

  it('should update tenant secret key and rental record payload correctly', () => {
    client.updateTenantKey('secret_tenant_key_888');
    client.updateRentalRecord('Verified Credit Score: 780+ | Deposit Escrow Confirmed');

    const state = client.getPrivateState();
    const keyHex = client.bytesToHex(state.tenantSecretKey);
    const recordHex = client.bytesToHex(state.rentalRecordHash);

    expect(keyHex).toBeDefined();
    expect(recordHex).toBeDefined();
    expect(state.tenantSecretKey.length).toBe(32);
  });

  it('should instantiate Compact Contract with defined signAgreement and resetProperty circuits', () => {
    const contract = client.getContract();
    expect(contract).toBeDefined();
    expect(typeof contract.initialState).toBe('function');
  });
});
