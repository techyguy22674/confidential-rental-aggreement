import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type CandidatePrivateState = {
  tenantSecretKey: Uint8Array;
  leaseProofNonce: Uint8Array;
  rentalRecordHash: Uint8Array;
};

export type Ledger = {
  agreementCount: bigint;
  propertyId: Uint8Array;
  lastAgreementCommitment: Uint8Array;
  activeSession: bigint;
};

export type Witnesses<PS> = {
  tenantSecretKey: __compactRuntime.Witness<PS, [PS, Uint8Array]>;
  leaseProofNonce: __compactRuntime.Witness<PS, [PS, Uint8Array]>;
  rentalRecordHash: __compactRuntime.Witness<PS, [PS, Uint8Array]>;
};

export type Circuits<PS> = {
  signAgreement: (context: __compactRuntime.CircuitContext<PS>, expectedPropertyId: Uint8Array) => __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProperty: (context: __compactRuntime.CircuitContext<PS>, newPropertyId: Uint8Array) => __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession: (context: __compactRuntime.CircuitContext<PS>) => __compactRuntime.CircuitResults<PS, void>;
};

export declare class Contract<PS> implements __compactRuntime.Contract<PS, Ledger> {
  constructor(witnesses: Witnesses<PS>);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResults<PS, Ledger>;
  circuits: Circuits<PS>;
}

export declare const ledger: __compactRuntime.ContractQuery<Ledger>;
