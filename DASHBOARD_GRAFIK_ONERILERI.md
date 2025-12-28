# 📊 Dashboard Grafik Önerileri - Karar Destek Sistemi

## 🎯 Amaç: Raporlama Değil, Karar Verme

Her grafik şu sorulardan en az birine cevap vermelidir:
- ❓ **Nerede sorun var?**
- ❓ **Neden olabilir?**
- ❓ **Ne yaparsam ne kazanırım?**

---

## 📍 Dashboard Sıralaması ve Grafik Önerileri

### **1. ÜST YÖNETİM DASHBOARD**

Üst yönetim için **stratejik kararlar** ve **yüksek seviye metrikler** önemlidir.

---

#### **Grafik 1: "Maliyet Dağılımı ve Sorunlu Departmanlar"** ⚠️
- **Grafik Türü:** Donut/Pie Chart + Heat Map (Kombine)
- **Kullanılan Veriler:**
  - Departman bazında toplam maliyet (TL)
  - Departman bazında anormallik sayısı (high/medium/low)
  - Departman bazında toplam maliyet yüzdesi
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departman toplam maliyetin en büyük payını alıyor?
  - **Ne yaparsam ne kazanırım?** → Bu departmana yatırım yaparsam, toplam maliyetten ne kadar tasarruf ederim?
- **Görsel Özellikler:**
  - Donut chart: Departmanların toplam maliyet yüzdesi
  - İçeride küçük rozetler: Anormallik seviyeleri (🔴 Yüksek, 🟡 Orta, 🟢 Düşük)
  - Tıklanabilir: Departman seçildiğinde detaylar açılır
- **Dashboard Pozisyonu:** En üstte, sol üst köşe (ilk görünen grafik)

---

#### **Grafik 2: "ROI Karşılaştırması: Hangi Öneri En Hızlı Geri Döner?"** 💰
- **Grafik Türü:** Horizontal Bar Chart (Gantt benzeri)
- **Kullanılan Veriler:**
  - Öneri başlığı (suggestion.title)
  - Yatırım maliyeti (scenario.investment_cost veya hesaplanan)
  - Yıllık tasarruf (expected_saving_tl * 12)
  - ROI (Geri Dönüş Süresi) - Ay cinsinden
  - Departman adı
- **Yöneticinin Vereceği Karar:**
  - **Ne yaparsam ne kazanırım?** → Hangi öneri en kısa sürede geri döner?
  - **Önceliklendirme:** Önce hangi öneriye yatırım yapmalıyım?
- **Görsel Özellikler:**
  - X ekseni: ROI (Ay cinsinden) - Düşükten yükseğe sıralı
  - Y ekseni: Öneriler
  - Bar rengi: ROI'ye göre (yeşil: <6 ay, sarı: 6-12 ay, kırmızı: >12 ay)
  - Tooltip: Yatırım maliyeti, yıllık tasarruf, ROI detayları
- **Dashboard Pozisyonu:** Sol taraf, ortada

---

#### **Grafik 3: "CO₂ Verimlilik Matrisi: Hangi Departman En Verimsiz?"** 🌍
- **Grafik Türü:** Bubble Chart (Scatter Plot benzeri)
- **Kullanılan Veriler:**
  - X ekseni: kWh/Çalışan oranı (consumption_kwh / employee_count)
  - Y ekseni: CO₂/kg/TL (co2_kg / cost_tl) - Emisyon yoğunluğu
  - Bubble boyutu: Toplam maliyet (cost_tl)
  - Bubble rengi: Anormallik seviyesi (high/medium/low)
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departman hem çok CO₂ salıyor hem de verimsiz?
  - **Neden olabilir?** → Çalışan başına tüketim yüksek mi, yoksa enerji türü mü verimsiz?
- **Görsel Özellikler:**
  - Sol alt köşe: Düşük tüketim, düşük emisyon (İDEAL)
  - Sağ üst köşe: Yüksek tüketim, yüksek emisyon (SORUNLU)
  - Bubble rengi: 🔴 Yüksek anormallik, 🟡 Orta, 🟢 Düşük
