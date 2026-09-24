import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ padding: 'var(--section-py) 0' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            padding: 'clamp(48px, 8vw, 96px) clamp(28px, 6vw, 80px)',
            textAlign: 'center',
            background: '#0E0F11',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          {/* Background gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }} />

          {/* Blobs */}
          <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <span className="section-label">🚀 Mulai Sekarang</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: '#F1F5F9',
              marginBottom: 20,
            }}>
              Siap kuasai perjalanan<br />
              <span className="gradient-text">karir kamu?</span>
            </h2>

            <p style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: '#94A3B8',
              lineHeight: 1.7,
              maxWidth: 480,
              margin: '0 auto 40px',
            }}>
              Bergabung dan mulai melacak lamaran kerjamu lebih cerdas. Gratis selamanya, tanpa kartu kredit.
            </p>

            <div className="cta-btn-group" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.a
                href="/app#register"
                whileHover={{ scale: 1.03, boxShadow: '0 16px 48px rgba(99,102,241,0.5)' }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-lg"
                style={{ fontSize: 17, padding: '18px 40px' }}
              >
                Daftar Gratis Sekarang
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </motion.a>
            </div>

            <p style={{ marginTop: 18, fontSize: 13, color: '#475569' }}>
              ✓ Gratis selamanya &nbsp;·&nbsp; ✓ Tidak perlu kartu kredit &nbsp;·&nbsp; ✓ Setup 30 detik
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
