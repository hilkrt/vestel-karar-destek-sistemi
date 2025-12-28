const db = require('../config/database');

class Department {
  // Tüm aktif departmanları getir
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM departments WHERE active = 1 ORDER BY department_name');
    return rows;
  }

  // Tüm departmanları getir (aktif ve pasif)
  static async findAllWithInactive() {
    const [rows] = await db.execute('SELECT * FROM departments ORDER BY active DESC, department_name');
    return rows;
  }

  // ID'ye göre departman getir
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM departments WHERE department_id = ?', [id]);
    return rows[0];
  }

  // Departman ekle
  static async create(departmentData) {
    const { department_name, active = 1, employee_count = null, average_salary_tl = null } = departmentData;
    
    try {
      const [result] = await db.execute(
        'INSERT INTO departments (department_name, active, employee_count, average_salary_tl) VALUES (?, ?, ?, ?)',
        [department_name, active, employee_count, average_salary_tl]
      );
      return result.insertId;
    } catch (error) {
      // Eğer average_salary_tl sütunu yoksa, sütunu sorgudan çıkar
      if (error.message.includes('average_salary_tl')) {
        const [result] = await db.execute(
          'INSERT INTO departments (department_name, active, employee_count) VALUES (?, ?, ?)',
          [department_name, active, employee_count]
        );
        return result.insertId;
      }
      throw error;
    }
  }

  // Departman güncelle
  static async update(id, departmentData) {
    const { department_name, active, employee_count = null, average_salary_tl = null } = departmentData;
    
    try {
      const [result] = await db.execute(
        'UPDATE departments SET department_name = ?, active = ?, employee_count = ?, average_salary_tl = ? WHERE department_id = ?',
        [department_name, active, employee_count, average_salary_tl, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      // Eğer average_salary_tl sütunu yoksa, sütunu sorgudan çıkar
      if (error.message.includes('average_salary_tl')) {
        const [result] = await db.execute(
          'UPDATE departments SET department_name = ?, active = ?, employee_count = ? WHERE department_id = ?',
          [department_name, active, employee_count, id]
        );
        return result.affectedRows > 0;
      }
      throw error;
    }
  }

  // Departman durumunu değiştir (aktif/pasif)
  static async toggleActive(id, active) {
    const [result] = await db.execute(
      'UPDATE departments SET active = ? WHERE department_id = ?',
      [active, id]
    );
    return result.affectedRows > 0;
  }

  // Departman sil
  static async delete(id) {
    await db.execute('DELETE FROM departments WHERE department_id = ?', [id]);
  }
}

module.exports = Department;

