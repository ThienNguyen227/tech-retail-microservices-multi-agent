import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [userName, setUserName] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Lấy thông tin người dùng
  useEffect(() => {
    let mounted = true;

    getStoredUser()
      .then(({ userName: storedUserName }) => {
        if (mounted) {
          setUserName(storedUserName ?? '');
        }
      })
      .catch((error) => {
        console.warn('[AUTH] Cannot load stored user.', error);
      });

    return () => {
      mounted = false;
    };
  }, [pathname]);

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

    router.push(
      `/customer/search?q=${encodeURIComponent(query)}` as Href,
    );
  };

  return (
    <SafeAreaView className="bg-white" edges={['top']}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2">

        {/* ROW 1: LOGO + THÔNG TIN KHÁCH HÀNG */}
        <View className="flex-row items-center justify-between">
          <Pressable
            className="min-w-0 flex-1 flex-row items-center gap-2"
            onPress={() => router.replace('/customer/home')}
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ SmartHub"
          >
            <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#168b87]">
              <Text className="text-xl font-black text-white">
                S
              </Text>
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
            className="ml-2 max-w-[125px] items-end rounded-xl bg-[#e6f5f4] px-3 py-2"
            onPress={() =>
              router.push('/customer/profile/account-information' as Href)
            }
            accessibilityRole="button"
            accessibilityLabel="Mở thông tin tài khoản"
          >
            <Text className="text-[10px] text-[#168b87]">
              Xin chào,
            </Text>

            <Text
              className="text-sm font-bold text-[#073b4c]"
              numberOfLines={1}
            >
              {userName || 'Khách hàng'}
            </Text>
          </Pressable>
        </View>

        {/* ROW 2: ĐƠN HÀNG + GIỎ HÀNG + BẢO HÀNH + ĐĂNG XUẤT */}
        <View className="mt-3 flex-row gap-2">
          <ShortcutLink
            label="Đơn hàng"
            symbol="▤"
            active={pathname.startsWith('/customer/order')}
            onPress={() => router.push('/customer/order' as Href)}
          />

          <ShortcutLink
            label="Giỏ hàng"
            symbol="🛒"
            active={pathname.startsWith('/customer/cart')}
            onPress={() => router.push('/customer/cart' as Href)}
          />

          <ShortcutLink
            label="Bảo hành"
            symbol="▣"
            active={pathname.startsWith('/customer/warranty')}
            onPress={() => router.push('/customer/warranty' as Href)}
          />

          <Pressable
            className="min-w-0 flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-1 py-3 active:opacity-70"
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
          >
            <Text className="text-base text-red-500">
              ↪
            </Text>

            <Text
              className="shrink text-[11px] font-bold text-red-600"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {loggingOut ? 'Đang thoát...' : 'Đăng xuất'}
            </Text>
          </Pressable>
        </View>

        {/* ROW 3: THANH TÌM KIẾM */}
        <View className="mt-3 flex-row items-center gap-2">
          <View className="h-11 min-w-0 flex-1 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Text className="mr-2 text-lg text-slate-400">
              ⌕
            </Text>

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
                <Text className="text-lg text-slate-400">
                  ×
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            className="h-11 w-11 items-center justify-center rounded-xl bg-[#168b87] active:opacity-80"
            onPress={handleSearch}
            accessibilityRole="button"
            accessibilityLabel="Tìm kiếm"
          >
            <Text className="text-xl font-bold text-white">
              ⌕
            </Text>
          </Pressable>
        </View>

        {/* ROW 4: DANH MỤC SẢN PHẨM */}
        <ScrollView
          className="mt-3"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <CategoryLink
            active={pathname === '/customer/home'}
            label="Trang chủ"
            onPress={() => router.replace('/customer/home')}
          />

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
              router.push(
                '/customer/product-category/may-tinh-bang' as Href,
              )
            }
          />
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

// SHORTCUT: ĐƠN HÀNG, GIỎ HÀNG, BẢO HÀNH

function ShortcutLink({
  label,
  symbol,
  active = false,
  onPress,
}: {
  label: string;
  symbol: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`min-w-0 flex-1 flex-row items-center justify-center gap-1 rounded-xl border px-1 py-3 ${
        active
          ? 'border-[#168b87] bg-[#e6f5f4]'
          : 'border-slate-200 bg-white'
      }`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={`text-base ${
          active ? 'text-[#168b87]' : 'text-slate-600'
        }`}
      >
        {symbol}
      </Text>

      <Text
        className={`shrink text-[11px] font-bold ${
          active ? 'text-[#168b87]' : 'text-slate-700'
        }`}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {label}
      </Text>
    </Pressable>
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