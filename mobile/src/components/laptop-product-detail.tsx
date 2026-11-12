import { StoreScrollView } from '@/components/store-scroll-to-top';
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { FRONTEND_ASSET_URL } from "@/constants/api";
import { customerCartService } from "@/lib/axios/services/customer-services/cart_service";
import { customerPromotionService } from "@/lib/axios/services/customer-services/promotion_service";
import { getStoredUser } from "@/lib/storage/secure_storage";

export type LaptopDetailVariant = {
  sku: string;
  slug: string;
  ram: string;
  ssd: string;
  color: string;
  colorSlug: string;
  colorHex?: string;
  price: number;
  images: string[];
};
export type LaptopDetailProduct = {
  _id: string;
  name: string;
  slug: string;
  image: string;
  ram: string;
  ssd: string;
  variants: LaptopDetailVariant[];
  processor?: Record<string, unknown>;
  graphics?: Record<string, unknown>;
  memoryAndStorage?: Record<string, unknown>;
  display?: Record<string, unknown>;
  connectivityAndExpansion?: Record<string, unknown>;
  dimensionsAndBattery?: Record<string, unknown>;
};
type Props = { refreshing?: boolean; onRefresh?: () => void; refreshKey?: number; product: LaptopDetailProduct; selectedSlug?: string };
type PromotionDiscount = {
  promotionId: string;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: number;
};
const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
const imageUrl = (image: string) =>
  image.startsWith("http")
    ? image
    : `${FRONTEND_ASSET_URL}/product/laptop/${image}`;

function Section({
  title,
  children,
  openByDefault = false,
}: {
  title: string;
  children: React.ReactNode;
  openByDefault?: boolean;
}) {
  const [open, setOpen] = useState(openByDefault);
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Pressable
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-center justify-between p-4"
      >
        <Text className="font-bold text-slate-800">{title}</Text>
        <Text className="text-lg text-teal-700">{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? (
        <View className="border-t border-slate-100 bg-slate-50 p-4">
          {children}
        </View>
      ) : null}
    </View>
  );
}
function InfoRow({ label, value }: { label: string; value?: unknown }) {
  if (value === undefined || value === null || value === "") return null;
  const display = Array.isArray(value)
    ? value.join("\n")
    : typeof value === "boolean"
      ? value
        ? "Có"
        : "Không"
      : String(value);

  return (
    <View className="flex-row border-b border-slate-200 py-2">
      <Text className="w-2/5 text-sm text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-slate-800">
        {display}
      </Text>
    </View>
  );
}

function InfoList({ label, value }: { label: string; value?: unknown }) {
  return <InfoRow label={label} value={value} />;
}

