import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from '@/styles/register.styles';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);

  const handleRegister = () => {
    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập đầy đủ thông tin.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Thông báo',
        'Mật khẩu xác nhận không khớp.',
      );
      return;
    }

    if (!agree) {
      Alert.alert(
        'Thông báo',
        'Vui lòng đồng ý với điều khoản sử dụng.',
      );
      return;
    }

    Alert.alert(
      'Thành công',
      'Thông tin đăng ký hợp lệ.',
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>SmartHub</Text>

          <Text style={styles.title}>
            Tạo tài khoản
          </Text>

          <Text style={styles.subtitle}>
            Đăng ký tài khoản để bắt đầu mua sắm
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                styles.activeCircle,
              ]}
            >
              <Text style={styles.activeCircleText}>
                1
              </Text>
            </View>

            <Text style={styles.activeStepText}>
              Thông tin
            </Text>
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressStep}>
            <View style={styles.progressCircle}>
              <Text style={styles.circleText}>
                2
              </Text>
            </View>

            <Text style={styles.stepText}>
              Xác thực
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Họ và tên
            </Text>

            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số điện thoại
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Mật khẩu
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* Confirm password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Xác nhận mật khẩu
            </Text>

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* Terms */}
          <Pressable
            style={styles.termsContainer}
            onPress={() => setAgree(!agree)}
          >
            <View
              style={[
                styles.checkbox,
                agree && styles.checkboxActive,
              ]}
            >
              {agree && (
                <Text style={styles.checkmark}>
                  ✓
                </Text>
              )}
            </View>

            <Text style={styles.termsText}>
              Tôi đồng ý với{' '}
              <Text style={styles.termsLink}>
                Điều khoản sử dụng
              </Text>{' '}
              và{' '}
              <Text style={styles.termsLink}>
                Chính sách bảo mật
              </Text>
            </Text>
          </Pressable>

          {/* Register button */}
          <Pressable
            style={({ pressed }) => [
              styles.registerButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>
              Đăng ký
            </Text>
          </Pressable>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Đã có tài khoản?{' '}
            </Text>

            <Pressable>
              <Text style={styles.loginLink}>
                Đăng nhập
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

