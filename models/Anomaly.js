const db = require('../config/database');

class Anomaly {
  // Tüm anormallikleri getir
  static async findAll(limit = 50) {
    const limitNum = parseInt(limit, 10);
    try {
      // month_key alanını da dahil etmek için direkt JOIN yap
      const [rows] = await db.execute(
        `SELECT a.*, 
                em.month_key,
                d.department_name, 
                et.energy_name,
                em.consumption_kwh,
                em.cost_tl as cost,
                em.co2_kg
         FROM anomalies a
         LEFT JOIN energy_monthly em ON a.monthly_id = em.monthly_id
         LEFT JOIN departments d ON em.department_id = d.department_id
         LEFT JOIN energy_types et ON em.energy_type_id = et.energy_type_id
         ORDER BY a.detected_at DESC 
         LIMIT ${limitNum}`
      );
      return rows;
    } catch (error) {
      // Eğer JOIN hatası verirse, view'ı kullan (geriye dönük uyumluluk)
      console.warn('Anormallik sorgusu hatası, view kullanılıyor:', error.message);
      const [rows] = await db.execute(
        `SELECT * FROM v_anomaly_feed ORDER BY detected_at DESC LIMIT ${limitNum}`
      );
      return rows;
    }
  }

  // ID'ye göre anormallik getir
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT a.*, em.*, d.department_name, et.energy_name 
       FROM anomalies a
       LEFT JOIN energy_monthly em ON a.monthly_id = em.monthly_id
       LEFT JOIN departments d ON em.department_id = d.department_id
       LEFT JOIN energy_types et ON em.energy_type_id = et.energy_type_id
       WHERE a.anomaly_id = ?`,
      [id]
    );
    return rows[0];
  }

  // Seviyeye göre filtrele
  static async findByLevel(level) {
    const [rows] = await db.execute(
      'SELECT * FROM v_anomaly_feed WHERE anomaly_level = ? ORDER BY detected_at DESC',
      [level]
    );
    return rows;
  }

  // Anormallik oluştur
  static async create(anomalyData) {
    const { monthly_id, anomaly_level, anomaly_reason } = anomalyData;
    const [result] = await db.execute(
      'INSERT INTO anomalies (monthly_id, anomaly_level, anomaly_reason) VALUES (?, ?, ?)',
      [monthly_id, anomaly_level, anomaly_reason]
    );
    return result.insertId;
  }
}

module.exports = Anomaly;

