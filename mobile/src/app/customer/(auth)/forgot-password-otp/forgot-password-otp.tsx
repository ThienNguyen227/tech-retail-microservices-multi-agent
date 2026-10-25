import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ErrorMessage,
  RecoverySteps,
} from '../forgot-password/forgot-password';
import {
  AuthServiceError,
  getForgotPasswordState,
  resendForgotPasswordOtp,
  saveForgotPasswordResetExpiry,
  saveForgotPasswordState,
  verifyForgotPasswordOtp,
} from '@/services/auth.service';

const OTP_LENGTH = 6;

export default function ForgotPasswordOtp() {
  const colorScheme = useColorScheme();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? '');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<({ focus: () => void } | null)[]>([]);

  useEffect(() => {
    getForgotPasswordState().then((state) => {
      if (!state.email) {
        router.replace('/customer/forgot-password' as Href);
        return;
      }
      setEmail(state.email);
      setExpiresAt(state.otpExpiresAt);
    });
  }, []);

  useEffect(() => {
    const update = () =>
      setCountdown(
        expiresAt
          ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
          : 0,
      );
    update();
    if (!expiresAt) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleVerify = async () => {
    setError('');
    const code = otp.join('');
    if (!email) return setError('Không tìm thấy email.');
    if (code.length !== OTP_LENGTH) return setError('Vui lòng nhập đủ 6 số OTP!');

    setLoading(true);
    try {
      const response = await verifyForgotPasswordOtp(email, code);
      if (!response?.reset_expires_at) {
        setError('Phản hồi từ Server không hợp lệ.');
        return;
      }
      await saveForgotPasswordResetExpiry(response.reset_expires_at);
      router.push('/customer/forgot-password-change' as Href);
    } catch (requestError) {
      setError(
        requestError instanceof AuthServiceError
          ? requestError.message
          : 'Đã xảy ra lỗi. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setError('');
    try {
      const response = await resendForgotPasswordOtp(email);
      if (!response?.otp_expires_at) {
        setError('Phản hồi từ Server không hợp lệ.');
        return;
      }
      await saveForgotPasswordState(email, response.otp_expires_at);
      setExpiresAt(response.otp_expires_at);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (requestError) {
      setError(
        requestError instanceof AuthServiceError
          ? requestError.message
          : 'Gửi lại OTP thất bại.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-[#eef6f7]'}`}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-[#eef6f7]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="grow justify-center px-5 py-10">
          <View className="w-full self-center rounded-[28px] bg-white px-5 py-10 sm:max-w-md sm:px-12">
            <RecoverySteps active={2} />
            <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-[#168b87]">Xác thực tài khoản</Text>
            <Text className="text-3xl font-bold text-[#12313a]">Nhập mã OTP</Text>
            <Text className="mt-3 text-sm leading-6 text-[#70858b]">Mã OTP đã được gửi đến {email}.</Text>
            <View className="mt-8 flex-row justify-between gap-2">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  className="h-12 flex-1 rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] text-center text-lg font-bold text-[#12313a]"
                  value={digit}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(value) => {
                    const digits = value.replace(/\D/g, '');
                    const next = [...otp];

                    if (digits.length > 1) {
                      digits
                        .slice(0, OTP_LENGTH - index)
                        .split('')
                        .forEach((item, offset) => {
                          next[index + offset] = item;
                        });
                      setOtp(next);
                      inputRefs.current[
                        Math.min(index + digits.length, OTP_LENGTH - 1)
                      ]?.focus();
                      return;
                    }

                    next[index] = digits;
                    setOtp(next);
                    if (digits && index < OTP_LENGTH - 1) {
                      inputRefs.current[index + 1]?.focus();
                    } else if (!digits && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>
            <Text className="mt-4 text-center text-sm text-[#70858b]">Mã còn hiệu lực: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</Text>
            {!!error && <ErrorMessage message={error} />}
            <Pressable className={`mt-6 h-12 flex-row items-center justify-center rounded-xl bg-[#168b87] ${loading ? 'opacity-60' : ''}`} disabled={loading} onPress={handleVerify}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Xác thực OTP</Text>}
            </Pressable>
            <Pressable className="mt-5 items-center" disabled={resending || countdown > 0} onPress={handleResend}>
              <Text className={`text-sm font-semibold ${resending || countdown > 0 ? 'text-[#9aabad]' : 'text-[#168b87]'}`}>{resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
