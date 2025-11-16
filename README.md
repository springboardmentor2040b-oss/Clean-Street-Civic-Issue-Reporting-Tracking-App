🧹 Clean Street – Civic Issue Reporting & Tracking System
👥 Team: Team-1
👩‍💻 Team Lead: Sindhu Sekar
📚 Internship: Infosys Springboard Virtual Internship 6.0
📌 1. Introduction

Clean Street is a full-stack web application designed to help citizens report civic issues and enable authorities to track, manage, and resolve them efficiently.
This project showcases end-to-end development skills including UI design, API development, security implementation, and deployment readiness.

🎯 2. Project Objectives

📝 Allow citizens to report street-related issues easily

🔍 Enable admin/volunteers to track and manage complaints

🔒 Provide secure authentication and structured APIs

📱 Deliver a clean and responsive user interface

🛠️ 3. Technology Stack
🎨 Frontend

React (Vite)

TailwindCSS

Axios

React Router DOM

⚙️ Backend

Node.js + Express

MongoDB + Mongoose

JWT Authentication

Cloudinary (Image Uploads)

⭐ 4. Key Features
👤 User

Register & login

File new complaints with images

Track status (Pending → In Progress → Resolved)

View submission history

🛠️ Admin / Volunteer

View all complaints

Assign volunteers

Update complaint status

Manage users & issue flow

🚀 5. Setup Instructions
🖥️ Backend Setup
cd back-end
npm install
npm run dev


Backend .env

MONGO_URI=your_mongo_url
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

🌐 Frontend Setup
cd front-end
npm install
npm run dev


Frontend .env

VITE_BACKEND_URL=http://localhost:5000

📂 6. Project Structure
back-end/
  controllers/
  models/
  routes/
  middleware/
  server.js

front-end/
  src/
    components/
    pages/
    api/
    App.jsx
    main.jsx

🔎 7. Additional Notes

Code is modular and structured for readability

Branch: team_1_sindhu_lead contains the final project submission done by Team 1

All features were collaboratively developed and tested
