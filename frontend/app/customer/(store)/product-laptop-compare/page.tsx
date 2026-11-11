'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Laptop2 } from 'lucide-react';
import { useProductCompare } from '../components/ProductCompareProvider';
import { customerProductService } from '@/lib/axios/services/customer-services/product_service';

// ============================================================
// TYPES
// ============================================================

type LaptopVariant = {
  sku: string;
  slug?: string;
  ram?: string;
  ssd?: string;
  color?: string;
  colorSlug?: string;
  price?: number;
  images?: string[];
};

type LaptopComparisonProduct = {
  _id: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;

  ram?: string;
  ssd?: string;
  variants?: LaptopVariant[];

  processor?: Record<string, unknown>;
  graphics?: Record<string, unknown>;
  memoryAndStorage?: Record<string, unknown>;
  display?: Record<string, unknown>;
  connectivityAndExpansion?: Record<string, unknown>;
  dimensionsAndBattery?: Record<string, unknown>;
};

type CompareApiResponse = {
  message: string;
  count: number;
  products: LaptopComparisonProduct[];
};

type ComparisonColumn = {
  product: LaptopComparisonProduct;
  variant: LaptopVariant;
};

type SpecGroupKey =
  | 'selectedConfiguration'
  | 'processor'
  | 'graphics'
  | 'memoryAndStorage'
  | 'display'
  | 'connectivityAndExpansion'
  | 'dimensionsAndBattery';

