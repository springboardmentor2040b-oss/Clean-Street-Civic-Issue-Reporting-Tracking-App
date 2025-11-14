import React from 'react';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import { FiHelpCircle, FiEdit3, FiEye, FiTool, FiUserCheck } from 'react-icons/fi';

const HowItWorksPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col transition-colors duration-300">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow animate-fade-in-up">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-10 max-w-8xl mx-auto">
                    <header className="text-center mb-8 border-b border-gray-200 pb-6">
                        <FiHelpCircle className="mx-auto text-5xl text-indigo-500 mb-4" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
                            How Clean Street Works
                        </h1>
                        <p className="text-gray-600 mt-2 text-base">Simple steps to make a big impact.</p>
                    </header>

                    <section className="space-y-6 px-16 text-gray-700 leading-relaxed">
                        <div className='bg-gray-50 rounded-2xl p-6 border border-gray-200/60'>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FiEdit3 className="text-blue-600" /> 1. Report an Issue
                            </h2>
                            <p>
                                See a problem like overflowing bins, potholes, or broken streetlights? Use our simple reporting form. Pinpoint the location on the map, add a description, select the issue type and priority, and optionally upload a photo. Your detailed report helps volunteers and authorities act faster.
                            </p>
                        </div>
                        <div className='bg-gray-50 rounded-2xl p-6 border border-gray-200/60'>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FiEye className="text-purple-600" /> 2. Track Progress
                            </h2>
                            <p>
                                Once submitted, you can track the status of your report (Pending, In Review, Resolved) directly from your personalized User Dashboard. You can also view reports submitted by others in the Community Reports section. Engage in discussions by adding comments to reports.
                            </p>
                        </div>
                         <div className='bg-gray-50 rounded-2xl p-6 border border-gray-200/60'>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FiTool className="text-orange-600" /> 3. Volunteer Action
                            </h2>
                            <p>
                                Registered volunteers can view nearby pending issues on their Volunteer Dashboard. They can assign tasks to themselves, update the status as they work on resolving the issue (e.g., changing it to "In Progress" or "Resolved"), and help keep the community informed.
                            </p>
                        </div>
                         <div className='bg-gray-50 rounded-2xl p-6 border border-gray-200/60'>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <FiUserCheck className="text-green-600" /> 4. Admin Oversight
                            </h2>
                            <p>
                                Administrators have an overview of all users and complaints. They can manage user roles, monitor the overall progress of issue resolution, and potentially coordinate larger efforts or escalate issues to relevant authorities when necessary.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HowItWorksPage;
