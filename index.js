// A new file for our backend server.
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const usersRouter = require('./routes/users');
const nowpaymentsRouter = require('./routes/nowpayments');
app.use('/users', usersRouter);
app.use('/nowpayments', nowpaymentsRouter);

// --- Deployment ---
// This code enables the Express server to serve the built React application.

// 1. Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../build')));

// 2. For any request that doesn't match an API route, send back the React index.html file.
// This allows React Router to handle the routing on the client side.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});
// --- End Deployment ---

app.get('/', (req, res) => {
  res.send('Bootlegger backend is running!');
});

app.listen(port, 'localhost', () => {
  console.log(`Server is running on port: ${port}`);
}); 
