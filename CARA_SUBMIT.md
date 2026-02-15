# 📦 CARA SUBMIT YANG BENAR

## ⚠️ PENTING: Jangan Include node_modules!

### ❌ JANGAN Include dalam ZIP:
- `node_modules/` - Folder dependencies (ini yang membuat ZIP bengkak!)
- `dist/` - Folder build result
- `.DS_Store` atau file OS lainnya
- `.vscode/`, `.idea/` atau folder IDE lainnya

### ✅ Yang HARUS Include dalam ZIP:
- `src/` - Source code
- `package.json` - Dependencies list
- `package-lock.json` - Lock file
- `webpack.*.js` - Webpack configs (common, dev, prod)
- `README.md` - Dokumentasi
- `STUDENT.txt` - Info student
- `.gitignore` - Ignore file (opsional tapi direkomendasikan)

---

## 🗜️ Cara Membuat ZIP untuk Submission

### Opsi 1: Menggunakan Terminal (Recommended)

```bash
# Pastikan Anda berada di dalam folder project
cd /Users/raffiatmaja/Downloads/starter-project-with-webpack

# Hapus node_modules dan dist jika ada
rm -rf node_modules dist

# Buat ZIP tanpa node_modules
zip -r story-app-submission.zip . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x ".DS_Store" \
  -x "*.log" \
  -x ".git/*"
```

### Opsi 2: Manual dengan Finder (macOS)

1. **HAPUS folder berikut jika ada:**
   - `node_modules/`
   - `dist/`

2. **Pilih file/folder yang akan di-zip:**
   - `src/`
   - `package.json`
   - `package-lock.json`
   - `webpack.common.js`
   - `webpack.dev.js`
   - `webpack.prod.js`
   - `README.md`
   - `STUDENT.txt`
   - `.gitignore` (jika ada)

3. **Klik kanan** → **Compress** (atau **Compress Items**)

4. **Rename** file ZIP menjadi `story-app-submission.zip`

---

## ✅ Verifikasi ZIP Sebelum Submit

Sebelum mengirim, pastikan:

1. **Ukuran ZIP wajar** (seharusnya < 1MB tanpa node_modules)
2. **Extract ZIP** dan coba jalankan:
   ```bash
   unzip story-app-submission.zip -d test-extract
   cd test-extract/starter-project-with-webpack
   npm install
   npm run build
   npm run start-dev
   ```
3. **Pastikan aplikasi jalan** di http://localhost:9000

---

## 📊 Ukuran File yang Normal

- **Dengan node_modules**: ~200-300 MB ❌ JANGAN!
- **Tanpa node_modules**: ~50-500 KB ✅ BENAR!

Jika ukuran ZIP Anda lebih dari 5 MB, kemungkinan besar Anda masih menyertakan `node_modules` atau `dist`.

---

## 🔄 Alur Reviewer

Ketika reviewer menerima submission:

1. Extract ZIP
2. Jalankan `npm install` (ini akan create node_modules)
3. Jalankan `npm run build` atau `npm run start-dev`
4. Review aplikasi

Jadi **node_modules TIDAK perlu** disertakan karena reviewer akan generate sendiri dengan `npm install`.

---

## 💡 Tips

- Gunakan `.gitignore` untuk prevent accident include
- Double check ukuran ZIP sebelum upload
- Test extract dan run di folder berbeda untuk memastikan

---

Semoga berhasil dengan submission berikutnya! 🚀
