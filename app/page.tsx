"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bricolage_Grotesque, Manrope, Instrument_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { tokenStore, userStore, homeRouteForProfil } from "@/lib/api";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-instrument-serif",
});

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.whatspay.native";
// TODO: remplacer par le lien App Store réel dès qu'il est disponible.
const APP_STORE_URL = "/login";

interface LandingStats {
  diffuseurs: string;
  villes: string;
  vues_jour: string;
  vues_jour_abbrev: string;
  vues_total: string;
  vues_total_abbrev: string;
  campagnes: string;
  nouveaux_jour: string;
}

const FALLBACK_STATS: LandingStats = {
  diffuseurs: "12 000", villes: "20", vues_jour: "1 000 000", vues_jour_abbrev: "1M",
  vues_total: "10 000 000", vues_total_abbrev: "10M", campagnes: "200", nouveaux_jour: "500",
};

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6effa0" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowIcon = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<LandingStats>(FALLBACK_STATS);

  // Si déjà connecté → espace correspondant au rôle
  useEffect(() => {
    if (tokenStore.get()) router.replace(homeRouteForProfil(userStore.get()?.profil));
  }, [router]);

  // Chiffres réels de la plateforme (visiteur anonyme, pas d'auth requise).
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing-stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  return (
    <div className={`${bricolage.variable} ${manrope.variable} ${instrumentSerif.variable} lp`}>
      <style>{`
        .lp {
          --vert: #00A53C; --vert-l: #00C247; --vert-d: #006622; --vert-xd: #003d14;
          --blanc: #FFFFFF; --noir: #0A0A0A;
          --gris-bg: #F5F7F5; --gris-bd: #E4EAE4; --gris-txt: #4A5448; --gris-sub: #7A897A;
          --or: #F5B731;
          --fd: var(--font-bricolage), sans-serif;
          --fb: var(--font-manrope), sans-serif;
          --fs: var(--font-instrument-serif), serif;
          --tr: 0.22s cubic-bezier(0.4,0,0.2,1);
          font-family: var(--fb);
          color: var(--noir);
          background: var(--blanc);
        }
        .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
        .lp h1, .lp h2, .lp h3 { font-family: var(--fd); line-height: 1.12; letter-spacing: -.02em; }
        .lp p { line-height: 1.65; }
        .lp a { text-decoration: none; color: inherit; }
        .lp .serif { font-family: var(--fs); font-style: italic; font-weight: 400; }

        .lp .sec { padding: 52px 20px; }
        .lp .s-white { background: var(--blanc); }
        .lp .s-tint { background: var(--gris-bg); }
        .lp .s-dark { background: var(--vert-xd); }

        .lp .eyebrow { display: block; font-size: .6875rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--vert-d); margin-bottom: 8px; }
        .lp .s-dark .eyebrow { color: #6effa0; }
        .lp .stitle { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; margin-bottom: 8px; }
        .lp .s-dark .stitle { color: var(--blanc); }
        .lp .sdesc { font-size: .9rem; color: var(--gris-txt); line-height: 1.6; }
        .lp .s-dark .sdesc { color: rgba(255,255,255,.72); }

        /* Header */
        .lp .hdr { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: var(--blanc); border-bottom: 1px solid var(--gris-bd); position: sticky; top: 0; z-index: 30; }
        .lp .hdr-login { font-size: .8125rem; font-weight: 700; color: var(--vert-d); padding: 8px 10px; }

        /* Hero */
        .lp .hero { position: relative; padding: 34px 20px 40px; overflow: hidden; background: linear-gradient(160deg, var(--vert-xd) 0%, var(--vert-d) 55%, var(--vert) 100%); }
        .lp .hero-grain { position: absolute; inset: 0; pointer-events: none; opacity: .05; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 128px; }
        .lp .hero-glow { position: absolute; top: -18%; right: -22%; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(0,194,71,.22) 0%, transparent 70%); pointer-events: none; }
        .lp .hero-c { position: relative; z-index: 2; }
        .lp .hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); border-radius: 100px; padding: 5px 13px; font-size: .6875rem; font-weight: 700; color: rgba(255,255,255,.95); margin-bottom: 18px; }
        .lp .bdot { width: 6px; height: 6px; border-radius: 50%; background: #6effa0; animation: bdot 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes bdot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        .lp .hero-title { font-size: 2rem; font-weight: 800; letter-spacing: -.02em; margin-bottom: 14px; color: var(--blanc); }
        .lp .hero-title .serif { color: #a8f0c0; font-size: 1.15em; }
        .lp .hero-sub { font-size: .9375rem; color: rgba(255,255,255,.78); margin-bottom: 26px; line-height: 1.6; }

        .lp .store-btns { display: flex; flex-direction: column; gap: 10px; }
        .lp .btn-store { display: flex; align-items: center; gap: 12px; background: var(--blanc); border-radius: 14px; padding: 13px 16px; transition: transform var(--tr); }
        .lp .btn-store:active { transform: scale(.98); }
        .lp .btn-store-ico { flex-shrink: 0; color: var(--vert-d); }
        .lp .btn-store-lbl { font-size: .6875rem; text-transform: uppercase; letter-spacing: .05em; color: var(--gris-sub); }
        .lp .btn-store-name { font-size: 1.0625rem; font-weight: 800; font-family: var(--fd); color: var(--noir); }
        .lp .btn-store--ghost { background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.3); }
        .lp .btn-store--ghost .btn-store-ico { color: var(--blanc); }
        .lp .btn-store--ghost .btn-store-lbl { color: rgba(255,255,255,.6); }
        .lp .btn-store--ghost .btn-store-name { color: var(--blanc); }

        .lp .hero-login { display: block; text-align: center; margin-top: 18px; font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.75); }
        .lp .hero-login strong { color: var(--blanc); text-decoration: underline; }

        /* Stats bar */
        .lp .stats-bar { background: var(--vert); padding: 30px 20px; }
        .lp .stats-g { display: grid; grid-template-columns: 1fr 1fr; row-gap: 22px; }
        .lp .stat-i { text-align: center; }
        .lp .stat-n { font-family: var(--fd); font-size: 1.5rem; font-weight: 800; color: var(--blanc); letter-spacing: -.02em; line-height: 1; margin-bottom: 5px; }
        .lp .stat-l { font-size: .6875rem; color: rgba(255,255,255,.82); font-weight: 600; }

        /* Steps */
        .lp .steps { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
        .lp .step { display: flex; align-items: flex-start; gap: 14px; }
        .lp .step-n { width: 34px; height: 34px; border-radius: 50%; background: var(--vert); color: var(--blanc); font-family: var(--fd); font-weight: 800; font-size: .875rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 0 5px rgba(0,165,60,.1); }
        .lp .s-dark .step-n { box-shadow: 0 0 0 5px rgba(255,255,255,.08); }
        .lp .step-title { font-size: .875rem; font-weight: 700; color: var(--noir); margin-bottom: 2px; }
        .lp .s-dark .step-title { color: var(--blanc); }
        .lp .step-desc { font-size: .8125rem; color: var(--gris-txt); line-height: 1.55; }
        .lp .s-dark .step-desc { color: rgba(255,255,255,.68); }

        /* Pricing */
        .lp .price-main { background: var(--vert-xd); border-radius: 20px; padding: 24px 22px; margin-top: 18px; margin-bottom: 16px; }
        .lp .price-big-num { font-family: var(--fd); font-size: 2.75rem; font-weight: 800; color: var(--or); letter-spacing: -.03em; line-height: 1; }
        .lp .price-big-lbl { font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.75); margin: 4px 0 16px; }
        .lp .price-formula-lbl { font-size: .6875rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.5); margin-bottom: 8px; }
        .lp .price-formula { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-left: 3px solid var(--or); border-radius: 10px; padding: 12px 14px; font-family: var(--fb); font-size: .75rem; color: rgba(255,255,255,.9); line-height: 1.6; }
        .lp .sim-card { background: var(--blanc); border: 1.5px solid var(--gris-bd); border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .lp .sim-card--featured { background: var(--vert-d); border-color: var(--vert-d); }
        .lp .sim-name { font-size: .8125rem; font-weight: 700; color: var(--noir); }
        .lp .sim-card--featured .sim-name { color: var(--or); }
        .lp .sim-calc { font-size: .6875rem; color: var(--gris-sub); margin-top: 2px; }
        .lp .sim-card--featured .sim-calc { color: rgba(255,255,255,.65); }
        .lp .sim-total { font-family: var(--fd); font-size: 1.125rem; font-weight: 800; color: var(--vert-d); white-space: nowrap; }
        .lp .sim-card--featured .sim-total { color: var(--blanc); }
        .lp .price-hl { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 13px 16px; font-size: .8125rem; color: var(--gris-txt); line-height: 1.6; }
        .lp .price-hl strong { color: var(--vert-d); }

        /* Avantages */
        .lp .pp { display: flex; align-items: flex-start; gap: 12px; background: var(--blanc); border: 1.5px solid var(--gris-bd); border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; }
        .lp .pp-ico { width: 36px; height: 36px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.05rem; }
        .lp .pp-t strong { display: block; font-size: .8438rem; font-weight: 700; color: var(--noir); margin-bottom: 2px; }
        .lp .pp-t span { font-size: .75rem; color: var(--gris-txt); line-height: 1.5; }
        .lp .mm-tag { display: inline-block; padding: 4px 11px; border-radius: 100px; font-size: .6875rem; font-weight: 700; border: 1.5px solid; margin: 0 6px 6px 0; }
        .lp .mm-mtn { background: #FFF3CD; color: #856404; border-color: #FFD700; }
        .lp .mm-moov { background: #CCE5FF; color: #004085; border-color: #80bdff; }
        .lp .mm-wave { background: #D4EDDA; color: #155724; border-color: #28a745; }
        .lp .mm-orng { background: #FFE5CC; color: #7A3700; border-color: #FF8C00; }

        /* Download */
        .lp .dl-section { padding: 40px 20px 46px; background: var(--vert-xd); text-align: center; }
        .lp .dl-section .eyebrow { text-align: left; }
        .lp .dl-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(245,183,49,.15); border: 1px solid rgba(245,183,49,.4); color: var(--or); font-size: .6875rem; font-weight: 700; padding: 5px 13px; border-radius: 100px; margin-bottom: 14px; }
        .lp .dl-count { font-size: .75rem; color: rgba(255,255,255,.55); margin-top: 12px; }

        /* Final CTA */
        .lp .fcta { background: linear-gradient(160deg, var(--vert-xd) 0%, var(--vert-d) 50%, var(--vert) 100%); text-align: center; padding: 44px 20px 48px; position: relative; overflow: hidden; }
        .lp .fcta::before { content: ''; position: absolute; inset: 0; opacity: .05; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .lp .fcta-in { position: relative; }
        .lp .fcta h2 { font-size: 1.625rem; color: var(--blanc); margin-bottom: 10px; }
        .lp .fcta > .fcta-in > p { font-size: .9375rem; color: rgba(255,255,255,.78); margin-bottom: 26px; }
        .lp .fcta-note { margin-top: 16px; font-size: .75rem; color: rgba(255,255,255,.55); }
        .lp .fcta-note span { margin: 0 6px; opacity: .5; }

        /* Footer */
        .lp .ft { background: var(--noir); padding: 32px 20px; text-align: center; }
        .lp .ft-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; margin-bottom: 16px; }
        .lp .ft-links a { font-size: .75rem; color: rgba(255,255,255,.6); font-weight: 600; }
        .lp .ft-copy { font-size: .6875rem; color: rgba(255,255,255,.35); }
      `}</style>

      {/* HEADER */}
      <header className="hdr">
        <Image src="/logo.png" alt="WhatsPAY" width={110} height={30} className="object-contain h-7 w-auto" />
        <Link href="/login" className="hdr-login">Connexion</Link>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-glow" />
        <div className="hero-c">
          <div className="hero-badge">
            <span className="bdot" />
            +{stats.nouveaux_jour} nouveaux diffuseurs par jour
          </div>
          <h1 className="hero-title">
            Gagne de l&apos;argent avec tes <span className="serif">Status WhatsApp</span>
          </h1>
          <p className="hero-sub">
            Publie des publicités sur ton statut WhatsApp et reçois ton argent directement sur Mobile Money. Télécharge l&apos;appli WhatsPAY pour commencer.
          </p>
          <div className="store-btns">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-store">
              <svg className="btn-store-ico" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.6 2.6c-.3.3-.5.7-.5 1.2v16.4c0 .5.2.9.5 1.2l.1.1L13 12.2v-.3L3.7 2.5l-.1.1z"/>
                <path d="M16.1 15.3 13 12.2v-.4l3.1-3.1 3.6 2.1c1 .6 1 1.6 0 2.2l-3.6 2.1z" opacity=".85"/>
                <path d="M16.1 15.3 13 12.2 3.7 21.4c.4.4 1 .4 1.7.1l10.7-6.2"/>
                <path d="M16.1 8.7 5.4 2.5c-.7-.4-1.3-.3-1.7.1L13 12.2l3.1-3.5z" opacity=".7"/>
              </svg>
              <div>
                <div className="btn-store-lbl">Télécharger sur</div>
                <div className="btn-store-name">Google Play</div>
              </div>
            </a>
            <Link href={APP_STORE_URL} className="btn-store btn-store--ghost">
              <svg className="btn-store-ico" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
              </svg>
              <div>
                <div className="btn-store-lbl">Télécharger sur</div>
                <div className="btn-store-name">App Store</div>
              </div>
            </Link>
          </div>
          <Link href="/login" className="hero-login">
            Déjà diffuseur ou annonceur ? <strong>Se connecter</strong>
          </Link>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="stats-g">
          <div className="stat-i">
            <div className="stat-n">+{stats.diffuseurs}</div>
            <div className="stat-l">Diffuseurs actifs</div>
          </div>
          <div className="stat-i">
            <div className="stat-n">+{stats.villes}</div>
            <div className="stat-l">Villes couvertes</div>
          </div>
          <div className="stat-i">
            <div className="stat-n">{stats.vues_jour_abbrev}+</div>
            <div className="stat-l">Vues générées / jour</div>
          </div>
          <div className="stat-i">
            <div className="stat-n">+{stats.campagnes}</div>
            <div className="stat-l">Campagnes diffusées</div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="sec s-white">
        <span className="eyebrow">Comment ça marche</span>
        <h2 className="stitle">Gagner de l&apos;argent <span className="serif">en 3 étapes</span></h2>
        <p className="sdesc">Aucune compétence technique requise.</p>
        <div className="steps">
          <div className="step">
            <div className="step-n">1</div>
            <div><p className="step-title">Inscris-toi gratuitement</p><p className="step-desc">Crée ton profil en 2 minutes depuis l&apos;appli. Aucun frais, aucun abonnement.</p></div>
          </div>
          <div className="step">
            <div className="step-n">2</div>
            <div><p className="step-title">Publie sur ton Status</p><p className="step-desc">Reçois une pub, mets-la sur ton Status WhatsApp 24h et prends une capture d&apos;écran.</p></div>
          </div>
          <div className="step">
            <div className="step-n">3</div>
            <div><p className="step-title">Reçois ton argent</p><p className="step-desc">Soumets ta capture, on vérifie et tu reçois ton paiement sur Mobile Money.</p></div>
          </div>
        </div>
      </section>

      {/* COMBIEN TU PEUX GAGNER */}
      <section className="sec s-tint">
        <span className="eyebrow">Tes revenus</span>
        <h2 className="stitle">Combien tu peux <span className="serif">gagner ?</span></h2>
        <p className="sdesc">Chaque vue vérifiée sur ton statut te rapporte de l&apos;argent.</p>

        <div className="price-main">
          <div className="price-big-num">1 F</div>
          <div className="price-big-lbl">par vue vérifiée</div>
          <p className="price-formula-lbl">Formule :</p>
          <div className="price-formula">1 F de base + 0,01 F × filleuls actifs = ton gain par vue</div>
        </div>

        <div className="sim-card">
          <div><div className="sim-name">Sans parrainage</div><div className="sim-calc">10 missions × 150 vues × 1 F</div></div>
          <div className="sim-total">1 500 F</div>
        </div>
        <div className="sim-card sim-card--featured">
          <div><div className="sim-name">Avec 50 filleuls</div><div className="sim-calc">10 missions × 150 vues × 1,50 F</div></div>
          <div className="sim-total">2 250 F</div>
        </div>

        <div className="price-hl" style={{ marginTop: 6 }}><strong>Aucune compétence requise.</strong> Tu publies une image sur ton statut, c&apos;est tout.</div>
      </section>

      {/* AVANTAGES + MOBILE MONEY */}
      <section className="sec s-white">
        <span className="eyebrow">Tes avantages</span>
        <h2 className="stitle">Une plateforme <span className="serif" style={{ color: "var(--vert-d)" }}>pensée pour toi</span></h2>
        <div style={{ marginTop: 18 }}>
          <div className="pp">
            <div className="pp-ico">🎯</div>
            <div className="pp-t"><strong>Campagnes adaptées à ton profil</strong><span>Tu reçois seulement les campagnes qui correspondent à ta ville et tes centres d&apos;intérêt.</span></div>
          </div>
          <div className="pp">
            <div className="pp-ico">📊</div>
            <div className="pp-t"><strong>Suivi en temps réel</strong><span>Consulte tes missions, tes gains et tes retraits directement depuis l&apos;application.</span></div>
          </div>
          <div className="pp">
            <div className="pp-ico">✅</div>
            <div className="pp-t"><strong>Paiement garanti à la vue vérifiée</strong><span>Chaque vue validée par notre système est payée — sans surprise, sans retard injustifié.</span></div>
          </div>
        </div>
        <div style={{ background: "var(--gris-bg)", border: "1.5px solid var(--gris-bd)", borderRadius: 16, padding: "18px 18px", marginTop: 16 }}>
          <p style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--gris-sub)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>💳 Reçois ton paiement via</p>
          <div>
            <span className="mm-tag mm-mtn">MTN MoMo</span>
            <span className="mm-tag mm-moov">Moov Money</span>
            <span className="mm-tag mm-wave">Wave</span>
            <span className="mm-tag mm-orng">Orange Money</span>
          </div>
        </div>
      </section>

      {/* PROGRAMME AMBASSADEUR */}
      <section className="sec s-dark">
        <span className="eyebrow">⭐ Programme ambassadeur</span>
        <h2 className="stitle">Parraine et <span className="serif" style={{ color: "#a8f0c0" }}>gagne encore plus</span></h2>
        <p className="sdesc">Pour chaque filleul actif que tu parraines, ton gain par vue augmente de +0,01 F. Sans plafond.</p>
        <div className="steps">
          <div className="step">
            <div className="step-n">1</div>
            <div><p className="step-title">Atteins 1 000 F</p><p className="step-desc">Solde vérifié + identité (KYC) validée.</p></div>
          </div>
          <div className="step">
            <div className="step-n">2</div>
            <div><p className="step-title">Génère ton code</p><p className="step-desc">Un code unique à partager à tes contacts, en un clic.</p></div>
          </div>
          <div className="step">
            <div className="step-n">3</div>
            <div><p className="step-title">Tes filleuls s&apos;inscrivent</p><p className="step-desc">Ils rejoignent avec ton code et participent aux campagnes.</p></div>
          </div>
          <div className="step">
            <div className="step-n">4</div>
            <div><p className="step-title">Ton gain augmente</p><p className="step-desc">+0,01 F par filleul actif, sur chaque vue. Sans plafond.</p></div>
          </div>
        </div>
        <div className="price-hl" style={{ marginTop: 22, background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.85)" }}>
          <strong style={{ color: "var(--or)" }}>Exemple avec 50 filleuls actifs :</strong><br />1 F + (50 × 0,01 F) = 1,50 F / vue — soit +50 % de revenus.
        </div>
      </section>

      {/* TÉLÉCHARGER L'APP */}
      <section className="dl-section" id="telecharger">
        <span className="dl-badge">📱 Nouveau</span>
        <h2 className="stitle" style={{ color: "var(--blanc)" }}>Télécharge <span className="serif" style={{ color: "#a8f0c0" }}>l&apos;application</span></h2>
        <p className="sdesc" style={{ color: "rgba(255,255,255,.7)", marginBottom: 22 }}>Accède à WhatsPAY depuis ton téléphone pour ne jamais manquer une campagne.</p>
        <div className="store-btns">
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-store">
            <svg className="btn-store-ico" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.6 2.6c-.3.3-.5.7-.5 1.2v16.4c0 .5.2.9.5 1.2l.1.1L13 12.2v-.3L3.7 2.5l-.1.1z"/>
              <path d="M16.1 15.3 13 12.2v-.4l3.1-3.1 3.6 2.1c1 .6 1 1.6 0 2.2l-3.6 2.1z" opacity=".85"/>
              <path d="M16.1 15.3 13 12.2 3.7 21.4c.4.4 1 .4 1.7.1l10.7-6.2"/>
              <path d="M16.1 8.7 5.4 2.5c-.7-.4-1.3-.3-1.7.1L13 12.2l3.1-3.5z" opacity=".7"/>
            </svg>
            <div style={{ textAlign: "left" }}>
              <div className="btn-store-lbl">Télécharger sur</div>
              <div className="btn-store-name">Google Play</div>
            </div>
          </a>
          <Link href={APP_STORE_URL} className="btn-store btn-store--ghost">
            <svg className="btn-store-ico" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
            </svg>
            <div style={{ textAlign: "left" }}>
              <div className="btn-store-lbl">Télécharger sur</div>
              <div className="btn-store-name">App Store</div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="fcta">
        <div className="fcta-in">
          <h2>Prêt à commencer<br /><span className="serif">à gagner de l&apos;argent ?</span></h2>
          <p>+{stats.diffuseurs} diffuseurs au Bénin, Togo et en Afrique de l&apos;Ouest gagnent déjà de l&apos;argent chaque semaine grâce à leurs Status WhatsApp.</p>
          <div className="store-btns">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-store">
              <svg className="btn-store-ico" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.6 2.6c-.3.3-.5.7-.5 1.2v16.4c0 .5.2.9.5 1.2l.1.1L13 12.2v-.3L3.7 2.5l-.1.1z"/>
                <path d="M16.1 15.3 13 12.2v-.4l3.1-3.1 3.6 2.1c1 .6 1 1.6 0 2.2l-3.6 2.1z" opacity=".85"/>
                <path d="M16.1 15.3 13 12.2 3.7 21.4c.4.4 1 .4 1.7.1l10.7-6.2"/>
                <path d="M16.1 8.7 5.4 2.5c-.7-.4-1.3-.3-1.7.1L13 12.2l3.1-3.5z" opacity=".7"/>
              </svg>
              <div style={{ textAlign: "left" }}>
                <div className="btn-store-lbl">Télécharger sur</div>
                <div className="btn-store-name">Google Play</div>
              </div>
            </a>
            <Link href={APP_STORE_URL} className="btn-store btn-store--ghost">
              <svg className="btn-store-ico" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
              </svg>
              <div style={{ textAlign: "left" }}>
                <div className="btn-store-lbl">Télécharger sur</div>
                <div className="btn-store-name">App Store</div>
              </div>
            </Link>
          </div>
          <p className="fcta-note">Gratuit <span>·</span> Paiement Mobile Money <span>·</span> Sans abonnement</p>
          <p className="fcta-note">Vous êtes annonceur ? <a href="https://whatspay.africa" style={{ color: "var(--blanc)", textDecoration: "underline" }}>Découvrir la plateforme annonceur →</a></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ft">
        <div className="ft-links">
          <a href="https://whatspay.africa/page/contact">Contact</a>
          <a href="https://whatspay.africa/page/support">Support</a>
          <a href="https://whatspay.africa/page/faq">FAQ</a>
          <a href="https://whatspay.africa/page/politique">Politique de confidentialité</a>
          <a href="https://whatspay.africa/page/conditions">Conditions d&apos;utilisation</a>
          <a href="https://whatspay.africa/page/mentions">Mentions légales</a>
        </div>
        <p className="ft-copy">© {new Date().getFullYear()} WhatsPAY — Tous droits réservés</p>
      </footer>
    </div>
  );
}
