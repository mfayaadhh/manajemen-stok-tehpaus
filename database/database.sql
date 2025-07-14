-- database.sql

-- Buat database (jika lokal, tidak digunakan di Heroku)
-- CREATE DATABASE stok_bahan_baku;
-- USE stok_bahan_baku;

-- Tabel Admin
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Admin default
INSERT INTO admin (username, password) VALUES ('admin', 'admin123')
  ON CONFLICT (username) DO NOTHING;

-- Tabel Bahan Baku
CREATE TABLE IF NOT EXISTS bahan_baku (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  satuan VARCHAR(50) NOT NULL,
  stok_awal INT NOT NULL,
  stok_saat_ini INT NOT NULL
);

-- Tabel Transaksi
CREATE TABLE IF NOT EXISTS transaksi (
  id SERIAL PRIMARY KEY,
  id_bahan_baku INT NOT NULL,
  jenis_transaksi VARCHAR(10) CHECK (jenis_transaksi IN ('masuk', 'keluar')),
  jumlah INT NOT NULL,
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_bahan_baku) REFERENCES bahan_baku(id) ON DELETE CASCADE
);

-- Tabel Histori Stok
CREATE TABLE IF NOT EXISTS histori_stok (
  id SERIAL PRIMARY KEY,
  id_bahan_baku INT NOT NULL,
  stok_awal INT NOT NULL,
  stok_akhir INT NOT NULL,
  perubahan INT NOT NULL,
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_bahan_baku) REFERENCES bahan_baku(id) ON DELETE CASCADE
);
