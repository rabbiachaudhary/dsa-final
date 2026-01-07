require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

// CORS configuration - allow production frontend URLs
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      // Add your Vercel/Netlify URLs here after deployment
      process.env.FRONTEND_URL,
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Running');
});

// Routes
app.use('/api/auth', require('./controllers/auth'));
app.use('/api/sessions', require('./controllers/session'));
app.use('/api/sections', require('./controllers/section'));
app.use('/api/students', require('./controllers/student'));
app.use('/api/rooms', require('./controllers/room'));
app.use('/api/timeslots', require('./controllers/timeslot'));
app.use('/api/constraints', require('./controllers/constraint'));
app.use('/api/plans', require('./controllers/plan'));
app.use('/api/pdf', require('./controllers/pdf'));
app.use('/api/capacity', require('./controllers/capacity'));

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
