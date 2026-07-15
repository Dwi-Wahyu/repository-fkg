Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

Perancangan Aplikasi Repository Skripsi Universitas
Amir Hamzah Berbasis Web

1Muhammad Aditya, 2 Surya Hendra Putra

1,2Politeknik Ganesha Medan
Medan, Indonesia

mhaditya1903@gmail.com

Diajukan
Diterima
Dipublikasi

: 08/09/2022
: 12/09/2022
: 12/09/2022

ABSTRAK
Saat  ini  telah  banyak  aplikasi  yang  bermunculan.  Pemanfaatan  Aplikasi  tersebut  sangat  luas
dalam  kehidupan  sehari-hari.  Di  Indonesia,  telah  banyak  institusi  yang  memanfaatkan  sistem
informasi pada bidang pendidikan, salah satunya adalah sistem informasi Repository. Repository
merupakan  istilah  perpustakaan  yang  berbasis  digital  dimana  sistem  informasi  ini  dapat
digunakan  untuk  mengakses  skripsi  mahasiswa,  baik civitas  akademika  maupun  para  akademisi
di luar kampus sebagai bahan referensi penulisan karya ilmiah. Meskipun demikan, belum semua
perguruan  tinggi  menggunakannya.  Salah  satunya  yaitu  Universitas  Amir  Hamzah.  Sebagai
perguruan  tinggi  yang  masih  menggunakan  sistem  pendataan  dan  pengarsipan  skripsi  secara
manual,  maka  sering  terjadi  kehilangan  data  atau  pencarian  data  yang  lambat.  Selain  itu
pemanfaatan  system  informasi  juga  belum  maksimal.  Penelitin  ini  bertujuan  untuk  untuk
merancang  aplikasi  Repository  skripsi  berbasis  web  pada  Universitas  Amir  Hamzah.  Metode
yang  digunakan  adalah  simulated  prototyping.  Hasil  penelitian  ini  menunjukkan  rancangan
purwarupa/prototype berupa aplikasi repository skripsi berbasis web sebanyak 7 (tujuh) halaman,
diantaranya  yaitu  halaman  login,  daftar  dosen,  form  entry  data  Dosen,  daftar  mahasiswa,  form
entry data mahasiswa, daftar repository, dan form entry data repository.

Kata Kunci: Aplikasi Repository, Universitas Amir Hamzah, Web

I. PENDAHULUAN

Seiring  berkembang  pesatnya  teknologi  informasi  dan  komunikasi,  perguruan  tinggi
negeri dan swasta semakin bersaing dalam mengembangkan sistem repository dalam pengarsipan
berkas  terutama  skripsi  alumni.  Sistem  informasi  repository  sangat  dibutuhkan,  untuk
meningkatkan  kemajuan  sebuah  perguruan  tinggi.  Pengarsipan  dan  pencarian  skripsi  dapat
dilakukan  lebih  cepat  dan  akurat.  Kekurangan  menggunakan  pengarsipan  secara  manual  sangat
banyak,  salah  satunya  admin  perpustakaan  akan  sulit  mencari  skripsi  yang  sudah  disusun  di
perpustakaan.

Perpustakaan  di  Amir  Hamzah  akan  melayani  kebutuhn  dosen,  mahasiswa
maupun karyawan yangmembutuhkan referensi ilmiah. Koleksi suatu perpustakaan di Amir
hamzah  tidak  hanya  terbatas  pada  buku-buku  teks  yang  diperlukan  untuk  menunjang  kegiatan
belajar  mengajar  saja,  tetapi  juga  buku-buku  dan  jurnal-jurnal  ilmiah  yang  diperlukan  untuk
menunjang penelitian para dosen dan mahasiswa. Demikian juga dengan koleksi skripsi hasil dari
Tugas akhir mahasiswa. Koleksi skripsi akan dikumpulkan di perpustakaan setelah disahkan oleh
para pembimbing, penguji dan pimpinan fakultas atau Prodi.

