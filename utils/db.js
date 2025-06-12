const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();

// Kiểm tra kết nối
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Kết nối MySQL thất bại: ', err.message);
    } else {
        console.log('Kết nối MySQL thành công!');
        connection.release();
    }
});