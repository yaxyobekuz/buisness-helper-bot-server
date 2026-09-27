import { APPLICATION_STATUSES } from '../constants.js';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';

/** Grafikda ko'rsatiladigan kunlar soni. */
const CHART_DAYS = 30;

/**
 * Serverning vaqt mintaqasi. Kunlarni guruhlashda MongoDB ham, JS ham
 * aynan shu mintaqadan foydalanishi shart — aks holda UTC ga o'tishda
 * kunlar siljib, kalitlar mos kelmay qoladi.
 */
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** Sanani mahalliy mintaqada YYYY-MM-DD ko'rinishiga keltiradi. */
function toDayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export async function overview(req, res) {
  const since = new Date();
  since.setDate(since.getDate() - (CHART_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [byStatus, totals, daily, recent] = await Promise.all([
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Promise.all([Application.countDocuments(), User.countDocuments()]),
    Application.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIMEZONE } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Application.find()
      .populate('user', 'username firstName')
      .sort({ number: -1 })
      .limit(5)
      .lean(),
  ]);

  const statusMap = new Map(byStatus.map((row) => [row._id, row.count]));
  const [applications, entrepreneurs] = totals;

  res.json({
    success: true,
    totals: { applications, entrepreneurs },
    byStatus: APPLICATION_STATUSES.map((status) => ({
      status,
      count: statusMap.get(status) ?? 0,
    })),
    daily: fillDays(since, daily),
    recent: recent.map((item) => ({
      _id: item._id,
      number: item.number,
      status: item.status,
      fullName: item.fullName,
      content: item.content,
      createdAt: item.createdAt,
    })),
  });
}

/** Bo'sh kunlarni nol bilan to'ldiradi — grafik uzluksiz bo'lishi uchun. */
function fillDays(since, rows) {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  const days = [];
  const cursor = new Date(since);

  for (let index = 0; index < CHART_DAYS; index += 1) {
    const key = toDayKey(cursor);

    days.push({ date: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
