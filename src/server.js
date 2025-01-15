require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const mongoose = require('./app/config/db.config');
const initSocket = require('./app/config/socket.config');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

// Initialize Socket.IO
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
