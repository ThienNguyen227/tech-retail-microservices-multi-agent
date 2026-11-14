import { StoreScrollView } from '@/components/store-scroll-to-top';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  type LayoutChangeEvent,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';

import { useProductCompare } from '@/components/product-compare-provider';
import ProductCompareImage from '@/components/product-compare-image';
import ProductCompareIcon from '@/components/product-compare-icon';
import { customerProductService } from '@/lib/axios/services/customer-services/product_service';

// ============================================================
// TYPES
// ============================================================

type PhoneVariant = {
  sku: string;
  slug?: string;
  storage?: string;
  color?: string;
  colorSlug?: string;
  price?: number;
  images?: string[];
};

type PhoneComparisonProduct = {
  _id: string;

  name: string;
  slug: string;
  image: string;

  brandId: string;
  categoryId: string;

  screenTech?: string;
  screenSize?: string;

  variants?: PhoneVariant[];

  specifications?: Record<string, unknown>;

  performanceAndStorage?: Record<string, unknown>;

  cameraAndScreen?: Record<string, unknown>;

  batteryAndCharge?: Record<string, unknown>;

  utilities?: Record<string, unknown>;

  connectivity?: Record<string, unknown>;

  designAndMaterials?: Record<string, unknown>;
};

type CompareApiResponse = {
  message: string;
  count: number;
  products: PhoneComparisonProduct[];
};

type ComparisonColumn = {
  product: PhoneComparisonProduct;
  variant: PhoneVariant;
};

type SpecGroupKey =
  | 'specifications'
  | 'performanceAndStorage'
  | 'cameraAndScreen'
  | 'batteryAndCharge'
  | 'utilities'
  | 'connectivity'
  | 'designAndMaterials';

