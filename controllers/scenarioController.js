const Scenario = require('../models/Scenario');
const Department = require('../models/Department');
const EnergyMonthly = require('../models/EnergyMonthly');

class ScenarioController {
  // Senaryo karar destek sayfası
  static async getPage(req, res) {
    try {
      const scenarios = await Scenario.findAll();
      const departments = await Department.findAll();
      
      // Mevcut tüketim verilerini getir (karşılaştırma için)
      const dashboardData = await EnergyMonthly.getDashboardData();
      
      // Tüm unique ayları getir (ay seçim dropdown'ı için)
      const allMonths = await EnergyMonthly.getAllUniqueMonths();
      
      // Trend grafiği için tüm aylık verileri getir
      const allMonthsData = await EnergyMonthly.getAllMonthsData();
      
      // En son ay verilerini al (karşılaştırma için temel)
      const latestMonthData = dashboardData.length > 0 
        ? dashboardData[0] 
        : null;

      res.render('scenarios/index', {
        title: 'Senaryo Analizi ve Karar Desteği',
        scenarios,
        departments,
        latestMonthData,
        dashboardData: dashboardData.slice(0, 12), // Son 12 ay (eski kullanım için)
        allMonths, // Tüm aylar (ay seçim dropdown'ı için)
        allMonthsData // Trend grafiği için tüm aylık veriler
      });
    } catch (error) {
      console.error('Senaryo sayfası hatası:', error);
      res.status(500).render('error', {
        message: 'Senaryo verileri yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  // Senaryo karşılaştırması API
  static async compare(req, res) {
    try {
      const { scenarioIds, departmentId, monthKey } = req.body;
      
      if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length === 0) {
        return res.status(400).json({ success: false, message: 'En az bir senaryo seçmelisiniz' });
      }

      // Temel veriyi getir
      let baseData;
      let data;
      
      // month_key normalizasyon fonksiyonu
      const normalizeMonthKey = (key) => {
        if (!key) return null;
        // Date objesi ise
        if (key instanceof Date) {
          const year = key.getFullYear();
          const month = String(key.getMonth() + 1).padStart(2, '0');
          return `${year}-${month}-01`;
        }
        // String ise, YYYY-MM-01 formatına çevir
        const str = String(key);
        // Eğer zaten YYYY-MM-DD formatındaysa, YYYY-MM-01'e çevir
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.substring(0, 7) + '-01';
        }
        // Date parse etmeyi dene
        try {
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}-01`;
          }
        } catch (e) {
          console.error('Date parse hatası:', e);
        }
        return str;
      };
      
      if (monthKey) {
        // Belirli bir ay seçilmişse, o ay için veri getir
        const normalizedMonthKey = normalizeMonthKey(monthKey);
        console.log('[ScenarioController.compare] Seçilen monthKey (normalize edildi):', normalizedMonthKey);
        
        data = await EnergyMonthly.getDashboardDataForMonth(normalizedMonthKey);
        console.log('[ScenarioController.compare] Seçilen ay için getirilen veri sayısı:', data.length);
        
        if (departmentId) {
          // Belirli departman ve ay için
          baseData = data.find(d => String(d.department_id) === String(departmentId));
          if (baseData) {
            console.log('[ScenarioController.compare] Belirli departman için veri bulundu:', {
              departmentId,
              monthKey: normalizedMonthKey,
              total_cost_tl: baseData.total_cost_tl
            });
          }
        } else {
          // Tüm departmanların toplamı (belirli ay)
          if (data.length > 0) {
            baseData = {
              total_kwh: data.reduce((sum, d) => sum + parseFloat(d.total_kwh || 0), 0),
              total_cost_tl: data.reduce((sum, d) => sum + parseFloat(d.total_cost_tl || 0), 0),
              total_co2_kg: data.reduce((sum, d) => sum + parseFloat(d.total_co2_kg || 0), 0)
            };
            console.log('[ScenarioController.compare] Tüm departmanların toplamı (seçilen ay):', baseData);
          }
        }
      } else {
        // Ay seçilmemişse, en güncel ay için veri getir
        data = await EnergyMonthly.getDashboardData();
        
        if (departmentId) {
          // Sadece departman için (en son ay)
          baseData = data.find(d => String(d.department_id) === String(departmentId));
        } else {
          // Tüm departmanların toplamı (en son ay)
          if (data.length > 0) {
            baseData = {
              total_kwh: data.reduce((sum, d) => sum + parseFloat(d.total_kwh || 0), 0),
              total_cost_tl: data.reduce((sum, d) => sum + parseFloat(d.total_cost_tl || 0), 0),
              total_co2_kg: data.reduce((sum, d) => sum + parseFloat(d.total_co2_kg || 0), 0)
            };
          }
        }
      }

      // baseData yoksa veya 0 ise, güvenli varsayılan değerler kullan
      if (!baseData || (!baseData.total_kwh && !baseData.total_cost_tl && !baseData.total_co2_kg)) {
        console.warn('⚠️ baseData bulunamadı veya 0, varsayılan değerler kullanılıyor');
        baseData = {
          total_kwh: 0,
          total_cost_tl: 0,
          total_co2_kg: 0
        };
      }
      
      // baseData değerlerini güvenli hale getir (null/undefined -> 0)
      baseData.total_kwh = parseFloat(baseData.total_kwh || 0);
      baseData.total_cost_tl = parseFloat(baseData.total_cost_tl || 0);
      baseData.total_co2_kg = parseFloat(baseData.total_co2_kg || 0);

      // departmentId'yi normalize et (boş string, null, undefined kontrolü)
      const normalizedDepartmentId = (departmentId && departmentId !== '' && departmentId !== 'null' && departmentId !== 'undefined') 
        ? (typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId) 
        : null;
      
      console.log('[ScenarioController.compare] departmentId normalize edildi:', { 
        original: departmentId, 
        normalized: normalizedDepartmentId 
      });

      const comparisons = await Scenario.compareScenarios(scenarioIds, normalizedDepartmentId, baseData);

      res.json({
        success: true,
        data: {
          baseData,
          comparisons
        }
      });
    } catch (error) {
      console.error('Senaryo karşılaştırma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Senaryo karşılaştırması yapılırken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Tüm senaryoları getir (API)
  static async getAll(req, res) {
    try {
      const scenarios = await Scenario.findAll();
      res.json({ success: true, data: scenarios });
    } catch (error) {
      console.error('Senaryo listeleme hatası:', error);
      res.status(500).json({ success: false, message: 'Senaryolar yüklenirken hata oluştu' });
    }
  }

  // Senaryo getir (tek)
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const scenario = await Scenario.findById(id);
      
      if (scenario) {
        res.json({ success: true, data: scenario });
      } else {
        res.status(404).json({ success: false, message: 'Senaryo bulunamadı' });
      }
    } catch (error) {
      console.error('Senaryo getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Senaryo getirilirken hata oluştu' });
    }
  }

  // Yeni senaryo oluştur
  static async create(req, res) {
    try {
      const { scenario_name, action_type, expected_reduction_pct, description, investment_cost, difficulty_level, implementation_period_months } = req.body;
      
      console.log('Senaryo oluşturma isteği:', req.body);
      
      if (!scenario_name || expected_reduction_pct === undefined || expected_reduction_pct === null) {
        return res.status(400).json({ success: false, message: 'Senaryo adı ve beklenen azalma yüzdesi zorunludur' });
      }

      // expected_reduction_pct zaten frontend'de parse edilmiş olmalı, ama yine de kontrol edelim
      const parsedReduction = typeof expected_reduction_pct === 'number' ? expected_reduction_pct : parseFloat(expected_reduction_pct);
      if (isNaN(parsedReduction)) {
        return res.status(400).json({ success: false, message: 'Beklenen azalma yüzdesi geçerli bir sayı olmalıdır' });
      }

      // action_type'ı veritabanı formatına çevir (uzun Türkçe isimlerden kısa kodlara)
      const actionTypeMap = {
        'Aydınlatma İyileştirme': 'lighting',
        'HVAC Optimizasyonu': 'hvac',
        'Ekipman Değişimi': 'equipment',
        'İzolasyon İyileştirme': 'insulation',
        'Enerji Yönetim Sistemi': 'ems',
        'Yenilenebilir Enerji': 'renewable',
        'Zamanlama Optimizasyonu': 'scheduling',
        'Bakım Programı': 'maintenance',
        'Akıllı Sensör Sistemi': 'sensors',
        'Enerji Verimliliği Eğitimi': 'training'
      };
      
      // Eğer action_type uzun Türkçe ise, kısa koda çevir
      // Trim yaparak boşlukları temizle ve mapping'i kontrol et
      const trimmedActionType = action_type ? action_type.trim() : null;
      
      if (!trimmedActionType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Aksiyon tipi seçilmelidir' 
        });
      }
      
      // Mapping'de var mı kontrol et - hem orijinal hem de trimmed versiyonu dene
      let mappedActionType = actionTypeMap[trimmedActionType];
      
      // Eğer mapping'de bulunamadıysa, orijinal değeri de dene
      if (!mappedActionType && action_type !== trimmedActionType) {
        mappedActionType = actionTypeMap[action_type];
      }
      
      // Hala bulunamadıysa ve değer zaten kısa bir kod gibi görünüyorsa (örn: 'lighting', 'hvac'), direkt kullan
      if (!mappedActionType) {
        // Kısa kod mu kontrol et (10 karakterden kısa ve sadece küçük harf/rakam)
        if (trimmedActionType.length <= 20 && /^[a-z0-9_]+$/i.test(trimmedActionType)) {
          mappedActionType = trimmedActionType.toLowerCase();
          console.log('Action type zaten kısa kod gibi görünüyor, direkt kullanılıyor:', mappedActionType);
        } else {
          console.error('Bilinmeyen action_type:', trimmedActionType);
          console.error('Orijinal action_type:', action_type);
          console.error('Mevcut mapping keys:', Object.keys(actionTypeMap));
          return res.status(400).json({ 
            success: false, 
            message: `Geçersiz aksiyon tipi: "${trimmedActionType}". Lütfen listeden bir seçenek seçin.` 
          });
        }
      }
      
      console.log('Action type mapping:', {
        original: action_type,
        trimmed: trimmedActionType,
        mapped: mappedActionType,
        inMap: true
      });
      
      // Description null ise boş string'e çevir (veritabanı NOT NULL ise)
      const descriptionValue = description && description.trim() ? description.trim() : '';
      
      // Sadece veritabanında mevcut olan sütunları gönder
      const scenarioId = await Scenario.create({
        scenario_name,
        action_type: mappedActionType,
        expected_reduction_pct: parsedReduction,
        description: descriptionValue
        // investment_cost, difficulty_level, implementation_period_months veritabanında yok
        // Bu değerler calculateDecisionMetrics fonksiyonunda varsayılan değerlerle hesaplanıyor
      });

      res.status(201).json({ 
        success: true, 
        data: { scenario_id: scenarioId }, 
        message: 'Senaryo başarıyla oluşturuldu' 
      });
    } catch (error) {
      console.error('Senaryo oluşturma hatası:', error);
      console.error('Hata detayları:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Senaryo oluşturulurken hata oluştu: ' + error.message,
        error: error.message
      });
    }
  }

  // Senaryo güncelle
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { scenario_name, action_type, expected_reduction_pct, description } = req.body;
      
      if (!scenario_name || expected_reduction_pct === undefined) {
        return res.status(400).json({ success: false, message: 'Senaryo adı ve beklenen azalma yüzdesi zorunludur' });
      }

      // action_type'ı veritabanı formatına çevir (uzun Türkçe isimlerden kısa kodlara)
      const actionTypeMap = {
        'Aydınlatma İyileştirme': 'lighting',
        'HVAC Optimizasyonu': 'hvac',
        'Ekipman Değişimi': 'equipment',
        'İzolasyon İyileştirme': 'insulation',
        'Enerji Yönetim Sistemi': 'ems',
        'Yenilenebilir Enerji': 'renewable',
        'Zamanlama Optimizasyonu': 'scheduling',
        'Bakım Programı': 'maintenance',
        'Akıllı Sensör Sistemi': 'sensors',
        'Enerji Verimliliği Eğitimi': 'training'
      };
      
      // Trim yaparak boşlukları temizle ve mapping'i kontrol et
      const trimmedActionType = action_type ? action_type.trim() : null;
      
      if (!trimmedActionType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Aksiyon tipi seçilmelidir' 
        });
      }
      
      // Mapping'de var mı kontrol et - hem orijinal hem de trimmed versiyonu dene
      let mappedActionType = actionTypeMap[trimmedActionType];
      
      // Eğer mapping'de bulunamadıysa, orijinal değeri de dene
      if (!mappedActionType && action_type !== trimmedActionType) {
        mappedActionType = actionTypeMap[action_type];
      }
      
      // Hala bulunamadıysa ve değer zaten kısa bir kod gibi görünüyorsa (örn: 'lighting', 'hvac'), direkt kullan
      if (!mappedActionType) {
        // Kısa kod mu kontrol et (20 karakterden kısa ve sadece küçük harf/rakam)
        if (trimmedActionType.length <= 20 && /^[a-z0-9_]+$/i.test(trimmedActionType)) {
          mappedActionType = trimmedActionType.toLowerCase();
          console.log('Action type zaten kısa kod gibi görünüyor (update), direkt kullanılıyor:', mappedActionType);
        } else {
          console.error('Bilinmeyen action_type (update):', trimmedActionType);
          console.error('Orijinal action_type (update):', action_type);
          console.error('Mevcut mapping keys:', Object.keys(actionTypeMap));
          return res.status(400).json({ 
            success: false, 
            message: `Geçersiz aksiyon tipi: "${trimmedActionType}". Lütfen listeden bir seçenek seçin.` 
          });
        }
      }
      
      console.log('Action type mapping (update):', {
        original: action_type,
        trimmed: trimmedActionType,
        mapped: mappedActionType,
        inMap: true
      });

      // Description null ise boş string'e çevir (veritabanı NOT NULL ise)
      const descriptionValue = description && description.trim() ? description.trim() : '';
      
      // Sadece veritabanında mevcut olan sütunları gönder
      const updated = await Scenario.update(id, {
        scenario_name,
        action_type: mappedActionType,
        expected_reduction_pct: parseFloat(expected_reduction_pct),
        description: descriptionValue
        // investment_cost, difficulty_level, implementation_period_months veritabanında yok
      });

      if (updated) {
        res.json({ success: true, message: 'Senaryo başarıyla güncellendi' });
      } else {
        res.status(404).json({ success: false, message: 'Senaryo bulunamadı' });
      }
    } catch (error) {
      console.error('Senaryo güncelleme hatası:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Senaryo güncellenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Senaryo sil
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Scenario.delete(id);

      if (deleted) {
        res.json({ success: true, message: 'Senaryo başarıyla silindi' });
      } else {
        res.status(404).json({ success: false, message: 'Senaryo bulunamadı' });
      }
    } catch (error) {
      console.error('Senaryo silme hatası:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Senaryo silinirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Senaryo uygula
  static async apply(req, res) {
    try {
      const appliedId = await Scenario.apply(req.body);
      res.status(201).json({ success: true, data: { applied_id: appliedId }, message: 'Senaryo başarıyla uygulandı' });
    } catch (error) {
      console.error('Senaryo uygulama hatası:', error);
      res.status(500).json({ success: false, message: 'Senaryo uygulanırken hata oluştu' });
    }
  }
}

module.exports = ScenarioController;

