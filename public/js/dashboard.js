// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard yüklendi');
    
    // API'den dashboard verilerini çek
    loadDashboardData();
    
    // Verileri otomatik yenile (5 dakikada bir)
    setInterval(loadDashboardData, 5 * 60 * 1000);
});

// Dashboard verilerini yükle
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        const result = await response.json();
        
        if (result.success) {
            updateDashboardSummary(result.data);
        }
    } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
    }
}

// Dashboard özet kartlarını güncelle
function updateDashboardSummary(data) {
    // Departman sayısını hesapla (zaten backend'den geliyor, burada güncelleme yapmaya gerek yok)
    console.log('Dashboard verileri güncellendi', data);
}

// Tarih formatlama yardımcı fonksiyonu
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Sayı formatlama yardımcı fonksiyonu
function formatNumber(number) {
    return parseFloat(number).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

