# Blackbox Testing - Automated Backup System (ABS)

## 1. Pengujian Modul Autentikasi

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|-----------------|---------------|--------|
| 1.1 | Login dengan kredensial valid | User memasukkan username "admin" dan password yang benar | Login berhasil, redirect ke dashboard, token tersimpan | Login berhasil, redirect ke dashboard, token tersimpan | PASS |
| 1.2 | Login dengan username tidak valid | User memasukkan username yang tidak terdaftar | Muncul pesan error "Invalid credentials" | Tidak ada pesan error, form tetap di halaman login | FAIL |
| 1.3 | Login dengan password salah | User memasukkan username benar tapi password salah | Muncul pesan error "Invalid credentials" | Tidak ada pesan error, form tetap di halaman login | FAIL |
| 1.4 | Login dengan field kosong | User submit form tanpa mengisi username/password | Muncul validasi form "Field required" | Muncul validasi form "Field required" | PASS |
| 1.5 | Akses halaman protected tanpa login | User mencoba akses /dashboard tanpa token | Redirect ke halaman login | Redirect ke halaman login | PASS |
| 1.6 | Logout dari sistem | User klik tombol logout | Token dihapus, redirect ke login | Token dihapus, redirect ke login | PASS |

---

## 2. Pengujian Modul Manajemen Device

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 2.1 | Menampilkan daftar device | User membuka halaman Devices | Tampil tabel berisi semua device dengan kolom hostname, IP, vendor, status | Tampil tabel berisi semua device dengan kolom hostname, IP, vendor, status | PASS |
| 2.2 | Tambah device baru dengan data lengkap | User klik "Add Device", isi form (hostname, IP, vendor, protocol, credentials), submit | Device baru muncul di tabel, muncul notifikasi "Device created successfully" | Device baru muncul di tabel, muncul notifikasi "Device created successfully" | PASS |
| 2.3 | Tambah device dengan field wajib kosong | User submit form add device tanpa mengisi hostname | Muncul validasi "Hostname is required" | Muncul validasi "Hostname is required" | PASS |
| 2.4 | Edit device yang sudah ada | User klik "Edit" pada device, ubah hostname, submit | Hostname device terupdate di tabel, muncul notifikasi "Device updated" | Hostname device terupdate di tabel, muncul notifikasi "Device updated" | PASS |
| 2.5 | Hapus device | User klik "Delete" pada device, konfirmasi hapus | Device hilang dari tabel, muncul notifikasi "Device deleted" | Device hilang dari tabel, muncul notifikasi "Device deleted" | PASS |
| 2.6 | Test connection device (berhasil) | User klik "Test Connection" pada device dengan kredensial benar | Muncul badge hijau "Connected" atau notifikasi "Connection successful" | Muncul badge hijau "Connected" atau notifikasi "Connection successful" | PASS |
| 2.7 | Test connection device (gagal) | User klik "Test Connection" pada device dengan kredensial salah | Muncul badge merah "Failed" atau notifikasi "Connection failed" | Muncul badge merah "Failed" atau notifikasi "Connection failed" | PASS |
| 2.8 | Filter device berdasarkan vendor | User gunakan filter untuk menampilkan hanya device Cisco | Tabel hanya menampilkan device dengan vendor Cisco | Tabel hanya menampilkan device dengan vendor Cisco | PASS |

---

## 3. Pengujian Modul Manajemen Schedule

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 3.1 | Menampilkan daftar schedule | User membuka halaman Schedules | Tampil tabel berisi semua schedule dengan nama, interval, waktu, status | Tampil tabel berisi semua schedule dengan nama, interval, waktu, status | PASS |
| 3.2 | Buat schedule baru | User klik "Create Schedule", isi form (nama, interval_days, run_at, target), submit | Schedule baru muncul di tabel, muncul notifikasi "Schedule created" | Schedule baru muncul di tabel, muncul notifikasi "Schedule created" | PASS |
| 3.3 | Buat schedule dengan nama duplikat | User buat schedule dengan nama yang sudah ada | Muncul error "Schedule name already exists" | Muncul error "Schedule name already exists" | PASS |
| 3.4 | Edit schedule | User klik "Edit" pada schedule, ubah interval dari 7 ke 14 hari, submit | Interval schedule terupdate, muncul notifikasi "Schedule updated" | Interval schedule terupdate, muncul notifikasi "Schedule updated" | PASS |
| 3.5 | Hapus schedule | User klik "Delete" pada schedule, konfirmasi | Schedule hilang dari tabel, job scheduler dihapus | Schedule hilang dari tabel, job scheduler dihapus | PASS |
| 3.6 | Enable/disable schedule | User klik toggle switch pada schedule | Status berubah (enabled/disabled), toggle terupdate | Status berubah (enabled/disabled), toggle terupdate | PASS |
| 3.7 | Schedule dengan target "All Devices" | User buat schedule dengan target_type = "All" | Schedule akan backup semua device yang enabled | Schedule akan backup semua device yang enabled | PASS |
| 3.8 | Schedule dengan target berdasarkan tag | User buat schedule dengan target_type = "Tag", tag = "production" | Schedule hanya backup device dengan tag "production" | Schedule hanya backup device dengan tag "production" | PASS |

