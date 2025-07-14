// admin.js (fetch URL sudah disesuaikan untuk deployment)

// Fungsi notifikasi
const tampilkanNotifikasi = (pesan) => {
  const el = document.getElementById("notifikasi");
  el.textContent = pesan;
  el.style.color = "green";
  setTimeout(() => {
    el.textContent = "";
  }, 4000);
};

// Ambil Data Bahan Baku
const loadDataBahan = async () => {
  const response = await fetch("/api/bahan-baku");
  const data = await response.json();
  const tableBody = document.querySelector("#tabel-bahan tbody");
  tableBody.innerHTML = "";

  data
    .filter((item) => item.stok_saat_ini > 0)
    .forEach((item) => {
      const row = `
        <tr>
          <td>${item.id}</td>
          <td>${item.nama}</td>
          <td>${item.satuan}</td>
          <td>${item.stok_awal}</td>
          <td>${item.stok_saat_ini}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
};

// Ambil Data Histori Stok
const loadHistoriStok = async () => {
  const response = await fetch("/api/histori-stok");
  const data = await response.json();
  const tableBody = document.querySelector("#tabel-histori tbody");
  tableBody.innerHTML = "";

  data.forEach((item) => {
    const row = `
      <tr>
        <td>${item.id_bahan_baku}</td>
        <td>${item.nama || '-'}</td>
        <td>${item.stok_awal}</td>
        <td>${item.stok_akhir}</td>
        <td>${item.perubahan > 0 ? '+' + item.perubahan : item.perubahan}</td>
        <td>${new Date(item.tanggal).toLocaleString()}</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
};

// Tambah Bahan Baku atau Tambah Stok
const formTambah = document.querySelector("#form-bahan");
formTambah.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dropdownValue = document.getElementById("dropdown-bahan").value;
  const stok_awal = parseInt(document.getElementById("stok_awal").value);

  if (isNaN(stok_awal) || stok_awal <= 0) {
    alert("Masukkan jumlah stok yang valid.");
    return;
  }

  try {
    if (dropdownValue === "__new") {
      const nama = document.getElementById("nama").value.trim();
      const satuan = document.getElementById("satuan").value.trim();

      if (!nama || !satuan) {
        alert("Nama dan satuan harus diisi.");
        return;
      }

      const response = await fetch("/api/bahan-baku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, satuan, stok_awal }),
      });

      const result = await response.json();
      tampilkanNotifikasi(result.message || "Bahan baru berhasil ditambahkan.");
    } else {
      const response = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_bahan_baku: parseInt(dropdownValue),
          jenis_transaksi: "masuk",
          jumlah: stok_awal,
        }),
      });

      const result = await response.json();
      tampilkanNotifikasi(result.message || "Stok berhasil ditambahkan.");
    }

    formTambah.reset();
    document.getElementById("nama").style.display = "none";
    document.getElementById("satuan").style.display = "none";
    loadDataBahan();
    loadHistoriStok();
    isiDropdownBahan();
    isiDropdownBahanBaru();
  } catch (error) {
    console.error("Gagal menambahkan stok:", error);
    alert("Terjadi kesalahan saat menambahkan stok.");
  }
});

// Kurangi Stok Bahan Baku
const formKurangi = document.getElementById("form-kurangi");
formKurangi.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id_bahan_baku = document.getElementById("bahan-select").value;
  const jumlah = parseInt(document.getElementById("jumlah-kurang").value);

  if (!id_bahan_baku || isNaN(jumlah) || jumlah <= 0) {
    alert("Pilih bahan dan masukkan jumlah yang valid");
    return;
  }

  const konfirmasi = confirm("Apakah Anda yakin ingin mengurangi stok?");
  if (!konfirmasi) return;

  try {
    const response = await fetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_bahan_baku: parseInt(id_bahan_baku),
        jenis_transaksi: "keluar",
        jumlah,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Transaksi gagal diproses.");
      return;
    }

    tampilkanNotifikasi(result.message || "Stok berhasil dikurangi.");
    formKurangi.reset();
    loadDataBahan();
    loadHistoriStok();
    isiDropdownBahan();
    isiDropdownBahanBaru();
  } catch (err) {
    console.error("Gagal mengurangi stok:", err);
    alert("Terjadi kesalahan saat mengurangi stok");
  }
});

// Isi Dropdown Kurangi
const isiDropdownBahan = async () => {
  const response = await fetch("/api/bahan-baku");
  const data = await response.json();
  const dropdown = document.getElementById("bahan-select");
  dropdown.innerHTML = "";

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.nama} (${item.satuan})`;
    dropdown.appendChild(option);
  });
};

// Isi Dropdown Tambah
const isiDropdownBahanBaru = async () => {
  const response = await fetch("/api/bahan-baku");
  const data = await response.json();
  const dropdown = document.getElementById("dropdown-bahan");

  dropdown.innerHTML = '<option value="">-- Pilih Bahan --</option>';
  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.nama} (${item.satuan})`;
    dropdown.appendChild(option);
  });

  const optNew = document.createElement("option");
  optNew.value = "__new";
  optNew.textContent = "+ Bahan Baru";
  dropdown.appendChild(optNew);
};

// Tampilkan input nama dan satuan jika pilih "+ Bahan Baru"
document.getElementById("dropdown-bahan").addEventListener("change", (e) => {
  const isNew = e.target.value === "__new";
  document.getElementById("nama").style.display = isNew ? "block" : "none";
  document.getElementById("satuan").style.display = isNew ? "block" : "none";
});

// Inisialisasi awal
loadDataBahan();
loadHistoriStok();
isiDropdownBahan();
isiDropdownBahanBaru();
