import { router, useFocusEffect, usePathname, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useProductCompare } from './product-compare-provider';
import ProductCompareImage from './product-compare-image';
import ProductCompareIcon from './product-compare-icon';
import { useStoreScrollControls } from './store-scroll-to-top';

const MAX_COMPARE_PRODUCTS = 3;
const TABLET_CATEGORY_PATH = '/customer/product-category/may-tinh-bang';
const TABLET_COMPARE_PATH = '/customer/product-tablet-compare';

export default function ProductCompareTabletBar() {
  const pathname = usePathname();
  const { tablets, removeTablet, clearTablets, isHydrated, storageError } =
    useProductCompare();
  const tabletCount = tablets.length;
  const isTabletCategoryPage = pathname === TABLET_CATEGORY_PATH;
  const canCompare = tabletCount >= 2;
  const label = 'máy tính bảng';
  const { setFooterHeight } = useStoreScrollControls();
  const measuredHeight = useRef(0);
  const focused = useRef(false);
  const shown = isHydrated && tabletCount > 0 && isTabletCategoryPage;

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setFooterHeight(shown ? measuredHeight.current : 0);
      return () => {
        focused.current = false;
        setFooterHeight(0);
      };
    }, [shown, setFooterHeight]),
  );

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleCompare = () => {
    if (canCompare) router.push(TABLET_COMPARE_PATH as Href);
  };

  if (!shown) return null;

  return (
    <View
      className="border-t border-slate-200 bg-white px-4 pb-3 pt-2"
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (measuredHeight.current === height) return;
        measuredHeight.current = height;
        if (focused.current && shown) setFooterHeight(height);
      }}
    >
      {/* HEADER */}
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <ProductCompareIcon />
          <Text className="flex-1 text-sm font-bold text-slate-800">
            So sánh {label} ({tabletCount}/{MAX_COMPARE_PRODUCTS})
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={clearTablets}
          className="min-h-11 flex-row items-center gap-1 px-2"
        >
          <ProductCompareIcon name="trash" size={16} color="#e11d48" />
          <Text className="text-xs font-semibold text-rose-600">
            Xóa tất cả
          </Text>
        </Pressable>
      </View>
      {/* PRODUCT LIST */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, maxHeight: 130 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
      >
        {tablets.map((item) => (
          <View
            key={item.productId}
            className="w-44 rounded-xl border border-slate-200 bg-slate-50 p-2"
          >
            <View className="flex-row items-center gap-1">
              <View className="h-10 w-10">
                <ProductCompareImage
                  image={item.variant.image || item.image}
                  name={item.name}
                  kind="tablet"
                />
              </View>
              <Text
                className="flex-1 text-xs font-semibold text-slate-800"
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xóa ${item.name} khỏi danh sách so sánh`}
                onPress={() => removeTablet(item.productId)}
                className="min-h-11 w-11 items-center justify-center"
              >
                <ProductCompareIcon name="close" size={16} color="#64748b" />
              </Pressable>
            </View>
            <Text className="mt-1 text-[10px] text-slate-500" numberOfLines={2}>
              {[item.variant.storage, item.variant.color]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text className="mt-1 text-xs font-bold text-teal-700">
              {item.variant.price > 0
                ? new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(item.variant.price)
                : 'Liên hệ'}
            </Text>
          </View>
        ))}
        {tabletCount < MAX_COMPARE_PRODUCTS ? (
          <View className="w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 px-2">
            <Text className="text-center text-xs text-slate-500">
              Chọn thêm {label} từ danh sách
            </Text>
          </View>
        ) : null}
      </ScrollView>
      {storageError ? (
        <Text accessibilityRole="alert" className="mb-2 text-xs text-rose-600">
          {storageError}
        </Text>
      ) : null}
      {/* ACTIONS */}
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-xs text-slate-500">
          {canCompare
            ? `Đã chọn ${tabletCount} sản phẩm`
            : 'Chọn ít nhất 2 sản phẩm'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCompare }}
          disabled={!canCompare}
          onPress={handleCompare}
          className={`min-h-11 flex-row items-center justify-center gap-2 rounded-xl px-4 ${!canCompare ? 'bg-slate-200' : 'bg-teal-700'}`}
        >
          <ProductCompareIcon
            size={16}
            color={!canCompare ? '#94a3b8' : '#fff'}
          />
          <Text
            className={`text-sm font-semibold ${!canCompare ? 'text-slate-400' : 'text-white'}`}
          >
            So sánh ngay
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
