// Define external libraries
const express = require('express');
const menuRouter = express.Router();
const menuitemsRouter = require('./menuitems');
const sqlite3 = require('sqlite3');

// Load Routes
menuRouter.use('/:menuId/menu-items', menuitemsRouter);

// Establish database connection
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Define helper function, validate menus
const validateMenu = (req, res, next) => {
    //Check truthiness of supplied fields
    const menu = req.body.menu;
    if (!menu.title) {
        return res.sendStatus(400); // Not Valid
    }
    next();  // Call next step in stack
}

// Define menu ID handling
menuRouter.param('menuId', (req, res, next, menuId) => {
    // Set up SQL text
    const sql_text = 'SELECT * FROM Menu WHERE id = $id';
    const transpose = { $id: menuId };
    db.get(sql_text, transpose, (err, menu) => {
        if (err) { // Check truthiness of err
            next(err); // Put err onto stack
        } else if (menu) {  // Check truthiness of menu
            req.menu = menu; // Add menu object to request 
            if (req.method === 'DELETE' &&
                !req.url.includes('/menu-items')) {
                // Method is 'DELETE' and context does not include menu items
                // Check to see if there are any Menu Items in the database for this menu Id
                // Need to ensure that orphan menu items are not created by deleting a Menu

                // Execute SQL command
                db.all('SELECT * FROM MenuItem WHERE menu_id = $id', // db.all will return an array
                    { $id: menuId },
                    (err, menuItemArray) => {
                        if (menuItemArray.length != 0  ) { // non zero length indicates menuItem records were located
                        res.sendStatus(400); // return status '400'
                    } else {
                        next(); // proceed with the rest of teh stack
                    }
                });
            } else {
                next();  // proceed with rest of stack
            }
        } else {
            res.sendStatus(404); // Not Valud
        }
    });
});

menuRouter.get('/', (req, res, next) => {
    //Define SQL Query text
    const sql_text = 'SELECT * FROM Menu';

    // Execute SQL command
    db.all(sql_text, (err, foundMenus) => {
        //Check truthiness of err
        if (err) {
            next(err); // pass err onto stack
        } else {
            //GET sould return status '200' and menu object
            res.status(200).json({ menus: foundMenus })
        }
    });
});

menuRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({ menu: req.menu });  // menu object already in request object by param handler
});

menuRouter.post('/', validateMenu, (req, res, next) => {
    //Define locally scoped variable to handle request body data
    const menu = req.body.menu;

    //Prepare SQL query text
    const sql_text = `INSERT INTO Menu(title) VALUES ($title)`;
    const transpose = {
        $title: menu.title
    };

    // Execute SQL command
    db.run(sql_text, transpose, function (err) {  // Cannot use arrow notation as ${this.lastId} is used
        //Check truthiness of err
        if (err) {
            next(err); // pass err onto stack
        }
        //GET should return status '201' and record just added
        db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, newMenu) => {
            res.status(201).json({ menu: newMenu });
        });
    });
});

menuRouter.put('/:menuId', validateMenu, (req, res, next) => {
    //Define locally scoped variable to handle request body data
    const menu = req.body.menu;

    //Prepare SQL query text
    const sql_text = 'UPDATE Menu SET title = $title ' +
        ' WHERE Menu.id = $id';
    const transpose = {
        $title: menu.title,
        $id: req.params.menuId
    };

    // Execute SQL command
    db.run(sql_text, transpose, err => {
        //Check truthiness of err
        if (err) {
            next(err); // put err onto stack
        }
        //PUT method should return status '200' and updated object
        db.get('SELECT * FROM Menu WHERE id = $id',
            { $id: req.params.menuId },
            (err, data) => {
            res.status(200).json({ menu: data });
        });
    });
});

menuRouter.delete('/:menuId', (req, res, next) => {
    //Prepare SQL query text
    const sql_text = 'DELETE FROM Menu WHERE Menu.id = $id';
    const transpose = { $id: req.params.menuId };

    // Execute SQL command
    db.run(sql_text, transpose, err => {
        if (err) {  // Check truthiness of err
            next(err); // pass err onto stack
        }
        res.sendStatus(204);
    });
});

//Export module
module.exports = menuRouter;