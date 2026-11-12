import { StoreScrollView } from '@/components/store-scroll-to-top';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FRONTEND_ASSET_URL } from "@/constants/api";
import { getStoredUser } from "@/lib/storage/secure_storage";
import { useFocusEffect, useRouter } from "expo-router";
import { customerCustomerService } from "@/lib/axios/services/customer-services/warranty_service";

// ============================================================
// 1. TYPES
// ============================================================

type WarrantyStatus = {
  warranty_status_id: number;
  warranty_status_code: string;
  warranty_status_name: string;
};

type WarrantyRequestType = {
  warranty_request_type_id: number;
  warranty_request_type_code: string;
  warranty_request_type_name: string;
};

type WarrantyRequestStatus = {
  warranty_request_status_id: number;
  warranty_request_status_code: string;
  warranty_request_status_name: string;
};

type WarrantyRequest = {
  warranty_request_id: number;
  warranty_request_code: string;
  warranty_request_description: string;
  warranty_request_received_at: string | null;
  warranty_request_completed_at: string | null;
  warranty_request_created_at: string;
  warranty_request_updated_at: string;
  warranty_id: number;
  warranty_request_type_id: number;
  warranty_request_status_id: number;
  type: WarrantyRequestType;
  status: WarrantyRequestStatus;
};

type Warranty = {
  warranty_id: number;
  warranty_code: string;
  user_id: number;
  order_id: number;
  order_code: string;
  order_item_id: number;
  warranty_product_name: string | null;
  warranty_product_image: string | null;
  warranty_sku: string;
  warranty_serial_number: string | null;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_duration_months: number;
  warranty_created_at: string;
  warranty_updated_at: string;
  warranty_status_id: number;
  status: WarrantyStatus;
  requests: WarrantyRequest[];
};

type WarrantyResponse = {
  success: boolean;
  message: string;
  total: number;
  data: Warranty[];
};

type FilterStatus = "ALL" | "ACTIVE" | "EXPIRED";

type EffectiveStatus = "ACTIVE" | "EXPIRED" | "OTHER";

type RequestStatusCode =
  "RECEIVED" | "INSPECTING" | "IN_REPAIR" | "COMPLETED" | "REJECTED" | "OTHER";

// ============================================================
// 2. FORMAT HELPERS
// ============================================================

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusCode = (warranty: Warranty) =>
  (warranty.status?.warranty_status_code ?? "").toUpperCase();

const getStatusLabel = (warranty: Warranty) =>
  warranty.status?.warranty_status_name || "Chưa xác định";

function getEffectiveStatus(warranty: Warranty): EffectiveStatus {
  const code = getStatusCode(warranty);

  if (code.includes("EXPIRED") || code.includes("HET_HAN")) {
    return "EXPIRED";
  }

  const endDate = new Date(warranty.warranty_end_date);

  if (!Number.isNaN(endDate.getTime())) {
    endDate.setHours(23, 59, 59, 999);

    if (code === "ACTIVE" && endDate < new Date()) {
      return "EXPIRED";
    }
  }

  if (code === "ACTIVE" || code.includes("VALID")) {
    return "ACTIVE";
  }

  return "OTHER";
}

function getProductImage(image: string | null) {
  if (!image) return "";

  if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
    return /^https?:\/\//i.test(image)
      ? image
      : `${FRONTEND_ASSET_URL}${image}`;
  }

  return `${FRONTEND_ASSET_URL}/product/${image}`;
}

// ============================================================
// 3. WARRANTY STATUS BADGE
// ============================================================