---

## 4. Pengujian Modul Backup Operations

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 4.1 | Menampilkan daftar job | User membuka halaman Jobs | Tampil tabel berisi job dengan status, waktu mulai, waktu selesai, devices | Tampil tabel berisi job dengan status, waktu mulai, waktu selesai, devices | PASS |
| 4.2 | Eksekusi backup manual | User klik "Run Manual Backup" | Job dibuat dengan status "running", proses backup dimulai | Job dibuat dengan status "running", proses backup dimulai | PASS |
| 4.3 | Backup berhasil untuk device aktif | Manual backup dijalankan, device dalam kondisi normal | Status job berubah "success", file backup tersimpan, muncul di tabel Backups | Status job berubah "success", file backup tersimpan, muncul di tabel Backups | PASS |
| 4.4 | Backup gagal karena device offline | Backup dijalankan pada device yang offline/tidak terhubung | Status job "failed", log mencatat error connection | Status job "failed", log mencatat error connection | PASS |
| 4.5 | Menampilkan daftar backup | User membuka halaman Backups | Tampil tabel berisi backup dengan device, timestamp, size, status | Tampil tabel berisi backup dengan device, timestamp, size, status | PASS |
| 4.6 | Preview isi backup | User klik "Preview" pada backup tertentu | Modal muncul menampilkan isi konfigurasi device | Modal muncul menampilkan isi konfigurasi device | PASS |
| 4.7 | Download file backup | User klik "Download" pada backup | File konfigurasi terdownload ke lokal dengan format .txt/.cfg | File konfigurasi terdownload ke lokal dengan format .txt/.cfg | PASS |
| 4.8 | Filter backup berdasarkan device | User pilih device tertentu di filter | Tabel hanya menampilkan backup dari device yang dipilih | Tabel hanya menampilkan backup dari device yang dipilih | PASS |
| 4.9 | Backup terjadwal berjalan otomatis | Schedule aktif dengan waktu eksekusi tiba | Job otomatis dibuat dengan triggered_by="schedule:NamaSchedule", backup tereksekusi | Job otomatis dibuat dengan triggered_by="schedule:NamaSchedule", backup tereksekusi | PASS |

---

## 5. Pengujian Modul Manajemen User

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 5.1 | Menampilkan daftar user | Admin membuka halaman Users | Tampil tabel berisi semua user dengan username, role, created_at | Tampil tabel berisi semua user dengan username, role, created_at | PASS |
| 5.2 | Tambah user baru | Admin klik "Add User", isi username, password, role, submit | User baru muncul di tabel, password ter-hash dengan Argon2 | User baru muncul di tabel, password ter-hash dengan Argon2 | PASS |
| 5.3 | Tambah user dengan username duplikat | Admin buat user dengan username yang sudah ada | Muncul error "Username already exists" | Muncul error "Username already exists" | PASS |
| 5.4 | Edit user (ubah role) | Admin klik "Edit" pada user, ubah role dari "viewer" ke "admin" | Role user terupdate, perubahan tercatat di audit | Role user terupdate, perubahan tercatat di audit | PASS |
| 5.5 | Hapus user | Admin klik "Delete" pada user, konfirmasi | User hilang dari tabel, muncul notifikasi "User deleted" | User hilang dari tabel, muncul notifikasi "User deleted" | PASS |
| 5.6 | Reset password user | Admin klik "Reset Password", masukkan password baru | Password user terupdate, user bisa login dengan password baru | Password user terupdate, user bisa login dengan password baru | PASS |
| 5.7 | User dengan role "viewer" akses fitur admin | User dengan role "viewer" coba tambah/edit/hapus data | Muncul error "Forbidden" atau aksi ditolak | Muncul error "Forbidden" atau aksi ditolak | PASS |

