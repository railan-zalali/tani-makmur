-- Tani Makmur — MySQL Schema
-- Run this in phpMyAdmin on your cPanel database

-- ─── Categories table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          VARCHAR(100) PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  short_name  VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name   VARCHAR(50)  NOT NULL DEFAULT 'Package',
  badge_color VARCHAR(200) NOT NULL DEFAULT 'bg-stone-100 text-stone-800 border-stone-200',
  bg_color    VARCHAR(200) NOT NULL DEFAULT 'bg-stone-50 group-hover:bg-stone-100',
  icon_color  VARCHAR(100) NOT NULL DEFAULT 'text-stone-600',
  sort_order  INT          NOT NULL DEFAULT 99,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Products table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'pupuk-kimia',  -- FK to categories.id (soft)
  price INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  min_order INT DEFAULT NULL,
  stock_label ENUM('Tersedia','Stok Menipis','Pre-Order') NOT NULL DEFAULT 'Tersedia',
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  tag VARCHAR(100) DEFAULT NULL,
  weight_kg DECIMAL(8,3) DEFAULT NULL,
  images JSON DEFAULT NULL,             -- JSON array of image URLs
  active_ingredients JSON DEFAULT NULL, -- JSON array of strings
  short_desc TEXT,
  description TEXT,
  composition TEXT,
  usage_text TEXT,
  dosage TEXT,
  suitable_crops JSON DEFAULT NULL,     -- JSON array of strings
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_featured (featured),
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Migration: if products table already exists with ENUM category ────────────
-- Run this manually in phpMyAdmin if upgrading from old schema:
--   ALTER TABLE products MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'pupuk-kimia';
