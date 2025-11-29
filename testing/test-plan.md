# Test Plan

Using playwright to test the web application

## TODO

1. create venv in this directory and, create requirements.txt with playwright, and create gitignore to ignore venv
2. Create playwright script to test page load time and API response time for selected page, refer to laporan for reference (you can change the pages/endpoints if needed, but make it representative of the app)
3. Save the test result in csv format in testing/results directory with the following columns: Page/Endpoint, Load Time/Response Time (ms)
4. Create a python notebook to analyze the test result and plot the result using seaborn

### Notes

- port 3000 is used, so use port 3001 for testing (npx next start -p 3001)

## Laporan 

```md
5. ## Pengujian Sistem

   Pengujian dilakukan untuk memastikan sistem berjalan sesuai spesifikasi fungsional dan memenuhi standar performa yang diharapkan.

Pengujian mencakup dua aspek utama:

* Black Box Testing: Menguji fungsionalitas fitur tanpa melihat kode internal.  
  * Performance Testing: Mengukur waktu muat halaman dan respons API.

  Berikut adalah hasil pengujian fungsional terhadap fitur-fitur utama sistem:

**Tabel 6.1.**		Hasil Pengujian Fungsional

Belum Diuji \- Akan Diisi Setelah Pengujian Selesai

| No | Skenario Pengujian | Ekspektasi | Hasil  | Keterangan |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Login Admin Pusat | Masuk ke dashboard Admin Pusat | \[Pass/Fail\] |  |
| 2 | Login Node Admin | Masuk ke dashboard Node Admin | \[Pass/Fail\] |  |
| 3 | CRUD Node (Create) | Node baru berhasil ditambahkan | \[Pass/Fail\] |  |
| 4 | CRUD Item Instance | Stok barang bertambah di database | \[Pass/Fail\] |  |
| 5 | Generate QR Code | QR Code tampil dan dapat diunduh | \[Pass/Fail\] |  |
| 6 | Scan QR (Valid) | Data barang muncul sesuai QR | \[Pass/Fail\] |  |
| 7 | Scan QR (Invalid) | Muncul pesan error | \[Pass/Fail\] |  |
| 8 | Transaksi Pengiriman | Status barang berubah menjadi 'In Transit' | \[Pass/Fail\] |  |
| 9 | Transaksi Penerimaan | Status barang berubah menjadi 'Received' | \[Pass/Fail\] |  |

1. **Hasil Pengujian Performa**

   Pengujian performa dilakukan untuk mengukur responsivitas aplikasi. Data yang disajikan di bawah ini merupakan sampel representatif dari halaman dan endpoint API utama yang paling sering diakses oleh pengguna. Pengujian ini tidak mencakup seluruh halaman dan endpoint yang ada dalam sistem, namun cukup untuk menggambarkan kinerja sistem secara keseluruhan.

   **a. Waktu Muat Halaman (Page Load Time)**

   Pengujian dilakukan menggunakan browser developer tools dengan koneksi internet standar.

   

**Tabel 6.2.**		Hasil Pengujian Halaman

Belum Diuji \- Akan Diisi Setelah Pengujian Selesai

| Halaman | Ukuran Halaman (KB) | Load Time (ms) | Status |
| :---- | :---: | :---: | :---: |
| Login Page | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |
| Dashboard Admin Pusat | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |
| Daftar Item (Table) | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |
| QR Scanner Page | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |
| Halaman Manajemen User (Super Admin) | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |
| Halaman Manajemen Node (Super Admin) | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |
| Halaman Generate QR | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |

#### 

**a. Waktu Respons API (API Response Time)**  
Pengujian dilakukan menggunakan Postman atau log jaringan browser.

**Tabel 6.3.**		Hasil Pengujian API

#### **Belum Diuji \- Akan Diisi Setelah Pengujian Selesai**

| Endpoint API | Method | Response Time (ms) | Status |
| :---- | :---: | :---: | :---: |
| /api/auth/login | POST | \[Isi Data\] | \[OK/Slow\] |
| /api/item-instances | GET | \[Isi Data\] | \[OK/Slow\] |
| /api/item-transits | POST | \[Isi Data\] | \[OK/Slow\] |
| /api/nodes | GET | \[Isi Data\] | \[OK/Slow\] |
| /api/item-types | GET | \[Isi Data\] | \[OK/Slow\] |
| /api/qr | POST | \[Isi Data\] | \[OK/Slow\] |
| Halaman Generate QR | \[Isi Data\] | \[Isi Data\] | \[OK/Slow\] |

6. ## Analisis Hasil Pengujian

   \[Bagian ini akan diisi setelah data pengujian lengkap. Tuliskan analisis mengenai apakah sistem sudah memenuhi kebutuhan pengguna, kendala yang ditemukan selama pengujian, dan rekomendasi perbaikan.\]
```