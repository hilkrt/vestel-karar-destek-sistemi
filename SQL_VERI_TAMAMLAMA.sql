-- =====================================================
-- ENERJİ VERİSİ TAMAMLAMA SCRIPT
-- Eksik departman x enerji_türü x ay kombinasyonlarını tamamlar
-- =====================================================

-- 1. UNIQUE CONSTRAINT EKLEME (Eğer yoksa)
ALTER TABLE energy_monthly 
ADD CONSTRAINT unique_department_energy_month 
UNIQUE (department_id, energy_type_id, month_key);

-- Eğer yukarıdaki hata verirse (constraint zaten varsa), şu komutu çalıştırın:
-- ALTER TABLE energy_monthly DROP INDEX unique_department_energy_month;

-- 2. STORED PROCEDURE: Eksik verileri otomatik tamamla
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS FillMissingEnergyData(IN targetMonth DATE)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE deptId INT;
    DECLARE energyTypeId INT;
    DECLARE avgConsumption DECIMAL(10,2);
    DECLARE avgCost DECIMAL(10,2);
    DECLARE avgCo2 DECIMAL(10,2);
    DECLARE typeAvgConsumption DECIMAL(10,2);
    DECLARE typeAvgCost DECIMAL(10,2);
    DECLARE typeAvgCo2 DECIMAL(10,2);
    
    -- Cursor: Tüm aktif departman x enerji türü kombinasyonları
    DECLARE deptEnergyCursor CURSOR FOR
        SELECT d.department_id, et.energy_type_id
        FROM departments d
        CROSS JOIN energy_types et
        WHERE d.active = 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Target month'i ayın ilk günü yap
    SET targetMonth = DATE_FORMAT(targetMonth, '%Y-%m-01');
    
    OPEN deptEnergyCursor;
    
    read_loop: LOOP
        FETCH deptEnergyCursor INTO deptId, energyTypeId;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Bu kombinasyon için bu ayda veri var mı kontrol et
        IF NOT EXISTS (
            SELECT 1 FROM energy_monthly 
            WHERE department_id = deptId 
            AND energy_type_id = energyTypeId 
            AND DATE_FORMAT(month_key, '%Y-%m-01') = targetMonth
        ) THEN
            -- Departman + Type için geçmiş ortalamayı hesapla
            SELECT 
                COALESCE(AVG(consumption_kwh), 0),
                COALESCE(AVG(cost_tl), 0),
                COALESCE(AVG(co2_kg), 0)
            INTO avgConsumption, avgCost, avgCo2
            FROM energy_monthly
            WHERE department_id = deptId 
            AND energy_type_id = energyTypeId
            AND month_key < targetMonth;
            
            -- Eğer departman+type ortalaması yoksa, type global ortalamasını al
            IF avgConsumption = 0 AND avgCost = 0 AND avgCo2 = 0 THEN
                SELECT 
                    COALESCE(AVG(consumption_kwh), 0),
                    COALESCE(AVG(cost_tl), 0),
                    COALESCE(AVG(co2_kg), 0)
                INTO typeAvgConsumption, typeAvgCost, typeAvgCo2
                FROM energy_monthly
                WHERE energy_type_id = energyTypeId
                AND month_key < targetMonth;
                
                SET avgConsumption = typeAvgConsumption;
                SET avgCost = typeAvgCost;
                SET avgCo2 = typeAvgCo2;
            END IF;
            
            -- Veriyi INSERT et (0 bile olsa)
            INSERT INTO energy_monthly 
            (department_id, energy_type_id, month_key, consumption_kwh, cost_tl, co2_kg, created_at)
            VALUES 
            (deptId, energyTypeId, targetMonth, avgConsumption, avgCost, avgCo2, NOW())
            ON DUPLICATE KEY UPDATE
                consumption_kwh = avgConsumption,
                cost_tl = avgCost,
                co2_kg = avgCo2;
        END IF;
    END LOOP;
    
    CLOSE deptEnergyCursor;
END //

DELIMITER ;

-- 3. Son ay için eksik verileri tamamla
CALL FillMissingEnergyData((SELECT MAX(month_key) FROM energy_monthly));

-- 4. Fonksiyon kullanımı (Manuel çalıştırma için):
-- CALL FillMissingEnergyData('2025-12-01');

-- 5. Tüm aylar için çalıştırmak isterseniz:
-- SET @month = '2025-05-01';
-- WHILE @month <= (SELECT MAX(month_key) FROM energy_monthly) DO
--     CALL FillMissingEnergyData(@month);
--     SET @month = DATE_ADD(@month, INTERVAL 1 MONTH);
-- END WHILE;


