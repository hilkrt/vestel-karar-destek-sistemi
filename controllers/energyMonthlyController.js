const EnergyMonthly = require('../models/EnergyMonthly');

class EnergyMonthlyController {
  // Tüm aylık verileri getir
  static async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const data = await EnergyMonthly.findAll(limit, offset);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Enerji aylık veri listeleme hatası:', error);
      res.status(500).json({ success: false, message: 'Veriler yüklenirken hata oluştu' });
    }
  }

  // ID'ye göre getir
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await EnergyMonthly.findById(id);
      
      if (!data) {
        return res.status(404).json({ success: false, message: 'Kayıt bulunamadı' });
      }
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Enerji aylık veri getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Veri yüklenirken hata oluştu' });
    }
  }

  // Yeni kayıt oluştur
  static async create(req, res) {
    try {
      console.log('Enerji verisi oluşturma isteği:', req.body);
      const monthlyId = await EnergyMonthly.create(req.body);
      res.status(201).json({ success: true, data: { monthly_id: monthlyId }, message: 'Kayıt başarıyla oluşturuldu' });
    } catch (error) {
      console.error('Enerji aylık veri oluşturma hatası:', error);
      console.error('Hata detayı:', error.message);
      console.error('Hata stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Kayıt oluşturulurken hata oluştu: ' + (error.message || 'Bilinmeyen hata') 
      });
    }
  }
}

module.exports = EnergyMonthlyController;




