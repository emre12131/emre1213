const express = require('express');
const router = express.Router();
const tami = require('../services/tami');
const shopify = require('../services/shopify');
const { verifyShopifyHmac } = require('../middleware/hmac');

/**
 * POST /refund
 * Shopify, iade talebinde bu endpoint'i çağırır.
 */
router.post('/', verifyShopifyHmac, async (req, res) => {
  const {
    id: refundSessionId,
    gid,
    payment_id: shopifyPaymentId,
    amount,
    currency,
    merchant_data: merchantData,
  } = req.body;

  const sessionId = refundSessionId || gid;

  // merchantData içinde Tami session ID'sini saklıyoruz (payment oluşturulurken set edilmeli)
  // TODO: tamiSessionId'yi kendi persistance çözümünüzden alın (DB, Redis vb.)
  const tamiSessionId = merchantData?.tamiSessionId;

  if (!tamiSessionId) {
    console.error('[refund] Tami session ID bulunamadı:', { shopifyPaymentId, merchantData });
    await shopify.rejectRefundSession(sessionId, 'PROCESSING_ERROR');
    return res.status(422).json({ error: 'Tami session ID bulunamadı' });
  }

  try {
    await tami.createRefund({
      tamiSessionId,
      amount,
      reason: `Shopify iade — ${shopifyPaymentId}`,
    });

    await shopify.resolveRefundSession(sessionId);
    res.sendStatus(200);
  } catch (err) {
    console.error('[refund] İade başarısız:', err.message);
    await shopify.rejectRefundSession(sessionId, 'PROCESSING_ERROR').catch(() => {});
    res.status(502).json({ error: 'İade işlemi başarısız' });
  }
});

module.exports = router;
