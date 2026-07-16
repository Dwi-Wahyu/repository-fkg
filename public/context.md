saya ingin menerapkan kontrol akses dokumen dengan model **"Metadata Terbuka, File Tertutup"** berbasis **Whitelist IP Statis**.

**Tujuan:**
Buat alur logika di untuk membatasi akses file PDF. Publik hanya boleh melihat metadata, sedangkan akses file PDF utuh hanya diizinkan untuk beberapa IP statis tertentu yang sudah dikonfigurasi.

**Aturan Logika (Business Logic):**

1. **Pengecekan Akses:**

- Buat sebuah mekanisme (bisa berupa _middleware_ atau fungsi utilitas) yang memeriksa IP dari setiap _request_ yang masuk ke _endpoint_ unduh/baca dokumen.
- Siapkan daftar Whitelist IP statis (misalnya: `192.168.1.50`, `10.0.0.5`).
- Jika IP _client_ **TIDAK ADA** di dalam daftar Whitelist: Tolak akses ke file PDF (kembalikan status 403 Forbidden).
- Jika IP _client_ **ADA** di dalam daftar Whitelist: Izinkan _streaming_ atau pengunduhan file PDF.

2. **Penanganan IP di Belakang Proxy:**

- Pastikan fungsi pengecekan IP membaca _header_ yang tepat (seperti `X-Forwarded-For` atau `X-Real-IP`) jika aplikasi berjalan di belakang _Reverse Proxy_ (seperti Nginx atau Cloudflare).

3. **Penyesuaian UI:**

- Section baru di landing page untuk mencari dokumen dengan filter jenis dokumen dan program studi (gunakan select componen)
- Di halaman detail dokumen, tambahkan logika kondisional (_conditional rendering_) untuk tombol "Baca/Unduh Dokumen".
- Jika status akses ditolak (berdasarkan respons API atau _state_ IP awal): Ubah tombol menjadi _disabled_ dan tampilkan teks: _"Akses Terbatas: Dokumen utuh hanya dapat diakses melalui komputer internal Fakultas."_
- Tampilkan metadata (Judul, Penulis, Abstrak opsional) secara publik terlepas dari status IP.

saya berencana untuk menyimpannya di dalam _Environment Variables_ (`.env`) bernilai contoh: WHITELIST_IP_ACCESS="192.168.1.75"
