import React from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import About from './components/About/About';
import Contact from './components/Contact/Contact';

function HomePage() {
  return (
    // This uses a Fragment <> because it's just a collection of components
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <About />
        <Contact />
      </main>
    </>
  );
}

export default HomePage;