---

## 6. Pengujian Modul Audit Logs

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 6.1 | Menampilkan daftar audit log | User membuka halaman Audit Logs | Tampil tabel berisi log dengan timestamp, user, action, target, result | Tampil tabel berisi log dengan timestamp, user, action, target, result | PASS |
| 6.2 | Audit log untuk login berhasil | User berhasil login | Audit log tercatat dengan action="login_success", result="success" | Audit log tercatat dengan action="login_success", result="success" | PASS |
| 6.3 | Audit log untuk login gagal | User gagal login | Audit log tercatat dengan action="login_failed", result="failed" | Audit log tercatat dengan action="login_failed", result="failed" | PASS |
| 6.4 | Audit log untuk device_create | User membuat device baru | Audit log tercatat dengan action="device_create", target=nama_device | Audit log tercatat dengan action="device_create", target=nama_device | PASS |
| 6.5 | Audit log untuk schedule_update | User mengupdate schedule | Audit log tercatat dengan action="schedule_update", target=nama_schedule | Audit log tercatat dengan action="schedule_update", target=nama_schedule | PASS |
| 6.6 | Filter audit log berdasarkan user | User gunakan filter untuk melihat log dari user tertentu | Tabel hanya menampilkan log dari user yang dipilih | Tabel hanya menampilkan log dari user yang dipilih | PASS |
| 6.7 | Filter audit log berdasarkan action | User filter berdasarkan action "device_delete" | Tabel hanya menampilkan log dengan action device_delete | Tabel hanya menampilkan log dengan action device_delete | PASS |
| 6.8 | Filter audit log berdasarkan tanggal | User pilih range tanggal tertentu | Tabel menampilkan log dalam range tanggal tersebut | Tabel menampilkan log dalam range tanggal tersebut | PASS |
| 6.9 | View detail log | User klik pada row audit log | Muncul detail lengkap log (timestamp, user, action, target, result) | Muncul detail lengkap log (timestamp, user, action, target, result) | PASS |

---

## 7. Pengujian Modul Dashboard

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 7.1 | Menampilkan statistik dashboard | User membuka dashboard | Tampil card dengan total devices, total jobs, total backups, recent activities | Tampil card dengan total devices, total jobs, total backups, recent activities | PASS |
| 7.2 | Statistik device count | Dashboard menghitung jumlah device | Angka sesuai dengan jumlah device di database | Angka sesuai dengan jumlah device di database | PASS |
| 7.3 | Statistik job summary | Dashboard menampilkan ringkasan job (success/failed/running) | Tampil breakdown job berdasarkan status | Tampil breakdown job berdasarkan status | PASS |
| 7.4 | Recent activities | Dashboard menampilkan aktivitas terbaru | Tampil 5-10 audit log terbaru dengan timestamp DESC | Tampil 5-10 audit log terbaru dengan timestamp DESC | PASS |

---

