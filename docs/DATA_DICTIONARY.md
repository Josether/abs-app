# Kamus Data - Automated Backup System (ABS)

## 1. Tabel USER

| Field | Tipe Data | Key | Null? | Keterangan |
|-------|-----------|-----|-------|------------|
| id | Integer | PK | No | Identifier unik untuk setiap user |
| username | String(64) | UK | No | Nama pengguna untuk login (harus unik) |
| password_hash | String(255) | - | No | Password terenkripsi menggunakan Argon2 |
| role | String(16) | - | No | Role pengguna (admin/viewer) |
| created_at | Datetime | - | No | Tanggal dan waktu pembuatan akun |

---

## 2. Tabel DEVICE

| Field | Tipe Data | Key | Null? | Keterangan |
|-------|-----------|-----|-------|------------|
| id | Integer | PK | No | Identifier unik untuk setiap device |
| hostname | String(128) | - | No | Nama host perangkat jaringan |
| ip | String(64) | - | No | Alamat IP perangkat |
| vendor | String(64) | - | No | Vendor perangkat (Cisco, MikroTik, Juniper, dll) |
| protocol | String(16) | - | No | Protokol koneksi (SSH/Telnet) |
| port | Integer | - | No | Port untuk koneksi (default: 22 untuk SSH) |
| username_enc | Text | - | No | Username terenkripsi untuk akses device |
| password_enc | Text | - | No | Password terenkripsi menggunakan Fernet |
| secret_enc | Text | - | Yes | Enable secret terenkripsi (opsional) |
| tags | String(256) | - | Yes | Tag untuk kategorisasi device (comma-separated) |
| enabled | Boolean | - | No | Status aktif device (true/false) |

---

## 3. Tabel JOB

| Field | Tipe Data | Key | Null? | Keterangan |
|-------|-----------|-----|-------|------------|
| id | Integer | PK | No | Identifier unik untuk setiap job |
| triggered_by | String(64) | - | No | Sumber trigger (manual atau schedule:NamaSchedule) |
| status | String(16) | - | No | Status job (running/success/failed/queued) |
| started_at | Datetime | - | No | Waktu mulai eksekusi job |
| finished_at | Datetime | - | Yes | Waktu selesai eksekusi job |
| devices | Integer | - | No | Jumlah device yang diproses dalam job |
| log | Text | - | Yes | Log eksekusi job untuk debugging |

---

## 4. Tabel BACKUP

| Field | Tipe Data | Key | Null? | Keterangan |
|-------|-----------|-----|-------|------------|
| id | Integer | PK | No | Identifier unik untuk setiap backup |
| device_id | Integer | FK | No | Foreign key ke tabel DEVICE |
| timestamp | Datetime | - | No | Waktu backup dilakukan |
| size_bytes | Integer | - | No | Ukuran file backup dalam bytes |
| hash | String(64) | - | No | Hash SHA256 untuk verifikasi integritas file |
| status | String(16) | - | No | Status backup (success/failed) |
| path | String(512) | - | No | Path lokasi file backup di file system |

---

## 5. Tabel SCHEDULE

| Field | Tipe Data | Key | Null? | Keterangan |
|-------|-----------|-----|-------|------------|
| id | Integer | PK | No | Identifier unik untuk setiap schedule |
| name | String(128) | UK | No | Nama schedule (harus unik) |
| interval_days | Integer | - | No | Interval backup dalam hari (misal: 7 = weekly) |
| run_at | String(5) | - | No | Waktu eksekusi dalam format HH:MM (misal: 02:00) |
| target_type | String(32) | - | No | Tipe target (All/Tag/Devices) |
| target_tags | String(256) | - | Yes | Tag target jika target_type = Tag (comma-separated) |
| retention | Integer | - | No | Jumlah backup yang disimpan sebelum dihapus |
| notify_on_fail | Boolean | - | No | Flag notifikasi jika backup gagal |
| enabled | Boolean | - | No | Status aktif schedule (true/false) |

---

## 6. Tabel AUDIT

| Field | Tipe Data | Key | Null? | Keterangan |
|-------|-----------|-----|-------|------------|
| id | Integer | PK | No | Identifier unik untuk setiap log audit |
| timestamp | Datetime | - | No | Waktu kejadian yang dicatat |
| user | String(64) | - | No | Username yang melakukan aksi atau 'system' |
| action | String(64) | - | No | Jenis aksi (login, device_create, job_run, dll) |
| target | String(256) | - | No | Target dari aksi (nama device, user, schedule, dll) |
| result | String(16) | - | No | Hasil aksi (success/failed atau pesan error) |

---

## Keterangan Umum

**Key Types:**
- **PK (Primary Key)**: Kunci utama yang unik untuk setiap record
- **FK (Foreign Key)**: Kunci yang mereferensikan primary key tabel lain
- **UK (Unique Key)**: Field yang harus memiliki nilai unik

**Null?:**
- **No**: Field wajib diisi (NOT NULL)
- **Yes**: Field boleh kosong (NULL)

**Enkripsi:**
- Password user menggunakan **Argon2** (one-way hash)
- Kredensial device menggunakan **Fernet** (symmetric encryption)
- Secret key diambil dari environment variable `SECRET_KEY`
