ALTER TABLE orders
  ADD COLUMN bill_requested_at TIMESTAMP NULL DEFAULT NULL AFTER payment_method,
  ADD KEY idx_orders_restaurant_bill_request (restaurant_id, bill_requested_at);
