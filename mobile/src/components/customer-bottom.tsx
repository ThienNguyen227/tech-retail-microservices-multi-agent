import { useEffect, useState } from 'react';
import { router, usePathname, type Href } from 'expo-router';
import {
  AppState,
  DeviceEventEmitter,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { getStoredUser } from '@/lib/storage/secure_storage';
import { customerCartService } from '@/lib/axios/services/customer-services/cart_service';
import { customerOrderService } from '@/lib/axios/services/customer-services/order_service';
import { customerCustomerService } from '@/lib/axios/services/customer-services/warranty_service';

export default function CustomerBottom({
  onLayout,
}: {
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const pathname = usePathname();

  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [warrantyCount, setWarrantyCount] = useState(0);

  // CART + ORDER + WARRANTY COUNT
  useEffect(() => {
    let active = true;
    let cartRequest = 0;
    let orderRequest = 0;
    let warrantyRequest = 0;

    async function fetchCartCount() {
      const request = ++cartRequest;
      try {
        const { userId } = await getStoredUser();
        if (!active || request !== cartRequest) return;
        if (!userId) {
          setCartCount(0);
          return;
        }

        const data = await customerCartService.getCart();
        const cartData = data.cart ?? data;
        const totalItems = (cartData.items || []).reduce(
          (sum: number, item: { quantity?: number }) =>
            sum + (item.quantity || 0),
          0,
        );
        if (active && request === cartRequest) setCartCount(totalItems);
      } catch (error) {
        console.warn('Lỗi lấy số lượng giỏ hàng:', error);
      }
    }

    async function fetchOrderCount() {
      const request = ++orderRequest;
      try {
        const { userId } = await getStoredUser();
        if (!active || request !== orderRequest) return;
        if (!userId) {
          setOrderCount(0);
          return;
        }

        const data = await customerOrderService.getOrderList();
        if (active && request === orderRequest) {
          setOrderCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        console.warn('Lỗi lấy số lượng đơn hàng:', error);
      }
    }

    async function fetchWarrantyCount() {
      const request = ++warrantyRequest;
      try {
        const { userId } = await getStoredUser();
        if (!active || request !== warrantyRequest) return;
        if (!userId) {
          setWarrantyCount(0);
          return;
        }

        const data = await customerCustomerService.getWarranty();
        if (active && request === warrantyRequest)
          setWarrantyCount(data.total ?? 0);
      } catch (error) {
        console.warn('Lỗi lấy số lượng bảo hành:', error);
      }
    }

    void fetchCartCount();
    void fetchOrderCount();
    void fetchWarrantyCount();

    const cartSubscription = DeviceEventEmitter.addListener(
      'cart-updated',
      fetchCartCount,
    );
    const orderSubscription = DeviceEventEmitter.addListener(
      'order-updated',
      fetchOrderCount,
    );
    const warrantySubscription = DeviceEventEmitter.addListener(
      'warranty-updated',
      fetchWarrantyCount,
    );
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void fetchCartCount();
        void fetchOrderCount();
        void fetchWarrantyCount();
      }
    });

    return () => {
      active = false;
      cartSubscription.remove();
      orderSubscription.remove();
      warrantySubscription.remove();
      appSubscription.remove();
    };
  }, [pathname]);

  // ĐIỀU HƯỚNG KHÁCH HÀNG
  const navigate = (href: Href) => {
    if (pathname !== href) router.navigate(href);
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      onLayout={onLayout}
      className="border-t border-slate-200 bg-white"
    >
      <View className="flex-row bg-white px-2 py-0.5">
        <BottomItem
          label="Trang chủ"
          icon="home"
          selected={pathname === '/customer/home'}
          onPress={() => navigate('/customer/home')}
        />
        <BottomItem
          label="Giỏ hàng"
          icon="cart"
          count={cartCount}
          selected={pathname.startsWith('/customer/cart')}
          onPress={() => navigate('/customer/cart')}
        />
        <BottomItem
          label="Đơn hàng"
          icon="order"
          count={orderCount}
          selected={pathname.startsWith('/customer/order')}
          onPress={() => navigate('/customer/order')}
        />
        <BottomItem
          label="Bảo hành"
          icon="warranty"
          count={warrantyCount}
          selected={pathname.startsWith('/customer/warranty')}
          onPress={() => navigate('/customer/warranty')}
        />
        <BottomItem
          label="Tôi"
          icon="user"
          selected={pathname.startsWith('/customer/profile/')}
          onPress={() => navigate('/customer/profile/account-information')}
        />
      </View>
    </SafeAreaView>
  );
}

// ICON VÀ NHÃN ĐIỀU HƯỚNG
function BottomItem({
  label,
  icon,
  selected,
  count = 0,
  onPress,
}: {
  label: string;
  icon: 'home' | 'cart' | 'order' | 'warranty' | 'user';
  selected: boolean;
  count?: number;
  onPress: () => void;
}) {
  const color = selected ? '#168b87' : '#64748b';

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={count > 0 ? `${label}, ${count}` : label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className="min-h-12 flex-1 items-center justify-center gap-0.5 rounded-xl py-1 active:bg-teal-50"
    >
      <View className="relative h-[22px] w-[22px]">
        <Svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon === 'home' ? (
            <>
              <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
              <Path d="M9 21v-8h6v8" />
            </>
          ) : null}
          {icon === 'cart' ? (
            <>
              <Circle cx={8} cy={21} r={1} />
              <Circle cx={19} cy={21} r={1} />
              <Path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.57l1.65-8.43H5.12" />
            </>
          ) : null}
          {icon === 'order' ? (
            <>
              <Path d="m6 2-3 4v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />
            </>
          ) : null}
          {icon === 'user' ? (
            <>
              <Circle cx={12} cy={8} r={4} />
              <Path d="M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2" />
            </>
          ) : null}
          {icon === 'warranty' ? (
            <>
              <Path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <Path d="m9 12 2 2 4-4" />
            </>
          ) : null}
        </Svg>
        {count > 0 ? (
          <View className="absolute -right-3 -top-2 min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#168b87] px-1">
            <Text className="text-[10px] font-bold text-white">
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className={`text-[10px] ${selected ? 'font-bold text-[#168b87]' : 'font-medium text-slate-500'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
