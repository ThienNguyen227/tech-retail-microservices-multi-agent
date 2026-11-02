import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearAccessToken } from '@/lib/access_token/customer_access_token';
import { customerUserService, type AccountInformation } from '@/lib/axios/services/customer-services/user_service';
import { clearCustomerSession } from '@/lib/storage/secure_storage';

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chưa cập nhật'
    : new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
}

function statusInfo(status: string) {
  if (status === 'ACTIVE') return { label: 'Đang hoạt động', color: '#047857', background: '#d1fae5' };
  if (status === 'LOCKED' || status === 'BLOCKED') return { label: 'Đã khóa', color: '#b91c1c', background: '#fee2e2' };
  if (status === 'INACTIVE') return { label: 'Không hoạt động', color: '#475569', background: '#f1f5f9' };
  return { label: status || 'Chưa xác định', color: '#475569', background: '#f1f5f9' };
}

function errorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join('\n') : message || fallback;
}

export default function AccountInformationScreen() {
  const [profile, setProfile] = useState<AccountInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await customerUserService.getAccountInformation();
      setProfile(response?.data ?? response);
    } catch (requestError) {
      if (isAxiosError(requestError) && requestError.response?.status === 401) {
        clearAccessToken();
        await clearCustomerSession();
        router.replace('/customer/login');
        return;
      }
      setError(errorMessage(requestError, 'Không thể tải thông tin tài khoản. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadProfile(), 0);
    return () => clearTimeout(timer);
  }, [loadProfile]);

  const startEditing = () => {
    if (!profile) return;
    setFormName(profile.user_name || '');
    setFormPhone(profile.user_phone || '');
    setFormError('');
    setSuccess('');
    setEditing(true);
  };

  const saveProfile = async () => {
    const name = formName.trim();
    const phone = formPhone.trim();
    if (!name) return setFormError('Vui lòng nhập họ và tên.');
    if (name.length > 50) return setFormError('Họ và tên không được vượt quá 50 ký tự.');
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      return setFormError('Số điện thoại phải gồm 10-11 chữ số.');
    }

    setSaving(true);
    setFormError('');
    try {
      const response = await customerUserService.updateAccountInformation({
        user_name: name,
        user_phone: phone,
      });
      const updated = response?.data?.data ?? response?.data ?? response;
      setProfile((current) => current ? {
        ...current,
        ...(updated && typeof updated === 'object' ? updated : {}),
        user_name: updated?.user_name ?? name,
        user_phone: updated?.user_phone ?? phone,
      } : current);
      setEditing(false);
      setSuccess('Cập nhật thông tin tài khoản thành công!');
    } catch (requestError) {
      if (isAxiosError(requestError) && requestError.response?.status === 401) {
        clearAccessToken();
        await clearCustomerSession();
        router.replace('/customer/login');
        return;
      }
      setFormError(errorMessage(requestError, 'Không thể cập nhật thông tin tài khoản.'));
    } finally {
      setSaving(false);
    }
  };

  const status = profile ? statusInfo(profile.user_status) : null;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8fb]" edges={['bottom']}>
      <ScrollView contentContainerClassName="px-4 pb-10 pt-5" showsVerticalScrollIndicator={false}>
        <Breadcrumb title="Thông tin tài khoản" />
        <PageHeading title="Thông tin tài khoản" subtitle="Quản lý thông tin cá nhân và bảo mật tài khoản của bạn." symbol="U" />
        <ProfileNavigation active="account" />

        {loading ? <Loading label="Đang tải thông tin tài khoản..." /> : null}
        {!loading && error ? <ErrorPanel message={error} onRetry={() => void loadProfile()} /> : null}
        {!loading && profile ? (
          <View className="gap-4">
            <View className="rounded-3xl bg-[#168b87] p-5">
              <View className="h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/15">
                <Text className="text-3xl font-bold uppercase text-white">{profile.user_name?.charAt(0) || 'U'}</Text>
              </View>
              <Text className="mt-4 text-sm font-medium text-teal-50">Xin chào,</Text>
              <Text className="mt-1 text-2xl font-bold text-white">{profile.user_name || 'Chưa cập nhật'}</Text>
              <Text className="mt-2 text-sm text-teal-50">{profile.user_email}</Text>
              <View className="mt-4 flex-row flex-wrap items-center gap-2">
                <View style={{ backgroundColor: status?.background }} className="rounded-full px-3 py-2">
                  <Text style={{ color: status?.color }} className="text-xs font-bold">{status?.label}</Text>
                </View>
                <Text className="text-xs font-medium text-white">Mã tài khoản: {profile.user_id}</Text>
              </View>
              <Pressable className="mt-5 self-start rounded-xl bg-white px-4 py-3" onPress={startEditing} disabled={editing}>
                <Text className="font-bold text-[#116b68]">{editing ? 'Đang chỉnh sửa' : 'Chỉnh sửa'}</Text>
              </Pressable>
            </View>

            {success ? <Notice message={success} /> : null}
            {editing ? (
              <EditAccountPanel
                profile={profile}
                name={formName}
                phone={formPhone}
                error={formError}
                saving={saving}
                onNameChange={setFormName}
                onPhoneChange={setFormPhone}
                onCancel={() => { if (!saving) { setEditing(false); setFormError(''); } }}
                onSave={() => void saveProfile()}
              />
            ) : (
              <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader title="Chi tiết tài khoản" subtitle="Thông tin đăng ký tài khoản và liên hệ của bạn." badge="Thông tin cá nhân" />
                <InfoRow label="Tên tài khoản" value={profile.user_name} symbol="U" />
                <InfoRow label="Địa chỉ email" value={profile.user_email} symbol="@" />
                <InfoRow label="Số điện thoại" value={profile.user_phone} symbol="P" />
                <InfoRow label="Mã tài khoản" value={profile.user_id} symbol="#" />
                <InfoRow label="Ngày tạo tài khoản" value={formatDate(profile.user_created_at)} symbol="C" />
                <InfoRow label="Cập nhật lần cuối" value={formatDate(profile.user_updated_at)} symbol="↻" last />
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EditAccountPanel({ profile, name, phone, error, saving, onNameChange, onPhoneChange, onCancel, onSave }: {
  profile: AccountInformation; name: string; phone: string; error: string; saving: boolean;
  onNameChange: (value: string) => void; onPhoneChange: (value: string) => void;
  onCancel: () => void; onSave: () => void;
}) {
  return (
    <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <View className="bg-[#073b4c] p-5">
        <Text className="text-xs font-bold uppercase tracking-widest text-teal-200">Hồ sơ cá nhân</Text>
        <Text className="mt-1 text-xl font-bold text-white">Chỉnh sửa tài khoản</Text>
        <Text className="mt-1 text-sm text-teal-50">Cập nhật thông tin liên hệ của bạn.</Text>
      </View>
      <View className="gap-4 p-5">
        <View className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <Text className="text-sm font-semibold text-slate-800">{profile.user_name}</Text>
          <Text className="mt-1 text-xs text-slate-500">{profile.user_email}</Text>
          <Text className="mt-2 text-xs leading-5 text-slate-500">Email đăng nhập được giữ nguyên trong lần cập nhật này.</Text>
        </View>
        <Field label="Họ và tên *" value={name} onChangeText={onNameChange} placeholder="Ví dụ: Nguyễn Văn An" maxLength={50} />
        <Field label="Số điện thoại" value={phone} onChangeText={onPhoneChange} placeholder="Nhập số điện thoại" keyboardType="phone-pad" maxLength={11} />
        {error ? <Text className="rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-700">{error}</Text> : null}
        <View className="flex-row gap-3 border-t border-slate-100 pt-4">
          <Pressable className="flex-1 items-center rounded-xl border border-slate-200 py-3" onPress={onCancel} disabled={saving}><Text className="font-bold text-slate-600">Hủy bỏ</Text></Pressable>
          <Pressable className="flex-1 items-center rounded-xl bg-[#168b87] py-3" onPress={onSave} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">Lưu thay đổi</Text>}</Pressable>
        </View>
      </View>
    </View>
  );
}

function ProfileNavigation({ active }: { active: 'account' | 'customer' }) {
  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-3">
      <Text className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Tài khoản của tôi</Text>
      <NavButton label="Thông tin tài khoản" active={active === 'account'} onPress={() => router.replace('/customer/profile/account-information' as Href)} />
      <NavButton label="Thông tin khách hàng" active={active === 'customer'} onPress={() => router.push('/customer/profile/customer-information' as Href)} />
    </View>
  );
}

function NavButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable className={`mb-1 flex-row items-center justify-between rounded-xl px-3 py-3 ${active ? 'bg-[#e6f5f4]' : 'bg-white'}`} onPress={onPress}><Text className={`text-sm font-semibold ${active ? 'text-[#116b68]' : 'text-slate-600'}`}>{label}</Text><Text className={active ? 'text-[#168b87]' : 'text-slate-400'}>›</Text></Pressable>;
}

function Breadcrumb({ title }: { title: string }) {
  return <View className="mb-5 flex-row items-center gap-2"><Text className="text-sm text-slate-500">Trang chủ</Text><Text className="text-slate-400">›</Text><Text className="text-sm font-semibold text-slate-800">{title}</Text></View>;
}

function PageHeading({ title, subtitle, symbol }: { title: string; subtitle: string; symbol: string }) {
  return <View className="mb-5 flex-row items-center gap-3"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#168b87]"><Text className="text-xl font-black text-white">{symbol}</Text></View><View className="flex-1"><Text className="text-2xl font-bold text-slate-900">{title}</Text><Text className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</Text></View></View>;
}

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge: string }) {
  return <View className="border-b border-slate-100 p-5"><Text className="text-lg font-bold text-slate-900">{title}</Text><Text className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</Text><Text className="mt-3 self-start rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{badge}</Text></View>;
}

