// server/middleware/rateLimitReports.js
const rateLimit = require('express-rate-limit');

const ipKeyGen =
  (rateLimit && rateLimit.ipKeyGenerator) ? rateLimit.ipKeyGenerator : (req) => req.ip;

const reportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30,                  // tối đa 30 request / 15'
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const uid = req.user?.id || req.user?._id;
    if (uid) return `u:${uid}`;
    return ipKeyGen(req, res); // an toàn IPv6
  },
});

module.exports = reportsLimiter;