- **Dashboard Pozisyonu:** Sağ taraf, üstte

---

#### **Grafik 4: "Zaman İçinde Trend: Hangi Departman Kötüleşiyor?"** 📈
- **Grafik Türü:** Multi-Line Chart (Trend Lines)
- **Kullanılan Veriler:**
  - X ekseni: Ay (month_key) - Son 12 ay
  - Y ekseni: Normalize edilmiş değer (Baz yıla göre % değişim)
  - Çizgiler: Her departman için ayrı çizgi
  - Anormallik noktaları: Anormallik olan aylarda işaret
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departman trend olarak artış gösteriyor?
  - **Neden olabilir?** → Artış sürekli mi yoksa ani mi? (Anormallik noktaları ile)
- **Görsel Özellikler:**
  - Çizgi rengi: Anormallik yoğunluğuna göre (kırmızı: çok anormallik, yeşil: az)
  - İşaret noktaları: Anormallik olduğu aylarda büyük nokta
  - Tooltip: Ay bazında detaylar (kWh, TL, CO₂, anormallik nedeni)
- **Dashboard Pozisyonu:** Sağ taraf, altta (geniş grafik)

---

#### **Grafik 5: "Toplam Tasarruf Potansiyeli ve İşçi Çıkarımı Etkisi"** 👥
- **Grafik Türü:** Grouped Bar Chart (Yan yana barlar)
- **Kullanılan Veriler:**
  - X ekseni: Departmanlar
  - Y ekseni (Sol): Toplam yıllık tasarruf potansiyeli (TL)
  - Y ekseni (Sağ): Önerilen işçi çıkarımı sayısı
  - Öneriler: suggestion.expected_saving_tl * 12, suggested_employee_reduction
- **Yöneticinin Vereceği Karar:**
  - **Ne yaparsam ne kazanırım?** → Bu departmana yatırım yaparsam hem enerji tasarrufu hem de işçi maliyeti tasarrufu sağlar mıyım?
  - **Önceliklendirme:** Hem enerji hem de işçi tasarrufu sağlayan departmanlar hangileri?
- **Görsel Özellikler:**
  - İki y ekseni: Sol (TL), Sağ (Kişi)
  - Bar 1: Yıllık tasarruf (Mavi)
  - Bar 2: İşçi çıkarımı (Kırmızı - eğer varsa)
  - Tooltip: Her departman için detaylı tasarruf bilgisi
- **Dashboard Pozisyonu:** Sol taraf, altta

---

### **2. ENERJİ YÖNETİCİSİ DASHBOARD**

Enerji yöneticisi için **teknik detaylar**, **anormallik analizi** ve **operasyonel kararlar** önemlidir.

---

#### **Grafik 1: "Anormallik Yoğunluk Haritası"** 🗺️
- **Grafik Türü:** Heat Map (Kılavuz Tablosu)
- **Kullanılan Veriler:**
  - X ekseni: Departmanlar
  - Y ekseni: Son 6 ay
  - Renk yoğunluğu: Anormallik seviyesi (high=3, medium=2, low=1)
  - Hücre değeri: Toplam anormallik sayısı
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departman-hangi ay kombinasyonunda sürekli anormallik var?
  - **Neden olabilir?** → Sürekli anormallik olan yerlerde sistemik bir sorun mu var?
- **Görsel Özellikler:**
  - Renk skalası: Koyu kırmızı (çok anormallik) → Açık sarı (az anormallik) → Beyaz (yok)
  - Tıklanabilir: Hücreye tıklayınca anormallik detayları açılır
- **Dashboard Pozisyonu:** En üstte, ortada

---

#### **Grafik 2: "Enerji Türü Bazında Verimlilik Karşılaştırması"** ⚡
- **Grafik Türü:** Stacked Bar Chart
- **Kullanılan Veriler:**
  - X ekseni: Departmanlar
  - Y ekseni: Toplam tüketim (kWh)
  - Stack katmanları: Enerji türleri (Elektrik, Doğalgaz, Yakıt)
  - Renkler: Enerji türüne göre
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departman hangi enerji türünü aşırı kullanıyor?
  - **Ne yaparsam ne kazanırım?** → Belirli bir enerji türünü optimize edersem ne kadar tasarruf ederim?
