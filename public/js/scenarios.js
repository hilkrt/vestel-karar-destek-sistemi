// Senaryo Karşılaştırma JavaScript

let consumptionPieChart = null;
let costPieChart = null;
let co2PieChart = null;
let roiChart = null;
let annualSavingsChart = null;
let priorityScoreChart = null;
let investmentVsSavingsChart = null;

// Gradient renk helper fonksiyonu
function createGradient(ctx, colorStart, colorEnd, direction = 'vertical') {
    const gradient = direction === 'vertical' 
        ? ctx.createLinearGradient(0, 0, 0, 400)
        : ctx.createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

// Gradient renk paleti oluştur
function createGradientColors(ctx, baseColors, direction = 'vertical') {
    const gradients = baseColors.map(color => {
        // Hex rengi RGB'ye çevir ve daha açık versiyonu oluştur
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const lightColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
        return createGradient(ctx, color, lightColor, direction);
    });
    return gradients;
}

// Türkçe sayı formatını parse eden helper fonksiyon
// "0,14" -> 0.14, "100.000" -> 100000, "100.000,50" -> 100000.50
function parseTurkishNumber(value) {
    if (!value || value === '') return null;
    // String'e çevir ve boşlukları kaldır
    let str = String(value).trim().replace(/\s/g, '');
    
    // Eğer hem nokta hem virgül varsa: Türkçe format (nokta binlik, virgül ondalık)
    if (str.includes(',') && str.includes('.')) {
        // Son virgülden önceki tüm noktaları kaldır (binlik ayırıcılar)
        const lastCommaIndex = str.lastIndexOf(',');
        const beforeComma = str.substring(0, lastCommaIndex).replace(/\./g, '');
        const afterComma = str.substring(lastCommaIndex + 1);
        // Virgülü noktaya çevir (ondalık ayırıcı)
        str = beforeComma + '.' + afterComma;
    } else if (str.includes(',')) {
        // Sadece virgül varsa: ondalık ayırıcı olarak kullan, noktaya çevir
        str = str.replace(',', '.');
    } else if (str.includes('.')) {
        // Sadece nokta varsa: Türkçe'de genellikle binlik ayırıcıdır
        // Eğer noktadan sonra 3 hane varsa, muhtemelen binlik ayırıcı
        const parts = str.split('.');
        if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            // Son kısım 3 haneli, muhtemelen binlik ayırıcı - tüm noktaları kaldır
            str = str.replace(/\./g, '');
        }
        // Aksi halde ondalık ayırıcı olarak kabul et (İngilizce format)
    }
    
    // parseFloat ile sayıya çevir
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
}

