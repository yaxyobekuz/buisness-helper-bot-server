import { APPLICATION_STATUSES } from '../constants.js';
import { Application } from '../models/application.model.js';
import { ApiError } from '../utils/api-error.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (APPLICATION_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const search = escapeRegExp(String(req.query.search).trim());
    const asNumber = Number(req.query.search);

    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      ...(Number.isInteger(asNumber) ? [{ number: asNumber }] : []),
    ];
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate('user', 'telegramId username firstName lastName')
      .sort({ number: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
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
