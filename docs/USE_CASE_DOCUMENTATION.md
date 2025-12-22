# Use Case Diagram - ABS (Automated Backup System)

## Actors (Pelaku)

### 1. Admin (Administrator)
**Deskripsi:** Pengguna dengan hak akses penuh untuk mengelola seluruh sistem.
**Karakteristik:**
- Dapat melakukan semua operasi CRUD (Create, Read, Update, Delete)
- Memiliki akses ke semua fitur sistem
- Bertanggung jawab atas konfigurasi dan pemeliharaan sistem

### 2. Viewer (Pengamat)
**Deskripsi:** Pengguna dengan hak akses read-only untuk monitoring.
**Karakteristik:**
- Hanya dapat melihat data (tidak dapat memodifikasi)
- Dapat mengunduh backup files
- Dapat melakukan test koneksi perangkat
- Cocok untuk auditor atau staff monitoring

### 3. System/Scheduler (Sistem Otomatis)
**Deskripsi:** Komponen sistem yang menjalankan tugas terjadwal secara otomatis.
**Karakteristik:**
- Menjalankan backup berdasarkan jadwal yang telah dikonfigurasi
- Tidak memerlukan interaksi manusia
- Menggunakan APScheduler untuk eksekusi periodik

---

## Use Cases (Kasus Penggunaan)

### 🔐 Authentication (Autentikasi)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC1 | Login | Admin, Viewer | Masuk ke sistem menggunakan username & password, mendapatkan JWT token |
| UC2 | View Profile | Admin, Viewer | Melihat informasi profil pengguna yang sedang login (username, role) |
| UC3 | Logout | Admin, Viewer | Keluar dari sistem (hapus token dari localStorage) |

---

### 🖥️ Device Management (Manajemen Perangkat)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC4 | View Devices | Admin, Viewer | Melihat daftar semua perangkat jaringan yang terdaftar |
| UC5 | Add Device | Admin | Menambahkan perangkat baru (hostname, IP, vendor, kredensial terenkripsi, tags) |
| UC6 | Edit Device | Admin | Mengubah konfigurasi perangkat yang sudah ada |
| UC7 | Delete Device | Admin | Menghapus perangkat dari sistem |
| UC8 | Test Device Connection | Admin, Viewer | Melakukan test koneksi SSH/Telnet ke perangkat untuk validasi kredensial |
| UC9 | Enable/Disable Device | Admin | Mengaktifkan atau menonaktifkan perangkat (device yang disabled tidak akan di-backup) |
| UC10 | View Available Tags | Admin, Viewer | Melihat daftar tag unik yang digunakan di semua perangkat |

**Business Rules:**
- Kredensial perangkat disimpan terenkripsi (Fernet encryption)
- Device yang disabled tidak akan diikutsertakan dalam backup job
- Test connection menggunakan command "show version" untuk verifikasi

---

### 💾 Backup Management (Manajemen Backup)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC11 | Run Manual Backup | Admin | Menjalankan backup konfigurasi untuk semua perangkat enabled secara manual |
| UC12 | View Backup Jobs | Admin, Viewer | Melihat daftar job backup yang telah dijalankan (manual & scheduled) |
| UC13 | View Job Details & Logs | Admin, Viewer | Melihat detail job termasuk log eksekusi per device |
| UC14 | Cancel Running Job | Admin | Membatalkan job yang sedang berjalan (set status failed) |
| UC15 | Execute Scheduled Backup | System | Sistem menjalankan backup otomatis berdasarkan jadwal yang dikonfigurasi |

**Business Rules:**
- Job manual dibuat dengan triggered_by = "manual"
- Job scheduled dibuat dengan triggered_by = "schedule:<nama_schedule>"
- Delay 3 detik antar perangkat untuk rate limiting
- Job log mencatat semua aktivitas per device (sukses/gagal)
- Job hanya dapat di-cancel jika status = "running"

**Flow Backup Process:**
1. Create Job record (status = running)
2. Query devices dengan enabled = true
3. Filter devices (jika schedule menggunakan target_type Tag)
4. Decrypt kredensial per device
5. Koneksi SSH/Telnet → fetch running config
6. Simpan file ke `backups/` directory
7. Create Backup record (metadata: size, hash, path)
8. Update Job status = success/failed + log

