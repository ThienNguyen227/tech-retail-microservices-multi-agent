import * as SecureStore from 'expo-secure-store';

export type RegisterDraft = {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_password_hash: string;
};

export async function saveAccessToken(token: string) {
  await SecureStore.setItemAsync('accessToken', token);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}

export async function getCustomerSessionId() {
  return SecureStore.getItemAsync('customerSessionId');
}

export async function saveLoginSession(data: {
  access_token: string;
  session_id: string;
  user_id: string;
  user_name: string;
  remember: boolean;
}) {
  await Promise.all([
    saveAccessToken(data.access_token),
    SecureStore.setItemAsync('customerSessionId', data.session_id),
    SecureStore.setItemAsync('userType', 'CUSTOMER'),
    SecureStore.setItemAsync('userName', data.user_name),
    SecureStore.setItemAsync('userId', data.user_id),
    SecureStore.setItemAsync('rememberLogin', String(data.remember)),
  ]);
}

export async function saveRegisterDraft(
  draft: RegisterDraft,
  otpExpiresAt: string,
) {
  await Promise.all([
    SecureStore.setItemAsync('registerDraft', JSON.stringify(draft)),
    SecureStore.setItemAsync('otpExpiresAt', otpExpiresAt),
  ]);
}

export async function getRegisterDraft() {
  const [draftValue, otpExpiresAt] = await Promise.all([
    SecureStore.getItemAsync('registerDraft'),
    SecureStore.getItemAsync('otpExpiresAt'),
  ]);

  if (!draftValue) return { draft: null, otpExpiresAt };

  try {
    return {
      draft: JSON.parse(draftValue) as RegisterDraft,
      otpExpiresAt,
    };
  } catch {
    await SecureStore.deleteItemAsync('registerDraft');
    return { draft: null, otpExpiresAt };
  }
}

export async function saveForgotPasswordState(
  email: string,
  otpExpiresAt: string,
) {
  await Promise.all([
    SecureStore.setItemAsync('forgotPasswordEmail', email),
    SecureStore.setItemAsync('forgotPasswordOtpExpiresAt', otpExpiresAt),
  ]);
}

export async function saveForgotPasswordResetState(
  userId: string,
  resetExpiresAt: string,
) {
  await Promise.all([
    SecureStore.setItemAsync('forgotPasswordUserId', userId),
    SecureStore.setItemAsync('forgotPasswordResetExpiresAt', resetExpiresAt),
  ]);
}

export async function getForgotPasswordState() {
  const [email, otpExpiresAt, userId, resetExpiresAt] = await Promise.all([
    SecureStore.getItemAsync('forgotPasswordEmail'),
    SecureStore.getItemAsync('forgotPasswordOtpExpiresAt'),
    SecureStore.getItemAsync('forgotPasswordUserId'),
    SecureStore.getItemAsync('forgotPasswordResetExpiresAt'),
  ]);

  return { email, otpExpiresAt, userId, resetExpiresAt };
}

export async function clearForgotPasswordState() {
  await Promise.all([
    SecureStore.deleteItemAsync('forgotPasswordEmail'),
    SecureStore.deleteItemAsync('forgotPasswordOtpExpiresAt'),
    SecureStore.deleteItemAsync('forgotPasswordUserId'),
    SecureStore.deleteItemAsync('forgotPasswordResetExpiresAt'),
  ]);
}
