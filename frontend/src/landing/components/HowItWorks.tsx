import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    number: '01',
    color: '#6366F1',
    icon: '👤',
    title: 'Daftar Gratis',
    desc: 'Buat akun dalam 30 detik. Tidak perlu kartu kredit. Cukup email dan password.',
    detail: 'Langsung akses semua fitur tanpa batasan sejak hari pertama.',
  },
  {
    number: '02',
    color: '#8B5CF6',
    icon: '➕',
    title: 'Tambah Lamaran',
    desc: 'Input posisi yang kamu lamar langsung dari Direktori 8.225+ perusahaan atau manual.',
    detail: 'Simpan deskripsi kerja, persyaratan, dan link pendaftaran dalam satu tempat.',
  },
  {
    number: '03',
    color: '#22D3EE',
    icon: '📊',
    title: 'Pantau Progress',
    desc: 'Lacak setiap tahapan lamaran dan jadwalkan interview otomatis di kalender.',
    detail: 'Dapatkan insight analitik tentang success rate dan waktu respons perusahaan.',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" ref={ref} style={{ padding: 'var(--section-py) 0', background: 'rgba(255,255,255,0.01)' }}>
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="section-label">⚡ Cara Kerja</span>
          </div>
          <h2 className="section-title">
            Mulai dalam{' '}
            <span className="gradient-text">3 langkah mudah</span>
          </h2>
          <p className="section-subtitle">
            Tidak perlu setup yang rumit. Langsung gunakan dalam 2 menit.
          </p>
        </div>

        {/* Steps */}
        <div
          className="steps-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            position: 'relative',
          }}
        >
          {/* Connector line (desktop) */}
          <div className="steps-connector hide-mobile" style={{
            position: 'absolute',
            top: 48,
            left: '16%',
            right: '16%',
            height: 1,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #22D3EE)',
            opacity: 0.2,
            zIndex: 0,
          }} />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
            >
              {/* Step number circle */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                style={{
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: `${step.color}15`,
                  border: `2px solid ${step.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  position: 'relative',
                  fontSize: 28,
                  boxShadow: `0 0 30px ${step.color}20`,
                }}
              >
                {step.icon}
                {/* Number badge */}
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: step.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'white',
                }}>
                  {i + 1}
                </div>
              </motion.div>

              {/* Step number text */}
              <div style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: step.color,
                marginBottom: 10,
              }}>
                Langkah {step.number}
              </div>

              <h3 style={{
                fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
                color: '#F1F5F9', marginBottom: 12,
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 12 }}>
                {step.desc}
              </p>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>
                {step.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
