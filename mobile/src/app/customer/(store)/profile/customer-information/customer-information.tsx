import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { clearAccessToken } from '@/lib/access_token/customer_access_token';
import {
  type CustomerAddressPayload,
  customerCustomerService,
} from '@/lib/axios/services/customer-services/customer_service';
import { clearCustomerSession } from '@/lib/storage/secure_storage';

type Address = CustomerAddressPayload & { customer_address_id: string };
type CustomerProfile = {
  customer_id: string;
  customer_user_id?: string;
  customer_code: string;
  customer_full_name: string | null;
  customer_date_of_birth: string | null;
  customer_gender: string | null;
  customer_status: string;
  customer_created_at?: string;
  customer_updated_at?: string;
  addresses: Address[];
};

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chưa cập nhật'
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function genderLabel(gender: string | null) {
  return gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : gender === 'OTHER' ? 'Khác' : 'Chưa cập nhật';
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

export default function CustomerInformationScreen() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [formError, setFormError] = useState('');
  const [addressForm, setAddressForm] = useState<{ id?: string; line: string; ward: string; province: string; isDefault: boolean } | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await customerCustomerService.getCustomerInformation();
      const result = response?.data ?? response;
      const customer = result?.data && !Array.isArray(result.data) ? result.data : result;
      if (!customer?.customer_id) throw new Error('Dữ liệu khách hàng không hợp lệ.');
      setProfile({ ...customer, addresses: Array.isArray(customer.addresses) ? customer.addresses : [] });
    } catch (requestError) {
      if (isAxiosError(requestError) && requestError.response?.status === 401) {
        clearAccessToken();
        await clearCustomerSession();
        router.replace('/customer/login');
        return;
      }
      setError(errorMessage(requestError, 'Không thể tải thông tin khách hàng. Vui lòng thử lại.'));
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
    setFullName(profile.customer_full_name || '');
    setDateOfBirth(profile.customer_date_of_birth?.slice(0, 10) || '');
    setGender(profile.customer_gender || '');
    setFormError('');
    setSuccess('');
    setEditing(true);
  };

  const saveProfile = async () => {
    const name = fullName.trim();
    if (!name) return setFormError('Họ và tên không được để trống.');
    if (name.length > 100) return setFormError('Họ và tên không được vượt quá 100 ký tự.');
    if (!dateOfBirth) return setFormError('Vui lòng nhập ngày sinh.');
    if (dateOfBirth > new Date().toISOString().slice(0, 10)) return setFormError('Ngày sinh không được lớn hơn ngày hiện tại.');
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) return setFormError('Vui lòng chọn giới tính.');

    setSaving(true);
    setFormError('');
    try {
      await customerCustomerService.updateCustomerInformation({
        customer_full_name: name,
        customer_date_of_birth: dateOfBirth,
        customer_gender: gender,
      });
      setEditing(false);
      setSuccess('Cập nhật thông tin khách hàng thành công!');
      await loadProfile();
    } catch (requestError) {
      setFormError(errorMessage(requestError, 'Không thể cập nhật thông tin khách hàng.'));
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    if (!addressForm?.line.trim() || !addressForm.ward.trim() || !addressForm.province.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ địa chỉ, phường/xã và tỉnh/thành phố.');
      return;
    }
    setAddressSaving(true);
    const payload: CustomerAddressPayload = {
      customer_address_line: addressForm.line.trim(),
      customer_address_ward: addressForm.ward.trim(),
      customer_address_province: addressForm.province.trim(),
      customer_address_default: addressForm.isDefault,
    };
    try {
      if (addressForm.id) await customerCustomerService.updateCustomerAddress(addressForm.id, payload);
      else await customerCustomerService.createCustomerAddress(payload);
      setAddressForm(null);
      setSuccess(addressForm.id ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
      await loadProfile();
    } catch (requestError) {
      Alert.alert('Không thể lưu địa chỉ', errorMessage(requestError, 'Vui lòng thử lại.'));
    } finally {
      setAddressSaving(false);
    }
  };

  const deleteAddress = (id: string) => {
    Alert.alert('Xóa địa chỉ', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await customerCustomerService.deleteCustomerAddress(id);
            setSuccess('Xóa địa chỉ thành công!');
            await loadProfile();
          } catch (requestError) {
            Alert.alert('Không thể xóa địa chỉ', errorMessage(requestError, 'Vui lòng thử lại.'));
          }
        },
      },
    ]);
  };

  const status = profile ? statusInfo(profile.customer_status) : null;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8fb]" edges={['bottom']}>
      <ScrollView contentContainerClassName="px-4 pb-10 pt-5" showsVerticalScrollIndicator={false}>
        <Breadcrumb title="Thông tin khách hàng" />
        <PageHeading title="Thông tin khách hàng" subtitle="Quản lý hồ sơ cá nhân và địa chỉ nhận hàng của bạn." symbol="✓" />
        <ProfileNavigation active="customer" />
        {loading ? <Loading label="Đang tải thông tin khách hàng..." /> : null}
        {!loading && error ? <ErrorPanel message={error} onRetry={() => void loadProfile()} /> : null}
        {!loading && profile ? (
          <View className="gap-4">
            <View className="rounded-3xl bg-[#168b87] p-5">
              <View className="h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/15"><Text className="text-3xl font-bold text-white">U</Text></View>
              <Text className="mt-4 text-sm font-medium text-teal-50">Hồ sơ khách hàng</Text>
              <Text className="mt-1 text-2xl font-bold text-white">{profile.customer_full_name || 'Chưa cập nhật họ và tên'}</Text>
              <View className="mt-4 flex-row flex-wrap items-center gap-2">
                <View style={{ backgroundColor: status?.background }} className="rounded-full px-3 py-2"><Text style={{ color: status?.color }} className="text-xs font-bold">{status?.label}</Text></View>
                <Text className="text-xs font-medium text-white">Mã khách hàng: {profile.customer_code}</Text>
              </View>
              <Pressable className="mt-5 self-start rounded-xl bg-white px-4 py-3" onPress={startEditing} disabled={editing}><Text className="font-bold text-[#116b68]">{editing ? 'Đang chỉnh sửa' : 'Chỉnh sửa'}</Text></Pressable>
            </View>
            {success ? <Notice message={success} /> : null}
            {!editing ? (
              <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <SectionHeader
                  title="Chi tiết khách hàng"
                  subtitle="Thông tin cá nhân trong hồ sơ khách hàng của bạn."
                  badge="Hồ sơ cá nhân"
                />
                <InfoRow label="Mã khách hàng" value={profile.customer_code} symbol="#" />
                <InfoRow label="Họ và tên khách hàng" value={profile.customer_full_name || ''} symbol="U" />
                <InfoRow label="Ngày sinh" value={formatDate(profile.customer_date_of_birth)} symbol="D" />
                <InfoRow label="Giới tính" value={genderLabel(profile.customer_gender)} symbol="G" />
                <InfoRow label="Trạng thái" value={status?.label || ''} symbol="✓" />
                <InfoRow label="Ngày tạo hồ sơ" value={formatDate(profile.customer_created_at)} symbol="C" />
                <InfoRow label="Cập nhật lần cuối" value={formatDate(profile.customer_updated_at)} symbol="↻" last />
              </View>
            ) : null}

            <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <SectionHeader title="Địa chỉ nhận hàng" subtitle="Quản lý các địa chỉ giao hàng của bạn." badge={`${profile.addresses.length} địa chỉ`} />
              <View className="p-4">
                <Pressable className="mb-4 flex-row items-center justify-center gap-2 rounded-xl bg-[#168b87] py-3" onPress={() => setAddressForm({ line: '', ward: '', province: '', isDefault: profile.addresses.length === 0 })}>
                  <Text className="text-lg font-bold text-white">+</Text><Text className="font-bold text-white">Thêm địa chỉ</Text>
                </Pressable>
                {profile.addresses.length === 0 ? <View className="items-center rounded-2xl bg-slate-50 p-6"><Text className="text-lg">⌂</Text><Text className="mt-3 font-semibold text-slate-800">Chưa có địa chỉ nhận hàng</Text><Text className="mt-2 text-center text-sm leading-5 text-slate-500">Thêm địa chỉ để thuận tiện hơn khi đặt mua sản phẩm.</Text></View> : null}
                {profile.addresses.map((address) => (
                  <View key={address.customer_address_id} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <View className="flex-row items-start gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-50"><Text className="text-xl text-[#168b87]">⌂</Text></View>
                      <View className="flex-1">
                        <View className="flex-row flex-wrap items-center gap-2"><Text className="flex-1 text-sm font-semibold leading-6 text-slate-800">{address.customer_address_line}</Text>{address.customer_address_default ? <Text className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-[#168b87]">★ Mặc định</Text> : null}</View>
                        <Text className="mt-2 text-sm leading-6 text-slate-500">{address.customer_address_ward}, {address.customer_address_province}</Text>
                        <Text className="mt-2 text-xs text-slate-400">Mã địa chỉ: {address.customer_address_id}</Text>
                      </View>
                    </View>
                    <View className="mt-4 flex-row gap-3 border-t border-slate-200 pt-3">
                      <Pressable className="flex-1 items-center rounded-xl border border-slate-200 bg-white py-2.5" onPress={() => setAddressForm({ id: address.customer_address_id, line: address.customer_address_line, ward: address.customer_address_ward, province: address.customer_address_province, isDefault: address.customer_address_default })}><Text className="font-semibold text-slate-600">✎ Sửa</Text></Pressable>
                      <Pressable className="flex-1 items-center rounded-xl border border-red-100 bg-white py-2.5" onPress={() => deleteAddress(address.customer_address_id)}><Text className="font-semibold text-red-600">⌫ Xóa</Text></Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* POPUP CHỈNH SỬA THÔNG TIN KHÁCH HÀNG */}
      <Modal
        visible={editing && !!profile}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!saving) {
            setEditing(false);
            setFormError('');
          }
        }}
      >
        <View className="flex-1 justify-center bg-black/50 px-4 py-8">
          <Pressable
            className="absolute inset-0"
            onPress={() => {
              if (!saving) {
                setEditing(false);
                setFormError('');
              }
            }}
          />

          <View className="max-h-[85%] overflow-hidden rounded-2xl bg-white">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {profile ? (
                <CustomerEditPanel
                  code={profile.customer_code}
                  name={fullName}
                  dateOfBirth={dateOfBirth}
                  gender={gender}
                  error={formError}
                  saving={saving}
                  onNameChange={setFullName}
                  onDateChange={setDateOfBirth}
                  onGenderChange={setGender}
                  onCancel={() => {
                    if (!saving) {
                      setEditing(false);
                      setFormError('');
                    }
                  }}
                  onSave={() => void saveProfile()}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* POPUP THÊM / CHỈNH SỬA ĐỊA CHỈ */}
      <Modal
        visible={addressForm !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!addressSaving) setAddressForm(null);
        }}
      >
        <View className="flex-1 justify-center bg-black/50 px-4 py-8">
          <Pressable
            className="absolute inset-0"
            onPress={() => {
              if (!addressSaving) setAddressForm(null);
            }}
          />

          <View className="max-h-[85%] overflow-hidden rounded-2xl bg-white">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {addressForm ? (
                <AddressPanel
                  form={addressForm}
                  saving={addressSaving}
                  onChange={setAddressForm}
                  onCancel={() => {
                    if (!addressSaving) setAddressForm(null);
                  }}
                  onSave={() => void saveAddress()}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CustomerEditPanel({
  code,
  name,
  dateOfBirth,
  gender,
  error,
  saving,
  onNameChange,
  onDateChange,
  onGenderChange,
  onCancel,
  onSave,
}: {
  code: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  error: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedDate = dateOfBirth
    ? new Date(`${dateOfBirth}T00:00:00`)
    : new Date();

  const displayDate = dateOfBirth
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(selectedDate)
    : 'Chọn ngày sinh';

  return (
    <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <View className="bg-[#073b4c] p-5">
        <Text className="text-xs font-bold uppercase tracking-widest text-teal-200">
          Hồ sơ khách hàng
        </Text>
        <Text className="mt-1 text-xl font-bold text-white">
          Chỉnh sửa thông tin
        </Text>
        <Text className="mt-1 text-sm text-teal-50">
          Cập nhật hồ sơ khách hàng của bạn.
        </Text>
      </View>

      {/* Form */}
      <View className="gap-4 p-5">
        <View className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <Text className="text-xs text-slate-500">Mã khách hàng</Text>
          <Text className="mt-1 font-semibold text-slate-800">
            {code}
          </Text>
        </View>

        <Field
          label="Họ và tên *"
          value={name}
          onChangeText={onNameChange}
          placeholder="Nhập họ và tên"
          maxLength={100}
        />

        {/* Ngày sinh */}
        <View>
          <Text className="mb-2 text-sm font-semibold text-slate-700">
            Ngày sinh *
          </Text>

          <Pressable
            className="h-12 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4"
            onPress={() => setShowDatePicker(true)}
            disabled={saving}
          >
            <Text
              className={
                dateOfBirth
                  ? 'text-sm text-slate-800'
                  : 'text-sm text-slate-400'
              }
            >
              {displayDate}
            </Text>

            <Text className="text-lg text-[#168b87]">▦</Text>
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              value={
                Number.isNaN(selectedDate.getTime())
                  ? new Date()
                  : selectedDate
              }
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDateValue) => {
                setShowDatePicker(false);

                if (event.type === 'set' && selectedDateValue) {
                  const year = selectedDateValue.getFullYear();
                  const month = String(
                    selectedDateValue.getMonth() + 1,
                  ).padStart(2, '0');
                  const day = String(
                    selectedDateValue.getDate(),
                  ).padStart(2, '0');

                  onDateChange(`${year}-${month}-${day}`);
                }
              }}
            />
          ) : null}
        </View>

        {/* Giới tính */}
        <Text className="text-sm font-semibold text-slate-700">
          Giới tính *
        </Text>

        <View className="flex-row gap-2">
          {['MALE', 'FEMALE', 'OTHER'].map((value) => (
            <Pressable
              key={value}
              className={`flex-1 items-center rounded-xl border py-3 ${
                gender === value
                  ? 'border-[#168b87] bg-[#e6f5f4]'
                  : 'border-slate-200'
              }`}
              onPress={() => onGenderChange(value)}
            >
              <Text
                className={`text-xs font-bold ${
                  gender === value
                    ? 'text-[#168b87]'
                    : 'text-slate-500'
                }`}
              >
                {genderLabel(value)}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <Text className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </Text>
        ) : null}

        <ActionButtons
          saving={saving}
          saveLabel="Lưu thay đổi"
          onCancel={onCancel}
          onSave={onSave}
        />
      </View>
    </View>
  );
}

function AddressPanel({
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  form: {
    id?: string;
    line: string;
    ward: string;
    province: string;
    isDefault: boolean;
  };
  saving: boolean;
  onChange: (form: {
    id?: string;
    line: string;
    ward: string;
    province: string;
    isDefault: boolean;
  }) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <View className="overflow-hidden bg-white">
      {/* Header */}
      <View className="bg-[#073b4c] p-5">
        <Text className="text-xs font-bold uppercase tracking-widest text-teal-200">
          Quản lý địa chỉ
        </Text>

        <Text className="mt-1 text-xl font-bold text-white">
          {form.id ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ nhận hàng'}
        </Text>

        <Text className="mt-1 text-sm leading-5 text-teal-50">
          {form.id
            ? 'Cập nhật thông tin địa chỉ nhận hàng của bạn.'
            : 'Thêm địa chỉ mới để thuận tiện hơn khi đặt mua sản phẩm.'}
        </Text>
      </View>

      {/* Form */}
      <View className="gap-4 p-5">
        <Field
          label="Địa chỉ *"
          value={form.line}
          onChangeText={(value) => onChange({ ...form, line: value })}
          placeholder="Số nhà, tên đường..."
          maxLength={255}
        />

        <Field
          label="Phường / Xã *"
          value={form.ward}
          onChangeText={(value) => onChange({ ...form, ward: value })}
          placeholder="Nhập phường / xã"
          maxLength={100}
        />

        <Field
          label="Tỉnh / Thành phố *"
          value={form.province}
          onChangeText={(value) => onChange({ ...form, province: value })}
          placeholder="Nhập tỉnh / thành phố"
          maxLength={100}
        />

        <Pressable
          className="flex-row items-center gap-3 rounded-xl bg-teal-50 p-3"
          onPress={() =>
            onChange({ ...form, isDefault: !form.isDefault })
          }
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded border ${
              form.isDefault
                ? 'border-[#168b87] bg-[#168b87]'
                : 'border-slate-300 bg-white'
            }`}
          >
            {form.isDefault ? (
              <Text className="text-xs font-bold text-white">✓</Text>
            ) : null}
          </View>

          <Text className="flex-1 text-sm font-semibold text-slate-700">
            Đặt làm địa chỉ mặc định
          </Text>
        </Pressable>

        <ActionButtons
          saving={saving}
          saveLabel={form.id ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
          onCancel={onCancel}
          onSave={onSave}
        />
      </View>
    </View>
  );
}

function ActionButtons({ saving, saveLabel, onCancel, onSave }: { saving: boolean; saveLabel: string; onCancel: () => void; onSave: () => void }) {
  return <View className="flex-row gap-3 border-t border-slate-200 pt-4"><Pressable className="flex-1 items-center rounded-xl border border-slate-200 bg-white py-3" onPress={onCancel} disabled={saving}><Text className="font-bold text-slate-600">Hủy bỏ</Text></Pressable><Pressable className="flex-1 items-center rounded-xl bg-[#168b87] py-3" onPress={onSave} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">{saveLabel}</Text>}</Pressable></View>;
}

function ProfileNavigation({ active }: { active: 'account' | 'customer' }) {
  return <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-3"><Text className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Tài khoản của tôi</Text><NavButton label="Thông tin tài khoản" active={active === 'account'} onPress={() => router.push('/customer/profile/account-information' as Href)} /><NavButton label="Thông tin khách hàng" active={active === 'customer'} onPress={() => router.replace('/customer/profile/customer-information' as Href)} /></View>;
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

function Field({ label, value, onChangeText, placeholder, maxLength }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; maxLength?: number }) {
  return <View><Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text><TextInput className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800" value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94a3b8" maxLength={maxLength} /></View>;
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