---

### 📁 Backup Files (File Backup)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC16 | View Backup Files | Admin, Viewer | Melihat daftar semua file backup yang tersimpan |
| UC17 | Download Backup | Admin, Viewer | Mengunduh file konfigurasi backup (.cfg) |
| UC18 | Preview Backup Content | Admin, Viewer | Melihat preview isi file konfigurasi di browser |
| UC19 | Filter Backups by Device | Admin, Viewer | Filter backup berdasarkan device atau tanggal |

**Business Rules:**
- File backup disimpan dengan format: `<host>_<hash>.cfg`
- Hash menggunakan SHA256 (8 karakter pertama)
- Setiap download dicatat di audit log

---

### ⏰ Schedule Management (Manajemen Jadwal)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC20 | View Schedules | Admin, Viewer | Melihat daftar jadwal backup yang dikonfigurasi |
| UC21 | Create Schedule | Admin | Membuat jadwal backup baru (interval, waktu, target devices/tags) |
| UC22 | Edit Schedule | Admin | Mengubah konfigurasi jadwal yang sudah ada |
| UC23 | Delete Schedule | Admin | Menghapus jadwal backup |
| UC24 | Enable/Disable Schedule | Admin | Mengaktifkan/menonaktifkan jadwal tanpa menghapus |

**Business Rules:**
- Schedule menggunakan interval_days (misal: 7 = setiap 7 hari)
- Run_at format: "HH:MM" (contoh: "02:00" = jam 2 pagi)
- Target_type: "All" (semua device) atau "Tag" (filter by tags)
- Setiap perubahan schedule → reload APScheduler jobs
- Timezone menggunakan Asia/Jakarta

---

### 👥 User Management (Manajemen Pengguna)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC25 | View Users | Admin, Viewer | Melihat daftar semua pengguna sistem |
| UC26 | Create User | Admin | Membuat pengguna baru (username, password, role) |
| UC27 | Update User Role | Admin | Mengubah role pengguna (admin/viewer) |
| UC28 | Reset User Password | Admin | Mengubah password pengguna |
| UC29 | Delete User | Admin | Menghapus pengguna dari sistem |

**Business Rules:**
- Password di-hash menggunakan Argon2 (fallback: PBKDF2)
- Role: "admin" (full access) atau "viewer" (read-only)
- Tidak boleh menghapus/demote admin terakhir
- Default users: admin/admin123, viewer/viewer123

---

### 📊 Audit & Monitoring (Audit dan Monitoring)
| ID | Use Case | Actor | Deskripsi |
|----|----------|-------|-----------|
| UC30 | View Audit Logs | Admin | Melihat semua log aktivitas sistem (login, CRUD, backup) |
| UC31 | Filter Audit Events | Admin | Filter audit log berdasarkan user, action, atau tanggal |
| UC32 | View Dashboard Statistics | Admin, Viewer | Melihat ringkasan status sistem (jumlah device, job, backup terakhir) |

**Business Rules:**
- Setiap aksi penting dicatat: login, create/update/delete (device/user/schedule), job run, download backup
- Audit log tidak dapat dihapus (audit trail permanen)
- Format: timestamp, user, action, target, result

**Events yang di-audit:**
- auth_login (success/failed)
- device_create, device_update, device_delete, device_test
- job_run_manual, job_run_scheduled, job_cancel
- backup_download
- user_create, user_update, user_delete
- schedule_create, schedule_update, schedule_delete

---

## Use Case Dependencies (Ketergantungan)

### Include Relationships:
- **UC11 (Run Manual Backup)** includes **UC4 (View Devices)** → harus ambil daftar perangkat enabled
- **UC15 (Execute Scheduled Backup)** includes **UC4 (View Devices)** → sama seperti manual
- **UC21 (Create Schedule)** uses **UC10 (View Available Tags)** → untuk memilih target tags
- **UC22 (Edit Schedule)** uses **UC10 (View Available Tags)** → sama seperti create

