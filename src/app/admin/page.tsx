"use client";
import { useState } from "react";
import { getClient } from "../../lib/contract";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default function AdminPage() {
  const [propertyId, setPropertyId] = useState("prop_penthouse_suite_2027");
  const [resetMinIncome, setResetMinIncome] = useState(6000);
  const [loadingReset, setLoadingReset] = useState(false);

  const [landlordKey, setLandlordKey] = useState("");
  const [landlordMinIncome, setLandlordMinIncome] = useState(5000);
  const [loadingLandlord, setLoadingLandlord] = useState(false);

  const [revokeCommitment, setRevokeCommitment] = useState("");
  const [loadingRevoke, setLoadingRevoke] = useState(false);

  const [loadingSession, setLoadingSession] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const addLog = (msg: string, type = "info") => setLogs(l => [...l, { msg, type }]);
  const isLoading = loadingReset || loadingLandlord || loadingRevoke || loadingSession;

  const handleSetLandlord = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingLandlord(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] landlordSigningKey — derived from private key, never disclosed", "info");
      addLog(`> [CIRCUIT] Executing setLandlordCommitment(Uint<32>) — minIncome=$${landlordMinIncome.toLocaleString()}...`, "info");
      const client = getClient();
      client.setLandlordKey(landlordKey || "landlord_default_signing_key");
      const res = await client.setLandlordCommitment(landlordMinIncome);
      setResult({ ...res, circuit: "setLandlordCommitment(Uint<32>)" });
      addLog(`> [SUCCESS] Landlord commitment anchored on-chain!`, "success");
      addLog(`> [COMMITMENT] ${res.landlordCommitment}`, "success");
      addLog(`> [THRESHOLD] minimumIncomeRequirement set to $${res.newMinimumIncome.toLocaleString()}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingLandlord(false); }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingRevoke(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [ZK WITNESS] landlordSigningKey — authorization proof generated locally", "info");
      addLog(`> [CIRCUIT] Executing revokeAgreement(Bytes<32>) — commitment: ${revokeCommitment.substring(0, 20)}...`, "info");
      const res = await getClient().revokeAgreement(revokeCommitment);
      setResult({ ...res, circuit: "revokeAgreement(Bytes<32>)" });
      addLog(`> [SUCCESS] Lease commitment revoked on-chain!`, "success");
      addLog(`> [REVOKED] ${res.revokedCommitment}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingRevoke(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoadingReset(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog(`> [CIRCUIT] Executing resetProperty("${propertyId}", $${resetMinIncome.toLocaleString()})...`, "info");
      const res = await getClient().resetProperty(propertyId, resetMinIncome);
      setResult({ ...res, circuit: "resetProperty(Bytes<32>, Uint<32>)" });
      addLog(`> [SUCCESS] Property reset! New Property ID: ${res.newPropertyId}`, "success");
      addLog(`> [THRESHOLD] minimumIncomeRequirement updated to $${res.newMinimumIncome.toLocaleString()}`, "success");
      addLog(`> [TXHASH] ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingReset(false); }
  };

  const handleIncrement = async () => {
    setLoadingSession(true); setLogs([]); setResult(null);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      addLog("> [CIRCUIT] Executing incrementSession() — invalidating stale proofs...", "info");
      const res = await getClient().incrementSession();
      setResult({ ...res, circuit: "incrementSession()" });
      addLog(`> [SUCCESS] Session incremented! TxHash: ${res.txHash}`, "success");
    } catch (err: any) { addLog(`> [ERROR] ${err?.message || err}`, "error"); }
    finally { setLoadingSession(false); }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-amber">Landlord Console</span>
            <span className="badge badge-purple">Issuer Authority</span>
            <span className="badge badge-cyan">Midnight Preview</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "1.75rem" }}>Landlord Admin Console</h1>
          <p className="section-desc">
            All admin circuits require the landlord's private signing key as a ZK witness for authorization. The key is never transmitted — only the derived commitment is verified on-chain.
          </p>
        </div>

        {/* ── Circuit Reference ── */}
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Landlord Circuits</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {[
              { circuit: "setLandlordCommitment(Uint<32>)", desc: "Anchor landlord authority + set income threshold", color: "#8b5cf6" },
              { circuit: "revokeAgreement(Bytes<32>)", desc: "Revoke a fraudulent lease (ZK auth)", color: "#ef4444" },
              { circuit: "resetProperty(Bytes<32>, Uint<32>)", desc: "Reset property ID + income threshold", color: "#f59e0b" },
              { circuit: "incrementSession()", desc: "Bump session nonce (replay protection)", color: "#06b6d4" },
            ].map(c => (
              <div key={c.circuit} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.75rem", border: `1px solid ${c.color}33` }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: c.color, marginBottom: "0.25rem" }}>{c.circuit}</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panel 1: Set Landlord Commitment ── */}
        <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem", borderLeft: "3px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "1rem" }}>
            🔑 Panel 1 — setLandlordCommitment(Uint&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Anchors the landlord's public commitment on-chain and sets the minimum monthly income requirement for prospective tenants.
          </p>
          <form onSubmit={handleSetLandlord} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                Landlord Private Signing Key (ZK Witness — landlordSigningKey())
              </label>
              <input type="password" id="landlordKey" value={landlordKey} onChange={e => setLandlordKey(e.target.value)}
                placeholder="Landlord private signing key (never transmitted)" autoComplete="off" />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                Minimum Required Monthly Income: <span style={{ color: "#8b5cf6" }}>${landlordMinIncome.toLocaleString()}/mo</span>
              </label>
              <input type="range" min={0} max={20000} step={250} value={landlordMinIncome}
                onChange={e => setLandlordMinIncome(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8b5cf6" }} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} id="setLandlordBtn"
              style={{ background: "rgba(139,92,246,0.2)", borderColor: "rgba(139,92,246,0.5)" }}>
              {loadingLandlord ? <><span className="spinner" /> Anchoring...</> : "Set Landlord Commitment (ZK)"}
            </button>
          </form>
        </div>

        {/* ── Panel 2: Revoke Agreement ── */}
        <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem", borderLeft: "3px solid #ef4444" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem" }}>
            🚫 Panel 2 — revokeAgreement(Bytes&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Revoke or terminate a specific lease commitment. Requires landlord authority proof via <code>landlordSigningKey()</code> ZK witness. Stored in <code>lastRevokedCommitment</code>.
          </p>
          <form onSubmit={handleRevoke} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                Lease Commitment Hash to Revoke (Bytes&lt;32&gt;)
              </label>
              <input type="text" id="revokeCommitment" value={revokeCommitment}
                onChange={e => setRevokeCommitment(e.target.value)}
                placeholder="0x... lease commitment hash to revoke" required />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading || !revokeCommitment} id="revokeBtn"
              style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)" }}>
              {loadingRevoke ? <><span className="spinner" /> Revoking...</> : "Revoke Lease Agreement (ZK Auth)"}
            </button>
          </form>
        </div>

        {/* ── Panel 3: Reset Property ── */}
        <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b", marginBottom: "1rem" }}>
            🔄 Panel 3 — resetProperty(Bytes&lt;32&gt;, Uint&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Reset the active rental property ID and update the minimum monthly income requirement. Bumps session for clean epoch boundary.
          </p>
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                New Property ID (Bytes&lt;32&gt;)
              </label>
              <input type="text" id="newPropertyId" value={propertyId} onChange={e => setPropertyId(e.target.value)}
                placeholder="prop_penthouse_suite_2027" />
            </div>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>
                New Minimum Required Income: <span style={{ color: "#f59e0b" }}>${resetMinIncome.toLocaleString()}/mo</span>
              </label>
              <input type="range" min={0} max={20000} step={250} value={resetMinIncome}
                onChange={e => setResetMinIncome(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f59e0b" }} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading} id="resetBtn"
              style={{ background: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.4)" }}>
              {loadingReset ? <><span className="spinner" /> Resetting...</> : "Reset Property & Threshold"}
            </button>
          </form>
        </div>

        {/* ── Panel 4: Increment Session ── */}
        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.25rem", borderLeft: "3px solid #06b6d4" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#06b6d4", marginBottom: "0.75rem" }}>
            🔒 Panel 4 — incrementSession()
          </div>
          <p style={{ fontSize: "0.83rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Bumps the <code>activeSession</code> nonce to invalidate stale proofs from previous epochs.
          </p>
          <button onClick={handleIncrement} className="btn-secondary" disabled={isLoading} id="sessionBtn">
            {loadingSession ? <><span className="spinner" /> Bumping Session...</> : "Increment Session Nonce"}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Log</div>
            <div className="log-box">
              {logs.map((l, i) => <div key={i} className={`log-${l.type}`}>{l.msg}</div>)}
            </div>
          </div>
        )}

        {result && (
          <div className="glass-card fade-in" style={{ padding: "1.5rem", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.05)" }}>
            <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem" }}>✅ Transaction Confirmed</p>
            {Object.entries(result).map(([k, v]) => v !== undefined && (
              <div key={k} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 150 }}>{k}:</span>
                <span style={{ fontSize: "0.8rem", color: "#f1f5f9", fontFamily: "monospace", wordBreak: "break-all" }}>{String(v)}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <Link href="/" className="btn-secondary">Back to Dashboard</Link>
              <Link href="/explorer" className="btn-secondary">View on Explorer</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
