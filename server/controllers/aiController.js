// controllers/aiController.js
const axios = require('axios');
const https = require('https');
const http = require('http');

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_TIMEOUT_MS = Number(process.env.DIFY_TIMEOUT_MS || 8000);
const DIFY_SUGGEST_PREFIX = process.env.DIFY_SUGGEST_PREFIX || 'gợi ý: ';
const CACHE_TTL_MS = Number(process.env.SUGGEST_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const USE_DATAMUSE = String(process.env.SUGGEST_USE_DATAMUSE || '1') === '1';

// Keep-alive để giảm handshake
const httpsAgent = new https.Agent({ keepAlive: true });
const httpAgent = new http.Agent({ keepAlive: true });

/* ---------------- Utils làm sạch từ ---------------- */
function cleanWord(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();

  // bỏ số thứ tự/ký hiệu đầu dòng
  s = s.replace(/^\s*(?:\d+(?:[.):-])|[-*•])\s*/, '');

  // lấy vế trái trước nghĩa
  s = s.split(/\s[-–—:]\s/)[0].trim();

  // bỏ ngoặc kép dư
  s = s.replace(/^[`"'“”]+|[`"'“”]+$/g, '').trim();

  // bỏ dòng có ký tự ngoài ASCII (thường là câu mô tả TV)
  if (/[^\x00-\x7F]/.test(s)) return '';

  // tối đa 3 token
  s = s.split(/\s+/).slice(0, 3).join(' ').trim();

  // chỉ nhận chữ cái + khoảng trắng + apostrophe/gạch ngang
  if (!/^[A-Za-z][A-Za-z\s'’-]{0,40}$/.test(s)) return '';

  return s;
}

function extractSuggestions(anything, prefix = '') {
  const findText = (obj) => {
    if (typeof obj === 'string') return obj;
    if (!obj || typeof obj !== 'object') return '';
    for (const k of Object.keys(obj)) {
      const got = findText(obj[k]);
      if (got) return got;
    }
    return '';
  };

  const text = findText(anything) || '';

  // Ưu tiên JSON {"suggestions":[...]}
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let rawList = [];
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) rawList = parsed;
      else if (Array.isArray(parsed?.suggestions)) rawList = parsed.suggestions;
      else if (Array.isArray(parsed?.data)) rawList = parsed.data;
    } catch {}
  }
  if (rawList.length === 0) rawList = text.split(/\r?\n/).filter(Boolean);

  // làm sạch + khử trùng
  const seen = new Set();
  let cleaned = [];
  for (const item of rawList) {
    const w = cleanWord(item);
    if (!w) continue;
    const k = w.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    cleaned.push(w);
    if (cleaned.length >= 24) break;
  }

  // lọc theo tiền tố người gõ (nếu có)
  const pref = (prefix || '').toLowerCase().trim();
  if (pref) {
    const filtered = cleaned.filter(w => w.toLowerCase().startsWith(pref));
    if (filtered.length) cleaned = filtered;
  }

  return cleaned.slice(0, 8);
}

/* ---------------- Cache đơn giản (TTL) ---------------- */
const cache = new Map();    // key -> { t, v }
const inFlight = new Map(); // key -> Promise

function getCache(key) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() - v.t > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return v.v;
}
function setCache(key, val) {
  cache.set(key, { t: Date.now(), v: val });
  if (cache.size > 800) cache.delete(cache.keys().next().value);
}

/* ---------------- Fallback Datamuse (rất nhanh) ---------------- */
async function datamuseSuggest(term) {
  try {
    const { data } = await axios.get('https://api.datamuse.com/sug', {
      params: { s: term, max: 8 },
      timeout: 2500,
      httpAgent,
      httpsAgent,
    });
    const out = [];
    const seen = new Set();
    for (const it of data || []) {
      const w = cleanWord(it?.word);
      if (!w) continue;
      const k = w.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(w);
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

/* ---------------- Gọi Chatflow qua /chat-messages ---------------- */
async function callDifyChatflow({ term, topic, src, dst }) {
  const headers = {
    Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    inputs: {
      class_name: term,
      keyword: term,
      topic,
      src_lang: src,
      dst_lang: dst,
    },
    // BẮT BUỘC với Chatflow: query ở level gốc
    query: `${DIFY_SUGGEST_PREFIX}${term}`, // ép vào nhánh “gợi ý”
    response_mode: 'blocking',
    user: 'flashcard-web',
  };

  const { data } = await axios.post(
    `${DIFY_BASE_URL}/chat-messages`,
    payload,
    { headers, timeout: DIFY_TIMEOUT_MS, httpAgent, httpsAgent }
  );
  return { answer: data?.answer ?? '' };
}

/* ---------------- Controller ---------------- */
exports.suggestTerms = async (req, res) => {
  try {
    const term = String(req.query.term || '').trim();
    const topic = String(req.query.topic || '').trim();
    const src = String(req.query.src || 'en').trim();
    const dst = String(req.query.dst || 'vi').trim();

    if (!term) return res.json({ suggestions: [] });

    const key = `${term}|${topic}|${src}|${dst}`;
    const cached = getCache(key);
    if (cached) return res.json({ suggestions: cached });

    if (inFlight.has(key)) {
      const r = await inFlight.get(key);
      return res.json({ suggestions: r });
    }

    const p = (async () => {
      let difyRes;
      try {
        difyRes = await callDifyChatflow({ term, topic, src, dst });
      } catch (e) {
        // Nếu Chatflow lỗi (ví dụ: credentials chưa init), fallback
        console.error('Dify suggest error:', e?.response?.data || e.message);
        if (USE_DATAMUSE) {
          const fb = await datamuseSuggest(term);
          setCache(key, fb);
          return fb;
        }
        // không fallback thì trả mảng rỗng
        return [];
      }

      let suggestions = extractSuggestions(difyRes, term);

      if (USE_DATAMUSE && suggestions.length < 2) {
        const fb = await datamuseSuggest(term);
        const set = new Set(suggestions.map(s => s.toLowerCase()));
        for (const w of fb) {
          if (!set.has(w.toLowerCase())) suggestions.push(w);
          if (suggestions.length >= 8) break;
        }
      }

      setCache(key, suggestions);
      return suggestions;
    })();

    inFlight.set(key, p);
    const out = await p.finally(() => inFlight.delete(key));

    return res.json({ suggestions: out });
  } catch (err) {
    console.error('Suggest fatal error:', err?.response?.data || err.message);
    return res.status(200).json({ suggestions: [] });
  }
};
