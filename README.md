# buisness-helper-bot-server

Telegram bot va REST API serveri. Bot server bilan bitta jarayonda,
doimiy ishlaydi.

## Talablar

- Node.js >= 20
- MongoDB (lokal yoki Atlas)
- @BotFather dan olingan bot tokeni

## Ishga tushirish

```bash
npm install
cp .env.example .env     # BOT_TOKEN va MONGODB_URI ni to'ldiring

npm run dev              # node --watch bilan
npm start                # production
```

Standart manzil: `http://localhost:4000`. Holatni tekshirish —
`GET /api/health`.

## Tuzilma

```
src
├── index.js              ishga tushirish + graceful shutdown
├── app.js                Express ilovasi
├── config/               env va MongoDB ulanishi
├── bot/
│   ├── index.js          Bot nusxasi, polling/webhook boshqaruvi
│   ├── register.js       handlerlar shu yerda ulanadi
│   ├── constants.js      bot matnlari va chegaralar
│   ├── keyboards/        reply klaviaturalar
│   ├── middlewares/      har bir update uchun oraliq qatlam
│   ├── handlers/         update ishlovchilari
│   └── scenes/           ko'p qadamli oqimlar
├── models/               Mongoose modellari
├── controllers/          API kontrollerlari
├── routes/               API yo'nalishlari
├── services/             biznes mantiq (fayl, ariza, yo'nalish, admin)
├── middlewares/          Express oraliq qatlamlari (auth, xatolar)
├── constants.js          holatlar ro'yxati (ariza, yo'nalish)
└── utils/                logger, ApiError, telefon formatlash
```

Botga yuborilgan fayllar `UPLOAD_DIR` (standart: `uploads/`) papkasiga
saqlanadi va `/uploads/<fayl>` manzilida beriladi. Papka git ga tushmaydi.

## Bot kutubxonasi

`node-telegram-bot-api` **v2** ishlatilgan — bu v1 (0.66.x) dan butunlay
farq qiladigan, noldan yozilgan API. Asosiy farqlar:

```js
// v1                                  // v2
new TelegramBot(token, {polling:true}) new Bot(token)
bot.onText(/\/start/, (msg) => ...)    bot.command('start', (ctx) => ...)
bot.sendMessage(chatId, text)          ctx.reply(text)
```

Handlerlar koa uslubidagi middleware zanjirida ishlaydi va `register.js`
dagi tartibda chaqiriladi.

## Bot rejimi

`BOT_MODE=polling` — lokal ish uchun (standart).

`BOT_MODE=webhook` — production uchun. Bunda `WEBHOOK_DOMAIN` (https) va
`WEBHOOK_SECRET` majburiy: Telegram payloadlarni imzolamaydi, chaqiruvchini
faqat shu maxfiy kalit tasdiqlaydi. Webhook Express ilovasining
`WEBHOOK_PATH` manzilida ochiladi va bot ishga tushganda avtomatik
ro'yxatdan o'tkaziladi.

## Ro'yxatdan o'tish oqimi

`/start` dan so'ng qadamlar ketma-ket so'raladi: tashkilot nomi → faoliyat
turi (klaviaturadan YaTT/MChJ) → rahbar F.I.Sh. → manzil → INN → telefon
raqam.

Har bir qadam `src/bot/scenes/registration.js` dagi massivda belgilangan —
tartibni o'zgartirish yoki yangi qadam qo'shish uchun shu massivni
tahrirlash kifoya.

Joriy qadam foydalanuvchi hujjatidagi `step` maydonida saqlanadi, shuning
uchun server qayta ishga tushsa ham oqim to'xtagan joyidan davom etadi.

