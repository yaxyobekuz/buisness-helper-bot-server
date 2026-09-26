import { APPLICATION_STATUSES } from '../constants.js';
import { env } from '../config/env.js';
import { Application } from '../models/application.model.js';
import { ApiError } from '../utils/api-error.js';

function withFileUrls(application) {
  return {
    ...application,
    files: (application.files ?? []).map((file) => ({
      ...file,
      url: `${env.upload.publicUrl}${env.upload.routePath}/${file.fileName}`,
    })),
  };
}

export async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (req.query.status && APPLICATION_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  if (req.query.direction) {
    filter.direction = req.query.direction;
  }

  if (req.query.search) {
    const search = String(req.query.search).trim();
    const asNumber = Number(search);

    filter.$or = [
      { content: { $regex: search, $options: 'i' } },
      ...(Number.isInteger(asNumber) ? [{ number: asNumber }] : []),
    ];
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate('direction', 'name status')
      .populate('user', 'organizationName activityType phone directorFullName')
      .sort({ number: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items: items.map(withFileUrls),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req, res) {
  const application = await Application.findById(req.params.id)
    .populate('direction', 'name status')
    .populate('user')
    .lean();

  if (!application) {
    throw ApiError.notFound('Ariza topilmadi');
  }

  res.json({ success: true, item: withFileUrls(application) });
}

export async function updateStatus(req, res) {
  const { status } = req.body ?? {};

  if (!APPLICATION_STATUSES.includes(status)) {
    throw ApiError.badRequest("Holat noto'g'ri");
  }

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  )
    .populate('direction', 'name status')
    .populate('user')
    .lean();

  if (!application) {
    throw ApiError.notFound('Ariza topilmadi');
  }

  res.json({ success: true, item: withFileUrls(application) });
}
