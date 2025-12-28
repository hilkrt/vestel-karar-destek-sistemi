const Anomaly = require('../models/Anomaly');
const Suggestion = require('../models/Suggestion');

class WhatToDoController {
  // Ne Yapılmalı sayfası
  static async getPage(req, res) {
    try {
      // Anormallikleri getir
      const anomalies = await Anomaly.findAll(50);
      
      // Önerileri getir
      const suggestions = await Suggestion.findAll(50);
      
      res.render('what-to-do/index', {
        title: 'Ne Yapılmalı',
        anomalies,
        suggestions
      });
    } catch (error) {
      console.error('Ne Yapılmalı sayfası hatası:', error);
      res.status(500).render('error', {
        message: 'Ne Yapılmalı sayfası yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }
}

module.exports = WhatToDoController;


