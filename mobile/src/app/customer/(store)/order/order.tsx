import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios, { isAxiosError } from "axios";
import { FRONTEND_ASSET_URL, PAYMENT_SERVICE_URL } from "@/constants/api";
import { getStoredUser } from "@/lib/storage/secure_storage";
import { customerOrderService } from "@/lib/axios/services/customer-services/order_service";

// ==========================================
// TYPES
// ==========================================

type OrderItem = {
  order_item_id: number;
  order_item_order_id: number;
  order_item_sku: string;
  order_item_serial_number: string | null;
  order_item_product_name: string;
  order_item_product_image: string | null;
  order_item_unit_price: string;
  order_item_quantity: number;
  order_item_subtotal: string;

  // Khuyến mãi trực tiếp theo SKU
  order_item_promotion_id: number | null;
  order_item_promotion_name: string | null;
  order_item_direct_discount_amount: string | null;
};

type Order = {
  order_id: number;
  order_code: string;
  order_user_id: number;

  order_order_processing_status_id: number;
  order_order_payment_status_id: number;
  order_order_delivery_method_id: number;
  order_order_payment_method_id: number;

  order_recipient_name: string;
  order_recipient_phone: string;
  order_address_line: string;
  order_ward: string;
  order_province: string;

  order_subtotal: string;
  order_shipping_fee: string;
  order_discount_amount: string;
  order_total_amount: string;

  // Coupon áp dụng cho toàn đơn hàng
  order_coupon_id: number | null;
  order_coupon_name: string | null;
  order_coupon_discount_amount: string | null;

  order_created_at: string;
  order_updated_at: string;

  order_item: OrderItem[];
};

// ==========================================
// STATUS MAP
// ==========================================

const processingStatusMap: Record<number, string> = {
  1: "Chờ xác nhận",
  2: "Đã xác nhận",
  3: "Đang xử lý",
  4: "Sẵn sàng nhận hàng",
  5: "Đang giao hàng",
  6: "Đã giao hàng",
  7: "Hoàn thành",
  8: "Đã hủy",
  9: "Thất bại",
};

const paymentStatusMap: Record<number, string> = {
  1: "Chưa thanh toán",
  2: "Đã thanh toán",
  3: "Thanh toán thất bại",
  4: "Đã hoàn tiền",
};

const deliveryMethodMap: Record<number, string> = {
  1: "Giao hàng tận nơi",
  2: "Nhận tại cửa hàng",
};

const paymentMethodMap: Record<number, string> = {
  1: "COD (Thanh toán khi nhận hàng)",
  2: "MOMO (Thanh toán qua ví điện tử MOMO)",
  3: "VNPay (Thanh toán qua cổng VNPay)",
};

// ==========================================
// HELPERS
// ==========================================

const formatPrice = (price: string | number | null | undefined) =>
  `${Number(price ?? 0).toLocaleString("vi-VN")} ₫`;

