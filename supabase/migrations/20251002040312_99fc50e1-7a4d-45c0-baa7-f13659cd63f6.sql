-- Update existing barangays with the correct Tayum barangays
-- Since we have 11 existing and need 11 new ones, we'll update them

WITH old_barangays AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM barangays
),
new_barangays AS (
  SELECT * FROM (VALUES
    (1, 'Baggalay', 'BAG'),
    (2, 'Basbasa', 'BAS'),
    (3, 'Budac', 'BUD'),
    (4, 'Bumagcat', 'BUM'),
    (5, 'Cabaroan', 'CAB'),
    (6, 'Deet', 'DEE'),
    (7, 'Gaddani', 'GAD'),
    (8, 'Patucannay', 'PAT'),
    (9, 'Pias', 'PIA'),
    (10, 'Poblacion', 'POB'),
    (11, 'Velasco', 'VEL')
  ) AS t(rn, name, code)
)
UPDATE barangays
SET 
  name = new_barangays.name,
  code = new_barangays.code,
  updated_at = now()
FROM old_barangays
JOIN new_barangays ON old_barangays.rn = new_barangays.rn
WHERE barangays.id = old_barangays.id;