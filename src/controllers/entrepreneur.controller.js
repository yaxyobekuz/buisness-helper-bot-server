import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import {
  buildWorkbook,
  dateRangeFilter,
  exportFileName,
  sendWorkbook,
} from '../services/export.service.js';
import { ApiError } from '../utils/api-error.js';

const dateFormatter = new Intl.DateTimeFormat('uz-UZ', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : '';
}

/** `deleted` parametri: '1' — faqat o'chirilganlar, 'all' — hammasi, aks holda faqat faollar. */
function deletedFilter(value) {
  if (value === '1') return { deletedAt: { $ne: null } };
  if (value === 'all') return {};

  return { deletedAt: null };
}

const PUBLIC_FIELDS =
  'telegramId username firstName lastName fullName address phone createdAt deletedAt';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  // Qidiruv ikkala ko'rinishga ham baravar tegishli.
  const base = {};

  if (req.query.search) {
    const search = escapeRegExp(String(req.query.search).trim());
    const regex = { $regex: search, $options: 'i' };

    base.$or = [
      { fullName: regex },
      { firstName: regex },
      { lastName: regex },
      { username: regex },
      { phone: regex },
    ];
  }

  const [items, active, deleted] = await Promise.all([
    User.find({ ...base, ...deletedFilter(req.query.deleted) })
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments({ ...base, deletedAt: null }),
    User.countDocuments({ ...base, deletedAt: { $ne: null } }),
  ]);

  const total = req.query.deleted === '1' ? deleted : active;

  const counts = await Application.aggregate([
    { $match: { user: { $in: items.map((item) => item._id) } , deletedAt: null } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);

  const countByUser = new Map(counts.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    items: items.map((item) => ({
      ...item,
      applicationsCount: countByUser.get(String(item._id)) ?? 0,
    })),
    counts: { active, deleted },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req, res) {
  const entrepreneur = await User.findById(req.params.id).select(PUBLIC_FIELDS).lean();

  if (!entrepreneur) {
    throw ApiError.notFound('Tadbirkor topilmadi');
  }

  const applications = await Application.find({
    user: entrepreneur._id,
    ...(entrepreneur.deletedAt ? {} : { deletedAt: null }),
  })
    .sort({ number: -1 })
    .lean();

  res.json({ success: true, item: entrepreneur, applications });
}

/** Tadbirkorni va uning arizalarini yashiradi. */
export async function softDelete(req, res) {
  const entrepreneur = await User.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  )
    .select(PUBLIC_FIELDS)
    .lean();

  if (!entrepreneur) {
    throw ApiError.notFound("Tadbirkor topilmadi yoki allaqachon o'chirilgan");
  }

  await Application.updateMany(
    { user: entrepreneur._id, deletedAt: null },
    { $set: { deletedAt: new Date(), deletedWithUser: true } },
  );

  res.json({ success: true, item: entrepreneur });
}

/** Tadbirkorni va u bilan birga o'chirilgan arizalarni qaytaradi. */
export async function restore(req, res) {
  const entrepreneur = await User.findOneAndUpdate(
    { _id: req.params.id, deletedAt: { $ne: null } },
    { $set: { deletedAt: null } },
    { new: true },
  )
    .select(PUBLIC_FIELDS)
    .lean();

  if (!entrepreneur) {
    throw ApiError.notFound("Tadbirkor topilmadi yoki o'chirilmagan");
  }

  await Application.updateMany(
    { user: entrepreneur._id, deletedWithUser: true },
    { $set: { deletedAt: null, deletedWithUser: false } },
  );

  res.json({ success: true, item: entrepreneur });
}

/** Filtrlarga mos tadbirkorlarni xlsx qilib qaytaradi. */
export async function exportXlsx(req, res) {
  const filter = {
    ...deletedFilter(req.query.deleted),
    ...dateRangeFilter(req.query.from, req.query.to),
  };

  const items = await User.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: 1 }).lean();

  const counts = await Application.aggregate([
    { $match: { user: { $in: items.map((item) => item._id) }, deletedAt: null } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);

  const countByUser = new Map(counts.map((row) => [String(row._id), row.count]));

  const buffer = await buildWorkbook({
    sheetName: 'Tadbirkorlar',
    columns: [
      { header: 'F.I.Sh.', key: 'fullName', width: 30 },
      { header: 'Telefon', key: 'phone', width: 18 },
      { header: 'Manzil', key: 'address', width: 30 },
      { header: 'Telegram ismi', key: 'telegramName', width: 24 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Telegram ID', key: 'telegramId', width: 14 },
      { header: 'Arizalar soni', key: 'applicationsCount', width: 14 },
      { header: "Qo'shilgan sana", key: 'createdAt', width: 18 },
      { header: "O'chirilgan sana", key: 'deletedAt', width: 18 },
    ],
    rows: items.map((item) => ({
      fullName: item.fullName ?? '',
      phone: item.phone ?? '',
      address: item.address ?? '',
      telegramName: [item.firstName, item.lastName].filter(Boolean).join(' '),
      username: item.username ? `@${item.username}` : '',
      telegramId: item.telegramId,
      applicationsCount: countByUser.get(String(item._id)) ?? 0,
      createdAt: formatDate(item.createdAt),
      deletedAt: formatDate(item.deletedAt),
    })),
  });

  sendWorkbook(res, buffer, exportFileName('tadbirkorlar'));
}
