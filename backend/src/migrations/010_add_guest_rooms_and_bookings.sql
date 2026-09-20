CREATE TABLE IF NOT EXISTS guest_rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  room_number VARCHAR(30) NOT NULL,
  room_type VARCHAR(100) NOT NULL DEFAULT 'Standard Room',
  floor VARCHAR(50) NOT NULL DEFAULT '1st Floor',
  capacity INT UNSIGNED NOT NULL DEFAULT 2,
  status ENUM('available', 'occupied', 'reserved', 'cleaning') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guest_rooms_number (restaurant_id, room_number),
  CONSTRAINT fk_guest_rooms_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  room_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  id_proof_type ENUM('Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID') NOT NULL,
  id_proof_number VARCHAR(100) NOT NULL,
  check_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_at TIMESTAMP NULL,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_room_bookings_room (room_id),
  CONSTRAINT fk_room_bookings_room FOREIGN KEY (room_id) REFERENCES guest_rooms (id) ON DELETE CASCADE,
  CONSTRAINT fk_room_bookings_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
