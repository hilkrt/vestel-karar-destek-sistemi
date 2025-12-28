const PDFDocument = require('pdfkit');
const EnergyMonthly = require('../models/EnergyMonthly');
const Anomaly = require('../models/Anomaly');
const Suggestion = require('../models/Suggestion');
const Department = require('../models/Department');
const Scenario = require('../models/Scenario');

class ReportController {
  // Senaryo Analizi PDF Raporu
  static async generateScenarioPDF(req, res) {
    try {
      const scenarios = await Scenario.findAll();
      const departments = await Department.findAll();
      
      // Action type mapping (kısa kodlardan Türkçe'ye)
      const actionTypeMapping = {
        'lighting': 'Aydınlatma İyileştirme',
        'hvac': 'HVAC Optimizasyonu',
        'equipment': 'Ekipman Değişimi',
        'insulation': 'İzolasyon İyileştirme',
        'ems': 'Enerji Yönetim Sistemi',
        'renewable': 'Yenilenebilir Enerji',
        'scheduling': 'Zamanlama Optimizasyonu',
        'maintenance': 'Bakım Programı',
        'sensors': 'Akıllı Sensör Sistemi',
        'training': 'Enerji Verimliliği Eğitimi'
      };
      
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Vestel Karar Destek Sistemi - Senaryo Analizi Raporu',
          Author: 'Vestel Enerji Yönetimi',
          Subject: 'Senaryo Analizi Raporu'
        }
      });

      res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="senaryo-analizi-raporu.pdf"');
      doc.pipe(res);

      // Başlık
      doc.fontSize(24)
         .fillColor('#dc143c')
         .text('Vestel Karar Destek Sistemi', { align: 'center' })
         .moveDown(0.5);
      
      doc.fontSize(18)
         .fillColor('#333333')
         .text('Senaryo Analizi Raporu', { align: 'center' })
         .moveDown(0.5);
      
      const dateStr = new Date().toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Oluşturulma Tarihi: ${dateStr}`, { align: 'center' })
         .moveDown(1);

      // Senaryolar
      if (scenarios && scenarios.length > 0) {
        doc.fontSize(16)
           .fillColor('#dc143c')
           .text('Mevcut Senaryolar', { underline: true })
           .moveDown(0.5);
        
        doc.fontSize(10)
           .fillColor('#333333');
        
        scenarios.forEach((scenario, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          
          const scenarioName = scenario.scenario_name || 'Senaryo';
          
          doc.font('Helvetica-Bold')
             .fillColor('#333333')
             .fontSize(12)
             .text(`${index + 1}. ${scenarioName}`);
          
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor('#666666');
          
          if (scenario.action_type) {
            const actionTypeText = actionTypeMapping[scenario.action_type] || scenario.action_type;
            doc.text(`   Aksiyon Tipi: ${actionTypeText}`, { indent: 20 });
          }
          if (scenario.expected_reduction_pct !== undefined && scenario.expected_reduction_pct !== null) {
            const reduction = parseFloat(scenario.expected_reduction_pct).toFixed(2);
            doc.text(`   Beklenen Azalma: %${reduction}`, { indent: 20 });
          }
          if (scenario.description) {
            doc.text(`   Açıklama: ${scenario.description}`, { indent: 20, width: 480 });
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(12)
           .fillColor('#999999')
           .text('Henüz senaryo bulunmamaktadır.', { align: 'center' });
      }

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text('Vestel Karar Destek Sistemi - Bu rapor otomatik olarak oluşturulmuştur.', 
               50, 
               doc.page.height - 50, 
               { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      res.status(500).json({ 
        success: false, 
        message: 'PDF oluşturulurken hata oluştu: ' + error.message 
      });
    }
  }
}

module.exports = ReportController;


