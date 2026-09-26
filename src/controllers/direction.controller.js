import { DIRECTION_STATUS, DIRECTION_STATUSES } from '../constants.js';
import { Application } from '../models/application.model.js';
import { Direction } from '../models/direction.model.js';
import { ApiError } from '../utils/api-error.js';

export async function list(req, res) {
  const items = await Direction.find().sort({ createdAt: -1 }).lean();

  const counts = await Application.aggregate([
    { $group: { _id: '$direction', count: { $sum: 1 } } },
  ]);

  const countByDirection = new Map(counts.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    items: items.map((item) => ({
      ...item,
      applicationsCount: countByDirection.get(String(item._id)) ?? 0,
    })),
  });
}

export async function create(req, res) {
  const name = String(req.body?.name ?? '').trim().replace(/\s+/g, ' ');

  if (name.length < 2) {
    throw ApiError.badRequest("Yo'nalish nomi juda qisqa");
  }

  if (await Direction.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
    throw ApiError.conflict("Bunday yo'nalish allaqachon mavjud");
  }

  // Admin panel orqali qo'shilgan yo'nalish darhol faol bo'ladi.
  const direction = await Direction.create({ name, status: DIRECTION_STATUS.active });

  res.status(201).json({ success: true, item: direction.toObject() });
}

export async function update(req, res) {
  const direction = await Direction.findById(req.params.id);

  if (!direction) {
    throw ApiError.notFound("Yo'nalish topilmadi");
  }

  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim().replace(/\s+/g, ' ');

    if (name.length < 2) {
      throw ApiError.badRequest("Yo'nalish nomi juda qisqa");
    }

    if (await Direction.exists({ name, _id: { $ne: direction._id } })) {
      throw ApiError.conflict("Bunday yo'nalish allaqachon mavjud");
    }

    direction.name = name;
  }

  if (req.body?.status !== undefined) {
    if (!DIRECTION_STATUSES.includes(req.body.status)) {
      throw ApiError.badRequest("Holat noto'g'ri");
    }

    direction.status = req.body.status;
  }

  await direction.save();

  res.json({ success: true, item: direction.toObject() });
}