function StatusBadge({ warranty }: { warranty: Warranty }) {
  const status = getEffectiveStatus(warranty);

  const styles: Record<EffectiveStatus, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    EXPIRED: "bg-rose-50 text-rose-700 ring-rose-200",
    OTHER: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const icons: Record<EffectiveStatus, typeof CheckCircle2> = {
    ACTIVE: CheckCircle2,
    EXPIRED: XCircle,
    OTHER: AlertCircle,
  };

  const Icon = icons[status];

  const label =
    status === "EXPIRED"
      ? "Hết hạn"
      : status === "ACTIVE"
        ? "Còn hiệu lực"
        : getStatusLabel(warranty);

  return (
    <View
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
      }}
    >
      <Icon size={13} className={styles[status]} />
      <Text
        className="text-xs font-semibold"
        style={{
          color: getIconColor(
            `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`,
          ),
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// 4. WARRANTY REQUEST STATUS
// ============================================================

function getRequestStatusCode(request: WarrantyRequest): RequestStatusCode {
  const code = request.status?.warranty_request_status_code?.toUpperCase();

  switch (code) {
    case "RECEIVED":
    case "INSPECTING":
    case "IN_REPAIR":
    case "COMPLETED":
    case "REJECTED":
      return code;
    default:
      return "OTHER";
  }
}

function RequestStatusBadge({ request }: { request: WarrantyRequest }) {
  const status = getRequestStatusCode(request);

  const config: Record<
    RequestStatusCode,
    {
      label: string;
      className: string;
      icon: typeof Clock;
    }
  > = {
    RECEIVED: {
      label: "Đã tiếp nhận",
      className: "bg-blue-50 text-blue-700 ring-blue-200",
      icon: ClipboardList,
    },
    INSPECTING: {
      label: "Đang kiểm tra",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      icon: Search,
    },
    IN_REPAIR: {
      label: "Đang sửa chữa",
      className: "bg-violet-50 text-violet-700 ring-violet-200",
      icon: Wrench,
    },
    COMPLETED: {
      label: "Hoàn thành",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: CheckCircle2,
    },
    REJECTED: {
      label: "Từ chối",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      icon: XCircle,
    },
    OTHER: {
      label: request.status?.warranty_request_status_name || "Chưa xác định",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      icon: AlertCircle,
    },
  };

  const item = config[status];

  const Icon = item.icon;

  return (
    <View
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${item.className}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
      }}
    >
      <Icon size={13} />
      <Text
        className="text-xs font-semibold"
        style={{
          color: getIconColor(
            `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${item.className}`,
          ),
        }}
      >
        {item.label}
      </Text>
    </View>
  );
}

// ============================================================
// 5. WARRANTY REQUEST TYPE BADGE
// ============================================================

function RequestTypeBadge({ request }: { request: WarrantyRequest }) {
  const code = request.type?.warranty_request_type_code?.toUpperCase();

  const isRepair = code === "REPAIR";

  return (
    <View
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isRepair ? "bg-violet-50 text-violet-700" : "bg-teal-50 text-teal-700"}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
      }}
    >
      {isRepair ? <Wrench size={13} /> : <ShieldCheck size={13} />}
      <Text
        className="text-xs font-semibold"
        style={{
          color: getIconColor(
            `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isRepair ? "bg-violet-50 text-violet-700" : "bg-teal-50 text-teal-700"}`,
          ),
        }}
      >
        {request.type?.warranty_request_type_name ||
          (isRepair ? "Sửa chữa sản phẩm" : "Bảo hành sản phẩm")}
      </Text>
    </View>
  );
}

// ============================================================
// 6. COMMON COMPONENTS
// ============================================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof ShieldCheck;
  iconClass: string;
}) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-5">
      <View className="flex items-start justify-between gap-3 flex-row">
        <View className="min-w-0">
          <Text className="text-sm font-medium text-slate-500">{title}</Text>
          <Text className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">{description}</Text>
        </View>

        <View className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={22} className={iconClass} />
        </View>
      </View>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 flex-row">
      <View className="mt-0.5 shrink-0 text-teal-600">{icon}</View>

      <View className="min-w-0 flex-1">
        <Text className="text-xs text-slate-500">{label}</Text>
        <Text className="mt-1 text-sm font-semibold text-slate-800">
          {value}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// 7. WARRANTY REQUEST HISTORY
// ============================================================

