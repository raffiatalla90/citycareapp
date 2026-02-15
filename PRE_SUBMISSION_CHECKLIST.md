# ✅ Pre-Submission Checklist

Gunakan checklist ini untuk memastikan submission Anda siap untuk dikirim.

## 🎨 1. Assets & Icons

### PWA Icons (CRITICAL)
- [ ] `src/public/images/icon-72x72.png`
- [ ] `src/public/images/icon-96x96.png`
- [ ] `src/public/images/icon-128x128.png`
- [ ] `src/public/images/icon-144x144.png`
- [ ] `src/public/images/icon-152x152.png`
- [ ] `src/public/images/icon-192x192.png` (Maskable)
- [ ] `src/public/images/icon-384x384.png`
- [ ] `src/public/images/icon-512x512.png` (Maskable)

**📝 Note:** Lihat `ICON_SETUP_GUIDE.md` untuk cara membuat icons

### Screenshots untuk Manifest
- [ ] `src/public/images/screenshot-mobile-1.png` (540x720)
- [ ] `src/public/images/screenshot-mobile-2.png` (540x720)
- [ ] `src/public/images/screenshot-desktop-1.png` (1280x720)

### Optional Shortcut Icons
- [ ] `src/public/images/icon-add-192x192.png`
- [ ] `src/public/images/icon-home-192x192.png`

**💡 Tip:** Jika tidak ada, gunakan icon-192x192.png untuk shortcuts

---

## 🔧 2. Build & Test

### Build Production
```bash
npm run build
```
- [ ] Build berhasil tanpa error
- [ ] Folder `dist/` terbentuk
- [ ] File `dist/service-worker.js` ada
- [ ] File `dist/manifest.json` ada

