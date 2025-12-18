require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();
connectDB();

app.use(cors());
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