function WarrantyRequestHistory({ requests }: { requests: WarrantyRequest[] }) {
  const sortedRequests = useMemo(() => {
    return [...(requests ?? [])].sort((a, b) => {
      return (
        new Date(b.warranty_request_created_at).getTime() -
        new Date(a.warranty_request_created_at).getTime()
      );
    });
  }, [requests]);

  return (
    <View className="rounded-2xl border border-slate-200 bg-white">
      <View className="flex flex-col justify-between gap-2 border-b border-slate-100 p-4">
        <View>
          <View className="flex items-center gap-2 flex-row">
            <ClipboardList size={18} className="text-teal-600" />
            <Text className="text-sm font-bold text-slate-900">
              Lịch sử yêu cầu bảo hành
            </Text>
          </View>

          <Text className="mt-1 text-xs text-slate-500">
            Theo dõi quá trình bảo hành và sửa chữa sản phẩm
          </Text>
        </View>

        <Text className="inline-flex w-fit items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 flex-row">
          {sortedRequests.length} yêu cầu
        </Text>
      </View>

      {sortedRequests.length === 0 ? (
        <View className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <View className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 flex-row">
            <FileText size={25} />
          </View>

          <Text className="mt-3 text-sm font-semibold text-slate-700">
            Chưa có yêu cầu bảo hành
          </Text>

          <Text className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Sản phẩm này chưa phát sinh yêu cầu bảo hành hoặc sửa chữa nào.
          </Text>
        </View>
      ) : (
        <View className="">
          {sortedRequests.map((request, index) => (
            <View key={request.warranty_request_id} className="p-4">
              <View className="flex items-start gap-3 flex-row">
                <View className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 flex-row">
                  <Text className="text-sm font-bold">{index + 1}</Text>
                </View>

                <View className="min-w-0 flex-1">
                  <View className="flex flex-col justify-between gap-2">
                    <View className="min-w-0">
                      <Text className="text-sm font-bold text-slate-800">
                        {request.warranty_request_code}
                      </Text>

                      <Text className="mt-1 text-xs text-slate-500">
                        ID yêu cầu: {request.warranty_request_id}
                      </Text>
                    </View>

                    <RequestStatusBadge request={request} />
                  </View>

                  <View className="mt-3 flex flex-wrap items-center gap-2 flex-row">
                    <RequestTypeBadge request={request} />
                  </View>

                  <View className="mt-3 rounded-xl bg-slate-50 p-3">
                    <Text className="text-xs font-semibold text-slate-500">
                      Mô tả tình trạng sản phẩm
                    </Text>

                    <Text className="mt-1 text-sm leading-6 text-slate-700">
                      {request.warranty_request_description || "Không có mô tả"}
                    </Text>
                  </View>

                  <View className="mt-3 gap-2 flex-col">
                    <View className="flex items-start gap-2 text-xs flex-row">
                      <CalendarDays
                        size={15}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <View>
                        <Text className="text-slate-500">Ngày tiếp nhận</Text>
                        <Text className="mt-0.5 font-semibold text-slate-700">
                          {formatDateTime(request.warranty_request_received_at)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex items-start gap-2 text-xs flex-row">
                      <CalendarCheck
                        size={15}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <View>
                        <Text className="text-slate-500">Ngày hoàn thành</Text>
                        <Text className="mt-0.5 font-semibold text-slate-700">
                          {formatDateTime(
                            request.warranty_request_completed_at,
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="mt-3 border-t border-slate-100 pt-2">
                    <Text className="text-xs text-slate-400">
                      Ngày tạo yêu cầu:{" "}
                      {formatDateTime(request.warranty_request_created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================
// 8. MAIN PAGE
// ============================================================

export default function WarrantyPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requestId = useRef(0);

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedWarranty, setSelectedWarranty] =
    useState<Warranty | null>(null);

  // ==========================================================
  // 8.2. DEBOUNCE SEARCH
  // ==========================================================

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [keyword]);

  // ==========================================================
  // 8.3. FETCH WARRANTIES
  // ==========================================================

  const fetchWarranties = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const currentRequest = ++requestId.current;

      try {
        // AUTHENTICATION: kiểm tra phiên trước khi tải dữ liệu.
        const { userId } = await getStoredUser();

        if (!userId) {
          router.replace("/customer/login");

          return;
        }

        const response: WarrantyResponse =
          await customerCustomerService.getWarranty(
            debouncedKeyword || undefined,
            filterStatus === "ALL" ? undefined : filterStatus,
          );

        if (currentRequest !== requestId.current) return;

        if (!response || !Array.isArray(response.data)) {
          throw new Error("Dữ liệu bảo hành trả về không hợp lệ.");
        }

        setWarranties(response.data);

        setTotal(
          typeof response.total === "number"
            ? response.total
            : response.data.length,
        );

        // Cập nhật dữ liệu modal nếu đang mở.
        setSelectedWarranty((current) => {
          if (!current) return null;

          const updatedWarranty = response.data.find(
            (item) => item.warranty_id === current.warranty_id,
          );

          return updatedWarranty ?? null;
        });
      } catch (err: unknown) {
        if (currentRequest !== requestId.current) return;

        const axiosError = err as {
          response?: {
            data?: {
              message?: string;
            };
          };
          message?: string;
        };

        setError(
          axiosError.response?.data?.message ||
            axiosError.message ||
            "Không thể tải danh sách bảo hành. Vui lòng thử lại.",
        );
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);

          setRefreshing(false);
        }
      }
    },
    [debouncedKeyword, filterStatus, router],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchWarranties();

      return () => {
        requestId.current++;
      };
    }, [fetchWarranties]),
  );

  // ==========================================================
  // 8.4. STATISTICS
  // ==========================================================

  const stats = useMemo(() => {
    return {
      active: warranties.filter((item) => getEffectiveStatus(item) === "ACTIVE")
        .length,
      expired: warranties.filter(
        (item) => getEffectiveStatus(item) === "EXPIRED",
      ).length,
    };
  }, [warranties]);

  // ==========================================================
  // 8.5. FILTER HELPERS
  // ==========================================================

  const clearFilters = () => {
    setKeyword("");

    setDebouncedKeyword("");

    setFilterStatus("ALL");

    setFilterOpen(false);
  };

  const hasFilters = Boolean(keyword.trim()) || filterStatus !== "ALL";

  // ==========================================================
  // 9. RENDER
  // ==========================================================

  return (
    <StoreScrollView
      alwaysBounceVertical
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            if (!loading && !refreshing) void fetchWarranties(true);
          }}
          tintColor="#168b87"
        />
      }
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      className="bg-slate-50 px-4 py-6 text-slate-800 flex-1"
    >
      <View className="w-full gap-5">
        {/* PAGE HEADING */}
        <View className="flex flex-col justify-between gap-4">
          <View>
            <Text className="text-2xl font-bold tracking-tight text-slate-900">
              Bảo hành của tôi
            </Text>

            <Text className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Theo dõi thời hạn bảo hành và thông tin sản phẩm đã mua của bạn.
            </Text>
          </View>
        </View>

        {/* STATISTICS */}
        <View className="gap-4 flex-col">
          <StatCard
            title="Tổng bảo hành"
            value={total}
            description="Theo điều kiện tìm kiếm hiện tại"
            icon={Package}
            iconClass="bg-teal-50 text-teal-700"
          />

          <StatCard
            title="Còn hiệu lực"
            value={stats.active}
            description="Trong danh sách đang hiển thị"
            icon={ShieldCheck}
            iconClass="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Đã hết hạn"
            value={stats.expired}
            description="Trong danh sách đang hiển thị"
            icon={Clock}
            iconClass="bg-rose-50 text-rose-700"
          />
        </View>

        {/* WARRANTY LIST */}
        <View className="rounded-2xl border border-slate-200 bg-white">
          <View className="border-b border-slate-200 p-5">
            <View className="flex flex-col justify-between gap-4">
              <View>
                <Text className="text-lg font-bold text-slate-900">
                  Danh sách bảo hành
                </Text>

                <Text className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Đang tải dữ liệu..."
                    : `Hiển thị ${warranties.length} / ${total} sản phẩm`}
                </Text>
              </View>

              <View className="flex flex-col gap-3">
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
                  <Search size={18} className="text-slate-400" />

                  <TextInput
                    value={keyword}
                    onChangeText={(value) => setKeyword(value)}
                    placeholder="Tìm mã bảo hành, đơn hàng, SKU..."
                    className="h-12 min-w-0 flex-1 px-3 text-sm text-slate-800"
                  />
                </View>

                <View className="gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Lọc trạng thái bảo hành"
                    accessibilityState={{ expanded: filterOpen }}
                    onPress={() => setFilterOpen((open) => !open)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <Text className="flex-1 text-sm text-slate-700">
                      {filterStatus === "ALL"
                        ? "Tất cả trạng thái"
                        : filterStatus === "ACTIVE"
                          ? "Còn hiệu lực"
                          : "Đã hết hạn"}
                    </Text>
                    <View
                      style={{
                        transform: [{ rotate: filterOpen ? "180deg" : "0deg" }],
                      }}
                    >
                      <NativeIcon path="m6 9 6 6 6-6" size={18} />
                    </View>
                  </Pressable>
                  {filterOpen && (
                    <View className="rounded-xl border border-slate-200 bg-white p-1">
                      {(["ALL", "ACTIVE", "EXPIRED"] as const).map((status) => (
                        <Pressable
                          key={status}
                          accessibilityRole="radio"
                          accessibilityState={{
                            checked: filterStatus === status,
                          }}
                          onPress={() => {
                            setFilterStatus(status);

                            setFilterOpen(false);
                          }}
                          className={`min-h-12 rounded-lg px-3 py-4 ${filterStatus === status ? "bg-teal-50" : "bg-white"}`}
                        >
                          <Text
                            className={`text-sm ${filterStatus === status ? "font-semibold text-teal-700" : "text-slate-700"}`}
                          >
                            {status === "ALL"
                              ? "Tất cả trạng thái"
                              : status === "ACTIVE"
                                ? "Còn hiệu lực"
                                : "Đã hết hạn"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {hasFilters && (
                  <Pressable
                    onPress={clearFilters}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 flex-row"
                    accessibilityRole="button"
                  >
                    <FilterX size={16} />
                    <Text className="text-sm font-semibold text-slate-600">
                      Xóa lọc
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* ERROR */}
          {error && (
            <View className="m-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <View className="flex items-start gap-3 flex-row">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-rose-600"
                />

                <View>
                  <Text className="text-sm font-semibold text-rose-800">
                    Không thể tải dữ liệu bảo hành
                  </Text>

                  <Text className="mt-1 text-sm text-rose-700">
                    {error === "Network Error"
                      ? "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
                      : error}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => void fetchWarranties()}
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-white">
                  Thử lại
                </Text>
              </Pressable>
            </View>
          )}

          {/* LOADING */}
          {loading ? (
            <View className="flex min-h-72 flex-col items-center justify-center gap-3 p-8">
              <LoaderCircle size={38} className="animate-spin text-teal-600" />

              <Text className="text-sm text-slate-500">
                Đang tải danh sách bảo hành...
              </Text>
            </View>
          ) : !error && warranties.length === 0 ? (
            <View className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <View className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 flex-row">
                {hasFilters ? <Search size={28} /> : <ShieldCheck size={30} />}
              </View>

              <Text className="text-base font-bold text-slate-800">
                {hasFilters
                  ? "Không tìm thấy kết quả"
                  : "Bạn chưa có sản phẩm bảo hành"}
              </Text>

              <Text className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters
                  ? "Hãy thử từ khóa khác hoặc thay đổi bộ lọc trạng thái."
                  : "Thông tin bảo hành sẽ xuất hiện tại đây khi đơn hàng của bạn đủ điều kiện đăng ký bảo hành."}
              </Text>

              {hasFilters && (
                <Pressable
                  onPress={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 flex-row"
                  accessibilityRole="button"
                >
                  <FilterX size={16} />
                  <Text className="text-sm font-semibold text-teal-700">
                    Xóa bộ lọc
                  </Text>
                </Pressable>
              )}
            </View>
          ) : !error ? (
            <>
              {/* MOBILE CARDS */}
              <View className="gap-3 p-4 gap-3">
                {warranties.map((warranty) => (
                  <View
                    key={warranty.warranty_id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <View className="flex items-start gap-3 flex-row">
                      <View className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 flex-row">
                        {warranty.warranty_product_image ? (
                          <ProductImage
                            uri={getProductImage(
                              warranty.warranty_product_image,
                            )}
                            accessibilityLabel={
                              warranty.warranty_product_name || "Sản phẩm"
                            }
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package size={25} className="text-slate-400" />
                        )}
                      </View>

                      <View className="min-w-0 flex-1">
                        <Text className="line-clamp-2 text-sm font-bold text-slate-800">
                          {warranty.warranty_product_name ||
                            "Sản phẩm công nghệ"}
                        </Text>

                        <Text className="mt-1 text-xs text-slate-500">
                          {warranty.warranty_code}
                        </Text>

                        <View className="mt-2">
                          <StatusBadge warranty={warranty} />
                        </View>
                      </View>
                    </View>

                    <View className="mt-3 gap-1">
                      <Text className="text-xs text-slate-500">
                        ID: {warranty.warranty_id}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        SKU: {warranty.warranty_sku}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        Đơn hàng: {warranty.order_code}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        Thời hạn: {warranty.warranty_duration_months} tháng
                      </Text>
                    </View>
                    <View className="mt-4 gap-3 rounded-xl bg-slate-50 p-3 flex-col">
                      <View>
                        <Text className="text-xs text-slate-500">Bắt đầu</Text>
                        <Text className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(warranty.warranty_start_date)}
                        </Text>
                      </View>

                      <View>
                        <Text className="text-xs text-slate-500">Kết thúc</Text>
                        <Text className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(warranty.warranty_end_date)}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setSelectedWarranty(warranty)}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white text-sm font-semibold text-teal-700 flex-row"
                      accessibilityRole="button"
                    >
                      <Eye size={16} />
                      <Text className="text-sm font-semibold text-teal-700">
                        Xem chi tiết bảo hành
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* FOOTER */}
          {!loading && !error && warranties.length > 0 && (
            <View className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500">
              <Text>
                Tổng cộng <Text className="text-slate-700">{total}</Text> bảo
                hành
              </Text>

              <Text>Dữ liệu được tải từ hệ thống bảo hành</Text>
            </View>
          )}
        </View>
      </View>

      {/* ======================================================
                  WARRANTY DETAIL MODAL
              ====================================================== */}

      {selectedWarranty && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedWarranty(null)}
        >
          <View
            style={{
              paddingTop: insets.top + 16,
            }}
            className="flex-1 justify-end bg-slate-950/50"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng chi tiết"
              className="flex-1"
              onPress={() => setSelectedWarranty(null)}
            />
            <View
              accessibilityViewIsModal
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              className="max-h-[95%] rounded-t-3xl bg-white"
            >
              {/* MODAL HEADER */}
              <View className="flex-row items-center justify-between gap-3 rounded-t-3xl border-b border-slate-100 bg-teal-50 px-5 py-3">
                <View className="min-w-0 flex-1">
                  <Text
                    id="warranty-modal-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Chi tiết bảo hành
                  </Text>

                  <Text className="mt-1 text-xs text-slate-500">
                    Mã: {selectedWarranty.warranty_code}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSelectedWarranty(null)}
                  accessibilityLabel="Đóng chi tiết"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 flex-row"
                  accessibilityRole="button"
                >
                  <X size={20} />
                </Pressable>
              </View>

              {/* MODAL BODY */}
              <ScrollView contentContainerClassName="gap-5 p-5">
                {/* PRODUCT SUMMARY */}
                <View className="flex flex-col gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <View className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white flex-row">
                    {selectedWarranty.warranty_product_image ? (
                      <ProductImage
                        uri={getProductImage(
                          selectedWarranty.warranty_product_image,
                        )}
                        accessibilityLabel={
                          selectedWarranty.warranty_product_name || "Sản phẩm"
                        }
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package size={34} className="text-slate-400" />
                    )}
                  </View>

                  <View className="min-w-0 flex-1">
                    <Text className="text-lg font-bold text-slate-900">
                      {selectedWarranty.warranty_product_name ||
                        "Sản phẩm công nghệ"}
                    </Text>

                    <Text className="mt-1 text-sm text-slate-500">
                      SKU: {selectedWarranty.warranty_sku}
                    </Text>

                    <View className="mt-3">
                      <StatusBadge warranty={selectedWarranty} />
                    </View>
                  </View>
                </View>

                {/* WARRANTY INFORMATION */}
                <View>
                  <View
                    className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 flex-row"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      alignSelf: "flex-start",
                    }}
                  >
                    <ShieldCheck size={17} className="text-teal-600" />
                    <Text className="flex-1 text-sm font-bold text-slate-800">
                      Thông tin bảo hành
                    </Text>
                  </View>

                  <View className="gap-3 flex-col">
                    <DetailItem
                      icon={<ShieldCheck size={17} />}
                      label="Mã bảo hành"
                      value={selectedWarranty.warranty_code}
                    />

                    <DetailItem
                      icon={<Hash size={17} />}
                      label="ID bảo hành"
                      value={String(selectedWarranty.warranty_id)}
                    />

                    <DetailItem
                      icon={<CalendarDays size={17} />}
                      label="Ngày bắt đầu"
                      value={formatDate(selectedWarranty.warranty_start_date)}
                    />

                    <DetailItem
                      icon={<CalendarDays size={17} />}
                      label="Ngày kết thúc"
                      value={formatDate(selectedWarranty.warranty_end_date)}
                    />

                    <DetailItem
                      icon={<Clock size={17} />}
                      label="Thời hạn"
                      value={`${selectedWarranty.warranty_duration_months} tháng`}
                    />

                    <DetailItem
                      icon={<ShoppingBag size={17} />}
                      label="Mã đơn hàng"
                      value={selectedWarranty.order_code}
                    />

                    <DetailItem
                      icon={<Package size={17} />}
                      label="Mã SKU"
                      value={selectedWarranty.warranty_sku}
                    />

                    <DetailItem
                      icon={<Hash size={17} />}
                      label="Số serial"
                      value={
                        selectedWarranty.warranty_serial_number ||
                        "Chưa cập nhật"
                      }
                    />
                  </View>
                </View>

                {/* SYSTEM INFORMATION */}
                <View className="rounded-xl border border-slate-200 p-4">
                  <View
                    className="flex items-center gap-2 text-sm font-bold text-slate-800 flex-row"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Clock size={17} className="text-teal-600" />
                    <Text className="flex-1 text-sm font-bold text-slate-800">
                      Thông tin hệ thống
                    </Text>
                  </View>

                  <View className="mt-3 gap-3 text-sm">
                    <View className="flex items-start justify-between gap-4 flex-row">
                      <Text className="text-slate-500">Trạng thái gốc</Text>

                      <Text className="text-right font-medium text-slate-700">
                        {getStatusLabel(selectedWarranty)}
                      </Text>
                    </View>

                    <View className="flex items-start justify-between gap-4 flex-row">
                      <Text className="text-slate-500">Ngày tạo</Text>

                      <Text className="text-right font-medium text-slate-700">
                        {formatDate(selectedWarranty.warranty_created_at)}
                      </Text>
                    </View>

                    <View className="flex items-start justify-between gap-4 flex-row">
                      <Text className="text-slate-500">Cập nhật lần cuối</Text>

                      <Text className="text-right font-medium text-slate-700">
                        {formatDate(selectedWarranty.warranty_updated_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* WARRANTY REQUEST HISTORY */}
                <WarrantyRequestHistory
                  requests={selectedWarranty.requests ?? []}
                />
              </ScrollView>

              {/* MODAL FOOTER */}
              <View className="border-t border-slate-100 bg-white px-5 pt-3">
                <Pressable
                  onPress={() => setSelectedWarranty(null)}
                  className="min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 p-3"
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-semibold text-white">Đóng</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </StoreScrollView>
  );
}
// ============================================================
// 10. MOBILE ICONS & PRODUCT IMAGE
// ============================================================

type IconProps = {
  className?: string;
  size?: number;
};

function NativeIcon({
  size = 16,
  className,
  path,
}: IconProps & {
  path: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={getIconColor(className)}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d={path} />
      </Svg>
    </View>
  );
}

const Search = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="m21 21-5-5 M18 10a8 8 0 1 1-16 0a8 8 0 0 1 16 0"
  />
);

const ShieldCheck = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11 M8 12l3 3 5-6"
  />
);

const CalendarDays = (props: IconProps) => (
  <NativeIcon {...props} path="M4 5h16v16H4z M4 9h16 M8 2v6 M16 2v6" />
);

const Package = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10"
  />
);

const Clock = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0 M12 6v6l4 2"
  />
);

const AlertCircle = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0 M12 7v6 M12 16v1"
  />
);

const CheckCircle2 = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0 M7 12l3 3 7-7"
  />
);