Saat  ini  Universitas  Amir  hamzah  dalam  mendata  dan  menyimpan  Skripsi  Mahasiswa
masih  secara  manual,  yaitu dengan datang  dan  mencari langsung  ke  perpustakaan.  Oleh  karena
itu,  masih  banyak  kendala  yang  terjadi  akibat  dari  penyimpanan  dan  pengolahan  data  secara
manual. Masalah tersebut, antara lain: Pencarian data yang dirasa sangat lambat dan memerlukan
waktu yang cukup lama, data yang dicari terkadang kurang akurat, Ketersediaan judul atau skripsi

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

589

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

kurang memadai. Dengan demikian maka diperlukan sebuah aplikasi yang dapat di akses secara
online,  kapanpun  dan  dimanapun.  Dengan  adanya  aplikasi  ini  akan  memudahkan  mahasiswa
dalam  mencari  referensi  dari  skripsi  alumni  serta.  memudahkan  admin  perpustakaan  dalam
mengarsip dan mendata skripsi alumni.

II. STUDI LITERATUR
Penelitian Terdahulu

Adapun penelitian sebelumnya yang di lakukan oleh  (Hidayat, 2017) dengan judul “ Sistem
Informasi  Repository  Skripsi  Pada  Fakultas  Ilmu  Komputer  Dan  Teknologi  Informasi
Universitas  Mulawarman”.  Hasil  penelitian  ini  dijelaskan  bahwa  dengan  adanya  system
repository  dalam  pendokumennan  dan  pendataan  skripsi  pada  universitas  mulawarman  sangat
membantu  manajamen  dalam  pengarsipan  dan  pendataan  skripsi.  Sedangkan  penelitian  lainnya
yang  di  lakukan  oleh  (Kharisma  et  al.,  2020)  dengan  judul  “Sistem  Informasi  Repositori
Skripsi  Berbasis  Web  Pada  Stmik  Syaikh  Zainuddin  Nw  Anjani”.  Aplikasi  yang  dibangun
dengan menggunakan Bahasa pemrograman PHP berbasis web, dan database sqlserver.

Pengertian Aplikasi

Aplikasi  adalah  program  siap  pakai  yang  dapat  digunakan  untuk  menjalankan  perintah  –
perintah  dari  pengguna  aplikasi  tersebut  dengan  tujuan  mendapatkan  hasil  yang  lebih  akurat
sesuai  dengan  tujuan  pembuatan  aplikasi  tersebut,  aplikasi  mempunya  arti  yaitu  pemecahan
masalah  yang  menggunakan  salah  satu  teknik  pemrosesan  data  aplikasi  yang  biasanya  berpacu
pada  sebuah  komputansi  yang  diinginkan  atau  diharapkan  maupun  pemrosesan  data  yang
diharapkan. Pengertian aplikasi secara umum adalah alat terapan yang difungsikan secara khusus
dan  terpadu  sesuai kemampuan  yang dimilikinya, aplikasi  merupakan  suatu  perangkat computer
yang siap pakai bagi user. (Widarma & Kumala, 2018)

Pengertian aplikasi menurut para ahli :

a.

b.

Pengertian  aplikasi  menurut  (Dewi  Teresia  &  Hermi,  2016)  adalah  penggunaan  dalam
suatu komputer, intruksi (instruction) atau pernyataan (statement) yang disusun sedemikian
sehingga komputer dapat memproses input menjadi output.
Pengertian aplikasi menurut Kamus Besar Bahasa Indonesia adalah penerapan dari rancang
system  untuk  mengolah  data  yang  menggunakan  aturan  atau  ketentuan  bahasa
pemrograman  tertentu.  Aplikasi  adalah  suatu  program  komputer  yang  dibuat  untuk
mengerjakan dan melaksanakan tugas khusus dari pengguna (Hendraputra, 2021).

c.  Menurut  Wikipedia,  aplikasi  adalah  suatu  subkelas  perangkat  lunak  komputer  yang
memanfaatkan  kemampuan  komputer  langsung  untuk  melakukan  suatu  tugas  yang
diinginkan pengguna.

Pengertian Repository

