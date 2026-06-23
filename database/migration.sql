USE ai_studyhub;

-- 1. Drop index and column for student_code
ALTER TABLE users DROP INDEX idx_users_student_code;
ALTER TABLE users DROP COLUMN student_code;

-- 2. Add new columns for first name and last name (initially nullable)
ALTER TABLE users ADD COLUMN first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN last_name VARCHAR(50);

-- 3. Migrate existing full_name data into first_name and last_name
-- (Split name: last word is first_name, previous words are last_name)
UPDATE users SET 
    first_name = SUBSTRING_INDEX(full_name, ' ', -1),
    last_name = SUBSTRING(full_name, 1, LENGTH(full_name) - LENGTH(SUBSTRING_INDEX(full_name, ' ', -1)) - 1)
WHERE full_name LIKE '% %';

UPDATE users SET 
    first_name = full_name,
    last_name = ''
WHERE full_name NOT LIKE '% %' OR last_name IS NULL;

-- 4. Apply NOT NULL constraints to the new columns
ALTER TABLE users MODIFY COLUMN first_name VARCHAR(50) NOT NULL;
ALTER TABLE users MODIFY COLUMN last_name VARCHAR(50) NOT NULL;

-- 5. Drop the old full_name column
ALTER TABLE users DROP COLUMN full_name;
