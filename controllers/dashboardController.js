const EnergyMonthly = require('../models/EnergyMonthly');
const Anomaly = require('../models/Anomaly');
const Suggestion = require('../models/Suggestion');
const Department = require('../models/Department');
const Scenario = require('../models/Scenario');
const db = require('../config/database');

class DashboardController {
  // Ana dashboard sayfası
  static async getDashboard(req, res) {
    try {
      // Departmanları getir (aktif ve pasif)
      const departments = await Department.findAllWithInactive();
      
      // Dashboard verilerini getir (departman bazında aylık tüketim)
      const dashboardData = await EnergyMonthly.getDashboardData();
      
      // Anormallikleri getir - Urgent action için yeterli sayıda getir (son 30 gün)
      const anomalies = await Anomaly.findAll(100);
      
      // Önerileri getir
      const suggestions = await Suggestion.findAll(10);
      
      // Tahmin verilerini getir
      const forecasts = await EnergyMonthly.getForecastData();

      // Grafikler için ek veriler
      const chartData = await DashboardController.prepareChartData(departments, dashboardData, anomalies, suggestions);

      res.render('dashboard/index', {
        title: 'Dashboard',
        departments,
        dashboardData,
        anomalies,
        suggestions,
        forecasts,
        chartData
      });
    } catch (error) {
      console.error('Dashboard hatası:', error);
      res.status(500).render('error', { 
        message: 'Dashboard verileri yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  // API endpoint - JSON veri döndürür
  static async getDashboardAPI(req, res) {
    try {
      const departments = await Department.findAll();
      const dashboardData = await EnergyMonthly.getDashboardData();
      const anomalies = await Anomaly.findAll(20);
      const suggestions = await Suggestion.findAll(10);
      const forecasts = await EnergyMonthly.getForecastData();

      res.json({
        success: true,
        data: {
          departments,
          dashboard: dashboardData,
          anomalies,
          suggestions,
          forecasts
        }
      });
    } catch (error) {
      console.error('Dashboard API hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Dashboard verileri yüklenirken hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Grafikler için veri hazırlama
  static async prepareChartData(departments, dashboardData, anomalies, suggestions) {
    try {
      // 1. Maliyet Dağılımı ve Anormallik Seviyeleri
      const costDistributionData = await this.getCostDistributionData(departments, dashboardData, anomalies);
      
      // 2. ROI Karşılaştırması
      const roiComparisonData = await this.getROIComparisonData(suggestions);
      
      // 3. Acil Müdahale Gauge
      const urgentActionData = await this.getUrgentActionData(anomalies);
      
      // 4. CO₂ Verimlilik Matrisi
      const co2EfficiencyData = await this.getCO2EfficiencyData(departments, dashboardData);
      
      // 5. Anormallik Heat Map
      const anomalyHeatMapData = await this.getAnomalyHeatMapData(departments, anomalies);

      return {
        costDistribution: costDistributionData,
        roiComparison: roiComparisonData,
        urgentAction: urgentActionData,
        co2Efficiency: co2EfficiencyData,
        anomalyHeatMap: anomalyHeatMapData
      };
    } catch (error) {
      console.error('Chart data hazırlama hatası:', error);
      return {
        costDistribution: [],
        roiComparison: [],
        urgentAction: { count: 0, departments: [] },
        co2Efficiency: [],
        anomalyHeatMap: []
      };
    }
  }

  // 1. Maliyet Dağılımı Donut Chart verisi
  static async getCostDistributionData(departments, dashboardData, anomalies) {
    try {
      console.log(`[getCostDistributionData] Gelen dashboardData uzunluğu: ${dashboardData.length}`);
      console.log(`[getCostDistributionData] İlk 3 satır:`, dashboardData.slice(0, 3).map(d => ({ 
        id: d.department_id, 
        name: d.department_name, 
        month: d.month_key,
        cost: d.total_cost_tl 
      })));

      // Son ayın verilerini al - month_key formatını normalize et
      const normalizeMonthKey = (key) => {
        if (!key) return null;
        if (key instanceof Date) {
          return key.toISOString().split('T')[0].substring(0, 7) + '-01'; // YYYY-MM-01
        }
        const str = String(key);
        // YYYY-MM-DD veya YYYY-MM-01 formatına çevir
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.substring(0, 7) + '-01';
        }
        return str;
      };

      const months = [...new Set(dashboardData.map(d => normalizeMonthKey(d.month_key)))].sort();
      const lastMonth = months[months.length - 1] || null;
      
      // Normalize edilmiş month_key ile filtrele
      const lastMonthData = dashboardData.filter(d => normalizeMonthKey(d.month_key) === lastMonth);

      console.log(`[getCostDistributionData] Son ay (normalize): ${lastMonth}`);
      console.log(`[getCostDistributionData] lastMonthData uzunluğu: ${lastMonthData.length}`);
      console.log(`[getCostDistributionData] Aktif departman sayısı: ${departments.filter(d => d.active === 1).length}`);
      
      // Eğer lastMonthData boşsa veya çok az ise, dashboardData'nın kendisini kullan (tüm departmanlar için)
      if (lastMonthData.length < departments.filter(d => d.active === 1).length) {
        console.log(`[getCostDistributionData] ⚠️ lastMonthData eksik! Tüm dashboardData kullanılıyor.`);
        // Tüm dashboardData'yı kullan, ancak month_key'leri normalize et
        const normalizedData = dashboardData.map(d => ({
          ...d,
          month_key_normalized: normalizeMonthKey(d.month_key)
        }));
        // En son ayın verilerini kullan, yoksa tüm verileri kullan
        const allLastMonthData = normalizedData.filter(d => d.month_key_normalized === lastMonth || !lastMonth);
        
        // Eksik departmanları ekle (departments'dan, lastMonthData'da olmayanlar)
        const missingDepts = departments
          .filter(d => d.active === 1)
          .filter(dept => !allLastMonthData.some(d => d.department_id === dept.department_id));
        
        console.log(`[getCostDistributionData] Eksik departman sayısı: ${missingDepts.length}`);
        
        // Eksik departmanları 0 değerlerle ekle
        missingDepts.forEach(dept => {
          allLastMonthData.push({
            department_id: dept.department_id,
            department_name: dept.department_name,
            month_key: lastMonth || new Date().toISOString().substring(0, 7) + '-01',
            total_kwh: 0,
            total_cost_tl: 0,
            total_co2_kg: 0
          });
        });
        
        // lastMonthData'yı güncelle
        lastMonthData.length = 0;
        lastMonthData.push(...allLastMonthData);
        console.log(`[getCostDistributionData] lastMonthData güncellendi, yeni uzunluk: ${lastMonthData.length}`);
      }

      // Toplam maliyeti hesapla (tüm aktif departmanlar dahil)
      const totalCost = lastMonthData.reduce((sum, d) => sum + parseFloat(d.total_cost_tl || 0), 0);

      // TÜM aktif departmanları dahil et (verisi olmasa bile)
      const result = departments
        .filter(d => d.active === 1)
        .map(dept => {
          // department_id ile eşleştir (daha güvenilir)
          const deptData = lastMonthData.find(d => d.department_id === dept.department_id);
          const deptCost = parseFloat(deptData?.total_cost_tl || 0);
          const percentage = totalCost > 0 ? (deptCost / totalCost * 100) : 0;

          // Anormallik seviyelerini say
          const deptAnomalies = anomalies.filter(a => {
            if (!a.department_name || !dept.department_name) return false;
            return a.department_name.trim().toLowerCase() === dept.department_name.trim().toLowerCase();
          });
          const highCount = deptAnomalies.filter(a => a.anomaly_level === 'high').length;
          const mediumCount = deptAnomalies.filter(a => a.anomaly_level === 'medium').length;
          const lowCount = deptAnomalies.filter(a => a.anomaly_level === 'low').length;

          return {
            department_id: dept.department_id,
            department_name: dept.department_name,
            cost: deptCost,
            percentage: percentage,
            anomaly_high: highCount,
            anomaly_medium: mediumCount,
            anomaly_low: lowCount,
            total_anomalies: deptAnomalies.length
          };
        })
        // Filtreyi kaldırdık - tüm departmanları göster (verisi olmasa bile)
        .sort((a, b) => b.cost - a.cost);

      console.log(`[getCostDistributionData] ${result.length} departman için veri hazırlandı`);
      console.log(`[getCostDistributionData] Departman maliyetleri:`, result.map(r => ({ name: r.department_name, cost: r.cost })));
      return result;
    } catch (error) {
      console.error('Maliyet dağılımı verisi hatası:', error);
      return [];
    }
  }

  // 2. ROI Karşılaştırması verisi
  static async getROIComparisonData(suggestions) {
    try {
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

      const result = suggestions.map(s => {
        const monthlySavings = parseFloat(s.expected_saving_tl || 0);
        const annualSavings = monthlySavings * 12;
        
        // Yatırım maliyetini bul (senaryo adından veya varsayılan)
        const investmentCost = parseFloat(s.investment_cost) || 
                               defaultInvestment[s.title] || 
                               100000;
        
        // ROI (Geri Dönüş Süresi - ay cinsinden)
        const roiMonths = monthlySavings > 0 ? (investmentCost / monthlySavings) : 999;

        return {
          suggestion_id: s.suggestion_id,
          title: s.title || 'Öneri',
          department_name: s.department_name || 'Genel',
          investment_cost: investmentCost,
          monthly_savings: monthlySavings,
          annual_savings: annualSavings,
          roi_months: roiMonths,
          expected_saving_co2_kg: parseFloat(s.expected_saving_co2_kg || 0)
        };
      })
      .filter(s => s.monthly_savings > 0)
      .sort((a, b) => a.roi_months - b.roi_months); // En kısa ROI en üstte

      return result;
    } catch (error) {
      console.error('ROI karşılaştırması verisi hatası:', error);
      return [];
    }
  }

  // 3. Acil Müdahale Gauge verisi
  static async getUrgentActionData(anomalies) {
    try {
      // Son 30 gün içindeki high anormallikleri say
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const highAnomalies = anomalies.filter(a => {
        if (a.anomaly_level !== 'high') return false;
        const detectedAt = new Date(a.detected_at);
        return detectedAt >= thirtyDaysAgo;
      });

      // Departman bazında grupla
      const deptMap = new Map();
      highAnomalies.forEach(a => {
        const deptName = a.department_name || 'Bilinmeyen';
        if (!deptMap.has(deptName)) {
          deptMap.set(deptName, {
            department_name: deptName,
            count: 0,
            latest_reason: a.anomaly_reason || 'Bilinmiyor',
            latest_date: a.detected_at
          });
        }
        const dept = deptMap.get(deptName);
        dept.count++;
        if (new Date(a.detected_at) > new Date(dept.latest_date)) {
          dept.latest_date = a.detected_at;
          dept.latest_reason = a.anomaly_reason || 'Bilinmiyor';
        }
      });

      const departments = Array.from(deptMap.values())
        .sort((a, b) => b.count - a.count);

      // Toplam high anormallik sayısı
      const totalHighAnomalies = highAnomalies.length;
      // En az 1, maksimum olarak da toplam sayının 1.5 katı veya minimum 10
      const maxGauge = Math.max(10, Math.ceil(totalHighAnomalies * 1.2));

      return {
        count: totalHighAnomalies,
        max_gauge: maxGauge,
        departments: departments,
        department_count: departments.length // Departman sayısını da ekle
      };
    } catch (error) {
      console.error('Acil müdahale verisi hatası:', error);
      return { count: 0, max_gauge: 10, departments: [] };
    }
  }

  // 4. CO₂ Verimlilik Matrisi verisi
  static async getCO2EfficiencyData(departments, dashboardData) {
    try {
      const months = [...new Set(dashboardData.map(d => d.month_key))].sort();
      const lastMonth = months[months.length - 1] || null;
      const lastMonthData = dashboardData.filter(d => d.month_key === lastMonth);

      const result = departments
        .filter(d => d.active === 1)
        .map(dept => {
          const deptData = lastMonthData.find(d => 
            d.department_name && d.department_name.trim().toLowerCase() === dept.department_name.trim().toLowerCase()
          );
          
          const consumption = parseFloat(deptData?.total_kwh || 0);
          const cost = parseFloat(deptData?.total_cost_tl || 0);
          const co2 = parseFloat(deptData?.total_co2_kg || 0);
          const employeeCount = parseFloat(dept.employee_count || 1);

          // kWh/Çalışan oranı
          const kwhPerEmployee = employeeCount > 0 ? (consumption / employeeCount) : 0;
          
          // CO₂ yoğunluğu (kg/TL)
          const co2Intensity = cost > 0 ? (co2 / cost) : 0;

          return {
            department_id: dept.department_id,
            department_name: dept.department_name,
            consumption_kwh: consumption,
            cost_tl: cost,
            co2_kg: co2,
            employee_count: employeeCount,
            kwh_per_employee: kwhPerEmployee,
            co2_intensity: co2Intensity
          };
        });
        // Filtreyi kaldırdık - tüm departmanları göster

      console.log(`[getCO2EfficiencyData] ${result.length} departman için veri hazırlandı`);
      return result;
    } catch (error) {
      console.error('CO₂ verimlilik verisi hatası:', error);
      return [];
    }
  }

  // 5. Anormallik Heat Map verisi
  static async getAnomalyHeatMapData(departments, anomalies) {
    try {
      // Son 6 ayı al
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      
      // Ay ve departman bazında grupla
      const heatMapData = {};
      
      anomalies.forEach(a => {
        // Önce month_key'i kontrol et (energy_monthly'den gelir)
        let monthKey = null;
        if (a.month_key) {
          // month_key zaten YYYY-MM-DD formatında olabilir, sadece YYYY-MM kısmını al
          const dateStr = String(a.month_key);
          if (/^\d{4}-\d{2}/.test(dateStr)) {
            monthKey = dateStr.substring(0, 7); // İlk 7 karakter (YYYY-MM)
          } else {
            // Date objesi ise
            const date = new Date(a.month_key);
            if (!isNaN(date.getTime())) {
              monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
          }
        }
        
        // month_key yoksa detected_at'ı kullan
        if (!monthKey && a.detected_at) {
          let detectedAt;
          if (a.detected_at instanceof Date) {
            detectedAt = a.detected_at;
          } else if (typeof a.detected_at === 'string') {
            detectedAt = new Date(a.detected_at);
          }
          
          if (detectedAt && !isNaN(detectedAt.getTime())) {
            // Son 6 ay içinde mi kontrol et
            if (detectedAt >= sixMonthsAgo) {
              const year = detectedAt.getFullYear();
              const month = detectedAt.getMonth() + 1;
              monthKey = `${year}-${String(month).padStart(2, '0')}`;
            }
          }
        }
        
        // month_key hala yoksa atla
        if (!monthKey) {
          return;
        }
        
        const deptName = a.department_name || 'Bilinmeyen';
        const key = `${deptName}|${monthKey}`;
        
        if (!heatMapData[key]) {
          heatMapData[key] = {
            department_name: deptName,
            month_key: monthKey,
            high: 0,
            medium: 0,
            low: 0,
            total: 0
          };
        }
        
        const level = a.anomaly_level || 'low';
        if (level === 'high') heatMapData[key].high++;
        else if (level === 'medium') heatMapData[key].medium++;
        else heatMapData[key].low++;
        
        heatMapData[key].total++;
      });
      
      console.log('[getAnomalyHeatMapData] Heat map verileri:', Object.values(heatMapData).length, 'kayıt');
      console.log('[getAnomalyHeatMapData] Örnek veriler:', Object.values(heatMapData).slice(0, 10).map(d => ({ 
        dept: d.department_name, 
        month: d.month_key, 
        total: d.total 
      })));

      return Object.values(heatMapData);
    } catch (error) {
      console.error('Anormallik heat map verisi hatası:', error);
      return [];
    }
  }
}

module.exports = DashboardController;

