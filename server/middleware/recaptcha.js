// server/middleware/recaptcha.js
const axios = require('axios');

module.exports = function recaptcha() {
  return async (req, res, next) => {
    try {
      const secret = process.env.RECAPTCHA_SECRET || '';
      const required = (process.env.RECAPTCHA_REQUIRED || 'true') !== 'false';
      const devBypassToken = process.env.RECAPTCHA_DEV_TOKEN || 'test';

      // Không cấu hình secret hoặc đã tắt bắt buộc → bỏ qua
      if (!secret || !required) return next();

      const token =
        req.body?.recaptchaToken ||
        req.headers['x-recaptcha'] ||
        req.query?.recaptchaToken;

      // Cho phép bypass trong dev
      if (token === devBypassToken) return next();

      if (!token) return res.status(400).json({ error: 'missing_recaptcha' });

      const params = new URLSearchParams();
      params.append('secret', secret);
      params.append('response', token);

      const { data } = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        params
      );

      if (!data.success) return res.status(403).json({ error: 'recaptcha_failed' });
      if (typeof data.score === 'number' && data.score < 0.5) {
        return res.status(403).json({ error: 'recaptcha_low_score' });
      }
      next();
    } catch (e) {
      return res.status(500).json({ error: 'recaptcha_error' });
    }
  };
};
