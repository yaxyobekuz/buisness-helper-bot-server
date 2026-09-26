export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message = "Noto'g'ri so'rov", details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Avtorizatsiyadan o'tilmagan") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Ruxsat yo'q") {
    return new ApiError(403, message);
  }

  static notFound(message = "Topilmadi") {
    return new ApiError(404, message);
  }

  static conflict(message = "Bunday yozuv allaqachon mavjud", details) {
    return new ApiError(409, message, details);
  }

  static internal(message = "Serverda xatolik") {
    return new ApiError(500, message);
  }
}
