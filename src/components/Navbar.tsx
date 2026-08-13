"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getClient } from "../lib/contract";

export default function Navbar() {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getClient();
    const status = client.getWalletStatus();
    if (status.connected && status.address) {
      setConnected(true);
      setAddress(status.address);
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getClient();
      const res = await client.connectWallet();
      setConnected(true);
      setAddress(res.walletAddress);
    } catch (err: any) {
      setError(err?.message || "Failed to connect wallet.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    const client = getClient();
    client.disconnectWallet();
    setConnected(false);
    setAddress(null);
  };

  const formatAddr = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <span>🏠</span> CRA
      </Link>

      <div className="nav-links">
        <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
          Dashboard
        </Link>
        <Link href="/apply" className={`nav-link ${pathname === "/apply" ? "active" : ""}`}>
          Apply & Sign
        </Link>
        <Link href="/admin" className={`nav-link ${pathname === "/admin" ? "active" : ""}`}>
          Landlord Console
        </Link>
        <Link href="/explorer" className={`nav-link ${pathname === "/explorer" ? "active" : ""}`}>
          Explorer
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {error && (
          <span style={{ fontSize: "0.72rem", color: "#fca5a5", background: "rgba(239,68,68,0.15)", padding: "0.25rem 0.6rem", borderRadius: "6px" }}>
            {error}
          </span>
        )}

        {connected && address ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              padding: "0.35rem 0.75rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600, color: "#6ee7b7"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              {formatAddr(address)}
            </div>
            <button
              onClick={handleDisconnect}
              title="Disconnect Wallet"
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                color: "#94a3b8", padding: "0.35rem 0.65rem", borderRadius: "8px",
                fontSize: "0.75rem", cursor: "pointer", fontWeight: 600
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Connecting...
              </>
            ) : (
              <>
                <span>👛</span> Connect Wallet
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
