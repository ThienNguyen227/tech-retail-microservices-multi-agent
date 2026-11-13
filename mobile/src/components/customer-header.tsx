import { ChevronRight } from 'lucide-react-native';
import { router, usePathname, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { customerUserService } from '@/lib/axios/services/customer-services/user_service';
import { clearAccessToken } from '@/lib/access_token/customer_access_token';
import {
  clearCustomerSession,
  getRefreshToken,
  getStoredUser,
} from '@/lib/storage/secure_storage';

export default function CustomerHeader() {
  const pathname = usePathname();

  const [keyword, setKeyword] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Đăng xuất
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const [{ sessionId }, refreshToken] = await Promise.all([
        getStoredUser(),
        getRefreshToken(),
      ]);

      await customerUserService.logout({
        session_id: sessionId,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.warn(
        '[AUTH] Logout request failed; clearing local session.',
        error,
      );
    } finally {
      clearAccessToken();
      await clearCustomerSession();

      router.replace('/customer/login');
      setLoggingOut(false);
    }
  };

  // Tìm kiếm sản phẩm
  const handleSearch = () => {
    const query = keyword.trim();

    if (!query) return;

    router.push(`/customer/search?q=${encodeURIComponent(query)}` as Href);
  };

  return (
    <SafeAreaView className="bg-white" edges={['top']}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2">
        {/* ROW 1: LOGO + ĐĂNG XUẤT */}
        <View className="flex-row items-center justify-between">
          <Pressable
            className="min-w-0 flex-1 flex-row items-center gap-2"
            onPress={() => router.replace('/customer/home')}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ SmartHub"
          >
            <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#168b87]">
              <Text className="text-xl font-black text-white">S</Text>
            </View>

            <View className="min-w-0 flex-1">
              <Text className="text-base font-extrabold text-[#073b4c]">
                SmartHub
              </Text>

              <Text className="text-[9px] font-medium uppercase tracking-widest text-slate-400">
                Smart Technology
              </Text>
            </View>
          </Pressable>

          <Pressable
            className="ml-2 min-h-11 flex-row items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3"
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
          >
            <Text className="text-[11px] font-semibold text-red-600">
              {loggingOut ? 'Đang thoát...' : 'Đăng xuất'}
            </Text>
            <ChevronRight size={18} strokeWidth={2.2} color="#dc2626" />
          </Pressable>
        </View>

        {/* ROW 2: THANH TÌM KIẾM */}
        <View className="mt-3 flex-row items-center gap-2">
          <View className="h-11 min-w-0 flex-1 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Text className="mr-2 text-lg text-slate-400">⌕</Text>

            <TextInput
              className="h-full min-w-0 flex-1 p-0 text-sm text-slate-700"
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Tìm sản phẩm, thương hiệu..."
              placeholderTextColor="#94a3b8"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              accessibilityLabel="Tìm kiếm sản phẩm"
            />

            {keyword.length > 0 && (
              <Pressable
                className="ml-2 h-8 w-8 items-center justify-center"
                onPress={() => setKeyword('')}
                accessibilityRole="button"
                accessibilityLabel="Xóa từ khóa tìm kiếm"
              >
                <Text className="text-lg text-slate-400">×</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            className="h-11 w-11 items-center justify-center rounded-xl bg-[#168b87] active:opacity-80"
            onPress={handleSearch}
            accessibilityRole="button"
            accessibilityLabel="Tìm kiếm"
          >
            <Text className="text-xl font-bold text-white">⌕</Text>
          </Pressable>
        </View>

        {/* ROW 3: DANH MỤC SẢN PHẨM */}
        <ScrollView
          className="mt-3"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <CategoryLink
            active={pathname.startsWith(
              '/customer/product-category/dien-thoai-di-dong',
            )}
            label="Điện thoại"
            onPress={() =>
              router.push(
                '/customer/product-category/dien-thoai-di-dong' as Href,
              )
            }
          />

          <CategoryLink
            active={pathname.startsWith(
              '/customer/product-category/may-tinh-xach-tay',
            )}
            label="Laptop"
            onPress={() =>
              router.push(
                '/customer/product-category/may-tinh-xach-tay' as Href,
              )
            }
          />

          <CategoryLink
            active={pathname.startsWith(
              '/customer/product-category/may-tinh-bang',
            )}
            label="Máy tính bảng"
            onPress={() =>
              router.push('/customer/product-category/may-tinh-bang' as Href)
            }
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// DANH MỤC SẢN PHẨM

function CategoryLink({
  active = false,
  label,
  onPress,
}: {
  active?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className={`rounded-lg px-3 py-2 ${
        active ? 'bg-[#e6f5f4]' : 'bg-slate-50'
      }`}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
    >
      <Text
        className={`text-xs font-semibold ${
          active ? 'text-[#168b87]' : 'text-slate-600'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
