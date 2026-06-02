const axios = require('axios');
const config = require('../config');

const gqlClient = axios.create({
  baseURL: `https://${config.shopify.shopDomain}/payments_apps/api/2024-01/graphql`,
  headers: {
    'Content-Type': 'application/json',
    'Shopify-Access-Token': config.shopify.accessToken,
  },
  timeout: 15000,
});

async function gql(query, variables) {
  const { data } = await gqlClient.post('', { query, variables });
  if (data.errors?.length) {
    throw new Error(`Shopify GraphQL hatası: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

/**
 * Ödeme oturumunu başarılı olarak işaretle.
 * Tami'den başarı bildirimi geldiğinde çağrılır.
 */
async function resolvePaymentSession(paymentSessionId) {
  const data = await gql(
    `mutation Resolve($id: ID!) {
      paymentSessionResolve(id: $id) {
        paymentSession { id state { code } }
        userErrors { field message code }
      }
    }`,
    { id: paymentSessionId }
  );

  const errors = data.paymentSessionResolve.userErrors;
  if (errors.length) {
    throw new Error(`Shopify resolve hatası: ${JSON.stringify(errors)}`);
  }
  return data.paymentSessionResolve.paymentSession;
}

/**
 * Ödeme oturumunu başarısız olarak işaretle.
 */
async function rejectPaymentSession(paymentSessionId, reason = 'PROCESSING_ERROR') {
  const data = await gql(
    `mutation Reject($id: ID!, $reason: PaymentSessionRejectionReasonCode!) {
      paymentSessionReject(id: $id, reason: { code: $reason }) {
        paymentSession { id state { code } }
        userErrors { field message code }
      }
    }`,
    { id: paymentSessionId, reason }
  );

  const errors = data.paymentSessionReject.userErrors;
  if (errors.length) {
    throw new Error(`Shopify reject hatası: ${JSON.stringify(errors)}`);
  }
  return data.paymentSessionReject.paymentSession;
}

/**
 * Ödeme oturumunu beklemede olarak işaretle.
 */
async function pendingPaymentSession(paymentSessionId, pendingExpiresAt) {
  const data = await gql(
    `mutation Pending($id: ID!, $pendingExpiresAt: DateTime!) {
      paymentSessionPending(id: $id, pendingExpiresAt: $pendingExpiresAt) {
        paymentSession { id state { code } }
        userErrors { field message code }
      }
    }`,
    { id: paymentSessionId, pendingExpiresAt }
  );

  const errors = data.paymentSessionPending.userErrors;
  if (errors.length) {
    throw new Error(`Shopify pending hatası: ${JSON.stringify(errors)}`);
  }
  return data.paymentSessionPending.paymentSession;
}

/**
 * İade oturumunu başarılı olarak işaretle.
 */
async function resolveRefundSession(refundSessionId) {
  const data = await gql(
    `mutation RefundResolve($id: ID!) {
      refundSessionResolve(id: $id) {
        refundSession { id state { code } }
        userErrors { field message code }
      }
    }`,
    { id: refundSessionId }
  );

  const errors = data.refundSessionResolve.userErrors;
  if (errors.length) {
    throw new Error(`Shopify refund resolve hatası: ${JSON.stringify(errors)}`);
  }
  return data.refundSessionResolve.refundSession;
}

/**
 * İade oturumunu başarısız olarak işaretle.
 */
async function rejectRefundSession(refundSessionId, reason = 'PROCESSING_ERROR') {
  const data = await gql(
    `mutation RefundReject($id: ID!, $reason: RefundSessionRejectionReasonCode!) {
      refundSessionReject(id: $id, reason: { code: $reason }) {
        refundSession { id state { code } }
        userErrors { field message code }
      }
    }`,
    { id: refundSessionId, reason }
  );

  const errors = data.refundSessionReject.userErrors;
  if (errors.length) {
    throw new Error(`Shopify refund reject hatası: ${JSON.stringify(errors)}`);
  }
  return data.refundSessionReject.refundSession;
}

module.exports = {
  resolvePaymentSession,
  rejectPaymentSession,
  pendingPaymentSession,
  resolveRefundSession,
  rejectRefundSession,
};
