require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const configs = require('./config.json');

// Routes
const dbRoute = require('./routes/dbRoute');
const userRoutes = require('./routes/userRoutes');


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use([dbRoute, userRoutes]);

// 404 error handling
app.post('*', function (req, res) { // Changed to POST for consistency
	res.status(404).json({
		message: 'Incorrect routes, kindly check on your documentation.',
	});
});
//declare health end point
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'UP' });
});

// An error handling middleware
app.use((err, req, res, next) => {
	console.error('Error Handler:', err);
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';
	res.status(err.statusCode).json({
		result_status: err.status,
		result_code: 0,
		message: err.message,
		err: err,
	});
});

// Run the server
const port = process.env.PORT || configs.port;
var httpServer = http.createServer(app);
httpServer.listen(port);

console.log(`✅ App listening on http://localhost:${port}`);