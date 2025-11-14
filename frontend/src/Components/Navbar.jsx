// src/Components/Navbar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
// ADDED FiEye to this list
import { FiGrid, FiFilePlus, FiEye, FiUser, FiLogOut, FiShield, FiMenu, FiX, FiChevronDown, FiInfo, FiHelpCircle, FiSettings, FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
    const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const aboutDropdownRef = useRef(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("user");
            if (stored) setUser(JSON.parse(stored));
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target) && !event.target.closest('#profile-menu-button')) {
                setIsProfileMenuOpen(false);
            }
            if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target) && !event.target.closest('#about-dropdown-button')) {
                setIsAboutDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('#mobile-menu-button')) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsProfileMenuOpen(false);
        setIsMenuOpen(false);
        navigate('/login');
    };

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
        setIsMobileAboutOpen(false);
    };
    const toggleProfileMenu = () => setIsProfileMenuOpen(prev => !prev);
    const toggleMobileMenu = () => setIsMenuOpen(prev => !prev);
    const toggleAboutDropdown = () => setIsAboutDropdownOpen(prev => !prev);
    const toggleMobileAbout = () => setIsMobileAboutOpen(prev => !prev);

    const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 shadow-sm border-b transition-colors duration-300 ${
                isDarkMode 
                    ? 'bg-[#001D3D]/95 backdrop-blur-xl border-[#003566]/60' 
                    : 'bg-white/70 backdrop-blur-xl border-gray-200/60'
            }`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link to="/" onClick={closeMobileMenu} className="flex-shrink-0 transition-transform duration-300 ease-out hover:scale-105 group">
                            <img className="h-16 w-auto transition-filter duration-300 group-hover:brightness-110" src="/images/logo.png" alt="Clean Street Logo" />
                        </Link>

                        <div className='flex justify-end'>
                            {/* === CONDITIONAL NAVIGATION LINKS === */}
                            <div className="hidden lg:flex items-center space-x-2 mr-4">
                                {user ? (
                                    // Logged-in Links
                                    <>
                                    
                                        <NavLink to="/UserDashboard"><FiGrid /><span>Complaint Dashboard</span></NavLink>
                                        {user.role === "volunteer" && (
                                            <NavLink to="/VolunteerDashboard"><FiGrid /><span>Volunteer Panel</span></NavLink>
                                        )}
                                        {user.role === "admin" && (
                                            <NavLink to="/AdminDashboard"><FiShield /><span>Admin Panel</span></NavLink>
                                        )}
                                        <NavLink to="/ReportIssue"><FiFilePlus /><span>Report Issue</span></NavLink>
                                        <NavLink to="/view-complaints"><FiEye /><span>View Complaints</span></NavLink>
                                    </>
                                ) : (
                                    // Logged-out Links with About Us Dropdown
                                    <>
                                        <div className="relative" ref={aboutDropdownRef}>
                                            <button
                                                id="about-dropdown-button"
                                                onClick={toggleAboutDropdown}
                                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 group ${
                                                    isDarkMode
                                                        ? 'text-white hover:text-[#FFC300] hover:bg-[#003566]/50'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                                aria-label="About Us menu"
                                                aria-haspopup="true"
                                                aria-expanded={isAboutDropdownOpen}
                                            >
                                                <FiInfo />
                                                <span>About Us</span>
                                                <FiChevronDown size={16} className={`transition-transform duration-200 ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                                                } ${isAboutDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            <div
                                                className={`absolute left-0 mt-2 w-56 origin-top-left rounded-lg shadow-xl py-2 border focus:outline-none transition-all duration-200 ease-out ${
                                                    isDarkMode 
                                                        ? 'bg-[#001D3D] border-[#003566]' 
                                                        : 'bg-white border-gray-200'
                                                } ${isAboutDropdownOpen ? 'opacity-100 scale-100 visible z-[60]' : 'opacity-0 scale-95 invisible'}`}
                                                role="menu"
                                                aria-orientation="vertical"
                                                aria-labelledby="about-dropdown-button"
                                            >
                                                <DropdownLink to="/about" icon={<FiInfo />} onClick={() => setIsAboutDropdownOpen(false)}>About Page</DropdownLink>
                                                <DropdownLink to="/how-it-works" icon={<FiHelpCircle />} onClick={() => setIsAboutDropdownOpen(false)}>How It Works</DropdownLink>
                                                <DropdownLink to="/services" icon={<FiSettings />} onClick={() => setIsAboutDropdownOpen(false)}>Services</DropdownLink>
                                                {/* === ADDED THIS LINE === */}
                                                <DropdownLink to="/view-complaints" icon={<FiEye />} onClick={() => setIsAboutDropdownOpen(false)}>View Reports</DropdownLink>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Right side: Theme Toggle, Auth buttons or User Profile */}
                            <div className="flex items-center gap-4">
                                {/* Theme Toggle Button */}
                                <button
                                    onClick={toggleTheme}
                                    className={`hidden lg:flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                                        isDarkMode
                                            ? 'bg-[#FFC300] text-black hover:bg-[#FFD60A]'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                    aria-label="Toggle theme"
                                >
                                    {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                                </button>
                                
                                {user ? (
                                    <div className="relative" ref={profileMenuRef}>
                                        <button
                                            id="profile-menu-button"
                                            onClick={toggleProfileMenu}
                                            className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                            aria-label="User menu" aria-haspopup="true" aria-expanded={isProfileMenuOpen}
                                        >
                                            {user.profilePhoto ? (
                                                <img src={user.profilePhoto} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg uppercase font-semibold shadow-sm border-2 border-white">
                                                    {initial}
                                                </div>
                                            )}
                                            <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.name}</span>
                                            <FiChevronDown size={16} className={`hidden sm:inline text-gray-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div
                                            className={`absolute right-0 mt-3 w-60 origin-top-right rounded-lg shadow-lg py-2 z-50 border focus:outline-none transition-all duration-200 ease-out ${
                                                isDarkMode 
                                                    ? 'bg-[#001D3D] border-[#003566]' 
                                                    : 'bg-white border-gray-100'
                                            } ${isProfileMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                                            role="menu" aria-orientation="vertical" aria-labelledby="profile-menu-button" tabIndex="-1"
                                        >
                                            <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-[#003566]' : 'border-gray-100'}`}>
                                                <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.name}</p>
                                                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                                            </div>
                                            <div className="py-1" role="none">
                                                <ProfileMenuItem to="/profile" icon={<FiUser />} onClick={toggleProfileMenu}>My Profile</ProfileMenuItem>
                                                <ProfileMenuItem icon={<FiLogOut />} onClick={handleLogout} isLogout>Logout</ProfileMenuItem>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="hidden lg:flex items-center gap-2">
                                        <AuthButton to="/login" secondary>Login</AuthButton>
                                        {/* === CHANGED "Register" to "Get Started" === */}
                                        <AuthButton to="/register">Get Started</AuthButton>
                                    </div>
                                )}

                                <button
                                    id="mobile-menu-button"
                                    className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                                    onClick={toggleMobileMenu}
                                    aria-label="Toggle menu" aria-controls="mobile-menu" aria-expanded={isMenuOpen}
                                >
                                    {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Menu Panel */}
            <div
                ref={mobileMenuRef} id="mobile-menu"
                className={`fixed top-0 right-0 h-full w-72 shadow-xl z-40 lg:hidden transform transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                } ${
                    isDarkMode ? 'bg-[#001D3D]' : 'bg-white'
                }`}
                role="dialog" aria-modal="true"
            >
                <div className={`flex justify-between items-center p-4 border-b h-20 ${
                    isDarkMode ? 'border-[#003566]' : 'border-gray-200'
                }`}>
                    <span className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Menu</span>
                    <button
                        className={`p-2 rounded-md transition-colors ${
                            isDarkMode 
                                ? 'text-gray-300 hover:bg-[#003566] hover:text-white' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                        onClick={closeMobileMenu}
                        aria-label="Close menu"
                    >
                        <FiX size={24} />
                    </button>
                </div>
                
                {/* Theme Toggle in Mobile Menu */}
                <div className="px-3 pt-4 pb-2">
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-all duration-300 ${
                            isDarkMode
                                ? 'bg-[#FFC300] text-black hover:bg-[#FFD60A]'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        <span className="font-medium">
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                        {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>
                </div>
                
                <nav className="px-3 pt-2 pb-4 space-y-1">
                    {/* === CONDITIONAL MOBILE LINKS === */}
                    {user ? (
                        // Logged-in Mobile Links
                        <>
                            <MobileNavLink to="/UserDashboard" onClick={closeMobileMenu}><FiGrid /><span>Dashboard</span></MobileNavLink>
                            {user.role === "volunteer" && (
                                <MobileNavLink to="/VolunteerDashboard" onClick={closeMobileMenu}><FiGrid /><span>Volunteer Board</span></MobileNavLink>
                            )}
                            {user.role === "admin" && (
                                <MobileNavLink to="/AdminDashboard" onClick={closeMobileMenu}><FiShield /><span>Admin Panel</span></MobileNavLink>
                            )}
                            <MobileNavLink to="/ReportIssue" onClick={closeMobileMenu}><FiFilePlus /><span>Report Issue</span></MobileNavLink>
                            <MobileNavLink to="/view-complaints" onClick={closeMobileMenu}><FiEye /><span>View Complaints</span></MobileNavLink>

                            <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-[#003566]' : 'border-gray-100'}`}>
                                <MobileNavLink to="/profile" onClick={closeMobileMenu}><FiUser /><span>My Profile</span></MobileNavLink>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-base font-medium rounded-md transition-colors duration-200 ${
                                        isDarkMode
                                            ? 'text-red-400 hover:bg-red-900/30'
                                            : 'text-red-600 hover:bg-red-50'
                                    }`}
                                >
                                    <FiLogOut /><span>Logout</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        // Logged-out Mobile Links with About Us Accordion
                        <>
                            <div>
                                <button
                                    onClick={toggleMobileAbout}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-base font-medium rounded-md transition-colors duration-200 ${
                                        isDarkMode
                                            ? 'text-white hover:bg-[#003566]/50 hover:text-[#FFC300]'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FiInfo />
                                        <span>About Us</span>
                                    </div>
                                    <FiChevronDown size={18} className={`transition-transform duration-200 ${isMobileAboutOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* === INCREASED max-h-48 to max-h-64 === */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileAboutOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="pl-8 py-1 space-y-1">
                                        <MobileNavLink to="/about" onClick={closeMobileMenu}><FiInfo /><span>About Page</span></MobileNavLink>
                                        <MobileNavLink to="/how-it-works" onClick={closeMobileMenu}><FiHelpCircle /><span>How It Works</span></MobileNavLink>
                                        <MobileNavLink to="/services" onClick={closeMobileMenu}><FiSettings /><span>Services</span></MobileNavLink>
                                        {/* === ADDED THIS LINE === */}
                                        <MobileNavLink to="/view-complaints" onClick={closeMobileMenu}><FiEye /><span>View Reports</span></MobileNavLink>
                                    </div>
                                </div>
                            </div>
                            <div className={`pt-4 mt-4 border-t ${isDarkMode ? 'border-[#003566]' : 'border-gray-100'}`}>
                                <MobileNavLink to="/login" onClick={closeMobileMenu}>Login</MobileNavLink>
                                {/* === CHANGED "Register" to "Get Started" === */}
                                <MobileNavLink to="/register" onClick={closeMobileMenu}>Get Started</MobileNavLink>
                            </div>
                        </>
                    )}
                </nav>
            </div>
            {isMenuOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={closeMobileMenu}></div>}
            <div className="h-20" />
        </>
    );
};

