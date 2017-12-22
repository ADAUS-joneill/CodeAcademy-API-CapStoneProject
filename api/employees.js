// Define external libraries
const express = require('express');
const employeeRouter = express.Router();
const timesheetsRouter = require('./timesheets');
const sqlite3 = require('sqlite3');

// Establish database connection
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Load TimeSheet Router
employeeRouter.use('/:employeeId/timesheets/', timesheetsRouter);

// Define employee ID Handling
employeeRouter.param('employeeId', (req, res, next, employeeId) => {
    // Set up SQL Text
    const sql_text = 'SELECT * FROM Employee WHERE id = $id';

    // Set up transposition 
    const transpose = { $id: employeeId };

    // Execute SQL Command
    db.get(sql_text, transpose, (err, employee) => {
        if (err) { // Check truthiness of err
            next(err); // pass err onto stack
        } else if (employee) {
            // Add employee to request object before moving on into stack
            req.employee = employee;
            next();
        } else {
            res.sendStatus(404); // Not Found
        }
    });
});

// Define Helper Function - Verify employee contains valid data
const verifyEmployee = (req, res, next) => {
    const employee = req.body.employee;
    if (!employee.name || !employee.wage || !employee.position) {
        return res.sendStatus(400); // Send Error 400 
    }
    next(); // Proceed to next place in stack
}

// Define Route Handling
employeeRouter.get('/', (req, res, next) => {
    // Set up SQL Text
    const sql_text = 'SELECT * FROM Employee WHERE is_current_employee = 1';

    // Execute SQL Command
    db.all(sql_text, (err, data) => {
        //Check Truthiness of err
        if (err) {
            next(err); // Pass err onto stack
        } else {
            //GET method should send status of '200' and Employee object 
            res.status(200).json({ employees: data })
        }
    });
});

employeeRouter.get('/:employeeId', (req, res, next) => {
    // EmployeeID param handler takes care of verifying this, simply
    // return object to caller with employee 
    res.status(200).json({ employee: req.employee });
});

employeeRouter.post('/', verifyEmployee, (req, res, next) => {
    //Get employee from req, prepare sql & values
    const employee = req.body.employee; // already populated
    const sql_text = `INSERT INTO Employee(name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $is_current_employee)`;
    const transpose = {
        $name: employee.name,
        $position: employee.position,
        $wage: employee.wage,
        $is_current_employee: 1
    };

    // Execute SQL Command
    db.run(sql_text, transpose, function (err) {  // Can not use Arrow Notation here as need to use ${this.lastID}
        // Check 'truthiness' of err object
        if (err) {
            next(err);
        }
        // POST method should return a 201 status and the just created object
        db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`,
            (err, data) => {
              res.status(201).json({ employee: data });
        });
    });
});

employeeRouter.put('/:employeeId', verifyEmployee, (req, res, next) => {
    const employee = req.body.employee;

    // Set up SQL query Text, use the SET notation
    const sql_text = 'UPDATE Employee SET name = $name, ' +
        'position = $position, ' +
        'wage = $wage, ' +
        'is_current_employee = $is_current_employee ' +
        ' WHERE Employee.id = $id';
    const transpose = {
        $name: employee.name,
        $position: employee.position,
        $wage: employee.wage,
        $is_current_employee: 1,
        $id: req.params.employeeId
    };

    // Execute SQL Command
    db.run(sql_text, transpose, err => { 
        //Checke 'truthiness' of err
        if (err) {
            next(err); // Pass Error onto stack
        }
        // PUT method should return a 200 status and the just updated object
        db.get('SELECT * FROM Employee WHERE id = $id',
            { $id: req.params.employeeId },
            (err, updated_employee) => {
              res.status(200).json({ employee: updated_employee });
        });
    });
});

employeeRouter.delete('/:employeeId', (req, res, next) => {
    // Set up SQL query Text, use the SET notation
    const sql_text = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $id';
    const transpose = { $id: req.params.employeeId };

    // Execute SQL Command
    db.run(sql_text, transpose, err => {
        if (err) {   // Check 'Truthiness' of err
            next(err);  // Pass err onto stack
        }
        //DELETE should return status '200' and employee record that was deleted
        db.get('SELECT * FROM Employee WHERE id = $id', { $id: req.params.employeeId }, (err, data) => {
            res.status(200).json({ employee: data });
        });
    });
});

// Export the module
module.exports = employeeRouter;