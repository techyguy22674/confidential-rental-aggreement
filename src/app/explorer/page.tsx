import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Midnight Explorer | Confidential Rental Agreement',
  description: 'View live on-chain state of the Confidential Rental Agreement contract on Midnight Preview.',
};

const CONTRACT_ADDRESS = "0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0";

export default function ExplorerPage() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span className="badge badge-cyan">Midnight Explorer</span>
            <span className="badge badge-green">Preview Network</span>
          </div>
          <h1 className="section-title">Contract Explorer</h1>
          <p className="section-desc">Live on-chain state of the Confidential Rental Agreement ZK contract on Midnight Preview.</p>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Contract Address</div>
          <code style={{ fontSize: "0.82rem", color: "#06b6d4", wordBreak: "break-all" }}>{CONTRACT_ADDRESS}</code>
          <div style={{ marginTop: "1rem" }}>
            <a href={`https://preview.midnightexplorer.com/contracts/${CONTRACT_ADDRESS}`}
              target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex" }}>
              🔍 View on Midnight Explorer →
            </a>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Public Ledger Fields (8)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { field: "agreementCount: Counter", desc: "Total lease agreements signed", color: "#e11d48" },
              { field: "revokedCount: Counter", desc: "Total revoked/terminated agreements", color: "#ef4444" },
              { field: "activeSession: Counter", desc: "Epoch nonce (replay protection)", color: "#06b6d4" },
              { field: "propertyId: Bytes<32>", desc: "Active rental property identifier", color: "#10b981" },
              { field: "landlordCommitment: Bytes<32>", desc: "Landlord public authority anchor", color: "#f59e0b" },
              { field: "lastAgreementCommitment: Bytes<32>", desc: "Most recent tenant ZK lease hash", color: "#8b5cf6" },
              { field: "lastRevokedCommitment: Bytes<32>", desc: "Most recent revoked commitment", color: "#ef4444" },
              { field: "minimumIncomeRequirement: Uint<32>", desc: "Minimum required monthly income", color: "#06b6d4" },
            ].map(f => (
              <div key={f.field} style={{ display: "flex", gap: "1rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <code style={{ fontSize: "0.78rem", color: f.color, minWidth: "260px" }}>{f.field}</code>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/" className="btn-secondary">Back to Dashboard</Link>
          <Link href="/apply" className="btn-primary">Apply & Sign Lease →</Link>
        </div>
      </div>
    </>
  );
}