// --- Reusable Sub-components (Keep NavLink, MobileNavLink, AuthButton, ProfileMenuItem as they were) ---
const NavLink = ({ to, children }) => {
    const location = useLocation();
    const { isDarkMode } = useTheme();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 group ${
                isDarkMode
                    ? isActive
                        ? 'text-[#FFC300] bg-[#003566]'
                        : 'text-white hover:text-[#FFC300] hover:bg-[#003566]/50'
                    : isActive
                        ? 'text-indigo-800 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-1000 hover:bg-blue-100/90'
            }`}
        >
            {children}

            <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ease-out origin-center ${
                    isDarkMode ? 'bg-[#FFC300]' : 'bg-indigo-600'
                } ${isActive ? 'scale-x-75 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-100'}`}
                aria-hidden="true"
            ></span>
        </Link>
    );
};

const MobileNavLink = ({ to, children, onClick }) => {
    const location = useLocation();
    const { isDarkMode } = useTheme();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 text-base font-medium rounded-md transition-colors duration-200 ${
                isDarkMode
                    ? isActive
                        ? 'text-[#FFC300] bg-[#003566]'
                        : 'text-white hover:bg-[#003566]/50 hover:text-[#FFC300]'
                    : isActive
                        ? 'text-indigo-700 bg-indigo-100'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            {children}
        </Link>
    );
};

