const EnergyType = require('../models/EnergyType');

class EnergyTypeController {
  // Tüm enerji türlerini getir
  static async getAll(req, res) {
    try {
      const data = await EnergyType.findAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Enerji türü listeleme hatası:', error);
      res.status(500).json({ success: false, message: 'Enerji türleri yüklenirken hata oluştu' });
    }
  }

  // ID'ye göre getir
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await EnergyType.findById(id);
      
      if (!data) {
        return res.status(404).json({ success: false, message: 'Enerji türü bulunamadı' });
      }
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Enerji türü getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Enerji türü yüklenirken hata oluştu' });
    }
  }
}

module.exports = EnergyTypeController;








