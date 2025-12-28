-- =====================================================
-- EKSİK ENERJİ VERİSİ DOLDURMA SCRIPT
-- Ar-Ge (id=14) ve Pazarlama (id=15) için eksik kayıtları doldurur
-- =====================================================

-- ADIM 1: Kontrol - Hangi kayıtlar eksik?
-- =====================================================
-- Bu sorgu, Ar-Ge ve Pazarlama için eksik olan kombinasyonları gösterir

SELECT 
    d.department_id,
    d.department_name,
    et.energy_type_id,
    et.energy_name,
    target_months.month_key,
    CASE 
        WHEN em.monthly_id IS NULL THEN 'EKSİK'
        ELSE 'VAR'
    END AS durum
FROM 
    (SELECT 14 AS department_id UNION SELECT 15) target_depts
    CROSS JOIN departments d ON d.department_id = target_depts.department_id
    CROSS JOIN energy_types et
    CROSS JOIN (
        SELECT DISTINCT DATE_FORMAT(month_key, '%Y-%m-01') AS month_key
        FROM energy_monthly
        ORDER BY month_key DESC
        LIMIT 6  -- Son 6 ay
    ) target_months
    LEFT JOIN energy_monthly em ON 
        em.department_id = d.department_id 
        AND em.energy_type_id = et.energy_type_id
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = target_months.month_key
WHERE 
    em.monthly_id IS NULL  -- Sadece eksik olanlar
ORDER BY 
    d.department_id, 
    target_months.month_key DESC, 
    et.energy_type_id;


-- ADIM 2: Eksik kayıtları gerçekçi değerlerle doldur
-- =====================================================
-- Strateji:
-- 1. Her eksik kombinasyon için (departman x ay x enerji_türü)
-- 2. O ay + enerji_türü için diğer departmanların (kWh/çalışan) ortalamasını hesapla
-- 3. Departman çarpanı uygula: Ar-Ge %90, Pazarlama %80
-- 4. employee_count ile çarp
-- 5. cost_tl ve co2_kg hesapla

INSERT INTO energy_monthly (
    department_id,
    energy_type_id,
    month_key,
    consumption_kwh,
    cost_tl,
    co2_kg,
    created_at
)
SELECT 
    missing.dept_id AS department_id,
    missing.energy_type_id,
    missing.month_key,
    
    -- consumption_kwh hesaplama:
    -- (Diğer departmanların kWh/çalışan ortalaması) * çarpan * çalışan_sayısı
    -- Eğer o ay için veri yoksa, tüm zamanların ortalamasını kullan
    ROUND(
        COALESCE(
            avg_monthly.avg_kwh_per_emp,
            avg_global.avg_kwh_per_emp,
            0
        ) * 
        missing.multiplier * 
        COALESCE(d.employee_count, 1),
        2
    ) AS consumption_kwh,
    
    -- cost_tl hesaplama: consumption_kwh * unit_cost
    ROUND(
        COALESCE(
            avg_monthly.avg_kwh_per_emp,
            avg_global.avg_kwh_per_emp,
            0
        ) * 
        missing.multiplier * 
        COALESCE(d.employee_count, 1) * 
        COALESCE(et.unit_cost, 0),
        2
    ) AS cost_tl,
    
    -- co2_kg hesaplama: consumption_kwh * emission_factor
    ROUND(
        COALESCE(
            avg_monthly.avg_kwh_per_emp,
            avg_global.avg_kwh_per_emp,
            0
        ) * 
        missing.multiplier * 
        COALESCE(d.employee_count, 1) * 
        COALESCE(et.emission_factor, 0),
        2
    ) AS co2_kg,
    
    NOW() AS created_at

FROM (
    -- Eksik kombinasyonları bul
    SELECT 
        d.department_id AS dept_id,
        d.department_name,
        CASE d.department_id 
            WHEN 14 THEN 0.9  -- Ar-Ge: %90 çarpanı
            WHEN 15 THEN 0.8  -- Pazarlama: %80 çarpanı
            ELSE 1.0
        END AS multiplier,
        et.energy_type_id,
        DATE_FORMAT(target_months.month_key, '%Y-%m-01') AS month_key
    FROM 
        (SELECT 14 AS department_id UNION SELECT 15) target_depts
        CROSS JOIN departments d ON d.department_id = target_depts.department_id
        CROSS JOIN energy_types et
        CROSS JOIN (
            SELECT DISTINCT DATE_FORMAT(month_key, '%Y-%m-01') AS month_key
            FROM energy_monthly
            ORDER BY month_key DESC
            LIMIT 6  -- Son 6 ay
        ) target_months
        LEFT JOIN energy_monthly em ON 
            em.department_id = d.department_id 
            AND em.energy_type_id = et.energy_type_id
            AND DATE_FORMAT(em.month_key, '%Y-%m-01') = DATE_FORMAT(target_months.month_key, '%Y-%m-01')
    WHERE 
        em.monthly_id IS NULL  -- Sadece eksik olanlar
        AND d.active = 1
) AS missing

-- Departman bilgilerini getir (employee_count için)
INNER JOIN departments d ON d.department_id = missing.dept_id

-- Enerji türü bilgilerini getir (unit_cost ve emission_factor için)
INNER JOIN energy_types et ON et.energy_type_id = missing.energy_type_id