const AuthButton = ({ to, children, secondary = false, onClick, fullWidth = false }) => {
    const { isDarkMode } = useTheme();
    
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`px-5 py-2 rounded-md font-semibold text-sm transition-all duration-200 ease-out transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${fullWidth ? 'w-full' : ''}
                ${isDarkMode
                    ? secondary
                        ? 'bg-[#ffffff] text-black hover:bg-[#004080] hover:text-white border border-[#ffffff]/80 shadow-sm focus:ring-[#4CC9F0]'
                        : 'bg-[#FFC300] text-black shadow hover:shadow-md hover:bg-[#FFD60A] focus:ring-[#FFC300]'
                    : secondary
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200/80 shadow-sm focus:ring-indigo-500'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:shadow-md hover:from-blue-700 hover:to-indigo-700 focus:ring-indigo-500'
                }`}
        >
            {children}
        </Link>
    );
};

const ProfileMenuItem = ({ to, icon, children, onClick, isLogout = false }) => {
    const { isDarkMode } = useTheme();

    const baseClasses = `w-full text-left px-4 py-2 flex items-center gap-2.5 transition-colors duration-150 text-sm`;
    const normalClasses = isDarkMode
        ? `font-medium text-white hover:bg-[#003566] hover:text-[#FFC300] rounded-md mx-1`
        : `font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md mx-1`;
    const logoutClasses = isDarkMode
        ? `font-medium text-red-400 hover:bg-red-900/30 rounded-md mx-1`
        : `font-medium text-red-600 hover:bg-red-50 rounded-md mx-1`;

    const className = `${baseClasses} ${isLogout ? logoutClasses : normalClasses}`;

    return to ? (
        <Link to={to} className={className} onClick={onClick} role="menuitem" tabIndex="-1">{icon}{children}</Link>
    ) : (
        <button className={className} onClick={onClick} role="menuitem" tabIndex="-1">{icon}{children}</button>
    );
};

const DropdownLink = ({ to, icon, children, onClick }) => {
    const location = useLocation();
    const { isDarkMode } = useTheme();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors duration-150 text-sm font-medium rounded-md mx-1 ${
                isDarkMode
                    ? isActive
                        ? 'text-[#FFC300] bg-[#003566]'
                        : 'text-white hover:bg-[#003566]/50 hover:text-[#FFC300]'
                    : isActive
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            role="menuitem"
        >
            {icon}
            {children}
        </Link>
    );
};

export default Navbar;