- **Görsel Özellikler:**
  - Stack rengi: Enerji türüne göre (Elektrik: Mavi, Doğalgaz: Turuncu, Yakıt: Siyah)
  - Tooltip: Her katman için kWh, TL, CO₂ değerleri
- **Dashboard Pozisyonu:** Sol taraf, üstte

---

#### **Grafik 3: "Aylık Değişim Yüzdesi: Hangi Departman En Çok Arttı?"** 📊
- **Grafik Türü:** Horizontal Bar Chart (Waterfall benzeri)
- **Kullanılan Veriler:**
  - Y ekseni: Departmanlar
  - X ekseni: Önceki aya göre % değişim
  - Pozitif/Negatif: Artış (Kırmızı) / Azalış (Yeşil)
  - Anormallik işareti: % değişim >%20 ise anormallik rozeti
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Bu ay hangi departmanda anormal bir artış var?
  - **Neden olabilir?** → % değişim çok yüksekse, acil müdahale gerekli mi?
- **Görsel Özellikler:**
  - Bar rengi: Kırmızı (artış), Yeşil (azalış)
  - Eşik çizgisi: %20 artış (sarı çizgi)
  - Anormallik rozeti: %20 üzeri değerlerde 🔴 işareti
- **Dashboard Pozisyonu:** Sağ taraf, üstte

---

#### **Grafik 4: "Öneri Önceliklendirme Matrisi"** 🎯
- **Grafik Türü:** Scatter Plot / Bubble Chart
- **Kullanılan Veriler:**
  - X ekseni: ROI (Geri Dönüş Süresi - Ay)
  - Y ekseni: Yıllık Tasarruf (TL)
  - Bubble boyutu: Yatırım maliyeti
  - Bubble rengi: Zorluk seviyesi (scenario zorluk veya tahmini)
- **Yöneticinin Vereceği Karar:**
  - **Ne yaparsam ne kazanırım?** → Hangi öneriler hem düşük yatırım hem de yüksek tasarruf sağlıyor?
  - **Önceliklendirme:** Önce hangi önerileri uygulamalıyım?
- **Görsel Özellikler:**
  - Sol üst köşe: Düşük ROI, Yüksek Tasarruf (ÖNCELİKLİ)
  - Sağ alt köşe: Yüksek ROI, Düşük Tasarruf (DÜŞÜK ÖNCELİK)
  - Bubble rengi: Yeşil (Kolay), Sarı (Orta), Kırmızı (Zor)
- **Dashboard Pozisyonu:** Ortada, geniş grafik

---

#### **Grafik 5: "Senaryo Karşılaştırması: What-If Analizi"** 🔮
- **Grafik Türü:** Grouped Bar Chart
- **Kullanılan Veriler:**
  - X ekseni: Senaryolar (scenario_name)
  - Y ekseni: Etki büyüklüğü (TL, kWh, CO₂)
  - Gruplar: Mevcut Durum vs Senaryo Sonucu
  - Karar metrikleri: ROI, yatırım maliyeti, yıllık tasarruf
- **Yöneticinin Vereceği Karar:**
  - **Ne yaparsam ne kazanırım?** → Her senaryonun etkisi nedir?
  - **Hangi senaryo en mantıklı?** → Yatırım-tasarruf dengesi en iyi hangisi?
- **Görsel Özellikler:**
  - İki bar yan yana: Mevcut (Gri), Senaryo (Renkli)
  - Tooltip: ROI, yatırım, geri dönüş süresi
- **Dashboard Pozisyonu:** Altta, geniş grafik

---

### **3. OPERASYON YÖNETİCİSİ DASHBOARD**

Operasyon yöneticisi için **günlük operasyonel kararlar**, **anlık durum** ve **acil müdahale noktaları** önemlidir.

---

