const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Koneksi ke MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stok_bahan_baku",
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi ke database gagal:", err.message);
    return;
  }
  console.log("Terhubung ke database MySQL!");
});


// API: Bahan Baku


// Ambil semua bahan baku
app.get("/bahan-baku", (req, res) => {
  db.query("SELECT * FROM bahan_baku", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Tambah bahan baku baru atau update stok
app.post("/bahan-baku", (req, res) => {
  let { nama, satuan, stok_awal } = req.body;

  nama = nama?.trim();
  satuan = satuan?.trim();
  stok_awal = parseInt(stok_awal);

  if (!nama || !satuan || isNaN(stok_awal) || stok_awal <= 0) {
    return res.status(400).json({
      error: "Nama, satuan, dan stok awal harus diisi dengan benar",
    });
  }

  const checkQuery = `SELECT * FROM bahan_baku WHERE nama = ? AND satuan = ?`;
  db.query(checkQuery, [nama, satuan], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      const existing = results[0];
      const newStok = existing.stok_saat_ini + stok_awal;

      db.query(
        `UPDATE bahan_baku SET stok_saat_ini = ? WHERE id = ?`,
        [newStok, existing.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          db.query(
            `INSERT INTO histori_stok (id_bahan_baku, stok_awal, stok_akhir, perubahan)
             VALUES (?, ?, ?, ?)`,
            [existing.id, existing.stok_saat_ini, newStok, stok_awal],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              res.status(200).json({
                message: `Stok bahan ${nama} (${satuan}) berhasil ditambah sebanyak ${stok_awal}`,
              });
            }
          );
        }
      );
    } else {
      db.query(
        `INSERT INTO bahan_baku (nama, satuan, stok_awal, stok_saat_ini)
         VALUES (?, ?, ?, ?)`,
        [nama, satuan, stok_awal, stok_awal],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          db.query(
            `INSERT INTO histori_stok (id_bahan_baku, stok_awal, stok_akhir, perubahan)
             VALUES (?, ?, ?, ?)`,
            [result.insertId, 0, stok_awal, stok_awal],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              res.status(201).json({
                message: `Bahan baru ${nama} (${satuan}) berhasil ditambahkan dengan stok ${stok_awal}`,
              });
            }
          );
        }
      );
    }
  });
});


// API: Histori Stok

app.get("/histori-stok", (req, res) => {
  const query = `
    SELECT hs.*, bb.nama 
    FROM histori_stok hs
    JOIN bahan_baku bb ON hs.id_bahan_baku = bb.id
    ORDER BY hs.tanggal DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


// API: Transaksi Masuk/Keluar

app.post("/transaksi", (req, res) => {
  const { id_bahan_baku, jenis_transaksi, jumlah } = req.body;

  if (!["masuk", "keluar"].includes(jenis_transaksi) || isNaN(jumlah) || jumlah <= 0) {
    return res.status(400).json({ error: "Jenis transaksi atau jumlah tidak valid" });
  }

  db.query(
    "SELECT * FROM bahan_baku WHERE id = ?",
    [id_bahan_baku],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "Bahan baku tidak ditemukan" });

      const bahan = results[0];
      const stok_awal = bahan.stok_saat_ini;
      let stok_akhir = stok_awal;

      if (jenis_transaksi === "masuk") {
        stok_akhir += jumlah;
      } else {
        if (jumlah > stok_awal) {
          return res.status(400).json({ error: "Jumlah melebihi stok tersedia" });
        }
        stok_akhir -= jumlah;
      }

      db.query(
        "UPDATE bahan_baku SET stok_saat_ini = ? WHERE id = ?",
        [stok_akhir, id_bahan_baku],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          const perubahan = jenis_transaksi === "masuk" ? jumlah : -jumlah;
          db.query(
            "INSERT INTO histori_stok (id_bahan_baku, stok_awal, stok_akhir, perubahan) VALUES (?, ?, ?, ?)",
            [id_bahan_baku, stok_awal, stok_akhir, perubahan],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              res.status(201).json({
                message: `Stok ${bahan.nama} (${bahan.satuan}) berhasil ${jenis_transaksi === "masuk" ? "ditambah" : "dikurangi"} sebanyak ${jumlah}. Stok sekarang: ${stok_akhir}`,
              });
            }
          );
        }
      );
    }
  );
});


// API: Login Admin

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM admin WHERE username = ? LIMIT 1`;
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(401).json({ error: "Username tidak ditemukan" });
    }

    const admin = results[0];
    if (admin.password !== password) {
      return res.status(401).json({ error: "Password salah" });
    }

    res
      .status(200)
      .json({ message: "Login berhasil", username: admin.username });
  });
});


// Jalankan Server

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