Telefon raqam turli ko'rinishda kiritilishi mumkin (`931234567`,
`93 123 45 67`, `+998 93 123 45 67`, `00998...`) va `+998XXXXXXXXX`
ko'rinishiga keltirilib saqlanadi. INN kamida 9 ta, qolgan matnli qadamlar
kamida 3 ta belgidan iborat bo'lishi kerak — aks holda bot
`Ma'lumot noto'g'ri` deb javob beradi. Chegaralar `src/bot/constants.js`
da (`MIN_TEXT_LENGTH`, `MIN_INN_LENGTH`).

Ro'yxat tugagach bosh sahifa `Ariza berish` va `Arizalarim` tugmalari bilan
ochiladi.

## Ariza berish oqimi

`Ariza berish` → yo'nalish → murojaat mazmuni → fayl(lar) → ariza saqlanadi.

**Yo'nalish.** Klaviaturada faqat `Faol` holatdagi yo'nalishlar, har biri
alohida qatorda, oxirida `Bosh menu`. Foydalanuvchi ro'yxatda yo'q nomni
yozsa, o'sha nom bilan yangi yo'nalish `Yangi` holatida yaratiladi —
u admin panelda faollashtirilmaguncha boshqa foydalanuvchilarga
ko'rinmaydi, lekin ariza o'sha yo'nalishga biriktiriladi.

**Fayllar.** Ixtiyoriy, bir nechta bo'lishi mumkin. `O'tkazib yuborish`
tugmasi bosilsa ariza darhol saqlanadi. Fayl yuborilsa, albomdagi qolgan
fayllar kelishi uchun `FILE_COLLECT_WINDOW_MS` (standart 2 soniya) kutiladi
va so'nggi fayldan keyin ariza avtomatik saqlanadi. Fayllar Telegram
serveridan yuklab olinib, shu serverning diskiga yoziladi.

> Eslatma: polling rejimida updatelar ketma-ket qayta ishlanadi, shuning
> uchun fayllarni to'plashda poyga bo'lmaydi. Webhook rejimida so'rovlar
> parallel kelishi mumkin.

## Arizalarim

`Arizalarim` → holat tugmalari (`Yangi`, `Jarayonda`, `Tugallangan`) va
`Bosh menu`. Tanlangan holatdagi arizalar raqami, yo'nalishi va matni bilan
ro'yxat qilib yuboriladi.

## API

Barcha `/api` manzillari (`/health` va `/auth/login` dan tashqari)
`Authorization: Bearer <token>` talab qiladi.

| Manzil | Vazifasi |
| --- | --- |
| `POST /api/auth/login` | login va parol → JWT token |
| `GET /api/auth/me` | joriy admin |
| `PATCH /api/auth/profile` | login, F.I.Sh., parolni o'zgartirish |
| `GET /api/stats/overview` | bosh sahifa statistikasi |
| `GET /api/applications` | arizalar (`status`, `direction`, `search`, `page`) |
| `GET /api/applications/:id` | bitta ariza |
| `PATCH /api/applications/:id` | ariza holatini o'zgartirish |
| `GET /api/organizations` | tashkilotlar (`search`, `page`) |
| `GET /api/organizations/:id` | tashkilot + uning arizalari |
| `GET /api/directions` | barcha yo'nalishlar |
| `POST /api/directions` | yangi yo'nalish (darhol `Faol`) |
| `PATCH /api/directions/:id` | nom yoki holatni o'zgartirish |

## Admin hisobi

Birinchi ishga tushishda `.env` dagi `ADMIN_LOGIN` va `ADMIN_PASSWORD`
bilan bitta admin yaratiladi. Keyin admin panelning **Profil** bo'limidan
o'zgartiriladi — `.env` dagi qiymatlar qayta yozilmaydi (yaratish faqat
baza bo'sh bo'lganda ishlaydi).

`JWT_SECRET` majburiy. Yaratish: `openssl rand -hex 32`.

## Admin panel bilan bog'lanish

Admin panel alohida loyiha. CORS `CORS_ORIGIN` orqali sozlanadi — bir
nechta manzilni vergul bilan ajratib yozish mumkin.
