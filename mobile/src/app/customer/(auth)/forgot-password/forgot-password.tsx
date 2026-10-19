import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
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
  saveForgotPasswordState,
  sendForgotPasswordOtp,
} from '@/services/auth.service';

export default function ForgotPassword() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email không hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      const response = await sendForgotPasswordOtp(normalizedEmail);
      if (!response?.otp_expires_at) {
        setError('Phản hồi từ Server không hợp lệ.');
        return;
      }
      await saveForgotPasswordState(normalizedEmail, response.otp_expires_at);
      router.push({
        pathname: '/customer/forgot-password-otp',
        params: { email: normalizedEmail },
      } as Href);
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

  return (
    <SafeAreaView
      className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-[#eef6f7]'}`}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-[#eef6f7]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow justify-center px-5 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full self-center rounded-[28px] bg-white px-5 py-10 sm:max-w-md sm:px-12">
            <RecoverySteps active={1} />
            <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-[#168b87]">
              Khôi phục tài khoản
            </Text>
            <Text className="text-3xl font-bold text-[#12313a]">
              Quên mật khẩu
            </Text>
            <Text className="mt-3 text-sm leading-6 text-[#70858b]">
              Nhập email đã đăng ký để nhận mã OTP khôi phục mật khẩu.
            </Text>

            <Text className="mb-2 mt-8 text-sm font-semibold text-[#29444b]">
              Email
            </Text>
            <TextInput
              className="h-12 rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 text-sm text-[#12313a]"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#a4b4b7"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {!!error && <ErrorMessage message={error} />}
            <Pressable
              className={`mt-5 h-12 flex-row items-center justify-center rounded-xl bg-[#168b87] ${
                loading ? 'opacity-60' : ''
              }`}
              disabled={loading}
              onPress={handleSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">Gửi mã OTP</Text>
              )}
            </Pressable>
            <Pressable className="mt-6 items-center" onPress={() => router.back()}>
              <Text className="font-semibold text-[#168b87]">Quay lại đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <Text className="mt-5 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
      {message}
    </Text>
  );
}

export function RecoverySteps({ active }: { active: 1 | 2 | 3 }) {
  return (
    <View className="mb-8 flex-row items-start">
      {['Kiểm tra email', 'Xác thực OTP', 'Đổi mật khẩu'].map((label, index) => {
        const step = index + 1;
        const isActive = step === active;
        return (
          <View key={label} className="flex-1 items-center">
            <View
              className={`h-9 w-9 items-center justify-center rounded-full ${
                isActive ? 'bg-[#168b87]' : 'bg-[#e8eeee]'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  isActive ? 'text-white' : 'text-[#8ca0a4]'
                }`}
              >
                {step}
              </Text>
            </View>
            <Text
              className={`mt-2 text-center text-xs ${
                isActive
                  ? 'font-semibold text-[#168b87]'
                  : 'text-[#8ca0a4]'
              }`}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