## 8. Pengujian Keamanan

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 8.1 | Enkripsi kredensial device | Device credentials disimpan ke database | Kredensial tersimpan dalam bentuk terenkripsi (Fernet) | Kredensial tersimpan dalam bentuk terenkripsi (Fernet) | PASS |
| 8.2 | Dekripsi kredensial untuk koneksi | Sistem perlu koneksi ke device | Kredensial didekripsi dengan benar untuk autentikasi | Kredensial didekripsi dengan benar untuk autentikasi | PASS |
| 8.3 | Password hashing user | User baru dibuat dengan password | Password ter-hash menggunakan Argon2, tidak plaintext | Password ter-hash menggunakan Argon2, tidak plaintext | PASS |
| 8.4 | JWT token expiration | Token sudah expired (>8 jam) | Request dengan token expired ditolak, user harus login ulang | Request dengan token expired ditolak, user harus login ulang | PASS |
| 8.5 | SQL Injection prevention | User input karakter SQL special (', --, OR) di form | Input di-escape/sanitize, tidak execute query berbahaya | Input di-escape/sanitize, tidak execute query berbahaya | PASS |

---

## 9. Pengujian Multi-Vendor Device

| No. | Test Case | Skenario | Expected Output | Actual Output | Status |
|-----|-----------|----------|----------|-----------------|---------------|--------|
| 9.1 | Backup device Cisco IOS | Backup dijalankan pada Cisco IOS Router | Command "show running-config" berhasil, config tersimpan | Command "show running-config" berhasil, config tersimpan | PASS |
| 9.2 | Backup device MikroTik | Backup dijalankan pada MikroTik RouterOS | Command "/export" berhasil, config tersimpan | Command "/export" berhasil, config tersimpan | PASS |
| 9.3 | Backup device Juniper | Backup dijalankan pada Juniper JunOS | Command "show configuration" berhasil, config tersimpan | Command "show configuration" berhasil, config tersimpan | PASS |
| 9.4 | Backup device Fortinet | Backup dijalankan pada FortiGate | Command "show" berhasil, config tersimpan | Command "show" berhasil, config tersimpan | PASS |
| 9.5 | Backup device Huawei | Backup dijalankan pada Huawei Switch | Command "display current-configuration" berhasil, config tersimpan | Command "display current-configuration" berhasil, config tersimpan | PASS |
| 9.6 | Koneksi SSH ke device | Device dengan protocol SSH, port 22 | Koneksi SSH berhasil menggunakan Netmiko | Koneksi SSH berhasil menggunakan Netmiko | PASS |
| 9.7 | Koneksi Telnet ke device | Device dengan protocol Telnet, port 23 | Koneksi Telnet berhasil menggunakan telnetlib | Koneksi Telnet berhasil menggunakan telnetlib | PASS |

---

## Ringkasan Hasil Testing

| Modul | Total Test Case | Passed | Failed | Pass Rate |
|-------|-----------------|--------|--------|-----------|
| Autentikasi | 6 | 4 | 2 | 66.7% |
| Manajemen Device | 8 | 8 | 0 | 100% |
| Manajemen Schedule | 8 | 8 | 0 | 100% |
| Backup Operations | 9 | 9 | 0 | 100% |
| Manajemen User | 7 | 7 | 0 | 100% |
| Audit Logs | 9 | 9 | 0 | 100% |
| Dashboard | 4 | 4 | 0 | 100% |
| Keamanan | 5 | 5 | 0 | 100% |
| Multi-Vendor Device | 7 | 7 | 0 | 100% |
| **TOTAL** | **63** | **61** | **2** | **96.8%** |

---

## Kesimpulan

Berdasarkan hasil pengujian blackbox yang telah dilakukan terhadap sistem Automated Backup System, dapat disimpulkan bahwa:

1. **Sebagian besar fitur utama berfungsi dengan baik** sesuai dengan requirement yang telah ditentukan
2. **Validasi input** bekerja dengan baik untuk mencegah data tidak valid masuk ke sistem
3. **Keamanan data** terjaga dengan baik melalui enkripsi kredensial (Fernet) dan password hashing (Argon2)
4. **Audit trail** mencatat semua aktivitas penting untuk keperluan monitoring dan troubleshooting
5. **Multi-vendor support** berhasil diimplementasikan dengan command yang sesuai untuk setiap vendor

### Bug yang Ditemukan

Terdapat **2 bug** pada modul autentikasi yang perlu diperbaiki:
- **Test Case 1.2 & 1.3**: Tidak ada pesan error yang ditampilkan ketika user memasukkan kredensial yang salah (username/password invalid)
- **Impact**: User tidak mendapat feedback yang jelas kenapa login gagal, mengurangi user experience

### Rekomendasi Perbaikan

Perlu ditambahkan error handling pada halaman login untuk menampilkan pesan error yang informatif ketika autentikasi gagal, misalnya:
- Menampilkan toast notification atau alert dengan pesan "Username atau password salah"
- Menampilkan pesan error di bawah form input
- Memberikan visual feedback (input border merah, icon warning, dll)

Dengan perbaikan tersebut, tingkat keberhasilan pengujian dapat mencapai **100%**.

**Status Saat Ini**: Tingkat keberhasilan pengujian **96.8%** (61 dari 63 test case PASS)
