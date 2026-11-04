import { memo, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { FRONTEND_ASSET_URL } from '@/constants/api';

export type TabletVariant = {
  sku: string;
  slug: string;
  storage?: string;
  color?: string;
  colorSlug?: string;
  price: number;
  images?: string[];
};

export type Tablet = {
  _id: string;
  name: string;
  slug: string;
  image: string;
  brandId?: string;
  categoryId?: string;
  screenTech?: string;
  screenSize?: string;
  variants: TabletVariant[];
};

export type PromotionDiscount = {
  promotionId?: number;
  promotionName?: string;
  sku: string;
  discountType: string;
  discountValue: string;
};

type TabletProductCardProps = {
  product: Tablet;
  promotions: PromotionDiscount[];
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);

const getImageUrl = (image: string) =>
  image.startsWith('http') ? image : `${FRONTEND_ASSET_URL}/product/tablet/${image}`;

function TabletProductCard({
  product,
  promotions,
}: TabletProductCardProps) {
  const storages = useMemo(
    () => [...new Set((product.variants ?? []).map((variant) => variant.storage).filter(Boolean))] as string[],
    [product.variants],
  );
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, TabletVariant>();
    (product.variants ?? []).forEach((variant) => {
      const key = variant.colorSlug ?? variant.color ?? '';
      if (key && !uniqueColors.has(key)) uniqueColors.set(key, variant);
    });
    return Array.from(uniqueColors.values());
  }, [product.variants]);

  const [selectedStorage, setSelectedStorage] = useState(
    product.variants?.[0]?.storage ?? '',
  );
  const [selectedColorSlug, setSelectedColorSlug] = useState(
    product.variants?.[0]?.colorSlug ?? product.variants?.[0]?.color ?? '',
  );

  const selectedVariant = useMemo(
    () =>
      product.variants?.find(
        (variant) =>
          variant.storage === selectedStorage &&
          (variant.colorSlug ?? variant.color) === selectedColorSlug,
      ) ??
      product.variants?.find((variant) => variant.storage === selectedStorage) ??
      product.variants?.[0],
    [product.variants, selectedStorage, selectedColorSlug],
  );
  const promotion = useMemo(
    () => promotions.find((item) => item.sku === selectedVariant?.sku) ?? null,
    [promotions, selectedVariant?.sku],
  );
  const currentPrice = selectedVariant?.price ?? 0;
  const discountValue = Number(promotion?.discountValue ?? 0);
  const finalPrice =
    promotion?.discountType === 'PERCENTAGE'
      ? currentPrice * (1 - discountValue / 100)
      : promotion?.discountType === 'FIXED_AMOUNT'
        ? Math.max(0, currentPrice - discountValue)
        : currentPrice;
  const savedAmount = Math.max(0, currentPrice - finalPrice);
  const hasPromotion = Boolean(promotion);
  const discountLabel =
    promotion?.discountType === 'PERCENTAGE'
      ? `-${discountValue}%`
      : `-${formatPrice(discountValue)}`;
  const currentSlug = selectedVariant?.slug ?? product.slug;
  const currentImage =
    selectedVariant?.images?.[0] ??
    product.variants?.find((variant) => variant.images?.[0])?.images?.[0] ??
    product.image;
  const currentStorage = selectedVariant?.storage ?? '';
  const currentColor = selectedVariant?.color ?? '';
  const openDetail = () =>
    router.push(`/customer/product-detail/${currentSlug}` as never);

  return (
    <View className="h-[520px] flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <Pressable onPress={openDetail} accessibilityLabel={`Xem chi tiết ${product.name}`} className="relative m-3 h-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-2">
        <Image source={{ uri: getImageUrl(currentImage) }} accessibilityLabel={`${product.name} ${currentStorage} ${currentColor}`} className="h-full w-full" resizeMode="contain" />
        {hasPromotion ? <Text className="absolute left-2 top-2 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white">{discountLabel}</Text> : null}
        <Text className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-600">{currentColor || 'Tablet'}</Text>
      </Pressable>

      <View className="flex-1 px-4 pb-4">
        <Pressable onPress={openDetail}>
          <Text className="min-h-10 text-[15px] font-semibold leading-5 text-slate-900" numberOfLines={2}>{product.name} {currentStorage}</Text>
        </Pressable>
        <View className="mt-2 h-7 flex-row flex-wrap gap-1.5 overflow-hidden">
          {product.screenTech ? <Text className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{product.screenTech}</Text> : null}
          {product.screenSize ? <Text className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{product.screenSize}</Text> : null}
        </View>

        <View className="mt-3 h-[58px] overflow-hidden">
          {storages.length > 0 ? (
            <>
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dung lượng:</Text>
              <View className="flex-row flex-wrap gap-2">
                {storages.map((storage) => <Pressable key={storage} onPress={() => setSelectedStorage(storage)} className={`rounded-lg border px-3 py-1.5 ${storage === selectedStorage ? 'border-teal-600 bg-teal-600' : 'border-slate-200 bg-white'}`}><Text className={`text-xs font-semibold ${storage === selectedStorage ? 'text-white' : 'text-slate-600'}`}>{storage}</Text></Pressable>)}
              </View>
            </>
          ) : null}
        </View>

        <View className="mt-3 h-[58px] overflow-hidden">
          {colors.length > 0 ? (
            <>
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Màu sắc: <Text className="normal-case tracking-normal text-slate-600">{currentColor}</Text></Text>
              <View className="flex-row flex-wrap gap-2">
                {colors.map((variant) => {
                  const key = variant.colorSlug ?? variant.color ?? '';
                  return <Pressable key={key} onPress={() => setSelectedColorSlug(key)} className={`rounded-lg border px-3 py-1.5 ${key === selectedColorSlug ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}><Text className="text-xs font-medium text-slate-600">{variant.color}</Text></Pressable>;
                })}
              </View>
            </>
          ) : null}
        </View>

        <View className="mt-4 h-[62px] border-t border-slate-100 pt-3">
          {currentPrice > 0 ? (
            <>
              <View className="flex-row flex-wrap items-center gap-2"><Text className="text-lg font-semibold text-teal-700">{formatPrice(hasPromotion ? finalPrice : currentPrice)}</Text>{hasPromotion ? <Text className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">{discountLabel}</Text> : null}</View>
              {hasPromotion ? <View className="mt-1 flex-row flex-wrap gap-2"><Text className="text-xs text-slate-400 line-through">{formatPrice(currentPrice)}</Text>{savedAmount > 0 ? <Text className="text-[10px] text-emerald-600">Tiết kiệm {formatPrice(savedAmount)}</Text> : null}</View> : null}
            </>
          ) : <><Text className="text-xs text-slate-400">Giá bán</Text><Text className="text-lg text-slate-600">Liên hệ</Text></>}
        </View>
        <Pressable onPress={openDetail} className="mt-auto items-center rounded-xl bg-teal-700 px-4 py-3"><Text className="text-sm font-semibold text-white">Xem chi tiết  →</Text></Pressable>
      </View>
    </View>
  );
}

export default memo(TabletProductCard);
