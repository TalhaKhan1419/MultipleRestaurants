CREATE TABLE IF NOT EXISTS menu_item_categories (
  restaurant_id BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (menu_item_id, category_id),
  KEY idx_menu_item_categories_restaurant_id (restaurant_id),
  KEY idx_menu_item_categories_category_id (category_id),
  CONSTRAINT fk_menu_item_categories_item_restaurant FOREIGN KEY (restaurant_id, menu_item_id) REFERENCES menu_items (restaurant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_menu_item_categories_category_restaurant FOREIGN KEY (restaurant_id, category_id) REFERENCES categories (restaurant_id, id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @has_legacy_category_id = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'menu_items' AND column_name = 'category_id'
);

SET @copy_legacy_categories_sql = IF(
  @has_legacy_category_id = 1,
  'INSERT IGNORE INTO menu_item_categories (restaurant_id, menu_item_id, category_id) SELECT restaurant_id, id, category_id FROM menu_items WHERE category_id IS NOT NULL',
  'SELECT 1'
);
PREPARE copy_legacy_categories FROM @copy_legacy_categories_sql;
EXECUTE copy_legacy_categories;
DEALLOCATE PREPARE copy_legacy_categories;

SET @remove_legacy_category_sql = IF(
  @has_legacy_category_id = 1,
  'ALTER TABLE menu_items DROP FOREIGN KEY fk_menu_items_category, DROP INDEX idx_menu_items_category_id, DROP COLUMN category_id',
  'SELECT 1'
);
PREPARE remove_legacy_category FROM @remove_legacy_category_sql;
EXECUTE remove_legacy_category;
DEALLOCATE PREPARE remove_legacy_category;