function InfoRow({ label, value, symbol, last = false }: { label: string; value: string; symbol: string; last?: boolean }) {
  return <View className={`flex-row gap-3 p-4 ${last ? '' : 'border-b border-slate-100'}`}><View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-50"><Text className="font-bold text-[#168b87]">{symbol}</Text></View><View className="flex-1"><Text className="text-xs text-slate-500">{label}</Text><Text className="mt-1 text-sm font-semibold leading-5 text-slate-800">{value || 'Chưa cập nhật'}</Text></View></View>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'phone-pad' | 'default'; maxLength?: number }) {
  return <View><Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text><TextInput className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800" value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} maxLength={maxLength} /></View>;
}

function Loading({ label }: { label: string }) {
  return <View className="items-center rounded-2xl border border-slate-200 bg-white p-10"><ActivityIndicator color="#168b87" /><Text className="mt-3 text-sm text-slate-500">{label}</Text></View>;
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View className="rounded-2xl border border-red-200 bg-white p-5"><Text className="font-semibold text-slate-900">Không thể tải thông tin</Text><Text className="mt-2 text-sm leading-5 text-slate-500">{message}</Text><Pressable className="mt-4 self-start rounded-xl bg-[#168b87] px-4 py-3" onPress={onRetry}><Text className="font-bold text-white">↻ Thử lại</Text></Pressable></View>;
}

function Notice({ message }: { message: string }) {
  return <View className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><Text className="text-sm font-medium text-emerald-700">✓ {message}</Text></View>;
}
