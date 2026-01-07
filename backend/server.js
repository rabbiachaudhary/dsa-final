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

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, prefer explicit allowlist.
    // If FRONTEND_URL isn't set yet (first deploy), allow all to avoid blocking.
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      return callback(null, true);
    }

    // Allow main frontend URL + Vercel preview URLs (optional)
    const allowed =
      origin === frontendUrl ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app');

    if (allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
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
