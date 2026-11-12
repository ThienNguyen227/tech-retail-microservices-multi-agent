import { StoreScrollView } from '@/components/store-scroll-to-top';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProductCompare } from '@/components/product-compare-provider';
import ProductCompareImage from '@/components/product-compare-image';
import ProductCompareIcon from '@/components/product-compare-icon';
import { customerProductService } from '@/lib/axios/services/customer-services/product_service';

// ============================================================
// TYPES
// ============================================================

type TabletVariant = {
  sku: string;
  slug?: string;
  storage?: string;
  color?: string;
  colorSlug?: string;
  price?: number;
  images?: string[];
};

type TabletComparisonProduct = {
  _id: string;

  name: string;
  slug: string;
  image: string;

  brandId: string;
  categoryId: string;

  screenTech?: string;
  screenSize?: string;

  variants?: TabletVariant[];

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

type CompareApiResponse = {
  message: string;
  count: number;
  products: TabletComparisonProduct[];
};

type ComparisonColumn = {
  product: TabletComparisonProduct;
  variant: TabletVariant;
};

type SpecGroupKey =
  | 'screen'
  | 'operatingSystemAndCpu'
  | 'memoryAndStorage'
  | 'rearCamera'
  | 'frontCamera'
  | 'connectivity'
  | 'utilities'
  | 'batteryAndCharge'
  | 'designAndMaterials';

type SpecGroup = {
  key: SpecGroupKey;
  title: string;
  description: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const PRODUCT_CATEGORY_URL = '/customer/product-category/may-tinh-bang';

const MAX_COMPARE_PRODUCTS = 3;

const SPEC_GROUPS: SpecGroup[] = [
  {
    key: 'screen',
    title: 'Màn hình',
    description: 'Công nghệ màn hình, kích thước và các thông số hiển thị',
  },
  {
    key: 'operatingSystemAndCpu',
    title: 'Hệ điều hành và bộ xử lý',
    description: 'Hệ điều hành, CPU, tốc độ xử lý và GPU',
  },
  {
    key: 'memoryAndStorage',
    title: 'Bộ nhớ và lưu trữ',
    description: 'RAM, bộ nhớ trong và khả năng mở rộng dung lượng',
  },
  {
    key: 'rearCamera',
    title: 'Camera sau',
    description: 'Độ phân giải và các tính năng camera sau',
  },
  {
    key: 'frontCamera',
    title: 'Camera trước',
    description: 'Độ phân giải và các tính năng camera trước',
  },
  {
    key: 'connectivity',
    title: 'Kết nối',
    description: 'Mạng di động, Wi-Fi, Bluetooth và cổng kết nối',
  },
  {
    key: 'utilities',
    title: 'Tiện ích',
    description: 'Các tính năng và tiện ích được trang bị',
  },
  {
    key: 'batteryAndCharge',
    title: 'Pin và sạc',
    description: 'Dung lượng pin và công nghệ sạc',
  },
  {
    key: 'designAndMaterials',
    title: 'Thiết kế và chất liệu',
    description: 'Kiểu dáng, kích thước, trọng lượng và vật liệu',
  },
];

// ============================================================
// FIELD LABELS
// ============================================================

const FIELD_LABELS: Record<string, string> = {
  // Screen
  screenTechnology: 'Công nghệ màn hình',
  screenSize: 'Kích thước màn hình',
  screenResolution: 'Độ phân giải màn hình',
  refreshRate: 'Tần số quét',
  maxBrightness: 'Độ sáng tối đa',
  touchScreenGlass: 'Chất liệu kính màn hình',

  // Operating system and CPU
  operatingSystem: 'Hệ điều hành',
  cpu: 'CPU',
  cpuSpeed: 'Tốc độ CPU',
  gpu: 'GPU',

  // Memory and storage
  randomAccessMemory: 'RAM',
  usableStorage: 'Bộ nhớ khả dụng',
  internalStorage: 'Bộ nhớ trong',
  externalMemoryCard: 'Thẻ nhớ ngoài',
  maximumMemoryCard: 'Dung lượng thẻ nhớ tối đa',

  // Rear camera
  rearCameraResolution: 'Độ phân giải camera sau',
  rearVideoRecording: 'Quay video camera sau',
  rearFlashlight: 'Đèn flash camera sau',
  rearCameraFeatures: 'Tính năng camera sau',

  // Front camera
  frontCameraResolution: 'Độ phân giải camera trước',
  frontVideoRecording: 'Quay video camera trước',
  frontCameraFeatures: 'Tính năng camera trước',

  // Connectivity
  mobileNetwork: 'Mạng di động',
  simType: 'Loại SIM',
  wifi: 'Wi-Fi',
  gps: 'Định vị GPS',
  bluetooth: 'Bluetooth',
  connectorPort: 'Cổng kết nối',
  headphoneJack: 'Cổng tai nghe',
  otherConnectivity: 'Kết nối khác',

  // Utilities
  advancedSecurity: 'Bảo mật nâng cao',
  waterResistance: 'Kháng nước, kháng bụi',
  audioRecording: 'Ghi âm',
  supportedVideoFormats: 'Định dạng video hỗ trợ',
  supportedAudioFormats: 'Định dạng âm thanh hỗ trợ',

  // Battery
  batteryCapacity: 'Dung lượng pin',
  batteryLife: 'Thời lượng pin',
  batteryType: 'Loại pin',
  maxChargingPower: 'Công suất sạc tối đa',
  batteryFeatures: 'Công nghệ pin và sạc',

  // Design
  designType: 'Kiểu thiết kế',
  materials: 'Chất liệu',
  dimensions: 'Kích thước',
  weight: 'Trọng lượng',
  releaseDate: 'Thời điểm ra mắt',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function getFieldLabel(key: string) {
  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase());
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const apiMessage = (
      error as {
        response?: {
          data?: {
            message?: unknown;
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(apiMessage)) {
      return apiMessage.join(', ');
    }

    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể tải dữ liệu so sánh. Vui lòng thử lại.';
}

// ============================================================
// SPECIFICATION VALUE
// ============================================================

function SpecificationValue({ value }: { value: unknown }) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && !value.length)
  ) {
    return <Text className="text-sm italic text-slate-400">Chưa cập nhật</Text>;
  }
  if (typeof value === 'boolean') {
    return (
      <View
        className={`flex-row items-center gap-1 self-start rounded-lg px-2.5 py-1 ${value ? 'bg-emerald-50' : 'bg-slate-100'}`}
      >
        {value ? (
          <ProductCompareIcon name="check" color="#047857" size={14} />
        ) : null}
        <Text
          className={`text-xs font-semibold ${value ? 'text-emerald-700' : 'text-slate-500'}`}
        >
          {value ? 'Có' : 'Không'}
        </Text>
      </View>
    );
  }
  if (Array.isArray(value)) {
    return (
      <View className="flex-row flex-wrap gap-1.5">
        {value.map((item, index) => (
          <Text
            key={index}
            className="max-w-full rounded-lg bg-slate-100 px-2.5 py-1 text-xs leading-5 text-slate-600"
          >
            {typeof item === 'object' && item !== null
              ? JSON.stringify(item)
              : String(item)}
          </Text>
        ))}
      </View>
    );
  }
  return (
    <Text className="text-sm leading-6 text-slate-700">
      {typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value)}
    </Text>
  );
}

// ============================================================
// BUILD SPECIFICATION ROWS
// ============================================================

function buildSpecificationRows(
  groupKey: SpecGroupKey,
  columns: ComparisonColumn[],
) {
  const records = columns.map(({ product }) => {
    const groupData = product[groupKey];

    if (
      groupData &&
      typeof groupData === 'object' &&
      !Array.isArray(groupData)
    ) {
      return groupData as Record<string, unknown>;
    }

    return {};
  });

  const keys = Array.from(
    new Set(records.flatMap((record) => Object.keys(record))),
  );

  return keys.map((key) => ({
    key,
    label: getFieldLabel(key),
    values: records.map((record) => record[key]),
  }));
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProductTabletComparePage() {
  const { tablets, isHydrated, storageError, removeTablet, clearTablets } =
    useProductCompare();
  const [apiProducts, setApiProducts] = useState<TabletComparisonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedIdsKey, setLoadedIdsKey] = useState('');

  // PRODUCT IDS
  const idsKey = tablets.map((item) => item.productId).join('|');

  // CALL COMPARE API
  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;
    const fetchComparison = async () => {
      // Defer state updates until after the effect; ignore responses after selection changes.
      await Promise.resolve();
      if (cancelled) return;
      const ids = idsKey ? idsKey.split('|') : [];
      setError('');
      setLoading(ids.length >= 2);
      setApiProducts([]);
      try {
        if (ids.length < 2) return;
        const response = (await customerProductService.compareTablets(
          ids,
        )) as CompareApiResponse;
        if (
          !Array.isArray(response?.products) ||
          response.products.some(
            (product) =>
              !product ||
              typeof product !== 'object' ||
              !product._id ||
              typeof product.name !== 'string',
          )
        ) {
          throw new Error('Dữ liệu trả về từ API so sánh không hợp lệ.');
        }
        if (!cancelled) setApiProducts(response.products);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setLoadedIdsKey(idsKey);
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void fetchComparison();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, idsKey, retryCount]);

  const comparisonColumns = useMemo<ComparisonColumn[]>(() => {
    const productMap = new Map(
      apiProducts.map((product) => [String(product._id), product]),
    );

    return tablets.flatMap((selectedTablet) => {
      const product = productMap.get(selectedTablet.productId);

      if (!product) {
        return [];
      }

      // Tìm variant theo SKU đã chọn trong CompareProvider
      const apiVariant = product.variants?.find(
        (variant) => variant.sku === selectedTablet.variant.sku,
      );

      const variant: TabletVariant = apiVariant ?? {
        sku: selectedTablet.variant.sku,
        slug: selectedTablet.variant.slug,
        storage: selectedTablet.variant.storage,
        color: selectedTablet.variant.color,
        colorSlug: selectedTablet.variant.colorSlug,
        price: selectedTablet.variant.price,
        images: selectedTablet.variant.image
          ? [selectedTablet.variant.image]
          : [],
      };

      return [
        {
          product,
          variant,
        },
      ];
    });
  }, [apiProducts, tablets]);

  // PAGE STATES
  const waitingForProducts = loading || loadedIdsKey !== idsKey;
  const canDisplayComparison =
    !waitingForProducts && !error && comparisonColumns.length >= 2;
  const reload = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRetryCount((value) => value + 1);
  };

  // RENDER
  return (
    <SafeAreaView className="flex-1 bg-[#F5F8FA]" edges={['bottom']}>
      <StoreScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reload}
            tintColor="#0f766e"
            colors={['#0f766e']}
          />
        }
      >
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(PRODUCT_CATEGORY_URL as Href)}
          className="mb-3 min-h-11 flex-row items-center gap-1 self-start"
        >
          <ProductCompareIcon name="back" size={18} />
          <Text className="text-sm font-semibold text-teal-700">
            Chọn máy tính bảng
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          So sánh máy tính bảng
        </Text>
        <Text className="mb-5 mt-2 text-sm leading-6 text-slate-500">
          Đối chiếu cấu hình và thông số kỹ thuật để lựa chọn chiếc máy tính
          bảng phù hợp với nhu cầu của bạn.
        </Text>

        {isHydrated && tablets.length > 0 ? (
          <View className="mb-4 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              Đã chọn{' '}
              <Text className="font-bold text-teal-700">
                {tablets.length}/{MAX_COMPARE_PRODUCTS}
              </Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={clearTablets}
              className="min-h-11 flex-row items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2"
            >
              <ProductCompareIcon name="trash" color="#e11d48" size={16} />
              <Text className="text-sm font-semibold text-rose-600">
                Xóa tất cả
              </Text>
            </Pressable>
          </View>
        ) : null}
        {storageError ? (
          <Text
            accessibilityRole="alert"
            className="mb-3 text-sm text-rose-600"
          >
            {storageError}
          </Text>
        ) : null}

        {!isHydrated ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-10">
            <ActivityIndicator color="#0f766e" />
            <Text className="mt-4 text-center text-sm text-slate-500">
              Đang tải danh sách sản phẩm...
            </Text>
          </View>
        ) : null}

        {isHydrated && tablets.length < 2 ? (
          <EmptyCompareState hasOneProduct={tablets.length === 1} />
        ) : null}

        {isHydrated && tablets.length >= 2 && waitingForProducts ? (
          <CompareLoading />
        ) : null}

        {isHydrated && tablets.length >= 2 && !waitingForProducts && error ? (
          <View className="rounded-3xl border border-rose-200 bg-white px-5 py-8">
            <Text className="text-center text-lg font-bold text-slate-900">
              Không thể tải dữ liệu so sánh
            </Text>
            <Text
              accessibilityRole="alert"
              className="mt-2 text-center text-sm leading-6 text-rose-600"
            >
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={reload}
              className="mt-6 min-h-11 items-center justify-center rounded-xl bg-teal-700 px-6 py-3"
            >
              <Text className="text-sm font-semibold text-white">Thử lại</Text>
            </Pressable>
          </View>
        ) : null}

        {isHydrated &&
        tablets.length >= 2 &&
        !waitingForProducts &&
        !error &&
        !canDisplayComparison ? (
          <Text className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm leading-6 text-amber-800">
            Không tìm thấy đầy đủ dữ liệu của các sản phẩm đã chọn. Vui lòng
            kiểm tra lại danh sách sản phẩm.
          </Text>
        ) : null}

        {canDisplayComparison ? (
          <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <View className="border-b border-slate-100 px-5 py-5">
              <Text className="text-lg font-bold text-slate-900">
                Bảng so sánh chi tiết
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Đang so sánh {comparisonColumns.length} máy tính bảng
              </Text>
            </View>
            {/* PRODUCT CARDS */}
            <View className="gap-3 p-4">
              {comparisonColumns.map(({ product, variant }) => (
                <View
                  key={product._id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <View className="flex-row items-start gap-3">
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={`Xem chi tiết ${product.name}`}
                      onPress={() =>
                        router.push(
                          `/customer/product-detail/${variant.slug || product.slug}` as Href,
                        )
                      }
                      className="h-24 w-24 rounded-xl bg-teal-50/50 p-2"
                    >
                      <ProductCompareImage
                        image={variant.images?.[0] || product.image}
                        name={product.name}
                        kind="tablet"
                      />
                    </Pressable>
                    <View className="flex-1">
                      <Pressable
                        accessibilityRole="link"
                        onPress={() =>
                          router.push(
                            `/customer/product-detail/${variant.slug || product.slug}` as Href,
                          )
                        }
                        className="min-h-11 justify-center"
                      >
                        <Text className="text-sm font-bold leading-5 text-slate-900">
                          {product.name}
                        </Text>
                      </Pressable>
                      <View className="mt-2 flex-row flex-wrap gap-1.5">
                        {variant.storage ? (
                          <Text className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {variant.storage}
                          </Text>
                        ) : null}
                        {variant.color ? (
                          <Text className="rounded-md bg-teal-50 px-2 py-1 text-xs text-teal-700">
                            {variant.color}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="mt-3 text-base font-bold text-teal-700">
                        {typeof variant.price === 'number' && variant.price > 0
                          ? formatPrice(variant.price)
                          : 'Liên hệ'}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa ${product.name} khỏi danh sách so sánh`}
                      onPress={() => removeTablet(product._id)}
                      className="min-h-11 w-11 items-center justify-center rounded-full bg-slate-50"
                    >
                      <ProductCompareIcon
                        name="close"
                        color="#64748b"
                        size={18}
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            {/* SPECIFICATIONS */}
            <View className="border-y border-slate-200 bg-slate-50 px-5 py-4">
              <Text className="text-sm font-bold text-slate-900">
                Thông số kỹ thuật
              </Text>
              <Text className="mt-1 text-xs leading-5 text-slate-500">
                Đối chiếu chi tiết từng thông số của sản phẩm
              </Text>
            </View>
            {SPEC_GROUPS.map((group) => {
              const rows = buildSpecificationRows(group.key, comparisonColumns);
              return (
                <View key={group.key}>
                  <View className="border-y border-slate-200 bg-teal-50 px-5 py-4">
                    <Text
                      accessibilityRole="header"
                      className="text-sm font-bold text-teal-800"
                    >
                      {group.title}
                    </Text>
                    <Text className="mt-1 text-xs leading-5 text-teal-700">
                      {group.description}
                    </Text>
                  </View>
                  {rows.length ? (
                    rows.map((row) => (
                      <View
                        key={row.key}
                        className="border-b border-slate-100 px-4 py-4"
                      >
                        <Text className="mb-3 text-sm font-bold text-slate-800">
                          {row.label}
                        </Text>
                        <View className="gap-3">
                          {row.values.map((value, index) => (
                            <View
                              key={comparisonColumns[index].product._id}
                              className="rounded-xl bg-slate-50/70 p-3"
                            >
                              <Text className="mb-2 text-xs font-semibold leading-5 text-teal-700">
                                {comparisonColumns[index].product.name}
                              </Text>
                              <SpecificationValue value={value} />
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text className="p-5 text-center text-sm italic text-slate-400">
                      Chưa có thông số trong nhóm này.
                    </Text>
                  )}
                </View>
              );
            })}
            <Text className="bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500">
              Lưu ý: Thông số được hiển thị dựa trên dữ liệu sản phẩm hiện có
              trong hệ thống. Một số thông tin có thể chưa được nhà sản xuất
              hoặc hệ thống cập nhật.
            </Text>
          </View>
        ) : null}
      </StoreScrollView>
    </SafeAreaView>
  );
}
// ============================================================
// EMPTY STATE
// ============================================================

function EmptyCompareState({ hasOneProduct }: { hasOneProduct: boolean }) {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white px-5 py-10">
      <View className="mb-5 h-20 w-20 items-center justify-center self-center rounded-3xl bg-teal-50">
        <ProductCompareIcon name="tablet" size={38} />
      </View>
      <Text className="text-center text-xl font-bold text-slate-900">
        {hasOneProduct
          ? 'Bạn cần thêm sản phẩm để so sánh'
          : 'Danh sách so sánh đang trống'}
      </Text>
      <Text className="mt-3 text-center text-sm leading-6 text-slate-500">
        {hasOneProduct
          ? 'Bạn đã chọn một máy tính bảng. Hãy thêm ít nhất một máy tính bảng khác để bắt đầu so sánh thông số kỹ thuật.'
          : 'Hãy quay lại danh mục máy tính bảng và nhấn nút So sánh trên những sản phẩm bạn muốn đối chiếu.'}
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(PRODUCT_CATEGORY_URL as Href)}
        className="mt-6 min-h-11 items-center justify-center rounded-xl bg-teal-700 px-6 py-3"
      >
        <Text className="text-sm font-semibold text-white">
          Chọn máy tính bảng
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// LOADING STATE
// ============================================================

function CompareLoading() {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-8">
      <ActivityIndicator color="#0f766e" />
      <Text className="mt-4 text-center text-sm text-slate-500">
        Đang tải thông số kỹ thuật sản phẩm...
      </Text>
    </View>
  );
}