-- Ay bazında ortalama kWh/çalışan (diğer departmanlardan)
LEFT JOIN (
    SELECT 
        em.energy_type_id,
        DATE_FORMAT(em.month_key, '%Y-%m-01') AS month_key,
        AVG(em.consumption_kwh / NULLIF(d.employee_count, 0)) AS avg_kwh_per_emp
    FROM 
        energy_monthly em
        INNER JOIN departments d ON d.department_id = em.department_id
    WHERE 
        d.department_id NOT IN (14, 15)  -- Ar-Ge ve Pazarlama hariç
        AND d.active = 1
        AND d.employee_count > 0
        AND em.consumption_kwh > 0
    GROUP BY 
        em.energy_type_id, 
        DATE_FORMAT(em.month_key, '%Y-%m-01')
) AS avg_monthly ON 
    avg_monthly.energy_type_id = missing.energy_type_id
    AND avg_monthly.month_key = missing.month_key

-- Global ortalama kWh/çalışan (ay bazında veri yoksa kullanılacak)
LEFT JOIN (
    SELECT 
        em.energy_type_id,
        AVG(em.consumption_kwh / NULLIF(d.employee_count, 0)) AS avg_kwh_per_emp
    FROM 
        energy_monthly em
        INNER JOIN departments d ON d.department_id = em.department_id
    WHERE 
        d.department_id NOT IN (14, 15)
        AND d.active = 1
        AND d.employee_count > 0
        AND em.consumption_kwh > 0
    GROUP BY 
        em.energy_type_id
) AS avg_global ON 
    avg_global.energy_type_id = missing.energy_type_id

WHERE 
    -- Sadece geçerli değerler (0'dan büyük consumption üretecek kayıtlar)
    COALESCE(
        avg_monthly.avg_kwh_per_emp,
        avg_global.avg_kwh_per_emp,
        0
    ) > 0
    AND COALESCE(d.employee_count, 0) > 0  -- Çalışan sayısı 0'dan büyük olmalı

ON DUPLICATE KEY UPDATE
    -- Var olan kayıtları ASLA güncelleme (sadece yeni kayıt ekle)
    -- Eğer kayıt zaten varsa, mevcut değerleri koru
    consumption_kwh = consumption_kwh,
    cost_tl = cost_tl,
    co2_kg = co2_kg;


-- ADIM 3: Kontrol - Doldurma sonrası durum
-- =====================================================
-- Bu sorgu, doldurma işleminden sonra tüm departmanların durumunu gösterir

SELECT 
    d.department_id,
    d.department_name,
    COUNT(DISTINCT CONCAT(et.energy_type_id, '-', DATE_FORMAT(em.month_key, '%Y-%m-01'))) AS toplam_kayit,
    COUNT(DISTINCT et.energy_type_id) AS enerji_turu_sayisi,
    COUNT(DISTINCT DATE_FORMAT(em.month_key, '%Y-%m-01')) AS ay_sayisi,
    MIN(DATE_FORMAT(em.month_key, '%Y-%m-01')) AS ilk_ay,
    MAX(DATE_FORMAT(em.month_key, '%Y-%m-01')) AS son_ay,
    ROUND(SUM(em.consumption_kwh), 2) AS toplam_kwh,
    ROUND(SUM(em.cost_tl), 2) AS toplam_maliyet
FROM 
    departments d
    CROSS JOIN energy_types et
    LEFT JOIN energy_monthly em ON 
        em.department_id = d.department_id 
        AND em.energy_type_id = et.energy_type_id
WHERE 
    d.department_id IN (14, 15)  -- Ar-Ge ve Pazarlama
    AND d.active = 1
GROUP BY 
    d.department_id, 
    d.department_name
ORDER BY 
    d.department_id;


-- ADIM 4: Detaylı kontrol - Ay bazında kontrol
-- =====================================================
-- Her departman için ay x enerji_türü kombinasyonlarını gösterir

SELECT 
    d.department_id,
    d.department_name,
    DATE_FORMAT(em.month_key, '%Y-%m-01') AS ay,
    et.energy_type_id,
    et.energy_name,
    ROUND(em.consumption_kwh, 2) AS consumption_kwh,
    ROUND(em.cost_tl, 2) AS cost_tl,
    ROUND(em.co2_kg, 2) AS co2_kg,
    CASE 
        WHEN em.monthly_id IS NOT NULL THEN '✓ Var'
        ELSE '✗ Eksik'
    END AS durum
FROM 
    departments d
    CROSS JOIN energy_types et
    CROSS JOIN (
        SELECT DISTINCT DATE_FORMAT(month_key, '%Y-%m-01') AS month_key
        FROM energy_monthly
        ORDER BY month_key DESC
        LIMIT 6
    ) target_months
    LEFT JOIN energy_monthly em ON 
        em.department_id = d.department_id 
        AND em.energy_type_id = et.energy_type_id
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = target_months.month_key
WHERE 
    d.department_id IN (14, 15)
    AND d.active = 1
ORDER BY 
    d.department_id, 
    target_months.month_key DESC, 
    et.energy_type_id;


-- ADIM 5: Backend için önerilen SELECT sorgusu
-- =====================================================
-- Tüm departmanları (verisi olsun ya da olmasın) gösteren sorgu

/*
SELECT 
    d.department_id,
    d.department_name,
    DATE_FORMAT(COALESCE(em.month_key, ?), '%Y-%m-01') AS month_key,
    COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
    COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
    COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
FROM 
    departments d
    LEFT JOIN energy_monthly em ON 
        d.department_id = em.department_id 
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?
WHERE 
    d.active = 1
GROUP BY 
    d.department_id, 
    d.department_name
ORDER BY 
    d.department_name;
*/

