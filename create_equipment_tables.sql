-- إنشاء جدول المعدات المبسط
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL UNIQUE,
  type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active',
  description TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(12, 2),
  current_project_id VARCHAR REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إضافة فهرس على الكود للبحث السريع
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(code);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(current_project_id);

-- إنشاء جدول حركات المعدات
CREATE TABLE IF NOT EXISTS equipment_movements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  from_project_id VARCHAR REFERENCES projects(id),
  to_project_id VARCHAR REFERENCES projects(id),
  movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  performed_by TEXT NOT NULL,
  notes TEXT
);

-- فهارس لجدول حركات المعدات
CREATE INDEX IF NOT EXISTS idx_equipment_movements_equipment ON equipment_movements(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_date ON equipment_movements(movement_date);

-- إضافة بيانات تجريبية للمعدات
INSERT INTO equipment (name, code, type, status, description, purchase_date, purchase_price, current_project_id)
VALUES 
  ('حفار صغير', 'EQ-001', 'construction', 'active', 'حفار صغير للأعمال الإنشائية', '2024-01-15', 85000.00, NULL),
  ('شاحنة نقل', 'EQ-002', 'transport', 'active', 'شاحنة نقل المواد والمعدات', '2023-12-20', 120000.00, NULL),
  ('مولد كهربائي', 'EQ-003', 'tool', 'maintenance', 'مولد كهربائي 50 كيلوواط', '2023-08-10', 15000.00, NULL)
ON CONFLICT (code) DO NOTHING;

-- التأكد من وجود جداول المعدات
SELECT 'تم إنشاء جداول المعدات بنجاح' AS message;