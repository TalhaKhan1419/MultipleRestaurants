ALTER TABLE admins
  MODIFY role ENUM('super_admin', 'restaurant_owner', 'admin') NOT NULL;

UPDATE admins
SET role = 'admin'
WHERE role = 'restaurant_owner';

ALTER TABLE admins
  MODIFY role ENUM('super_admin', 'admin') NOT NULL;
