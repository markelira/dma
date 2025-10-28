# DMA - Tesztfelhasználók

## 🔐 Bejelentkezési adatok

### Admin felhasználó
- **Email:** admin@dma.hu
- **Jelszó:** admin123
- **Szerepkör:** Admin
- **Átirányítás után:** /admin

### Oktató felhasználó
- **Email:** nagypeter@dma.hu
- **Jelszó:** instructor123
- **Szerepkör:** Oktató
- **Átirányítás után:** /instructor/dashboard

### Diák felhasználók
#### Diák 1
- **Email:** kovacsjanos@dma.hu
- **Jelszó:** student123
- **Szerepkör:** Diák
- **Átirányítás után:** /dashboard

#### Diák 2
- **Email:** szaboanna@dma.hu
- **Jelszó:** student123
- **Szerepkör:** Diák
- **Átirányítás után:** /dashboard

## 🚀 Használat

1. Indítsd el a Firebase emulátorokat:
```bash
firebase emulators:start --only auth,firestore
```

2. Ha szükséges, hozd létre újra a felhasználókat:
```bash
cd scripts && node reset-and-seed-auth.js
```

3. Jelentkezz be a http://localhost:3000/login oldalon

## ⚠️ Fontos
- Ezek a fiókok csak fejlesztői környezetben működnek
- Az emulátoroknak futniuk kell a bejelentkezéshez
- Ha újraindítod az emulátorokat, újra létre kell hozni a felhasználókat