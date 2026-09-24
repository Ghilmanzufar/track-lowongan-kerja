import React from 'react';

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '48px 0 32px',
    }}>
      <div className="container">
        <div
          className="footer-inner"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 20, flexWrap: 'wrap',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}>
              <img src="/icon-logo.svg" alt="JobTrackId Logo" width="18" height="18" style={{ display: 'block', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#94A3B8' }}>JobTrackId</span>
            <span style={{ color: '#334155', fontSize: 14 }}>© {year}</span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['Fitur', '#features'],
              ['Cara Kerja', '#how-it-works'],
              ['FAQ', '#faq'],
              ['Masuk', '/app#login'],
              ['Daftar', '/app#register'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{
                  fontSize: 13, color: '#475569', textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            Dibuat oleh{' '}
            <a
              href="https://www.linkedin.com/in/ghilman-zufar"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#818CF8',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#818CF8')}
            >
              Ghilman Zufar
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>{' '}
            untuk pencari kerja Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
