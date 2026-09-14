INSERT INTO restaurants (id, name, slug, phone, email, address)
VALUES (1, 'Demo Restaurant', 'demo-restaurant', '+971500000000', 'hello@demorestaurant.local', 'Dubai, UAE');

INSERT INTO admins (id, restaurant_id, full_name, phone, email, password_hash, role) VALUES
  (1, NULL, 'Super Admin', '+971500000001', 'superadmin@restaurant.local', '$2b$12$tKDv0y7rKwAIplKZHPS/TuQ0OjfZoPzpQFP7Onz16sd9sKFhsWY3C', 'super_admin'),
  (2, 1, 'Demo Restaurant Admin', '+971500000002', 'owner@demorestaurant.local', '$2b$12$tKDv0y7rKwAIplKZHPS/TuQ0OjfZoPzpQFP7Onz16sd9sKFhsWY3C', 'admin');

INSERT INTO users (id, restaurant_id, full_name, phone)
VALUES (1, 1, 'Ahmed Khan', '+971501234567');

INSERT INTO categories (id, restaurant_id, name, description, display_order) VALUES
  (1, 1, 'Starters', 'Light dishes to begin with', 1),
  (2, 1, 'Main Course', 'Restaurant signature mains', 2),
  (3, 1, 'Beverages', 'Cold and hot drinks', 3),
  (4, 1, 'Non-Veg', 'Chicken, meat and seafood dishes', 4);

INSERT INTO menu_items (id, restaurant_id, name, description, price) VALUES
  (1, 1, 'Chicken Wings', 'Crispy wings with house sauce', 28.00),
  (2, 1, 'Chicken Tikka', 'Chargrilled chicken tikka', 42.00),
  (3, 1, 'Fresh Lemonade', 'Fresh lemon and mint', 12.00);

INSERT INTO menu_item_categories (restaurant_id, menu_item_id, category_id) VALUES
  (1, 1, 1),
  (1, 2, 1),
  (1, 2, 4),
  (1, 3, 3);

INSERT INTO restaurant_tables (id, restaurant_id, table_number, capacity, qr_token, status) VALUES
  (1, 1, 'T1', 2, '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'available'),
  (2, 1, 'T2', 4, '6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'occupied'),
  (3, 1, 'T3', 6, '6ba7b812-9dad-11d1-80b4-00c04fd430c8', 'available');

INSERT INTO orders (id, restaurant_id, table_id, user_id, order_number, status, order_type, subtotal, total_amount, payment_status)
VALUES (1, 1, 2, 1, 'ORD-0001', 'preparing', 'dine_in', 54.00, 54.00, 'unpaid');

INSERT INTO order_items (order_id, restaurant_id, menu_item_id, item_name, unit_price, quantity, line_total) VALUES
  (1, 1, 2, 'Grilled Chicken', 42.00, 1, 42.00),
  (1, 1, 3, 'Fresh Lemonade', 12.00, 1, 12.00);
