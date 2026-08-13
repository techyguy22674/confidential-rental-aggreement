import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  tenantSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  leaseProofNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  rentalRecordHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  tenantIncomeBalance(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  landlordSigningKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  signAgreement(context: __compactRuntime.CircuitContext<PS>,
                expectedPropertyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyAgreement(context: __compactRuntime.CircuitContext<PS>,
                  claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeAgreement(context: __compactRuntime.CircuitContext<PS>,
                  commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setLandlordCommitment(context: __compactRuntime.CircuitContext<PS>,
                        newMinimumIncome_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProperty(context: __compactRuntime.CircuitContext<PS>,
                newPropertyId_0: Uint8Array,
                newMinimumIncome_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  signAgreement(context: __compactRuntime.CircuitContext<PS>,
                expectedPropertyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyAgreement(context: __compactRuntime.CircuitContext<PS>,
                  claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeAgreement(context: __compactRuntime.CircuitContext<PS>,
                  commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setLandlordCommitment(context: __compactRuntime.CircuitContext<PS>,
                        newMinimumIncome_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProperty(context: __compactRuntime.CircuitContext<PS>,
                newPropertyId_0: Uint8Array,
                newMinimumIncome_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  signAgreement(context: __compactRuntime.CircuitContext<PS>,
                expectedPropertyId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifyAgreement(context: __compactRuntime.CircuitContext<PS>,
                  claimedCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeAgreement(context: __compactRuntime.CircuitContext<PS>,
                  commitmentToRevoke_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  setLandlordCommitment(context: __compactRuntime.CircuitContext<PS>,
                        newMinimumIncome_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProperty(context: __compactRuntime.CircuitContext<PS>,
                newPropertyId_0: Uint8Array,
                newMinimumIncome_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly agreementCount: bigint;
  readonly revokedCount: bigint;
  readonly activeSession: bigint;
  readonly propertyId: Uint8Array;
  readonly landlordCommitment: Uint8Array;
  readonly lastAgreementCommitment: Uint8Array;
  readonly lastRevokedCommitment: Uint8Array;
  readonly minimumIncomeRequirement: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
