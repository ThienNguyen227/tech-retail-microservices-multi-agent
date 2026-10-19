import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;
const REGISTER_OTP_URL =
  `${API_BASE_URL}/api/v1/user-service/register/otp-sending`;

export type RegisterDraft = {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_password_hash: string;
};

export type LoginResponse = {
  access_token: string;
  user_name: string;
  user_id: string;
  token_type: 'Bearer';
  expires_in: number;
};

type SendOtpResponse = {
  otp_expires_at: string;
  message?: string;
};

export type ForgotPasswordOtpResponse = {
  otp_expires_at?: string;
  reset_expires_at?: string;
  message?: string;
};

export class AuthServiceError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function sendRegisterOtp(
  email: string,
  phone: string,
): Promise<SendOtpResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(REGISTER_OTP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: email,
        user_phone: phone,
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as
      | SendOtpResponse
      | { message?: string }
      | null;

    if (!response.ok) {
      throw new AuthServiceError(
        data?.message ?? 'Không thể gửi mã OTP.',
        { status: response.status },
      );
    }

    if (!data || !('otp_expires_at' in data)) {
      throw new AuthServiceError('Phản hồi từ Server không hợp lệ.');
    }

    return data;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AuthServiceError(
        'Server phản hồi quá lâu. Vui lòng thử lại sau!',
        { code: 'TIMEOUT' },
      );
    }

    throw new AuthServiceError(
      'Lỗi kết nối đến Server. Vui lòng thử lại sau!',
      { code: 'NETWORK_ERROR' },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function saveRegisterDraft(
  draft: RegisterDraft,
  otpExpiresAt: string,
) {
  await SecureStore.setItemAsync('registerDraft', JSON.stringify(draft));
  await SecureStore.setItemAsync('otpExpiresAt', otpExpiresAt);
}

export async function getRegisterDraft(): Promise<{
  draft: RegisterDraft | null;
  otpExpiresAt: string | null;
}> {
  const [draftValue, otpExpiresAt] = await Promise.all([
    SecureStore.getItemAsync('registerDraft'),
    SecureStore.getItemAsync('otpExpiresAt'),
  ]);

  if (!draftValue) {
    return { draft: null, otpExpiresAt };
  }

  try {
    return { draft: JSON.parse(draftValue) as RegisterDraft, otpExpiresAt };
  } catch {
    await SecureStore.deleteItemAsync('registerDraft');
    return { draft: null, otpExpiresAt };
  }
}

export async function verifyRegisterOtp(
  email: string,
  otpCode: string,
  draft: RegisterDraft,
) {
  return requestJson('/register/otp-verifying', {
    user_email: email,
    otp_code: otpCode,
    user_name: draft.user_name,
    user_phone: draft.user_phone,
    user_password_hash: draft.user_password_hash,
  });
}

export async function resendRegisterOtp(email: string) {
  return requestJson('/register/otp-resending', { user_email: email });
}

export async function loginCustomer(email: string, password: string) {
  return requestJson('/login', {
    user_email: email,
    user_password: password,
    device_info: 'mobile',
  }) as Promise<LoginResponse>;
}

export async function saveLoginSession(
  response: LoginResponse,
  remember: boolean,
) {
  await SecureStore.setItemAsync('accessToken', response.access_token);
  await SecureStore.setItemAsync('userType', 'CUSTOMER');
  await SecureStore.setItemAsync('userName', response.user_name);
  await SecureStore.setItemAsync('userId', response.user_id);
  await SecureStore.setItemAsync('rememberLogin', String(remember));
}

export async function sendForgotPasswordOtp(
  email: string,
): Promise<ForgotPasswordOtpResponse | null> {
  return requestJson<ForgotPasswordOtpResponse>('/forgot-password/otp-sending', {
    user_email: email,
  });
}

export async function resendForgotPasswordOtp(
  email: string,
): Promise<ForgotPasswordOtpResponse | null> {
  return requestJson<ForgotPasswordOtpResponse>('/forgot-password/otp-resending', {
    user_email: email,
  });
}

export async function verifyForgotPasswordOtp(
  email: string,
  otpCode: string,
): Promise<ForgotPasswordOtpResponse | null> {
  return requestJson<ForgotPasswordOtpResponse>('/forgot-password/otp-verifying', {
    user_email: email,
    otp_code: otpCode,
  });
}

export async function changeForgottenPassword(newPassword: string) {
  return requestJson<{ message?: string }>('/forgot-password/password-change', {
    new_password: newPassword,
  });
}

export async function saveForgotPasswordState(
  email: string,
  otpExpiresAt: string,
) {
  await SecureStore.setItemAsync('forgotPasswordEmail', email);
  await SecureStore.setItemAsync(
    'forgotPasswordOtpExpiresAt',
    otpExpiresAt,
  );
}

export async function saveForgotPasswordResetExpiry(resetExpiresAt: string) {
  await SecureStore.setItemAsync(
    'forgotPasswordResetExpiresAt',
    resetExpiresAt,
  );
}

export async function getForgotPasswordState() {
  const [email, otpExpiresAt, resetExpiresAt] = await Promise.all([
    SecureStore.getItemAsync('forgotPasswordEmail'),
    SecureStore.getItemAsync('forgotPasswordOtpExpiresAt'),
    SecureStore.getItemAsync('forgotPasswordResetExpiresAt'),
  ]);

  return { email, otpExpiresAt, resetExpiresAt };
}

export async function clearForgotPasswordState() {
  await Promise.all([
    SecureStore.deleteItemAsync('forgotPasswordEmail'),
    SecureStore.deleteItemAsync('forgotPasswordOtpExpiresAt'),
    SecureStore.deleteItemAsync('forgotPasswordResetExpiresAt'),
  ]);
}

async function requestJson<T = ForgotPasswordOtpResponse>(
  path: string,
  body: object,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user-service${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as T | null;

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'message' in data &&
        typeof data.message === 'string'
          ? data.message
          : 'Yêu cầu thất bại.';
      throw new AuthServiceError(message, {
        status: response.status,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AuthServiceError(
        'Server phản hồi quá lâu. Vui lòng thử lại sau!',
        { code: 'TIMEOUT' },
      );
    }
    throw new AuthServiceError(
      'Lỗi kết nối đến Server. Vui lòng thử lại sau!',
      { code: 'NETWORK_ERROR' },
    );
  } finally {
    clearTimeout(timeout);
  }
}