Menurut  (Jimi,  2019)  Istilah  Institutional  Repository  atau  “Simpanan  Kelembagaan”
merujuk ke sebuah kegiatan menghimpun dan melestarikan koleksi digital yang merupakan hasil
karya  intelektual  dari  sebuah  komunitas  tertentu.  Pendapat  lain  menyatakan  bahwa  perguruan
tinggi yang berbasis repository adalah satu set layanan yang menawarkan berbagai bahan digital
yang  di  hasilkan  oleh lembaga  tersebut  ataupun  yang  dihasilkan lembaga  lain  yang  dikelolanya
kepada masyarakat penggunanya.

Istilah  Repository  berkembang  seiring  munculnya  istilah  perpustakaan  digital  pada  awal
tahun  1990-an  yang  berujuk  pada  kegiatan  menghimpun  melestarikan  koleksi  digital  yang
merupakan hasil karya intelektual dari sebuah komunitas. Berawal dari kegiatan komunitas suatu

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

590

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

Universitas  Southampton  di  Inggris,  mengumpulkan  berbagai  hasil karya  secara lokal   terutama
dalam  bentuk  digital. Program  yang  menghimpun  database  untuk  pertama  kali  oleh  Eprint  yang
dikembangkan oleh Universitas tersebut.

Pengertian Website
Website  adalah  keseluruhan  halaman  –  halaman  web  yang  terdapat  dalam  sebuah  domain  yang
mengandung  informasi  (Saputra  &  Widjaja,  2019).  Website  adalah  kumpulan  dari  halaman-
halaman  situs,  yang  biasanya terangkum  dalam  sebuah domain  atau  subdomain  yang  tempatnya
berada didalam World Wide Web (WWW) di internet.  Sebuah halaman web adalah dokumen yang
ditulis  dalam  format  HTML  (Hyper  Text  Markup  Language),  yang  hampir  selalu  bisa  diakses
melalui  HTTP,  yaitu  protokol  yang  menyampaika  informasi  dari  server  website  untuk
ditampilkan  kepada  para  pemakai  melalui  web  browser.  Semua  publikasi  dari  website-website
tersebut dapat membentuk sebuah jaringan informasi yang sangat besar.

Halaman-halaman  dari  website  akan  diakses  melalui  sebuah  URL  yang  biasa  disebut
homepage.  URL  ini  mengatur  halaman-halaman  situs  untuk  menjadi  sebuah  hirarki,  meskipun
hyperlink-hyperlink  yang  ada  dihalaman  tersebut  mengatur  para  pembaca    dan  memberitahu
mereka  susunan  keseluruhan  dan  bagaimana  arus    informasi  berjalan.    Beberapa  website
membutuhkan  subskripsi  (data  masukan)  agar  para  user  bisa  mengakses  sebagian  atau
keseluruhan isi website tersebut. contohnya, ada  beberapa situs -  situs bisnis, situs-situs e-mail
gratisan, yang membutuhkan subkripsi agar kita bisa mengakses situs tersebut.
PHP

PHP  merupakan  singkatan  dari  PHP  Hypertext  Preprocessor.  PHP  merupakan  Bahasa
pemograman script yang di letakkan dalam server yang biasa digunakan untuk membuat aplikasi
web  yang  bersifat  dinamis.  (Winanjar  &  Susanti,  2021).  PHP  adalah  sebuah  bahasa
pemprograman  berbasis  web  yang  mempunyai  banyak keunggulan  dibandingkan dengan  bahasa
pemprograman  berbasis  web  yang  lain.  PHP  merupakan  bahasa  pemrograman  yang  bersumber
dari  perl.  Sedangakan  perl  merupakan  pengembangan  dari  bahasa  C.  Oleh  karena  struktur
pemrograman  yang  ada  di  PHP  merupakan  pengembangan  dari  bahasa  C  secara  tidak
langsung,maka PHP mempunyai banyak sekali fitur-fitur yang dapat digunakan (Nugroho, 2014).

My SQL

MySQL  adalah  salah  satu  jenis  database  server  yang  sangat  popular,  hal  ini  disebabkan
karena MySQL menggunakan SQL sebagai bahasa dasar untuk mengakses databasenya. MySQL
bersifat  Opern  Source,  software  ini  di  lengkapi  dengan  Source  Code  (kode  yang  dipakai  untuk
membuat MySQL). (Winanjar & Susanti, 2021).

