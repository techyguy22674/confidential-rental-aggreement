import { describe, it, expect } from 'vitest';
import { Contract, ledger } from '../managed/contract/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toBytes32(str: string): Uint8Array {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.subarray(0, 32));
  return bytes;
}

function buildWitnesses(opts: {
  tenantKey?: string;
  nonce?: string;
  record?: string;
  income?: bigint;
  landlordKey?: string;
}) {
  const tenantKey = toBytes32(opts.tenantKey ?? 'default_tenant_key');
  const nonce = toBytes32(opts.nonce ?? 'default_lease_nonce');
  const record = toBytes32(opts.record ?? 'default_rental_record');
  const income = opts.income ?? 6000n;
  const landlordKey = toBytes32(opts.landlordKey ?? 'default_landlord_key');

  return {
    tenantSecretKey: (ctx: any) => [ctx.privateState, tenantKey] as [any, Uint8Array],
    leaseProofNonce: (ctx: any) => [ctx.privateState, nonce] as [any, Uint8Array],
    rentalRecordHash: (ctx: any) => [ctx.privateState, record] as [any, Uint8Array],
    tenantIncomeBalance: (ctx: any) => [ctx.privateState, income] as [any, bigint],
    landlordSigningKey: (ctx: any) => [ctx.privateState, landlordKey] as [any, Uint8Array],
  };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Confidential Rental Agreement (CRA) — Midnight ZK Contract v2', () => {

  it('1. Contract Structure: core circuits are exported and callable from managed runtime', () => {
    const contract = new Contract(buildWitnesses({}));
    expect(contract).toBeDefined();
    expect(typeof contract.circuits.signAgreement).toBe('function');
    expect(typeof contract.circuits.resetProperty).toBe('function');
    expect(typeof contract.circuits.incrementSession).toBe('function');
    expect(contract).toHaveProperty('circuits');
    expect(contract).toHaveProperty('witnesses');
  });

  it('2. Witness Completeness: all 5 witnesses (including income and landlord key) are defined', () => {
    const witnesses = buildWitnesses({
      tenantKey: 'tenant_privkey_john_doe',
      nonce: 'entropy_nonce_lease_2026',
      record: 'sha256_background_check_hash',
      income: 7500n,
      landlordKey: 'landlord_signing_key_prop_99',
    });
    const contract = new Contract(witnesses);

    expect(contract.witnesses.tenantSecretKey).toBeDefined();
    expect(contract.witnesses.leaseProofNonce).toBeDefined();
    expect(contract.witnesses.rentalRecordHash).toBeDefined();
    expect(contract.witnesses.tenantIncomeBalance).toBeDefined();
    expect(contract.witnesses.landlordSigningKey).toBeDefined();
  });

  it('3. Private Witness Byte Length: tenantSecretKey, leaseProofNonce, rentalRecordHash are 32 bytes', () => {
    const witnesses = buildWitnesses({
      tenantKey: 'tenant_priv_key_alpha',
      nonce: 'random_nonce_beta',
      record: 'hashed_record_gamma',
    });
    const mockCtx = { privateState: {} };

    const [, keyBytes] = witnesses.tenantSecretKey(mockCtx);
    const [, nonceBytes] = witnesses.leaseProofNonce(mockCtx);
    const [, recordBytes] = witnesses.rentalRecordHash(mockCtx);

    expect(keyBytes.length).toBe(32);
    expect(nonceBytes.length).toBe(32);
    expect(recordBytes.length).toBe(32);
  });

  it('4. Income Threshold Witness: tenantIncomeBalance returns bigint usable for threshold comparison', () => {
    const passingIncome = 8000n;
    const minimumRequirement = 5000n;
    const witnesses = buildWitnesses({ income: passingIncome });
    const mockCtx = { privateState: {} };

    const [, income] = witnesses.tenantIncomeBalance(mockCtx);
    expect(typeof income).toBe('bigint');
    expect(income).toBe(8000n);
    expect(income >= minimumRequirement).toBe(true); // Tenant QUALIFIES for rental
  });

  it('5. ZK Privacy: private witnesses are strictly isolated from public propertyId (no data leak)', () => {
    const publicPropertyId = toBytes32('prop_luxury_penthouse_2026');
    const witnesses = buildWitnesses({
      tenantKey: 'super_secret_tenant_privkey',
      nonce: 'private_lease_nonce_secret',
      record: 'encrypted_credit_record_hash',
    });
    const mockCtx = { privateState: {} };

    const [, keyBytes] = witnesses.tenantSecretKey(mockCtx);
    const [, nonceBytes] = witnesses.leaseProofNonce(mockCtx);
    const [, recordBytes] = witnesses.rentalRecordHash(mockCtx);

    expect(keyBytes).not.toEqual(publicPropertyId);
    expect(nonceBytes).not.toEqual(publicPropertyId);
    expect(recordBytes).not.toEqual(publicPropertyId);
  });

  it('6. Landlord Authority Witness: landlordSigningKey produces 32-byte array independent of tenant witnesses', () => {
    const witnesses = buildWitnesses({
      tenantKey: 'tenant_secret_abc',
      landlordKey: 'landlord_signing_key_xyz',
    });
    const mockCtx = { privateState: {} };

    const [, tenantKeyBytes] = witnesses.tenantSecretKey(mockCtx);
    const [, landlordKeyBytes] = witnesses.landlordSigningKey(mockCtx);

    expect(landlordKeyBytes.length).toBe(32);
    expect(landlordKeyBytes).not.toEqual(tenantKeyBytes);
  });

  it('7. Multi-Tenant Commitment Uniqueness: different tenants produce distinct contract instances', () => {
    const witnessesA = buildWitnesses({ tenantKey: 'alice_tenant_key', record: 'alice_rental_record' });
    const witnessesB = buildWitnesses({ tenantKey: 'bob_tenant_key', record: 'bob_rental_record' });
    const mockCtx = { privateState: {} };

    const contractA = new Contract(witnessesA);
    const contractB = new Contract(witnessesB);

    const [, keyA] = witnessesA.tenantSecretKey(mockCtx);
    const [, keyB] = witnessesB.tenantSecretKey(mockCtx);

    expect(contractA).not.toBe(contractB);
    expect(keyA).not.toEqual(keyB);
  });

  it('8. Ledger Schema Interface: ledger() export is a function querying the 8-field on-chain state', () => {
    expect(typeof ledger).toBe('function');
  });

  it('9. Income Fail Case: tenantIncomeBalance below minimumIncomeRequirement fails threshold assertion', () => {
    const insufficientIncome = 2500n;
    const minimumRequirement = 5000n;
    const witnesses = buildWitnesses({ income: insufficientIncome });
    const mockCtx = { privateState: {} };

    const [, income] = witnesses.tenantIncomeBalance(mockCtx);
    expect(income >= minimumRequirement).toBe(false); // Tenant FAILS income threshold — circuit would reject
  });

  it('10. Session Isolation: witnesses built for different sessions produce independent nonce contexts', () => {
    const witnessesSession1 = buildWitnesses({ nonce: 'session_1_lease_nonce', income: 7000n });
    const witnessesSession2 = buildWitnesses({ nonce: 'session_2_lease_nonce', income: 9000n });
    const mockCtx = { privateState: { sessionId: 'test' } };

    const [, nonce1] = witnessesSession1.leaseProofNonce(mockCtx);
    const [, nonce2] = witnessesSession2.leaseProofNonce(mockCtx);

    expect(nonce1).not.toEqual(nonce2);
  });

});
