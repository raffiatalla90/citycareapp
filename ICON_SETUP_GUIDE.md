# Icon Assets Setup Guide

## Required Icons for PWA

Aplikasi ini memerlukan icon dalam berbagai ukuran untuk PWA. Berikut cara mudah untuk membuatnya:

## Opsi 1: Menggunakan Online Generator (Recommended)

### Menggunakan PWA Builder
1. Buka https://www.pwabuilder.com/imageGenerator
2. Upload logo/icon Anda (minimal 512x512 px, format PNG, background transparan)
3. Generate semua ukuran
4. Download zip file
5. Extract dan copy semua file ke `src/public/images/`

### Menggunakan RealFaviconGenerator
1. Buka https://realfavicongenerator.net/
2. Upload master image (512x512 px recommended)
3. Customize settings untuk Android Chrome (PWA)
4. Generate favicons
5. Download dan extract ke `src/public/images/`

## Opsi 2: Manual dengan Image Editor

Jika Anda memiliki image editor (Photoshop, GIMP, etc):

### Langkah-langkah:
1. Buat/impor logo di 512x512 px
2. Export/Save As dengan ukuran berikut:
   - 72x72 px → `icon-72x72.png`
   - 96x96 px → `icon-96x96.png`
   - 128x128 px → `icon-128x128.png`
   - 144x144 px → `icon-144x144.png`
   - 152x152 px → `icon-152x152.png`
   - 192x192 px → `icon-192x192.png`
   - 384x384 px → `icon-384x384.png`
   - 512x512 px → `icon-512x512.png`
3. Save semua file ke folder `src/public/images/`

## Opsi 3: Menggunakan Placeholder

Untuk testing sementara, Anda bisa menggunakan placeholder:

1. Download free icon dari:
   - https://www.flaticon.com/
   - https://www.iconfinder.com/
   - https://iconmonstr.com/

2. Atau buat simple colored square:
```bash
# Jika Anda punya ImageMagick installed
convert -size 512x512 xc:#4CAF50 -gravity center -pointsize 200 -fill white -annotate +0+0 "SA" icon-512x512.png
```

## Screenshots untuk Manifest

### Mobile Screenshots (540x720)
1. Buka aplikasi di Chrome
2. Press F12 untuk DevTools
3. Click Device Toolbar (Ctrl+Shift+M)
4. Set dimensions ke 540x720
5. Navigate ke halaman yang ingin di-screenshot:
   - Home page dengan stories dan map
   - Add story page
6. Press Ctrl+Shift+P dan ketik "Capture screenshot"
7. Pilih "Capture node screenshot" atau "Capture full size screenshot"
8. Rename ke `screenshot-mobile-1.png` dan `screenshot-mobile-2.png`

### Desktop Screenshot (1280x720)
1. Set browser window ke 1280x720
2. Capture screenshot dengan tool pilihan Anda
3. Save as `screenshot-desktop-1.png`

## Shortcut Icons

Untuk shortcuts di manifest, Anda bisa:
1. Gunakan icon yang sama (icon-192x192.png)
2. Atau buat custom icons:
   - `icon-add-192x192.png` - Icon + symbol
   - `icon-home-192x192.png` - Home symbol

## Struktur Folder Akhir

```
src/public/images/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png      ← Maskable
├── icon-384x384.png
├── icon-512x512.png      ← Maskable
├── icon-add-192x192.png
├── icon-home-192x192.png
├── screenshot-mobile-1.png
├── screenshot-mobile-2.png
└── screenshot-desktop-1.png
```

## Tips untuk Maskable Icons

Untuk icons yang labeled "maskable" (192x192 dan 512x512):
- Pastikan content penting ada di "safe zone" (80% tengah)
- Background tidak transparan untuk hasil terbaik
- Test di https://maskable.app/

## Validation

Setelah menambahkan semua icons:
1. Build aplikasi: `npm run build`
2. Serve: `npm run serve`
3. Buka Chrome DevTools > Application > Manifest
4. Pastikan semua icons loaded tanpa error
5. Check "Installability" tidak ada warning

## Quick Setup (for development)

Jika Anda hanya ingin test functionality tanpa proper icons:

1. Buat satu file PNG sederhana 512x512
2. Copy/rename ke semua ukuran yang dibutuhkan
3. Untuk screenshots, gunakan screenshot apapun dengan resize ke dimensi yang benar

**Note**: Untuk submission, disarankan menggunakan icons yang proper dan professional!
