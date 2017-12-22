// Define external libraries
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const express = require('express');
const apiRouter = require('./api/api');

// Instantiate Express
const app = express();

// Set up PORT 
const PORT = process.env.PORT || 4000;

// Load external dependencies
app.use(bodyParser.json());
app.use(cors());
app.use(errorhandler());

// Load router for API calls
app.use('/api', apiRouter);

// Establish Listening Port
app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
});

// Export module
module.exports = app;