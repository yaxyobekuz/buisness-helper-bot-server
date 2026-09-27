import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

const PUBLIC_FIELDS =
  'telegramId username firstName lastName fullName address phone createdAt deletedAt';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  // Standart holatda o'chirilganlar ko'rinmaydi; ?deleted=1 — faqat o'chirilganlar.
  const filter = req.query.deleted === '1' ? { deletedAt: { $ne: null } } : { deletedAt: null };

  if (req.query.search) {
    const search = escapeRegExp(String(req.query.search).trim());
    const regex = { $regex: search, $options: 'i' };

    filter.$or = [
      { fullName: regex },
      { firstName: regex },
      { lastName: regex },
      { username: regex },
      { phone: regex },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

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
