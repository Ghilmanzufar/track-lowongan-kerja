import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Fitur', href: '#features' },
    { label: 'Cara Kerja', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '0 clamp(20px, 5vw, 64px)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          backgroundColor: scrolled ? 'rgba(8, 9, 10, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            <img src="/icon-logo.svg" alt="JobTrackId Logo" width="22" height="22" style={{ display: 'block', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#F1F5F9', letterSpacing: '-0.02em' }}>JobTrackId</span>
        </a>

        {/* Desktop nav links */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '8px 16px',
                color: '#94A3B8',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F1F5F9')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/app#login" className="btn btn-secondary" style={{ padding: '9px 18px', fontSize: 14 }}>
            Masuk
          </a>
          <a href="/app#register" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: 14 }}>
            Mulai Gratis
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="hide-desktop"
          onClick={() => setMobileOpen(o => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 8,
            color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 5,
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transition: 'all 0.3s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 2, transition: 'all 0.3s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{ opacity: mobileOpen ? 1 : 0, y: mobileOpen ? 0 : -10 }}
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          zIndex: 999,
          background: 'rgba(8,9,10,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px 24px',
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
      >
        {navLinks.map(link => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'block',
              padding: '14px 0',
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {link.label}
          </a>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <a href="/app#login" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Masuk</a>
          <a href="/app#register" className="btn btn-primary" style={{ justifyContent: 'center' }}>Mulai Gratis →</a>
        </div>
      </motion.div>
    </>
  );
}