### Create Relationships:
- **UC11, UC15** creates **UC12 (View Backup Jobs)** → setiap backup membuat job record
- **UC11, UC15** creates **UC16 (View Backup Files)** → setiap sukses membuat file backup

### Trigger Relationships:
- **UC5 (Add Device)** dapat trigger **UC8 (Test Connection)** → validasi setelah tambah
- **UC6 (Edit Device)** dapat trigger **UC8 (Test Connection)** → validasi setelah edit

---

## Access Control Matrix

| Use Case | Admin | Viewer | System |
|----------|-------|--------|--------|
| **Authentication** | ✅ | ✅ | - |
| **View Devices** | ✅ | ✅ | - |
| **Add/Edit/Delete Device** | ✅ | ❌ | - |
| **Test Connection** | ✅ | ✅ | - |
| **Enable/Disable Device** | ✅ | ❌ | - |
| **Run Manual Backup** | ✅ | ❌ | - |
| **View Jobs & Logs** | ✅ | ✅ | - |
| **Cancel Job** | ✅ | ❌ | - |
| **Execute Scheduled Backup** | - | - | ✅ |
| **View/Download Backups** | ✅ | ✅ | - |
| **Manage Schedules** | ✅ | ❌ | - |
| **View Schedules** | ✅ | ✅ | - |
| **Manage Users** | ✅ | ❌ | - |
| **View Users** | ✅ | ✅ | - |
| **View Audit Logs** | ✅ | ❌ | - |
| **View Dashboard** | ✅ | ✅ | - |

---

## Typical User Workflows

### Admin Workflow (Complete Setup):
1. **Login** (UC1)
2. **Add Devices** (UC5) → Test Connection (UC8)
3. **Create Schedule** (UC21) → Set interval & target tags
4. **Enable Schedule** (UC24)
5. **Run Manual Backup** (UC11) untuk test awal
6. **View Job Logs** (UC13) untuk verifikasi
7. **Download Backup** (UC17) untuk inspeksi
8. **Create Viewer User** (UC26) untuk tim monitoring
9. **View Audit Logs** (UC30) untuk tracking

### Viewer Workflow (Monitoring):
1. **Login** (UC1)
2. **View Dashboard** (UC32) untuk overview
3. **View Devices** (UC4) untuk status
4. **View Jobs** (UC12) untuk progress
5. **View Backups** (UC16) untuk history
6. **Download Backup** (UC17) jika perlu analisis
7. **Test Device Connection** (UC8) jika troubleshooting

### System Workflow (Automated):
1. Scheduler trigger berdasarkan waktu (interval_days + run_at)
2. **Execute Scheduled Backup** (UC15)
   - Query devices (filter by target_type)
   - Connect & fetch config per device
   - Save files + metadata
   - Update job log
3. Repeat next schedule

---

## Non-Functional Requirements (Captured in Use Cases)

### Security:
- Semua operasi write (create/update/delete) memerlukan role admin
- JWT token untuk autentikasi (expire 8 jam default)
- Password hashing (Argon2)
- Credential encryption (Fernet)
- Audit trail untuk akuntabilitas

### Performance:
- Rate limiting backup: 3 detik delay antar device
- Job queue untuk mencegah concurrent backup

### Reliability:
- Error handling per device (1 gagal tidak stop job)
- Log detail untuk troubleshooting
- Test connection sebelum production backup

### Usability:
- Preview backup sebelum download
- Filter & search di semua list view
- Real-time job status (auto-refresh 5 detik)

---

## Diagram Legends

**Warna/Kategori:**
- 🔵 **Admin Only** (UC5, UC7, UC9, UC11, UC14, UC21-29, UC30-31)
- 🟣 **Viewer Accessible** (UC1-4, UC8, UC10, UC12-13, UC16-20, UC25, UC32)
- 🟠 **System Automated** (UC15)

**Notasi:**
- `-->` : Actor melakukan use case
- `-.->` : Dependency (includes/extends/creates/triggers)

---

*Dokumen ini melengkapi use case diagram `usecase-diagram.mmd` dengan penjelasan detail setiap use case.*
