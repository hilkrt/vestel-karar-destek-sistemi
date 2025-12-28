# 🚀 Vestel Karar Destek Sistemi - Hızlı Başlangıç Kılavuzu

## 📋 Bilgisayarı Kapattıktan Sonra Projeyi Tekrar Başlatma

### 1️⃣ Adım: Terminal/Command Prompt Açın
- **Mac:** `Terminal` uygulamasını açın
- **Windows:** `Command Prompt` veya `PowerShell` açın

### 2️⃣ Adım: Proje Klasörüne Gidin
```bash
cd "/Users/hil/Desktop/vestel proje"
```

### 3️⃣ Adım: MySQL Veritabanını Başlatın
**MAMP kullanıyorsanız:**
- MAMP uygulamasını açın
- "Start Servers" butonuna tıklayın
- MySQL servisinin çalıştığından emin olun

**Veya doğrudan MySQL kullanıyorsanız:**
- MySQL servisinin çalıştığından emin olun

### 4️⃣ Adım: Projeyi Başlatın

**Geliştirme modunda (önerilen - otomatik yeniden başlatma):**
```bash
npm run dev
```

**Veya normal modda:**
```bash
npm start
```

### 5️⃣ Adım: Tarayıcıda Açın
Proje başladıktan sonra şu adrese gidin:
```
http://localhost:3000
```

---

## ⚙️ İlk Kurulum (Sadece İlk Defa)

### Gerekli Yazılımlar
1. **Node.js** (v14 veya üzeri)
2. **MySQL** (MAMP veya bağımsız MySQL)
3. **npm** (Node.js ile birlikte gelir)

### Kurulum Adımları

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **.env Dosyasını Oluşturun:**
   Proje klasöründe `.env` dosyası oluşturun ve şu bilgileri ekleyin:
   ```env
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-secret-key-here

   # MySQL Veritabanı Ayarları
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=vestel_energy_db
   ```

   **Not:** MAMP kullanıyorsanız genellikle:
   - `DB_PASSWORD=root` 
   - `DB_PORT=8889` (MAMP'in varsayılan MySQL portu)
   
3. **Veritabanını Kontrol Edin:**
   - Veritabanının oluşturulduğundan emin olun
   - Gerekli tabloların mevcut olduğundan emin olun

---

## 🔧 Sorun Giderme

### Port Zaten Kullanımda Hatası
Eğer "address already in use" hatası alırsanız:

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F
```

### Veritabanı Bağlantı Hatası
- MySQL/MAMP'in çalıştığından emin olun
- `.env` dosyasındaki veritabanı bilgilerini kontrol edin
- MAMP kullanıyorsanız port numarasını `8889` olarak değiştirin

### Modül Bulunamadı Hatası
```bash
npm install
```

---

## 📁 Proje Yapısı

```
vestel proje/
├── config/
│   └── database.js          # Veritabanı bağlantı ayarları
├── controllers/             # İş mantığı (Controller'lar)
├── models/                  # Veritabanı modelleri
├── views/                   # HTML şablonları (EJS)
├── public/
│   ├── css/                 # Stil dosyaları
│   └── js/                  # JavaScript dosyaları
├── routes/                  # Route tanımlamaları
├── server.js                # Ana sunucu dosyası
├── package.json             # Proje bağımlılıkları
└── .env                     # Ortam değişkenleri (kendiniz oluşturmalısınız)
```

---

## 🎯 Hızlı Komutlar

```bash
# Projeyi geliştirme modunda başlat
npm run dev

# Projeyi normal modda başlat
npm start

# Bağımlılıkları yükle
npm install

# Port'u kontrol et
lsof -ti:3000
```

---

## 📞 Yardım

Sorun yaşarsanız:
1. Terminal/Command Prompt çıktısını kontrol edin
2. Tarayıcı konsolunu kontrol edin (F12)
3. `.env` dosyasındaki ayarları kontrol edin
4. MySQL/MAMP servislerinin çalıştığından emin olun

---

**İyi çalışmalar! 🚀**











