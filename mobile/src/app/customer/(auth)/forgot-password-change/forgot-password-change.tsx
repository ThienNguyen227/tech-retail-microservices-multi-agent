import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
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
  changeForgottenPassword,
  getForgotPasswordState,
  clearForgotPasswordState,
} from '@/services/auth.service';
import { ErrorMessage, RecoverySteps } from '../forgot-password/forgot-password';

export default function ForgotPasswordChange() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getForgotPasswordState().then((state) => {
      if (!state.email || !state.resetExpiresAt) {
        router.replace('/customer/forgot-password' as Href);
        return;
      }
      setEmail(state.email);
      setExpiresAt(state.resetExpiresAt);
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

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (countdown <= 0) return setError('Phiên đổi mật khẩu đã hết hạn. Vui lòng thực hiện lại!');
    if (newPassword.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');

    setLoading(true);
    try {
      await changeForgottenPassword(newPassword);
      await clearForgotPasswordState();
      setSuccess('Đổi mật khẩu thành công. Đang chuyển đến trang đăng nhập...');
      setTimeout(() => router.replace('/customer/login'), 1200);
    } catch (requestError) {
      setError(
        requestError instanceof AuthServiceError
          ? requestError.message
          : 'Đổi mật khẩu thất bại.',
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
        <ScrollView contentContainerClassName="grow justify-center px-5 py-10">
          <View className="w-full self-center rounded-[28px] bg-white px-5 py-10 sm:max-w-md sm:px-12">
            <RecoverySteps active={3} />
            <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-[#168b87]">Khôi phục tài khoản</Text>
            <Text className="text-3xl font-bold text-[#12313a]">Đổi mật khẩu</Text>
            <Text className="mt-3 text-sm leading-6 text-[#70858b]">Tạo mật khẩu mới cho {email}.</Text>
            <Text className="mt-4 text-center text-sm text-[#70858b]">Phiên còn hiệu lực: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</Text>

            <PasswordField label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} placeholder="Nhập mật khẩu mới" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
            <PasswordField label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Nhập lại mật khẩu mới" visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} />
            {!!error && <ErrorMessage message={error} />}
            {!!success && <Text className="mt-5 rounded-lg bg-[#e8f8f5] px-4 py-3 text-sm text-[#168b87]">{success}</Text>}
            <Pressable className={`mt-6 h-12 flex-row items-center justify-center rounded-xl bg-[#168b87] ${loading ? 'opacity-60' : ''}`} disabled={loading} onPress={handleSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Đổi mật khẩu</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="mt-5">
      <Text className="mb-2 text-sm font-semibold text-[#29444b]">{props.label}</Text>
      <View className="relative">
        <TextInput className="h-12 rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 pr-14 text-sm text-[#12313a]" value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor="#a4b4b7" secureTextEntry={!props.visible} />
        <Pressable className="absolute right-3 top-0 h-12 justify-center" onPress={props.onToggle}>
          <Text className="text-xs font-semibold text-[#6e858a]">{props.visible ? 'Ẩn' : 'Hiện'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
