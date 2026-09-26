import { Admin, hashPassword } from '../models/admin.model.js';
import { signToken } from '../middlewares/auth.js';
import { ApiError } from '../utils/api-error.js';

function toPublic(admin) {
  return { id: admin._id, login: admin.login, fullName: admin.fullName };
}

export async function login(req, res) {
  const { login: adminLogin, password } = req.body ?? {};

  if (!adminLogin || !password) {
    throw ApiError.badRequest('Login va parol kiritilishi shart');
  }

  const admin = await Admin.findOne({ login: String(adminLogin).trim() });

  if (!admin || !(await admin.verifyPassword(String(password)))) {
    throw ApiError.unauthorized("Login yoki parol noto'g'ri");
  }

  res.json({ success: true, token: signToken(admin), admin: toPublic(admin) });
}

export async function me(req, res) {
  res.json({ success: true, admin: toPublic(req.admin) });
}

export async function updateProfile(req, res) {
  const { login: newLogin, fullName, currentPassword, newPassword } = req.body ?? {};
  const admin = req.admin;

  if (newPassword) {
    if (!currentPassword || !(await admin.verifyPassword(String(currentPassword)))) {
      throw ApiError.badRequest("Joriy parol noto'g'ri");
    }

    if (String(newPassword).length < 6) {
      throw ApiError.badRequest("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
    }

    admin.passwordHash = await hashPassword(String(newPassword));
  }

  if (newLogin && String(newLogin).trim() !== admin.login) {
    const trimmed = String(newLogin).trim();

    if (trimmed.length < 3) {
      throw ApiError.badRequest("Login kamida 3 ta belgidan iborat bo'lishi kerak");
    }

    if (await Admin.exists({ login: trimmed, _id: { $ne: admin._id } })) {
      throw ApiError.conflict('Bunday login band');
    }

    admin.login = trimmed;
  }

  if (fullName !== undefined) {
    admin.fullName = fullName ? String(fullName).trim() : null;
  }

  await admin.save();

  res.json({ success: true, admin: toPublic(admin) });
}
