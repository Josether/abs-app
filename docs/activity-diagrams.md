# Activity Diagrams - ABS Use Cases

## Activity Diagram 1: Login to System

```mermaid
flowchart TD
    Start([Start]) --> OpenLogin[Administrator membuka<br/>halaman login]
    OpenLogin --> ShowForm[Sistem menampilkan<br/>form login]
    ShowForm --> InputCred[Administrator memasukkan<br/>username dan password]
    InputCred --> Verify[Sistem memverifikasi<br/>kredensial]
    
    Verify --> CheckValid{Kredensial<br/>valid?}
    
    CheckValid -->|Ya| CreateToken[Sistem membuat<br/>JWT token]
    CreateToken --> ShowDashboard[Sistem menampilkan<br/>dashboard]
    ShowDashboard --> End([End])
    
    CheckValid -->|Tidak| ShowError[Sistem menampilkan<br/>pesan kesalahan]
    ShowError --> RetryPrompt[Sistem meminta<br/>input ulang]
    RetryPrompt --> InputCred
```

---

## Activity Diagram 2: Monitor System Activity

```mermaid
flowchart TD
    Start([Start]) --> OpenDashboard[Administrator membuka<br/>menu Dashboard]
    OpenDashboard --> FetchData[Sistem mengambil data<br/>aktivitas dari database]
    FetchData --> ShowSummary[Sistem menampilkan status<br/>perangkat, job, dan backup]
    
    ShowSummary --> OpenAudit[Administrator memilih<br/>menu Audit Logs]
    OpenAudit --> ShowLogs[Sistem menampilkan daftar<br/>log aktivitas]
    
    ShowLogs --> ApplyFilter[Administrator menerapkan<br/>filter tanggal/tipe/user]
    ApplyFilter --> ShowFiltered[Sistem menampilkan log<br/>sesuai filter]
    
    ShowFiltered --> SelectLog[Administrator memilih<br/>detail sebuah log]
    SelectLog --> ShowDetail[Sistem menampilkan<br/>informasi detail log]
    
    ShowDetail --> End([End])
```

---

## Activity Diagram 3: Perform Backup Operations

```mermaid
flowchart TD
    Start([Start]) --> OpenJobs[Administrator membuka<br/>menu Jobs]
    OpenJobs --> ShowJobStatus[Sistem menampilkan job status,<br/>history, dan opsi manual backup]
    
    ShowJobStatus --> SelectManual[Administrator memilih<br/>Run Manual Backup]
    SelectManual --> CreateJob[Sistem membuat job backup<br/>dan memulai eksekusi]
    
    CreateJob --> ConnectDevice[Sistem menghubungi perangkat<br/>menggunakan Netmiko]
    ConnectDevice --> FetchConfig[Sistem mengambil konfigurasi<br/>dan menyimpan ke database]
    
    FetchConfig --> OpenBackups[Administrator membuka<br/>menu Backups]
    OpenBackups --> ShowBackupList[Sistem menampilkan list<br/>backup dengan detail]
    
    ShowBackupList --> Decision{Administrator<br/>memilih aksi?}
    
    Decision -->|Preview| PreviewBackup[Administrator memilih<br/>Preview Backup]
    PreviewBackup --> ShowPreview[Sistem menampilkan<br/>preview isi konfigurasi]
    ShowPreview --> End([End])
    
    Decision -->|Download| DownloadBackup[Administrator memilih<br/>Download Backup]
    DownloadBackup --> ProvideFile[Sistem menyediakan file<br/>konfigurasi untuk diunduh]
    ProvideFile --> End
```

---

## Activity Diagram 4: Manage Devices

```mermaid
flowchart TD
    Start([Start]) --> OpenDevices[Administrator membuka<br/>menu Devices]
    OpenDevices --> ShowDeviceList[Sistem menampilkan<br/>daftar perangkat]
    
    ShowDeviceList --> SelectAction{Administrator<br/>memilih aksi?}
    
    %% Add Device Flow
    SelectAction -->|Add Device| ClickAdd[Administrator memilih<br/>Add Device]
    ClickAdd --> ShowAddForm[Sistem menampilkan<br/>form input perangkat]
    ShowAddForm --> FillAdd[Administrator mengisi<br/>form input perangkat]
    FillAdd --> SaveAdd[Sistem menyimpan data<br/>perangkat ke database]
    SaveAdd --> End([End])
    
    %% Edit Device Flow
    SelectAction -->|Edit Device| ClickEdit[Administrator memilih<br/>Edit Device]
    ClickEdit --> ShowEditForm[Sistem menampilkan informasi<br/>perangkat untuk diedit]
    ShowEditForm --> UpdateDevice[Administrator memperbarui<br/>data perangkat]
    UpdateDevice --> SaveEdit[Sistem menyimpan<br/>perubahan]
    SaveEdit --> End
    
    %% Delete Device Flow
    SelectAction -->|Delete Device| ClickDelete[Administrator memilih<br/>Delete Device]
    ClickDelete --> DeleteDevice[Sistem menghapus perangkat<br/>dari database]
    DeleteDevice --> End
    
    %% Test Connection Flow
    SelectAction -->|Test Connection| ClickTest[Administrator memilih<br/>Test Connection]
    ClickTest --> TestConn[Sistem mencoba koneksi]
    TestConn --> ShowResult[Sistem menampilkan hasil<br/>berhasil/gagal]
    ShowResult --> End
```

