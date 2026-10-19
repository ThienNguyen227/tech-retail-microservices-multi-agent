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
  loginCustomer,
  saveLoginSession,
} from '@/services/auth.service';

export default function Login() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email không hợp lệ!');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }

    setLoading(true);
    try {
      const response = await loginCustomer(normalizedEmail, password);
      await saveLoginSession(response, remember);
      router.replace('/customer/home' as Href);
    } catch (requestError) {
      setError(
        requestError instanceof AuthServiceError
          ? requestError.message
          : 'Không thể kết nối đến server. Vui lòng thử lại.',
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
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full self-center rounded-[28px] bg-white px-5 py-10 shadow-2xl sm:max-w-md sm:px-12">
            <View className="mb-9">
              <View className="mb-6 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#073b4c]">
                  <Text className="font-black text-white">S</Text>
                </View>
                <Text className="text-lg font-bold text-[#073b4c]">
                  SmartHub
                </Text>
              </View>

              <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-[#168b87]">
                Chào mừng trở lại
              </Text>
              <Text className="text-3xl font-bold text-[#12313a]">
                Đăng nhập
              </Text>
              <Text className="mt-3 text-sm leading-6 text-[#70858b]">
                Đăng nhập để tiếp tục quản lý hệ thống cửa hàng của bạn.
              </Text>
            </View>

            <View className="gap-5">
              <View>
                <Text className="mb-2 text-sm font-semibold text-[#29444b]">
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
                  autoComplete="email"
                />
              </View>

              <View>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-[#29444b]">
                    Mật khẩu
                  </Text>
                </View>
                <View className="relative">
                  <TextInput
                    className="h-12 rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 pr-14 text-sm text-[#12313a]"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#a4b4b7"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <Pressable
                    className="absolute right-3 top-0 h-12 justify-center"
                    onPress={() => setShowPassword((value) => !value)}
                  >
                    <Text className="text-xs font-semibold text-[#6e858a]">
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Pressable
                  className="flex-row items-center gap-3"
                  onPress={() => setRemember((value) => !value)}
                >
                  <View
                    className={`h-4 w-4 items-center justify-center rounded border ${
                      remember
                        ? 'border-[#168b87] bg-[#168b87]'
                        : 'border-[#ccd9db]'
                    }`}
                  >
                    {remember && (
                      <Text className="text-xs font-bold text-white">✓</Text>
                    )}
                  </View>
                  <Text className="text-sm text-[#70858b]">
                    Ghi nhớ đăng nhập
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push('/customer/forgot-password' as Href)
                  }
                >
                  <Text className="text-sm font-semibold text-[#168b87]">
                    Quên mật khẩu?
                  </Text>
                </Pressable>
              </View>

              {!!error && (
                <Text className="rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {error}
                </Text>
              )}

              <Pressable
                className={`h-12 flex-row items-center justify-center rounded-xl bg-[#168b87] shadow-lg ${
                  loading ? 'opacity-60' : ''
                }`}
                disabled={loading}
                onPress={handleLogin}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text className="ml-2 font-semibold text-white">
                      Đang đăng nhập...
                    </Text>
                  </>
                ) : (
                  <Text className="font-semibold text-white">Đăng nhập</Text>
                )}
              </Pressable>
            </View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-sm text-[#70858b]">Chưa có tài khoản? </Text>
              <Pressable onPress={() => router.push('/customer/register')}>
                <Text className="text-sm font-bold text-[#168b87]">Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
