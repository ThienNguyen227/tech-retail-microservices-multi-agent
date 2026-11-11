import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { FRONTEND_ASSET_URL } from "@/constants/api";
import { customerCartService } from "@/lib/axios/services/customer-services/cart_service";
import { customerPromotionService } from "@/lib/axios/services/customer-services/promotion_service";
import { getStoredUser } from "@/lib/storage/secure_storage";

export type TabletDetailVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};
export type TabletDetailProduct = {
  _id: string;
  name: string;
  slug: string;
  image: string;
  screenTech?: string;
  screenSize?: string;
  variants: TabletDetailVariant[];
  screen?: Record<string, unknown>;
  operatingSystemAndCpu?: Record<string, unknown>;
  memoryAndStorage?: Record<string, unknown>;
  rearCamera?: Record<string, unknown>;
  frontCamera?: Record<string, unknown>;
  connectivity?: Record<string, unknown>;
  utilities?: Record<string, unknown>;
  batteryAndCharge?: Record<string, unknown>;
  designAndMaterials?: Record<string, unknown>;
};
type Props = { refreshing?: boolean; onRefresh?: () => void; refreshKey?: number; product: TabletDetailProduct; selectedSlug: string };
type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: string;
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
    : `${FRONTEND_ASSET_URL}/product/tablet/${image}`;

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