#### **Grafik 1: "Acil Müdahale Gereken Departmanlar"** 🚨
- **Grafik Türü:** Gauge Chart (Hız göstergesi benzeri) + Liste
- **Kullanılan Veriler:**
  - Anormallik seviyesi (high)
  - Son 30 gün içindeki anormallik sayısı
  - Departman adı
  - Son anormallik nedeni
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departman şu anda acil müdahale gerektiriyor?
  - **Ne yapmalıyım?** → Hemen hangi departmana gideyim?
- **Görsel Özellikler:**
  - Gauge: Toplam "high" anormallik sayısı (0-10 arası)
  - Liste: Departmanlar, anormallik sayısı, son nedeni
  - Renk: Kırmızı (acil), Sarı (dikkat), Yeşil (normal)
- **Dashboard Pozisyonu:** En üstte, sağ üst köşe (dikkat çekici)

---

#### **Grafik 2: "Departman Performans Skorları"** ⭐
- **Grafik Türü:** Radar Chart (Örümcek Ağı)
- **Kullanılan Veriler:**
  - Eksenler: Tüketim Verimliliği, CO₂ Verimliliği, Maliyet Kontrolü, Anormallik Durumu, Tasarruf Potansiyeli
  - Her departman için skor (0-100 arası normalize edilmiş)
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Hangi departmanın hangi alanda zayıflığı var?
  - **Neden olabilir?** → Zayıf olduğu alana göre hangi önerileri uygulayabilirim?
- **Görsel Özellikler:**
  - Her departman için farklı renk
  - İdeal şekil: Büyük alan (tüm eksenlerde yüksek skor)
  - Sorunlu şekil: Küçük/düzensiz alan
- **Dashboard Pozisyonu:** Sol taraf, ortada

---

#### **Grafik 3: "Günlük/Haftalık Trend: Son 7 Gün"** 📅
- **Grafik Türü:** Area Chart (Alan Grafiği)
- **Kullanılan Veriler:**
  - X ekseni: Günler (son 7 gün)
  - Y ekseni: Toplam tüketim (kWh) - normalize edilmiş
  - Alanlar: Departmanlar (stacked veya overlay)
- **Yöneticinin Vereceği Karar:**
  - **Nerede sorun var?** → Bu hafta hangi günlerde anormal bir tüketim var?
  - **Neden olabilir?** → Hafta içi vs hafta sonu farkı var mı?
- **Görsel Özellikler:**
  - Stacked area: Departmanlar üst üste
  - Veya overlay: Şeffaf alanlar
  - Anormallik işaretleri: Spike'lar
- **Dashboard Pozisyonu:** Ortada, geniş grafik

---

#### **Grafik 4: "En Hızlı Uygulanabilir Öneriler"** ⚡
- **Grafik Türü:** Horizontal Bar Chart + Kategori
- **Kullanılan Veriler:**
  - Öneri başlığı
  - Uygulama süresi (tahmini - senaryo tipine göre)
  - Hızlı kazanç (ilk 3 ayda beklenen tasarruf)
  - Zorluk seviyesi
- **Yöneticinin Vereceği Karar:**
  - **Ne yaparsam ne kazanırım?** → Hangi önerileri bu hafta uygulayabilirim?
  - **Önceliklendirme:** Önce hangi önerileri yapmalıyım?
- **Görsel Özellikler:**
  - Bar rengi: Uygulama süresine göre (Yeşil: <1 ay, Sarı: 1-3 ay, Kırmızı: >3 ay)
  - Sıralama: Hızlı kazanç (yüksekten düşüğe)
- **Dashboard Pozisyonu:** Sağ taraf, ortada

---

#### **Grafik 5: "Anormallik Nedenleri Dağılımı"** 🔍
- **Grafik Türü:** Treemap (Ağaç Haritası)
- **Kullanılan Veriler:**
  - Anormallik nedeni (anomaly_reason)
  - Anormallik sayısı
  - Departman dağılımı
- **Yöneticinin Vereceği Karar:**
  - **Neden olabilir?** → En çok hangi nedenle anormallik oluyor?
  - **Ne yapmalıyım?** → Sistemik bir sorun mu var, yoksa geçici mi?
