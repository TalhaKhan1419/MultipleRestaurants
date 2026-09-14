ALTER TABLE orders
  MODIFY COLUMN status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';
