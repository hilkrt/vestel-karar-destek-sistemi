const Suggestion = require('../models/Suggestion');

class SuggestionController {
  // Öneriler sayfası (HTML)
  static async getPage(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const suggestions = await Suggestion.findAll(limit);

      res.render('suggestions/index', {
        title: 'Enerji Tasarrufu Önerileri',
        suggestions: suggestions || []
      });
    } catch (error) {
      console.error('Öneriler sayfası hatası:', error);
      res.status(500).render('error', {
        message: 'Öneriler yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  // Tüm önerileri getir (API - JSON)
  static async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const suggestions = await Suggestion.findAll(limit);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Öneri listeleme hatası:', error);
      res.status(500).json({ success: false, message: 'Öneriler yüklenirken hata oluştu' });
    }
  }

  // ID'ye göre getir
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const suggestion = await Suggestion.findById(id);
      
      if (!suggestion) {
        return res.status(404).json({ success: false, message: 'Öneri bulunamadı' });
      }
      
      res.json({ success: true, data: suggestion });
    } catch (error) {
      console.error('Öneri getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Öneri yüklenirken hata oluştu' });
    }
  }

  // Departman bazında getir
  static async getByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const suggestions = await Suggestion.findByDepartment(departmentId);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Departman önerileri getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Öneriler yüklenirken hata oluştu' });
    }
  }

  // Öneri güncelle
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, suggested_employee_reduction, auto_calculate } = req.body;
      
      if (!title || !suggestion_text) {
        return res.status(400).json({ success: false, message: 'Başlık ve öneri metni zorunludur' });
      }

      const updated = await Suggestion.update(id, {
        title,
        suggestion_text,
        expected_saving_kwh: parseFloat(expected_saving_kwh) || 0,
        expected_saving_tl: parseFloat(expected_saving_tl) || 0,
        expected_saving_co2_kg: parseFloat(expected_saving_co2_kg) || 0,
        suggested_employee_reduction: suggested_employee_reduction ? parseInt(suggested_employee_reduction) : null,
        auto_calculate: auto_calculate === true || auto_calculate === 'true'
      });

      if (updated) {
        res.json({ success: true, message: 'Öneri başarıyla güncellendi' });
      } else {
        res.status(404).json({ success: false, message: 'Öneri bulunamadı' });
      }
    } catch (error) {
      console.error('Öneri güncelleme hatası:', error);
      res.status(500).json({ success: false, message: 'Öneri güncellenirken hata oluştu: ' + error.message });
    }
  }
}

module.exports = SuggestionController;