const XCircle = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0 M8 8l8 8 M16 8l-8 8"
  />
);

const Eye = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12 M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0"
  />
);

const X = (props: IconProps) => (
  <NativeIcon {...props} path="M6 6l12 12 M18 6 6 18" />
);

const Hash = (props: IconProps) => (
  <NativeIcon {...props} path="M4 9h16 M3 15h16 M10 3 8 21 M16 3l-2 18" />
);

const ShoppingBag = (props: IconProps) => (
  <NativeIcon {...props} path="M4 7h16v15H4z M8 7V5a4 4 0 0 1 8 0v2" />
);

const FilterX = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M3 3h18l-7 8v9l-4-2v-7z M16 16l6 6 M22 16l-6 6"
  />
);

const ClipboardList = (props: IconProps) => (
  <NativeIcon {...props} path="M5 4h14v18H5z M9 2h6v4H9z M9 11h6 M9 16h6" />
);

const Wrench = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M14 6a6 6 0 0 0-7 7L2 18l4 4 5-5a6 6 0 0 0 7-7l-4 4-4-4z"
  />
);

const FileText = (props: IconProps) => (
  <NativeIcon {...props} path="M5 2h10l5 5v15H5z M14 2v6h6 M8 12h9 M8 17h9" />
);

const CalendarCheck = (props: IconProps) => (
  <NativeIcon
    {...props}
    path="M4 5h16v16H4z M4 9h16 M8 2v6 M16 2v6 M8 15l3 3 5-5"
  />
);

