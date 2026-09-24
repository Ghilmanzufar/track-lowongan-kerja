import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import LandingFooter from './components/LandingFooter';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#08090A' }}>
      <div className="noise-overlay" />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <LandingFooter />
    </div>
  );
}
