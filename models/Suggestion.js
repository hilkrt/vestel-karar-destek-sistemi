const db = require('../config/database');

class Suggestion {
  // Tüm önerileri getir
  static async findAll(limit = 50) {
    const limitNum = parseInt(limit, 10);
    // employee_count ve average_salary_tl sütunlarını dahil et
    let rows;
    try {
      [rows] = await db.execute(
        `SELECT s.*, d.department_name, 
                COALESCE(s.suggestion_text, '') as description,
                COALESCE(d.employee_count, NULL) as employee_count,
                COALESCE(d.average_salary_tl, NULL) as average_salary_tl
         FROM suggestions s
         LEFT JOIN departments d ON s.department_id = d.department_id
         ORDER BY s.month_key DESC, s.expected_saving_tl DESC
         LIMIT ${limitNum}`
      );
    } catch (error) {
      // Eğer sütunlar yoksa, sadece department_name ile sorgula
      if (error.message.includes('employee_count') || error.message.includes('average_salary_tl')) {
        [rows] = await db.execute(
          `SELECT s.*, d.department_name,
                COALESCE(s.suggestion_text, '') as description
           FROM suggestions s
           LEFT JOIN departments d ON s.department_id = d.department_id
           ORDER BY s.month_key DESC, s.expected_saving_tl DESC
           LIMIT ${limitNum}`
        );
      } else {
        throw error;
      }
    }
    
    // Her öneri için işçi çıkarımı otomatik hesapla (eğer tasarruf varsa)
    for (let suggestion of rows) {
      // Tasarruf varsa ve departman ID'si varsa, otomatik hesapla
      if (suggestion.expected_saving_tl && suggestion.expected_saving_tl > 0 && suggestion.department_id) {
        try {
          const annualSavingTl = suggestion.expected_saving_tl * 12;
          const calculatedReduction = await this.calculateEmployeeReduction(suggestion.department_id, annualSavingTl);
          
          // Hesaplanan değeri kullan (null ise de kaydet, böylece bir sonraki sefer tekrar hesaplamaya çalışmaz)
          if (calculatedReduction !== null && calculatedReduction > 0) {
            // Veritabanını güncelle
            try {
              await db.execute(
                'UPDATE suggestions SET suggested_employee_reduction = ? WHERE suggestion_id = ?',
                [calculatedReduction, suggestion.suggestion_id]
              );
              // Görüntüleme için de güncelle
              suggestion.suggested_employee_reduction = calculatedReduction;
              console.log(`✅ Öneri ${suggestion.suggestion_id} için işçi çıkarımı hesaplandı: ${calculatedReduction} kişi`);
            } catch (updateError) {
              // Eğer suggested_employee_reduction sütunu yoksa, sadece görüntüleme için ekle
              if (updateError.message.includes('suggested_employee_reduction')) {
                console.log(`⚠️ suggested_employee_reduction sütunu yok, sadece görüntüleme için ekleniyor`);
              } else {
                console.error('❌ İşçi çıkarımı güncelleme hatası:', updateError.message);
              }
              // Yine de görüntüleme için ekle
              suggestion.suggested_employee_reduction = calculatedReduction;
            }
          } else {
            // Hesaplanamadıysa null olarak bırak
            console.log(`⚠️ Öneri ${suggestion.suggestion_id} için işçi çıkarımı hesaplanamadı (tasarruf: ${annualSavingTl} TL)`);
            // Eğer veritabanında değer varsa onu kullan, yoksa null bırak
            if (!suggestion.suggested_employee_reduction) {
              suggestion.suggested_employee_reduction = null;
            }
          }
        } catch (calcError) {
          // Hesaplama hatası varsa devam et
          console.error(`❌ Öneri ${suggestion.suggestion_id} için işçi çıkarımı hesaplama hatası:`, calcError.message);
          if (!suggestion.suggested_employee_reduction) {
            suggestion.suggested_employee_reduction = null;
          }
        }
      } else {
        console.log(`⚠️ Öneri ${suggestion.suggestion_id} için hesaplama yapılamadı: tasarruf=${suggestion.expected_saving_tl}, departman_id=${suggestion.department_id}`);
      }
    }
    
    return rows;
  }

