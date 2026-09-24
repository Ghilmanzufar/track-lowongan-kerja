import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const features = [
  {
    icon: '📋',
    color: '#6366F1',
    title: 'Kanban Board Lamaran',
    desc: 'Visualisasi pipeline lamaran kerja dari "Disimpan" hingga "Penawaran" dengan tampilan drag & drop yang intuitif. Pantau semua tahapan sekaligus.',
    tag: 'Produktivitas',
  },
  {
    icon: '🏢',
    color: '#8B5CF6',
    title: 'Direktori 8.225+ Perusahaan',
    desc: 'Database terlengkap perusahaan Indonesia dari IDX/BEI, JobStreet, Glints, KitaLulus, dan Kalibrr. Semua sektor KBLI tersedia.',
    tag: 'Eksklusif',
    badge: 'NEW',
  },
  {
    icon: '📅',
    color: '#22D3EE',
    title: 'Agenda & Reminder Otomatis',
    desc: 'Buat pengingat wawancara, tes psikologi, dan deadline lamaran. Notifikasi browser real-time agar tidak ada momen penting yang terlewat.',
    tag: 'Organisasi',
  },
  {
    icon: '📊',
    color: '#F59E0B',
    title: 'Analitik & Metrik Mendalam',
    desc: 'Lihat conversion rate, waktu respons rata-rata, win rate per sektor industri, dan tren lamaran kerja kamu secara visual.',
    tag: 'Insight',
  },
  {
    icon: '🗂️',
    color: '#10B981',
    title: 'Vault Dokumen & Resume',
    desc: 'Simpan multiple versi CV dan cover letter. Kelola portfolio dengan versioning terstruktur. Lampirkan dokumen spesifik ke setiap lamaran.',
    tag: 'Dokumen',
  },
  {
    icon: '⌘',
    color: '#EC4899',
    title: 'Command Palette',
    desc: 'Akses semua fitur dengan satu shortcut ⌘K. Cari lamaran, tambah reminder, navigate antar view — tanpa sentuh mouse.',
    tag: 'Power User',
  },
];

export default function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" ref={ref} style={{ padding: 'var(--section-py) 0' }}>
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="section-label">🚀 Fitur Unggulan</span>
          </div>
          <h2 className="section-title">
            Semua yang kamu butuhkan<br />
            <span className="gradient-text">dalam satu tempat</span>
          </h2>
          <p className="section-subtitle">
            Dirancang khusus untuk pencari kerja Indonesia yang ingin lebih terorganisir dan meningkatkan success rate lamaran mereka.
          </p>
        </div>

        {/* Feature grid */}
        <div
          className="features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card"
              style={{ padding: '28px 28px 24px', position: 'relative', overflow: 'hidden' }}
            >
              {/* Subtle gradient glow top-left */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: 200, height: 200,
                background: `radial-gradient(ellipse at top left, ${feat.color}12, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Badge */}
              {feat.badge && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                  padding: '4px 8px', borderRadius: 6,
                  background: 'rgba(99,102,241,0.15)', color: '#818CF8',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}>
                  {feat.badge}
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${feat.color}15`,
                border: `1px solid ${feat.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 20,
              }}>
                {feat.icon}
              </div>

              {/* Tag */}
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: feat.color,
                }}>
                  {feat.tag}
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#F1F5F9', marginBottom: 10 }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
