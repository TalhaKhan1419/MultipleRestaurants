ALTER TABLE orders
  ADD COLUMN kitchen_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' AFTER status;

UPDATE orders
SET kitchen_status = status
WHERE status IN ('preparing', 'ready', 'completed', 'cancelled');