  // ID'ye göre öneri getir (nedenlerle birlikte)
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT s.*, d.department_name,
              COALESCE(d.employee_count, NULL) as employee_count,
              GROUP_CONCAT(rl.reason_title SEPARATOR ', ') as reasons
       FROM suggestions s
       LEFT JOIN departments d ON s.department_id = d.department_id
       LEFT JOIN suggestion_reasons sr ON s.suggestion_id = sr.suggestion_id
       LEFT JOIN reason_library rl ON sr.reason_id = rl.reason_id
       WHERE s.suggestion_id = ?
       GROUP BY s.suggestion_id`,
      [id]
    ).catch(async (error) => {
      // Eğer employee_count sütunu yoksa, sütunu sorgudan çıkar
      if (error.message.includes('employee_count')) {
        const [rowsWithoutEmployee] = await db.execute(
          `SELECT s.*, d.department_name,
                  GROUP_CONCAT(rl.reason_title SEPARATOR ', ') as reasons
           FROM suggestions s
           LEFT JOIN departments d ON s.department_id = d.department_id
           LEFT JOIN suggestion_reasons sr ON s.suggestion_id = sr.suggestion_id
           LEFT JOIN reason_library rl ON sr.reason_id = rl.reason_id
           WHERE s.suggestion_id = ?
           GROUP BY s.suggestion_id`,
          [id]
        );
        return [rowsWithoutEmployee];
      }
      throw error;
    });
    return rows[0];
  }

  // Departman bazında getir
  static async findByDepartment(departmentId) {
    const [rows] = await db.execute(
      `SELECT s.*, d.department_name,
              COALESCE(d.employee_count, NULL) as employee_count
       FROM suggestions s
       LEFT JOIN departments d ON s.department_id = d.department_id
       WHERE s.department_id = ?
       ORDER BY s.month_key DESC`,
      [departmentId]
    ).catch(async (error) => {
      // Eğer employee_count sütunu yoksa, sütunu sorgudan çıkar
      if (error.message.includes('employee_count')) {
        const [rowsWithoutEmployee] = await db.execute(
          `SELECT s.*, d.department_name
           FROM suggestions s
           LEFT JOIN departments d ON s.department_id = d.department_id
           WHERE s.department_id = ?
           ORDER BY s.month_key DESC`,
          [departmentId]
        );
        return [rowsWithoutEmployee];
      }
      throw error;
    });
    return rows;
  }

  // İşçi çıkarımı önerisi hesapla
  static async calculateEmployeeReduction(departmentId, annualSavingTl) {
    try {
      // Departman bilgilerini getir (average_salary_tl sütunu yoksa da çalışsın)
      let deptRows;
      try {
        [deptRows] = await db.execute(
          'SELECT employee_count, average_salary_tl FROM departments WHERE department_id = ?',
          [departmentId]
        );
      } catch (error) {
        // Eğer average_salary_tl sütunu yoksa, sadece employee_count getir
        if (error.message.includes('average_salary_tl')) {
          [deptRows] = await db.execute(
            'SELECT employee_count FROM departments WHERE department_id = ?',
            [departmentId]
          );
          // average_salary_tl yoksa hesaplama yapma
          return null;
        }
        throw error;
      }
      
      if (deptRows.length === 0 || !deptRows[0].average_salary_tl || !deptRows[0].employee_count) {
        console.log(`Departman ${departmentId} için gerekli veriler yok: employee_count=${deptRows[0]?.employee_count}, average_salary_tl=${deptRows[0]?.average_salary_tl}`);
        return null; // Departman bilgisi yoksa hesaplama yapma
      }
      
      const { employee_count, average_salary_tl } = deptRows[0];
      
      // Yıllık maaş maliyeti = ortalama maaş * 12
      const annualSalaryCost = average_salary_tl * 12;
      
      // Eğer yıllık tasarruf, bir işçinin yıllık maliyetinden azsa, öneri yapma
      if (annualSavingTl < annualSalaryCost * 0.3) {
        console.log(`Yıllık tasarruf (${annualSavingTl}) çok küçük, minimum gereksinim: ${annualSalaryCost * 0.3}`);
        return null; // Çok küçük tasarruflar için öneri yapma
      }
      
      // Önerilen işçi sayısı = (Yıllık Tasarruf / Yıllık Maaş Maliyeti) * 0.7
      // 0.7 katsayısı: Tasarrufun tamamını işçi çıkarımına bağlamak yerine, %70'ini kullan
      const suggestedReduction = Math.floor((annualSavingTl / annualSalaryCost) * 0.7);
      
      // Önerilen çıkarım, mevcut işçi sayısının %30'unu geçmemeli
      const maxReduction = Math.floor(employee_count * 0.3);
      
      const finalReduction = Math.min(suggestedReduction, maxReduction);
      console.log(`Departman ${departmentId}: Yıllık tasarruf=${annualSavingTl}, Yıllık maaş maliyeti=${annualSalaryCost}, Önerilen işçi çıkarımı=${finalReduction}`);
      
      return finalReduction;
    } catch (error) {
      console.error('İşçi çıkarımı hesaplama hatası:', error);
      return null;
    }
  }

  // Öneri oluştur
  static async create(suggestionData) {
    const { department_id, month_key, title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, suggested_employee_reduction = null } = suggestionData;
    
    // Eğer suggested_employee_reduction belirtilmemişse ve yıllık tasarruf varsa, otomatik hesapla
    let calculatedReduction = suggested_employee_reduction;
    if (!suggested_employee_reduction && expected_saving_tl && expected_saving_tl > 0) {
      // Aylık tasarrufu yıllığa çevir (12 ile çarp)
      const annualSavingTl = expected_saving_tl * 12;
      calculatedReduction = await this.calculateEmployeeReduction(department_id, annualSavingTl);
    }
    
    // suggested_employee_reduction sütunu varsa dahil et
    try {
      const [result] = await db.execute(
        `INSERT INTO suggestions (department_id, month_key, title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, suggested_employee_reduction) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [department_id, month_key, title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, calculatedReduction]
      );
      return result.insertId;
    } catch (error) {
      // Eğer suggested_employee_reduction sütunu yoksa, sütunu sorgudan çıkar
      if (error.message.includes('suggested_employee_reduction')) {
        const [result] = await db.execute(
          `INSERT INTO suggestions (department_id, month_key, title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [department_id, month_key, title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg]
        );
        return result.insertId;
      }
      throw error;
    }
  }

  // Öneriye neden ekle
  static async addReason(suggestionId, reasonId) {
    await db.execute(
      'INSERT INTO suggestion_reasons (suggestion_id, reason_id) VALUES (?, ?)',
      [suggestionId, reasonId]
    );
  }

  // Öneri güncelle
  static async update(id, suggestionData) {
    const { title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, suggested_employee_reduction = null, auto_calculate = false } = suggestionData;
    
    // Eğer auto_calculate true ise ve suggested_employee_reduction belirtilmemişse, otomatik hesapla
    let calculatedReduction = suggested_employee_reduction;
    if (auto_calculate && !suggested_employee_reduction && expected_saving_tl && expected_saving_tl > 0) {
      // Önce mevcut önerinin department_id'sini al
      const [currentRows] = await db.execute('SELECT department_id FROM suggestions WHERE suggestion_id = ?', [id]);
      if (currentRows.length > 0) {
        const departmentId = currentRows[0].department_id;
        // Aylık tasarrufu yıllığa çevir (12 ile çarp)
        const annualSavingTl = expected_saving_tl * 12;
        calculatedReduction = await this.calculateEmployeeReduction(departmentId, annualSavingTl);
      }
    }
    
    // suggested_employee_reduction sütunu varsa dahil et
    try {
      const [result] = await db.execute(
        `UPDATE suggestions 
         SET title = ?, suggestion_text = ?, expected_saving_kwh = ?, expected_saving_tl = ?, expected_saving_co2_kg = ?, suggested_employee_reduction = ?
         WHERE suggestion_id = ?`,
        [title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, calculatedReduction, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      // Eğer suggested_employee_reduction sütunu yoksa, sütunu sorgudan çıkar
      if (error.message.includes('suggested_employee_reduction')) {
        const [result] = await db.execute(
          `UPDATE suggestions 
           SET title = ?, suggestion_text = ?, expected_saving_kwh = ?, expected_saving_tl = ?, expected_saving_co2_kg = ?
           WHERE suggestion_id = ?`,
          [title, suggestion_text, expected_saving_kwh, expected_saving_tl, expected_saving_co2_kg, id]
        );
        return result.affectedRows > 0;
      }
      throw error;
    }
  }
}

module.exports = Suggestion;

