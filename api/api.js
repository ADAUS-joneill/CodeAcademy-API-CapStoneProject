// Define external libraries
const express = require('express');
const apiRouter = express.Router();

// Define routers
const employeeRouter = require('./employees');
const menuRouter = require('./menus');

// Load Routers
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/menus', menuRouter);

// Export Module
module.exports = apiRouter;