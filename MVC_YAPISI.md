# 🏗️ MVC Yapısı - Vestel Karar Destek Sistemi

## ✅ Evet, Projede MVC (Model-View-Controller) Yapısı Kullanılıyor!

### 📁 Proje Yapısı:

```
vestel proje/
│
├── 📂 models/          ← MODEL KATMANI (Veritabanı İşlemleri)
│   ├── Department.js
│   ├── Anomaly.js
│   ├── Suggestion.js
│   ├── EnergyMonthly.js
│   ├── Scenario.js
│   └── EnergyType.js
│
├── 📂 views/           ← VIEW KATMANI (Görünüm/Template)
│   ├── dashboard/
│   │   └── index.ejs
│   ├── anomalies/
│   │   └── index.ejs
│   ├── suggestions/
│   │   └── index.ejs
│   ├── scenarios/
│   │   └── index.ejs
│   └── error.ejs
│
├── 📂 controllers/     ← CONTROLLER KATMANI (İş Mantığı)
│   ├── dashboardController.js
│   ├── departmentController.js
│   ├── anomalyController.js
│   ├── suggestionController.js
│   ├── scenarioController.js
│   └── energyMonthlyController.js
│
├── 📂 routes/          ← ROUTE TANIMLAMALARI
│   └── index.js        (Controller'ları kullanır)
│
├── 📂 config/          ← YAPILANDIRMA
│   └── database.js     (Veritabanı bağlantısı)
│
├── 📂 public/          ← STATİK DOSYALAR
│   ├── css/
│   └── js/
│
└── server.js           ← ANA SUNUCU DOSYASI
```

---

## 🔄 MVC Nasıl Çalışıyor?

### 1️⃣ **MODEL (Model Katmanı)**
**Görevi:** Veritabanı ile iletişim

**Örnek:** `models/Department.js`
```javascript
class Department {
  // Veritabanından veri çekme
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM departments');
    return rows;
  }
  
  // Veritabanına veri ekleme
  static async create(departmentData) {
    // ...
  }
}
```

**Kullanılan Modeller:**
- ✅ Department - Departman işlemleri
- ✅ Anomaly - Anormallik işlemleri
- ✅ Suggestion - Öneri işlemleri
- ✅ EnergyMonthly - Enerji verileri
- ✅ Scenario - Senaryo işlemleri

---

### 2️⃣ **VIEW (Görünüm Katmanı)**
**Görevi:** Kullanıcıya gösterilecek HTML şablonları

**Örnek:** `views/dashboard/index.ejs`
```ejs
<h1>Dashboard</h1>
<% departments.forEach(dept => { %>
  <div><%= dept.department_name %></div>
<% }); %>
```

**Kullanılan View'lar:**
- ✅ `dashboard/index.ejs` - Ana dashboard
- ✅ `anomalies/index.ejs` - Anormallikler sayfası
- ✅ `suggestions/index.ejs` - Öneriler sayfası
- ✅ `scenarios/index.ejs` - Senaryo analizi sayfası

---

### 3️⃣ **CONTROLLER (Kontrol Katmanı)**
**Görevi:** İş mantığı, Model ve View'ı birleştirme

**Örnek:** `controllers/dashboardController.js`
```javascript
class DashboardController {
  static async getDashboard(req, res) {
    // 1. MODEL'den veri çek
    const departments = await Department.findAll();
    const anomalies = await Anomaly.findAll();
    
    // 2. VIEW'a gönder
    res.render('dashboard/index', {
      departments,
      anomalies
    });
  }
}
```

**Kullanılan Controller'lar:**
- ✅ `dashboardController.js` - Dashboard işlemleri
- ✅ `departmentController.js` - Departman CRUD işlemleri
- ✅ `anomalyController.js` - Anormallik işlemleri
- ✅ `suggestionController.js` - Öneri işlemleri
- ✅ `scenarioController.js` - Senaryo işlemleri

---

## 🔗 MVC Akışı (Örnek)

```
1. Kullanıcı → http://localhost:3000/dashboard
                    ↓
2. Route → routes/index.js
   router.get('/', DashboardController.getDashboard);
                    ↓
3. Controller → controllers/dashboardController.js
   - Model'den veri çek: Department.findAll()
   - Model'den veri çek: Anomaly.findAll()
                    ↓
4. Model → models/Department.js
   - Veritabanı sorgusu yap
   - Veriyi döndür
                    ↓
5. Controller → View'a gönder
   res.render('dashboard/index', { departments, anomalies });
                    ↓
6. View → views/dashboard/index.ejs
   - HTML şablonunu render et
   - Verileri göster
                    ↓
7. Kullanıcı → Tarayıcıda görüntülenen sayfa
```

---

## ✅ MVC Prensiplerine Uygunluk

| MVC Prensibi | Projede Uygulanmış mı? | Açıklama |
|--------------|------------------------|----------|
| **Separation of Concerns** | ✅ Evet | Model, View, Controller ayrı klasörlerde |
| **Single Responsibility** | ✅ Evet | Her dosya tek bir sorumluluğa sahip |
| **Dependency Injection** | ✅ Evet | Controller'lar Model'leri import ediyor |
| **Reusability** | ✅ Evet | Model'ler farklı Controller'larda kullanılıyor |

---

## 📊 Örnek: Bir İşlem Akışı

### Senaryo: Dashboard Sayfası Görüntüleme

```javascript
// 1. Route tanımı (routes/index.js)
router.get('/', DashboardController.getDashboard);

// 2. Controller (controllers/dashboardController.js)
static async getDashboard(req, res) {
  const departments = await Department.findAll();      // MODEL kullanımı
  const anomalies = await Anomaly.findAll();           // MODEL kullanımı
  res.render('dashboard/index', {                      // VIEW kullanımı
    departments,
    anomalies
  });
}

// 3. Model (models/Department.js)
static async findAll() {
  const [rows] = await db.execute('SELECT * FROM departments');
  return rows;  // Veritabanından veri döndür
}

// 4. View (views/dashboard/index.ejs)
<h1>Departmanlar</h1>
<% departments.forEach(dept => { %>
  <div><%= dept.department_name %></div>
<% }); %>
```

---

## 🎯 Sonuç

✅ **Evet, proje MVC yapısına tam uyumludur!**

- ✅ **Model** katmanı → Veritabanı işlemleri
- ✅ **View** katmanı → EJS şablonları
- ✅ **Controller** katmanı → İş mantığı
- ✅ **Route** katmanı → URL yönlendirme

Bu yapı sayesinde:
- Kod daha organize ve bakımı kolay
- Farklı geliştiriciler farklı katmanlarda çalışabilir
- Test yazılması daha kolay
- Kod tekrarı azalır











