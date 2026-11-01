import { customerAxios } from '../../customer-axios';

export type RegisterOtpRequest = {
  user_email: string;
  user_phone: string;
};

export type RegisterVerifyRequest = {
  user_email: string;
  otp_code: string;
  user_name: string;
  user_phone: string;
  user_password_hash: string;
};

export type LoginRequest = {
  user_email: string;
  user_password: string;
  device_info?: string;
};

export type LoginResponse = {
  access_token: string;
  user_name: string;
  user_id: string;
  session_id: string;
  token_type: 'Bearer';
  expires_in: number;
};

export type ForgotPasswordVerifyRequest = {
  user_email: string;
  otp_code: string;
};

export type ForgotPasswordChangeRequest = {
  user_id: string;
  new_password: string;
};

export const customerUserService = {
  async sendOtp(data: RegisterOtpRequest) {
    const response = await customerAxios.post('/register/otp-sending', data);
    return response.data;
  },

  async resendOtp(data: { user_email: string }) {
    const response = await customerAxios.post('/register/otp-resending', data);
    return response.data;
  },

  async verifyOtp(data: RegisterVerifyRequest) {
    const response = await customerAxios.post('/register/otp-verifying', data);
    return response.data;
  },

  async sendOtpForgotPassword(data: { user_email: string }) {
    const response = await customerAxios.post(
      '/forgot-password/otp-sending',
      data,
    );
    return response.data;
  },

  async resendOtpForgotPassword(data: { user_email: string }) {
    const response = await customerAxios.post(
      '/forgot-password/otp-resending',
      data,
    );
    return response.data;
  },

  async verifyOtpForgotPassword(data: ForgotPasswordVerifyRequest) {
    const response = await customerAxios.post(
      '/forgot-password/otp-verifying',
      data,
    );
    return response.data;
  },

  async changePasswordForgotPassword(data: ForgotPasswordChangeRequest) {
    const response = await customerAxios.post(
      '/forgot-password/password-change',
      data,
    );
    return response.data;
  },

  async login(data: LoginRequest) {
    const response = await customerAxios.post('/login', data);
    return response.data;
  },
};