type SpecGroup = {
  key: SpecGroupKey;
  title: string;
  description: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const PRODUCT_CATEGORY_URL = '/customer/product-category/dien-thoai-di-dong';

const MAX_COMPARE_PRODUCTS = 3;

const SPEC_GROUPS: SpecGroup[] = [
  {
    key: 'specifications',
    title: 'Thông số kỹ thuật tổng quan',
    description: 'Các thông số nổi bật của sản phẩm',
  },
  {
    key: 'performanceAndStorage',
    title: 'Hiệu năng và bộ nhớ',
    description: 'Hệ điều hành, CPU, GPU và dung lượng lưu trữ',
  },
  {
    key: 'cameraAndScreen',
    title: 'Camera và màn hình',
    description: 'Thông số camera trước, camera sau và màn hình',
  },
  {
    key: 'batteryAndCharge',
    title: 'Pin và sạc',
    description: 'Thời lượng pin và công nghệ sạc',
  },
  {
    key: 'utilities',
    title: 'Tiện ích',
    description: 'Bảo mật, khả năng chống nước và các tiện ích khác',
  },
  {
    key: 'connectivity',
    title: 'Kết nối',
    description: 'Mạng di động và các chuẩn kết nối',
  },
  {
    key: 'designAndMaterials',
    title: 'Thiết kế và chất liệu',
    description: 'Kích thước, trọng lượng và vật liệu hoàn thiện',
  },
];

// ============================================================
// FIELD LABELS
// ============================================================

const FIELD_LABELS: Record<string, string> = {
  // General specifications
  chip: 'Chip xử lý',
  storage: 'Dung lượng lưu trữ',
  rearCamera: 'Camera sau',
  frontCamera: 'Camera trước',
  battery: 'Pin và sạc',

  // Performance
  os: 'Hệ điều hành',
  cpu: 'CPU',
  cpuSpeed: 'Tốc độ CPU',
  gpu: 'GPU',
  ram: 'RAM',
  internalStorage: 'Bộ nhớ trong',
  usableStorage: 'Bộ nhớ khả dụng',
  contactsStorage: 'Lưu trữ danh bạ',

  // Camera and screen
  rearCameraResolution: 'Độ phân giải camera sau',
  rearVideoRecording: 'Quay video camera sau',
  rearFlashlight: 'Đèn flash camera sau',
  rearCameraFeatures: 'Tính năng camera sau',
  frontCameraResolution: 'Độ phân giải camera trước',
  frontCameraFeatures: 'Tính năng camera trước',
  screenTechnology: 'Công nghệ màn hình',
  screenResolution: 'Độ phân giải màn hình',
  screenSize: 'Kích thước màn hình',
  refreshRate: 'Tần số quét',
  maxBrightness: 'Độ sáng tối đa',
  touchScreenGlass: 'Chất liệu kính màn hình',

  // Battery
  batteryLife: 'Thời lượng pin',
  batteryType: 'Loại pin',
  maxChargingPower: 'Công suất sạc tối đa',
  batteryFeatures: 'Công nghệ sạc và pin',

  // Utilities
  advancedSecurity: 'Bảo mật nâng cao',
  waterResistance: 'Kháng nước, kháng bụi',
  audioRecording: 'Ghi âm',
  supportedVideoFormats: 'Định dạng video hỗ trợ',
  supportedAudioFormats: 'Định dạng âm thanh hỗ trợ',

  // Connectivity
  mobileNetwork: 'Mạng di động',
  simType: 'Loại SIM',
  wifi: 'Wi-Fi',
  gps: 'Định vị GPS',
  bluetooth: 'Bluetooth',
  connectorPort: 'Cổng kết nối',
  headphoneJack: 'Cổng tai nghe',
  otherConnectivity: 'Kết nối khác',

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

  // Chuyển camelCase thành tên dễ đọc nếu xuất hiện trường mới
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

  // Lấy tất cả các key xuất hiện trong các sản phẩm
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
// COMPARISON TABLE
// ============================================================

function ComparisonTable({
  comparisonColumns,
  onRemove,
}: {
  comparisonColumns: ComparisonColumn[];
  onRemove: (productId: string) => void;
}) {
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const columnWidth = 164;
  const labelWidth = 104;
  const groups = SPEC_GROUPS.map((group) => ({
    ...group,
    rows: buildSpecificationRows(group.key, comparisonColumns),
  }));

  // Hai phía dùng chiều cao lớn nhất của cùng một hàng để không lệch thông số.
  const measureRow = (key: string, event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setRowHeights((current) =>
      height > (current[key] ?? 0) + 0.5
        ? { ...current, [key]: height }
        : current,
    );
  };

  return (
    <View>
      <View className="border-y border-slate-200 bg-slate-50 px-4 py-3">
        <Text className="text-sm font-bold text-slate-900">
          Thông số kỹ thuật
        </Text>
        <Text className="mt-1 text-xs leading-5 text-slate-500">
          Vuốt ngang để đối chiếu sản phẩm. Cột thông số được giữ cố định bên
          trái.
        </Text>
      </View>
      <View className="flex-row items-start">
        {/* FIXED SPECIFICATION COLUMN */}
        <View
          style={{ width: labelWidth }}
          className="border-r border-slate-200 bg-white"
        >
          <View
            style={{ minHeight: rowHeights.products ?? 240 }}
            onLayout={(event) => measureRow('products', event)}
            className="justify-center border-b border-slate-200 bg-slate-100 px-3 py-4"
          >
            <Text className="text-xs font-bold leading-5 text-slate-700">
              Sản phẩm so sánh
            </Text>
          </View>
          {groups.map((group) => (
            <View key={group.key}>
              <View
                style={{ minHeight: rowHeights[group.key] ?? 96 }}
                onLayout={(event) => measureRow(group.key, event)}
                className="justify-center border-b border-slate-200 bg-teal-50 px-3 py-3"
              >
                <Text
                  accessibilityRole="header"
                  className="text-xs font-bold leading-5 text-teal-800"
                >
                  {group.title}
                </Text>
              </View>
              {group.rows.length ? (
                group.rows.map((row, index) => (
                  <View
                    key={row.key}
                    style={{
                      minHeight: rowHeights[`${group.key}-${row.key}`] ?? 64,
                    }}
                    onLayout={(event) =>
                      measureRow(`${group.key}-${row.key}`, event)
                    }
                    className={`justify-center border-b border-slate-200 px-3 py-3 ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}
                  >
                    <Text className="text-xs font-semibold leading-5 text-slate-700">
                      {row.label}
                    </Text>
                  </View>
                ))
              ) : (
                <View
                  style={{ minHeight: rowHeights[`${group.key}-empty`] ?? 64 }}
                  onLayout={(event) => measureRow(`${group.key}-empty`, event)}
                  className="border-b border-slate-200"
                />
              )}
            </View>
          ))}
        </View>
        {/* ONE HORIZONTAL SCROLLER KEEPS ALL PRODUCT COLUMNS ALIGNED */}
        <ScrollView
          horizontal
          nestedScrollEnabled
          style={{ flex: 1 }}
          showsHorizontalScrollIndicator
          contentContainerStyle={{ flexGrow: 0 }}
        >
          <View style={{ width: columnWidth * comparisonColumns.length }}>
            {/* PRODUCT HEADERS */}
            <View
              style={{ minHeight: rowHeights.products ?? 240 }}
              onLayout={(event) => measureRow('products', event)}
              className="flex-row items-stretch border-b border-slate-200 bg-white"
            >
              {comparisonColumns.map(({ product, variant }) => (
                <View
                  key={product._id}
                  style={{ width: columnWidth }}
                  className="border-r border-slate-200 p-3"
                >
                  <View className="items-end">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa ${product.name} khỏi danh sách so sánh`}
                      onPress={() => onRemove(product._id)}
                      className="h-11 w-11 items-center justify-center rounded-full bg-slate-50"
                    >
                      <ProductCompareIcon
                        name="close"
                        color="#64748b"
                        size={18}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Xem chi tiết ${product.name}`}
                    onPress={() =>
                      router.push(
                        `/customer/product-detail/${variant.slug || product.slug}` as Href,
                      )
                    }
                  >
                    <View className="mb-2 h-24 rounded-xl bg-teal-50/50 p-2">
                      <ProductCompareImage
                        image={variant.images?.[0] || product.image}
                        name={product.name}
                        kind="phone"
                      />
                    </View>
                    <Text className="text-sm font-bold leading-5 text-slate-900">
                      {product.name}
                    </Text>
                  </Pressable>
                  <View className="mt-2">
                    {variant.storage ? (
                      <Text className="text-xs leading-5 text-slate-600">
                        {variant.storage}
                      </Text>
                    ) : null}
                    {variant.color ? (
                      <Text className="text-xs leading-5 text-teal-700">
                        {variant.color}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mt-2 text-sm font-bold text-teal-700">
                    {typeof variant.price === 'number' && variant.price > 0
                      ? formatPrice(variant.price)
                      : 'Liên hệ'}
                  </Text>
                </View>
              ))}
            </View>
            {/* SPECIFICATION GROUPS AND ROWS */}
            {groups.map((group) => (
              <View key={group.key}>
                <View
                  style={{ minHeight: rowHeights[group.key] ?? 96 }}
                  onLayout={(event) => measureRow(group.key, event)}
                  className="justify-center border-b border-slate-200 bg-teal-50"
                >
                  <Text className="px-3 py-2 text-xs leading-5 text-teal-700">
                    {group.description}
                  </Text>
                  <View className="flex-row">
                    {comparisonColumns.map(({ product }) => (
                      <View
                        key={product._id}
                        style={{ width: columnWidth }}
                        className="border-r border-teal-100 px-3 pb-3"
                      >
                        <Text className="text-xs font-semibold leading-5 text-teal-800">
                          {product.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                {group.rows.length ? (
                  group.rows.map((row, index) => (
                    <View
                      key={row.key}
                      style={{
                        minHeight: rowHeights[`${group.key}-${row.key}`] ?? 64,
                      }}
                      onLayout={(event) =>
                        measureRow(`${group.key}-${row.key}`, event)
                      }
                      className={`flex-row items-stretch border-b border-slate-200 ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}
                    >
                      {row.values.map((value, columnIndex) => (
                        <View
                          key={comparisonColumns[columnIndex].product._id}
                          style={{ width: columnWidth }}
                          className="border-r border-slate-200 px-3 py-3"
                        >
                          <SpecificationValue value={value} />
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      minHeight: rowHeights[`${group.key}-empty`] ?? 64,
                    }}
                    onLayout={(event) =>
                      measureRow(`${group.key}-empty`, event)
                    }
                    className="justify-center border-b border-slate-200 px-3 py-3"
                  >
                    <Text className="text-sm italic text-slate-400">
                      Chưa có thông số trong nhóm này.
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProductPhoneComparePage() {
  const { phones, isHydrated, storageError, removePhone, clearPhones } =
    useProductCompare();
  const [apiProducts, setApiProducts] = useState<PhoneComparisonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedIdsKey, setLoadedIdsKey] = useState('');

  // PRODUCT IDS
  const idsKey = phones.map((item) => item.productId).join('|');

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
        const response = (await customerProductService.comparePhones(
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

    return phones.flatMap((selectedPhone) => {
      const product = productMap.get(selectedPhone.productId);

      if (!product) {
        return [];
      }

      // Tìm variant theo SKU đã chọn trong CompareProvider
      // Ưu tiên dữ liệu phiên bản mới nhất từ Backend
      const apiVariant = product.variants?.find(
        (variant) => variant.sku === selectedPhone.variant.sku,
      );

      const variant: PhoneVariant = apiVariant ?? {
        sku: selectedPhone.variant.sku,
        slug: selectedPhone.variant.slug,
        storage: selectedPhone.variant.storage,
        color: selectedPhone.variant.color,
        price: selectedPhone.variant.price,
        images: selectedPhone.variant.image
          ? [selectedPhone.variant.image]
          : [],
      };

      return [
        {
          product,
          variant,
        },
      ];
    });
  }, [apiProducts, phones]);

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
    <View className="flex-1 bg-[#F5F8FA]">
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
            Chọn điện thoại
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          So sánh điện thoại
        </Text>
        <Text className="mb-5 mt-2 text-sm leading-6 text-slate-500">
          Đối chiếu cấu hình và thông số kỹ thuật để lựa chọn chiếc điện thoại
          phù hợp với nhu cầu của bạn.
        </Text>

        {isHydrated && phones.length > 0 ? (
          <View className="mb-4 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              Đã chọn{' '}
              <Text className="font-bold text-teal-700">
                {phones.length}/{MAX_COMPARE_PRODUCTS}
              </Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={clearPhones}
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

        {isHydrated && phones.length < 2 ? (
          <EmptyCompareState hasOneProduct={phones.length === 1} />
        ) : null}

        {isHydrated && phones.length >= 2 && waitingForProducts ? (
          <CompareLoading />
        ) : null}

        {isHydrated && phones.length >= 2 && !waitingForProducts && error ? (
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
        phones.length >= 2 &&
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
                Đang so sánh {comparisonColumns.length} điện thoại
              </Text>
            </View>
            <ComparisonTable
              key={`${idsKey}-${retryCount}`}
              comparisonColumns={comparisonColumns}
              onRemove={removePhone}
            />
            <Text className="bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500">
              Lưu ý: Thông số được hiển thị dựa trên dữ liệu sản phẩm hiện có
              trong hệ thống. Một số thông tin có thể chưa được nhà sản xuất
              hoặc hệ thống cập nhật.
            </Text>
          </View>
        ) : null}
      </StoreScrollView>
    </View>
  );
}
// ============================================================
// EMPTY STATE
// ============================================================

function EmptyCompareState({ hasOneProduct }: { hasOneProduct: boolean }) {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white px-5 py-10">
      <View className="mb-5 h-20 w-20 items-center justify-center self-center rounded-3xl bg-teal-50">
        <ProductCompareIcon name="phone" size={38} />
      </View>
      <Text className="text-center text-xl font-bold text-slate-900">
        {hasOneProduct
          ? 'Bạn cần thêm sản phẩm để so sánh'
          : 'Danh sách so sánh đang trống'}
      </Text>
      <Text className="mt-3 text-center text-sm leading-6 text-slate-500">
        {hasOneProduct
          ? 'Bạn đã chọn một điện thoại. Hãy thêm ít nhất một điện thoại khác để bắt đầu so sánh thông số kỹ thuật.'
          : 'Hãy quay lại danh mục điện thoại và nhấn nút So sánh trên những sản phẩm bạn muốn đối chiếu.'}
      </Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(PRODUCT_CATEGORY_URL as Href)}
        className="mt-6 min-h-11 items-center justify-center rounded-xl bg-teal-700 px-6 py-3"
      >
        <Text className="text-sm font-semibold text-white">
          Chọn điện thoại
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