MySql  adalah  database  server  yang  mampu  menampung  sampai  ratusan  giga  record.
Dengan  kemampuan  tersebut,  aplikasi  yang anda  buat  akan  semakin  powerfulljika digabungkan
dengan PHP. Selain itu yang paling penting ialah cost yang dibutuhkan untuk menggunakan PHP
dan  MySql  adalah  gratis.  Artinya  dapat  menggunakan,  menginstal,  dan  mendistribusikan  tanpa
harus lisensi (Kristanti et al., 2018).
Pengertian Database

Database  adalah  kumpulan  data  terstruktur.  Agar  dapat  menambah,  mengakses,  dan
memproses  data  yang tersimpan  dalam  database komputer, dibutuhkan  sistem  manajemen  basis
data (database management system). (Widarma & Kumala, 2018)

Dalam  pengembangan  perangkat  tradisional  yang  memanfaatkan  pemrosesan  file,  setiap
kelompok  pengguna  menyimpan  file  –  file  nya  sendiri  untuk  menangani  aplikasi  pengolahan

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

591

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

datanya masing – masing. Hal ini mengakibatkan adanya kadanya kerangkapan data atau disebut
dengan redundancy. (Widarma & Kumala, 2018).

Entinity Relationship Diagram (ERD)

Entinity  Relationship  diagram  (ERD)  adalah  suatu  pemodelan  konseptual  yang  didesain
secara khusus untuk mengidentifikasikan entitas yang menjelaskan data dan hubungan antar data.
(Halimah & Bachry, 2018).

Menurut  (Danny,  2017)  Entity  Relationship  Diagram  (ERD)  adalah  suatu  model  untuk
menjelaskan  hubungan  antar  data  dalam  basis  data  berdasarkan  objek-objek  dasar  data  yang
mempunyai hubungan antar relasi. Entity Relationship Diagram (ERD) sendiri dibagi menjadi 2
yaitu  Entity  Relationship  Diagram  (Logical  Data  Model)  dan  Entity  Relationship  Diagram
(Physical Data Model). Entity Relationship Diagram (Logical Data Model) adalah konsep Entity
Relationship  Diagram  (ERD)  yang  mana  data  dapat  merepresentasikan  sebuah  kenyataan,
dimasukkan  ke dalam  sebuah  pemrosesan  logika dan dapat  menghasilkan informasi,  sedangkan
untuk  Entity  Relationship  Diagram  (Physical  Data  Model)  adalah  konsep  Entity  Relationship
Diagram  (ERD)  yang  mana  data  disimpan  pada  media  penyimpanan  (storage)  dalam  suatu
susunan secara fisik

III. METODE
Tempat Dan Waktu Penelitian

Tempat praktik kerja lapangan di laksanakan di kampus Universitas Amir Hamzah
yang beralamat di Jalan Pancing Pasar V Barat Medan Estate, Kabupaten Deli Serdang –
Provinsi Sumatera Utara, Indonesia.

Jenis dan Sumber Data

Jenis data yang di gunakan adalah data sekunder, yang artinya data itu adalah data
yang telah di sediakan perusahaan untuk menjadi pedoman penelitian. Sumber data yang
digunakan berasal dari data internal, yang merupakan data yang diambil dari perusahaan.

Metode Pengumpulan Data
Metode  pengumpulan  data  dengan  cara datang langsung ke  perpustakaan untuk mencari
referensi.
Metode Analisis Data
Metode analisis data menggunakan cara kualitatif deskriptif, yaitu suatu dimana data-data
yang disimpulkan , diklasifikasi, dianalisis dan diinterprestasikan secara objektif sehingga
memberikan informasi dan gambaran mengenai topik yang di bahas.
Analisis Sistem Yang Sedang Berjalan
Prosedur Pengolahan Data

Prosedur  pengolahan  data  pada sistem  yang  berjalan  di  Universitas  Amir  Hamzah
masih menggunakan metode tertulis.  Berikut merupakan  prosedur pengolahan  data pada
sistem yang sedang berjalan :

1.  Setelah  sidang  skripsi,  skripsi  di  perbanyak  rangkap  3  dan  diserahkan  ke

