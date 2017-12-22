// Load External Libraries
const express = require('express');
const timesheetsRouter = express.Router();
const sqlite3 = require('sqlite3');

// Establish Database Connection
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Define Parameter routes
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    //Define SQL query text
    const sql = 'SELECT * FROM Timesheet WHERE id = $id';
    const values = { $id: timesheetId };

    // Execute SQL Command
    db.get(sql, values, (err, timesheet) => {
        if (err) { // Check truthiness of err
            next(err); // Add err to stack
        } else if (timesheet) {  // Check truthiness of timesheet
            req.timesheet = timesheet; // add timesheet to reqeuest object
            next(); // proceed with stack
        } else {
            res.sendStatus(404); // invlaid timesheetID
        }
    });
});

// Define Helper functions
const validateTimeSheet = (req, res, next) => {
    //Define constant representing timesheet from request body
    const timesheet = req.body.timesheet;
    // Check truthiness of required fields
    if (!timesheet.date ||
        !timesheet.hours ||
        !timesheet.rate) {
        return res.sendStatus(400); // One or more required fields is blank
    }
    next();  // Proceed with Stack, valid field values
}

// Define Routes
timesheetsRouter.get('/', (req, res, next) => {
    //Define SQL Query text
    const sql_text = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId';
    const transpose = { $employeeId: req.employee.id };

    // Execute SQL command
    db.all(sql_text, transpose, (err, foundTimeSheet) => {
        if (err) {  // check truthiness of err
            next(err); // add err to stack
        } else {
            //GET should return status '200' and object for Timesheet
            res.status(200).json({ timesheets: foundTimeSheet })
        }
    });
});

timesheetsRouter.put('/:timesheetId', validateTimeSheet, (req, res, next) => {
    //Define constant to hold timesheet data from request body
    const timesheet = req.body.timesheet;

    //Define SQL Query text
    const sql_text = 'UPDATE Timesheet SET hours = $hours, ' +
        'rate = $rate, ' +
        'date = $date, ' +
        'employee_id = $employee_id ' +
        ' WHERE id = $id';
    const transpose = {
        $hours: timesheet.hours,
        $rate: timesheet.rate,
        $date: timesheet.date,
        $employee_id: req.employee.id,
        $id: req.params.timesheetId
    };

    // Execute SQL command
    db.run(sql_text, transpose, err => {
        //Check truthiness of err
        if (err) {
            next(err); //Add err to stack
        }
        //PUT method should return status '200' and updated data 
        // Execute SQL command
        db.get('SELECT * FROM Timesheet WHERE id = $id',
            { $id: req.params.timesheetId },
            (err, updatedTimeSheet) => {
                res.status(200).json({ timesheet: updatedTimeSheet });
        });
    });
});

timesheetsRouter.post('/', validateTimeSheet, (req, res, next) => {
    //Define locally scoped variable to hold timesheet data from request body
    const timesheet = req.body.timesheet;

    // Define SQL query text
    const sql_text = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)';
    const transpose = {
        $hours: timesheet.hours,
        $rate: timesheet.rate,
        $date: timesheet.date,
        $employee_id: req.employee.id
    };

    // Execute SQL command
    db.run(sql_text, transpose, function (err) { // Cannot use arrow notation as ${this.lastID} is used
        //Check truthiness of err
        if (err) {
            next(err); // Put err onto stack
        }
        //POST should return status '201' and TimeSheet data 
        db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
            (err, data) => {
                res.status(201).json({ timesheet: data });
        });
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    //Define SQL Query text
    const sql_text = 'DELETE FROM Timesheet WHERE id = $id';
    const transpose = { $id: req.params.timesheetId };

    // Execute SQL command
    db.run(sql_text, transpose, err => {
        if (err) { // Check truthiness of err
            next(err);  // Add err to stack
        }
        //DELETE should return status of '204'
        res.sendStatus(204);
    });
});

//Export module
module.exports = timesheetsRouter;