export default function LaptopProductDetail({ product, selectedSlug, refreshing = false, onRefresh, refreshKey = 0 }: Props) {
  const initial =
    product.variants.find((variant) => variant.slug === selectedSlug) ??
    product.variants[0];
  const [ram, setRam] = useState(initial?.ram ?? product.ram);
  const [ssd, setSsd] = useState(initial?.ssd ?? product.ssd);
  const [color, setColor] = useState(initial?.colorSlug ?? "");
  const [imageIndex, setImageIndex] = useState(0);
  const [promotion, setPromotion] = useState<PromotionDiscount | null>(null);
  const [adding, setAdding] = useState(false);
  const selected = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.ram === ram &&
          variant.ssd === ssd &&
          variant.colorSlug === color,
      ) ?? initial,
    [product.variants, ram, ssd, color, initial],
  );
  const rams = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.ram))],
    [product.variants],
  );
  const ssds = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.ssd))],
    [product.variants],
  );
  const colors = useMemo(() => {
    const map = new Map<string, LaptopDetailVariant>();
    product.variants.forEach((variant) => map.set(variant.colorSlug, variant));
    return [...map.values()];
  }, [product.variants]);
  useEffect(() => {
    let cancelled = false;

    const loadPromotion = async () => {
      const sku = selected?.sku;

      if (!sku) {
        setPromotion(null);
        return;
      }

      setPromotion(null);

      try {
        const response = await customerPromotionService.getDirectDiscount(sku);
        const result =
          response?.promotion ??
          response?.data?.promotion ??
          response?.data ??
          response;

        if (!cancelled) {
          setPromotion(
            result?.discountType && result?.discountValue != null
              ? result
              : null,
          );
        }
      } catch (error) {
        console.error("Không thể tải khuyến mãi:", error);

        if (!cancelled) {
          setPromotion(null);
        }
      }
    };

    loadPromotion();

    return () => {
      cancelled = true;
    };
  }, [selected?.sku, refreshKey]);

  const currentPrice = selected?.price ?? 0;
  const discountValue =
    promotion?.discountType === "PERCENTAGE"
      ? (currentPrice * promotion.discountValue) / 100
      : promotion?.discountType === "FIXED_AMOUNT"
        ? promotion.discountValue
        : 0;
  const finalPrice = Math.max(0, currentPrice - discountValue);
  const hasPromotion = Boolean(promotion && discountValue > 0);
  const savedAmount = currentPrice - finalPrice;
  const discountLabel =
    promotion?.discountType === "PERCENTAGE"
      ? `-${promotion.discountValue}%`
      : `-${money(promotion?.discountValue ?? 0)}`;
  const images = selected?.images?.length ? selected.images : [product.image];
  const selectVariant = (variant: LaptopDetailVariant) => {
    setRam(variant.ram);
    setSsd(variant.ssd);
    setColor(variant.colorSlug);
    setImageIndex(0);
  };
  const addToCart = async () => {
    if (!selected) return;
    const user = await getStoredUser();
    if (!user.userId) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.",
      );
      router.push("/customer/(auth)/login" as never);
      return;
    }
    setAdding(true);
    try {
      await customerCartService.addItem({
        userId: user.userId,
        item: {
          productId: product._id,
          sku: selected.sku,
          variantSlug: selected.slug,
          productName: `${product.name} ${selected.ram} ${selected.ssd} ${selected.color}`,
          imageUrl: selected.images?.[0] ?? product.image,
          quantity: 1,
          price: selected.price,
        },
      });
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      Alert.alert(
        "Không thể thêm vào giỏ",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setAdding(false);
    }
  };
  return (
    <StoreScrollView
      alwaysBounceVertical
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#168b87" />}
      contentContainerClassName="px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} className="mb-3">
        <Text className="text-sm font-semibold text-teal-700">‹ Quay lại</Text>
      </Pressable>
      <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
        <View className="relative h-72 items-center justify-center rounded-2xl bg-slate-50">
          {hasPromotion ? (
            <Text className="absolute left-3 top-3 z-10 rounded-full bg-rose-500 px-3 py-1 font-bold text-white">
              {discountLabel}
            </Text>
          ) : null}
          <Image
            source={{ uri: imageUrl(images[imageIndex] ?? images[0]) }}
            className="h-full w-full"
            resizeMode="contain"
          />
        </View>
        <ScrollView
          horizontal
          className="mt-3"
          showsHorizontalScrollIndicator={false}
        >
          {images.map((image, index) => (
            <Pressable
              key={`${image}-${index}`}
              onPress={() => setImageIndex(index)}
              className={`mr-2 h-16 w-16 rounded-xl border-2 p-1 ${index === imageIndex ? "border-teal-600" : "border-slate-200"}`}
            >
              <Image
                source={{ uri: imageUrl(image) }}
                className="h-full w-full"
                resizeMode="contain"
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
        <View className="mb-2 flex-row flex-wrap gap-2">
          <Text className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            Laptop
          </Text>
          <Text className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            ✦ Sản phẩm nổi bật
          </Text>
        </View>
        <Text className="text-2xl font-extrabold text-slate-900">
          {product.name}
        </Text>
        <Text className="text-sm text-slate-500">
          {selected?.ram} · {selected?.ssd} · {selected?.color}
        </Text>
        <Text className="mt-2 text-3xl font-extrabold text-teal-700">
          {selected
            ? money(hasPromotion ? finalPrice : currentPrice)
            : "Liên hệ"}
        </Text>
        {hasPromotion ? (
          <Text className="mt-1 text-sm text-slate-400 line-through">
            {money(currentPrice)}
          </Text>
        ) : null}
        {hasPromotion && promotion?.promotionName ? (
          <Text className="mt-2 text-sm font-semibold text-rose-600">
            Khuyến mãi: {promotion.promotionName}
          </Text>
        ) : null}
        {hasPromotion && savedAmount > 0 ? (
          <Text className="mt-1 text-sm font-semibold text-emerald-600">
            Tiết kiệm {money(savedAmount)}
          </Text>
        ) : null}
        <Text className="mb-2 mt-5 font-bold text-slate-800">RAM:</Text>
        <View className="flex-row flex-wrap gap-2">
          {rams.map((value) => {
            const variant = product.variants.find(
              (item) =>
                item.ram === value &&
                item.ssd === ssd &&
                item.colorSlug === color,
            );
            return (
              <Pressable
                key={value}
                disabled={!variant}
                onPress={() => variant && selectVariant(variant)}
                className={`rounded-xl border px-4 py-2 ${value === ram ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}
              >
                <Text className="text-slate-700">{value}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="mb-2 mt-5 font-bold text-slate-800">SSD:</Text>
        <View className="flex-row flex-wrap gap-2">
          {ssds.map((value) => {
            const variant = product.variants.find(
              (item) =>
                item.ram === ram &&
                item.ssd === value &&
                item.colorSlug === color,
            );
            return (
              <Pressable
                key={value}
                disabled={!variant}
                onPress={() => variant && selectVariant(variant)}
                className={`rounded-xl border px-4 py-2 ${value === ssd ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}
              >
                <Text className="text-slate-700">{value}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="mb-2 mt-5 font-bold text-slate-800">
          Màu sắc: {selected?.color}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {colors.map((variant) => {
            const available = product.variants.find(
              (item) =>
                item.ram === ram &&
                item.ssd === ssd &&
                item.colorSlug === variant.colorSlug,
            );
            return (
              <Pressable
                key={variant.colorSlug}
                disabled={!available}
                onPress={() => available && selectVariant(available)}
                className={`rounded-xl border px-4 py-2 ${variant.colorSlug === color ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}
              >
                <Text className="text-slate-700">{variant.color}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={addToCart}
          disabled={adding}
          className="mt-6 items-center rounded-xl bg-teal-700 py-3"
        >
          <Text className="font-bold text-white">
            {adding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
          </Text>
        </Pressable>
        <View className="mt-5 flex-row flex-wrap gap-y-3 border-t border-slate-100 pt-5">
          <View className="w-1/2 flex-row items-center gap-2 pr-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-50">
              <Text className="text-sm font-bold text-teal-700">✓</Text>
            </View>
            <Text className="flex-1 text-xs text-slate-500">
              Bảo hành chính hãng
            </Text>
          </View>
          <View className="w-1/2 flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-50">
              <Text className="text-sm font-bold text-teal-700">✓</Text>
            </View>
            <Text className="flex-1 text-xs text-slate-500">
              Giao hàng toàn quốc
            </Text>
          </View>
          <View className="w-1/2 flex-row items-center gap-2 pr-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-50">
              <Text className="text-sm font-bold text-teal-700">✓</Text>
            </View>
            <Text className="flex-1 text-xs text-slate-500">
              Hỗ trợ đổi trả
            </Text>
          </View>
        </View>
      </View>
      <Text className="mb-3 mt-6 text-xl font-extrabold text-slate-900">
        Thông số kỹ thuật
      </Text>
      <Section title="Bộ xử lý" openByDefault>
        <InfoRow
          label="Công nghệ CPU"
          value={product.processor?.cpuTechnology}
        />
        <InfoRow label="Số nhân" value={product.processor?.cpuCores} />
        <InfoRow label="Số luồng" value={product.processor?.cpuThreads} />
        <InfoRow label="Tốc độ CPU" value={product.processor?.cpuSpeed} />
      </Section>
      <Section title="Đồ họa GPU">
        <InfoRow label="Card màn hình" value={product.graphics?.graphicsCard} />
      </Section>
      <Section title="Bộ nhớ RAM - Ổ cứng">
        <InfoRow label="RAM" value={product.memoryAndStorage?.ram} />
        <InfoRow label="Loại RAM" value={product.memoryAndStorage?.ramType} />
        <InfoRow
          label="Tốc độ Bus RAM"
          value={product.memoryAndStorage?.ramBusSpeed}
        />
        <InfoRow
          label="Hỗ trợ RAM tối đa"
          value={product.memoryAndStorage?.maxRamCapacity}
        />
        <InfoRow label="Ổ cứng" value={product.memoryAndStorage?.storage} />
      </Section>
      <Section title="Màn hình">
        <InfoRow
          label="Kích thước màn hình"
          value={product.display?.screenSize}
        />
        <InfoRow label="Độ phân giải" value={product.display?.resolution} />
        <InfoRow label="Tấm nền" value={product.display?.panelType} />
        <InfoRow label="Tần số quét" value={product.display?.refreshRate} />
        <InfoRow label="Độ phủ màu" value={product.display?.colorCoverage} />
        <InfoList
          label="Công nghệ màn hình"
          value={product.display?.screenTechnology}
        />
      </Section>
      <Section title="Cổng kết nối - Tính năng mở rộng">
        <InfoList
          label="Cổng giao tiếp"
          value={product.connectivityAndExpansion?.ports}
        />
        <InfoList
          label="Kết nối không dây"
          value={product.connectivityAndExpansion?.wirelessConnectivity}
        />
        <InfoRow
          label="Khe đọc thẻ nhớ"
          value={product.connectivityAndExpansion?.memoryCardSlot}
        />
        <InfoRow
          label="Webcam"
          value={product.connectivityAndExpansion?.webcam}
        />
        <InfoRow
          label="Đèn bàn phím"
          value={product.connectivityAndExpansion?.keyboardBacklight}
        />
        <InfoRow
          label="Bảo mật"
          value={product.connectivityAndExpansion?.security}
        />
        <InfoList
          label="Công nghệ âm thanh"
          value={product.connectivityAndExpansion?.audioTechnology}
        />
        <InfoRow
          label="Hệ thống tản nhiệt"
          value={product.connectivityAndExpansion?.cooling}
        />
      </Section>
      <Section title="Kích thước - Khối lượng - Pin">
        <InfoRow label="Pin" value={product.dimensionsAndBattery?.battery} />
        <InfoRow
          label="Hệ điều hành"
          value={product.dimensionsAndBattery?.operatingSystem}
        />
        <InfoRow
          label="Năm ra mắt"
          value={product.dimensionsAndBattery?.releaseYear}
        />
        <InfoRow
          label="Kích thước"
          value={product.dimensionsAndBattery?.dimensions}
        />
        <InfoRow
          label="Trọng lượng"
          value={product.dimensionsAndBattery?.weight}
        />
        <InfoRow
          label="Chất liệu"
          value={product.dimensionsAndBattery?.material}
        />
      </Section>
    </StoreScrollView>
  );
}