document.addEventListener('DOMContentLoaded', function() {
    const compareBtn = document.getElementById('compareBtn');
    const scenarioCheckboxes = document.querySelectorAll('.scenario-checkbox');
    const refreshScenariosBtn = document.getElementById('refreshScenariosBtn');

    // Senaryoları yenile butonu
    if (refreshScenariosBtn) {
        refreshScenariosBtn.addEventListener('click', function() {
            location.reload();
        });
    }

    // Senaryo silme butonları
    document.querySelectorAll('.btn-delete-scenario').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const scenarioId = this.getAttribute('data-id');
            const scenarioName = this.closest('.scenario-card-select').querySelector('strong').textContent;
            
            if (!confirm(`"${scenarioName}" senaryosunu silmek istediğinize emin misiniz?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/scenarios/${scenarioId}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.success) {
                    alert('Senaryo başarıyla silindi!');
                    location.reload();
                } else {
                    alert('Hata: ' + result.message);
                }
            } catch (error) {
                console.error('Hata:', error);
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        });
    });

    // Karşılaştır butonuna tıklanınca
    compareBtn.addEventListener('click', async function() {
        const selectedScenarios = Array.from(scenarioCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));

        if (selectedScenarios.length === 0) {
            alert('Lütfen en az bir senaryo seçin!');
            return;
        }

        const departmentIdRaw = document.getElementById('departmentSelect').value;
        const departmentId = departmentIdRaw && departmentIdRaw !== '' ? departmentIdRaw : null;
        const monthSelect = document.getElementById('monthSelect');
        const monthKey = monthSelect && monthSelect.value !== '' ? monthSelect.value : null;

        // Debug
        console.log('Karşılaştırma parametreleri:', { scenarioIds: selectedScenarios, departmentId, monthKey });

        // Karşılaştırma isteği
        try {
            const response = await fetch('/api/scenarios/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenarioIds: selectedScenarios,
                    departmentId: departmentId,
                    monthKey: monthKey
                })
            });

            const result = await response.json();

            if (result.success) {
                displayComparisonResults(result.data);
            } else {
                alert('Karşılaştırma yapılırken hata oluştu: ' + result.message);
            }
        } catch (error) {
            console.error('Hata:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    });
});

function displayComparisonResults(data) {
    const { baseData, comparisons } = data;
    const resultsDiv = document.getElementById('comparisonResults');
    resultsDiv.style.display = 'block';

    // Debug: Veriyi konsola yazdır
    console.log('Karşılaştırma verisi:', { baseData, comparisons, comparisonsLength: comparisons?.length });
    if (comparisons && comparisons.length > 0) {
        comparisons.forEach((comp, idx) => {
            console.log(`[Frontend] Senaryo ${idx + 1} (${comp.scenario_name}):`, {
                employee_reduction: comp.employee_reduction,
                employee_reduction_type: typeof comp.employee_reduction,
                employee_reduction_is_null: comp.employee_reduction === null,
                employee_reduction_is_undefined: comp.employee_reduction === undefined,
                annual_savings: comp.decision_metrics?.annual_savings,
                full_comparison: comp
            });
        });
    }

    // KPI'ları hesapla ve göster
    if (comparisons && comparisons.length > 0) {
        calculateAndDisplayKPIs(comparisons, baseData);
    }

    // Grafikleri oluştur
    drawPieCharts(baseData, comparisons);
    
    // Stacked Area Chart oluştur
    if (comparisons && comparisons.length > 0) {
        drawStackedAreaChart(comparisons, baseData);
    }
    
    // Karar destek grafiklerini oluştur
    if (comparisons && comparisons.length > 0) {
        drawDecisionCharts(comparisons, baseData);
    }
    
    // Karar destek önerisini göster (comparisons ve decision_metrics kontrolü içinde yapılıyor)
    if (comparisons && comparisons.length > 0) {
        displayDecisionSupport(comparisons);
    } else {
        console.warn('Karşılaştırma sonuçları boş');
    }
    
    // Karar matrisi tablosunu doldur
    if (comparisons && comparisons.length > 0) {
        fillDecisionMatrix(comparisons);
    }
    
    // Detaylı karşılaştırma tablosunu doldur
    if (comparisons && comparisons.length > 0) {
        fillComparisonTable(comparisons, baseData);
    }

    // Sonuçlara kaydır
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// KPI hesaplama ve gösterimi
function calculateAndDisplayKPIs(comparisons, baseData) {
    let totalAnnualSavings = 0;
    let totalInvestment = 0;
    let totalROI = 0;
    let totalCO2Savings = 0;
    let validROICount = 0;

    comparisons.forEach(comp => {
        const metrics = comp.decision_metrics;
        if (metrics) {
            totalAnnualSavings += metrics.annual_savings || 0;
            totalInvestment += metrics.investment_cost || 0;
            if (metrics.roi_months && metrics.roi_months < 999) {
                totalROI += metrics.roi_months;
                validROICount++;
            }
        }
        if (comp.impacts && comp.impacts.savings_co2_kg) {
            totalCO2Savings += comp.impacts.savings_co2_kg;
        }
    });

    const avgROI = validROICount > 0 ? (totalROI / validROICount) : 0;

    // KPI değerlerini göster
    document.getElementById('kpiTotalSavings').textContent = totalAnnualSavings.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' TL';
    
    document.getElementById('kpiTotalInvestment').textContent = totalInvestment.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' TL';
    
    document.getElementById('kpiAvgROI').textContent = avgROI.toFixed(1) + ' Ay';
    
    document.getElementById('kpiTotalCO2').textContent = totalCO2Savings.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' kg';
}

// Aylık Tasarruf Projeksiyonu Chart - Grouped Bar Chart (Daha Anlaşılır)
let stackedAreaChart = null;
function drawStackedAreaChart(comparisons, baseData) {
    const ctx = document.getElementById('stackedAreaChart');
    if (!ctx) return;

    if (stackedAreaChart) stackedAreaChart.destroy();

    // Senaryoları etki büyüklüğüne göre sırala (en yüksek en üstte)
    const sortedComparisons = [...comparisons].sort((a, b) => {
        const aSavings = a.decision_metrics?.annual_savings || a.impacts?.savings_tl * 12 || 0;
        const bSavings = b.decision_metrics?.annual_savings || b.impacts?.savings_tl * 12 || 0;
        return bSavings - aSavings;
    });

    // Modern ve ayırt edilebilir renk paleti (kırmızı-siyah tonları)
    const colorPalette = [
        { bg: 'rgba(220, 20, 60, 0.85)', border: '#dc143c', hover: 'rgba(220, 20, 60, 0.95)' },  // Kırmızı
        { bg: 'rgba(139, 0, 0, 0.85)', border: '#8B0000', hover: 'rgba(139, 0, 0, 0.95)' },     // Koyu Kırmızı
        { bg: 'rgba(178, 34, 34, 0.85)', border: '#B22222', hover: 'rgba(178, 34, 34, 0.95)' }, // Ateş Kırmızısı
        { bg: 'rgba(255, 69, 0, 0.85)', border: '#FF4500', hover: 'rgba(255, 69, 0, 0.95)' },   // Kızıl Turuncu
        { bg: 'rgba(128, 0, 0, 0.85)', border: '#800000', hover: 'rgba(128, 0, 0, 0.95)' },     // Maroon
        { bg: 'rgba(255, 20, 147, 0.85)', border: '#FF1493', hover: 'rgba(255, 20, 147, 0.95)' }, // Derin Pembe
        { bg: 'rgba(25, 25, 25, 0.85)', border: '#191919', hover: 'rgba(25, 25, 25, 0.95)' },   // Siyah
        { bg: 'rgba(64, 64, 64, 0.85)', border: '#404040', hover: 'rgba(64, 64, 64, 0.95)' }    // Gri
    ];
    
    // 12 aylık projeksiyon oluştur
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    // Maksimum 6 senaryo göster (çok kalabalık olmasın)
    const visibleScenarios = sortedComparisons.slice(0, 6);
    
    const datasets = visibleScenarios.map((comp, idx) => {
        // Aylık tasarrufu hesapla
        const monthlySavings = comp.impacts?.savings_tl || 
                              (comp.decision_metrics?.annual_savings || 0) / 12 || 0;
        
        // 12 ay için aynı değeri kullan (projeksiyon)
        const monthlyData = months.map(() => monthlySavings);
        
        const color = colorPalette[idx % colorPalette.length];
        
        return {
            label: comp.scenario_name || `Senaryo ${idx + 1}`,
            data: monthlyData,
            backgroundColor: color.bg,
            borderColor: color.border,
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
            // Hover efekti için
            hoverBackgroundColor: color.hover,
            hoverBorderColor: color.border,
            hoverBorderWidth: 3
        };
    });
    
    stackedAreaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Aylık Tasarruf Projeksiyonu (TL)',
                    font: {
                        size: 20,
                        weight: 'bold',
                        family: "'Inter', system-ui, -apple-system, sans-serif"
                    },
                    color: '#1a1a1a',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        usePointStyle: true,
                        padding: 12,
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        color: '#1a1a1a',
                        boxWidth: 14,
                        boxHeight: 14
                    },
                    onClick: (e, legendItem) => {
                        const index = legendItem.datasetIndex;
                        const chart = stackedAreaChart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                        chart.update();
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 14,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13,
                        weight: '500'
                    },
                    displayColors: true,
                    boxPadding: 6,
                    callbacks: {
                        title: function(context) {
                            return `📅 ${context[0].label} - ${new Date().getFullYear()}`;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            
                            // Toplam tasarrufu hesapla (12 ay)
                            const annualTotal = value * 12;
                            
                            return [
                                `${label}:`,
                                `  Aylık: ${value.toLocaleString('tr-TR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })} TL`,
                                `  Yıllık (Tahmini): ${annualTotal.toLocaleString('tr-TR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })} TL`
                            ];
                        },
                        afterLabel: function(context) {
                            // Tüm senaryoların toplamını göster
                            if (context.datasetIndex === datasets.length - 1) {
                                const totalThisMonth = context.dataset.data.reduce((sum, val, idx) => {
                                    return sum + (datasets[idx].data[context.dataIndex] || 0);
                                }, 0);
                                return [
                                    '',
                                    '━━━━━━━━━━━━━━━━',
                                    `💰 Toplam Aylık: ${totalThisMonth.toLocaleString('tr-TR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })} TL`,
                                    `📊 Toplam Yıllık: ${(totalThisMonth * 12).toLocaleString('tr-TR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })} TL`
                                ];
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Ay (2025 Projeksiyonu)',
                        color: '#374151',
                        font: { 
                            size: 15, 
                            weight: 'bold',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        padding: { top: 10, bottom: 5 }
                    },
                    ticks: {
                        color: '#6b7280',
                        font: { 
                            size: 12,
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        padding: 8
                    },
                    grid: {
                        display: false,
                        drawBorder: true,
                        borderColor: '#e5e7eb',
                        borderWidth: 1
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Aylık Tasarruf (TL)',
                        color: '#374151',
                        font: { 
                            size: 15, 
                            weight: 'bold',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        padding: { top: 5, bottom: 10 }
                    },
                    ticks: {
                        color: '#6b7280',
                        font: { 
                            size: 12,
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        padding: 10,
                        callback: function(value) {
                            if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K TL';
                            }
                            return value.toLocaleString('tr-TR', {
                                maximumFractionDigits: 0
                            }) + ' TL';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.06)',
                        lineWidth: 1,
                        drawBorder: false,
                        borderDash: [5, 5]
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 5,
                    right: 5
                }
            }
        }
    });
    
    // Stacked Area Chart Insight Box - Dinamik Çıktı
    const stackedAreaInsightBox = document.getElementById('stackedAreaInsightBox');
    if (stackedAreaInsightBox && visibleScenarios.length > 0) {
        // En yüksek aylık tasarrufa sahip senaryoyu bul
        const scenarioWithMonthlyData = visibleScenarios.map((comp, idx) => {
            const monthlySavings = comp.impacts?.savings_tl || 
                                  (comp.decision_metrics?.annual_savings || 0) / 12 || 0;
            return {
                name: comp.scenario_name,
                monthlySavings: monthlySavings,
                annualSavings: monthlySavings * 12
            };
        });
        
        const sortedByMonthly = [...scenarioWithMonthlyData].sort((a, b) => b.monthlySavings - a.monthlySavings);
        const topMonthlyScenario = sortedByMonthly[0];
        
        // Toplam yıllık tasarruf potansiyeli
        const totalMonthlySavings = scenarioWithMonthlyData.reduce((sum, s) => sum + s.monthlySavings, 0);
        const totalAnnualSavings = totalMonthlySavings * 12;
        
        // İkinci en yüksek senaryo (karşılaştırma için)
        const secondScenario = sortedByMonthly.length > 1 ? sortedByMonthly[1] : null;
        const monthlyDifference = secondScenario ? (topMonthlyScenario.monthlySavings - secondScenario.monthlySavings) : 0;
        const annualDifference = monthlyDifference * 12;
        
        stackedAreaInsightBox.innerHTML = `
            <div style="background: #fff5f5; border-left: 4px solid #dc143c; padding: 16px; border-radius: 8px;">
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(220, 20, 60, 0.2);">
                    <strong style="color: #dc143c; font-size: 0.95em; display: block; margin-bottom: 6px;">📊 Bu Grafik Ne İşe Yarar?</strong>
                    <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; line-height: 1.6;">
                        Bu grafik, senaryoların <strong>12 aylık süreçte aylık bazda ne kadar tasarruf sağlayacağını</strong> gösterir. Her senaryonun aylık tasarrufunu yan yana görerek, <strong>"Hangi senaryo aylık bazda en çok tasarruf sağlar?"</strong> sorusuna cevap bulabilirsiniz. Grafik, zaman içindeki tasarruf trendini ve farklı senaryoların birbirine göre performansını karşılaştırmanıza yardımcı olur. Bütçe planlaması ve nakit akışı analizi için kullanışlıdır.
                    </p>
                </div>
                <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; font-weight: 600;">
                    <strong>💡 Sonuç:</strong> <strong>${topMonthlyScenario.name}</strong> en yüksek aylık tasarrufu sağlıyor: 
                    <strong style="color: #dc143c;">${topMonthlyScenario.monthlySavings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL/ay</strong> 
                    (≈ <strong style="color: #dc143c;">${topMonthlyScenario.annualSavings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL/yıl</strong>).
                    ${secondScenario && monthlyDifference > 0 ? ` İkinci en yüksek senaryo olan ${secondScenario.name}'den ayda <strong style="color: #dc143c;">${monthlyDifference.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL</strong> (yılda <strong style="color: #dc143c;">${annualDifference.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL</strong>) daha fazla tasarruf sağlıyor.` : ''}
                    ${visibleScenarios.length > 1 ? ` Tüm senaryolar birlikte ayda <strong style="color: #dc143c;">${totalMonthlySavings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL</strong> (yılda <strong style="color: #dc143c;">${totalAnnualSavings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL</strong>) tasarruf potansiyeli sunuyor.` : ''}
                </p>
            </div>
        `;
    }
}

function drawPieCharts(baseData, comparisons) {
    const baseValues = {
        consumption: parseFloat(baseData.total_kwh || 0),
        cost: parseFloat(baseData.total_cost_tl || 0),
        co2: parseFloat(baseData.total_co2_kg || 0)
    };

    // Tüketim Donut Grafiği
    const consumptionPieCtx = document.getElementById('consumptionPieChart').getContext('2d');
    if (consumptionPieChart) consumptionPieChart.destroy();
    
    const consumptionLabels = ['Mevcut Durum', ...comparisons.map(c => c.scenario_name)];
    const consumptionData = [baseValues.consumption, ...comparisons.map(c => c.impacts.consumption_kwh)];
    const consumptionTotal = consumptionData.reduce((a, b) => a + b, 0);
    
    // Ortadaki toplam değeri güncelle
    const consumptionCenter = document.getElementById('consumptionCenterText');
    if (consumptionCenter) {
        const valueEl = consumptionCenter.querySelector('.donut-center-value');
        const labelEl = consumptionCenter.querySelector('.donut-center-label');
        if (valueEl) valueEl.textContent = consumptionTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (labelEl) labelEl.textContent = 'kWh';
    }
    // Mevcut durum için gri, senaryolar için farklı renkler
    const consumptionBaseColors = [
        '#666666', // Mevcut Durum - Gri
        '#dc143c', // Senaryo 1 - Kırmızı (Vestel)
        '#2563eb', // Senaryo 2 - Mavi
        '#059669', // Senaryo 3 - Yeşil
        '#ea580c', // Senaryo 4 - Turuncu
        '#7c3aed', // Senaryo 5 - Mor
        '#0891b2', // Senaryo 6 - Cyan
        '#ca8a04', // Senaryo 7 - Altın sarısı
        '#be185d', // Senaryo 8 - Pembe
        '#166534'  // Senaryo 9 - Koyu yeşil
    ];
    
    // Gradient renkler oluştur
    const consumptionColors = consumptionBaseColors.slice(0, consumptionLabels.length).map((color, idx) => {
        if (idx === 0) return color; // Mevcut durum için gradient kullanma
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    });
    
    consumptionPieChart = new Chart(consumptionPieCtx, {
        type: 'doughnut',
        data: {
            labels: consumptionLabels,
            datasets: [{
                data: consumptionData,
                backgroundColor: consumptionColors,
                borderColor: '#ffffff',
                borderWidth: 4,
                hoverBorderWidth: 6,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        color: '#1a1a1a',
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Segoe UI', Roboto, sans-serif"
                        },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 12,
                        boxHeight: 12,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i] || 0;
                                    const total = data.datasets[0].data.reduce((a, b) => (a || 0) + (b || 0), 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                    // Tüketim için - önce yüzde, sonra kWh
                                    return {
                                        text: `${label}: ${percentage}% - ${value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kWh`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: 2,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: {
                        size: 15,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13,
                        weight: '500'
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => (a || 0) + (b || 0), 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
                            return [
                                `Değer: ${value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kWh`,
                                `Yüzde: ${percentage}%`
                            ];
                        }
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });

    // Maliyet Donut Grafiği
    const costPieCtx = document.getElementById('costPieChart').getContext('2d');
    if (costPieChart) costPieChart.destroy();
    
    const costLabels = ['Mevcut Durum', ...comparisons.map(c => c.scenario_name)];
    const costData = [baseValues.cost, ...comparisons.map(c => c.impacts.cost_tl)];
    const costTotal = costData.reduce((a, b) => a + b, 0);
    
    // Ortadaki toplam değeri güncelle
    const costCenter = document.getElementById('costCenterText');
    if (costCenter) {
        const valueEl = costCenter.querySelector('.donut-center-value');
        const labelEl = costCenter.querySelector('.donut-center-label');
        if (valueEl) valueEl.textContent = costTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (labelEl) labelEl.textContent = 'TL';
    }
    
    // Gradient renkler oluştur
    const costColors = consumptionBaseColors.slice(0, costLabels.length).map((color, idx) => {
        if (idx === 0) return color; // Mevcut durum için gradient kullanma
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    });
    
    costPieChart = new Chart(costPieCtx, {
        type: 'doughnut',
        data: {
            labels: costLabels,
            datasets: [{
                data: costData,
                backgroundColor: costColors,
                borderColor: '#ffffff',
                borderWidth: 4,
                hoverBorderWidth: 6,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutCubic'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        color: '#1a1a1a',
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Segoe UI', Roboto, sans-serif"
                        },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 12,
                        boxHeight: 12,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => (a || 0) + (b || 0), 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                    // Maliyet için - önce yüzde, sonra TL
                                    return {
                                        text: `${label}: ${percentage}% - ${value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: 2,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: {
                        size: 15,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13,
                        weight: '500'
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return [
                                `Değer: ${value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL`,
                                `Yüzde: ${percentage}%`
                            ];
                        }
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });

    // CO₂ Donut Grafiği
    const co2PieCtx = document.getElementById('co2PieChart').getContext('2d');
    if (co2PieChart) co2PieChart.destroy();
    
    const co2Labels = ['Mevcut Durum', ...comparisons.map(c => c.scenario_name)];
    const co2Data = [baseValues.co2, ...comparisons.map(c => c.impacts.co2_kg)];
    const co2Total = co2Data.reduce((a, b) => a + b, 0);
    
    // Ortadaki toplam değeri güncelle
    const co2Center = document.getElementById('co2CenterText');
    if (co2Center) {
        const valueEl = co2Center.querySelector('.donut-center-value');
        const labelEl = co2Center.querySelector('.donut-center-label');
        if (valueEl) valueEl.textContent = co2Total.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (labelEl) labelEl.textContent = 'kg';
    }
    
    // Gradient renkler oluştur
    const co2Colors = consumptionBaseColors.slice(0, co2Labels.length).map((color, idx) => {
        if (idx === 0) return color; // Mevcut durum için gradient kullanma
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    });
    
    co2PieChart = new Chart(co2PieCtx, {
        type: 'doughnut',
        data: {
            labels: co2Labels,
            datasets: [{
                data: co2Data,
                backgroundColor: co2Colors,
                borderColor: '#ffffff',
                borderWidth: 4,
                hoverBorderWidth: 6,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutCubic'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        color: '#1a1a1a',
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Segoe UI', Roboto, sans-serif"
                        },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 12,
                        boxHeight: 12,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => (a || 0) + (b || 0), 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                    // CO2 için - önce yüzde, sonra kg
                                    return {
                                        text: `${label}: ${percentage}% - ${value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: 2,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: {
                        size: 15,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13,
                        weight: '500'
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return [
                                `Değer: ${value.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg`,
                                `Yüzde: ${percentage}%`
                            ];
                        }
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });
    
    // Pie Charts Insight Box
    const pieChartsInsightBox = document.getElementById('pieChartsInsightBox');
    if (pieChartsInsightBox && comparisons.length > 0) {
        pieChartsInsightBox.innerHTML = `
            <div style="background: #fff5f5; border-left: 4px solid #dc143c; padding: 16px; border-radius: 8px;">
                <strong style="color: #dc143c; font-size: 0.95em; display: block; margin-bottom: 6px;">📊 Bu Grafikler Ne İşe Yarar?</strong>
                <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; line-height: 1.6;">
                    Bu pasta grafikleri (donut chart), <strong>mevcut durumunuz ile senaryoların sonuçlarını yüzdelik olarak karşılaştırır.</strong> Her grafik (Tüketim, Maliyet, CO₂) size şunu gösterir: <strong>"Mevcut durumum toplamın ne kadarı? Senaryoların her biri toplamın ne kadarı?"</strong> Grafiklerdeki yüzde değerleri, hangi senaryonun daha büyük bir etkiye sahip olduğunu ve mevcut duruma göre ne kadar değişim sağlandığını anlamanıza yardımcı olur. Merkezdeki sayı, toplam değeri gösterir.
                </p>
            </div>
        `;
    }
}

// Bar grafikler kaldırıldı - sadece pasta grafikler kullanılıyor

// Karar Destek Grafikleri Fonksiyonu
function drawDecisionCharts(comparisons, baseData) {
    // Senaryo isimlerini ve renkleri hazırla
    const colors = ['#dc143c', '#2563eb', '#059669', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#be185d', '#166534', '#1e40af'];
    
    // Toplam maliyeti hesapla (baseData'dan)
    let totalCost = 0;
    if (baseData && baseData.length > 0) {
        totalCost = baseData.reduce((sum, item) => sum + (parseFloat(item.total_cost_tl) || 0), 0);
    }
    // Global Chart.js defaults for a cleaner, more professional appearance
    try {
        Chart.defaults.font.family = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
        Chart.defaults.font.size = 13;
        Chart.defaults.color = '#1f2937';
        Chart.defaults.plugins.legend.labels.boxWidth = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.datasets = Chart.defaults.datasets || {};
        Chart.defaults.datasets.bar = Object.assign(Chart.defaults.datasets.bar || {}, {
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 'flex',
            maxBarThickness: 60,
            borderWidth: 0
        });
    } catch (e) {
        // ignore if Chart isn't loaded yet
    }

    // small helper to convert hex to rgba
    function hexToRgba(hex, alpha) {
        if (!hex) return `rgba(0,0,0,${alpha})`;
        const h = hex.replace('#', '');
        const r = parseInt(h.substr(0, 2), 16);
        const g = parseInt(h.substr(2, 2), 16);
        const b = parseInt(h.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // ROI Grafiği - Vertical Bar Chart (en kısa ROI en solda)
    const roiCtx = document.getElementById('roiChart');
    if (!roiCtx) return;
    
    // Aksiyon tipi Türkçe isimlerini kısaltma/karmaşık isimlerini sadeleştirme
    const actionTypeMap = {
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
    
    // Aksiyon tipini Türkçe'ye çevir veya direkt kullan
    const getActionTypeLabel = (actionType) => {
        if (!actionType) return 'Genel';
        
        // Case-insensitive kontrol için lowercase'e çevir
        const actionTypeLower = actionType.toLowerCase().trim();
        
        // Önce İngilizce kodları kontrol et (case-insensitive)
        if (actionTypeMap[actionTypeLower]) {
            return actionTypeMap[actionTypeLower];
        }
        
        // Eğer zaten Türkçe ise direkt kullan
        if (actionType.length > 10) {
            // Türkçe isimlerden kısaltılmış versiyon oluştur
            if (actionType.includes('Aydınlatma')) return 'Aydınlatma İyileştirme';
            if (actionType.includes('HVAC')) return 'HVAC Optimizasyonu';
            if (actionType.includes('Ekipman')) return 'Ekipman Değişimi';
            if (actionType.includes('İzolasyon')) return 'İzolasyon İyileştirme';
            if (actionType.includes('Enerji Yönetim')) return 'Enerji Yönetim Sistemi';
            if (actionType.includes('Yenilenebilir')) return 'Yenilenebilir Enerji';
            if (actionType.includes('Zamanlama')) return 'Zamanlama Optimizasyonu';
            if (actionType.includes('Bakım')) return 'Bakım Programı';
            if (actionType.includes('Sensör')) return 'Akıllı Sensör Sistemi';
            if (actionType.includes('Eğitim')) return 'Enerji Verimliliği Eğitimi';
            return actionType.substring(0, 25);
        }
        
        // Son çare olarak direkt döndür
        return actionType;
    };
    
    // ROI değerlerine göre sırala (en kısa ROI en üstte)
    // 999 gibi çok büyük ROI değerlerini filtrele (geçersiz değerler)
    const roiData = comparisons
        .map((c, idx) => {
            const roi = c.decision_metrics?.roi_months || 999;
            const actionType = getActionTypeLabel(c.action_type);
            const reduction = c.expected_reduction_pct || 0;
            
            // X ekseni etiketi: Aksiyon tipi (kısa ve net, ROI değeri tooltip'te gösterilecek)
            const label = actionType.length > 20 ? actionType.substring(0, 18) + '...' : actionType;
            
            return {
                name: c.scenario_name,
                actionType: actionType,
                reduction: reduction,
                label: label, // Y ekseni için etiket
                fullName: c.scenario_name, // Tooltip için tam isim
                roi: roi,
                color: colors[idx % colors.length],
                index: idx
            };
        })
        .filter(d => d.roi < 999) // Geçersiz ROI değerlerini filtrele
        .sort((a, b) => a.roi - b.roi);
    
    // Maksimum ROI değerini hesapla (dinamik ölçekleme için)
    const maxROI = roiData.length > 0 ? Math.max(...roiData.map(d => d.roi)) : 60;
    // Maksimum değerin %20 fazlasını al, ama en fazla 60 ay göster
    const chartMax = Math.min(Math.ceil(maxROI * 1.2), 60);
    
    if (roiChart) roiChart.destroy();
    
    const roiCtx2d = roiCtx.getContext('2d');
    const roiGradients = roiData.map(d => {
        const hex = d.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const gradient = roiCtx2d.createLinearGradient(0, 400, 0, 0); // Vertical gradient (yukarıdan aşağıya)
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.5)`);
        return gradient;
    });
    
    // En kısa ROI'ye sahip senaryoyu bul (önerilen senaryo)
    const recommendedScenario = roiData.length > 0 ? roiData[0] : null;
    const recommendedIndex = recommendedScenario ? 0 : -1;
    
    // Border rengini belirle (önerilen senaryo için yeşil, diğerleri için şeffaf)
    const borderColors = roiData.map((d, idx) => {
        if (idx === recommendedIndex) {
            return '#22c55e'; // Yeşil renk
        }
        return 'transparent';
    });
    
    const borderWidths = roiData.map((d, idx) => {
        if (idx === recommendedIndex) {
            return 3; // Kalın yeşil çerçeve
        }
        return 0;
    });
    
    roiChart = new Chart(roiCtx2d, {
        type: 'bar',
        data: {
            labels: roiData.map(d => d.label), // Anlamlı etiketleri kullan
            datasets: [{
                label: 'ROI (Ay)',
                data: roiData.map(d => d.roi),
                backgroundColor: roiGradients,
                borderColor: borderColors,
                borderWidth: borderWidths,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 60,
                categoryPercentage: 0.7, // Çubuklar arası boşluk
                barPercentage: 0.8 // Çubuk genişliği
            }]
        },
        options: {
            indexAxis: 'x', // Vertical bar chart (dikey çubuk grafik)
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            // Tooltip'te senaryo adı ve aksiyon tipini göster
                            const data = roiData[context[0].dataIndex];
                            return [
                                data.fullName,
                                `Aksiyon: ${data.actionType}`,
                                `Beklenen Azalma: %${data.reduction.toFixed(1)}`
                            ];
                        },
                        label: function(context) {
                            const isRecommended = context.dataIndex === recommendedIndex;
                            const label = `Geri Dönüş Süresi: ${context.parsed.y.toFixed(1)} Ay`;
                            if (isRecommended) {
                                return [label, '⭐ Önerilen Senaryo'];
                            }
                            return label;
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13, weight: '600' },
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#1a1a1a',
                        font: { 
                            size: 12, 
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        padding: 10,
                        maxRotation: 45, // Etiketleri 45 derece döndür
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: chartMax,
                    title: {
                        display: true,
                        text: 'Geri Dönüş Süresi (Ay)',
                        color: '#000000',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        color: '#000000',
                        maxTicksLimit: 7,
                        stepSize: chartMax <= 12 ? 1 : (chartMax <= 60 ? 5 : 10),
                        callback: function(value) {
                            return value.toFixed(1) + ' Ay';
                        },
                        font: { 
                            size: 12, 
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.12)',
                        lineWidth: 1.5,
                        drawBorder: false,
                        drawOnChartArea: true
                    }
                }
            },
            plugins: [{
                id: 'roiValueLabels',
                afterDatasetsDraw: (chart) => {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    
                    meta.data.forEach((element, index) => {
                        const value = roiData[index].roi;
                        const x = element.x;
                        const y = element.y;
                        
                        ctx.save();
                        ctx.fillStyle = '#1a1a1a';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        
                        // Çubuk üstünde değer etiketi
                        const labelText = `${value.toFixed(1)} ay`;
                        const labelY = y - 8;
                        
                        // Arka plan için beyaz kutu
                        const textMetrics = ctx.measureText(labelText);
                        const padding = 4;
                        const labelWidth = textMetrics.width + padding * 2;
                        const labelHeight = 18;
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.strokeStyle = '#dc143c';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(x - labelWidth / 2, labelY - labelHeight, labelWidth, labelHeight, 6);
                        } else {
                            const radius = 6;
                            const labelX = x - labelWidth / 2;
                            const labelYRect = labelY - labelHeight;
                            ctx.moveTo(labelX + radius, labelYRect);
                            ctx.lineTo(labelX + labelWidth - radius, labelYRect);
                            ctx.quadraticCurveTo(labelX + labelWidth, labelYRect, labelX + labelWidth, labelYRect + radius);
                            ctx.lineTo(labelX + labelWidth, labelYRect + labelHeight - radius);
                            ctx.quadraticCurveTo(labelX + labelWidth, labelYRect + labelHeight, labelX + labelWidth - radius, labelYRect + labelHeight);
                            ctx.lineTo(labelX + radius, labelYRect + labelHeight);
                            ctx.quadraticCurveTo(labelX, labelYRect + labelHeight, labelX, labelYRect + labelHeight - radius);
                            ctx.lineTo(labelX, labelYRect + radius);
                            ctx.quadraticCurveTo(labelX, labelYRect, labelX + radius, labelYRect);
                            ctx.closePath();
                        }
                        ctx.fill();
                        ctx.stroke();
                        
                        // Metin
                        ctx.fillStyle = '#dc143c';
                        ctx.font = 'bold 12px Arial';
                        ctx.fillText(labelText, x, labelY - 2);
                        
                        ctx.restore();
                    });
                }
            }, {
                id: 'roiRecommendedLabel',
                afterDraw: (chart) => {
                    if (recommendedScenario && recommendedIndex >= 0) {
                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);
                        const element = meta.data[recommendedIndex];
                        
                        if (element) {
                            const x = element.x;
                            const y = element.y; // Vertical chart'ta y çubuğun üst köşesidir
                            
                            // "⭐ Önerilen" etiketi ekle (vertical chart için çubuğun üstünde)
                            ctx.save();
                            
                            // Etiket arka planı
                            const text = '⭐ Önerilen';
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'center';
                            const textMetrics = ctx.measureText(text);
                            const padding = 6;
                            const labelWidth = textMetrics.width + padding * 2;
                            const labelHeight = 20;
                            
                            // Rounded rectangle arka plan (çubuğun üstünde)
                            const labelX = x - labelWidth / 2;
                            const labelY = y - labelHeight - 5;
                            
                            ctx.fillStyle = '#22c55e';
                            ctx.beginPath();
                            // roundRect desteği kontrolü
                            if (ctx.roundRect) {
                                ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 12);
                            } else {
                                // Alternatif: manuel rounded rectangle
                                const radius = 12;
                                ctx.moveTo(labelX + radius, labelY);
                                ctx.lineTo(labelX + labelWidth - radius, labelY);
                                ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + radius);
                                ctx.lineTo(labelX + labelWidth, labelY + labelHeight - radius);
                                ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - radius, labelY + labelHeight);
                                ctx.lineTo(labelX + radius, labelY + labelHeight);
                                ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - radius);
                                ctx.lineTo(labelX, labelY + radius);
                                ctx.quadraticCurveTo(labelX, labelY, labelX + radius, labelY);
                                ctx.closePath();
                            }
                            ctx.fill();
                            
                            // Beyaz metin
                            ctx.fillStyle = '#ffffff';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(text, x, labelY + labelHeight / 2);
                            ctx.restore();
                        }
                    }
                }
            }]
        }
    });
    
    // ROI Grafiği altına açıklayıcı metin ekle
    const roiChartContainer = document.getElementById('roiChart').parentElement;
    let roiRecommendationBox = roiChartContainer.querySelector('.roi-recommendation-box');
    if (!roiRecommendationBox) {
        roiRecommendationBox = document.createElement('div');
        roiRecommendationBox.className = 'roi-recommendation-box';
        roiChartContainer.appendChild(roiRecommendationBox);
    }
    
    if (recommendedScenario) {
        roiRecommendationBox.innerHTML = `
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin-top: 15px;">
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(34, 197, 94, 0.2);">
                    <strong style="color: #166534; font-size: 0.95em; display: block; margin-bottom: 6px;">📊 Bu Grafik Ne İşe Yarar?</strong>
                    <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; line-height: 1.6;">
                        Bu grafik, yatırım yaptığınız her senaryonun ne kadar sürede geri döneceğini gösterir. Geri dönüş süresi (ROI) kısa olan senaryolar, yatırımınızı daha hızlı geri kazandırır. <strong>Kısa ROI süresi = Daha hızlı kâr, daha az risk.</strong> Bu grafik sayesinde "Hangi yatırımı önce yapmalıyım?" sorusuna cevap bulabilirsiniz.
                    </p>
                </div>
                <p style="margin: 0; color: #166534; font-weight: 600; font-size: 0.95em;">
                    <strong>💡 Karar Okları:</strong> <span style="color: #1a1a1a;">${recommendedScenario.fullName}</span> senaryosu en kısa geri dönüş süresine sahiptir (≈ ${recommendedScenario.roi.toFixed(1)} ay). Bu senaryo öncelikli olarak uygulanmalıdır.
                </p>
            </div>
        `;
        roiRecommendationBox.style.display = 'block';
    } else {
        roiRecommendationBox.style.display = 'none';
    }
    
    // ROI Insight Box - Sadece recommendation box yoksa göster
    const roiInsightBox = document.getElementById('roiInsightBox');
    if (roiInsightBox) {
        // ROI recommendation box zaten gösteriliyorsa, insight box'ı gösterme
        if (!recommendedScenario || roiRecommendationBox.style.display === 'none') {
            const allROIs = roiData.map(d => d.roi).filter(r => r < 999);
            if (allROIs.length > 0) {
                const fastest = roiData[0]; // En kısa ROI zaten sıralı
                const avgROI = allROIs.reduce((a, b) => a + b, 0) / allROIs.length;
                const fastestBenefit = fastest.roi <= 6 ? 'Çok hızlı geri dönüş, acilen uygulanabilir.' : 
                                       fastest.roi <= 12 ? 'Hızlı geri dönüş, öncelikli değerlendirilmeli.' : 
                                       'Orta vadede geri dönüş sağlar.';
                roiInsightBox.innerHTML = `
                    <div>
                        <p>
                            <strong>${fastest.name}</strong> en hızlı geri dönüşe sahip (${fastest.roi.toFixed(1)} ay). ${fastestBenefit}
                            ${allROIs.length > 1 ? ` Ortalama geri dönüş süresi: ${avgROI.toFixed(1)} ay.` : ''}
                        </p>
                    </div>
                `;
            }
        } else {
            roiInsightBox.innerHTML = ''; // ROI recommendation box gösteriliyorsa, insight box'ı boş bırak
        }
    }
    
    // Yıllık Tasarruf Grafiği - Vertical Bar Chart
    const annualSavingsCtx = document.getElementById('annualSavingsChart');
    if (!annualSavingsCtx) return;
    
    // Senaryo isimlerini kısaltma fonksiyonu
    const shortenScenarioName = (name) => {
        if (!name) return '';
        let shortName = name.trim();
        
        // Parantez içindeki kısımları kaldır
        shortName = shortName.replace(/\s*\([^)]*\)/g, '').trim();
        
        // "önerisi", "senaryosu", "senaryo" gibi ekleri kaldır
        shortName = shortName.replace(/\s+(önerisi|senaryosu|senaryo)$/gi, '').trim();
        
        // Özel kısaltmalar
        if (shortName.includes('HVAC')) return 'HVAC Optimizasyonu';
        if (shortName.includes('Aydınlatma')) return 'Aydınlatma İyileştirme';
        if (shortName.includes('İzolasyon')) return 'İzolasyon İyileştirme';
        if (shortName.includes('Bakım')) return 'Bakım Programı';
        if (shortName.includes('Ekipman')) return 'Ekipman Değişimi';
        if (shortName.includes('Enerji Yönetim')) return 'Enerji Yönetim Sistemi';
        if (shortName.includes('Yenilenebilir')) return 'Yenilenebilir Enerji';
        if (shortName.includes('Zamanlama')) return 'Zamanlama Optimizasyonu';
        if (shortName.includes('Sensör')) return 'Akıllı Sensör Sistemi';
        if (shortName.includes('Eğitim')) return 'Enerji Verimliliği Eğitimi';
        
        // Eğer hala çok uzunsa, ilk 25 karakteri al
        if (shortName.length > 25) {
            shortName = shortName.substring(0, 25) + '...';
        }
        
        return shortName;
    };
    
    const annualSavingsData = comparisons.map((c, idx) => ({
        name: c.scenario_name,
        shortName: shortenScenarioName(c.scenario_name),
        savings: c.decision_metrics?.annual_savings || 0,
        color: colors[idx % colors.length]
    }));
    
    if (annualSavingsChart) annualSavingsChart.destroy();
    
    const annualSavingsCtx2d = annualSavingsCtx.getContext('2d');
    const annualSavingsGradients = annualSavingsData.map(d => {
        const hex = d.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const gradient = annualSavingsCtx2d.createLinearGradient(0, 400, 0, 0);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.9)`);
        return gradient;
    });
    
    // Her senaryo için % etkiyi hesapla
    const annualSavingsDataWithPercentage = annualSavingsData.map(d => ({
        ...d,
        shortName: d.shortName || shortenScenarioName(d.name),
        percentage: totalCost > 0 ? ((d.savings / totalCost) * 100) : 0
    }));
    
    annualSavingsChart = new Chart(annualSavingsCtx2d, {
        type: 'bar',
        data: {
            labels: annualSavingsDataWithPercentage.map(d => d.shortName || d.name),
            datasets: [{
                label: 'Yıllık Tasarruf (TL)',
                data: annualSavingsDataWithPercentage.map(d => d.savings),
                backgroundColor: annualSavingsGradients,
                borderColor: annualSavingsDataWithPercentage.map(d => hexToRgba(d.color, 0.12)),
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Aspect ratio'yu kapat, container yüksekliğine göre ayarlansın
            layout: {
                padding: {
                    bottom: 15, // Grafiği aşağı indirmek için padding azaltıldı (35 → 15)
                    top: 35, // Üst padding artırıldı (5 → 35) - label'lar için daha fazla alan
                    left: 10,
                    right: 10
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const item = annualSavingsDataWithPercentage[index];
                            const savings = context.parsed.y;
                            const percentage = item.percentage;
                            return [
                                `Yıllık Tasarruf: ${savings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL`,
                                `Toplam maliyetin %${percentage.toFixed(1)}'ini azaltıyor`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13, weight: '600' },
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yıllık Tasarruf (TL)',
                        color: '#000000',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        color: '#000000',
                        font: { 
                            size: 12, 
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        callback: function(value) {
                            return value.toLocaleString('tr-TR') + ' TL';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.12)',
                        lineWidth: 1.5,
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#000000',
                        font: { 
                            size: 13, 
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        maxRotation: 0, // Yatay tut (daha okunabilir)
                        minRotation: 0,
                        padding: 30, // X ekseni etiketleri için daha fazla padding
                        autoSkip: false, // Tüm etiketleri göster
                        callback: function(value, index, ticks) {
                            const label = this.getLabelForValue(value);
                            // Eğer çok uzunsa kısalt
                            if (label && label.length > 20) {
                                // İlk 20 karakteri al, sonra "..." ekle
                                return label.substring(0, 20) + '...';
                            }
                            return label;
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [{
            id: 'annualSavingsPercentageLabels',
            afterDatasetsDraw: (chart) => {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                
                meta.data.forEach((element, index) => {
                    const item = annualSavingsDataWithPercentage[index];
                    const value = item.savings;
                    const percentage = item.percentage;
                    
                    if (value > 0) {
                        const x = element.x;
                        const y = element.y;
                        
                        ctx.save();
                        ctx.textAlign = 'center';
                        
                        // Çubuk üstünde TL değeri etiketi
                        // Büyük sayıları kısalt (K, M kullanarak) - daha kompakt format
                        let valueText = '';
                        if (value >= 1000000) {
                            // Milyon için: virgülsüz format (örn: 1M TL)
                            valueText = (value / 1000000).toFixed(0) + 'M TL';
                        } else if (value >= 1000) {
                            // Bin için: her zaman virgülsüz format (daha kompakt)
                            const kValue = value / 1000;
                            valueText = Math.round(kValue) + 'K TL'; // Yuvarlanmış, virgülsüz format
                        } else {
                            valueText = value.toFixed(0) + ' TL';
                        }
                        const percentageText = `%${percentage.toFixed(1)}`;
                        const labelY = y - 15; // Y pozisyonu daha yukarı alındı (8 → 15) - çubuk üzerinde daha görünür
                        
                        // TL değeri etiketi (ana etiket) - font boyutu artırıldı, daha görünür
                        ctx.font = 'bold 12px Arial'; // Font boyutu artırıldı (9px → 12px) - daha okunabilir
                        const textMetrics1 = ctx.measureText(valueText);
                        const padding = 6; // Padding artırıldı (4 → 6) - daha geniş label
                        // Genişliği text genişliğine göre dinamik olarak ayarla
                        const labelWidth1 = Math.max(textMetrics1.width + padding * 2, 70); // Minimum genişlik artırıldı (60 → 70)
                        const labelHeight = 24; // Yükseklik artırıldı (20 → 24) - daha geniş label
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Tam opak beyaz arka plan (0.98 → 1) - daha görünür
                        ctx.strokeStyle = '#dc143c';
                        ctx.lineWidth = 2; // Line width artırıldı (1.5 → 2) - daha belirgin çerçeve
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(x - labelWidth1 / 2, labelY - labelHeight, labelWidth1, labelHeight, 8);
                        } else {
                            const radius = 8;
                            const labelX = x - labelWidth1 / 2;
                            const labelYRect = labelY - labelHeight;
                            ctx.moveTo(labelX + radius, labelYRect);
                            ctx.lineTo(labelX + labelWidth1 - radius, labelYRect);
                            ctx.quadraticCurveTo(labelX + labelWidth1, labelYRect, labelX + labelWidth1, labelYRect + radius);
                            ctx.lineTo(labelX + labelWidth1, labelYRect + labelHeight - radius);
                            ctx.quadraticCurveTo(labelX + labelWidth1, labelYRect + labelHeight, labelX + labelWidth1 - radius, labelYRect + labelHeight);
                            ctx.lineTo(labelX + radius, labelYRect + labelHeight);
                            ctx.quadraticCurveTo(labelX, labelYRect + labelHeight, labelX, labelYRect + labelHeight - radius);
                            ctx.lineTo(labelX, labelYRect + radius);
                            ctx.quadraticCurveTo(labelX, labelYRect, labelX + radius, labelYRect);
                            ctx.closePath();
                        }
                        ctx.fill();
                        ctx.stroke();
                        
                        // TL metin - kırmızı renk, daha büyük ve koyu renk için daha iyi kontrast
                        ctx.fillStyle = '#b91c1c'; // Daha koyu kırmızı (#dc143c → #b91c1c) - daha iyi kontrast ve görünürlük
                        ctx.font = 'bold 12px Arial'; // Font boyutu artırıldı (9px → 12px) - daha okunabilir
                        ctx.textBaseline = 'middle';
                        ctx.fillText(valueText, x, labelY - labelHeight / 2);
                        
                        // % metin (alt satırda) - kaldırıldı veya daha küçük yapıldı
                        // Küçük grafiklerde % metni çok yer kaplıyor, sadece ana değeri göster
                        // if (percentage > 0) {
                        //     ctx.fillStyle = '#1a1a1a';
                        //     ctx.font = 'bold 7px Arial';
                        //     ctx.textBaseline = 'top';
                        //     const percentageY = labelY - labelHeight / 2 + 9;
                        //     ctx.fillText(percentageText, x, percentageY);
                        // }
                        
                        ctx.restore();
                    }
                });
            }
        }]
    });
    
    // Yıllık Tasarruf Insight Box
    const annualSavingsInsightBox = document.getElementById('annualSavingsInsightBox');
    if (annualSavingsInsightBox && annualSavingsDataWithPercentage.length > 0) {
        const sortedBySavings = [...annualSavingsDataWithPercentage].sort((a, b) => b.savings - a.savings);
        const topSaving = sortedBySavings[0];
        const totalAnnualSavings = annualSavingsDataWithPercentage.reduce((sum, d) => sum + d.savings, 0);
        
        annualSavingsInsightBox.innerHTML = `
            <div style="background: #fff5f5; border-left: 4px solid #dc143c; padding: 16px; border-radius: 8px;">
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(220, 20, 60, 0.2);">
                    <strong style="color: #dc143c; font-size: 0.95em; display: block; margin-bottom: 6px;">📊 Bu Grafik Ne İşe Yarar?</strong>
                    <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; line-height: 1.6;">
                        Bu grafik, her senaryonun yıllık bazda ne kadar para tasarrufu sağlayacağını gösterir. <strong>Yüksek tasarruf = Daha fazla kâr.</strong> Bu grafik sayesinde "Hangi senaryo en çok para kazandırır?" sorusuna cevap bulabilir ve bütçe planlamanızı yapabilirsiniz. Grafikteki yüzde değerleri, tasarrufun toplam maliyetinize göre ne kadar büyük bir etki yaratacağını gösterir.
                    </p>
                </div>
                <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; font-weight: 600;">
                    <strong>💡 Sonuç:</strong> <strong>${topSaving.name}</strong> en yüksek yıllık tasarrufu sağlıyor: 
                    <strong style="color: #dc143c;">${topSaving.savings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL/yıl</strong> 
                    (Toplam maliyetin %${topSaving.percentage.toFixed(1)}'si).
                    ${annualSavingsDataWithPercentage.length > 1 ? ` Tüm senaryolar birlikte yılda <strong style="color: #dc143c;">${totalAnnualSavings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL</strong> tasarruf potansiyeli sunuyor.` : ''}
                </p>
            </div>
        `;
    }
    
    // Öncelik Skorları Grafiği - Bar Chart
    const priorityCtx = document.getElementById('priorityScoreChart');
    if (!priorityCtx) return;
    
    const priorityData = comparisons.map((c, idx) => ({
        name: c.scenario_name,
        score: c.decision_metrics?.priority_score || 0,
        color: colors[idx % colors.length]
    }));
    
    if (priorityScoreChart) priorityScoreChart.destroy();
    
    const priorityCtx2d = priorityCtx.getContext('2d');
    const priorityGradients = priorityData.map(d => {
        const hex = d.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const gradient = priorityCtx2d.createLinearGradient(0, 100, 0, 0);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.9)`);
        return gradient;
    });
    
    priorityScoreChart = new Chart(priorityCtx2d, {
        type: 'bar',
        data: {
            labels: priorityData.map(d => d.name),
            datasets: [{
                label: 'Öncelik Skoru',
                data: priorityData.map(d => d.score),
                backgroundColor: priorityGradients,
                borderColor: priorityData.map(d => hexToRgba(d.color, 0.12)),
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Öncelik Skoru: ${context.parsed.y}/100`;
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13, weight: '600' },
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Öncelik Skoru (0-100)',
                        color: '#000000',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        color: '#000000',
                        font: { 
                            size: 12, 
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        callback: function(value) {
                            return value + '/100';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.12)',
                        lineWidth: 1.5,
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#1a1a1a',
                        font: { 
                            size: 12, 
                            weight: '600',
                            family: "'Inter', system-ui, -apple-system, sans-serif"
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        padding: 8
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: [{
                id: 'priorityValueLabels',
                afterDatasetsDraw: (chart) => {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    
                    meta.data.forEach((element, index) => {
                        const value = priorityData[index].score;
                        const x = element.x;
                        const y = element.y;
                        
                        ctx.save();
                        ctx.fillStyle = '#1a1a1a';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        
                        // Çubuk üstünde skor etiketi
                        const labelText = `${value}/100`;
                        const labelY = y - 8;
                        
                        // Arka plan için beyaz kutu
                        const textMetrics = ctx.measureText(labelText);
                        const padding = 4;
                        const labelWidth = textMetrics.width + padding * 2;
                        const labelHeight = 18;
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.strokeStyle = '#dc143c';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(x - labelWidth / 2, labelY - labelHeight, labelWidth, labelHeight, 6);
                        } else {
                            const radius = 6;
                            const labelX = x - labelWidth / 2;
                            const labelYRect = labelY - labelHeight;
                            ctx.moveTo(labelX + radius, labelYRect);
                            ctx.lineTo(labelX + labelWidth - radius, labelYRect);
                            ctx.quadraticCurveTo(labelX + labelWidth, labelYRect, labelX + labelWidth, labelYRect + radius);
                            ctx.lineTo(labelX + labelWidth, labelYRect + labelHeight - radius);
                            ctx.quadraticCurveTo(labelX + labelWidth, labelYRect + labelHeight, labelX + labelWidth - radius, labelYRect + labelHeight);
                            ctx.lineTo(labelX + radius, labelYRect + labelHeight);
                            ctx.quadraticCurveTo(labelX, labelYRect + labelHeight, labelX, labelYRect + labelHeight - radius);
                            ctx.lineTo(labelX, labelYRect + radius);
                            ctx.quadraticCurveTo(labelX, labelYRect, labelX + radius, labelYRect);
                            ctx.closePath();
                        }
                        ctx.fill();
                        ctx.stroke();
                        
                        // Metin
                        ctx.fillStyle = '#dc143c';
                        ctx.font = 'bold 12px Arial';
                        ctx.fillText(labelText, x, labelY - 2);
                        
                        ctx.restore();
                    });
                }
            }]
        }
    });
    
    // Öncelik Skoru Insight Box
    const priorityInsightBox = document.getElementById('priorityInsightBox');
    if (priorityInsightBox && priorityData.length > 0) {
        const sortedByPriority = [...priorityData].sort((a, b) => b.score - a.score);
        const topPriority = sortedByPriority[0];
        const priorityLevel = topPriority.score >= 80 ? 'Çok Yüksek' : 
                             topPriority.score >= 60 ? 'Yüksek' : 
                             topPriority.score >= 40 ? 'Orta' : 'Düşük';
        
        priorityInsightBox.innerHTML = `
            <div style="background: #fff5f5; border-left: 4px solid #dc143c; padding: 16px; border-radius: 8px;">
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(220, 20, 60, 0.2);">
                    <strong style="color: #dc143c; font-size: 0.95em; display: block; margin-bottom: 6px;">📊 Bu Grafik Ne İşe Yarar?</strong>
                    <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; line-height: 1.6;">
                        Bu grafik, senaryoları sadece tasarruf veya ROI'ye göre değil, <strong>tüm faktörleri (tasarruf, geri dönüş süresi, uygulama zorluğu, uygulama süresi)</strong> bir arada değerlendirerek öncelik skorunu gösterir. Skor 0-100 arasındadır ve yüksek skor = daha dengeli ve öncelikli senaryo demektir. Bu grafik sayesinde "Hangi senaryoya önce başlamalıyım?" sorusuna kapsamlı bir cevap bulabilirsiniz.
                    </p>
                </div>
                <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; font-weight: 600;">
                    <strong>💡 Sonuç:</strong> <strong>${topPriority.name}</strong> en yüksek öncelik skoruna sahip: <strong style="color: #dc143c;">${topPriority.score.toFixed(1)}/100</strong> (${priorityLevel} öncelik). 
                    Bu senaryo, tasarruf potansiyeli, hızlı geri dönüş, uygulama kolaylığı ve süre açısından en dengeli seçenektir.
                </p>
            </div>
        `;
    }
    
    // Yatırım Maliyeti vs. Yıllık Tasarruf - Grouped Bar Chart (daha iyi görselleştirme)
    const investmentVsSavingsCtx = document.getElementById('investmentVsSavingsChart');
    if (!investmentVsSavingsCtx) return;
    
    const barData = comparisons.map((c, idx) => ({
        name: c.scenario_name,
        investment: c.decision_metrics?.investment_cost || 0,
        savings: c.decision_metrics?.annual_savings || 0,
        color: colors[idx % colors.length],
        roi: c.decision_metrics?.roi_months || 999
    }));
    
    if (investmentVsSavingsChart) investmentVsSavingsChart.destroy();
    
    const investmentVsSavingsCtx2d = investmentVsSavingsCtx.getContext('2d');
    const investmentGradients = barData.map(d => {
        const hex = d.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const gradient = investmentVsSavingsCtx2d.createLinearGradient(0, 400, 0, 0);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.6)`);
        return gradient;
    });
    const savingsGradients = barData.map(d => {
        const hex = d.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const gradient = investmentVsSavingsCtx2d.createLinearGradient(0, 400, 0, 0);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.9)`);
        return gradient;
    });
    
    investmentVsSavingsChart = new Chart(investmentVsSavingsCtx2d, {
        type: 'bar',
        data: {
            labels: barData.map(d => d.name),
            datasets: [
                {
                    label: 'Yatırım Maliyeti (TL)',
                    data: barData.map(d => d.investment),
                    backgroundColor: investmentGradients,
                    borderColor: barData.map(d => hexToRgba(d.color, 0.12)),
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                    order: 2
                },
                {
                    label: 'Yıllık Tasarruf (TL)',
                    data: barData.map(d => d.savings),
                    backgroundColor: savingsGradients,
                    borderColor: barData.map(d => hexToRgba(d.color, 0.12)),
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 'flex',
                    maxBarThickness: 50,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                    // Her senaryo için farklı renkler kullanıldığı için legend yerine açıklama metni kullanılıyor
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#dc143c',
                    bodyColor: '#1a1a1a',
                    borderColor: '#dc143c',
                    borderWidth: 2,
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            return context.dataset.label + ': ' + 
                                   value.toLocaleString('tr-TR', {
                                       minimumFractionDigits: 2,
                                       maximumFractionDigits: 2
                                   }) + ' TL';
                        },
                        afterBody: function(context) {
                            const index = context[0].dataIndex;
                            const data = barData[index];
                            if (data.roi && data.roi < 999) {
                                return [`ROI (Geri Dönüş): ${data.roi.toFixed(1)} Ay`];
                            }
                            return [];
                        }
                    }
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Senaryolar',
                        color: '#1a1a1a',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        color: '#1a1a1a',
                        font: { size: 11 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tutar (TL)',
                        color: '#1a1a1a',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        color: '#1a1a1a',
                        callback: function(value) {
                            return value.toLocaleString('tr-TR') + ' TL';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
    
    // Yatırım vs Tasarruf Insight Box
    const investmentInsightBox = document.getElementById('investmentInsightBox');
    if (investmentInsightBox && barData.length > 0) {
        // En iyi ROI'ye sahip senaryoyu bul
        const validROIData = barData.filter(d => d.roi < 999);
        if (validROIData.length > 0) {
            const bestROI = validROIData.sort((a, b) => a.roi - b.roi)[0];
            const roiRatio = bestROI.savings > 0 ? (bestROI.investment / bestROI.savings) : 0;
            
            investmentInsightBox.innerHTML = `
                <div style="background: #fff5f5; border-left: 4px solid #dc143c; padding: 16px; border-radius: 8px;">
                    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(220, 20, 60, 0.2);">
                        <strong style="color: #dc143c; font-size: 0.95em; display: block; margin-bottom: 6px;">📊 Bu Grafik Ne İşe Yarar?</strong>
                        <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; line-height: 1.6;">
                            Bu grafik, <strong>yatırım maliyetini ve yıllık tasarrufu yan yana</strong> karşılaştırarak, hangi senaryonun daha "verimli" olduğunu gösterir. <strong>Yıllık tasarruf, yatırım maliyetinden yüksekse = İlk yılda kâra geçersiniz!</strong> Bu grafik sayesinde "Bu yatırım ne kadar sürede kendini amorti eder?" ve "Yıllık tasarruf yatırımı karşılıyor mu?" sorularına cevap bulabilirsiniz. İdeal senaryo: Düşük yatırım, yüksek tasarruf.
                        </p>
                    </div>
                    <p style="margin: 0; color: #1a1a1a; font-size: 0.9em; font-weight: 600;">
                        <strong>💡 Sonuç:</strong> <strong>${bestROI.name}</strong> en verimli yatırım: 
                        <strong style="color: #dc143c;">${bestROI.investment.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL</strong> yatırımla 
                        <strong style="color: #dc143c;">${bestROI.savings.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} TL/yıl</strong> tasarruf 
                        (${bestROI.roi.toFixed(1)} ayda geri döner).
                        ${bestROI.savings > bestROI.investment ? ' <span style="color: #22c55e; font-weight: 700;">✓ Yıllık tasarruf, yatırım maliyetinden yüksek! İlk yılda kâra geçersiniz!</span>' : ''}
                    </p>
                </div>
            `;
        }
    }
}

function displayDecisionSupport(comparisons) {
    // En yüksek öncelik skoruna sahip senaryoyu bul
    if (!comparisons || comparisons.length === 0) {
        console.warn('Karşılaştırma verisi bulunamadı');
        return;
    }
    
    const bestScenario = comparisons[0]; // Zaten sıralanmış
    
    const decisionCard = document.getElementById('decisionSupportCard');
    const recommendedDiv = document.getElementById('recommendedScenario');
    const reasonDiv = document.getElementById('recommendationReason');
    
    // decision_metrics kontrolü yap
    if (!bestScenario) {
        console.warn('En iyi senaryo bulunamadı');
        decisionCard.style.display = 'none';
        return;
    }
    
    // decision_metrics yoksa bile temel bilgileri göster
    if (!bestScenario.decision_metrics) {
        console.warn('Karar metrikleri hesaplanmamış, temel bilgiler gösteriliyor:', bestScenario);
        // Temel bilgilerle göster (fallback)
        recommendedDiv.innerHTML = `
            <h4 style="color: #ffffff; margin-bottom: 15px;">
                <strong>${bestScenario.scenario_name}</strong>
                <span class="recommendation-badge medium">Öneri</span>
            </h4>
            <p style="color: rgba(255,255,255,0.9);">Bu senaryo seçilen senaryolar arasında önerilmektedir.</p>
        `;
        reasonDiv.innerHTML = `
            <h4 style="color: #ffffff; margin-bottom: 10px;">💡 Senaryo Detayları</h4>
            <p style="color: rgba(255,255,255,0.9);">${bestScenario.description || 'Bu senaryo hakkında detaylı bilgi için tablolara bakabilirsiniz.'}</p>
        `;
        decisionCard.style.display = 'block';
        return;
    }
    
    if (bestScenario && bestScenario.decision_metrics) {
        const metrics = bestScenario.decision_metrics;
        const monthlySavings = bestScenario.impacts.savings_tl || 0;
        
        recommendedDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                <h4 style="color: #ffffff; margin: 0; font-size: 1.6em; font-weight: 700; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);">
                    <strong>${bestScenario.scenario_name}</strong>
                </h4>
                <span class="recommendation-badge ${metrics.recommendation_level.toLowerCase()}" style="padding: 10px 20px; border-radius: 25px; font-size: 1em; font-weight: 700; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                    ${metrics.recommendation_level === 'Yüksek' ? '⭐⭐⭐' : metrics.recommendation_level === 'Orta' ? '⭐⭐' : '⭐'} 
                    ${metrics.recommendation_level} Öneri
                </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-top: 20px;">
                <div style="background: rgba(26, 26, 26, 0.6); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 2px solid rgba(220, 20, 60, 0.6); text-align: center; transition: transform 0.3s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
                    <div style="color: #ffffff; font-size: 0.85em; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">Öncelik Skoru</div>
                    <div style="font-size: 2.5em; font-weight: 700; color: #ffffff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(220, 20, 60, 0.6); line-height: 1.2;">${metrics.priority_score}<span style="font-size: 0.5em; opacity: 0.9; color: #dc143c;">/100</span></div>
                </div>
                <div style="background: rgba(26, 26, 26, 0.6); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 2px solid rgba(220, 20, 60, 0.6); text-align: center; transition: transform 0.3s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
                    <div style="color: #ffffff; font-size: 0.85em; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">Aylık Tasarruf</div>
                    <div style="font-size: 1.8em; font-weight: 700; color: #ffffff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 12px rgba(220, 20, 60, 0.5); line-height: 1.2;">${monthlySavings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span style="font-size: 0.7em; color: #dc143c; font-weight: 600;">TL</span></div>
                </div>
                <div style="background: rgba(26, 26, 26, 0.6); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 2px solid rgba(220, 20, 60, 0.6); text-align: center; transition: transform 0.3s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
                    <div style="color: #ffffff; font-size: 0.85em; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">ROI (Geri Dönüş)</div>
                    <div style="font-size: 1.8em; font-weight: 700; color: #ffffff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 12px rgba(220, 20, 60, 0.5); line-height: 1.2;">${metrics.roi_months} <span style="font-size: 0.7em; color: #dc143c; font-weight: 600;">Ay</span></div>
                </div>
                <div style="background: rgba(26, 26, 26, 0.6); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 2px solid rgba(220, 20, 60, 0.6); text-align: center; transition: transform 0.3s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
                    <div style="color: #ffffff; font-size: 0.85em; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">Yatırım Maliyeti</div>
                    <div style="font-size: 1.8em; font-weight: 700; color: #ffffff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 12px rgba(220, 20, 60, 0.5); line-height: 1.2;">${metrics.investment_cost.toLocaleString('tr-TR')} <span style="font-size: 0.7em; color: #dc143c; font-weight: 600;">TL</span></div>
                </div>
            </div>
        `;
        
        // Öneri nedeni
        let reasons = [];
        
        // Öncelik skoru kontrolü
        if (metrics.priority_score >= 75) {
            reasons.push(`Bu senaryo <strong>çok yüksek öncelik skoruna</strong> (${metrics.priority_score}/100) sahip ve diğer senaryolara göre en iyi seçenektir.`);
        } else if (metrics.priority_score >= 50) {
            reasons.push(`Bu senaryo <strong>iyi bir öncelik skoruna</strong> (${metrics.priority_score}/100) sahiptir.`);
        }
        
        // ROI kontrolü
        if (metrics.roi_months <= 6) {
            reasons.push(`Yatırımınız <strong>${metrics.roi_months} ay içinde</strong> geri dönecek, bu çok hızlı bir geri dönüş süresidir.`);
        } else if (metrics.roi_months <= 12) {
            reasons.push(`Yatırımınız <strong>${metrics.roi_months} ay içinde</strong> geri dönecek, bu iyi bir geri dönüş süresidir.`);
        } else if (metrics.roi_months <= 24) {
            reasons.push(`Yatırımınız <strong>${metrics.roi_months} ay içinde</strong> geri dönecektir.`);
        }
        
        // Zorluk seviyesi kontrolü
        if (metrics.difficulty_level === 'Düşük') {
            reasons.push(`Uygulama <strong>kolay</strong> (${metrics.difficulty_level} zorluk seviyesi) ve <strong>${metrics.implementation_months} ay</strong> içinde tamamlanabilir.`);
        } else if (metrics.difficulty_level === 'Orta') {
            reasons.push(`Uygulama <strong>orta zorlukta</strong> (${metrics.difficulty_level}) ve <strong>${metrics.implementation_months} ay</strong> içinde tamamlanabilir.`);
        }
        
        // Tasarruf yüzdesi kontrolü
        if (bestScenario.expected_reduction_pct >= 30) {
            reasons.push(`Enerji tüketiminde <strong>%${bestScenario.expected_reduction_pct} azalma</strong> sağlayacak, bu çok önemli bir tasarruftur.`);
        } else if (bestScenario.expected_reduction_pct >= 20) {
            reasons.push(`Enerji tüketiminde <strong>%${bestScenario.expected_reduction_pct} azalma</strong> sağlayacak, bu iyi bir tasarruftur.`);
        } else if (bestScenario.expected_reduction_pct >= 10) {
            reasons.push(`Enerji tüketiminde <strong>%${bestScenario.expected_reduction_pct} azalma</strong> sağlayacaktır.`);
        }
        
        // Mali tasarruf kontrolü (daha esnek eşik değerler)
        if (monthlySavings > 0) {
            if (monthlySavings >= 10000) {
                reasons.push(`Aylık <strong>${monthlySavings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</strong> tasarruf sağlayacak, yıllık <strong>${metrics.annual_savings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</strong> kazanç elde edilecek.`);
            } else if (monthlySavings >= 5000) {
                reasons.push(`Aylık <strong>${monthlySavings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</strong> tasarruf sağlayacak, yıllık <strong>${metrics.annual_savings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</strong> kazanç sağlanacak.`);
            } else {
                reasons.push(`Aylık <strong>${monthlySavings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</strong> tasarruf sağlayacaktır.`);
            }
        }
        
        // Eğer hiç neden yoksa, genel bir neden ekle
        if (reasons.length === 0) {
            reasons.push(`Bu senaryo seçilen senaryolar arasında <strong>en yüksek öncelik skoruna</strong> (${metrics.priority_score}/100) sahiptir.`);
            reasons.push(`Enerji tüketiminde <strong>%${bestScenario.expected_reduction_pct} azalma</strong> beklenmektedir.`);
            if (metrics.roi_months < 999) {
                reasons.push(`Yatırım maliyeti <strong>${metrics.investment_cost.toLocaleString('tr-TR')} TL</strong> ve geri dönüş süresi <strong>${metrics.roi_months} ay</strong>dır.`);
            }
        }
        
        reasonDiv.innerHTML = `
            <h4 style="color: #ffffff; margin-bottom: 20px; font-size: 1.3em; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5em;">💡</span> Neden Bu Senaryoyu Seçmelisiniz?
            </h4>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${reasons.map((reason, index) => `<li style="margin: 15px 0; padding: 15px 20px 15px 50px; position: relative; background: rgba(26, 26, 26, 0.7); border-radius: 12px; backdrop-filter: blur(5px); border-left: 4px solid #dc143c; border: 2px solid rgba(220, 20, 60, 0.5); transition: all 0.3s; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);">
                    <span style="position: absolute; left: 20px; top: 15px; font-size: 1.3em; color: #dc143c; font-weight: bold; text-shadow: 0 0 10px rgba(220, 20, 60, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5);">✓</span> 
                    <span style="color: #ffffff; line-height: 1.6; font-size: 1.05em; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">${reason}</span>
                </li>`).join('')}
            </ul>
        `;
        
        decisionCard.style.display = 'block';
    }
}

function fillDecisionMatrix(comparisons) {
    const tbody = document.getElementById('decisionMatrixBody');
    tbody.innerHTML = '';

    comparisons.forEach((comp, index) => {
        const metrics = comp.decision_metrics;
        const isRecommended = index === 0; // En yüksek öncelik skorlu
        const row = document.createElement('tr');
        if (isRecommended) {
            row.className = 'recommended-row';
        }
        
        const priorityClass = metrics.priority_score >= 75 ? 'high' : metrics.priority_score >= 50 ? 'medium' : 'low';
        const recommendationClass = metrics.recommendation_level.toLowerCase();
        // Zorluk seviyesi için CSS class adı oluştur (Türkçe karakterleri çevir)
        let difficultyClass = metrics.difficulty_level.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/ç/g, 'c')
            .replace(/ş/g, 's')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o');
        
        row.innerHTML = `
            <td>
                <strong>${comp.scenario_name}</strong>
                ${isRecommended ? '<span class="recommended-icon">⭐ ÖNERİLEN</span>' : ''}
            </td>
            <td>
                <span class="priority-score ${priorityClass}">${metrics.priority_score}/100</span>
            </td>
            <td>
                <span class="recommendation-badge ${recommendationClass}">${metrics.recommendation_level}</span>
            </td>
            <td class="metric-value">${metrics.investment_cost.toLocaleString('tr-TR')} TL</td>
            <td class="metric-value">${comp.impacts.savings_tl.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</td>
            <td class="metric-value">${metrics.annual_savings.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</td>
            <td class="metric-value">${metrics.roi_months} Ay</td>
            <td>
                <span class="difficulty-badge ${difficultyClass}">${metrics.difficulty_level}</span>
            </td>
            <td>${metrics.implementation_months} Ay</td>
            <td><strong>${comp.expected_reduction_pct}%</strong></td>
            <td>
                ${comp.employee_reduction !== null && comp.employee_reduction !== undefined && comp.employee_reduction > 0 
                    ? `<strong style="color: #dc143c;">${comp.employee_reduction < 1 ? comp.employee_reduction.toFixed(1) : Math.round(comp.employee_reduction)} kişi</strong>` 
                    : '<span style="color: #999;">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function fillComparisonTable(comparisons, baseData) {
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    const baseConsumption = parseFloat(baseData.total_kwh || 0);
    const baseCost = parseFloat(baseData.total_cost_tl || 0);
    const baseCo2 = parseFloat(baseData.total_co2_kg || 0);

    comparisons.forEach((comp, index) => {
        const isRecommended = index === 0;
        const row = document.createElement('tr');
        if (isRecommended) {
            row.className = 'recommended-row';
        }
        
        row.innerHTML = `
            <td>
                <strong>${comp.scenario_name}</strong>
                ${isRecommended ? '<span class="recommended-icon">⭐ ÖNERİLEN</span>' : ''}
            </td>
            <td>${comp.expected_reduction_pct}%</td>
            <td>${baseConsumption.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${comp.impacts.consumption_kwh.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="saving-positive">${comp.impacts.savings_kwh.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${baseCost.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${comp.impacts.cost_tl.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="saving-positive">${comp.impacts.savings_tl.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="saving-positive">${comp.impacts.savings_co2_kg.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>
                ${comp.employee_reduction !== null && comp.employee_reduction !== undefined && comp.employee_reduction > 0 
                    ? `<strong style="color: #dc143c;">${comp.employee_reduction < 1 ? comp.employee_reduction.toFixed(1) : Math.round(comp.employee_reduction)} kişi</strong>` 
                    : '<span style="color: #999;">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

