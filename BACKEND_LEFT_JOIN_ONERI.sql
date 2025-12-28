-- =====================================================
-- BACKEND İÇİN ÖNERİLEN LEFT JOIN + COALESCE SORULARI
-- Tüm departmanları gösterir (verisi olsun ya da olmasın)
-- =====================================================

-- 1. Dashboard için - Tüm aktif departmanlar için son ay verileri
-- =====================================================
-- Bu sorgu, tüm aktif departmanları gösterir ve verisi olmayanlar için 0 döndürür

SELECT 
    d.department_id,
    d.department_name,
    ? AS month_key,  -- Backend'den gelen selectedMonthKey
    COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
    COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
    COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
FROM 
    departments d
    LEFT JOIN energy_monthly em ON 
        d.department_id = em.department_id 
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?  -- Backend'den gelen selectedMonthKey
WHERE 
    d.active = 1
GROUP BY 
    d.department_id, 
    d.department_name
ORDER BY 
    d.department_name;


-- 2. Senaryo karşılaştırması için - Belirli ay ve departman için
-- =====================================================

SELECT 
    d.department_id,
    d.department_name,
    DATE_FORMAT(em.month_key, '%Y-%m-01') AS month_key,
    COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
    COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
    COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
FROM 
    departments d
    LEFT JOIN energy_monthly em ON 
        d.department_id = em.department_id 
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?  -- monthKey parametresi
WHERE 
    (d.department_id = ? OR ? IS NULL)  -- departmentId parametresi (opsiyonel)
    AND d.active = 1
GROUP BY 
    d.department_id, 
    d.department_name,
    DATE_FORMAT(em.month_key, '%Y-%m-01')
ORDER BY 
    d.department_name;


-- 3. Enerji türü bazında detaylı sorgu (gerekirse)
-- =====================================================

SELECT 
    d.department_id,
    d.department_name,
    et.energy_type_id,
    et.energy_name,
    DATE_FORMAT(em.month_key, '%Y-%m-01') AS month_key,
    COALESCE(em.consumption_kwh, 0) AS consumption_kwh,
    COALESCE(em.cost_tl, 0) AS cost_tl,
    COALESCE(em.co2_kg, 0) AS co2_kg
FROM 
    departments d
    CROSS JOIN energy_types et
    LEFT JOIN energy_monthly em ON 
        d.department_id = em.department_id 
        AND et.energy_type_id = em.energy_type_id
        AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?  -- monthKey parametresi
WHERE 
    d.active = 1
    AND (d.department_id = ? OR ? IS NULL)  -- departmentId parametresi (opsiyonel)
ORDER BY 
    d.department_name,
    et.energy_type_id;


-- 4. EnergyMonthly Model için güncellenmiş getDashboardData() metodu
-- =====================================================
/*
-- JavaScript/Node.js örneği:
static async getDashboardData() {
    // 1. Aktif departman sayısını bul
    const [activeDeptCountResult] = await db.execute(
        'SELECT COUNT(*) as count FROM departments WHERE active = 1'
    );
    const activeDeptCount = activeDeptCountResult[0].count;
    
    if (activeDeptCount === 0) {
        return [];
    }
    
    // 2. Tüm aktif departmanların verisi olan en güncel ayı bul
    const [completeMonths] = await db.execute(`
        SELECT 
            DATE_FORMAT(em.month_key, '%Y-%m-01') AS month_key,
            COUNT(DISTINCT d.department_id) AS dept_count
        FROM energy_monthly em
        INNER JOIN departments d ON em.department_id = d.department_id
        WHERE d.active = 1
        GROUP BY DATE_FORMAT(em.month_key, '%Y-%m-01')
        HAVING dept_count = ?
        ORDER BY month_key DESC
        LIMIT 1
    `, [activeDeptCount]);
    
    let selectedMonthKey = null;
    
    if (completeMonths.length > 0) {
        selectedMonthKey = completeMonths[0].month_key;
    } else {
        const [latestMonthResult] = await db.execute(`
            SELECT DATE_FORMAT(MAX(month_key), '%Y-%m-01') AS month_key
            FROM energy_monthly
        `);
        if (latestMonthResult.length > 0 && latestMonthResult[0].month_key) {
            selectedMonthKey = latestMonthResult[0].month_key;
        } else {
            return [];
        }
    }
    
    // 3. TÜM aktif departmanları LEFT JOIN ile çek (verisi olmayanlar 0 döner)
    const [rows] = await db.execute(`
        SELECT 
            d.department_id,
            d.department_name,
            ? AS month_key,
            COALESCE(SUM(em.consumption_kwh), 0) AS total_kwh,
            COALESCE(SUM(em.cost_tl), 0) AS total_cost_tl,
            COALESCE(SUM(em.co2_kg), 0) AS total_co2_kg
        FROM departments d
        LEFT JOIN energy_monthly em ON 
            d.department_id = em.department_id 
            AND DATE_FORMAT(em.month_key, '%Y-%m-01') = ?
        WHERE d.active = 1
        GROUP BY d.department_id, d.department_name
        ORDER BY d.department_name
    `, [selectedMonthKey, selectedMonthKey]);
    
    return rows;
}
*/