export default function TabletProductDetail({ product, selectedSlug, refreshing = false, onRefresh, refreshKey = 0 }: Props) {
  const initial =
    product.variants.find((variant) => variant.slug === selectedSlug) ??
    product.variants[0];
  const [storage, setStorage] = useState(initial?.storage ?? "");
  const [color, setColor] = useState(initial?.colorSlug ?? "");
  const [imageIndex, setImageIndex] = useState(0);
  const [promotion, setPromotion] = useState<PromotionDiscount | null>(null);
  const [adding, setAdding] = useState(false);
  const selected = useMemo(
    () =>
      product.variants.find(
        (variant) => variant.storage === storage && variant.colorSlug === color,
      ) ?? initial,
    [product.variants, storage, color, initial],
  );
  const storages = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.storage))],
    [product.variants],
  );
  const colors = useMemo(() => {
    const map = new Map<string, TabletDetailVariant>();
    product.variants.forEach((variant) => map.set(variant.colorSlug, variant));
    return [...map.values()];
  }, [product.variants]);
  useEffect(() => {
    let cancelled = false;

    const fetchPromotion = async () => {
      setPromotion(null);

      if (!selected?.sku) {
        return;
      }

      try {
        const result = await customerPromotionService.getDirectDiscount(
          selected.sku,
        );

        if (!cancelled) {
          setPromotion(result ?? null);
        }
      } catch (error) {
        console.error("Không thể lấy khuyến mãi:", error);

        if (!cancelled) {
          setPromotion(null);
        }
      }
    };

    fetchPromotion();

    return () => {
      cancelled = true;
    };
  }, [selected?.sku, refreshKey]);

  const originalPrice = selected?.price ?? 0;
  const discountValue = Number(promotion?.discountValue ?? 0);
  const discountAmount =
    promotion?.discountType === "PERCENTAGE"
      ? Math.round((originalPrice * discountValue) / 100)
      : promotion?.discountType === "FIXED_AMOUNT"
        ? discountValue
        : 0;
  const savedAmount = Math.min(Math.max(discountAmount, 0), originalPrice);
  const finalPrice = Math.max(originalPrice - savedAmount, 0);
  const hasPromotion = Boolean(promotion && savedAmount > 0);
  const discountLabel =
    promotion?.discountType === "PERCENTAGE"
      ? `-${discountValue}%`
      : `-${money(savedAmount)}`;
  const images = selected?.images?.length ? selected.images : [product.image];
  const selectVariant = (variant: TabletDetailVariant) => {
    setStorage(variant.storage);
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
          productName: `${product.name} ${selected.storage} ${selected.color}`,
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
    <ScrollView
      alwaysBounceVertical
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#168b87" />}
      contentContainerClassName="px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} className="mb-3">
        <Text className="text-sm font-semibold text-teal-700">‹ Quay lại</Text>
      </Pressable>
      <Text className="mb-4 text-xs text-slate-500">
        Màn hình:{" "}
        {String(
          product.screen?.screenSize ?? product.screenSize ?? "Đang cập nhật",
        )}{" "}
        · Công nghệ:{" "}
        {String(
          product.screen?.screenTechnology ??
            product.screenTech ??
            "Đang cập nhật",
        )}
      </Text>
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
            Máy tính bảng
          </Text>
          <Text className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            ✦ Sản phẩm nổi bật
          </Text>
        </View>
        <Text className="text-2xl font-extrabold text-slate-900">
          {product.name}
        </Text>
        <Text className="text-sm text-slate-500">
          {selected?.storage} · {selected?.color}
        </Text>
        <Text className="mt-2 text-3xl font-extrabold text-teal-700">
          {selected
            ? money(hasPromotion ? finalPrice : originalPrice)
            : "Liên hệ"}
        </Text>
        {hasPromotion ? (
          <Text className="mt-1 text-sm text-slate-400 line-through">
            {money(originalPrice)}
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
        <Text className="mb-2 mt-5 font-bold text-slate-800">Dung lượng</Text>
        <View className="flex-row flex-wrap gap-2">
          {storages.map((value) => {
            const variant = product.variants.find(
              (item) => item.storage === value && item.colorSlug === color,
            );
            return (
              <Pressable
                key={value}
                disabled={!variant}
                onPress={() => variant && selectVariant(variant)}
                className={`rounded-xl border px-4 py-2 ${value === storage ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}
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
                item.storage === storage &&
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
      <Section title="Màn hình" openByDefault>
        <InfoRow
          label="Công nghệ màn hình"
          value={product.screen?.screenTechnology ?? product.screenTech}
        />
        <InfoRow
          label="Kích thước màn hình"
          value={product.screen?.screenSize ?? product.screenSize}
        />
      </Section>
      <Section title="Hệ điều hành và CPU">
        <InfoRow
          label="Hệ điều hành"
          value={product.operatingSystemAndCpu?.operatingSystem}
        />
        <InfoRow label="CPU" value={product.operatingSystemAndCpu?.cpu} />
        <InfoRow
          label="Tốc độ CPU"
          value={product.operatingSystemAndCpu?.cpuSpeed}
        />
        <InfoRow label="GPU" value={product.operatingSystemAndCpu?.gpu} />
      </Section>
      <Section title="Bộ nhớ và lưu trữ">
        <InfoRow
          label="RAM"
          value={product.memoryAndStorage?.randomAccessMemory}
        />
        <InfoRow label="Bộ nhớ trong" value={selected?.storage} />
        <InfoRow
          label="Dung lượng khả dụng"
          value={product.memoryAndStorage?.usableStorage}
        />
        <InfoRow
          label="Thẻ nhớ ngoài"
          value={product.memoryAndStorage?.externalMemoryCard}
        />
      </Section>
      <Section title="Camera sau">
        <InfoRow
          label="Độ phân giải"
          value={product.rearCamera?.rearCameraResolution}
        />
        <InfoList
          label="Quay video"
          value={product.rearCamera?.rearVideoRecording}
        />
        <InfoList
          label="Tính năng camera"
          value={product.rearCamera?.rearCameraFeatures}
        />
        <InfoRow label="Đèn flash" value={product.rearCamera?.rearFlash} />
      </Section>
      <Section title="Camera trước">
        <InfoRow
          label="Độ phân giải"
          value={product.frontCamera?.frontCameraResolution}
        />
        <InfoList
          label="Tính năng camera"
          value={product.frontCamera?.frontCameraFeatures}
        />
      </Section>
      <Section title="Pin và sạc">
        <InfoRow
          label="Dung lượng pin"
          value={product.batteryAndCharge?.batteryCapacity}
        />
        <InfoRow
          label="Loại pin"
          value={product.batteryAndCharge?.batteryType}
        />
        <InfoRow
          label="Công nghệ pin"
          value={product.batteryAndCharge?.batteryTechnology}
        />
        <InfoRow
          label="Công suất sạc tối đa"
          value={product.batteryAndCharge?.maxChargingPower}
        />
        <InfoRow
          label="Củ sạc đi kèm"
          value={product.batteryAndCharge?.chargerIncluded}
        />
      </Section>
      <Section title="Kết nối">
        <InfoRow
          label="Mạng di động"
          value={product.connectivity?.mobileNetwork}
        />
        <InfoRow label="Loại SIM" value={product.connectivity?.simType} />
        <InfoRow
          label="Hỗ trợ nghe gọi"
          value={product.connectivity?.voiceCallSupport}
        />
        <InfoList label="Wi-Fi" value={product.connectivity?.wifi} />
        <InfoList label="Định vị GPS" value={product.connectivity?.gps} />
        <InfoRow label="Bluetooth" value={product.connectivity?.bluetooth} />
        <InfoRow
          label="Cổng kết nối"
          value={product.connectivity?.connectorPort}
        />
        <InfoRow
          label="Jack tai nghe"
          value={product.connectivity?.headphoneJack}
        />
        <InfoRow
          label="Kết nối khác"
          value={product.connectivity?.otherConnectivity}
        />
      </Section>
      <Section title="Tiện ích">
        <InfoList
          label="Tính năng đặc biệt"
          value={product.utilities?.specialFeatures}
        />
        <InfoRow
          label="Kháng nước, bụi"
          value={product.utilities?.waterResistance}
        />
        <InfoRow label="Ghi âm" value={product.utilities?.audioRecording} />
        <InfoRow label="Radio" value={product.utilities?.radio} />
      </Section>
      <Section title="Thiết kế và chất liệu">
        <InfoRow
          label="Chất liệu"
          value={product.designAndMaterials?.materials}
        />
        <InfoRow
          label="Kích thước"
          value={product.designAndMaterials?.dimensions}
        />
        <InfoRow
          label="Khối lượng"
          value={product.designAndMaterials?.weight}
        />
        <InfoRow
          label="Thời điểm ra mắt"
          value={product.designAndMaterials?.releaseDate}
        />
      </Section>
    </ScrollView>
  );
}
