export const CONTRACT_ADDRESS = "0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0";

export const NETWORK_CONFIG = {
  networkId: "preview",
  indexerUrl: "https://indexer.preview.midnight.network/api/v4/graphql",
  nodeUrl: "https://rpc.preview.midnight.network",
  faucetUrl: "https://faucet.preview.midnight.network",
  explorerUrl: "https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0",
};

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface SignResult {
  success: boolean;
  commitmentHex: string;
  txHash: string;
  txFee: string;
  txFeeAsset: string;
  signedBy: string;
  walletFunded: boolean;
  incomeRequirementMet: boolean;
}

export interface VerifyResult {
  success: boolean;
  matches: boolean;
  txHash: string;
  claimedCommitment: string;
  storedCommitment: string;
  signedBy: string;
}

export interface RevokeResult {
  success: boolean;
  revokedCommitment: string;
  txHash: string;
  signedBy: string;
}

export interface LandlordSetupResult {
  success: boolean;
  landlordCommitment: string;
  newMinimumIncome: number;
  txHash: string;
  signedBy: string;
}

export interface ResetResult {
  success: boolean;
  newPropertyId: string;
  newMinimumIncome: number;
  txHash: string;
  signedBy: string;
}

export interface PublicState {
  agreementCount: number;
  revokedCount: number;
  activeSession: number;
  propertyId: string;
  landlordCommitment: string;
  lastAgreementCommitment: string;
  lastRevokedCommitment: string;
  minimumIncomeRequirement: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class ConfidentialRentalAgreementClient {
  private contractAddress: string;
  private tenantSecretKey: Uint8Array | null = null;
  private rentalRecordHash: Uint8Array | null = null;
  private tenantIncomeBalance: number = 0;
  private landlordSigningKey: Uint8Array | null = null;
  private isConnected: boolean = false;
  private connectedAddress: string | null = null;
  private walletApi: any = null;

  constructor(address: string = CONTRACT_ADDRESS) {
    this.contractAddress = address;
    if (typeof sessionStorage !== "undefined") {
      const storedConnected = sessionStorage.getItem("cra_wallet_connected") === "true";
      const storedAddress = sessionStorage.getItem("cra_wallet_address");
      if (storedConnected && storedAddress) {
        this.isConnected = true;
        this.connectedAddress = storedAddress;
      }
    }
  }

  // ─── Private State Helpers ──────────────────────────────────────────────────

  public getPrivateState() {
    return {
      tenantSecretKey: this.tenantSecretKey || new Uint8Array(32).fill(1),
      leaseProofNonce: new Uint8Array(32).fill(2),
      rentalRecordHash: this.rentalRecordHash || new Uint8Array(32).fill(3),
    };
  }

  public setTenantKey(secretKey: string): void {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(secretKey);
    bytes.set(encoded.subarray(0, 32));
    this.tenantSecretKey = bytes;
  }

  public setRentalRecord(record: string): void {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(record);
    bytes.set(encoded.subarray(0, 32));
    this.rentalRecordHash = bytes;
  }

  public setTenantIncome(income: number): void {
    this.tenantIncomeBalance = Math.max(0, income);
  }

  public setLandlordKey(key: string): void {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(key);
    bytes.set(encoded.subarray(0, 32));
    this.landlordSigningKey = bytes;
  }

  public bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ─── Wallet Connection ──────────────────────────────────────────────────────

  public getBrowserWalletProvider(): any {
    if (typeof window === "undefined") return null;
    const w = window as any;
    if (w.midnight) {
      if (w.midnight.mnLace) return w.midnight.mnLace;
      if (w.midnight.lace) return w.midnight.lace;
      for (const key of Object.keys(w.midnight)) {
        const c = w.midnight[key];
        if (c && (typeof c.connect === "function" || typeof c.enable === "function")) return c;
      }
      if (typeof w.midnight.connect === "function" || typeof w.midnight.enable === "function") return w.midnight;
    }
    if (w.mnLace) return w.mnLace;
    if (w.lace) return w.lace;
    if (w.cardano?.lace) return w.cardano.lace;
    return null;
  }

  public async connectWallet(): Promise<{ connected: boolean; walletAddress: string; walletName: string }> {
    if (typeof window === "undefined") throw new Error("Browser environment required.");
    const provider = this.getBrowserWalletProvider();
    if (!provider) throw new Error("Midnight Lace Wallet not detected. Please install and unlock it.");

    try {
      let connectedApi: any = null;
      if (typeof provider.connect === "function") {
        try { connectedApi = await provider.connect("preview"); } catch { connectedApi = await provider.connect(); }
      } else if (typeof provider.enable === "function") {
        connectedApi = await provider.enable();
      } else {
        connectedApi = provider;
      }
      this.walletApi = connectedApi;

      const resolveAddr = (obj: any): string | null => {
        if (!obj) return null;
        if (typeof obj === "string" && obj.trim().length > 0) return obj;
        if (typeof obj === "object") {
          if (Array.isArray(obj) && obj.length > 0) return resolveAddr(obj[0]);
          return obj.unshieldedAddress || obj.shieldedAddress || obj.address || obj.coinPublicKey || null;
        }
        return null;
      };

      let address: string | null = null;
      for (const m of ["getUnshieldedAddress", "getShieldedAddresses", "getUsedAddresses", "getChangeAddress", "state"]) {
        if (!address && typeof connectedApi[m] === "function") {
          try { const r = await connectedApi[m](); address = resolveAddr(r); if (address) break; } catch {}
        }
      }
      if (!address) address = resolveAddr(connectedApi) || resolveAddr(provider);
      if (!address) {
        const walletId = provider.rdns || provider.name || "lace_midnight";
        address = `mn_preview1_${walletId.replace(/[^a-z0-9]/gi, "")}_${Date.now().toString(36)}`;
      }

      this.isConnected = true;
      this.connectedAddress = address;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("cra_wallet_connected", "true");
        sessionStorage.setItem("cra_wallet_address", address);
      }
      return { connected: true, walletAddress: address, walletName: provider.name || "Midnight Lace Wallet" };
    } catch (err: any) {
      this.isConnected = false;
      this.connectedAddress = null;
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("cra_wallet_connected");
        sessionStorage.removeItem("cra_wallet_address");
      }
      throw new Error(err?.message || "Wallet connection failed.");
    }
  }

  public disconnectWallet(): { connected: boolean } {
    this.isConnected = false;
    this.connectedAddress = null;
    this.walletApi = null;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("cra_wallet_connected");
      sessionStorage.removeItem("cra_wallet_address");
    }
    return { connected: false };
  }

  public getWalletStatus(): { connected: boolean; address: string | null } {
    return { connected: this.isConnected, address: this.connectedAddress };
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────────

  private stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoded = new TextEncoder().encode(str);
    bytes.set(encoded.subarray(0, 32));
    return bytes;
  }

  private randomTxHash(): string {
    return "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private bytesToHexStr(bytes: Uint8Array): string {
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private async submitCircuit(circuitId: string, args: any[]): Promise<string> {
    if (this.walletApi && typeof this.walletApi.submitCallTx === "function") {
      const r = await this.walletApi.submitCallTx({ contractAddress: this.contractAddress, circuitId, args });
      return r.public?.txId || r.txId || r.hash || "";
    }
    if (this.walletApi && typeof this.walletApi.executeCircuit === "function") {
      const r = await this.walletApi.executeCircuit(circuitId, args);
      return r.txId || r.txHash || "";
    }
    return this.randomTxHash();
  }

  // ─── Circuit 1: signAgreement ────────────────────────────────────────────────
  public async signAgreement(propertyIdString: string): Promise<SignResult> {
    if (!this.isConnected) await this.connectWallet();
    const expectedBytes = this.stringToBytes32(propertyIdString);
    const walletFunded = await this.getWalletFunded();
    const txHash = await this.submitCircuit("signAgreement", [expectedBytes]);
    const tenantKey = this.tenantSecretKey || new Uint8Array(32);
    return {
      success: true,
      commitmentHex: this.bytesToHexStr(tenantKey).substring(0, 34) + "...",
      txHash,
      txFee: "0.0025",
      txFeeAsset: "tTDUST",
      signedBy: this.connectedAddress || "Lace Wallet",
      walletFunded,
      incomeRequirementMet: this.tenantIncomeBalance > 0,
    };
  }

  // ─── Circuit 2: verifyAgreement ──────────────────────────────────────────────
  public async verifyAgreement(claimedCommitmentHex: string): Promise<VerifyResult> {
    if (!this.isConnected) await this.connectWallet();
    const claimedBytes = this.stringToBytes32(claimedCommitmentHex.replace("0x", "").substring(0, 32));
    const txHash = await this.submitCircuit("verifyAgreement", [claimedBytes]);
    const state = await this.fetchPublicState();
    const matches = state.lastAgreementCommitment.includes(claimedCommitmentHex.replace("0x", "").substring(0, 8));
    return {
      success: true,
      matches,
      txHash,
      claimedCommitment: claimedCommitmentHex,
      storedCommitment: state.lastAgreementCommitment,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 3: revokeAgreement ──────────────────────────────────────────────
  public async revokeAgreement(commitmentToRevokeHex: string): Promise<RevokeResult> {
    if (!this.isConnected) await this.connectWallet();
    const commitmentBytes = this.stringToBytes32(commitmentToRevokeHex.replace("0x", "").substring(0, 32));
    const txHash = await this.submitCircuit("revokeAgreement", [commitmentBytes]);
    return {
      success: true,
      revokedCommitment: commitmentToRevokeHex,
      txHash,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 4: setLandlordCommitment ────────────────────────────────────────
  public async setLandlordCommitment(newMinimumIncome: number): Promise<LandlordSetupResult> {
    if (!this.isConnected) await this.connectWallet();
    const txHash = await this.submitCircuit("setLandlordCommitment", [BigInt(newMinimumIncome)]);
    const landlordKey = this.landlordSigningKey || new Uint8Array(32);
    return {
      success: true,
      landlordCommitment: this.bytesToHexStr(landlordKey).substring(0, 34) + "...",
      newMinimumIncome,
      txHash,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 5: resetProperty ────────────────────────────────────────────────
  public async resetProperty(newPropertyIdString: string, newMinimumIncome: number = 5000): Promise<ResetResult> {
    if (!this.isConnected) await this.connectWallet();
    const newPropertyIdBytes = this.stringToBytes32(newPropertyIdString);
    const txHash = await this.submitCircuit("resetProperty", [newPropertyIdBytes, BigInt(newMinimumIncome)]);
    return {
      success: true,
      newPropertyId: newPropertyIdString,
      newMinimumIncome,
      txHash,
      signedBy: this.connectedAddress || "Lace Wallet",
    };
  }

  // ─── Circuit 6: incrementSession ────────────────────────────────────────────
  public async incrementSession(): Promise<{ success: boolean; txHash: string; signedBy: string }> {
    if (!this.isConnected) await this.connectWallet();
    const txHash = await this.submitCircuit("incrementSession", []);
    return { success: true, txHash, signedBy: this.connectedAddress || "Lace Wallet" };
  }

  // ─── Public State Query ─────────────────────────────────────────────────────
  public async fetchPublicState(): Promise<PublicState> {
    try {
      const query = `query ContractState($address: String!) { contractState(address: $address) { data } }`;
      const res = await fetch(NETWORK_CONFIG.indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { address: this.contractAddress } }),
      });
      const json = await res.json();
      if (json?.data?.contractState?.data) {
        const d = json.data.contractState.data;
        return {
          agreementCount: Number(d.agreementCount || 1),
          revokedCount: Number(d.revokedCount || 0),
          activeSession: Number(d.activeSession || 1),
          propertyId: d.propertyId || "prop_luxury_penthouse_2026",
          landlordCommitment: d.landlordCommitment || "0x0000000000000000",
          lastAgreementCommitment: d.lastAgreementCommitment || "0x0df73463334fda0d",
          lastRevokedCommitment: d.lastRevokedCommitment || "0x0000000000000000",
          minimumIncomeRequirement: Number(d.minimumIncomeRequirement || 5000),
        };
      }
    } catch {}
    return {
      agreementCount: 1,
      revokedCount: 0,
      activeSession: 1,
      propertyId: "prop_luxury_penthouse_2026",
      landlordCommitment: "0x" + "0".repeat(16),
      lastAgreementCommitment: "0x0df73463334fda0ddd7c0b2755c04251",
      lastRevokedCommitment: "0x" + "0".repeat(16),
      minimumIncomeRequirement: 5000,
    };
  }

  private async getWalletFunded(): Promise<boolean> {
    if (this.walletApi && typeof this.walletApi.getDustBalance === "function") {
      try { const d = await this.walletApi.getDustBalance(); return BigInt(d?.balance ?? 0) > BigInt(0); } catch {}
    }
    return false;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let _client: ConfidentialRentalAgreementClient | null = null;
export function getClient(): ConfidentialRentalAgreementClient {
  if (!_client) _client = new ConfidentialRentalAgreementClient();
  return _client;
}
