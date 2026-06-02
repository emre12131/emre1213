require('dotenv').config();

const required = (name) => {
  const val = process.env[name];
  if (!val) throw new Error(`Zorunlu ortam değişkeni eksik: ${name}`);
  return val;
};

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  shopify: {
    apiKey: required('SHOPIFY_API_KEY'),
    apiSecret: required('SHOPIFY_API_SECRET'),
    shopDomain: required('SHOPIFY_SHOP_DOMAIN'),
    accessToken: required('SHOPIFY_ACCESS_TOKEN'),
  },

  tami: {
    baseUrl: process.env.TAMI_API_BASE_URL || 'https://dev.tami.com.tr',
    apiKey: required('TAMI_API_KEY'),
    apiSecret: required('TAMI_API_SECRET'),
    merchantId: required('TAMI_MERCHANT_ID'),
  },

  app: {
    baseUrl: required('APP_BASE_URL'),
  },
};
