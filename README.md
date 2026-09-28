# Tadbirkorga ko'mak — server

npm paketi: `tadbirkorga-komak-server`

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
├── routes/               API manzillari
├── services/             biznes mantiq (ariza, admin)
├── middlewares/          Express oraliq qatlamlari (auth, xatolar)
├── constants.js          ariza holatlari ro'yxati
└── utils/                logger, ApiError, telefon formatlash
```

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

## Tadbirkorlar

Botga `/start` bosgan foydalanuvchi avtomatik tadbirkor sifatida saqlanadi —
alohida ro'yxatdan o'tish yo'q. Telegram bergan ma'lumot (id, username, ism,
familiya) o'sha zahoti yoziladi.

Tadbirkor kartochkasidagi F.I.Sh., manzil va telefon uning **oxirgi
arizasidan** ko'chiriladi — panelda uni tanib olish uchun.

## Ariza berish oqimi

`Ariza berish` → F.I.Sh. → manzil → telefon → murojaat mazmuni → saqlanadi.

Har bir qadam `src/bot/scenes/application.js` dagi massivda belgilangan —
tartibni o'zgartirish yoki yangi qadam qo'shish uchun shu massivni
tahrirlash kifoya. Joriy qadam foydalanuvchi hujjatining `session.step`
maydonida saqlanadi, shuning uchun server qayta ishga tushsa ham oqim
to'xtagan joyidan davom etadi. Har qanday qadamda `Bosh menu` tugmasi
oqimdan chiqaradi.

Telefon raqam turli ko'rinishda kiritilishi mumkin (`931234567`,
`93 123 45 67`, `+998 93 123 45 67`, `00998...`) va `+998XXXXXXXXX`
ko'rinishiga keltirilib saqlanadi. Qolgan matnli qadamlar kamida 3 ta
belgidan iborat bo'lishi kerak (`MIN_TEXT_LENGTH`). Shartga mos kelmasa bot
`Ma'lumot noto'g'ri` deb javob beradi va o'sha qadamda qoladi.

## Arizalarim

`Arizalarim` → holat tugmalari (`Yangi`, `Jarayonda`, `Tugallangan`) va
`Bosh menu`. Tanlangan holatdagi arizalar raqami va matni bilan ro'yxat
qilib yuboriladi.

## API

Barcha `/api` manzillari (`/health` va `/auth/login` dan tashqari)
`Authorization: Bearer <token>` talab qiladi.

| Manzil | Vazifasi |
| --- | --- |
| `POST /api/auth/login` | login va parol → JWT token |
| `GET /api/auth/me` | joriy admin |
| `PATCH /api/auth/profile` | login, F.I.Sh., parolni o'zgartirish |
| `GET /api/stats/overview` | bosh sahifa statistikasi |
| `GET /api/applications` | arizalar (`status`, `search`, `page`, `deleted`) |
| `GET /api/applications/export` | xlsx (`status`, `deleted`, `from`, `to`) |
| `GET /api/applications/:id` | bitta ariza |
| `PATCH /api/applications/:id` | ariza holatini o'zgartirish |
| `DELETE /api/applications/:id` | arizani yashirish (soft delete) |
| `POST /api/applications/:id/restore` | arizani tiklash |
| `GET /api/entrepreneurs` | tadbirkorlar (`search`, `page`, `deleted`) |
| `GET /api/entrepreneurs/export` | xlsx (`deleted`, `from`, `to`) |
| `GET /api/entrepreneurs/:id` | tadbirkor + uning arizalari |
| `DELETE /api/entrepreneurs/:id` | tadbirkorni va arizalarini yashirish |
| `POST /api/entrepreneurs/:id/restore` | tadbirkorni tiklash |

## O'chirish (soft delete)

Hech narsa bazadan butunlay o'chirilmaydi — `deletedAt` maydoni
to'ldiriladi va yozuv ro'yxatlardan, statistikadan hamda botdan
yashiriladi. Ro'yxatlarda `?deleted=1` bilan ularni ko'rish va tiklash
mumkin.

- **Ariza o'chirilsa** — faqat o'sha ariza yashiriladi.
- **Tadbirkor o'chirilsa** — u va uning arizalari yashiriladi; bu arizalarga
  `deletedWithUser` belgisi qo'yiladi.
- **Tadbirkor tiklansa** — u va `deletedWithUser` belgili arizalari qaytadi.
  Alohida o'chirilgan arizalar o'chirilganicha qoladi.
- **O'chirilgan tadbirkor botga qayta yozsa** — avtomatik tiklanadi (aks
  holda bot u uchun ishlamay qolardi), arizalari ham xuddi shu qoida
  bo'yicha qaytadi.

## Excelga eksport

`/export` manzillari `exceljs` orqali xlsx qaytaradi. Sahifalash qo'llanmaydi —
filtrga mos kelgan hamma yozuv chiqadi.

| Parametr | Qiymatlari |
| --- | --- |
| `status` | `Yangi`, `Jarayonda`, `Tugallangan` (faqat arizalarda) |
| `deleted` | bo'sh — faqat faol, `1` — faqat o'chirilgan, `all` — hammasi |
| `from`, `to` | `YYYY-MM-DD`, mahalliy vaqt bo'yicha to'liq kun |

Admin panel bu manzillarga to'g'ridan-to'g'ri murojaat qilmaydi: token
HTTP-only cookie da bo'lgani uchun so'rov Next.js route handleri
(`/api/export/...`) orqali o'tadi.

## Admin hisobi

Birinchi ishga tushishda `.env` dagi `ADMIN_LOGIN` va `ADMIN_PASSWORD`
bilan bitta admin yaratiladi. Keyin admin panelning **Profil** bo'limidan
o'zgartiriladi — `.env` dagi qiymatlar qayta yozilmaydi (yaratish faqat
baza bo'sh bo'lganda ishlaydi).

`JWT_SECRET` majburiy. Yaratish: `openssl rand -hex 32`.

## Admin panel bilan bog'lanish

Admin panel alohida loyiha. CORS `CORS_ORIGIN` orqali sozlanadi — bir
nechta manzilni vergul bilan ajratib yozish mumkin.
