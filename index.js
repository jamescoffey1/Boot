// Backend server
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000; // Render provides PORT

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// Routes
const usersRouter = require('./routes/users');
const nowpaymentsRouter = require('./routes/nowpayments');
app.use('/users', usersRouter);
app.use('/nowpayments', nowpaymentsRouter);

// Serve React build (frontend)
app.use(express.static(path.join(__dirname, '../build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Test route
app.get('/', (req, res) => {
  res.send('Bootlegger backend is running!');
});

// Listen on Render port and all network interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port: ${port}`);
});