### Serve Production
```bash
npm run serve
```
- [ ] Server berjalan (default: http://localhost:8080)
- [ ] Aplikasi dapat dibuka di browser
- [ ] Tidak ada error di Console

---

## ✅ 3. PWA Validation

### Chrome DevTools - Application Tab

#### Manifest
- [ ] Buka DevTools > Application > Manifest
- [ ] Tidak ada error atau warning
- [ ] Semua icons tampil dengan benar
- [ ] Screenshots loading dengan benar
- [ ] Identity section lengkap
- [ ] Presentation section lengkap

#### Service Workers
- [ ] Service Worker status: "activated and is running"
- [ ] Service Worker source: `/service-worker.js`
- [ ] Update on reload berfungsi
- [ ] Unregister dan register ulang berfungsi

#### Storage
- [ ] IndexedDB > StoryAppDB ada
- [ ] Object stores: `favorites` dan `offline-stories`
- [ ] Cache Storage ada (3 caches)

#### Lighthouse
```bash
# Run Lighthouse audit
```
- [ ] PWA score: ✓ (green checkmark)
- [ ] "Installable" badge muncul
- [ ] Semua PWA criteria passed

---

## 📱 4. PWA Features Testing

### Installation
- [ ] Install prompt muncul (desktop & mobile)
- [ ] Klik install button berhasil
- [ ] App terbuka dalam standalone mode
- [ ] Icon muncul di home screen/app drawer

### Offline Support
**Test Steps:**
1. Buka aplikasi & login
2. Browse beberapa stories
3. DevTools > Network > Offline
4. Refresh page

**Validation:**
- [ ] App shell tetap muncul
- [ ] Cached stories masih tampil
- [ ] Map tiles loaded (dari cache)
- [ ] UI tidak rusak

### Push Notifications
**Test Steps:**
1. Login ke aplikasi
2. Klik toggle "Push Notifications"
3. Allow notification permission
4. Buka tab/device lain
5. Tambah story baru

**Validation:**
- [ ] Toggle button works (aktif/nonaktif)
- [ ] Permission prompt muncul
- [ ] Notification tampil saat story baru
- [ ] Notification title dinamis
- [ ] Notification body dinamis
- [ ] Icon & badge tampil
- [ ] Klik notification → navigate ke home

**Alternative Test:**
```javascript
// Di Console
await pushNotificationManager.showTestNotification();
```
- [ ] Test notification muncul

---

## 💾 5. IndexedDB Features

### Favorites - Basic CRUD
- [ ] Klik ⭐ di story card → tambah ke favorites
- [ ] Navigate ke `/favorites` → story muncul
- [ ] Klik "Remove" → story hilang dari favorites
- [ ] Kembali ke home → star button kembali normal

### Favorites - Search & Sort
- [ ] Search box: ketik nama/deskripsi → hasil filter
- [ ] Sort by: "Date Added" → urutan berubah
- [ ] Sort by: "Date Created" → urutan berubah
- [ ] Sort by: "Name" → urutan berubah
- [ ] Order: "Newest First" & "Oldest First" → urutan terbalik

### Offline Sync
**Test Steps:**
1. DevTools > Network > Offline
2. Navigate ke "Add Story"
3. Fill form & submit
4. Check message "saved offline"
5. DevTools > Application > IndexedDB > offline-stories
6. Verify story tersimpan
7. Network > Online
8. Wait atau reload page

**Validation:**
- [ ] Story tersimpan di IndexedDB saat offline
- [ ] Message "saved offline" muncul
- [ ] Data valid di IndexedDB
- [ ] Saat online, auto-sync terpicu
- [ ] Story muncul di server/home page
- [ ] Story terhapus dari IndexedDB

---

## 🎯 6. Functionality Checklist

### Kriteria 1: Submission Sebelumnya
- [ ] SPA routing works (hash-based)
- [ ] Page transitions smooth
- [ ] Map dengan stories loaded
- [ ] Markers clickable & show popup
- [ ] Add story form works
- [ ] Photo upload & preview works
- [ ] Location picker works
- [ ] Accessibility features intact

### Kriteria 2: Push Notification
**Basic:**
- [ ] Service worker push event handler
- [ ] Notification tampil saat trigger

**Skilled:**
- [ ] Notification title dinamis
- [ ] Notification body/message dinamis
- [ ] Icon dalam notification

**Advanced:**
- [ ] Toggle button enable/disable
- [ ] Notification action (view/close)
- [ ] Click notification navigate

### Kriteria 3: PWA
**Basic:**
- [ ] Installable (manifest + SW)
- [ ] Offline app shell

**Skilled:**
- [ ] Screenshots di manifest
- [ ] Shortcuts di manifest
- [ ] Theme colors
- [ ] No manifest warnings

**Advanced:**
- [ ] API data cached & available offline
- [ ] Images cached
- [ ] Multiple caching strategies implemented

### Kriteria 4: IndexedDB
**Basic:**
- [ ] Create: Add to favorites
- [ ] Read: View favorites
- [ ] Delete: Remove favorites
- [ ] UI accessible & works

**Skilled:**
- [ ] Search favorites
- [ ] Sort favorites (multiple fields)
- [ ] Order ascending/descending

**Advanced:**
- [ ] Offline story creation → IndexedDB
- [ ] Auto-sync saat online
- [ ] Background Sync API used
- [ ] Sync status indicators

---

## 🔍 7. Code Quality Check

### File Structure
- [ ] Semua file terorganisir rapi
- [ ] Nama file konsisten & deskriptif
- [ ] Tidak ada file unused

### Code Standards
- [ ] Tidak ada console.error yang terlewat
- [ ] Tidak ada TODO/FIXME yang belum selesai
- [ ] Komentar jelas dan helpful
- [ ] Indentation konsisten

### Error Handling
- [ ] Try-catch di async operations
- [ ] User-friendly error messages
- [ ] Loading states ada
- [ ] Network error handling

---

## 📝 8. Documentation

### README Files
- [ ] README.md updated dengan instruksi jelas
- [ ] PWA_IMPLEMENTATION.md lengkap
- [ ] SUBMISSION_2_COMPLETE.md review

### Code Comments
- [ ] Service Worker events documented
- [ ] Complex functions explained
- [ ] API integrations commented

---

## 🚀 9. Final Checks

### Browser Testing
- [ ] Chrome/Edge: Semua fitur works
- [ ] Firefox: Basic functionality works
- [ ] Mobile Chrome: PWA installable & works

### Performance
- [ ] Page load cepat (<3s)
- [ ] Smooth interactions
- [ ] No memory leaks
- [ ] Efficient caching

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Proper ARIA labels
- [ ] Color contrast sufficient

---

## 📦 10. Submission Preparation

### Clean Up
```bash
# Remove node_modules jika akan zip
rm -rf node_modules

# Remove dist (akan di-generate reviewer)
rm -rf dist
```

### Package Info
- [ ] `package.json` name, author updated
- [ ] `package.json` scripts work
- [ ] Dependencies version reasonable

### Student Info
- [ ] `STUDENT.txt` diisi dengan benar
- [ ] Nama lengkap
- [ ] Email
- [ ] ID Dicoding

### Final Archive
```bash
# Create ZIP tidak termasuk:
# - node_modules/
# - dist/
# - .git/
```

- [ ] ZIP file created
- [ ] File size reasonable (<10MB tanpa node_modules)
- [ ] Extract & test dari ZIP

---

## ✨ 11. Pre-Submit Test

### Fresh Install Test
1. Extract ZIP ke folder baru
2. Run:
   ```bash
   npm install
   npm run build
   npm run serve
   ```
3. Test semua fitur dari checklist ini

**Validation:**
- [ ] Semua commands work
- [ ] Build successful
- [ ] App runs dengan baik
- [ ] Semua fitur functional

---

## 📊 Final Scoring

### Expected Points
- Kriteria 1: 4/4 pts ✅
- Kriteria 2: 4/4 pts ✅
- Kriteria 3: 4/4 pts ✅
- Kriteria 4: 4/4 pts ✅
- **TOTAL: 16/16 pts** 🎉

---

## 🎯 Common Issues & Fixes

### Issue: Icons tidak muncul
**Fix:** 
- Copy semua icons ke `src/public/images/`
- Rebuild: `npm run build`
- Check manifest path di DevTools

### Issue: Service Worker tidak register
**Fix:**
- Pastikan HTTPS atau localhost
- Check console untuk errors
- Verify `webpack.common.js` copy SW file

### Issue: Offline tidak works
**Fix:**
- Check Service Worker activated
- Test di production build (bukan dev server)
- Verify caching strategies di SW

### Issue: Push notification tidak muncul
**Fix:**
- Check browser permission
- Verify VAPID key benar
- Test dengan test notification
- Check notification blocked di OS settings

---

## 📞 Need Help?

Jika ada issues:
1. Check console errors
2. Review documentation files
3. Validate dengan Chrome DevTools
4. Test di clean environment

---

## ✅ Ready to Submit?

Jika semua checklist ✓:
- **Congratulations!** 🎉
- Your submission is ready!
- Good luck! 🍀

**Last Steps:**
1. [ ] Double-check STUDENT.txt
2. [ ] Create final ZIP
3. [ ] Upload to submission platform
4. [ ] 🙏 Await results

---

**Remember:** Quality over quantity. Make sure everything WORKS before submitting!

Good luck with your submission! 🚀
