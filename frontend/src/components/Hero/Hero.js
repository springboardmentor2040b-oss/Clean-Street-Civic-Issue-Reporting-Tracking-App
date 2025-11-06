import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Hero.module.css';
import heroBackground from '../../assets/hero-background.jpg';

const Hero = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <section
      className={styles.hero}
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <h1 className={styles.title}>
          Your Partner in making Clean and Hygiene environment
        </h1>
        <button 
          className={styles.loginButton} 
          onClick={handleLoginClick}
        >
          login
        </button>
      </div>
    </section>
  );
};

export default Hero;
