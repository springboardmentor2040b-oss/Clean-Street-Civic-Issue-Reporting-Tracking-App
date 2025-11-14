// src/Components/Footer.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const Footer = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
  }, []); 

  
  return (
    <footer 
      className="footer-theme py-12" 
      style={{
        // === FIXED: Changed .jpeg to .jpg ===
        backgroundImage: `url(/images/navbar.jpg)`,
        // Applies a 70% dark overlay so the text is readable
        backgroundBlendMode: 'multiply',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        // Ensures the image covers the whole footer
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Logo and Slogan */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex-shrink-0">
                <img className="h-24 w-auto" src="/images/logo.png" alt="Clean Street Logo" />
            </Link>
            <p className="mt-2 text-sm max-w-xs">
              Empowering citizens to take an active role in maintaining and improving the cleanliness of their neighborhoods.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <nav className="space-y-2">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/how-it-works">How It Works</FooterLink>
              <FooterLink to="/services">Services</FooterLink>
              <FooterLink to="/view-complaints">View Reports</FooterLink>
            </nav>
          </div>

          {/* Column 3: Get Started (Dynamic) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Get Started</h3>
            
            {user ? (
              // LOGGED-IN VIEW
              <p className="text-sm">
                we can foster collaboration between residents, volunteers, and local authorities to create cleaner, healthier, and more vibrant communities.
              </p>
            ) : (
              // LOGGED-OUT VIEW
              <>
                <p className="text-sm mb-4">
                  Ready to make a difference? Join the community today.
                </p>
                <Link
                  to="/register"
                  className="btn-theme-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                  Get Started <FiArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-theme-light text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Clean Street Initiative. Made with ❤️ for a cleaner community.</p>
        </div>
      </div>
    </footer>
  );
}

// Helper component for footer links
const FooterLink = ({ to, children }) => (
  <Link 
    to={to} 
    className="text-sm link-theme transition-colors duration-200 block"
  >
    {children}
  </Link>
);

export default Footer;