const db = require('../config/database');

class EnergyType {
  // Tüm enerji türlerini getir
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM energy_types ORDER BY energy_name');
    return rows;
  }

  // ID'ye göre enerji türü getir
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM energy_types WHERE energy_type_id = ?', [id]);
    return rows[0];
  }

  // Enerji türü ekle
  static async create(energyData) {
    const { energy_name, unit_cost, emission_factor } = energyData;
    const [result] = await db.execute(
      'INSERT INTO energy_types (energy_name, unit_cost, emission_factor) VALUES (?, ?, ?)',
      [energy_name, unit_cost, emission_factor]
    );
    return result.insertId;
  }

  // Enerji türü güncelle
  static async update(id, energyData) {
    const { energy_name, unit_cost, emission_factor } = energyData;
    await db.execute(
      'UPDATE energy_types SET energy_name = ?, unit_cost = ?, emission_factor = ? WHERE energy_type_id = ?',
      [energy_name, unit_cost, emission_factor, id]
    );
  }
}

module.exports = EnergyType;











