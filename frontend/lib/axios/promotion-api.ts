import axios from 'axios';

export const promotionApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PROMOTION_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});