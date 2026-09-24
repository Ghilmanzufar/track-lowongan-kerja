import React, { useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import { useEffect } from 'react';

const stats = [
  { value: 8225, suffix: '+', label: 'Perusahaan di Direktori', icon: '🏢', color: '#6366F1' },
  { value: 7, suffix: '', label: 'Tahap Pipeline Lamaran', icon: '📋', color: '#8B5CF6' },
  { value: 100, suffix: '%', label: 'Gratis Selamanya', icon: '✨', color: '#22D3EE' },
  { value: 24, suffix: '/7', label: 'Notifikasi Realtime', icon: '⚡', color: '#10B981' },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 30, stiffness: 100 });

  useEffect(() => {
    if (inView) {
      animate(motionVal, value, { duration: 1.8, ease: 'easeOut' });
    }
  }, [inView, value]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = Math.round(v).toLocaleString('id-ID') + suffix;
      }
    });
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container">
        <div
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                padding: 'clamp(28px, 4vw, 40px) clamp(24px, 4vw, 40px)',
                background: '#0E0F11',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle glow */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at center, ${stat.color}08, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                marginBottom: 8,
                background: `linear-gradient(135deg, #F1F5F9, ${stat.color})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