const LoaderCircle = ({ className }: IconProps) => (
  <ActivityIndicator className={className} color="#168b87" />
);

function ProductImage({
  uri,
  className,
  accessibilityLabel,
}: {
  uri: string;
  className?: string;
  accessibilityLabel?: string;
}) {
  const [load, setLoad] = useState({ uri, attempt: 0 });

  const attempt = load.uri === uri ? load.attempt : 0;

  const candidates = getProductImageCandidates(uri);

  return attempt >= candidates.length ? (
    <View
      className={className}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <Package size={24} className="text-slate-400" />
    </View>
  ) : (
    <Image
      source={{ uri: candidates[attempt] }}
      className={className}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      onError={() => setLoad({ uri, attempt: attempt + 1 })}
    />
  );
}

function getIconColor(className = "") {
  const colors: Record<string, string> = {
    "rose-700": "#be123c",
    "rose-600": "#e11d48",
    "emerald-700": "#047857",
    "blue-700": "#1d4ed8",
    "amber-700": "#b45309",
    "violet-700": "#6d28d9",
    "slate-400": "#94a3b8",
    "slate-600": "#475569",
  };

  const token = className.match(/text-([a-z]+-\d+)/)?.[1];

  return token ? (colors[token] ?? "#168b87") : "#168b87";
}

function getProductImageCandidates(uri: string) {
  const prefix = FRONTEND_ASSET_URL + "/product/";

  const filename = uri.startsWith(prefix) ? uri.slice(prefix.length) : "";

  return filename && !filename.includes("/")
    ? [
        uri,
        ...["phone", "laptop", "tablet"].map(
          (kind) => prefix + kind + "/" + filename,
        ),
      ]
    : [uri];
}
