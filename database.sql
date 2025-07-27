-- Buat database
CREATE DATABASE IF NOT EXISTS stok_bahan_baku;
USE stok_bahan_baku;

-- Tabel bahan_baku
CREATE TABLE IF NOT EXISTS bahan_baku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    stok_awal INT NOT NULL,
    stok_saat_ini INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel transaksi
CREATE TABLE IF NOT EXISTS transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bahan_baku INT NOT NULL,
    jenis_transaksi ENUM('masuk', 'keluar') NOT NULL,
    jumlah INT NOT NULL,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_bahan_baku) REFERENCES bahan_baku(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

INSERT INTO admin (username, password)
VALUES ('admin', 'admin123')
ON DUPLICATE KEY UPDATE username = username;


-- Tabel histori_stok
CREATE TABLE IF NOT EXISTS histori_stok (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bahan_baku INT NOT NULL,
    stok_awal INT NOT NULL,
    stok_akhir INT NOT NULL,
    perubahan INT NOT NULL,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_bahan_baku) REFERENCES bahan_baku(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
