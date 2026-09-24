import React from 'react';
import { motion, type Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.7, delay: i * 0.1, ease: 'easeOut' },
  }),
};

// Floating blob component
function Blob({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.5, 0.8, 0.5],
        x: [0, 20, 0],
        y: [0, -20, 0],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 100,
        paddingBottom: 80,
      }}
    >
      {/* Grid BG */}
      <div className="grid-bg" />

      {/* Animated blobs */}
      <Blob style={{ width: 600, height: 600, background: 'rgba(99,102,241,0.12)', top: '-10%', left: '-10%' }} />
      <Blob style={{ width: 500, height: 500, background: 'rgba(139,92,246,0.1)', bottom: '-10%', right: '-5%' }} />
      <Blob style={{ width: 300, height: 300, background: 'rgba(34,211,238,0.08)', top: '40%', left: '60%' }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 99, padding: '8px 18px',
            fontSize: 13, fontWeight: 600, color: '#A5B4FC',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', display: 'inline-block', boxShadow: '0 0 8px #6366F1' }} />
            ✨ 8.225+ Perusahaan Indonesia Tersedia
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          style={{
            fontSize: 'clamp(40px, 7vw, 80px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: 24,
            color: '#F1F5F9',
          }}
        >
          Kontrol Penuh Atas<br />
          <span className="gradient-text">Perjalanan Karirmu</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="show"
          style={{
            fontSize: 'clamp(17px, 2.5vw, 21px)',
            color: '#94A3B8',
            lineHeight: 1.7,
            maxWidth: 580,
            margin: '0 auto 40px',
          }}
        >
          Lacak setiap lamaran kerja, jadwal wawancara, dan pantau<br className="hide-mobile" />
          progress karir dari satu dashboard terpadu.{' '}
          <strong style={{ color: '#C7D2FE' }}>Gratis selamanya.</strong>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="hero-cta-group"
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a href="/app#register" className="btn btn-primary btn-lg">
            Mulai Gratis Sekarang
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href="#features" className="btn btn-secondary btn-lg">
            Lihat Fitur
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          custom={4} variants={fadeUp} initial="hidden" animate="show"
          style={{ marginTop: 20, fontSize: 13, color: '#475569' }}
        >
          Tanpa kartu kredit · Tanpa batas · Bisa akses dari HP
        </motion.p>

        {/* App mockup preview */}
        <motion.div
          custom={5} variants={fadeUp} initial="hidden" animate="show"
          style={{ marginTop: 64, position: 'relative' }}
        >
          {/* Glow behind mockup */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%', height: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Scrollable wrapper on mobile */}
          <div className="mockup-scroll-wrapper">

          {/* Browser frame */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.4 }}
            style={{
              background: '#111318',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
              position: 'relative',
              maxWidth: 900,
              margin: '0 auto',
            }}
          >
            {/* Browser topbar */}
            <div style={{
              padding: '14px 20px',
              background: '#0E0F11',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ display: 'flex', gap: 7 }}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, maxWidth: 320, margin: '0 auto',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 6, padding: '5px 12px',
                fontSize: 12, color: '#475569',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                app.jobtrack.id/dashboard
              </div>
            </div>

            {/* App canvas */}
            <div style={{ padding: 0, background: '#0A0B0D', height: 460, display: 'flex', overflow: 'hidden' }}>
              {/* Sidebar */}
              <div style={{
                width: 200, borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4,
                flexShrink: 0,
              }}>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#818CF8', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📋</span> Kanban Board
                </div>
                {[['📄','Daftar Lamaran'],['📅','Agenda'],['📊','Analitik'],['🏢','Direktori Karir'],['🗂️','Vault Dokumen']].map(([icon, label]) => (
                  <div key={String(label)} style={{ padding: '10px 12px', borderRadius: 8, color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{icon}</span> {label}
                  </div>
                ))}
              </div>

              {/* Kanban columns */}
              <div style={{ flex: 1, padding: 20, display: 'flex', gap: 12, overflowX: 'auto' }}>
                {[
                  { label: 'Disimpan', color: '#6366F1', count: 5, cards: ['PT Astra International', 'Bank Mandiri', 'Telkom Indonesia'] },
                  { label: 'Melamar', color: '#22D3EE', count: 3, cards: ['PT Unilever Indonesia', 'Tokopedia'] },
                  { label: 'Interview', color: '#F59E0B', count: 2, cards: ['PT Pertamina'] },
                  { label: 'Penawaran', color: '#10B981', count: 1, cards: ['Gojek'] },
                ].map(col => (
                  <div key={col.label} style={{ minWidth: 160, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#475569', borderRadius: 4, padding: '1px 6px' }}>{col.count}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {col.cards.map(card => (
                        <div key={card} style={{
                          background: '#111318', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 8, padding: '10px 12px',
                          fontSize: 12, color: '#94A3B8', lineHeight: 1.4,
                        }}>
                          {card}
                          <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                            <span style={{ fontSize: 10, padding: '2px 6px', background: `${col.color}15`, color: col.color, borderRadius: 4 }}>
                              {col.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          </div>{/* end mockup-scroll-wrapper */}
        </motion.div>
      </div>
    </section>
  );
}
