import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'Apakah JobTrackId benar-benar gratis?',
    a: 'Ya, 100% gratis selamanya. Tidak ada fitur yang dikunci di balik paywall. Semua fitur — Kanban Board, Direktori Perusahaan, Vault Dokumen, hingga Analitik — tersedia gratis tanpa batas.',
  },
  {
    q: 'Data lamaran saya disimpan di mana?',
    a: 'Semua data tersimpan di server aman dengan enkripsi end-to-end. Kami tidak pernah menjual atau berbagi data pribadi kamu ke pihak ketiga.',
  },
  {
    q: 'Apakah bisa diakses dari smartphone?',
    a: 'Ya! JobTrackId sepenuhnya responsif dan dioptimalkan untuk tampilan mobile. Kamu bisa mengaksesnya dari browser HP tanpa perlu download aplikasi.',
  },
  {
    q: 'Berapa banyak lamaran yang bisa saya simpan?',
    a: 'Tidak ada batasan. Simpan ratusan bahkan ribuan lamaran tanpa khawatir. Sistem kami dirancang untuk skala besar.',
  },
  {
    q: 'Apakah ada Chrome Extension?',
    a: 'Ya, kami menyediakan Chrome Extension yang bisa kamu install untuk langsung menambahkan lowongan dari halaman karir perusahaan ke tracker kamu dengan satu klik.',
  },
  {
    q: 'Bagaimana cara mendapatkan daftar 8.225+ perusahaan?',
    a: 'Direktori perusahaan kami dikompilasi dari berbagai sumber resmi: IDX/BEI (emiten resmi), JobStreet, Glints, KitaLulus, dan Kalibrr. Data diperbarui secara berkala dan mencakup semua sektor industri Indonesia.',
  },
];

function FAQItem({ q, a, index, inView }: { q: string; a: string; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '22px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: open ? '#F1F5F9' : '#CBD5E1', lineHeight: 1.4, transition: 'color 0.2s' }}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
            background: open ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${open ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: open ? '#818CF8' : '#64748B',
            fontSize: 18, lineHeight: 1,
            transition: 'background 0.2s, border 0.2s',
          }}
        >
          +
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ paddingBottom: 22, fontSize: 15, color: '#64748B', lineHeight: 1.8 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="faq" ref={ref} style={{ padding: 'var(--section-py) 0' }}>
      <div className="container">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="section-header">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="section-label">❓ FAQ</span>
            </div>
            <h2 className="section-title">Pertanyaan Umum</h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Hal-hal yang sering ditanyakan tentang JobTrackId.
            </p>
          </div>

          <div>
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