type SpecGroup = {
  key: SpecGroupKey;
  title: string;
  description: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const PRODUCT_CATEGORY_URL =
  '/customer/product-category/may-tinh-xach-tay';

const MAX_COMPARE_PRODUCTS = 3;

const SPEC_GROUPS: SpecGroup[] = [
  {
    key: 'selectedConfiguration',
    title: 'Cấu hình phiên bản đang chọn',
    description: 'RAM, ổ cứng và màu sắc của phiên bản laptop đã chọn',
  },
  {
    key: 'processor',
    title: 'Bộ vi xử lý',
    description: 'Thông tin CPU và khả năng xử lý',
  },
  {
    key: 'graphics',
    title: 'Đồ họa',
    description: 'Thông tin card đồ họa và khả năng xử lý hình ảnh',
  },
  {
    key: 'memoryAndStorage',
    title: 'Bộ nhớ và lưu trữ',
    description: 'Thông tin RAM, ổ cứng và khả năng nâng cấp',
  },
  {
    key: 'display',
    title: 'Màn hình',
    description: 'Kích thước, độ phân giải và công nghệ hiển thị',
  },
  {
    key: 'connectivityAndExpansion',
    title: 'Kết nối và mở rộng',
    description: 'Các cổng kết nối và chuẩn kết nối không dây',
  },
  {
    key: 'dimensionsAndBattery',
    title: 'Kích thước và pin',
    description: 'Trọng lượng, kích thước và thời lượng pin',
  },
];

// ============================================================
// FIELD LABELS
// ============================================================

const FIELD_LABELS: Record<string, string> = {
  // Processor
  cpu: 'CPU',
  processor: 'Bộ vi xử lý',
  cpuName: 'Tên bộ vi xử lý',
  cpuModel: 'Mã bộ vi xử lý',
  cpuBrand: 'Hãng sản xuất CPU',
  cpuGeneration: 'Thế hệ CPU',
  cores: 'Số nhân',
  threads: 'Số luồng',
  baseClock: 'Xung nhịp cơ bản',
  maxClock: 'Xung nhịp tối đa',
  cpuSpeed: 'Tốc độ CPU',
  cache: 'Bộ nhớ đệm',

  // Graphics
  gpu: 'Card đồ họa',
  gpuName: 'Tên card đồ họa',
  graphicsCard: 'Card đồ họa',
  graphicsType: 'Loại card đồ họa',
  vram: 'Dung lượng VRAM',
  gpuMemory: 'Bộ nhớ đồ họa',

  // Memory and storage
  ram: 'RAM',
  ramType: 'Loại RAM',
  ramSpeed: 'Tốc độ RAM',
  maxRam: 'RAM tối đa hỗ trợ',
  ramSlots: 'Số khe RAM',
  ssd: 'Ổ cứng SSD',
  storage: 'Dung lượng lưu trữ',
  storageType: 'Loại ổ cứng',
  hardDrive: 'Ổ cứng',
  upgradeability: 'Khả năng nâng cấp',
  storageSlots: 'Số khe ổ cứng',

  // Display
  screen: 'Màn hình',
  screenSize: 'Kích thước màn hình',
  displaySize: 'Kích thước màn hình',
  resolution: 'Độ phân giải',
  screenResolution: 'Độ phân giải',
  panelType: 'Tấm nền',
  displayTechnology: 'Công nghệ màn hình',
  refreshRate: 'Tần số quét',
  brightness: 'Độ sáng',
  maxBrightness: 'Độ sáng tối đa',
  colorCoverage: 'Độ phủ màu',
  touchScreen: 'Màn hình cảm ứng',

  // Connectivity
  wifi: 'Wi-Fi',
  bluetooth: 'Bluetooth',
  usb: 'Cổng USB',
  usbPorts: 'Cổng USB',
  usbTypeC: 'USB Type-C',
  usbA: 'USB Type-A',
  hdmi: 'HDMI',
  lan: 'LAN',
  ethernet: 'Ethernet',
  headphoneJack: 'Cổng tai nghe',
  cardReader: 'Đầu đọc thẻ nhớ',
  webcam: 'Webcam',
  wirelessConnectivity: 'Kết nối không dây',
  connectivity: 'Kết nối',

  // Dimensions and battery
  dimensions: 'Kích thước',
  weight: 'Trọng lượng',
  battery: 'Pin',
  batteryCapacity: 'Dung lượng pin',
  batteryLife: 'Thời lượng pin',
  batteryType: 'Loại pin',
  chargingPower: 'Công suất sạc',
  adapter: 'Bộ sạc',
  material: 'Chất liệu',
  operatingSystem: 'Hệ điều hành',
  os: 'Hệ điều hành',
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
  if (value === null || value === undefined || value === '') {
    return (
      <span className="text-sm italic text-slate-400">
        Chưa cập nhật
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-3.5 w-3.5"
        >
          <path
            d="m4 10 4 4 8-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Có
      </span>
    ) : (
      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        Không
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="text-sm italic text-slate-400">
          Chưa cập nhật
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <span
            key={`${index}-${String(item)}`}
            className="inline-flex max-w-full rounded-lg bg-slate-100 px-2.5 py-1 text-xs leading-5 text-slate-600"
          >
            {typeof item === 'object' && item !== null
              ? JSON.stringify(item)
              : String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <pre className="max-w-full whitespace-pre-wrap break-words text-xs text-slate-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <span className="break-words text-sm leading-6 text-slate-700">
      {String(value)}
    </span>
  );
}

// ============================================================
// BUILD SPECIFICATION ROWS
// ============================================================

function buildSpecificationRows(
  groupKey: SpecGroupKey,
  columns: ComparisonColumn[],
) {
  // Các thông tin lấy từ phiên bản laptop đã chọn
  if (groupKey === 'selectedConfiguration') {
    return [
      {
        key: 'ram',
        label: 'RAM',
        values: columns.map(
          ({ product, variant }) => variant.ram ?? product.ram,
        ),
      },
      {
        key: 'ssd',
        label: 'Ổ cứng SSD',
        values: columns.map(
          ({ product, variant }) => variant.ssd ?? product.ssd,
        ),
      },
      {
        key: 'color',
        label: 'Màu sắc',
        values: columns.map(({ variant }) => variant.color),
      },
    ];
  }

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
// EMPTY STATE
// ============================================================

function EmptyCompareState({
  hasOneProduct,
}: {
  hasOneProduct: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
       <Laptop2></Laptop2>
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        {hasOneProduct
          ? 'Bạn cần thêm sản phẩm để so sánh'
          : 'Danh sách so sánh đang trống'}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        {hasOneProduct
          ? 'Bạn đã chọn một laptop. Hãy thêm ít nhất một laptop khác để bắt đầu so sánh thông số kỹ thuật.'
          : 'Hãy quay lại danh mục laptop và nhấn nút So sánh trên những sản phẩm bạn muốn đối chiếu.'}
      </p>

      <Link
        href={PRODUCT_CATEGORY_URL}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-lg"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            d="M15 18 9 12l6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Chọn laptop
      </Link>
    </div>
  );
}

// ============================================================
// LOADING STATE
// ============================================================

function CompareLoading() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="animate-pulse p-5">
        <div className="mb-6 h-6 w-52 rounded-lg bg-slate-200" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-slate-100 p-4"
            >
              <div className="mx-auto h-28 w-28 rounded-2xl bg-slate-100" />
              <div className="h-4 rounded bg-slate-200" />
              <div className="mx-auto h-4 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>

      <p className="border-t border-slate-100 py-4 text-center text-sm text-slate-500">
        Đang tải thông số kỹ thuật sản phẩm...
      </p>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProductLaptopComparePage() {
  const {
    laptops,
    isHydrated,
    removeLaptop,
    clearLaptops,
  } = useProductCompare();

  const [apiProducts, setApiProducts] = useState<
    LaptopComparisonProduct[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // ==========================================================
  // PRODUCT IDS
  // ==========================================================

  const idsKey = laptops
    .map((laptop) => laptop.productId)
    .join('|');

  // ==========================================================
  // CALL COMPARE API
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const ids = idsKey ? idsKey.split('|') : [];

    if (ids.length < 2) {
      setApiProducts([]);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchComparison = async () => {
      setLoading(true);
      setError('');
      setApiProducts([]);

      try {
        const response =
          (await customerProductService.compareLaptops(
            ids,
          )) as CompareApiResponse;

        if (!Array.isArray(response?.products)) {
          throw new Error(
            'Dữ liệu trả về từ API so sánh không hợp lệ.',
          );
        }

        if (!cancelled) {
          setApiProducts(response.products);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchComparison();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, idsKey, retryCount]);

  // ==========================================================
  // MERGE API PRODUCTS WITH SELECTED VARIANTS
  // ==========================================================

  const comparisonColumns = useMemo<ComparisonColumn[]>(() => {
    const productMap = new Map(
      apiProducts.map((product) => [
        String(product._id),
        product,
      ]),
    );

    return laptops.flatMap((selectedLaptop) => {
      const product = productMap.get(
        selectedLaptop.productId,
      );

      if (!product) {
        return [];
      }

      // Tìm phiên bản theo SKU đã chọn trong CompareProvider
      const apiVariant = product.variants?.find(
        (variant) =>
          variant.sku === selectedLaptop.variant.sku,
      );

      // Ưu tiên dữ liệu phiên bản mới nhất từ Backend
      const variant: LaptopVariant = apiVariant ?? {
        sku: selectedLaptop.variant.sku,
        slug: selectedLaptop.variant.slug,
        ram: selectedLaptop.variant.ram,
        ssd: selectedLaptop.variant.ssd,
        color: selectedLaptop.variant.color,
        colorSlug: selectedLaptop.variant.colorSlug,
        price: selectedLaptop.variant.price,
        images: selectedLaptop.variant.image
          ? [selectedLaptop.variant.image]
          : [],
      };

      return [
        {
          product,
          variant,
        },
      ];
    });
  }, [apiProducts, laptops]);

  // ==========================================================
  // PAGE STATES
  // ==========================================================

  const isEmpty = isHydrated && laptops.length === 0;

  const hasOneProduct =
    isHydrated && laptops.length === 1;

  const canDisplayComparison =
    !loading &&
    !error &&
    comparisonColumns.length >= 2;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F8FA]">
      <section className="mx-auto max-w-7xl px-4 py-6 pb-72 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            href="/customer"
            className="text-slate-500 transition hover:text-teal-700"
          >
            Trang chủ
          </Link>

          <span className="text-slate-300">/</span>

          <Link
            href={PRODUCT_CATEGORY_URL}
            className="text-slate-500 transition hover:text-teal-700"
          >
            Laptop
          </Link>

          <span className="text-slate-300">/</span>

          <span className="font-semibold text-slate-800">
            So sánh sản phẩm
          </span>
        </nav>

        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              So sánh laptop
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Đối chiếu cấu hình và thông số kỹ thuật để lựa chọn
              chiếc laptop phù hợp với nhu cầu học tập, làm việc
              và giải trí.
            </p>
          </div>

          {isHydrated && laptops.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                Đã chọn{' '}
                <strong className="text-teal-700">
                  {laptops.length}/{MAX_COMPARE_PRODUCTS}
                </strong>
              </span>

              <button
                type="button"
                onClick={clearLaptops}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* LOADING LOCAL STORAGE */}
        {!isHydrated && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />

            <p className="mt-4 text-sm text-slate-500">
              Đang tải danh sách sản phẩm...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {isEmpty && (
          <EmptyCompareState hasOneProduct={false} />
        )}

        {hasOneProduct && (
          <EmptyCompareState hasOneProduct />
        )}

        {/* API LOADING */}
        {isHydrated &&
          laptops.length >= 2 &&
          loading && <CompareLoading />}

        {/* API ERROR */}
        {isHydrated &&
          laptops.length >= 2 &&
          !loading &&
          error && (
            <div className="rounded-3xl border border-rose-200 bg-white px-5 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-8 w-8"
                >
                  <path
                    d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Không thể tải dữ liệu so sánh
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setRetryCount((value) => value + 1)
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    d="M20 7v5h-5M4 17v-5h5m11-1a8 8 0 0 0-14.5-4.5L4 12m16 0-1.5 5.5A8 8 0 0 1 4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Thử lại
              </button>
            </div>
          )}

        {/* MISSING PRODUCT DATA */}
        {isHydrated &&
          laptops.length >= 2 &&
          !loading &&
          !error &&
          !canDisplayComparison && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
              Không tìm thấy đầy đủ dữ liệu của các sản phẩm đã chọn.
              Vui lòng kiểm tra lại danh sách sản phẩm.
            </div>
          )}

        {/* COMPARISON TABLE */}
        {canDisplayComparison && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            {/* TABLE HEADER */}
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Bảng so sánh chi tiết
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Đang so sánh {comparisonColumns.length} laptop
                  </p>
                </div>

                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 sm:mt-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  Dữ liệu từ Product Service
                </span>
              </div>
            </div>

            {/* PRODUCT CARDS */}
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
              {comparisonColumns.map(({ product, variant }) => {
                const productImage =
                  variant.images?.[0] ||
                  product.image;

                const detailSlug =
                  variant.slug || product.slug;

                return (
                  <div
                    key={product._id}
                    className="relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-teal-200 hover:shadow-md sm:p-4"
                  >
                    {/* REMOVE */}
                    <button
                      type="button"
                      onClick={() => removeLaptop(product._id)}
                      aria-label={`Xóa ${product.name} khỏi danh sách so sánh`}
                      title="Xóa sản phẩm"
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <path
                          d="m18 6-12 12M6 6l12 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* IMAGE */}
                    <Link
                      href={`/customer/product-detail/${detailSlug}`}
                      className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/50"
                    >
                      <img
                        src={`/product/laptop/${productImage}`}
                        alt={product.name}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-105"
                      />
                    </Link>

                    {/* NAME */}
                    <Link
                      href={`/customer/product-detail/${detailSlug}`}
                    >
                      <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 transition hover:text-teal-700">
                        {product.name}
                      </h3>
                    </Link>

                    {/* VARIANT */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(variant.ram || product.ram) && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          RAM: {variant.ram || product.ram}
                        </span>
                      )}

                      {(variant.ssd || product.ssd) && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          SSD: {variant.ssd || product.ssd}
                        </span>
                      )}

                      {variant.color && (
                        <span className="rounded-md bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-700">
                          {variant.color}
                        </span>
                      )}
                    </div>

                    {/* PRICE */}
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {typeof variant.price === 'number' &&
                      variant.price > 0 ? (
                        <p className="text-sm font-bold tracking-tight text-teal-700 sm:text-base">
                          {formatPrice(variant.price)}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-slate-500">
                          Liên hệ
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SPECIFICATION TABLE */}
            <div className="border-t border-slate-200">
              <div className="flex items-center justify-between gap-3 bg-slate-50 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Thông số kỹ thuật
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Đối chiếu chi tiết từng thông số của sản phẩm
                  </p>
                </div>

                <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 sm:inline-flex">
                  Cuộn ngang để xem đầy đủ
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 w-[210px] border-b border-r border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                        Thông số
                      </th>

                      {comparisonColumns.map(({ product }) => (
                        <th
                          key={product._id}
                          className="min-w-[240px] border-b border-slate-200 bg-slate-100 px-4 py-3 text-center text-xs font-semibold text-slate-700"
                        >
                          {product.name}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {SPEC_GROUPS.map((group) => {
                    const rows = buildSpecificationRows(
                      group.key,
                      comparisonColumns,
                    );

                    return (
                      <tbody key={group.key}>
                        {/* GROUP HEADER */}
                        <tr>
                          <th
                            colSpan={comparisonColumns.length + 1}
                            className="border-y border-slate-200 bg-teal-50/80 px-5 py-4 text-left"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-teal-800">
                                {group.title}
                              </span>

                              <span className="text-[11px] font-normal text-teal-700/70">
                                {group.description}
                              </span>
                            </div>
                          </th>
                        </tr>

                        {/* SPECIFICATION ROWS */}
                        {rows.length > 0 ? (
                          rows.map((row) => (
                            <tr
                              key={`${group.key}-${row.key}`}
                              className="transition hover:bg-teal-50/30"
                            >
                              <th
                                scope="row"
                                className="sticky left-0 z-10 w-[210px] border-b border-r border-slate-100 bg-white px-4 py-4 text-left align-top text-xs font-semibold leading-5 text-slate-600"
                              >
                                {row.label}
                              </th>

                              {row.values.map((value, index) => (
                                <td
                                  key={`${group.key}-${row.key}-${index}`}
                                  className="min-w-[240px] border-b border-slate-100 px-4 py-4 align-top"
                                >
                                  <SpecificationValue value={value} />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={comparisonColumns.length + 1}
                              className="border-b border-slate-100 px-4 py-6 text-center text-sm italic text-slate-400"
                            >
                              Chưa có thông số trong nhóm này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
                </table>
              </div>

              {/* TABLE FOOTER */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <p className="text-xs leading-5 text-slate-500">
                  Lưu ý: Thông số được hiển thị dựa trên dữ liệu sản phẩm
                  hiện có trong hệ thống. Một số thông tin có thể chưa
                  được nhà sản xuất hoặc hệ thống cập nhật.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
