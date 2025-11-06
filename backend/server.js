// require('dotenv').config();
// const express = require('express');
// const connectDB = require('./config/db');
// const session = require('express-session');
// const cors = require('cors');
// const MongoStore = require('connect-mongo');
// const path = require('path');

// const userRoutes = require('./routes/userRoutes');
// const issueRoutes = require('./routes/issueRoutes');

// const app = express();

// // ✅ Connect to MongoDB
// connectDB();

// // ==========================
// // Middleware
// // ==========================

// // Increase JSON payload limit to handle Base64 images
// app.use(express.json({ limit: '10mb' })); // Accept JSON up to 10MB
// app.use(express.urlencoded({ limit: '10mb', extended: true }));

// // Enable CORS
// app.use(
//   cors({
//     origin: 'http://localhost:3000',
//     credentials: true,
//   })
// );

// // Session middleware
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || 'defaultsecret',
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGO_URI,
//       collectionName: 'sessions',
//     }),
//     cookie: {
//       secure: false,
//       httpOnly: true,
//       sameSite: 'lax',
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     },
//   })
// );

// // Serve static uploads folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Test route
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// // Mount user routes
// app.use('/api/users', userRoutes);

// // Mount issue routes
// app.use('/api/issues', issueRoutes);

// // Start server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const session = require('express-session');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('API is running...'));

app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
