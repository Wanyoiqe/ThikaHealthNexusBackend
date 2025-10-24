require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const configs = require('./config.json');

// Routes
const dbRoute = require('./routes/dbRoute');
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const providerRoutes = require('./routes/providerRoutes');
const consentRoutes = require('./routes/consentRoutes');




const app = express();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:8080',       // your React frontend (dev)
  'http://127.0.0.1:8080',
  'https://your-production-domain.com', // add your deployed frontend here
  'https://thikahealth.vercel.app',     // example
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g. mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy does not allow access from origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // allow cookies, auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use([dbRoute, userRoutes,appointmentRoutes,providerRoutes,consentRoutes]);

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