Fakultas.

2.  Skripsi diserahkan kepada KaProdi dan Pustakawan Perpustakaan Fakultas.
3.  KaProdi menandatangani Berita Acara Serah Terima (BAST).
4.  KaProdi  dan  Pustakawan  Perpustakaan  Fakultas  menyimpan  /  mengarsip

skripsi.

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

592

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

5.  Kemudian  Fakultas  akan  memberikan  Skripsi  ke  Pustakawan  Perpustakaan

Universitas.

6.  Pustakawan  Perpustakaan  Universitas  menandatangani  Berita  Acara  Serah

Terima (BAST).

7.  Pustakawan mendatakan skripsi yang di terima kemudian di letakkan ke dalam

rak.

IV. HASIL DAN PEMBAHASAN
Hasil  dari  penelitian  inidiperoleh  berdasarkan  kegiatan  pembangunan  aplikasi  dengan  tahapan-
tahapan pengembangan system. Dimana metode yang digunakan dalam pengembangan system ini
adalah  metode  Waterfall.  Pada  bab  ini  penulis  akan  menguraikan  hasil  penelitian  yang  telah
berjalan  sesuai  dengan tahapan-  tahapan  yang  sudah  dilaksanakan.  Adapun  hasil yang  diperoleh
dalam penelitian ini adalah sebagai berikut:
1.  Analisis Sistem Yang Sedang Berjalan
Prosedur Pengolahan Data

Prosedur  pengolahan  data  pada  sistem  yang  berjalan  di  Universitas  Amir  Hamzah  masih
menggunakan  metode  tertulis.  Berikut  merupakan  prosedur  pengolahan  data  pada  sistem  yang
sedang berjalan :

1.  Setelah sidang skripsi, skripsi di perbanyak rangkap 3 dan diserahkan ke Fakultas.
2.  Skripsi diserahkan kepada KaProdi dan Pustakawan Perpustakaan Fakultas.
3.  KaProdi menandatangani Berita Acara Serah Terima (BAST).
4.  KaProdi dan Pustakawan Perpustakaan Fakultas menyimpan / mengarsip skripsi.
5.  Kemudian  Fakultas  akan  memberikan  Skripsi  ke  Pustakawan  Perpustakaan

Universitas.

6.  Pustakawan  Perpustakaan  Universitas  menandatangani  Berita  Acara  Serah  Terima

(BAST).

7.  Pustakawan mendatakan skripsi yang di terima kemudian di letakkan ke dalam rak.

Data Flow Diagram system yang sedang berjalan
Sistem  pendataan  Skripsi  yang  sedang  berjalan  di  Universitas  Amir  hamzah  ini  masih  bersifat
manual.  Disini  penulis  akan  memperbaiki  sistem  yang  lama  dengan  sistem  yang  baru  yaitu
dengan  membuat  aplikasi  distribusi  yang  berfungsi  untuk  memberi  informasi  dan  penginputan
Skripsi.  Adapun  prosedur  system  pencatatan  dan  pengumpulan  data  skripsi  yang  selama  ini
digunakan adalah sebagai berikut:

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

593

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

Gambar 1. Data Flow Map Repository Universtas Amir Hamzah

Hasil Penelitian
1.  Halaman Form Login

Gambar 2. Form Login

Halaman ini merupakan tampilan awal saat  pertama kali user mengakses  website repository
skripsi Universitas  Amir  hamzah.  Pada  halaman login  ini  user  diharuskan  login  dengan
memasukkan  akun  kredensial  masing-masing.  User  dosen  harus  memasukkan  NIDN/NIDK
dan password, sedangkan  user mahasiswa harus memasukkan NIM dan password untuk dapat
masuk ke dalam sistem repository ini.

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

594

