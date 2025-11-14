import React from 'react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import { FiInfo, FiTarget, FiUsers } from 'react-icons/fi';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow animate-fade-in-up">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-10 max-w-8xl mx-auto">
                    <header className="text-center mb-8 border-b border-gray-200 pb-6">
                        <FiInfo className="mx-auto text-5xl text-indigo-500 mb-4" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
                            About Clean Street
                        </h1>
                        <p className="text-gray-600 mt-2 text-base">Connecting communities for a cleaner tomorrow.</p>
                    </header>

                    <section className="space-y-6 text-gray-700 leading-relaxed px-4">
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200/60">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <FiTarget className="text-blue-600" /> Our Mission
                            </h2>
                            <p>
                                Clean Street is dedicated to empowering citizens to take an active role in maintaining and improving the cleanliness of their neighborhoods. We believe that by providing an easy-to-use platform for reporting and tracking local environmental issues, we can foster collaboration between residents, volunteers, and local authorities to create cleaner, healthier, and more vibrant communities.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200/60">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <FiUsers className="text-green-600" /> Who We Are
                            </h2>
                            <p>
                                We are a community-focused initiative leveraging technology to address common urban challenges like garbage disposal, road damage, and infrastructure maintenance. Our platform connects people who care about their local environment with the resources and channels needed to make a tangible difference.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AboutPage;
