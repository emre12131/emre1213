const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const tami = require('../services/tami');
const shopify = require('../services/shopify');
const { verifyShopifyHmac } = require('../middleware/hmac');
const config = require('../config');

// Bellek içi session haritası (üretimde Redis kullanın)
const sessionMap = new Map();

/**
 * POST /payment
 * Shopify, müşteri ödeme yöntemini seçtiğinde bu endpoint'i çağırır.
 * Tami'de oturum açar ve ödeme sayfasına yönlendirme URL'si döner.
 */
router.post('/', verifyShopifyHmac, async (req, res) => {
  const {
    id: shopifySessionId,
    gid,
    amount,
    currency,
    customer,
    redirect_url: shopifyRedirectUrl,
    cancel_url: cancelUrl,
  } = req.body;

  const sessionId = shopifySessionId || gid;
  const callbackId = uuidv4();

  try {
    const { paymentUrl, tamiSessionId } = await tami.createPaymentSession({
      orderId: callbackId,
      amount,
      currency,
      successUrl: `${config.app.baseUrl}/payment/return?cb=${callbackId}&status=success`,
      failUrl: `${config.app.baseUrl}/payment/return?cb=${callbackId}&status=fail`,
      callbackUrl: `${config.app.baseUrl}/payment/webhook`,
      customer: {
        name: customer ? `${customer.given_name} ${customer.family_name}` : '',
        email: customer?.email,
        phone: customer?.phone_number,
      },
    });

    sessionMap.set(callbackId, {
      shopifySessionId: sessionId,
      tamiSessionId,
      shopifyRedirectUrl,
      status: 'pending',
      createdAt: Date.now(),
    });

    res.json({ redirect_url: paymentUrl });
  } catch (err) {
    console.error('[payment/create] Tami oturumu başlatılamadı:', err.message);
    res.status(502).json({ error: 'Ödeme oturumu başlatılamadı' });
  }
});

/**
 * POST /payment/webhook
 * Tami, sunucu tarafı ödeme bildirimi (IPN/webhook) için bu endpoint'i çağırır.
 */
router.post('/webhook', express.json(), async (req, res) => {
  // TODO: Tami imza doğrulaması — tami.verifyCallback(req.body, req.headers['x-tami-signature'])
  const { orderId, status } = req.body;

  // TODO: Tami'nin webhook body alanlarını kendi şemasına göre güncelleyin
  const callbackId = orderId || req.body.referenceId || req.body.merchantReference;
  const session = sessionMap.get(callbackId);

  if (!session) {
    console.warn('[payment/webhook] Bilinmeyen session:', callbackId);
    return res.sendStatus(200);
  }

  try {
    const { status: normalizedStatus } = await tami.getPaymentStatus(session.tamiSessionId);

    if (normalizedStatus === 'success') {
      await shopify.resolvePaymentSession(session.shopifySessionId);
      session.status = 'success';
    } else if (normalizedStatus === 'failed') {
      await shopify.rejectPaymentSession(session.shopifySessionId);
      session.status = 'failed';
    }
    // 'pending' durumunda Shopify'ı henüz bilgilendirmiyoruz

    sessionMap.set(callbackId, session);
    res.sendStatus(200);
  } catch (err) {
    console.error('[payment/webhook] Hata:', err.message);
    res.sendStatus(500);
  }
});

/**
 * GET /payment/return
 * Müşteri Tami ödeme sayfasından geri döndüğünde buraya yönlendirilir.
 * Son durumu kontrol eder ve Shopify checkout'una yönlendirir.
 */
router.get('/return', async (req, res) => {
  const { cb: callbackId, status } = req.query;
  const session = sessionMap.get(callbackId);

  if (!session) {
    return res.status(404).send('Oturum bulunamadı.');
  }

  try {
    if (session.status !== 'success' && session.status !== 'failed') {
      const { status: normalizedStatus } = await tami.getPaymentStatus(session.tamiSessionId);

      if (normalizedStatus === 'success') {
        await shopify.resolvePaymentSession(session.shopifySessionId);
        session.status = 'success';
      } else if (normalizedStatus === 'failed') {
        await shopify.rejectPaymentSession(session.shopifySessionId);
        session.status = 'failed';
      }
      sessionMap.set(callbackId, session);
    }
  } catch (err) {
    console.error('[payment/return] Durum kontrolü başarısız:', err.message);
  }

  res.redirect(session.shopifyRedirectUrl);
});

module.exports = router;