MulaiAdminSystemMahasiswaUser UmumLoginSesuaiInput data daftar login Mahasiswa12Memilih Menu konfirmasi skripsiPilih berdasarkan judul/namaKonfirmasi4Lihat SkripsiPilih berdasarkan JudulDetail AlumniDwnload SkripsiHasilDatabase1Mendapatkan Id, Password untuk loginLoginsesuaiMemilih Menu Upload skripsiInput data upload skripsiBerhasilMenunggu Konfirmasi Skripsi2Lihat List JurusanLihat List JudulPilih Berdasarkan JudulDwnload SkripsiDetail Alumni Mahasiswa3Lihat List JurusanLihat List JudulPilih Berdasarkan JudulDwnload SkripsiDetail Alumni Mahasiswa33

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

2.  Halaman Form Daftar Dosen

Gambar 3. Form Daftar Dosen

Pada  halaman  ini  terdapat  menu  entry  data  dosen  dan  menu  pencarian.  Menu  entry  data  dosen
hanya  dapat  dilakukan  oleh  admin  untuk  menginput  daftar  nama-  nama  dosen,  ID,  dan  data
Dosen lainnya. Sedangkan user selain admin hanya dapat melakukan pencarian daftar dosen pada
menu ini.

3.  Halaman Form Input data Dosen

Gambar 4. Form Input Data Dosen
Pada halaman ini terdapat textbox-textbox yang harus diisi untuk melengkapi data dosen, seperti:
ID Dosen, Nama, Program Studi, Email, dan sandi. Menu  ini hanya dapat diinput oleh admin.

4.  Halaman Form Daftar Mahasiswa

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

595

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

Gambar 5. Form Pendaftaran Mahasswa

Pada halaman ini terdapat menu entry data mahasiswa dan menu pencarian. Adapun  menu entry
data  mahasiswa  hanya  dapat  diakses  oleh  admin  sedangkan  user  selain  admin  hanya  dapat
mengakses menu pencarian.

5.  Halaman Form Entry Data Mahasiswa

Gambar 6. Form Entry Data Mahasiswa

Pada  halaman  ini  terdapat  textbox-textbox  yang  harus  diisi  untuk  melengkapi  data  mahasiswa,
seperti: Nim, Nama, Nama Prodi, Email, Sandi. Menu ini hanya dapat diinput oleh admin.

6.  Halaman Daftar data Repository

Gambar 7. Form Daftar Data Repository

Pada  halaman  ini  terdapat  menu  entry data  repository  yang  hanya  dapat diakses  oleh  admin,
sedangkan menu pencarian dapat diakses oleh user selain admin.

7.  Halaman Form Entry Data Repository

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

596

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

Gambar 8. Form Penginputan Data Repository Skripsi

Pada  halaman  ini admin  dapat  mengakses  entry data  repository.  Data  inilah  yang  nantinya akan
tersimpan  di database  repository  sehingga  dosen  dan  mahasiswa  dapat  mengaksesnya  untuk
melakukan pencarian naskah, melihat abstrak, dan mengunduh naskah dalam format PDF.

V. KESIMPULAN

Pembuatan  prototype  system  informasi  repository  skripsi  berbasis  web  dapat  dilakukan
dengan  menggunakan  metode  simulated  prototyping,  yaitu      dengan  membuat  form  tampilan
input dan tampilan output. Prototype system informasi ini  dirancang dengan tetap mengacu pada
dokumen hasil analisis dan perancangan sistem informasi yang berupa diagram konteks, diagram
arus  data,  dan  diagram  relasi  antar  entitas.  Sebaiknya,  prototype  ini  dilanjutkan  lagi  menjadi
system lengkap untuk memenuhi kebutuhan  kampus. Dengan adanya aplikasi repository ini, maka
pekerjaan  pustakawan  dalam  memberikan  informasi  tentang  skripsi  mahasiswa  di  Universitas
Amir Hamzah dapat dilakukan secara cepat dan akurat.

VI. REFERENSI

Danny,  M.  (2017).  Perancangan  Sistem  Informasi  LPPM  pada  STMIK  Cikarang  berbasis  Web
Menggunakan Database MySQL. Journal of Chemical Information and Modeling, 12(4).

Dewi  Teresia,  E.  S.,  &  Hermi,  H.  (2016).  PENGARUH  STRUKTUR  KEPEMILIKAN,
UKURAN  PERUSAHAAN  DAN  KEPUTUSAN  KEUANGAN  TERHADAP  NILAI
PERUSAHAAN  DENGAN  PERTUMBUHAN  PERUSAHAAN  SEBAGAI  VARIABEL
MODERATING.
Trisakti.
https://doi.org/10.25105/jmat.v3i1.4969

