ALTER TABLE orders
  ADD COLUMN tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER discount_amount,
  ADD COLUMN payment_method ENUM('cash', 'card', 'online', 'qr_pay', 'unassigned') NOT NULL DEFAULT 'unassigned' AFTER payment_status;
