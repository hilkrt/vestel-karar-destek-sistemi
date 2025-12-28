const Anomaly = require('../models/Anomaly');

class AnomalyController {
  // Anormallikler sayfası (HTML)
  static async getPage(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const level = req.query.level; // high, medium, low
      
      let anomalies;
      if (level) {
        anomalies = await Anomaly.findByLevel(level);
      } else {
        anomalies = await Anomaly.findAll(limit);
      }

      res.render('anomalies/index', {
        title: 'Anormallikler',
        anomalies: anomalies || [],
        currentLevel: level || 'all'
      });
    } catch (error) {
      console.error('Anormallik sayfası hatası:', error);
      res.status(500).render('error', {
        message: 'Anormallikler yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  // Tüm anormallikleri getir (API - JSON)
  static async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const anomalies = await Anomaly.findAll(limit);
      res.json({ success: true, data: anomalies });
    } catch (error) {
      console.error('Anormallik listeleme hatası:', error);
      res.status(500).json({ success: false, message: 'Anormallikler yüklenirken hata oluştu' });
    }
  }

  // ID'ye göre getir
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const anomaly = await Anomaly.findById(id);
      
      if (!anomaly) {
        return res.status(404).json({ success: false, message: 'Anormallik bulunamadı' });
      }
      
      res.json({ success: true, data: anomaly });
    } catch (error) {
      console.error('Anormallik getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Anormallik yüklenirken hata oluştu' });
    }
  }

  // Seviyeye göre filtrele
  static async getByLevel(req, res) {
    try {
      const { level } = req.params;
      const anomalies = await Anomaly.findByLevel(level);
      res.json({ success: true, data: anomalies });
    } catch (error) {
      console.error('Anormallik filtreleme hatası:', error);
      res.status(500).json({ success: false, message: 'Anormallikler filtrelenirken hata oluştu' });
    }
  }
}

module.exports = AnomalyController;