---

## Activity Diagram 5: Manage Backup Schedules

```mermaid
flowchart TD
    Start([Start]) --> OpenSchedules[Administrator membuka<br/>menu Schedules]
    OpenSchedules --> ShowScheduleList[Sistem menampilkan<br/>daftar jadwal backup]
    
    ShowScheduleList --> SelectAction{Administrator<br/>memilih aksi?}
    
    %% Create Schedule Flow
    SelectAction -->|Create Schedule| ClickCreate[Administrator memilih<br/>Create Schedule]
    ClickCreate --> ShowCreateForm[Sistem menampilkan<br/>form pembuatan jadwal]
    ShowCreateForm --> FillSchedule[Administrator mengisi<br/>form input jadwal]
    FillSchedule --> SaveSchedule[Sistem menyimpan jadwal<br/>dan daftarkan ke APScheduler]
    SaveSchedule --> End([End])
    
    %% Edit Schedule Flow
    SelectAction -->|Edit Schedule| ClickEdit[Administrator memilih<br/>Edit Schedule]
    ClickEdit --> ShowEditForm[Sistem menampilkan informasi<br/>jadwal untuk diedit]
    ShowEditForm --> UpdateSchedule[Administrator memperbarui<br/>data jadwal]
    UpdateSchedule --> SaveEdit[Sistem menyimpan<br/>perubahan]
    SaveEdit --> End
    
    %% Delete Schedule Flow
    SelectAction -->|Delete Schedule| ClickDelete[Administrator memilih<br/>Delete Schedule]
    ClickDelete --> DeleteSchedule[Sistem menghapus jadwal dari<br/>database dan APScheduler]
    DeleteSchedule --> End
    
    %% Enable/Disable Flow
    SelectAction -->|Enable/Disable| ClickToggle[Administrator memilih<br/>Enable/Disable Schedule]
    ClickToggle --> ToggleSchedule[Sistem mengaktifkan atau<br/>menonaktifkan jadwal]
    ToggleSchedule --> End
```

---

## Activity Diagram 6: Manage Users

```mermaid
flowchart TD
    Start([Start]) --> OpenUsers[Administrator membuka<br/>menu Users]
    OpenUsers --> ShowUserList[Sistem menampilkan<br/>daftar user]
    
    ShowUserList --> SelectAction{Administrator<br/>memilih aksi?}
    
    %% Add User Flow
    SelectAction -->|Add User| ClickAdd[Administrator memilih<br/>Add User]
    ClickAdd --> ShowAddForm[Sistem menampilkan<br/>form input user]
    ShowAddForm --> FillUser[Administrator mengisi<br/>form input user]
    FillUser --> SaveUser[Sistem menyimpan user<br/>ke database]
    SaveUser --> End([End])
    
    %% Edit User Flow
    SelectAction -->|Edit User| ClickEdit[Administrator memilih<br/>Edit User]
    ClickEdit --> ShowEditForm[Sistem menampilkan informasi<br/>user untuk diedit]
    ShowEditForm --> UpdateUser[Administrator memperbarui<br/>data user]
    UpdateUser --> SaveEdit[Sistem menyimpan<br/>perubahan]
    SaveEdit --> End
    
    %% Delete User Flow
    SelectAction -->|Delete User| ClickDelete[Administrator memilih<br/>Delete User]
    ClickDelete --> DeleteUser[Sistem menghapus user<br/>dari database]
    DeleteUser --> End
    
    %% Reset Password Flow
    SelectAction -->|Reset Password| ClickReset[Administrator memilih<br/>Reset Password]
    ClickReset --> ResetPassword[Sistem membuat password baru<br/>atau membuka form reset]
    ResetPassword --> UpdatePassword[Sistem memperbarui data]
    UpdatePassword --> End
```

---

## Cara Menggunakan Diagram

File ini berisi activity diagram dalam format Mermaid untuk 6 use case utama sistem ABS:

1. **Login to System** - Proses autentikasi pengguna
2. **Monitor System Activity** - Monitoring dashboard dan audit logs
3. **Perform Backup Operations** - Eksekusi dan manajemen backup
4. **Manage Devices** - CRUD operations untuk perangkat jaringan
5. **Manage Backup Schedules** - Manajemen jadwal backup otomatis
6. **Manage Users** - Manajemen user dan roles

### Rendering Diagram

Untuk melihat diagram, Anda dapat:
- Menggunakan VS Code dengan extension Mermaid Preview
- Copy-paste ke Mermaid Live Editor: https://mermaid.live
- Render di dokumentasi Markdown yang support Mermaid (GitHub, GitLab, dll)
