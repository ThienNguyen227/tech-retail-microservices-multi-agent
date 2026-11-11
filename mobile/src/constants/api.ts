const API_HOST = process.env.EXPO_PUBLIC_API_HOST;

if (!API_HOST) {
  throw new Error('EXPO_PUBLIC_API_HOST chưa được cấu hình.');
}

// export const CUSTOMER_URLS = {
//   user: `${API_HOST}:3001/api/v1/customer-session/user-service`,
//   customer: `${API_HOST}:3002/api/v1/customer-session/customer-service`,
//   product: `${API_HOST}:3003/api/v1/customer-session/product-service`,
//   order: `${API_HOST}:3004/api/v1/customer-session/order-service`,
//   cart: `${API_HOST}:3004/api/v1/customer-session/cart-service`,
//   promotion: `${API_HOST}:3008/api/v1/customer-session/promotion-service`,
// } as const;

export const CUSTOMER_URLS = {
  user: `${API_HOST}/api/v1/customer-session/user-service`,
  customer: `${API_HOST}/api/v1/customer-session/customer-service`,
  product: `${API_HOST}/api/v1/customer-session/product-service`,
  order: `${API_HOST}/api/v1/customer-session/order-service`,
  cart: `${API_HOST}/api/v1/customer-session/cart-service`,
  branch: `${API_HOST}/api/v1/customer-session/branch-service`,
  promotion: `${API_HOST}/api/v1/customer-session/promotion-service`,
} as const;

export const AI_SERVICE_URL = `${API_HOST}:8000/api/v1/ai-service`;
export const FRONTEND_ASSET_URL = `${API_HOST}:3000`;

// Frontend gọi trực tiếp payment-service ở cổng 3009, chưa có route gateway.
const paymentUrl = new URL(API_HOST);
paymentUrl.port = '3009';
paymentUrl.pathname = '/api/v1/customer-sesion/payment-service/payment';
paymentUrl.search = '';
paymentUrl.hash = '';
export const PAYMENT_SERVICE_URL =
  process.env.EXPO_PUBLIC_PAYMENT_API_URL || paymentUrl.toString();
