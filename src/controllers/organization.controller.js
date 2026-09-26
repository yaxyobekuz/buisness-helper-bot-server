import { ACTIVITY_TYPES } from '../constants.js';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

const PUBLIC_FIELDS =
  'telegramId username organizationName activityType directorFullName address inn phone isRegistered createdAt';

export async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = { isRegistered: true };

  if (ACTIVITY_TYPES.includes(req.query.activityType)) {
    filter.activityType = req.query.activityType;
  }

  if (req.query.search) {
    const search = String(req.query.search).trim();

    filter.$or = [
      { organizationName: { $regex: search, $options: 'i' } },
      { directorFullName: { $regex: search, $options: 'i' } },
      { inn: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const counts = await Application.aggregate([
    { $match: { user: { $in: items.map((item) => item._id) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);

  const countByUser = new Map(counts.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    items: items.map((item) => ({ ...item, applicationsCount: countByUser.get(String(item._id)) ?? 0 })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req, res) {
  const organization = await User.findById(req.params.id).select(PUBLIC_FIELDS).lean();

  if (!organization) {
    throw ApiError.notFound('Tashkilot topilmadi');
  }

  const applications = await Application.find({ user: organization._id })
    .populate('direction', 'name')
    .sort({ number: -1 })
    .lean();

  res.json({ success: true, item: organization, applications });
}
