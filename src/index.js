const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const paymentRoutes = require('./routes/payment');
const refundRoutes = require('./routes/refund');

const app = express();

// Raw body'yi HMAC doğrulaması için sakla
app.use((req, res, next) => {
  let raw = [];
  req.on('data', (chunk) => raw.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(raw);
    next();
  });
});

app.use(express.json());
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/payment', paymentRoutes);
app.use('/refund', refundRoutes);

// Genel hata yakalayıcı
app.use((err, _req, res, _next) => {
  console.error('[uncaught]', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

app.listen(config.port, () => {
  console.log(`Tami-Shopify middleware çalışıyor: port ${config.port} (${config.nodeEnv})`);
});

module.exports = app;
