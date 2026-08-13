import Navbar from '../components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confidential Rental Agreement | ZK dApp on Midnight',
  description: 'Prove rental deposit capability and sign lease agreements without exposing personal income, credit scores, or identity. ZK smart contracts on Midnight Network.',
};

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-badge">
            <span>⚡</span> Midnight Preview Network — Live dApp
          </div>
          <h1>Confidential Rental Agreement</h1>
          <p>
            Prove tenant deposit capability, qualify for lease agreements, and sign contracts with <strong>zero-knowledge proofs</strong> — without revealing your income, credit score, bank statements, or identity on-chain.
          </p>
          <div className="hero-actions">
            <Link href="/apply" className="btn-primary">📝 Apply & Sign Lease (ZK Proof)</Link>
            <Link href="/admin" className="btn-secondary">⚙️ Landlord Console</Link>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            {[
              { value: '6', label: 'ZK Circuits', color: '#e11d48' },
              { value: '8', label: 'Ledger Fields', color: '#8b5cf6' },
              { value: '5', label: 'Private Witnesses', color: '#10b981' },
              { value: '10', label: 'Unit Tests Passing', color: '#f59e0b' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Circuit Architecture ── */}
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-rose">Compact v0.23</span>
                <span className="badge badge-purple">Midnight Preview</span>
                <span className="badge badge-green">6 Circuits</span>
              </div>
              <h2 className="section-title">ZK Contract Architecture (v2)</h2>
              <p className="section-desc">contracts/confidential_rental_agreement.compact — 8 ledger fields, 5 witnesses, 6 circuits</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {[
                { circuit: 'signAgreement(Bytes<32>)', witnesses: '4 witnesses', desc: 'ZK lease signing with private income threshold assertion', color: '#e11d48' },
                { circuit: 'verifyAgreement(Bytes<32>)', witnesses: '0 witnesses', desc: 'Public on-chain commitment verification', color: '#06b6d4' },
                { circuit: 'revokeAgreement(Bytes<32>)', witnesses: 'landlordSigningKey', desc: 'Landlord revokes or terminates a lease (ZK auth)', color: '#ef4444' },
                { circuit: 'setLandlordCommitment(Uint<32>)', witnesses: 'landlordSigningKey', desc: 'Anchor landlord authority + set income threshold', color: '#f59e0b' },
                { circuit: 'resetProperty(Bytes<32>, Uint<32>)', witnesses: '—', desc: 'New property epoch with updated minimum threshold', color: '#10b981' },
                { circuit: 'incrementSession()', witnesses: '—', desc: 'Bump session nonce for replay protection', color: '#64748b' },
              ].map(c => (
                <div key={c.circuit} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: '10px', padding: '1rem', border: `1px solid ${c.color}33` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: c.color, marginBottom: '0.35rem', fontWeight: 700 }}>{c.circuit}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem' }}>Witnesses: {c.witnesses}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Privacy Model ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>❌ Never Disclosed</div>
              {['tenantSecretKey() — Tenant private identity', 'tenantIncomeBalance() — Exact monthly income', 'rentalRecordHash() — Credit/background record', 'leaseProofNonce() — Entropy salt', 'landlordSigningKey() — Landlord key'].map(w => (
                <div key={w} style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>{w}</div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✅ Public Ledger</div>
              {['agreementCount — Total signed leases', 'revokedCount — Total revocations', 'propertyId — Active property', 'lastAgreementCommitment — Latest ZK hash', 'landlordCommitment — Authority anchor', 'minimumIncomeRequirement — Threshold', 'activeSession — Epoch nonce', 'lastRevokedCommitment — Revoked hash'].map(f => (
                <div key={f} style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>{f}</div>
              ))}
            </div>
          </div>

          {/* ── Links ── */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="https://preview.midnightexplorer.com/contracts/0df73463334fda0ddd7c0b2755c04251c305868219682427253c06a6f538fab0"
                target="_blank" rel="noopener noreferrer" className="btn-secondary">
                🔍 Midnight Explorer
              </a>
              <a href="https://youtu.be/m5JKf-RWM-o" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                🎥 YouTube Demo
              </a>
              <a href="https://github.com/techyguy22674/confidential-rental-aggreement" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                📦 GitHub Repo
              </a>
              <Link href="/apply" className="btn-primary">→ Apply & Sign Lease</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
