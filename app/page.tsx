import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tranct — Donate with Proof, Not Faith",
  description:
    "Tranct locks your donation in a smart contract escrow on Base. Funds only reach NGOs after donors vote to approve each milestone. Fully transparent, fully on-chain.",
};

export default function LandingPage() {
  return (
    <div className="lp-root">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="lp-nav" id="lp-navbar">
        <div className="lp-nav-inner">
          {/* Logo */}
          <a href="#" className="lp-logo">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#001a33" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span>Tranct</span>
          </a>

          {/* Desktop links */}
          <div className="lp-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#proof">On-chain Proof</a>
            <a href="#faq">FAQ</a>
          </div>

          {/* CTA */}
          <Link href="/projects" className="lp-btn-primary lp-btn-sm">
            Launch App
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="lp-hero">
        {/* Orbs */}
        <div className="lp-orb lp-orb-green" />
        <div className="lp-orb lp-orb-blue" />
        <div className="lp-orb lp-orb-purple" />
        {/* Grid overlay */}
        <div className="lp-grid-overlay" />

        <div className="lp-hero-inner">
          {/* Left: copy */}
          <div className="lp-hero-copy">
            <div className="lp-live-badge">
              <span className="lp-pulse-dot" />
              Live on Base Mainnet
            </div>

            <h1 className="lp-hero-h1">
              Donate with
              <span className="lp-gradient-text"> Proof,</span>
              <br />Not Faith.
            </h1>

            <p className="lp-hero-sub">
              Tranct locks your donation in a smart contract escrow on Base.
              Funds only reach NGOs after donors vote to approve each milestone —
              every cent tracked, every release verified on-chain.
            </p>

            <div className="lp-hero-ctas">
              <Link href="/projects" className="lp-btn-primary lp-btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Launch the App
              </Link>
              <a href="#how-it-works" className="lp-btn-ghost lp-btn-lg">
                How it works
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </a>
            </div>

            <div className="lp-trust-row">
              <span className="lp-trust-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#2ECC71"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Auditable smart contract
              </span>
              <span className="lp-trust-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#2ECC71"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#001a33" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                Non-custodial escrow
              </span>
              <span className="lp-trust-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#2ECC71"><circle cx="12" cy="12" r="10" /></svg>
                MIT open source
              </span>
              <span className="lp-chain-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#0052FF"><circle cx="12" cy="12" r="10" /></svg>
                Built on Base
              </span>
            </div>
          </div>

          {/* Right: mock UI card */}
          <div className="lp-hero-card-wrap">
            <div className="lp-mock-card lp-glass">
              <div className="lp-mock-card-header">
                <div>
                  <div className="lp-mock-label">Active Project</div>
                  <div className="lp-mock-title">Clean Water Initiative</div>
                </div>
                <span className="lp-badge-active">Active</span>
              </div>

              <div className="lp-mock-progress-wrap">
                <div className="lp-mock-progress-row">
                  <span>72% funded</span><span>3.6 / 5 ETH</span>
                </div>
                <div className="lp-progress-track">
                  <div className="lp-progress-bar" style={{ width: "72%" }} />
                </div>
              </div>

              <div className="lp-mock-milestones">
                <div className="lp-mock-ms-label">Milestones</div>
                {/* Done */}
                <div className="lp-ms-row lp-ms-done">
                  <div className="lp-ms-icon lp-ms-icon-done">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <div className="lp-ms-name">Site survey &amp; planning</div>
                    <div className="lp-ms-meta">1.5 ETH · Released</div>
                  </div>
                </div>
                {/* Current */}
                <div className="lp-ms-row lp-ms-current">
                  <div className="lp-ms-icon lp-ms-icon-current">
                    <div className="lp-ms-dot-orange" />
                  </div>
                  <div>
                    <div className="lp-ms-name">Drill 10 wells</div>
                    <div className="lp-ms-meta lp-ms-meta-orange">2.1 ETH · Voting…</div>
                  </div>
                </div>
                {/* Pending */}
                <div className="lp-ms-row lp-ms-pending">
                  <div className="lp-ms-icon lp-ms-icon-pending">
                    <div className="lp-ms-dot-grey" />
                  </div>
                  <div>
                    <div className="lp-ms-name lp-ms-name-dim">Train 50 local staff</div>
                    <div className="lp-ms-meta lp-ms-meta-dim">1.4 ETH · Locked</div>
                  </div>
                </div>
              </div>

              {/* Vote bar */}
              <div className="lp-vote-bar lp-glass-dark">
                <div className="lp-vote-header">
                  <span>Donor Approval</span>
                  <span className="lp-vote-pct">63% / 50% quorum</span>
                </div>
                <div className="lp-progress-track">
                  <div className="lp-progress-bar" style={{ width: "63%" }} />
                </div>
                <div className="lp-vote-actions">
                  <Link href="/projects" className="lp-vote-btn-primary">Vote Approve</Link>
                  <Link href="/projects" className="lp-vote-btn-ghost">Donate</Link>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="lp-float-badge lp-float-badge-tl lp-glass">
              <span style={{ color: "#2ECC71" }}>✓ </span>Funds locked in escrow
            </div>
            <div className="lp-float-badge lp-float-badge-br lp-glass">
              🗳 12 donors voted
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="lp-scroll-hint">
          <span>scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROBLEM
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-section-dark lp-border-y">
        <div className="lp-container">
          <div className="lp-section-header lp-fade-up">
            <div className="lp-eyebrow lp-eyebrow-red">The Problem</div>
            <h2 className="lp-h2">Charity is broken by opacity.</h2>
            <p className="lp-section-sub">Donors write a check. Then they pray.</p>
          </div>

          <div className="lp-grid-4 lp-fade-up">
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
                title: "Zero visibility",
                body: "Once funds leave your account, you get a thank-you email and nothing more.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
                title: "No accountability",
                body: "NGOs face no on-chain enforcement. Promises don't have to be kept.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                title: "Donor fatigue",
                body: "Distrust keeps billions of dollars away from causes that deserve them.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
                title: "No fund tracking",
                body: "Impossible to verify whether pledged funds went to the right project.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="lp-pain-card lp-glass">
                <div className="lp-pain-icon">{icon}</div>
                <h3 className="lp-pain-title">{title}</h3>
                <p className="lp-pain-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="lp-section lp-section-mid">
        <div className="lp-container">
          <div className="lp-section-header lp-fade-up">
            <div className="lp-eyebrow lp-eyebrow-green">How it works</div>
            <h2 className="lp-h2">Trustless giving in 4 steps.</h2>
            <p className="lp-section-sub">The smart contract enforces every rule. You don&apos;t have to trust anyone.</p>
          </div>

          <div className="lp-grid-2 lp-fade-up">
            {[
              { num: "1", color: "#2ECC71", textColor: "#001a33", title: "NGO defines milestones", body: "A verified NGO creates a project with explicit milestones and a target ETH/USDC amount for each. No vague promises — just binding on-chain commitments." },
              { num: "2", color: "#673AB7", textColor: "#fff", title: "Donors fund the escrow", body: "You donate ETH or USDC. Funds are locked directly in the smart contract — the NGO cannot touch them yet. Your contribution equals your voting weight." },
              { num: "3", color: "#F7931A", textColor: "#001a33", title: "Donors vote on each milestone", body: "Once the NGO reports milestone completion, donors vote. Vote weight = your share of total donations. A snapshot prevents manipulation." },
              { num: "4", color: "#0052FF", textColor: "#fff", title: ">50% quorum → funds release", body: "Only after donors approve is the milestone's ETH released to the NGO. Every action — vote, donation, release — is permanently on-chain and auditable by anyone." },
            ].map(({ num, color, textColor, title, body }) => (
              <div key={num} className="lp-step-card lp-glass lp-feat-card">
                <div className="lp-step-num" style={{ background: color, color: textColor }}>{num}</div>
                <div>
                  <h3 className="lp-step-title">{title}</h3>
                  <p className="lp-step-body">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="lp-flow-diagram lp-glass lp-fade-up">
            {[
              { label: "NGO", sub: "Creates project", color: "#2ECC71" },
              { label: "🔒", sub: "Escrow locks funds", color: "#673AB7" },
              { label: "🗳", sub: "Donors vote", color: "#F7931A" },
              { label: "✓", sub: "Milestone approved", color: "#0052FF" },
              { label: "💸", sub: "Funds released", color: "#2ECC71" },
            ].map(({ label, sub, color }, i) => (
              <div key={i} className="lp-flow-item">
                <div className="lp-flow-circle" style={{ borderColor: `${color}44`, background: `${color}18`, color }}>
                  {label}
                </div>
                <span className="lp-flow-sub">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="lp-section lp-section-base">
        <div className="lp-container">
          <div className="lp-section-header lp-fade-up">
            <div className="lp-eyebrow lp-eyebrow-green">Features</div>
            <h2 className="lp-h2">Everything that makes it work.</h2>
            <p className="lp-section-sub">No middlemen. No black boxes. No excuses.</p>
          </div>

          <div className="lp-grid-3 lp-fade-up">
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, color: "#2ECC71", title: "Trustless Escrow", body: "Smart contract holds all donated funds. The NGO address is hardcoded — no admin can redirect your money." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#673AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>, color: "#673AB7", title: "Weighted Donor Voting", body: "Your vote power equals your donation. Bigger contributors have proportionally bigger say. Anti-sybil by design." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F7931A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, color: "#F7931A", title: "Snapshot Anti-Manipulation", body: "Donation snapshot taken on first vote. Late donations can't inflate quorum thresholds retroactively." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4d9fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>, color: "#4d9fff", title: "ETH + USDC Donations", body: "Donate in native ETH or any ERC20 token. The frontend handles approval flows automatically." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="23 11 17 11 17 17" /><line x1="14" y1="14" x2="20" y2="14" /></svg>, color: "#2ECC71", title: "Verified NGO Registry", body: "Only admin-approved NGOs can raise funds. On-chain verification flags prevent impersonation." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F7931A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>, color: "#F7931A", title: "Farcaster Mini App", body: "Native integration in the Farcaster social graph. Discover and fund projects inside your feed." },
            ].map(({ icon, color, title, body }) => (
              <div key={title} className="lp-feat-card lp-glass lp-card-hover">
                <div className="lp-feat-icon" style={{ background: `${color}1a` }}>{icon}</div>
                <h3 className="lp-feat-title">{title}</h3>
                <p className="lp-feat-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ON-CHAIN PROOF
      ══════════════════════════════════════════ */}
      <section id="proof" className="lp-section lp-section-dark">
        <div className="lp-container">
          <div className="lp-section-header lp-fade-up">
            <div className="lp-eyebrow lp-eyebrow-green">On-chain Proof</div>
            <h2 className="lp-h2">Not just a demo. Actually live.</h2>
            <p className="lp-section-sub">Deployed and verifiable on Base Mainnet right now — read the contract yourself.</p>
          </div>

          <div className="lp-grid-2 lp-fade-up">
            {/* Mainnet */}
            <div className="lp-contract-card lp-glass lp-contract-live">
              <div className="lp-contract-header">
                <span className="lp-pulse-dot" />
                <span className="lp-contract-net lp-contract-net-live">Base Mainnet</span>
                <span className="lp-chain-id">Chain ID 8453</span>
              </div>
              <div className="lp-contract-addr">0x9E61018e304f6Cb911ca76132748CFb2AD6B3176</div>
              <div className="lp-contract-links">
                <a href="https://basescan.org/address/0x9E61018e304f6Cb911ca76132748CFb2AD6B3176" target="_blank" rel="noopener" className="lp-contract-link">Basescan ↗</a>
                <a href="https://base.blockscout.com/address/0x9E61018e304f6Cb911ca76132748CFb2AD6B3176" target="_blank" rel="noopener" className="lp-contract-link">Blockscout ↗</a>
              </div>
            </div>

            {/* Testnet */}
            <div className="lp-contract-card lp-glass">
              <div className="lp-contract-header">
                <div className="lp-dot-orange" />
                <span className="lp-contract-net lp-contract-net-test">Base Sepolia</span>
                <span className="lp-chain-id">Chain ID 84532</span>
              </div>
              <div className="lp-contract-addr">0x46c17579afF1635b9d983603ED0b4A1c0823bF3d</div>
              <div className="lp-contract-links">
                <a href="https://sepolia.basescan.org/address/0x46c17579afF1635b9d983603ED0b4A1c0823bF3d" target="_blank" rel="noopener" className="lp-contract-link">Sepolia Basescan ↗</a>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="lp-stats-row lp-fade-up">
            {[
              { val: "2",    label: "Networks Deployed",      color: "#2ECC71" },
              { val: "4",    label: "Wallet Connectors",      color: "#673AB7" },
              { val: "100%", label: "Open Source (MIT)",      color: "#F7931A" },
              { val: "0",    label: "Admin custody of funds", color: "#4d9fff" },
            ].map(({ val, label, color }) => (
              <div key={label} className="lp-stat-card lp-glass">
                <div className="lp-stat-val" style={{ color }}>{val}</div>
                <div className="lp-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="lp-testimonial lp-glass lp-fade-up">
            <div className="lp-quote-icon">💬</div>
            <p className="lp-quote-text">
              &ldquo;Finally a charity platform where I can actually verify on-chain that my donation went to the right milestone. The voting mechanism is brilliant — donor governance done right.&rdquo;
            </p>
            <div className="lp-quote-author">
              <div className="lp-quote-avatar">A</div>
              <div>
                <div className="lp-quote-name">Alex M.</div>
                <div className="lp-quote-role">Web3 donor · Base ecosystem</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TECH STACK
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-section-base lp-border-y">
        <div className="lp-container">
          <p className="lp-tech-label">Built with production-grade tooling</p>
          <div className="lp-tech-row">
            {["⬡ Base L2", "⟠ Solidity 0.8.24", "🛡 OpenZeppelin", "⚡ Next.js 16", "🔗 Wagmi v3 + Viem", "🎨 Tailwind CSS v4", "🔨 Foundry", "🟣 Farcaster Mini App"].map((t) => (
              <span key={t} className="lp-tech-badge lp-glass">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section id="faq" className="lp-section lp-section-mid">
        <div className="lp-container lp-container-narrow">
          <div className="lp-section-header lp-fade-up">
            <div className="lp-eyebrow lp-eyebrow-green">FAQ</div>
            <h2 className="lp-h2">Common questions.</h2>
          </div>

          <div className="lp-faq-list lp-fade-up">
            {[
              { q: "What happens if a milestone is rejected by voters?", a: "If a milestone doesn't reach 50% quorum, the funds remain locked in the escrow contract. The NGO can re-submit evidence or work with donors to resolve concerns. Funds are never lost." },
              { q: "Can I donate with credit card or fiat?", a: "Currently Tranct supports ETH and USDC via a Web3 wallet (MetaMask, WalletConnect, Phantom). Fiat on-ramp integration is on the roadmap." },
              { q: "How do NGOs get verified?", a: "NGOs submit an application with organization name, description, email, website, and legal registration number. The Tranct admin reviews and calls registerNGO() on-chain, creating an immutable verification record." },
              { q: "Is the smart contract audited?", a: "The contract is MIT open source and uses OpenZeppelin's battle-tested ReentrancyGuard, Pausable, and Ownable modules. A formal third-party audit is planned before scaling. Read the code yourself on Basescan." },
              { q: "What's the Farcaster Mini App?", a: "Tranct is natively embedded as a Farcaster Mini App, allowing users to discover and donate to charity projects directly inside the Farcaster social feed — no external browser navigation required." },
            ].map(({ q, a }) => (
              <details key={q} className="lp-faq-item lp-glass">
                <summary className="lp-faq-summary">
                  {q}
                  <svg className="lp-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </summary>
                <div className="lp-faq-answer">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BLOCK
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-section-base">
        <div className="lp-container lp-container-narrow">
          <div className="lp-cta-card lp-fade-up">
            <div className="lp-cta-orb" />
            <div className="lp-cta-inner">
              <div className="lp-live-badge">
                <span className="lp-pulse-dot" />
                App is live — no waitlist needed
              </div>
              <h2 className="lp-cta-h2">
                Ready to donate<br />
                <span className="lp-gradient-text">with proof?</span>
              </h2>
              <p className="lp-cta-sub">
                Launch the app and start donating today. Your funds are protected by an immutable smart contract — not by trust.
              </p>
              <div className="lp-cta-btns">
                <Link href="/projects" className="lp-btn-primary lp-btn-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Launch Tranct App
                </Link>
                <a href="https://github.com" target="_blank" rel="noopener" className="lp-btn-ghost lp-btn-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                  View Source Code
                </a>
              </div>
              <div className="lp-cta-ngo">
                <p>Are you an NGO looking for accountable fundraising?</p>
                <Link href="/ngo/register" className="lp-cta-ngo-link">
                  Apply to list your project
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-logo">
                <div className="lp-logo-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#001a33" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span>Tranct</span>
              </div>
              <p className="lp-footer-desc">
                Transparent Charity Tracker. Milestone-based charitable donations enforced by smart contracts on Base.
              </p>
              <div className="lp-footer-badges">
                <span className="lp-chain-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#0052FF"><circle cx="12" cy="12" r="10" /></svg>
                  Built on Base
                </span>
                <span className="lp-glass lp-mit-badge">MIT License</span>
              </div>
            </div>

            <div>
              <div className="lp-footer-col-title">Product</div>
              <ul className="lp-footer-links">
                <li><Link href="/projects">Launch App</Link></li>
                <li><Link href="/ngo/register">Register NGO</Link></li>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#features">Features</a></li>
              </ul>
            </div>

            <div>
              <div className="lp-footer-col-title">Developers</div>
              <ul className="lp-footer-links">
                <li><a href="https://basescan.org/address/0x9E61018e304f6Cb911ca76132748CFb2AD6B3176" target="_blank" rel="noopener">Mainnet Contract ↗</a></li>
                <li><a href="https://sepolia.basescan.org/address/0x46c17579afF1635b9d983603ED0b4A1c0823bF3d" target="_blank" rel="noopener">Testnet Contract ↗</a></li>
                <li><a href="https://github.com" target="_blank" rel="noopener">GitHub ↗</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2026 Tranct · TCT Team · Web3Bridge Hackathon</span>
            <span>Built on Base · Transparent · Trustless · Decentralized</span>
          </div>
        </div>
      </footer>

      {/* ── Scroll-fade observer script ─────────────── */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function(){
            var obs = new IntersectionObserver(function(entries){
              entries.forEach(function(e){
                if(e.isIntersecting){ e.target.classList.add('lp-visible'); obs.unobserve(e.target); }
              });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
            document.querySelectorAll('.lp-fade-up').forEach(function(el){ obs.observe(el); });

            var nav = document.getElementById('lp-navbar');
            window.addEventListener('scroll', function(){
              if(nav) nav.classList.toggle('lp-nav-scrolled', window.scrollY > 20);
            }, { passive: true });

            document.querySelectorAll('a[href^="#"]').forEach(function(a){
              a.addEventListener('click', function(e){
                var t = document.querySelector(a.getAttribute('href'));
                if(t){ e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
              });
            });
          })();
        `
      }} />
    </div>
  );
}
