const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

// ─── TODO: Tami API dokümantasyonuna göre aşağıdaki metodları doldurun ───────
// dev.tami.com.tr/api-katalog adresindeki endpoint adları ve
// request/response şemalarına göre güncellenmesi gerekiyor.

const client = axios.create({
  baseURL: config.tami.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // TODO: Tami'nin beklediği auth header formatını buraya yazın
    // Örnekler:
    //   'Authorization': `Bearer ${config.tami.apiKey}`
    //   'X-API-Key': config.tami.apiKey
    //   'X-Merchant-Id': config.tami.merchantId
  },
});

/**
 * İmza oluşturur (Tami'nin HMAC/hash doğrulama yöntemi)
 * TODO: Tami'nin imzalama algoritmasına göre güncelleyin
 */
function generateSignature(payload) {
  const data = JSON.stringify(payload) + config.tami.apiSecret;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Yeni bir ödeme oturumu başlatır.
 * TODO: Endpoint adını ve request body alanlarını Tami dokümantasyonuna göre güncelleyin
 *
 * @param {Object} params
 * @param {string} params.orderId        - Shopify sipariş/session ID
 * @param {number} params.amount         - Tutar (kuruş veya ondalık — Tami formatına göre)
 * @param {string} params.currency       - Para birimi (TRY vb.)
 * @param {string} params.successUrl     - Başarılı ödeme sonrası yönlendirme URL'si
 * @param {string} params.failUrl        - Başarısız ödeme sonrası yönlendirme URL'si
 * @param {string} params.callbackUrl    - Sunucu tarafı bildirim URL'si (webhook)
 * @param {Object} params.customer       - Müşteri bilgileri
 * @returns {Promise<{paymentUrl: string, tamiSessionId: string}>}
 */
async function createPaymentSession(params) {
  const payload = {
    // TODO: Tami'nin beklediği alan adlarına göre eşleştirin
    merchantId: config.tami.merchantId,
    referenceId: params.orderId,
    amount: params.amount,
    currency: params.currency,
    returnUrl: params.successUrl,
    cancelUrl: params.failUrl,
    notificationUrl: params.callbackUrl,
    buyer: {
      // TODO: Tami'nin müşteri nesnesini doldurun
      name: params.customer?.name,
      email: params.customer?.email,
      phone: params.customer?.phone,
    },
  };

  // TODO: İmzalama gerekliyse ekleyin
  // payload.signature = generateSignature(payload);

  // TODO: Doğru endpoint adını girin (örn. '/api/v1/payment/init')
  const response = await client.post('/TODO_PAYMENT_ENDPOINT', payload);

  return {
    // TODO: Yanıt alanlarını Tami'nin response schema'sına göre eşleştirin
    paymentUrl: response.data.paymentUrl || response.data.redirectUrl,
    tamiSessionId: response.data.sessionId || response.data.transactionId,
  };
}

/**
 * Tami'den gelen callback/webhook imzasını doğrular.
 * TODO: Tami'nin doğrulama yöntemine göre güncelleyin
 *
 * @param {Object} body    - Webhook body
 * @param {string} [sig]   - Header'dan gelen imza
 * @returns {boolean}
 */
function verifyCallback(body, sig) {
  if (!sig) return false;
  const expected = generateSignature(body);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(sig)
  );
}

/**
 * Bir ödemenin mevcut durumunu sorgular.
 * TODO: Endpoint adını Tami dokümantasyonuna göre güncelleyin
 *
 * @param {string} tamiSessionId
 * @returns {Promise<{status: 'success'|'pending'|'failed', rawStatus: string}>}
 */
async function getPaymentStatus(tamiSessionId) {
  // TODO: Doğru endpoint adını girin (örn. '/api/v1/payment/status')
  const response = await client.get(`/TODO_STATUS_ENDPOINT/${tamiSessionId}`);

  // TODO: Tami'nin status değerlerini normalize edin
  const STATUS_MAP = {
    'SUCCESS': 'success',
    'COMPLETED': 'success',
    'PENDING': 'pending',
    'WAITING': 'pending',
    'FAILED': 'failed',
    'CANCELLED': 'failed',
    'ERROR': 'failed',
  };

  const rawStatus = response.data.status || response.data.paymentStatus;
  return {
    status: STATUS_MAP[rawStatus?.toUpperCase()] || 'pending',
    rawStatus,
  };
}

/**
 * Kısmi veya tam iade başlatır.
 * TODO: Endpoint adını ve request body'yi Tami dokümantasyonuna göre güncelleyin
 *
 * @param {Object} params
 * @param {string} params.tamiSessionId
 * @param {number} params.amount
 * @param {string} params.reason
 * @returns {Promise<{refundId: string}>}
 */
async function createRefund(params) {
  const payload = {
    // TODO: Tami'nin iade request alanlarını doldurun
    merchantId: config.tami.merchantId,
    transactionId: params.tamiSessionId,
    refundAmount: params.amount,
    reason: params.reason,
  };

  // TODO: Doğru endpoint adını girin (örn. '/api/v1/refund')
  const response = await client.post('/TODO_REFUND_ENDPOINT', payload);

  return {
    refundId: response.data.refundId || response.data.transactionId,
  };
}

module.exports = {
  createPaymentSession,
  verifyCallback,
  getPaymentStatus,
  createRefund,
};
