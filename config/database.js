const mysql = require('mysql2');

// Veritabanı bağlantı havuzu oluştur
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 8889,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hilergy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise tabanlı query için pool.promise() kullan
const promisePool = pool.promise();

// Bağlantı testi
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
    return;
  }
  console.log('Veritabanına başarıyla bağlanıldı!');
  connection.release();
});

module.exports = promisePool;

