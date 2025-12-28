-- ============================================
-- VESTEL KARAR DESTEK SİSTEMİ
-- VERİTABANI EKLEMELERİ
-- ============================================

-- 1. DEPARTMANLAR TABLOSUNA İŞÇİ SAYISI EKLEME
-- Eğer sütun zaten varsa "Duplicate column" hatası verir, bu normaldir
ALTER TABLE departments ADD COLUMN employee_count INT NULL;

-- 2. DEPARTMANLAR TABLOSUNA ORTALAMA MAAŞ EKLEME
-- Eğer sütun zaten varsa "Duplicate column" hatası verir, bu normaldir
ALTER TABLE departments ADD COLUMN average_salary_tl DECIMAL(10,2) NULL;

-- 3. ÖNERİLER TABLOSUNA İŞÇİ ÇIKARIMI ÖNERİSİ EKLEME
-- Eğer sütun zaten varsa "Duplicate column" hatası verir, bu normaldir
ALTER TABLE suggestions ADD COLUMN suggested_employee_reduction INT NULL;

-- ============================================
-- NOT: Eğer "Duplicate column" hatası alırsanız,
-- o sütun zaten mevcut demektir, sorun değil.
-- Diğer komutları çalıştırmaya devam edebilirsiniz.
-- ============================================








