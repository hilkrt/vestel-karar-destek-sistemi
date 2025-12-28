const Department = require('../models/Department');
const EnergyMonthly = require('../models/EnergyMonthly');

class DepartmentController {
  // Departmanlar sayfası
  static async getPage(req, res) {
    try {
      const departments = await Department.findAllWithInactive();
      // Tüm ayların verilerini getir (sadece son ay değil)
      const allMonthsData = await EnergyMonthly.getAllMonthsData();
      
      res.render('departments/index', {
        title: 'Departmanlar',
        departments,
        dashboardData: allMonthsData
      });
    } catch (error) {
      console.error('Departmanlar sayfası hatası:', error);
      res.status(500).render('error', {
        message: 'Departmanlar sayfası yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  // Tüm departmanları listele
  static async getAll(req, res) {
    try {
      const departments = await Department.findAll();
      res.json({ success: true, data: departments });
    } catch (error) {
      console.error('Departman listeleme hatası:', error);
      res.status(500).json({ success: false, message: 'Departmanlar yüklenirken hata oluştu' });
    }
  }

  // Tek departman getir
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const department = await Department.findById(id);
      
      if (!department) {
        return res.status(404).json({ success: false, message: 'Departman bulunamadı' });
      }
      
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Departman getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Departman yüklenirken hata oluştu' });
    }
  }

  // Yeni departman oluştur
  static async create(req, res) {
    try {
      const departmentId = await Department.create(req.body);
      res.status(201).json({ success: true, data: { department_id: departmentId }, message: 'Departman başarıyla oluşturuldu' });
    } catch (error) {
      console.error('Departman oluşturma hatası:', error);
      res.status(500).json({ success: false, message: 'Departman oluşturulurken hata oluştu' });
    }
  }

  // Departman güncelle
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await Department.update(id, req.body);
      
      if (updated) {
        res.json({ success: true, message: 'Departman başarıyla güncellendi' });
      } else {
        res.status(404).json({ success: false, message: 'Departman bulunamadı' });
      }
    } catch (error) {
      console.error('Departman güncelleme hatası:', error);
      res.status(500).json({ success: false, message: 'Departman güncellenirken hata oluştu' });
    }
  }

  // Departman durumunu değiştir (aktif/pasif)
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      if (active === undefined || (active !== 0 && active !== 1)) {
        return res.status(400).json({ success: false, message: 'Aktif durumu geçerli değil (0 veya 1 olmalı)' });
      }

      const updated = await Department.toggleActive(id, active);
      
      if (updated) {
        res.json({ 
          success: true, 
          message: active === 1 ? 'Departman aktif yapıldı' : 'Departman pasif yapıldı' 
        });
      } else {
        res.status(404).json({ success: false, message: 'Departman bulunamadı' });
      }
    } catch (error) {
      console.error('Departman durumu değiştirme hatası:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Departman durumu değiştirilirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Departman sil
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await Department.delete(id);
      res.json({ success: true, message: 'Departman başarıyla silindi' });
    } catch (error) {
      console.error('Departman silme hatası:', error);
      res.status(500).json({ success: false, message: 'Departman silinirken hata oluştu' });
    }
  }
}

module.exports = DepartmentController;

