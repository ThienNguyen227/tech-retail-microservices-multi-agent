import { router, useLocalSearchParams } from 'expo-router';
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
  AuthServiceError,
  getRegisterDraft,
  resendRegisterOtp,
  verifyRegisterOtp,
} from '@/services/auth.service';

const OTP_LENGTH = 6;

export default function Otp() {
  const colorScheme = useColorScheme();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === 'string' ? emailParam : '';
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [draft, setDraft] = useState<Awaited<ReturnType<typeof getRegisterDraft>>['draft']>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<({ focus: () => void } | null)[]>([]);

  useEffect(() => {
    let active = true;
    getRegisterDraft().then(({ draft: savedDraft, otpExpiresAt: savedExpiry }) => {
      if (!active) return;
      if (!savedDraft) {
        router.replace('/customer/register');
        return;
      }
      setDraft(savedDraft);
      setExpiresAt(savedExpiry);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setCountdown(
        expiresAt
          ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
          : 0,
      );
    };
    update();
    if (!expiresAt) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleVerify = async () => {
    setError('');
    if (!email) return setError('Không tìm thấy email đăng ký.');
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      return setError('Vui lòng nhập đủ 6 chữ số OTP.');
    }
    if (!draft) return setError('Dữ liệu đăng ký không hợp lệ. Vui lòng thử lại.');

    setLoading(true);
    try {
      await verifyRegisterOtp(email, otpCode, draft);
      setVerified(true);
      setTimeout(() => router.push('/customer/login'), 1200);
    } catch (requestError) {
      setError(
        requestError instanceof AuthServiceError
          ? requestError.message
          : 'Xác thực OTP thất bại. Vui lòng thử lại.',
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
      const response = await resendRegisterOtp(email);
      if (response?.otp_expires_at) setExpiresAt(response.otp_expires_at);
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
          <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-[#168b87]">
            Xác thực tài khoản
          </Text>
          <Text className="text-3xl font-bold text-[#12313a]">
            Nhập mã OTP
          </Text>
          <Text className="mt-3 text-sm leading-6 text-[#70858b]">
            Mã OTP đã được gửi đến {email || 'email của bạn'}.
          </Text>

          <View className="mt-8 flex-row justify-between gap-2">
            {Array.from({ length: OTP_LENGTH }, (_, index) => (
              <TextInput
                key={index}
                className="h-12 flex-1 rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] text-center text-lg font-bold text-[#12313a]"
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={otp[index]}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(value) => {
                  const digits = value.replace(/\D/g, '');
                  const next = [...otp];

                  if (digits.length > 1) {
                    digits
                      .slice(0, OTP_LENGTH - index)
                      .split('')
                      .forEach((digit, offset) => {
                        next[index + offset] = digit;
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
                  if (
                    nativeEvent.key === 'Backspace' &&
                    !otp[index] &&
                    index > 0
                  ) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </View>

          <Text className="mt-4 text-center text-sm text-[#70858b]">
            Mã còn hiệu lực: {Math.floor(countdown / 60)}:
            {String(countdown % 60).padStart(2, '0')}
          </Text>

          {!!error && (
            <Text className="mt-5 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
              {error}
            </Text>
          )}
          {verified && (
            <Text className="mt-5 rounded-lg bg-[#e8f8f5] px-4 py-3 text-sm text-[#168b87]">
              Đăng ký thành công. Đang chuyển đến trang đăng nhập...
            </Text>
          )}

          <Pressable
            className={`mt-6 h-12 flex-row items-center justify-center rounded-xl bg-[#168b87] ${
              loading ? 'opacity-60' : ''
            }`}
            disabled={loading || verified}
            onPress={handleVerify}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Xác thực</Text>}
          </Pressable>

          <Pressable
            className="mt-5 items-center"
            disabled={resending || countdown > 0}
            onPress={handleResend}
          >
            <Text className={`text-sm font-semibold ${resending || countdown > 0 ? 'text-[#9aabad]' : 'text-[#168b87]'}`}>
              {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
