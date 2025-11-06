import React from 'react';
import styles from './Header.module.css';
import logo from '../../assets/logo.jpeg';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // This message will appear in the browser console when the button is clicked
    console.log("Login button clicked, attempting to navigate to /login");
    navigate('/login');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  // Basic styles to make the button wrapper invisible
  const logoButtonStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };

  return (
    <header className={styles.header}>
      {/* The logo is now wrapped in a button that navigates to the login page */}
      <button onClick={handleLoginClick} style={logoButtonStyle}>
        <img src={logo} alt="Clean Street Logo" className={styles.logo} />
      </button>
      
      <nav className={styles.nav}>
        <button onClick={handleHomeClick} className={styles.navLink} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
          Home
        </button>
        <a href="#contact" className={styles.navLink}>contact</a>
        <button onClick={handleLoginClick} className={styles.navLink} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
          login
        </button>
      </nav>
    </header>
  );
};

export default Header;

