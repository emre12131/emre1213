# Tami – Shopify Ödeme Entegrasyonu

Tami ödeme sistemi (`dev.tami.com.tr`) ile Shopify mağazanız arasında köprü görevi gören Node.js ara uygulaması.

## Mimari

```
Shopify Checkout
       │  POST /payment (HMAC imzalı)
       ▼
 Bu Uygulama (Express)
       │  createPaymentSession()
       ▼
  Tami API ──► Ödeme Sayfası
       │            │
       │   Müşteri öder
       │            │
       ◄── webhook / GET /payment/return
       │
       │  paymentSessionResolve (GraphQL)
       ▼
Shopify (sipariş onaylanır)
```

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Ortam değişkenlerini ayarlayın

```bash
cp .env.example .env
```

`.env` dosyasını doldurun:

| Değişken | Nereden alınır |
|---|---|
| `SHOPIFY_API_KEY` | Shopify Partners → Apps → API credentials |
| `SHOPIFY_API_SECRET` | Shopify Partners → Apps → API credentials |
| `SHOPIFY_SHOP_DOMAIN` | `yourstore.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Shopify Admin → Apps → Private apps |
| `TAMI_API_KEY` | dev.tami.com.tr üzerinden |
| `TAMI_API_SECRET` | dev.tami.com.tr üzerinden |
| `TAMI_MERCHANT_ID` | Tami merchant paneli |
| `APP_BASE_URL` | Uygulamanızın public URL'si (ngrok, Render vb.) |

### 3. Tami API entegrasyonunu tamamlayın

`src/services/tami.js` içindeki `TODO` yorumlarını Tami API dokümantasyonuna göre doldurun:

- `createPaymentSession` → ödeme başlatma endpoint'i ve request/response alanları
- `getPaymentStatus` → durum sorgulama endpoint'i
- `createRefund` → iade endpoint'i
- `verifyCallback` → webhook imza doğrulama yöntemi

### 4. Shopify Partner App oluşturun

1. [partners.shopify.com](https://partners.shopify.com) → **Apps → Create app**
2. App type: **Custom app** veya **Public app**
3. **Payment extensions** altında yeni bir uzantı ekleyin
4. Payment endpoint: `https://YOUR_DOMAIN/payment`
5. Refund endpoint: `https://YOUR_DOMAIN/refund`
6. Uygulamayı mağazanıza yükleyin

### 5. Çalıştırın

```bash
# Geliştirme
npm run dev

# Üretim
npm start
```

## Endpoint'ler

| Method | Yol | Açıklama |
|---|---|---|
| POST | `/payment` | Shopify ödeme oturumu başlatır |
| POST | `/payment/webhook` | Tami sunucu bildirimi (IPN) |
| GET | `/payment/return` | Müşteri yönlendirmesi |
| POST | `/refund` | Shopify iade talebi |
| GET | `/health` | Sağlık kontrolü |

## Üretim Notları

- `sessionMap` (bellek içi) → **Redis** ile değiştirin
- HTTPS zorunludur (Shopify şart koşar)
- `APP_BASE_URL` public ve erişilebilir olmalıdır
- Hata logları için bir log servisi entegre edin