const formatDate = (date: string) =>
  new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getProcessingStatusClass = (statusId: number) => {
  switch (statusId) {
    case 1:
      return "border-amber-200 bg-amber-50 text-amber-700";
    case 2:
      return "border-blue-200 bg-blue-50 text-blue-700";
    case 3:
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case 4:
      return "border-violet-200 bg-violet-50 text-violet-700";
    case 5:
      return "border-orange-200 bg-orange-50 text-orange-700";
    case 6:
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case 7:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case 8:
    case 9:
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const getPaymentStatusClass = (statusId: number) => {
  switch (statusId) {
    case 2:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case 3:
      return "border-red-200 bg-red-50 text-red-700";
    case 4:
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

function ProcessingStatusIcon({ statusId }: { statusId: number }) {
  return (
    <Text>
      {statusId === 7
        ? "✓"
        : statusId === 8 || statusId === 9
          ? "×"
          : statusId === 1 || statusId === 2
            ? "◷"
            : "↻"}
    </Text>
  );
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error) && typeof error.response?.data?.message === "string")
    return error.response.data.message;
  return error instanceof Error ? error.message : fallback;
};

const imageUrl = (image: string, attempt = 0) => {
  if (/^https?:\/\//.test(image)) return image;
  const path = image.replace(/^\/?product\//, "").replace(/^\//, "");
  const directory = path.includes("/")
    ? ""
    : (["phone/", "laptop/", "tablet/", ""][attempt] ?? "");
  return `${FRONTEND_ASSET_URL}/product/${directory}${path}`;
};

// ==========================================
// COMPONENT
// ==========================================

export default function OrdersPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const loadRequest = useRef(0);
  const actionLock = useRef(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [imageAttempts, setImageAttempts] = useState<Record<number, number>>(
    {},
  );

  // ==========================================
  // AUTHENTICATION / FETCH ORDERS
  // ==========================================

  const fetchOrders = useCallback(
    async (initial = true) => {
      if (actionLock.current) return;
      const requestId = ++loadRequest.current;
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);
        setError("");
        const { userId } = await getStoredUser();
        if (requestId !== loadRequest.current) return;
        if (!userId) {
          setOrders([]);
          setSelectedOrder(null);
          setCancelTarget(null);
          router.replace("/customer/login");
          return;
        }
        const data: Order[] = await customerOrderService.getOrderList();
        if (requestId !== loadRequest.current) return;
        setOrders(data);
        setSelectedOrder((current) =>
          current
            ? (data.find((order) => order.order_id === current.order_id) ??
              null)
            : null,
        );
      } catch {
        if (requestId === loadRequest.current)
          setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      } finally {
        if (requestId === loadRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchOrders();
      // Cập nhật trạng thái khi quay lại sau thanh toán ngoài ứng dụng.
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void fetchOrders(false);
      });
      return () => {
        loadRequest.current++;
        subscription.remove();
      };
    }, [fetchOrders]),
  );

  // ==========================================
  // PAYMENT
  // ==========================================

  const handlePayment = async (order: Order) => {
    if (actionLock.current) return;
    if (order.order_order_payment_method_id === 1) {
      setActionError("Đơn hàng này sẽ được thanh toán khi nhận hàng.");
      return;
    }
    actionLock.current = true;
    setPaymentLoading(order.order_id);
    setActionError("");
    try {
      const response = await axios.post<{ payUrl?: string }>(
        PAYMENT_SERVICE_URL,
        {
          order_id: order.order_id,
          payment_method_id: order.order_order_payment_method_id,
        },
        { timeout: 15000 },
      );
      const data = response.data;
      if (!data.payUrl)
        throw new Error("Không nhận được đường dẫn thanh toán.");
      const url = new URL(data.payUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:")
        throw new Error("Đường dẫn thanh toán không hợp lệ.");
      await Linking.openURL(url.toString());
    } catch (err) {
      setActionError(getErrorMessage(err, "Không thể thực hiện thanh toán."));
    } finally {
      actionLock.current = false;
      setPaymentLoading(null);
    }
  };

  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const canCancel = (order: Order) =>
    order.order_order_processing_status_id === 1 &&
    order.order_order_payment_status_id === 1;

  const handleCancelOrder = async () => {
    if (
      !cancelTarget ||
      cancelLoading ||
      actionLock.current ||
      !canCancel(cancelTarget)
    )
      return;
    actionLock.current = true;
    // Bỏ qua response tải danh sách cũ đang chạy trước thao tác hủy.
    loadRequest.current++;
    setRefreshing(false);
    try {
      setCancelLoading(true);
      setActionError("");
      const response = await customerOrderService.cancelOrder(
        cancelTarget.order_id,
      );
      const canceledOrderId = cancelTarget.order_id;
      setOrders((current) =>
        current.map((order) =>
          order.order_id === canceledOrderId
            ? { ...order, order_order_processing_status_id: 8 }
            : order,
        ),
      );
      setSelectedOrder((current) =>
        current?.order_id === canceledOrderId
          ? { ...current, order_order_processing_status_id: 8 }
          : current,
      );
      setCancelTarget(null);
      setActionError(response?.message || "Hủy đơn hàng thành công.");
    } catch (err) {
      setActionError(getErrorMessage(err, "Không thể hủy đơn hàng."));
    } finally {
      actionLock.current = false;
      setCancelLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-[#f6f8fb] px-4">
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className="text-sm font-medium text-slate-500">
          Đang tải đơn hàng...
        </Text>
      </View>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <View className="flex-1 bg-[#f6f8fb]">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (!actionLock.current) void fetchOrders(false);
            }}
            tintColor="#0f766e"
          />
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        }}
      >
        {/* Header */}
        <View className="mb-6">
          <Text
            accessibilityRole="header"
            className="mt-2 text-2xl font-bold text-slate-800"
          >
            Đơn hàng của tôi
          </Text>
          <Text className="mt-2 text-sm text-slate-500">
            Theo dõi trạng thái và quản lý các đơn hàng của bạn.
          </Text>
          <View className="mt-4 rounded-xl border border-teal-100 bg-white p-4">
            <Text className="text-sm text-slate-500">
              Tổng số đơn hàng:{" "}
              <Text className="font-bold text-teal-700">{orders.length}</Text>
            </Text>
          </View>
        </View>

        {/* Action feedback */}
        {!!actionError && (
          <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3">
            <Text
              accessibilityRole="alert"
              className="flex-1 text-sm text-teal-800"
            >
              {actionError}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng thông báo"
              onPress={() => setActionError("")}
              className="h-11 w-11 items-center justify-center"
            >
              <Text className="text-xl text-teal-800">×</Text>
            </Pressable>
          </View>
        )}
        {!!error && (
          <View className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4">
            <Text accessibilityRole="alert" className="text-sm text-red-700">
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void fetchOrders()}
              className="min-h-11 justify-center"
            >
              <Text className="font-semibold text-red-700">Thử lại</Text>
            </Pressable>
          </View>
        )}
        {!error && orders.length === 0 && (
          <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12">
            <Text className="text-4xl text-teal-700">▤</Text>
            <Text className="mt-4 text-lg font-bold text-slate-800">
              Bạn chưa có đơn hàng
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              Các đơn hàng bạn đặt sẽ được hiển thị tại đây.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/customer/home")}
              className="mt-6 rounded-xl bg-teal-700 px-6 py-3"
            >
              <Text className="font-semibold text-white">Tiếp tục mua sắm</Text>
            </Pressable>
          </View>
        )}

        {/* Order list */}
        {orders.map((order) => {
          const quantity = order.order_item.reduce(
            (sum, item) => sum + Number(item.order_item_quantity),
            0,
          );
          return (
            <View
              key={order.order_id}
              className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <View className="gap-3 border-b border-slate-100 bg-slate-50 p-4">
                <View>
                  <Text className="text-xs text-slate-500">Mã đơn hàng</Text>
                  <Text className="mt-1 text-base font-bold text-slate-800">
                    #{order.order_code}
                  </Text>
                </View>
                <Text className="text-xs text-slate-500">
                  Ngày đặt: {formatDate(order.order_created_at)}
                </Text>
                <Text
                  className={`self-start rounded-full border px-3 py-2 text-xs font-semibold ${getProcessingStatusClass(order.order_order_processing_status_id)}`}
                >
                  <ProcessingStatusIcon
                    statusId={order.order_order_processing_status_id}
                  />{" "}
                  {processingStatusMap[
                    order.order_order_processing_status_id
                  ] || "Không xác định"}
                </Text>
                <Text className="self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  {deliveryMethodMap[order.order_order_delivery_method_id] ||
                    "Không xác định"}
                </Text>
              </View>
              <View className="gap-3 p-4">
                <View>
                  <Text className="text-xs text-slate-500">Người nhận</Text>
                  <Text className="mt-1 font-semibold text-slate-800">
                    {order.order_recipient_name}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-slate-500">Số điện thoại</Text>
                  <Text className="mt-1 font-semibold text-slate-800">
                    {order.order_recipient_phone}
                  </Text>
                </View>
                <View className="flex-row flex-wrap items-end justify-between gap-3">
                  <View>
                    <Text className="text-xs text-slate-500">
                      Số lượng sản phẩm
                    </Text>
                    <Text className="mt-1 font-semibold text-slate-800">
                      {quantity} sản phẩm
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-slate-500">
                      Tổng thanh toán
                    </Text>
                    <Text className="mt-1 text-lg font-bold text-rose-600">
                      {formatPrice(order.order_total_amount)}
                    </Text>
                  </View>
                </View>
                <View className="gap-2 rounded-xl bg-slate-50 p-3">
                  <Text className="text-sm text-slate-500">
                    Thanh toán:{" "}
                    <Text className="font-semibold text-slate-700">
                      {paymentMethodMap[order.order_order_payment_method_id] ||
                        "Không xác định"}
                    </Text>
                  </Text>
                  <Text
                    className={`self-start rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(order.order_order_payment_status_id)}`}
                  >
                    {paymentStatusMap[order.order_order_payment_status_id] ||
                      "Không xác định"}
                  </Text>
                </View>
              </View>
              <View className="gap-2 border-t border-slate-100 p-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem chi tiết đơn ${order.order_code}`}
                  onPress={() => {
                    setActionError("");
                    setSelectedOrder(order);
                  }}
                  className="min-h-12 items-center justify-center rounded-xl bg-teal-700 p-3"
                >
                  <Text className="text-sm font-semibold text-white">
                    Xem chi tiết
                  </Text>
                </Pressable>
                {canCancel(order) && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Hủy đơn ${order.order_code}`}
                    disabled={cancelLoading || paymentLoading !== null}
                    onPress={() => {
                      setActionError("");
                      setCancelTarget(order);
                    }}
                    className="min-h-12 items-center justify-center rounded-xl border border-rose-200 p-3"
                  >
                    <Text className="text-sm font-semibold text-rose-600">
                      Hủy đơn hàng
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* CANCEL CONFIRMATION MODAL */}
      <Modal
        visible={cancelTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!cancelLoading) setCancelTarget(null);
        }}
      >
        <View
          className="flex-1 justify-center bg-slate-950/50 p-4"
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng xác nhận hủy"
            disabled={cancelLoading}
            onPress={() => setCancelTarget(null)}
            className="absolute inset-0"
          />
          {cancelTarget && (
            <View
              accessibilityViewIsModal
              className="max-h-full overflow-hidden rounded-2xl bg-white"
            >
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    accessibilityRole="header"
                    className="flex-1 text-lg font-bold text-slate-800"
                  >
                    Xác nhận hủy đơn hàng
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Đóng xác nhận hủy"
                    disabled={cancelLoading}
                    onPress={() => setCancelTarget(null)}
                    className="h-11 w-11 items-center justify-center"
                  >
                    <Text className="text-2xl text-slate-500">×</Text>
                  </Pressable>
                </View>
                <Text className="mt-2 text-sm text-slate-600">
                  Bạn có chắc chắn muốn hủy đơn hàng này không?
                </Text>
                <View className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <Text className="text-xs text-slate-500">Mã đơn hàng</Text>
                  <Text className="mt-1 font-bold text-slate-800">
                    #{cancelTarget.order_code}
                  </Text>
                  <Text className="mt-2 text-sm text-slate-600">
                    Tổng tiền:{" "}
                    <Text className="font-bold text-rose-600">
                      {formatPrice(cancelTarget.order_total_amount)}
                    </Text>
                  </Text>
                </View>
                <Text className="mt-4 text-sm text-slate-500">
                  Sau khi hủy, đơn hàng sẽ không thể tiếp tục xử lý.
                </Text>
                {!!actionError && (
                  <Text
                    accessibilityRole="alert"
                    className="mt-3 text-sm text-red-600"
                  >
                    {actionError}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={cancelLoading}
                  onPress={handleCancelOrder}
                  className={`mt-5 min-h-12 items-center justify-center rounded-xl bg-rose-600 p-3 ${cancelLoading ? "opacity-60" : ""}`}
                >
                  <Text className="font-semibold text-white">
                    {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={cancelLoading}
                  onPress={() => setCancelTarget(null)}
                  className="mt-2 min-h-12 items-center justify-center rounded-xl border border-slate-200 p-3"
                >
                  <Text className="font-semibold text-slate-600">Quay lại</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ORDER DETAIL MODAL */}
      <Modal
        visible={selectedOrder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (paymentLoading === null) setSelectedOrder(null);
        }}
      >
        <View
          className="flex-1 justify-end bg-slate-950/50"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng chi tiết"
            disabled={paymentLoading !== null}
            onPress={() => setSelectedOrder(null)}
            className="flex-1"
          />
          {selectedOrder && (
            <View
              accessibilityViewIsModal
              className="max-h-[95%] rounded-t-3xl bg-white"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <View className="flex-row items-center justify-between gap-3 rounded-t-3xl border-b border-slate-100 bg-teal-50 px-5 py-3">
                <View className="flex-1">
                  <Text
                    accessibilityRole="header"
                    className="font-bold text-slate-800"
                  >
                    Chi tiết đơn hàng
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    #{selectedOrder.order_code}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đóng chi tiết"
                  disabled={paymentLoading !== null}
                  onPress={() => setSelectedOrder(null)}
                  className="h-11 w-11 items-center justify-center"
                >
                  <Text className="text-2xl text-slate-500">×</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                {!!actionError && (
                  <Text
                    accessibilityRole="alert"
                    className="mb-4 rounded-xl bg-teal-50 p-3 text-sm text-teal-800"
                  >
                    {actionError}
                  </Text>
                )}
                {/* ORDER INFORMATION */}
                <Text className="mb-3 font-bold text-slate-800">
                  Thông tin đơn hàng
                </Text>
                <View className="gap-4 rounded-xl border border-slate-100 p-4">
                  <View>
                    <Text className="text-xs text-slate-500">Ngày đặt</Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(selectedOrder.order_created_at)}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-slate-500">Trạng thái</Text>
                    <Text
                      className={`mt-1 self-start rounded-full border px-3 py-2 text-xs font-semibold ${getProcessingStatusClass(selectedOrder.order_order_processing_status_id)}`}
                    >
                      <ProcessingStatusIcon
                        statusId={
                          selectedOrder.order_order_processing_status_id
                        }
                      />{" "}
                      {processingStatusMap[
                        selectedOrder.order_order_processing_status_id
                      ] || "Không xác định"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-slate-500">
                      Hình thức nhận hàng
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-800">
                      {deliveryMethodMap[
                        selectedOrder.order_order_delivery_method_id
                      ] || "Không xác định"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-slate-500">Thanh toán</Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-800">
                      {paymentMethodMap[
                        selectedOrder.order_order_payment_method_id
                      ] || "Không xác định"}
                    </Text>
                  </View>
                </View>
                {/* RECIPIENT INFORMATION */}
                <Text className="mb-3 mt-6 font-bold text-slate-800">
                  Thông tin người nhận
                </Text>
                <View className="gap-4 rounded-xl border border-slate-100 p-4">
                  <View>
                    <Text className="text-xs text-slate-500">Họ và tên</Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedOrder.order_recipient_name}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-slate-500">
                      Số điện thoại
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedOrder.order_recipient_phone}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-slate-500">Địa chỉ</Text>
                    <Text className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                      {selectedOrder.order_address_line},{" "}
                      {selectedOrder.order_ward}, {selectedOrder.order_province}
                    </Text>
                  </View>
                </View>
                {/* PRODUCTS */}
                <View className="mb-3 mt-6 flex-row flex-wrap justify-between gap-2">
                  <Text className="font-bold text-slate-800">Sản phẩm</Text>
                  <Text className="text-sm text-slate-500">
                    {selectedOrder.order_item.reduce(
                      (sum, item) => sum + Number(item.order_item_quantity),
                      0,
                    )}{" "}
                    sản phẩm
                  </Text>
                </View>
                {selectedOrder.order_item.map((item) => (
                  <View
                    key={item.order_item_id}
                    className="mb-3 rounded-xl border border-slate-100 p-4"
                  >
                    <View className="flex-row items-start gap-3">
                      {item.order_item_product_image &&
                      (imageAttempts[item.order_item_id] ?? 0) < 4 ? (
                        <Image
                          source={{
                            uri: imageUrl(
                              item.order_item_product_image,
                              imageAttempts[item.order_item_id],
                            ),
                          }}
                          accessibilityLabel={item.order_item_product_name}
                          resizeMode="contain"
                          onError={() =>
                            setImageAttempts((current) => ({
                              ...current,
                              [item.order_item_id]:
                                (current[item.order_item_id] ?? 0) + 1,
                            }))
                          }
                          className="h-20 w-20 rounded-xl bg-slate-50"
                        />
                      ) : (
                        <View className="h-20 w-20 items-center justify-center rounded-xl bg-slate-50">
                          <Text className="text-xs text-slate-400">
                            Không có ảnh
                          </Text>
                        </View>
                      )}
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-semibold text-slate-800">
                          {item.order_item_product_name}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500">
                          SKU: {item.order_item_sku}
                        </Text>
                        {!!item.order_item_serial_number && (
                          <Text className="mt-1 text-xs text-slate-500">
                            Serial: {item.order_item_serial_number}
                          </Text>
                        )}
                      </View>
                    </View>
                    {item.order_item_promotion_id != null && (
                      <View className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                        <Text className="text-xs font-semibold text-emerald-800">
                          Khuyến mãi trực tiếp
                        </Text>
                        <Text className="mt-1 text-sm font-semibold text-emerald-700">
                          {item.order_item_promotion_name ||
                            `Khuyến mãi #${item.order_item_promotion_id}`}
                        </Text>
                        <Text className="mt-1 text-xs text-emerald-700">
                          Mã khuyến mãi: #{item.order_item_promotion_id}
                        </Text>
                        <Text className="mt-1 text-xs font-medium text-emerald-700">
                          Tiết kiệm:{" "}
                          {formatPrice(item.order_item_direct_discount_amount)}
                        </Text>
                      </View>
                    )}
                    <View className="mt-3 flex-row flex-wrap items-end justify-between gap-3">
                      <View>
                        <Text className="text-xs text-slate-500">Đơn giá</Text>
                        <Text className="mt-1 text-sm text-slate-700">
                          {formatPrice(item.order_item_unit_price)} ×{" "}
                          {item.order_item_quantity}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-slate-500">
                          Thành tiền
                        </Text>
                        <Text className="mt-1 text-sm font-bold text-slate-800">
                          {formatPrice(item.order_item_subtotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {/* PAYMENT */}
                <Text className="mb-3 mt-6 font-bold text-slate-800">
                  Thanh toán
                </Text>
                <View className="gap-3 rounded-xl border border-slate-100 p-4">
                  <View className="flex-row flex-wrap items-center justify-between gap-3">
                    <Text className="text-sm text-slate-500">Trạng thái</Text>
                    <Text
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(selectedOrder.order_order_payment_status_id)}`}
                    >
                      {paymentStatusMap[
                        selectedOrder.order_order_payment_status_id
                      ] || "Không xác định"}
                    </Text>
                  </View>
                  {selectedOrder.order_order_payment_status_id === 1 &&
                    (selectedOrder.order_order_payment_method_id === 1 ? (
                      <Text className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                        Đơn hàng sẽ được thanh toán khi nhận hàng.
                      </Text>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        disabled={paymentLoading !== null || cancelLoading}
                        onPress={() => handlePayment(selectedOrder)}
                        className={`min-h-12 items-center justify-center rounded-xl bg-teal-700 p-3 ${paymentLoading !== null ? "opacity-60" : ""}`}
                      >
                        <Text className="text-sm font-semibold text-white">
                          {paymentLoading === selectedOrder.order_id
                            ? "Đang mở thanh toán..."
                            : selectedOrder.order_order_payment_method_id === 2
                              ? "Thanh toán qua MoMo"
                              : "Thanh toán qua VNPay"}
                        </Text>
                      </Pressable>
                    ))}
                  <View className="flex-row flex-wrap justify-between gap-3 border-t border-slate-100 pt-3">
                    <Text className="text-sm text-slate-500">Tạm tính</Text>
                    <Text className="text-sm font-medium text-slate-800">
                      {formatPrice(selectedOrder.order_subtotal)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap justify-between gap-3">
                    <Text className="text-sm text-slate-500">
                      Phí vận chuyển
                    </Text>
                    <Text className="text-sm font-medium text-slate-800">
                      {formatPrice(selectedOrder.order_shipping_fee)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap justify-between gap-3">
                    <Text className="text-sm text-slate-500">
                      Giảm giá trực tiếp
                    </Text>
                    <Text className="text-sm font-medium text-emerald-600">
                      -{" "}
                      {formatPrice(
                        selectedOrder.order_item.reduce(
                          (sum, item) =>
                            sum +
                            Number(item.order_item_direct_discount_amount ?? 0),
                          0,
                        ),
                      )}
                    </Text>
                  </View>
                  {selectedOrder.order_coupon_id != null && (
                    <View className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                      <Text className="text-xs font-semibold text-violet-800">
                        Coupon đã áp dụng
                      </Text>
                      <Text className="mt-1 text-sm font-semibold text-violet-700">
                        {selectedOrder.order_coupon_name ||
                          `Coupon #${selectedOrder.order_coupon_id}`}
                      </Text>
                      <Text className="mt-1 text-xs text-violet-700">
                        Mã coupon: #{selectedOrder.order_coupon_id}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row flex-wrap justify-between gap-3">
                    <Text className="text-sm text-slate-500">
                      Giảm giá coupon
                    </Text>
                    <Text className="text-sm font-medium text-emerald-600">
                      -{" "}
                      {formatPrice(selectedOrder.order_coupon_discount_amount)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap justify-between gap-3 border-t border-slate-100 pt-3">
                    <Text className="text-sm font-semibold text-slate-600">
                      Tổng giảm giá
                    </Text>
                    <Text className="text-sm font-bold text-emerald-600">
                      - {formatPrice(selectedOrder.order_discount_amount)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <Text className="font-bold text-slate-800">Tổng cộng</Text>
                    <Text className="text-xl font-bold text-rose-600">
                      {formatPrice(selectedOrder.order_total_amount)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
              <View className="border-t border-slate-100 px-5 pt-3">
                <Pressable
                  accessibilityRole="button"
                  disabled={paymentLoading !== null}
                  onPress={() => setSelectedOrder(null)}
                  className="min-h-12 items-center justify-center rounded-xl bg-teal-700 p-3"
                >
                  <Text className="font-semibold text-white">Đóng</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
