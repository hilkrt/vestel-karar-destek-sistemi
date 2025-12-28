const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session yapılandırması
app.use(session({
  secret: process.env.SESSION_SECRET || 'vestel-karar-destek-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // HTTPS için true yapılmalı
}));

// View engine yapılandırması (EJS kullanıyoruz)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static dosyalar (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Veritabanı bağlantısını test et
const db = require('./config/database');

// Routes
const routes = require('./routes');
app.use('/', routes);

// 404 hatası
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Sayfa bulunamadı',
    error: {}
  });
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error('Hata:', err);
  res.status(500).render('error', {
    message: 'Bir hata oluştu',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`Ortam: ${process.env.NODE_ENV || 'development'}`);
});










