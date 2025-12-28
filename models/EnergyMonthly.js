const db = require('../config/database');

class EnergyMonthly {
  // Tüm aylık enerji verilerini getir
  static async findAll(limit = 100, offset = 0) {
    const [rows] = await db.execute(
      `SELECT em.*, d.department_name, et.energy_name 
       FROM energy_monthly em
       LEFT JOIN departments d ON em.department_id = d.department_id
       LEFT JOIN energy_types et ON em.energy_type_id = et.energy_type_id
       ORDER BY em.month_key DESC, d.department_name
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  // ID'ye göre getir
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT em.*, d.department_name, et.energy_name 
       FROM energy_monthly em
       LEFT JOIN departments d ON em.department_id = d.department_id
       LEFT JOIN energy_types et ON em.energy_type_id = et.energy_type_id
       WHERE em.monthly_id = ?`,
      [id]
    );
    return rows[0];
  }

  // Departman ve ay bazında getir
  static async findByDepartmentAndMonth(departmentId, monthKey) {
    const [rows] = await db.execute(
      `SELECT em.*, d.department_name, et.energy_name 
       FROM energy_monthly em
       LEFT JOIN departments d ON em.department_id = d.department_id
       LEFT JOIN energy_types et ON em.energy_type_id = et.energy_type_id
       WHERE em.department_id = ? AND em.month_key = ?`,
      [departmentId, monthKey]
    );
    return rows;
  }

