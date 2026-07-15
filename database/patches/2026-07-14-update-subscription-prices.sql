UPDATE subscription_plans
SET price = 29000
WHERE UPPER(plan_name) = 'PRO';

UPDATE subscription_plans
SET price = 69000
WHERE UPPER(plan_name) = 'PREMIUM';
