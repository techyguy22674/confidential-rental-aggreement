"use client";
import { useState } from "react";
import { getClient } from "../../lib/contract";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default function ApplyPage() {
  const [propertyId, setPropertyId] = useState("prop_luxury_penthouse_2026");
  const [tenantKey, setTenantKey] = useState("");
  const [rentalRecord, setRentalRecord] = useState("");
  const [tenantIncome, setTenantIncome] = useState(7500);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [claimedCommitment, setClaimedCommitment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);

  const MINIMUM_INCOME = 5000;
  const addLog = (msg: string, type = "info") => setLogs(l => [...l, { msg, type }]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null); setLogs([]);
    try {
      addLog("> [WALLET] Connecting to Midnight Lace Wallet...", "info");
      const client = getClient();
      client.setTenantKey(tenantKey || "anonymous_tenant_key_default");
      client.setRentalRecord(rentalRecord || "default_rental_record");
      client.setTenantIncome(tenantIncome);
      addLog(`> [ZK WITNESS] tenantSecretKey — private identity key, never leaves device`, "info");
      addLog(`> [ZK WITNESS] leaseProofNonce — entropy binding generated locally`, "info");
      addLog(`> [ZK WITNESS] rentalRecordHash — SHA-256 of credit/background record`, "info");
      addLog(`> [ZK WITNESS] tenantIncomeBalance — $${tenantIncome.toLocaleString()}/mo checked privately vs. $${MINIMUM_INCOME.toLocaleString()} threshold`, "info");
      addLog(`> [ZK THRESHOLD] Verifying tenantIncomeBalance >= minimumIncomeRequirement (private ZK assertion)...`, "info");
      if (tenantIncome < MINIMUM_INCOME) {
        addLog(`> [REJECTED] $${tenantIncome.toLocaleString()} < $${MINIMUM_INCOME.toLocaleString()} minimum — circuit would reject proof`, "error");
        setError(`Insufficient income: $${tenantIncome.toLocaleString()} is below the $${MINIMUM_INCOME.toLocaleString()} required rental threshold.`);
        return;
      }
      addLog("> [CIRCUIT] Executing signAgreement(Bytes<32>) on-chain circuit...", "info");
      const res = await client.signAgreement(propertyId);
      setResult(res);
      addLog(`> [SUCCESS] Agreement signed! TxHash: ${res.txHash}`, "success");
      addLog(`> [COMMITMENT] ZK Commitment: ${res.commitmentHex}`, "success");
      addLog(`> [PRIVACY] Income amount, identity, credit report — NEVER disclosed on-chain`, "success");
      addLog(`> [FEE] Transaction fee: ${res.txFee} ${res.txFeeAsset}`, "info");
    } catch (err: any) {
      const msg = err?.message || "Lease signing failed.";
      setError(msg);
      addLog(`> [ERROR] ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true); setVerifyResult(null);
    try {
      addLog("> [CIRCUIT] Executing verifyAgreement(Bytes<32>) on-chain...", "info");
      const res = await getClient().verifyAgreement(claimedCommitment);
      setVerifyResult(res);
      addLog(res.matches
        ? "> [VERIFIED] Commitment matches on-chain record — lease is VALID"
        : "> [MISMATCH] Commitment does NOT match — lease may be invalid or terminated",
        res.matches ? "success" : "error");
    } catch (err: any) {
      addLog(`> [ERROR] ${err?.message}`, "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-rose">ZK Lease Signing</span>
            <span className="badge badge-purple">Midnight Preview</span>
            <span className="badge badge-green">Income Qualification</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "1.75rem" }}>Apply & Sign Lease Anonymously</h1>
          <p className="section-desc">
            Your identity, income amount, and credit score stay fully private. A ZK proof verifies your monthly income meets the landlord's requirement — only a cryptographic commitment hash is disclosed on-chain.
          </p>
        </div>

        {/* ── ZK Architecture Info ── */}
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderLeft: "3px solid #e11d48" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e11d48", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            ZK Circuit Architecture — signAgreement(Bytes&lt;32&gt;)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "tenantSecretKey()", desc: "Private identity witness", color: "#ef4444" },
              { label: "leaseProofNonce()", desc: "Entropy/replay binding", color: "#f59e0b" },
              { label: "rentalRecordHash()", desc: "Hashed credit/background", color: "#06b6d4" },
              { label: "tenantIncomeBalance()", desc: "Private income ≥ threshold", color: "#10b981" },
            ].map(w => (
              <div key={w.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "0.75rem", border: `1px solid ${w.color}33` }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: w.color, marginBottom: "0.25rem" }}>{w.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sign Form ── */}
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
          <form onSubmit={handleSign} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Property Identifier (Bytes&lt;32&gt;) *
              </label>
              <input type="text" id="propertyId" value={propertyId} onChange={e => setPropertyId(e.target.value)}
                placeholder="prop_luxury_penthouse_2026" required />
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>Must match the active property ID registered on-chain by the landlord</p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Tenant Secret Key — Private Witness
              </label>
              <input type="password" id="tenantKey" value={tenantKey} onChange={e => setTenantKey(e.target.value)}
                placeholder="Your private tenant key (never leaves your device)" autoComplete="off" />
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                Used locally to generate <code>tenantSecretKey()</code> ZK witness — never transmitted
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Monthly Income — Private Threshold Witness
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input type="range" id="tenantIncome" min={0} max={20000} step={250} value={tenantIncome}
                  onChange={e => setTenantIncome(Number(e.target.value))}
                  style={{ flex: 1, accentColor: tenantIncome >= MINIMUM_INCOME ? "#10b981" : "#ef4444" }} />
                <span style={{
                  fontFamily: "monospace", fontWeight: 700, fontSize: "1rem",
                  color: tenantIncome >= MINIMUM_INCOME ? "#10b981" : "#ef4444", minWidth: "6rem"
                }}>${tenantIncome.toLocaleString()}/mo</span>
                <span style={{
                  fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "99px",
                  background: tenantIncome >= MINIMUM_INCOME ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  color: tenantIncome >= MINIMUM_INCOME ? "#10b981" : "#ef4444"
                }}>
                  {tenantIncome >= MINIMUM_INCOME ? "✅ QUALIFIES" : "❌ INSUFFICIENT"}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                Compared privately via <code>tenantIncomeBalance()</code> vs. on-chain <code>minimumIncomeRequirement</code> (currently ${MINIMUM_INCOME.toLocaleString()}) — income never disclosed
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.5rem" }}>
                Credit & Background Record Payload
              </label>
              <textarea id="rentalRecord" value={rentalRecord} onChange={e => setRentalRecord(e.target.value)}
                placeholder="Paste background check details (hashed locally via rentalRecordHash() before ZK proof)"
                rows={3} style={{ resize: "vertical" }} />
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                Content is hashed locally — only the hash enters the <code>rentalRecordHash()</code> ZK proof
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button type="submit" className="btn-primary" disabled={loading} id="signBtn">
                {loading ? <><span className="spinner" /> Generating ZK Proof...</> : "Sign Lease Agreement (ZK Proof)"}
              </button>
              <Link href="/" className="btn-secondary">Back to Dashboard</Link>
            </div>
          </form>
        </div>

        {/* ── Activity Log ── */}
        {logs.length > 0 && (
          <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Log</div>
            <div className="log-box">
              {logs.map((l, i) => <div key={i} className={`log-${l.type}`}>{l.msg}</div>)}
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card fade-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <p style={{ color: "#fca5a5", fontWeight: 600 }}>Error</p>
            <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "0.9rem" }}>{error}</p>
          </div>
        )}

        {result && (
          <div className="glass-card fade-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.05)" }}>
            <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem" }}>✅ Lease Signed & Confirmed On-Chain!</p>
            {[
              { label: "Circuit", value: "signAgreement(Bytes<32>)" },
              { label: "ZK Commitment", value: result.commitmentHex },
              { label: "On-Chain TxHash", value: result.txHash },
              { label: "Income Threshold", value: result.incomeRequirementMet ? "✅ Satisfied (private)" : "❌ Not Satisfied" },
              { label: "Signed By", value: result.signedBy },
              { label: "Tx Fee", value: `${result.txFee} ${result.txFeeAsset}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 140 }}>{label}:</span>
                <span style={{ fontSize: "0.8rem", color: "#f1f5f9", fontFamily: "monospace", wordBreak: "break-all" }}>{value as string}</span>
              </div>
            ))}
            <p style={{ fontSize: "0.8rem", color: "#10b981", marginTop: "0.75rem", fontWeight: 600 }}>Status: CONFIRMED (Midnight Preview)</p>
          </div>
        )}

        {/* ── Verify Agreement ── */}
        <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "3px solid #06b6d4" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#06b6d4", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Verify Agreement — verifyAgreement(Bytes&lt;32&gt;)
          </div>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Publicly verify whether a claimed commitment matches the registered lease agreement on-chain.
          </p>
          <form onSubmit={handleVerify} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input type="text" id="claimedCommitment" value={claimedCommitment}
              onChange={e => setClaimedCommitment(e.target.value)}
              placeholder="0x... claimed lease commitment hash"
              style={{ flex: 1, minWidth: "200px" }} />
            <button type="submit" className="btn-secondary" disabled={verifyLoading} id="verifyBtn" style={{ whiteSpace: "nowrap" }}>
              {verifyLoading ? <><span className="spinner" /> Verifying...</> : "Verify On-Chain"}
            </button>
          </form>
          {verifyResult && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "8px",
              background: verifyResult.matches ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${verifyResult.matches ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <p style={{ color: verifyResult.matches ? "#6ee7b7" : "#fca5a5", fontWeight: 700, marginBottom: "0.5rem" }}>
                {verifyResult.matches ? "✅ VALID — Lease Agreement Verified On-Chain" : "❌ INVALID — Commitment Mismatch"}
              </p>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>TxHash: <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{verifyResult.txHash}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