- **Görsel Özellikler:**
  - Kutu boyutu: Anormallik sayısına göre
  - Renk: Anormallik seviyesine göre
  - Tıklanabilir: Neden seçildiğinde ilgili departmanlar gösterilir
- **Dashboard Pozisyonu:** Altta, geniş grafik

---

## 📋 ÖZET TABLO: Grafik Karşılaştırması

| Grafik | Üst Yönetim | Enerji Yöneticisi | Operasyon Yöneticisi |
|--------|-------------|-------------------|---------------------|
| **Maliyet Dağılımı** | ✅ Donut Chart | ⚠️ Stacked Bar | ❌ |
| **ROI Karşılaştırması** | ✅ Horizontal Bar | ✅ Scatter Plot | ⚠️ Horizontal Bar |
| **CO₂ Verimlilik** | ✅ Bubble Chart | ⚠️ Stacked Bar | ❌ |
| **Trend Analizi** | ✅ Multi-Line | ✅ Area Chart | ✅ Area Chart |
| **Tasarruf Potansiyeli** | ✅ Grouped Bar | ✅ Scatter Plot | ✅ Horizontal Bar |
| **Anormallik Haritası** | ❌ | ✅ Heat Map | ✅ Gauge + Liste |
| **Performans Skorları** | ❌ | ❌ | ✅ Radar Chart |
| **Enerji Türü Analizi** | ❌ | ✅ Stacked Bar | ❌ |
| **Senaryo Karşılaştırma** | ✅ Grouped Bar | ✅ Grouped Bar | ❌ |
| **Acil Müdahale** | ❌ | ⚠️ Liste | ✅ Gauge Chart |

---

## 🎨 GÖRSEL TASARIM ÖNERİLERİ

1. **Renk Paleti:**
   - 🔴 Kırmızı: Sorunlar, yüksek anormallik, artış
   - 🟡 Sarı: Dikkat, orta seviye, uyarı
   - 🟢 Yeşil: İyi, düşük anormallik, azalış
   - 🔵 Mavi: Bilgi, nötr, referans

2. **İnteraktiflik:**
   - Tüm grafikler tıklanabilir olmalı
   - Detay görünümü için modal açılmalı
   - Filtreleme: Departman, ay, enerji türü

3. **Responsive Tasarım:**
   - Mobil: Basitleştirilmiş grafikler
   - Tablet: Orta detay
   - Desktop: Tam detay

---

## ✅ UYGULAMA ÖNCELİĞİ

### Faz 1 (Kritik - Hemen):
1. **Üst Yönetim - Grafik 1:** Maliyet Dağılımı (Donut Chart)
2. **Üst Yönetim - Grafik 2:** ROI Karşılaştırması
3. **Operasyon - Grafik 1:** Acil Müdahale Gauge

### Faz 2 (Önemli - Kısa Vadede):
4. **Enerji Yöneticisi - Grafik 1:** Anormallik Heat Map
5. **Üst Yönetim - Grafik 3:** CO₂ Verimlilik Bubble Chart
6. **Enerji Yöneticisi - Grafik 2:** Enerji Türü Stacked Bar

### Faz 3 (Geliştirme - Orta Vadede):
7. **Üst Yönetim - Grafik 4:** Trend Multi-Line
8. **Operasyon - Grafik 2:** Performans Radar Chart
9. **Enerji Yöneticisi - Grafik 4:** Öneri Önceliklendirme

### Faz 4 (İleri - Uzun Vadede):
10. **Enerji Yöneticisi - Grafik 5:** Senaryo Karşılaştırması
11. **Operasyon - Grafik 3:** Günlük Trend
12. **Operasyon - Grafik 5:** Anormallik Nedenleri Treemap

---

## 📝 NOTLAR

- Her grafik **karar verme** odaklı olmalı, sadece veri göstermemeli
- Grafik başlıkları **yönetici dilinde** yazılmalı (teknik terimlerden kaçınılmalı)
- Tooltip'ler ve açıklamalar **eylem odaklı** olmalı ("Bu departmana müdahale et" gibi)
- Dashboard'lar **rol bazlı** olmalı (kullanıcı rolüne göre farklı grafikler gösterilmeli)


