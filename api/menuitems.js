// Define external libraries
const express = require('express');
const menuitemsRouter = express.Router();
const sqlite3 = require('sqlite3');

// Establish database connection
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Define employee ID Handling
menuitemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const sql_text = 'SELECT * FROM MenuItem WHERE id = $id';
    //Protect against SQL Injections
    const transpose = { $id: menuItemId };
    db.get(sql_text, transpose, (err, menuItem) => {
        if (err) {  // Check truthiness of err
            next(err); // pass err onto stack
        } else if (menuItem) { // check truthiness of menuItem object returned by SQL query
            req.menuItem = menuItem; // Add to Request object
            next();  // Call next routine in stack
        } else {
            res.sendStatus(404);  // not valid, return status '404'
        }
    });
});

// Define Helper Function - Verify menuItem contains valid data
const validateMenuItem = (req, res, next) => {
    const menuItem = req.body.menuItem;
    // Check truthiness of menuItem fields
    if (!menuItem.name ||
        !menuItem.description ||
        !menuItem.inventory ||
        !menuItem.price) {
        return res.sendStatus(400); // not valid, return status '400'
    }
    next(); // Call next step in stack
}

// Define Route Handling
menuitemsRouter.get('/', (req, res, next) => {
    //Define SQL text
    const sql_text = `SELECT * FROM MenuItem WHERE menu_id = ${req.menu.id}`;  // menu ID already passed to request object
    db.all(sql_text, (err, data) => {
        if (err) {  // Check truthiness of err
            next(err); // pass err onto stack
        } else {
            //GET returns status '200' and requested object
            res.status(200).json({ menuItems: data })
        }
    });
});

menuitemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
    // Set scoped variable to represent menuItem object in request body
    const updatedMenuItem = req.body.menuItem;

    // Define SQL Text
    const sql_text = 'UPDATE MenuItem SET name = $name, ' +  // use SET notation
        'description = $description, ' +
        'inventory = $inventory, ' +
        'price = $price, ' +
        'menu_id = $menu_id ' +
        ' WHERE id = $id';
    const transpose = {
        $name: updatedMenuItem.name,
        $description: updatedMenuItem.description,
        $inventory: updatedMenuItem.inventory,
        $price: updatedMenuItem.price,
        $menu_id: req.menu.id,
        $id: req.params.menuItemId
    };
    db.run(sql_text, transpose, err => {
        //Check truthiness of err
        if (err) {
            next(err); // put err onto stack
        }
        //PUT should return status '200' and updated menuitem
        db.get('SELECT * FROM MenuItem WHERE id = $id',
            { $id: req.params.menuItemId },
            (err, updated_record) => {
            res.status(200).json({ menuItem: updated_record });
        });
    });
});

menuitemsRouter.post('/', validateMenuItem, (req, res, next) => {
    // Set scoped variable to represent menuItem object in request body
    const menuItem = req.body.menuItem;

    // Set up SQL text
    const sql_text = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)';
    const transpose = {
        $name: menuItem.name,
        $description: menuItem.description,
        $inventory: menuItem.inventory,
        $price: menuItem.price,
        $menu_id: req.menu.id
    };
    db.run(sql_text, transpose, function (err) { // Cannot use arror notation as ${this.lastID} is needed
        //Check Truthiness of err
        if (err) {
            next(err); // put err onto stack
        }
        //POST should send status '201' and created object
        db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (err, data) => {
            res.status(201).json({ menuItem: data });
        });
    });
});

menuitemsRouter.delete('/:menuItemId', (req, res, next) => {
    // Define SQL Text
    const sql_text = 'DELETE FROM MenuItem WHERE id = $id';
    const transpose = { $id: req.params.menuItemId };
    db.run(sql_text, transpose, err => {
        if (err) {  // Check truthiness of err
            next(err); // pass err onto stack
        }
        //Delete function should return status of '204' if the database record was actually deleted
        db.get('SELECT * FROM MenuItem WHERE id = $id',
            { $id: req.params.menuItemId },
            (err, existsMenuItem) => {
                if (!existsMenuItem) {
                    res.sendStatus(204); // Record successfully deleted
                }  
                else {
                    res.sendStatus(404); // Record not deleted
                };
        });
    });
});

// Export module
module.exports = menuitemsRouter;