  // Aylık veri ekle (UNIQUE constraint için güvenli - duplicate varsa UPDATE yapar)
  static async create(energyData) {
    const { department_id, energy_type_id, month_key, consumption_kwh, cost_tl, co2_kg } = energyData;
    
    // NULL değerleri 0'a çevir
    const safeConsumption = consumption_kwh != null ? consumption_kwh : 0;
    const safeCost = cost_tl != null ? cost_tl : 0;
    const safeCo2 = co2_kg != null ? co2_kg : 0;
    
    try {
      // INSERT ... ON DUPLICATE KEY UPDATE kullanarak güvenli ekleme
      const [result] = await db.execute(
        `INSERT INTO energy_monthly (department_id, energy_type_id, month_key, consumption_kwh, cost_tl, co2_kg) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           consumption_kwh = VALUES(consumption_kwh),
           cost_tl = VALUES(cost_tl),
           co2_kg = VALUES(co2_kg),
           created_at = COALESCE(created_at, NOW())`,
        [department_id, energy_type_id, month_key, safeConsumption, safeCost, safeCo2]
      );
      return result.insertId || result.affectedRows; // INSERT ID veya affected rows döner
    } catch (error) {
      // Eğer UNIQUE constraint yoksa, normal INSERT yap
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
        // Zaten var, update yap
        const [updateResult] = await db.execute(
          `UPDATE energy_monthly 
           SET consumption_kwh = ?, cost_tl = ?, co2_kg = ?
           WHERE department_id = ? AND energy_type_id = ? AND month_key = ?`,
          [safeConsumption, safeCost, safeCo2, department_id, energy_type_id, month_key]
        );
        return updateResult.affectedRows;
      }
      throw error;
    }
  }

  // Dashboard görünümünü getir - Departman bazında aylık toplam değerler
  // Tüm aktif departmanların verisi olan en güncel ayı bulur ve o ay için tüm aktif departmanları döner
  static async getDashboardData() {
    // v_dashboard_monthly_dept view'ını kullanmıyoruz çünkü LEFT JOIN ile tüm departmanları garanti etmemiz gerekiyor
    // View sadece verisi olan departmanları döndürebilir
    /*
    try {
      // Önce v_dashboard_monthly_dept view'ını kullanmaya çalış
      const [rows] = await db.execute('SELECT * FROM v_dashboard_monthly_dept ORDER BY month_key DESC, department_name');
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (error) {
      console.log('v_dashboard_monthly_dept view bulunamadı veya hata:', error.message);
    }
    */
    
    // 1. Aktif departman sayısını bul
    const [activeDeptCountResult] = await db.execute('SELECT COUNT(*) as count FROM departments WHERE active = 1');
    const activeDeptCount = activeDeptCountResult[0].count;
    
    if (activeDeptCount === 0) {
      console.log('⚠️ Aktif departman bulunamadı');
      return [];
    }
    
    // 2. Tüm aktif departmanların verisi olan en güncel ayı bul
    // Her ay için o ayda verisi olan aktif departman sayısını hesapla
    const [completeMonths] = await db.execute(`
      SELECT 
        DATE_FORMAT(em.month_key, '%Y-%m-01') AS month_key,
        COUNT(DISTINCT d.department_id) AS dept_count
      FROM energy_monthly em
      INNER JOIN departments d ON em.department_id = d.department_id
      WHERE d.active = 1
      GROUP BY DATE_FORMAT(em.month_key, '%Y-%m-01')
      HAVING dept_count = ?
      ORDER BY month_key DESC
      LIMIT 1
    `, [activeDeptCount]);
    
    let selectedMonthKey = null;
    let isPartialData = false;
    
    if (completeMonths.length > 0) {
      // Tüm aktif departmanların verisi olan bir ay bulundu
      selectedMonthKey = completeMonths[0].month_key;
      console.log(`✓ Tüm aktif departmanların verisi olan ay bulundu: ${selectedMonthKey}`);
    } else {
      // Tüm aktif departmanların verisi olan ay yok, en güncel ayı kullan
      const [latestMonthResult] = await db.execute(`
        SELECT DATE_FORMAT(MAX(month_key), '%Y-%m-01') AS month_key
        FROM energy_monthly
      `);
      
      if (latestMonthResult.length > 0 && latestMonthResult[0].month_key) {
        selectedMonthKey = latestMonthResult[0].month_key;
        isPartialData = true;
        console.log(`⚠️ Tüm aktif departmanların verisi olan ay bulunamadı. En güncel ay kullanılıyor: ${selectedMonthKey} (Kısmi veri)`);
      } else {
        console.log('⚠️ Hiç enerji verisi bulunamadı');
        return [];
      }
    }
    
    // 3. Seçilen ay ile tüm aktif departmanları LEFT JOIN ile çek (verisi olmayanlar 0 döner)
    console.log(`[EnergyMonthly.getDashboardData] Seçilen ay (önce): ${selectedMonthKey}`);
    console.log(`[EnergyMonthly.getDashboardData] selectedMonthKey tipi: ${typeof selectedMonthKey}`);
    
    // Aktif departman sayısını kontrol et
    const [activeDeptsCheck] = await db.execute('SELECT COUNT(*) as count FROM departments WHERE active = 1');
    console.log(`[EnergyMonthly.getDashboardData] Aktif departman sayısı (DB): ${activeDeptsCheck[0].count}`);
    
    const [rows] = await db.execute(`
      SELECT 
        d.department_id,
        d.department_name,
        ? AS month_key,
        COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
        COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
        COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
      FROM departments d
      LEFT JOIN energy_monthly em ON d.department_id = em.department_id 
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?
      WHERE d.active = 1
      GROUP BY d.department_id, d.department_name
      ORDER BY d.department_name
    `, [selectedMonthKey, selectedMonthKey]);
    
    console.log(`[EnergyMonthly.getDashboardData] Seçilen ay (sonra): ${selectedMonthKey}`);
    console.log(`[EnergyMonthly.getDashboardData] Dönen satır sayısı: ${rows.length}`);
    console.log(`[EnergyMonthly.getDashboardData] İlk 5 satır:`, rows.slice(0, 5).map(r => ({ 
      id: r.department_id, 
      name: r.department_name, 
      cost: r.total_cost_tl,
      month: r.month_key
    })));
    
    // Eğer satır sayısı beklenenden azsa, tüm aktif departmanları kontrol et
    if (rows.length < activeDeptCount) {
      console.log(`[EnergyMonthly.getDashboardData] ⚠️ UYARI: Beklenen ${activeDeptCount} departman, dönen ${rows.length} satır!`);
      
      // Eksik departmanları bul ve 0 değerlerle ekle
      const [allActiveDepts] = await db.execute(`
        SELECT department_id, department_name 
        FROM departments 
        WHERE active = 1 
        ORDER BY department_name
      `);
      
      const existingIds = new Set(rows.map(r => r.department_id));
      const missingDepts = allActiveDepts.filter(d => !existingIds.has(d.department_id));
      
      console.log(`[EnergyMonthly.getDashboardData] Eksik departmanlar:`, missingDepts.map(d => d.department_name));
      
      // Eksik departmanları 0 değerlerle ekle
      missingDepts.forEach(dept => {
        rows.push({
          department_id: dept.department_id,
          department_name: dept.department_name,
          month_key: selectedMonthKey,
          total_kwh: 0,
          total_cost_tl: 0,
          total_co2_kg: 0
        });
      });
      
      console.log(`[EnergyMonthly.getDashboardData] Düzeltme sonrası satır sayısı: ${rows.length}`);
    }
    
    // Response formatını koruyoruz (frontend aynı formatı bekliyor)
    // isPartialData bilgisini console.log ile logluyoruz
    return rows;
  }

  // Tahmin verilerini getir
  static async getForecastData() {
    const [rows] = await db.execute('SELECT * FROM v_forecast_next_month ORDER BY forecast_month, department_name');
    return rows;
  }

  // Tüm aylar için departman bazında toplam verileri getir (departmanlar sayfası için)
  static async getAllMonthsData() {
    try {
      // Tüm verisi olan ayları getir (departman bazında toplam)
      const [rows] = await db.execute(`
        SELECT 
          d.department_id,
          d.department_name,
          DATE_FORMAT(em.month_key, '%Y-%m-01') AS month_key,
          COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
          COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
          COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
        FROM departments d
        INNER JOIN energy_monthly em ON d.department_id = em.department_id
        WHERE d.active = 1
        GROUP BY d.department_id, d.department_name, DATE_FORMAT(em.month_key, '%Y-%m-01')
        ORDER BY DATE_FORMAT(em.month_key, '%Y-%m-01') DESC, d.department_name ASC
      `);
      
      console.log(`[getAllMonthsData] Toplam ${rows.length} kayıt döndü (tüm aylar için)`);
      return rows;
    } catch (error) {
      console.error('getAllMonthsData hatası:', error);
      return [];
    }
  }

  // Tüm unique ayları getir (ay seçim dropdown'ları için)
  static async getAllUniqueMonths() {
    try {
      const [rows] = await db.execute(`
        SELECT DISTINCT DATE_FORMAT(month_key, '%Y-%m-01') AS month_key
        FROM energy_monthly
        ORDER BY month_key DESC
      `);
      
      console.log(`[getAllUniqueMonths] Toplam ${rows.length} ay bulundu`);
      return rows.map(row => row.month_key);
    } catch (error) {
      console.error('getAllUniqueMonths hatası:', error);
      return [];
    }
  }

  // Belirli bir ay için dashboard verilerini getir (departman bazında toplam)
  static async getDashboardDataForMonth(monthKey) {
    try {
      // month_key normalizasyonu (YYYY-MM-01 formatına çevir)
      let normalizedMonthKey = monthKey;
      if (monthKey) {
        // String ise, DATE_FORMAT ile uyumlu hale getir
        const dateStr = String(monthKey);
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          normalizedMonthKey = dateStr.split('T')[0].split(' ')[0].substring(0, 7) + '-01';
        } else {
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              normalizedMonthKey = `${year}-${month}-01`;
            }
          } catch (e) {
            console.error('Date parse hatası:', e);
          }
        }
      }

      console.log(`[getDashboardDataForMonth] Seçilen ay: ${normalizedMonthKey}`);

      // Belirli ay için tüm aktif departmanları LEFT JOIN ile çek (verisi olmayanlar 0 döner)
      const [rows] = await db.execute(`
        SELECT 
          d.department_id,
          d.department_name,
          ? AS month_key,
          COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
          COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
          COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
        FROM departments d
        LEFT JOIN energy_monthly em ON d.department_id = em.department_id 
          AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?
        WHERE d.active = 1
        GROUP BY d.department_id, d.department_name
        ORDER BY d.department_name
      `, [normalizedMonthKey, normalizedMonthKey]);
      
      console.log(`[getDashboardDataForMonth] Dönen satır sayısı: ${rows.length}`);
      
      return rows;
    } catch (error) {
      console.error('getDashboardDataForMonth hatası:', error);
      return [];
    }
  }
}

module.exports = EnergyMonthly;










