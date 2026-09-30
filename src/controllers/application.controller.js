import { APPLICATION_STATUSES } from '../constants.js';
import { Application } from '../models/application.model.js';
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  // Qidiruv va holat filtri — ikkala ko'rinishga ham baravar tegishli.
  const base = {};

  if (APPLICATION_STATUSES.includes(req.query.status)) {
    base.status = req.query.status;
  }

  if (req.query.search) {
    const search = escapeRegExp(String(req.query.search).trim());
    const asNumber = Number(req.query.search);

    base.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      ...(Number.isInteger(asNumber) ? [{ number: asNumber }] : []),
    ];
  }

  const [items, active, deleted] = await Promise.all([
    Application.find({ ...base, ...deletedFilter(req.query.deleted) })
      .populate('user', 'telegramId username firstName lastName')
      .sort({ number: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments({ ...base, deletedAt: null }),
    Application.countDocuments({ ...base, deletedAt: { $ne: null } }),
  ]);

  const total = req.query.deleted === '1' ? deleted : active;

  res.json({
    success: true,
    items,
    counts: { active, deleted },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req, res) {
  const application = await Application.findById(req.params.id).populate('user').lean();

  if (!application) {
    throw ApiError.notFound('Ariza topilmadi');
  }

  res.json({ success: true, item: application });
}

export async function updateStatus(req, res) {
  const { status } = req.body ?? {};

  if (!APPLICATION_STATUSES.includes(status)) {
    throw ApiError.badRequest("Holat noto'g'ri");
  }

  const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('user')
    .lean();

  if (!application) {
    throw ApiError.notFound('Ariza topilmadi');
  }

  res.json({ success: true, item: application });
}

export async function softDelete(req, res) {
  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { $set: { deletedAt: new Date(), deletedWithUser: false } },
    { new: true },
  ).lean();

  if (!application) {
    throw ApiError.notFound("Ariza topilmadi yoki allaqachon o'chirilgan");
  }

  res.json({ success: true, item: application });
}

export async function restore(req, res) {
  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, deletedAt: { $ne: null } },
    { $set: { deletedAt: null, deletedWithUser: false } },
    { new: true },
  ).lean();

  if (!application) {
    throw ApiError.notFound("Ariza topilmadi yoki o'chirilmagan");
  }

  res.json({ success: true, item: application });
}

/**
 * Filtrlarga mos arizalarni xlsx qilib qaytaradi.
 * Sahifalash yo'q — mos kelgan hamma yozuv chiqadi.
 */
export async function exportXlsx(req, res) {
  const filter = { ...deletedFilter(req.query.deleted), ...dateRangeFilter(req.query.from, req.query.to) };

  if (APPLICATION_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const items = await Application.find(filter)
    .populate('user', 'username firstName lastName telegramId')
    .sort({ number: 1 })
    .lean();

  const buffer = await buildWorkbook({
    sheetName: 'Arizalar',
    columns: [
      { header: '№', key: 'number', width: 8 },
      { header: 'F.I.Sh.', key: 'fullName', width: 30 },
      { header: 'Telefon', key: 'phone', width: 18 },
      { header: 'Manzil', key: 'address', width: 30 },
      { header: 'Murojaat mazmuni', key: 'content', width: 60 },
      { header: 'Holati', key: 'status', width: 14 },
      { header: 'Telegram', key: 'telegram', width: 20 },
      { header: 'Yuborilgan sana', key: 'createdAt', width: 18 },
      { header: "O'chirilgan sana", key: 'deletedAt', width: 18 },
    ],
    rows: items.map((item) => ({
      number: item.number,
      fullName: item.fullName ?? '',
      phone: item.phone ?? '',
      address: item.address ?? '',
      content: item.content ?? '',
      status: item.status,
      telegram: item.user?.username
        ? `@${item.user.username}`
        : [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' '),
      createdAt: formatDate(item.createdAt),
      deletedAt: formatDate(item.deletedAt),
    })),
  });

  sendWorkbook(res, buffer, exportFileName('arizalar'));
}