Akuntansi

Magister

Jurnal

Halimah,  H.,  &  Bachry,  B.

(2018).  PEMANFAATAN  MODEL  ENTERPRISE
ARCHITECTURE  PLANNING
(EAP)  UNTUK  PROTOTYPE  E-DOCUMENT
KEPEGAWAIAN  (DOSEN)  PADA  BAGIAN  SUMBER  DAYA  MANUSIA  DI
INSTITUT  INFORMATIKA  DAN  BISNIS  DARMAJAYA.  Explore:  Jurnal  Sistem
Informasi Dan Telematika, 9(2). https://doi.org/10.36448/jsit.v9i2.1076

Hendraputra, S. (2021). Penerapan Metode AHP Berbasis Web Dalam Pemilihan Dosen Terbaik.

Remik, 5(2). https://doi.org/10.33395/remik.v6i1.11192

Hidayat,  F. M.  (2017).  Sistem  Informasi  Repository  Skripsi  Pada  Fakultas  Ilmu  Komputer  Dan
Teknologi  Informasi  Universitas  Mulawarman.  Prosiding  Seminar  Ilmu  Komputer  Dan
Teknologi Informasi, 2x(1).

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

597

Remik: Riset dan E-Jurnal Manajemen Informatika Komputer
Volume 6, Nomor 3, Agustus 2022
http://doi.org/10.33395/remik.v6i3.11781

 e-ISSN : 2541-1330
 p-ISSN : 2541-1332

Jimi,  A.  (2019).  Rancang  Bangun  Sistem  Informasi  Desa  Berbasis  Website  (Studi  Kasus  Desa
2(1).

(JUKANTI),

Pendidikan

Teknologi

Informasi

Netpala).
https://doi.org/10.37792/jukanti.v2i1.17

Jurnal

Kharisma,  L.  P.  I.,  Muh.  Fahrurrozi,  &  Khairunnazri.  (2020).  SISTEM  INFORMASI
REPOSITORI  SKRIPSI  BERBASIS  WEB  PADA  STMIK  SYAIKH  ZAINUDDIN  NW
ANJANI.
1(1).
Teknologi
TEKNIMEDIA:
https://doi.org/10.46764/teknimedia.v1i1.15

Dan  Multimedia,

Informasi

Kristanti, A., Setiawati, D., & Kristiani, D. (2018). PEMANFAATAN E-COMMERCE UNTUK
MENDUKUNG  UMKM  DALAM  PEMASARAN.  JITU :  Journal  Informatic  Technology
And Communication, 2(2), 22–27.

Nugroho, B. (2014). Dasar Pemrograman Web PHP-MySQL dengan Dreamweaver. Gava Media.

https://doi.org/10.1016/0378-1119(87)90155-7

Saputra,  A.  D.,  &  Widjaja,  A.  (2019).  Implementasi  Sistem  Penjualan  Online  Berbasis  E-
Commerce Menggunakan Business Model Canvas Pada Cosy Distro. Jurnal IDEALIS.

Widarma, A., & Kumala, H. (2018). PERANCANGAN APLIKASI GAJI KARYAWAN PADA
PT.  PP  LONDON  SUMATRA  INDONESIA  Tbk.  GUNUNG  MALAYU  ESTATE  -
KABUPATEN
1(2).
https://doi.org/10.36294/jurti.v1i2.303

TEKNOLOGI

INFORMASI,

ASAHAN.

JURNAL

Winanjar,  J.,  &  Susanti,  D.

INFORMASI
ADMINISTRASI  DESA  BERBASIS  WEB  MENGGUNAKAN  PHP  DAN  MySQL.
Prosiding  Seminar  Nasional  Aplikasi  Sains  &  Teknologi  (SNAST)  2021  Yogyakarta,  20
Maret 2021.

(2021).  RANCANG  BANGUN  SISTEM

This is a Creative Commons License This work is licensed under a Creative Commons
Attribution-NonCommercial 4.0 International License.

598


