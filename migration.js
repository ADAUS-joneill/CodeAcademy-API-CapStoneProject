// Define external libraries
const sqlite3 = require('sqlite3');

// Establish database connection
const db = new sqlite3.Database('./database.sqlite');

// Utilise db.serialize - Create tables and indices
db.serialize( () => {
    db.run('CREATE TABLE IF NOT EXISTS `Employee` ( ' +
        '`id` INTEGER NOT NULL, ' +
        '`name` TEXT NOT NULL, ' +
        '`position` TEXT NOT NULL, ' +
        '`wage` TEXT NOT NULL, ' +
        '`is_current_employee` INTEGER NOT NULL DEFAULT 1, ' +
        'PRIMARY KEY(`id`) )');

    db.run('CREATE TABLE IF NOT EXISTS `Timesheet` ( ' +
        '`id` INTEGER NOT NULL, ' +
        '`name` TEXT, ' +
        '`description` TEXT, ' +
        '`hours` INTEGER NOT NULL, ' +
        '`rate` INTEGER NOT NULL, ' +
        '`date` INTEGER NOT NULL, ' +
        '`employee_id` INTEGER NOT NULL, ' +
        'PRIMARY KEY(`id`), ' +
        'FOREIGN KEY(`employee_id`) REFERENCES Employee(`id`) )');

    db.run('CREATE TABLE IF NOT EXISTS `Menu` ( ' +
        '`id` INTEGER NOT NULL, ' +
        '`title` TEXT NOT NULL, ' +
        'PRIMARY KEY(`id`) )');

    db.run('CREATE TABLE IF NOT EXISTS `MenuItem` ( ' +
        '`id` INTEGER NOT NULL, ' +
        '`name` TEXT NOT NULL, ' +
        '`description` TEXT, ' +
        '`inventory` INTEGER NOT NULL, ' +
        '`price` INTEGER NOT NULL, ' +
        '`menu_id` INTEGER NOT NULL, ' +
        'PRIMARY KEY(`id`), ' +
        'FOREIGN KEY(`menu_id`) REFERENCES `Menu`(`id`) )');
});