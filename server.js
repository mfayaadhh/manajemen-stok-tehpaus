const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // ← Baca .env di lokal

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ← aman untuk Railway dan Render
  },
});

// =====================
// API: LOGIN ADMIN
// =====================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM admin WHERE username = $1', [username]);
    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ error: 'Login gagal' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// API: BAHAN BAKU
// =====================
app.get('/api/bahan-baku', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bahan_baku WHERE stok_saat_ini > 0');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bahan-baku', async (req, res) => {
  const { nama, satuan, stok_awal } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO bahan_baku (nama, satuan, stok_awal, stok_saat_ini) VALUES ($1, $2, $3, $3) RETURNING *',
      [nama, satuan, stok_awal]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// API: HISTORI STOK
// =====================
app.get('/api/histori-stok', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM histori_stok ORDER BY tanggal DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// API: TRANSAKSI
// =====================
app.post('/api/transaksi', async (req, res) => {
  const { id_bahan_baku, jenis_transaksi, jumlah } = req.body;

  if (!['masuk', 'keluar'].includes(jenis_transaksi)) {
    return res.status(400).json({ error: 'Jenis transaksi tidak valid' });
  }

  try {
    const bahan = await db.query('SELECT stok_saat_ini FROM bahan_baku WHERE id = $1', [id_bahan_baku]);
    if (bahan.rows.length === 0) return res.status(404).json({ error: 'Bahan baku tidak ditemukan' });

    const stok_awal = bahan.rows[0].stok_saat_ini;
    let stok_akhir = stok_awal;

    if (jenis_transaksi === 'masuk') stok_akhir += jumlah;
    if (jenis_transaksi === 'keluar') {
      if (jumlah > stok_awal) return res.status(400).json({ error: 'Jumlah melebihi stok tersedia' });
      stok_akhir -= jumlah;
    }

    await db.query('UPDATE bahan_baku SET stok_saat_ini = $1 WHERE id = $2', [stok_akhir, id_bahan_baku]);
    const perubahan = jenis_transaksi === 'masuk' ? jumlah : -jumlah;
    await db.query(
      'INSERT INTO histori_stok (id_bahan_baku, stok_awal, stok_akhir, perubahan) VALUES ($1, $2, $3, $4)',
      [id_bahan_baku, stok_awal, stok_akhir, perubahan]
    );

    res.status(201).json({ message: 'Transaksi berhasil diproses' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SPA HTML Fallback
// =====================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// =====================
// Start Server
// =====================
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
