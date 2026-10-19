import { router } from 'expo-router';
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
  saveRegisterDraft,
  sendRegisterOtp,
} from '@/services/auth.service';

export default function Register() {
  const colorScheme = useColorScheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    if (
      !normalizedFullName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !password ||
      !confirmPassword
    ) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }

    if (!/^(0|\+84)[0-9]{9,10}$/.test(normalizedPhone)) {
      setError('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }

    if (password.length < 8 || confirmPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (!agree) {
      setError('Vui lòng đồng ý với điều khoản sử dụng.');
      return;
    }

    setLoading(true);

    try {
      const sendOtpData = await sendRegisterOtp(
        normalizedEmail,
        normalizedPhone,
      );

      await saveRegisterDraft(
        {
          user_name: normalizedFullName,
          user_email: normalizedEmail,
          user_phone: normalizedPhone,
          user_password_hash: password,
        },
        sendOtpData.otp_expires_at,
      );

      router.push(
        `/customer/otp?email=${encodeURIComponent(normalizedEmail)}`,
      );
    } catch (requestError) {
      if (requestError instanceof AuthServiceError) {
        setError(requestError.message);
      } else {
        setError('Đã xảy ra lỗi.');
      }
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
              <Text className="text-lg font-bold text-[#073b4c]">SmartHub</Text>
            </View>

            <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-[#168b87]">
              Chào mừng bạn
            </Text>
            <Text className="text-3xl font-bold text-[#12313a]">
              Tạo tài khoản
            </Text>
            <Text className="mt-3 text-sm leading-6 text-[#70858b]">
              Bắt đầu quản lý chuỗi cửa hàng thiết bị thông minh của bạn.
            </Text>
          </View>

          <View className="mb-8 flex-row items-start">
            <View className="items-center">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-[#168b87]">
                <Text className="text-sm font-bold text-white">1</Text>
              </View>
              <Text className="mt-2 text-center text-sm font-semibold text-[#168b87]">
                Nhập thông tin
              </Text>
            </View>
            <View className="mx-3 mt-4 h-px flex-1 bg-[#d9e4e5]" />
            <View className="items-center">
              <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-[#d9e4e5]">
                <Text className="text-sm font-bold text-[#9aabad]">2</Text>
              </View>
              <Text className="mt-2 text-center text-sm text-[#9aabad]">
                Xác thực OTP
              </Text>
            </View>
          </View>

          <View className="gap-5">
            <FormField
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn An"
            />
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormField
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="0987654321"
              keyboardType="phone-pad"
            />
            <FormField
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Tối thiểu 8 ký tự"
              secureTextEntry={!showPassword}
              onToggleVisibility={() => setShowPassword((value) => !value)}
              isVisible={showPassword}
            />
            <FormField
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              onToggleVisibility={() =>
                setShowConfirmPassword((value) => !value)
              }
              isVisible={showConfirmPassword}
            />

            <Pressable
              className="flex-row items-start gap-3"
              onPress={() => setAgree((value) => !value)}
            >
              <View
                className={`mt-1 h-4 w-4 items-center justify-center rounded border ${
                  agree
                    ? 'border-[#168b87] bg-[#168b87]'
                    : 'border-[#ccd9db]'
                }`}
              >
                {agree && <Text className="text-xs font-bold text-white">✓</Text>}
              </View>
              <Text className="flex-1 text-sm leading-5 text-[#70858b]">
                Tôi đồng ý với{' '}
                <Text className="font-semibold text-[#168b87]">
                  Điều khoản sử dụng
                </Text>{' '}
                và{' '}
                <Text className="font-semibold text-[#168b87]">
                  Chính sách bảo mật
                </Text>
                .
              </Text>
            </Pressable>

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
              onPress={handleRegister}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#ffffff" />
                  <Text className="ml-2 font-semibold text-white">
                    Đang đăng ký...
                  </Text>
                </>
              ) : (
                <Text className="font-semibold text-white">Tạo tài khoản</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-[#70858b]">Bạn đã có tài khoản? </Text>
            <Pressable onPress={() => router.push('/customer/login')}>
              <Text className="text-sm font-bold text-[#168b87]">Đăng nhập</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  isVisible = false,
  onToggleVisibility,
}: FormFieldProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-[#29444b]">{label}</Text>
      <View className="relative">
        <TextInput
          className={`h-12 rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 text-sm text-[#12313a] ${
            onToggleVisibility ? 'pr-14' : ''
          }`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a4b4b7"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
        />
        {onToggleVisibility && (
          <Pressable
            className="absolute right-3 top-0 h-12 justify-center"
            onPress={onToggleVisibility}
          >
            <Text className="text-xs font-semibold text-[#6e858a]">
              {isVisible ? 'Ẩn' : 'Hiện'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
