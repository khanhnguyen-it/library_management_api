const fs = require('fs');
const path = require('path');

const log = (message) => {
    const logPath = path.join(__dirname, '../logs/app.log');
    const time = new Date().toISOString();
    const fullMessage = `[${time}] ${message}\n`;
    fs.appendFileSync(logPath, fullMessage);
    console.log(fullMessage);
};

const error = (errMessage) => {
    const logPath = path.join(__dirname, '../logs/error.log');
    const time = new Date().toISOString();
    const fullMessage = `[${time}] ERROR: ${errMessage}\n`;
    fs.appendFileSync(logPath, fullMessage);
    console.error(fullMessage);
};

module.exports = { log, error };