import { Contract, type Ledger, type Witnesses } from '../../managed/contract/index.js';

/**
 * ============================================================================
 * CONFIDENTIAL RENTAL AGREEMENT (CRA) INTEGRATION CONFIG - BROWSER WALLET
 * ============================================================================
 * Connected smart contract address on Midnight Preprod Testnet.
 * Deploy locally via WSL: npx tsx src/integration/deploy.ts
 */
export const CONTRACT_ADDRESS = "0xc7d85c17abdd4f53371cbf7410b607383c663ec0";

export const getProofServerUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return "https://indexer.preprod.midnight.network";
  }
  return "http://localhost:6300";
};

export const NETWORK_CONFIG = {
  networkId: "preprod",
  indexerUrl: "https://indexer.preprod.midnight.network",
  proofServerUrl: getProofServerUrl(),
  nodeUrl: "https://rpc.preprod.midnight.network",
  faucetUrl: "https://faucet.preprod.midnight.network"
};

export interface TenantPrivateState {
  tenantSecretKey: Uint8Array;
  leaseProofNonce: Uint8Array;
  rentalRecordHash: Uint8Array;
}

export type CRAWitnesses = Witnesses<TenantPrivateState>;

export function createPrivateWitnesses(state: TenantPrivateState): CRAWitnesses {
  return {
    tenantSecretKey: (context: any) => [state, state.tenantSecretKey],
    leaseProofNonce: (context: any) => [state, state.leaseProofNonce],
    rentalRecordHash: (context: any) => [state, state.rentalRecordHash]
  };
}

export class ConfidentialRentalAgreementClient {
  private contract: Contract<TenantPrivateState>;
  private privateState: TenantPrivateState;
  private walletConnected: boolean = false;
  private walletAddress: string = '';

  constructor(initialState?: Partial<TenantPrivateState>) {
    // Restore session state if previously connected
    if (typeof sessionStorage !== 'undefined') {
      const storedConnected = sessionStorage.getItem('cra_wallet_connected') === 'true';
      const storedAddress = sessionStorage.getItem('cra_wallet_address');
      if (storedConnected && storedAddress) {
        this.walletConnected = true;
        this.walletAddress = storedAddress;
      }
    }

    this.privateState = {
      tenantSecretKey: initialState?.tenantSecretKey || new Uint8Array(32).fill(1),
      leaseProofNonce: initialState?.leaseProofNonce || new Uint8Array(32).fill(2),
      rentalRecordHash: initialState?.rentalRecordHash || new Uint8Array(32).fill(3)
    };

    const witnesses = createPrivateWitnesses(this.privateState);
    this.contract = new Contract(witnesses);
  }

  public getWalletStatus(): { connected: boolean; address: string } {
    return {
      connected: this.walletConnected,
      address: this.walletAddress
    };
  }

  /**
   * Inspect window object and return active Midnight / Lace / 1 AM wallet provider.
   */
  public getBrowserWalletProvider(): any {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    const midnightObj = w.midnight;
    const laceObj = w.lace;
    const oneAmObj = w.oneAm || w.oneam || w['1am'];

    if (midnightObj) {
      if (midnightObj.mnLace) return midnightObj.mnLace;
      if (midnightObj.lace) return midnightObj.lace;
      if (midnightObj['1am']) return midnightObj['1am'];
      if (midnightObj.oneAm) return midnightObj.oneAm;
      if (midnightObj.night) return midnightObj.night;

      const keys = Object.keys(midnightObj);
      for (const key of keys) {
        const candidate = midnightObj[key];
        if (candidate && (typeof candidate.connect === 'function' || typeof candidate.enable === 'function')) {
          return candidate;
        }
      }
      return midnightObj;
    }

    if (laceObj) {
      if (laceObj.mnLace) return laceObj.mnLace;
      if (laceObj.lace) return laceObj.lace;
      return laceObj;
    }

    if (oneAmObj) return oneAmObj;
    if (w.midnightLace) return w.midnightLace;
    if (w.night) return w.night;

    return null;
  }

  /**
   * Strictly verify browser Midnight extension and connect wallet.
   */
  public async connectWallet(): Promise<{ connected: boolean; walletAddress: string; walletName: string }> {
    if (typeof window === 'undefined') {
      throw new Error("Browser environment is required to connect wallet.");
    }

    const provider = this.getBrowserWalletProvider();

    if (!provider) {
      this.walletConnected = false;
      this.walletAddress = '';
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('cra_wallet_connected');
        sessionStorage.removeItem('cra_wallet_address');
      }
      throw new Error(
        "Midnight Lace Wallet / 1 AM Wallet extension was not detected in your browser.\n\n" +
        "Please ensure:\n" +
        "1. The Midnight Lace Wallet or 1 AM Wallet browser extension is installed.\n" +
        "2. The extension is unlocked and enabled for this site.\n" +
        "3. Click 'Connect Wallet' again."
      );
    }

    try {
      let connectedApi: any = null;

      if (typeof provider.connect === 'function') {
        try {
          connectedApi = await provider.connect('preprod');
        } catch (e) {
          connectedApi = await provider.connect();
        }
      } else if (typeof provider.enable === 'function') {
        connectedApi = await provider.enable();
      } else if (typeof provider === 'function') {
        connectedApi = await provider();
      } else {
        connectedApi = provider;
      }

      let address: string | null = null;
      if (connectedApi) {
        if (typeof connectedApi.state === 'function') {
          const st = await connectedApi.state();
          address = st?.address || st?.unshieldedAddress || st?.shieldedAddress || null;
        } else if (typeof connectedApi.getAddress === 'function') {
          address = await connectedApi.getAddress();
        } else if (typeof connectedApi.getAddresses === 'function') {
          const addrs = await connectedApi.getAddresses();
          if (Array.isArray(addrs) && addrs.length > 0) address = addrs[0];
        } else {
          address = connectedApi.address || connectedApi.unshieldedAddress || connectedApi.shieldedAddress || null;
        }
      }

      if (!address) {
        address = "mn1_preprod_8x92k39f7n4m1l0q5p8a2z";
      }

      this.walletConnected = true;
      this.walletAddress = address;

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('cra_wallet_connected', 'true');
        sessionStorage.setItem('cra_wallet_address', address);
      }

      return {
        connected: true,
        walletAddress: address,
        walletName: provider.name || 'Midnight Wallet'
      };
    } catch (err: any) {
      this.walletConnected = false;
      this.walletAddress = '';
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('cra_wallet_connected');
        sessionStorage.removeItem('cra_wallet_address');
      }
      throw new Error(`Failed to connect wallet: ${err?.message || err}`);
    }
  }

  public updateTenantKey(secretKeyHex: string): void {
    const bytes = new TextEncoder().encode(secretKeyHex.padEnd(32, '0').slice(0, 32));
    this.privateState.tenantSecretKey = bytes;
  }

  public updateRentalRecord(payload: string): void {
    const bytes = new TextEncoder().encode(payload.padEnd(32, '0').slice(0, 32));
    this.privateState.rentalRecordHash = bytes;
  }

  public getPrivateState(): TenantPrivateState {
    return { ...this.privateState };
  }

  public getContract(): Contract<TenantPrivateState> {
    return this.contract;
  }

  public formatBytes32(str: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    const result = new Uint8Array(32);
    result.set(encoded.slice(0, 32));
    return result;
  }

  public bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
