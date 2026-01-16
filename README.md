# Vestel Karar Destek Sistemi
## Proje Açıklaması
Bu proje, Vestel benzeri büyük ölçekli bir üretim işletmesi için geliştirilmiş,
enerji yönetimi odaklı bir karar destek sistemidir. Sistem; departman bazlı
enerji tüketimlerini analiz eder, anormallikleri tespit eder ve yöneticilere
karar alma sürecinde destek olacak öneriler sunar.

## Senaryo Tanımı
Bir üretim işletmesinde departmanlar aylık enerji tüketim verilerini sisteme girer.
Sistem bu verileri geçmiş dönemlerle karşılaştırarak olağan dışı artışları
(anormallikleri) tespit eder. Tespit edilen anormalliklere bağlı olarak
enerji tasarrufu önerileri oluşturulur. Yöneticiler, senaryo analizi modülü ile
farklı tasarruf senaryolarını karşılaştırabilir ve uygun olanı uygulayabilir.


> **💡 Hızlı Başlangıç:** Bilgisayarı kapattıktan sonra projeyi tekrar başlatmak için [BAŞLANGIÇ.md](./BAŞLANGIÇ.md) dosyasına bakın!

# Vestel Karar Destek Sistemi

Vestel Şirketi için enerji yönetimi ve karar destek sistemi.

## Teknolojiler

- **Backend:** Node.js, Express.js
- **Veritabanı:** MySQL
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **View Engine:** EJS

## Proje Yapısı

```
vestel proje/
├── config/
│   └── database.js          # Veritabanı bağlantı yapılandırması
├── controllers/             # Controller katmanı
│   ├── dashboardController.js
│   ├── departmentController.js
│   ├── energyMonthlyController.js
│   ├── anomalyController.js
│   └── suggestionController.js
├── models/                  # Model katmanı
│   ├── Department.js
│   ├── EnergyType.js
│   ├── EnergyMonthly.js
│   ├── Anomaly.js
│   └── Suggestion.js
├── routes/                  # Route tanımlamaları
│   └── index.js
├── views/                   # EJS şablonları
│   ├── dashboard/
│   │   └── index.ejs
│   └── error.ejs
├── public/                  # Static dosyalar
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── dashboard.js
├── .env.example            # Örnek environment dosyası
├── .gitignore
├── package.json
├── server.js               # Ana sunucu dosyası
└── README.md
```

## Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Environment dosyasını oluşturun:**
```bash
cp .env.example .env
```

3. **`.env` dosyasını düzenleyin ve veritabanı bilgilerinizi girin:**
```
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=
DB_NAME=hilergy
PORT=3000
```

4. **Sunucuyu başlatın:**
```bash
# Production
npm start

# Development (nodemon ile)
npm run dev
```

5. **Tarayıcıda açın:**
```
http://localhost:3000
```

## API Endpoints

### Dashboard
- `GET /` - Ana dashboard sayfası
- `GET /api/dashboard` - Dashboard verileri (JSON)

### Departmanlar
- `GET /api/departments` - Tüm departmanları listele
- `GET /api/departments/:id` - Belirli bir departmanı getir
- `POST /api/departments` - Yeni departman oluştur
- `PUT /api/departments/:id` - Departman güncelle
- `DELETE /api/departments/:id` - Departman sil

### Enerji Aylık Veriler
- `GET /api/energy-monthly` - Tüm aylık verileri listele
- `GET /api/energy-monthly/:id` - Belirli bir kaydı getir
- `POST /api/energy-monthly` - Yeni kayıt oluştur

### Anormallikler
- `GET /api/anomalies` - Tüm anormallikleri listele
- `GET /api/anomalies/:id` - Belirli bir anormallik getir
- `GET /api/anomalies/level/:level` - Seviyeye göre filtrele (high/medium/low)

### Öneriler
- `GET /api/suggestions` - Tüm önerileri listele
- `GET /api/suggestions/:id` - Belirli bir öneri getir
- `GET /api/suggestions/department/:departmentId` - Departman bazında öneriler

## Veritabanı Yapısı

Sistem aşağıdaki tablolarla çalışır:

- `departments` - Departman bilgileri
- `energy_types` - Enerji türleri (Elektrik, Doğalgaz, Yakıt)
- `energy_monthly` - Aylık enerji tüketim verileri
- `anomalies` - Tespit edilen anormallikler
- `suggestions` - Enerji tasarrufu önerileri
- `suggestion_reasons` - Öneri nedenleri ilişkisi
- `reason_library` - Anormallik nedenleri kütüphanesi
- `scenario_library` - Senaryo kütüphanesi
- `scenario_applied` - Uygulanan senaryolar
- `users` - Kullanıcı bilgileri

## Özellikler

- ✅ MVC mimari yapısı
- ✅ RESTful API endpoints
- ✅ Dashboard görünümü
- ✅ Anormallik takibi
- ✅ Enerji tasarrufu önerileri
- ✅ Departman bazında raporlama
- ✅ Responsive tasarım

## Geliştirme

Projeyi geliştirmek için:

1. `npm run dev` komutu ile nodemon kullanarak geliştirme modunda çalıştırın
2. Kod değişiklikleriniz otomatik olarak yenilenecektir

## Notlar

- Veritabanı bağlantı bilgilerinizi `.env` dosyasında saklayın
- Production ortamında `SESSION_SECRET` değerini güvenli bir değerle değiştirin
- HTTPS kullanıyorsanız `server.js` içindeki session cookie `secure` özelliğini `true` yapın

