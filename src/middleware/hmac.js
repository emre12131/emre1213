const crypto = require('crypto');
const config = require('../config');

/**
 * Shopify'ın imzaladığı webhook/ödeme isteklerini doğrular.
 * Shopify, HMAC-SHA256 imzasını 'X-Shopify-Hmac-Sha256' header'ında gönderir.
 */
function verifyShopifyHmac(req, res, next) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  if (!hmacHeader) {
    return res.status(401).json({ error: 'HMAC header eksik' });
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return res.status(400).json({ error: 'Raw body bulunamadı' });
  }

  const expected = crypto
    .createHmac('sha256', config.shopify.apiSecret)
    .update(rawBody)
    .digest('base64');

  const valid = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(hmacHeader)
  );

  if (!valid) {
    return res.status(401).json({ error: 'HMAC doğrulaması başarısız' });
  }

  next();
}

module.exports = { verifyShopifyHmac };
