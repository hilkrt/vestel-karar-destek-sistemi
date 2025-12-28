const db = require('../config/database');

class Scenario {
  // Tüm senaryoları getir
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM scenario_library ORDER BY scenario_name');
    return rows;
  }

  // ID'ye göre senaryo getir
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM scenario_library WHERE scenario_id = ?', [id]);
    return rows[0];
  }

  // Uygulanan senaryoları getir
  static async findApplied() {
    const [rows] = await db.execute(
      `SELECT sa.*, sl.scenario_name, sl.action_type, sl.expected_reduction_pct, sl.description,
              d.department_name
       FROM scenario_applied sa
       LEFT JOIN scenario_library sl ON sa.scenario_id = sl.scenario_id
       LEFT JOIN departments d ON sa.department_id = d.department_id
       ORDER BY sa.start_month DESC`
    );
    return rows;
  }

  // Departmana göre uygulanan senaryoları getir
  static async findAppliedByDepartment(departmentId) {
    const [rows] = await db.execute(
      `SELECT sa.*, sl.scenario_name, sl.action_type, sl.expected_reduction_pct, sl.description,
              d.department_name
       FROM scenario_applied sa
       LEFT JOIN scenario_library sl ON sa.scenario_id = sl.scenario_id
       LEFT JOIN departments d ON sa.department_id = d.department_id
       WHERE sa.department_id = ?
       ORDER BY sa.start_month DESC`,
      [departmentId]
    );
    return rows;
  }

  // Yeni senaryo oluştur
  static async create(scenarioData) {
    const { scenario_name, action_type, expected_reduction_pct, description } = scenarioData;
    
    // Description null veya boş ise boş string'e çevir (veritabanı NOT NULL ise)
    const descriptionValue = description && description.trim() ? description.trim() : '';
    
    // Action type'ı kontrol et ve log ekle
    console.log('[Scenario.create] Gönderilen action_type:', action_type);
    console.log('[Scenario.create] Action type uzunluğu:', action_type ? action_type.length : 0);
    console.log('[Scenario.create] Action type tipi:', typeof action_type);
    
    // Veritabanında mevcut sütunlar: scenario_name, action_type, expected_reduction_pct, description
    const [result] = await db.execute(
      `INSERT INTO scenario_library (scenario_name, action_type, expected_reduction_pct, description) 
       VALUES (?, ?, ?, ?)`,
      [scenario_name || null, action_type || null, expected_reduction_pct, descriptionValue]
    );
    return result.insertId;
  }

  // Senaryo güncelle
  static async update(id, scenarioData) {
    const { scenario_name, action_type, expected_reduction_pct, description } = scenarioData;
    
    // Description null veya boş ise boş string'e çevir (veritabanı NOT NULL ise)
    const descriptionValue = description && description.trim() ? description.trim() : '';
    
    // Veritabanında mevcut sütunlar: scenario_name, action_type, expected_reduction_pct, description
    const [result] = await db.execute(
      `UPDATE scenario_library 
       SET scenario_name = ?, action_type = ?, expected_reduction_pct = ?, description = ?
       WHERE scenario_id = ?`,
      [scenario_name || null, action_type || null, expected_reduction_pct, descriptionValue, id]
    );
    return result.affectedRows > 0;
  }

  // Senaryo sil
  static async delete(id) {
    const [result] = await db.execute('DELETE FROM scenario_library WHERE scenario_id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Senaryo uygula
  static async apply(scenarioData) {
    const { scenario_id, department_id, start_month, end_month, note } = scenarioData;
    const [result] = await db.execute(
      'INSERT INTO scenario_applied (scenario_id, department_id, start_month, end_month, note) VALUES (?, ?, ?, ?, ?)',
      [scenario_id, department_id, start_month, end_month, note]
    );
    return result.insertId;
  }

  // Senaryo etkisini hesapla (mevcut tüketim üzerinden)
  static async calculateImpact(scenarioId, departmentId, baseConsumption) {
    const scenario = await this.findById(scenarioId);
    if (!scenario) return null;

    const reductionPercent = scenario.expected_reduction_pct / 100;
    const reducedConsumption = baseConsumption * (1 - reductionPercent);
    const savings = baseConsumption - reducedConsumption;

    return {
      scenario_id: scenarioId,
      scenario_name: scenario.scenario_name,
      base_consumption: baseConsumption,
      reduced_consumption: reducedConsumption,
      savings: savings,
      reduction_percent: scenario.expected_reduction_pct,
      description: scenario.description
    };
  }

  // Senaryo için karar destek metriklerini hesapla
  static calculateDecisionMetrics(scenario, baseCost, savingsCost) {
    // Senaryo tipine göre varsayılan değerler
    const defaultInvestment = {
      'Aydınlatma İyileştirme': 50000,
      'HVAC Optimizasyonu': 150000,
      'Ekipman Değişimi': 200000,
      'İzolasyon İyileştirme': 80000,
      'Enerji Yönetim Sistemi': 300000,
      'Yenilenebilir Enerji': 500000,
      'Zamanlama Optimizasyonu': 25000,
      'Bakım Programı': 40000,
      'Akıllı Sensör Sistemi': 120000,
      'Enerji Verimliliği Eğitimi': 30000
    };

    // Yatırım maliyeti (varsayılan veya scenario'dan)
    const investmentCost = parseFloat(scenario.investment_cost || defaultInvestment[scenario.scenario_name] || 100000);
    
    // Aylık tasarruf (TL cinsinden)
    const monthlySavings = parseFloat(savingsCost || 0);
    
    // Yıllık tasarruf (aylık tasarruf * 12)
    const annualSavings = monthlySavings * 12;
    
    // ROI (Geri Dönüş Süresi) - ay cinsinden
    // ROI = Yatırım Maliyeti / Aylık Tasarruf
    const roiMonths = monthlySavings > 0 ? investmentCost / monthlySavings : 999;
    
    // Zorluk seviyesi (varsayılan - senaryo tipine göre)
    const difficultyMap = {
      'Aydınlatma İyileştirme': 'Düşük',
      'HVAC Optimizasyonu': 'Orta',
      'Ekipman Değişimi': 'Yüksek',
      'İzolasyon İyileştirme': 'Orta',
      'Enerji Yönetim Sistemi': 'Yüksek',
      'Yenilenebilir Enerji': 'Çok Yüksek',
      'Zamanlama Optimizasyonu': 'Düşük',
      'Bakım Programı': 'Düşük',
      'Akıllı Sensör Sistemi': 'Orta',
      'Enerji Verimliliği Eğitimi': 'Düşük'
    };
    const difficultyLevel = scenario.difficulty_level || difficultyMap[scenario.scenario_name] || 'Orta';
    
    // Uygulama süresi (varsayılan - ay cinsinden)
    const implementationMap = {
      'Aydınlatma İyileştirme': 1,
      'HVAC Optimizasyonu': 3,
      'Ekipman Değişimi': 6,
      'İzolasyon İyileştirme': 4,
      'Enerji Yönetim Sistemi': 6,
      'Yenilenebilir Enerji': 12,
      'Zamanlama Optimizasyonu': 1,
      'Bakım Programı': 2,
      'Akıllı Sensör Sistemi': 3,
      'Enerji Verimliliği Eğitimi': 2
    };
    const implementationMonths = scenario.implementation_period_months || implementationMap[scenario.scenario_name] || 3;
    
    // Öncelik skoru hesaplama (0-100 arası)
    // Faktörler: Tasarruf yüzdesi, ROI, Zorluk seviyesi, Uygulama süresi
    let priorityScore = 0;
    
    // Tasarruf yüzdesi (40 puan max)
    priorityScore += Math.min(scenario.expected_reduction_pct * 2, 40);
    
    // ROI (30 puan max - düşük ROI yüksek puan)
    if (roiMonths <= 6) priorityScore += 30;
    else if (roiMonths <= 12) priorityScore += 25;
    else if (roiMonths <= 24) priorityScore += 20;
    else if (roiMonths <= 36) priorityScore += 15;
    else priorityScore += 10;
    
    // Zorluk seviyesi (20 puan max - düşük zorluk yüksek puan)
    const difficultyScores = { 'Düşük': 20, 'Orta': 15, 'Yüksek': 10, 'Çok Yüksek': 5 };
    priorityScore += difficultyScores[difficultyLevel] || 10;
    
    // Uygulama süresi (10 puan max - kısa süre yüksek puan)
    if (implementationMonths <= 1) priorityScore += 10;
    else if (implementationMonths <= 3) priorityScore += 8;
    else if (implementationMonths <= 6) priorityScore += 5;
    else priorityScore += 3;
    
    priorityScore = Math.round(Math.min(priorityScore, 100));
    
    // Öneri seviyesi
    let recommendationLevel = 'Orta';
    if (priorityScore >= 75) recommendationLevel = 'Yüksek';
    else if (priorityScore >= 50) recommendationLevel = 'Orta';
    else recommendationLevel = 'Düşük';
    
    return {
      investment_cost: investmentCost,
      annual_savings: annualSavings,
      roi_months: Math.round(roiMonths * 10) / 10,
      difficulty_level: difficultyLevel,
      implementation_months: implementationMonths,
      priority_score: priorityScore,
      recommendation_level: recommendationLevel
    };
  }

  // İşçi çıkarımı önerisi hesapla (Suggestion modelindeki mantığı kullanarak)
  static async calculateEmployeeReduction(departmentId, annualSavingTl) {
    try {
      console.log(`[calculateEmployeeReduction] Başlangıç: departmentId=${departmentId}, annualSavingTl=${annualSavingTl}`);
      
      // Departman bilgilerini getir (average_salary_tl sütunu yoksa da çalışsın)
      let deptRows;
      try {
        [deptRows] = await db.execute(
          'SELECT employee_count, average_salary_tl FROM departments WHERE department_id = ?',
          [departmentId]
        );
        console.log(`[calculateEmployeeReduction] Departman sorgusu sonucu:`, deptRows);
      } catch (error) {
        console.error(`[calculateEmployeeReduction] Departman sorgusu hatası:`, error);
        // Eğer average_salary_tl sütunu yoksa, sadece employee_count getir
        if (error.message.includes('average_salary_tl')) {
          [deptRows] = await db.execute(
            'SELECT employee_count FROM departments WHERE department_id = ?',
            [departmentId]
          );
          // average_salary_tl yoksa hesaplama yapma
          console.log(`[calculateEmployeeReduction] average_salary_tl sütunu yok, null dönüyor`);
          return null;
        }
        throw error;
      }
      
      if (deptRows.length === 0) {
        console.log(`[calculateEmployeeReduction] Departman ${departmentId} bulunamadı`);
        return null;
      }
      
      if (!deptRows[0].average_salary_tl || !deptRows[0].employee_count) {
        console.log(`[calculateEmployeeReduction] Departman ${departmentId} için gerekli veriler yok: employee_count=${deptRows[0]?.employee_count}, average_salary_tl=${deptRows[0]?.average_salary_tl}`);
        return null; // Departman bilgisi yoksa hesaplama yapma
      }
      
      const { employee_count, average_salary_tl } = deptRows[0];
      console.log(`[calculateEmployeeReduction] Departman verileri: employee_count=${employee_count}, average_salary_tl=${average_salary_tl}`);
      
      // Yıllık maaş maliyeti = ortalama maaş * 12
      const annualSalaryCost = parseFloat(average_salary_tl) * 12;
      console.log(`[calculateEmployeeReduction] Yıllık maaş maliyeti=${annualSalaryCost}`);
      
      // Önerilen işçi sayısı = (Yıllık Tasarruf / Yıllık Maaş Maliyeti) * 0.7
      // 0.7 katsayısı: Tasarrufun tamamını işçi çıkarımına bağlamak yerine, %70'ini kullan
      // Math.ceil kullanarak küçük tasarruflar için de en az 0.1-0.2 gibi değerler elde edebiliriz
      const suggestedReduction = Math.ceil((annualSavingTl / annualSalaryCost) * 0.7 * 10) / 10; // 0.1 hassasiyetle
      console.log(`[calculateEmployeeReduction] Önerilen işçi çıkarımı (hesap, 0.1 hassasiyetle): ${suggestedReduction}`);
      
      // Önerilen çıkarım, mevcut işçi sayısının %30'unu geçmemeli
      const maxReduction = Math.floor(employee_count * 0.3);
      console.log(`[calculateEmployeeReduction] Maksimum işçi çıkarımı (işçi sayısının %30'u): ${maxReduction}`);
      
      const finalReduction = Math.min(suggestedReduction, maxReduction);
      console.log(`[calculateEmployeeReduction] Final işçi çıkarımı: ${finalReduction}`);
      
      // Eğer final değer 0.1'den küçükse, yine de 0.1 olarak göster (kısmi zamanlı azaltma önerisi)
      // Ama eğer gerçekten çok küçükse (0.05'ten küçük), 0 döndür
      if (finalReduction < 0.05) {
        console.log(`[calculateEmployeeReduction] Final değer çok küçük (${finalReduction}), 0 döndürülüyor`);
        return 0;
      }
      
      // En az 0.1 göster (kısmi zamanlı azaltma önerisi olarak)
      return Math.max(finalReduction, 0.1);
    } catch (error) {
      console.error('[calculateEmployeeReduction] Hata:', error);
      return null;
    }
  }

  // Çoklu senaryo karşılaştırması için
  static async compareScenarios(scenarioIds, departmentId, baseData) {
    const comparisons = [];
    
    for (const scenarioId of scenarioIds) {
      const scenario = await this.findById(scenarioId);
      if (!scenario) continue;

      const reductionPercent = scenario.expected_reduction_pct / 100;
      const comparison = {
        scenario_id: scenarioId,
        scenario_name: scenario.scenario_name,
        action_type: scenario.action_type,
        expected_reduction_pct: scenario.expected_reduction_pct,
        description: scenario.description,
        impacts: {}
      };

      // Her metrik için hesapla (değerleri parseFloat ile sayıya çevir)
      const baseKwh = parseFloat(baseData.total_kwh || 0);
      const baseCost = parseFloat(baseData.total_cost_tl || 0);
      const baseCo2 = parseFloat(baseData.total_co2_kg || 0);

      if (baseKwh > 0) {
        comparison.impacts.consumption_kwh = baseKwh * (1 - reductionPercent);
        comparison.impacts.savings_kwh = baseKwh * reductionPercent;
      } else {
        comparison.impacts.consumption_kwh = 0;
        comparison.impacts.savings_kwh = 0;
      }

      if (baseCost > 0) {
        comparison.impacts.cost_tl = baseCost * (1 - reductionPercent);
        comparison.impacts.savings_tl = baseCost * reductionPercent;
      } else {
        comparison.impacts.cost_tl = 0;
        comparison.impacts.savings_tl = 0;
      }

      if (baseCo2 > 0) {
        comparison.impacts.co2_kg = baseCo2 * (1 - reductionPercent);
        comparison.impacts.savings_co2_kg = baseCo2 * reductionPercent;
      } else {
        comparison.impacts.co2_kg = 0;
        comparison.impacts.savings_co2_kg = 0;
      }

      // Karar destek metriklerini hesapla
      comparison.decision_metrics = Scenario.calculateDecisionMetrics(
        scenario,
        baseCost,
        comparison.impacts.savings_tl
      );

      // Eğer departman seçildiyse, işçi çıkarımı önerisini hesapla
      // departmentId null veya undefined değilse ve annual_savings > 0 ise
      console.log(`[Scenario ${scenarioId}] İşçi çıkarımı kontrolü: departmentId=${departmentId} (type: ${typeof departmentId}), annual_savings=${comparison.decision_metrics.annual_savings}`);
      
      if (departmentId != null && departmentId !== '' && departmentId !== 0 && comparison.decision_metrics.annual_savings > 0) {
        const deptId = typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId;
        console.log(`[Scenario ${scenarioId}] İşçi çıkarımı hesaplanıyor: departmentId=${deptId} (parsed), annual_savings=${comparison.decision_metrics.annual_savings}`);
        try {
          const employeeReduction = await Scenario.calculateEmployeeReduction(
            deptId,
            comparison.decision_metrics.annual_savings
          );
          comparison.employee_reduction = employeeReduction;
          console.log(`[Scenario ${scenarioId}] İşçi çıkarımı sonucu: ${employeeReduction} (type: ${typeof employeeReduction})`);
        } catch (error) {
          console.error(`[Scenario ${scenarioId}] İşçi çıkarımı hesaplama hatası:`, error);
          comparison.employee_reduction = null;
        }
      } else {
        comparison.employee_reduction = null;
        if (!departmentId || departmentId === '' || departmentId === 0) {
          console.log(`[Scenario ${scenarioId}] Departman seçilmedi, işçi çıkarımı hesaplanmayacak. departmentId=${departmentId}`);
        } else if (comparison.decision_metrics.annual_savings <= 0) {
          console.log(`[Scenario ${scenarioId}] Yıllık tasarruf 0 veya negatif, işçi çıkarımı hesaplanmayacak. annual_savings=${comparison.decision_metrics.annual_savings}`);
        }
      }

      comparisons.push(comparison);
    }

    // Öncelik skoruna göre sırala (yüksekten düşüğe)
    comparisons.sort((a, b) => b.decision_metrics.priority_score - a.decision_metrics.priority_score);

    return comparisons;
  }
}

module.exports = Scenario;

