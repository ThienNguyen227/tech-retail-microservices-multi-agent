"use client";

import { useEffect, useState } from "react";
import {
  Package,
  CalendarDays,
  MapPin,
  Phone,
  UserRound,
  X,
  Truck,
  Store,
  CreditCard,
  Clock3,
  CheckCircle2,
  CircleX,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  ReceiptText,
  ChevronRight,
  Tag,
  TicketPercent,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  if (statusId === 7) return <CheckCircle2 className="h-4 w-4" />;
  if (statusId === 8 || statusId === 9)
    return <CircleX className="h-4 w-4" />;
  if (statusId === 1 || statusId === 2)
    return <Clock3 className="h-4 w-4" />;
  return <Loader2 className="h-4 w-4" />;
}

// ==========================================
// COMPONENT
// ==========================================

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  useEffect(() => {
    if (!sessionStorage.getItem("userId")) {
      router.replace("/customer/login");
    }
  }, [router]);

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        if (!sessionStorage.getItem("userId")) {
          setError("Không tìm thấy thông tin người dùng.");
          return;
        }

        const data: Order[] = await customerOrderService.getOrderList();
        setOrders(data);
      } catch (err) {
        console.error("GET ORDERS ERROR:", err);
        setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ==========================================
  // PAYMENT
  // ==========================================

  const handlePayment = async (order: Order) => {
    try {
      if (order.order_order_payment_method_id === 1) {
        setActionError("Đơn hàng này sẽ được thanh toán khi nhận hàng.");
        return;
      }

      const response = await fetch("http://localhost:3009/api/v1/customer-sesion/payment-service/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_id,
          payment_method_id: order.order_order_payment_method_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Không thể thực hiện thanh toán.");
      }

      if (data.payUrl) {
        window.location.href = data.payUrl;
        return;
      }

      throw new Error("Không nhận được đường dẫn thanh toán.");
    } catch (err) {
      console.error("PAYMENT ERROR:", err);
      setActionError(
        err instanceof Error ? err.message : "Không thể thực hiện thanh toán.",
      );
    }
  };

  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelOrder = async () => {
    if (!cancelTarget || cancelLoading) return;

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
      console.error("CANCEL ORDER ERROR:", err);
      setActionError(
        err instanceof Error ? err.message : "Không thể hủy đơn hàng.",
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancel = (order: Order) =>
    order.order_order_processing_status_id === 1 &&
    order.order_order_payment_status_id === 1;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb] px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-teal-700" />
          <p className="text-sm font-medium text-slate-500">
            Đang tải đơn hàng...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <span>Trang chủ</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-teal-700">Đơn hàng</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                  Đơn hàng của tôi
                </h1>
              </div>
              <p className="text-sm text-slate-500">
                Theo dõi trạng thái và quản lý các đơn hàng của bạn.
              </p>
            </div>

            <div className="rounded-xl border border-teal-100 bg-white px-4 py-3 text-sm shadow-sm">
              <span className="text-slate-500">Tổng số đơn hàng: </span>
              <span className="font-bold text-teal-700">{orders.length}</span>
            </div>
          </div>
        </div>

        {/* Action feedback */}
        {actionError && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            <p>{actionError}</p>
            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Đóng thông báo"
              className="rounded-lg p-1 transition hover:bg-teal-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && orders.length === 0 ? (
          <section className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Package className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Bạn chưa có đơn hàng
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Các đơn hàng bạn đặt sẽ được hiển thị tại đây.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const quantity = order.order_item.reduce(
                (sum, item) => sum + Number(item.order_item_quantity),
                0,
              );

              return (
                <article
                  key={order.order_id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Order heading */}
                  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Package className="h-5 w-5 text-teal-700" />
                        <h2 className="font-bold text-slate-800">
                          Đơn hàng #{order.order_code}
                        </h2>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        Đặt lúc {formatDate(order.order_created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getProcessingStatusClass(
                          order.order_order_processing_status_id,
                        )}`}
                      >
                        <ProcessingStatusIcon
                          statusId={order.order_order_processing_status_id}
                        />
                        {processingStatusMap[
                          order.order_order_processing_status_id
                        ] || "Không xác định"}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {order.order_order_delivery_method_id === 1 ? (
                          <Truck className="h-4 w-4" />
                        ) : (
                          <Store className="h-4 w-4" />
                        )}
                        {deliveryMethodMap[order.order_order_delivery_method_id]}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Người nhận
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {order.order_recipient_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Số điện thoại
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {order.order_recipient_phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Số lượng sản phẩm
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {quantity} sản phẩm
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Tổng thanh toán
                      </p>
                      <p className="mt-1 text-lg font-bold text-rose-600">
                        {formatPrice(order.order_total_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Payment summary */}
                  <div className="mx-5 mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:mx-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-teal-700" />
                      <span className="text-slate-500">Thanh toán:</span>
                      <span className="font-semibold text-slate-700">
                        {paymentMethodMap[order.order_order_payment_method_id]}
                      </span>
                    </div>

                    <span
                      className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
                        order.order_order_payment_status_id,
                      )}`}
                    >
                      {paymentStatusMap[order.order_order_payment_status_id]}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                    {canCancel(order) && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(order)}
                        className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        Hủy đơn hàng
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* CANCEL CONFIRMATION MODAL */}
      {/* ========================================== */}

      {cancelTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancelLoading) {
              setCancelTarget(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start gap-4 bg-gradient-to-r from-rose-50 to-orange-50 px-6 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="cancel-order-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Xác nhận hủy đơn hàng
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  Bạn có chắc chắn muốn hủy đơn hàng này không?
                </p>
              </div>

              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelTarget(null)}
                aria-label="Đóng modal"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Mã đơn hàng
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  #{cancelTarget.order_code}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Tổng tiền:{" "}
                  <span className="font-bold text-rose-600">
                    {formatPrice(cancelTarget.order_total_amount)}
                  </span>
                </p>
              </div>

              <p className="mt-4 text-sm leading-5 text-slate-500">
                Sau khi hủy, đơn hàng sẽ không thể tiếp tục xử lý.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => setCancelTarget(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quay lại
                </button>

                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={handleCancelOrder}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================== */}
      {/* ORDER DETAIL MODAL */}
      {/* ========================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal header */}
            <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="order-detail-title"
                  className="font-bold text-slate-800"
                >
                  Chi tiết đơn hàng
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  #{selectedOrder.order_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              {/* ========================================== */}
              {/* ORDER INFORMATION */}
              {/* ========================================== */}

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                  <ReceiptText className="h-4 w-4 text-teal-700" />
                  Thông tin đơn hàng
                </h3>

                <div className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Ngày đặt</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(selectedOrder.order_created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Trạng thái</p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getProcessingStatusClass(
                        selectedOrder.order_order_processing_status_id,
                      )}`}
                    >
                      <ProcessingStatusIcon
                        statusId={selectedOrder.order_order_processing_status_id}
                      />
                      {processingStatusMap[
                        selectedOrder.order_order_processing_status_id
                      ] || "Không xác định"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Hình thức nhận hàng
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      {selectedOrder.order_order_delivery_method_id === 1 ? (
                        <Truck className="h-4 w-4 text-teal-700" />
                      ) : (
                        <Store className="h-4 w-4 text-teal-700" />
                      )}
                      {deliveryMethodMap[
                        selectedOrder.order_order_delivery_method_id
                      ]}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Thanh toán</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {paymentMethodMap[
                        selectedOrder.order_order_payment_method_id
                      ]}
                    </p>
                  </div>
                </div>
              </section>

              {/* ========================================== */}
              {/* RECIPIENT INFORMATION */}
              {/* ========================================== */}

              <section>
                <h3 className="mb-3 font-bold text-slate-800">
                  Thông tin người nhận
                </h3>

                <div className="space-y-4 rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 text-teal-700" />
                    <div>
                      <p className="text-xs text-slate-500">Họ và tên</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedOrder.order_recipient_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-teal-700" />
                    <div>
                      <p className="text-xs text-slate-500">Số điện thoại</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedOrder.order_recipient_phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-teal-700" />
                    <div>
                      <p className="text-xs text-slate-500">Địa chỉ</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                        {selectedOrder.order_address_line},{" "}
                        {selectedOrder.order_ward},{" "}
                        {selectedOrder.order_province}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ========================================== */}
              {/* PRODUCTS */}
              {/* ========================================== */}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Sản phẩm</h3>
                  <span className="text-sm text-slate-500">
                    {selectedOrder.order_item.reduce(
                      (sum, item) => sum + Number(item.order_item_quantity),
                      0,
                    )}{" "}
                    sản phẩm
                  </span>
                </div>

                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                  {selectedOrder.order_item.map((item) => (
                    <div
                      key={item.order_item_id}
                      className="flex gap-3 p-4 sm:gap-4"
                    >
                      {/* Product image */}
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-24 sm:w-24">
                        {item.order_item_product_image ? (
                          <img
                            src={`/product/phone/${item.order_item_product_image}`}
                            alt={item.order_item_product_name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-slate-300" />
                        )}
                      </div>

                      {/* Product information */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.order_item_product_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          SKU: {item.order_item_sku}
                        </p>

                        {item.order_item_serial_number && (
                          <p className="mt-1 text-xs text-slate-500">
                            Serial: {item.order_item_serial_number}
                          </p>
                        )}

                        {/* Direct promotion information */}
                        {item.order_item_promotion_id != null && (
                          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                            <div className="flex items-start gap-2">
                              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-emerald-800">
                                  Khuyến mãi trực tiếp
                                </p>

                                <p className="mt-1 text-sm font-semibold text-emerald-700">
                                  {item.order_item_promotion_name ||
                                    `Khuyến mãi #${item.order_item_promotion_id}`}
                                </p>

                                <p className="mt-1 text-xs text-emerald-700">
                                  Mã khuyến mãi: #
                                  {item.order_item_promotion_id}
                                </p>

                                <p className="mt-1 text-xs font-medium text-emerald-700">
                                  Tiết kiệm:{" "}
                                  {formatPrice(
                                    item.order_item_direct_discount_amount,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Product price */}
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500">Đơn giá</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {formatPrice(item.order_item_unit_price)}
                              <span className="ml-2 text-slate-400">
                                × {item.order_item_quantity}
                              </span>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              Thành tiền
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatPrice(item.order_item_subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ========================================== */}
              {/* PAYMENT */}
              {/* ========================================== */}

              <section>
                <h3 className="mb-3 font-bold text-slate-800">Thanh toán</h3>

                <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                  {/* Payment status */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Trạng thái</span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                        selectedOrder.order_order_payment_status_id,
                      )}`}
                    >
                      {paymentStatusMap[
                        selectedOrder.order_order_payment_status_id
                      ]}
                    </span>
                  </div>

                  {/* Payment action */}
                  {selectedOrder.order_order_payment_status_id === 1 &&
                    (selectedOrder.order_order_payment_method_id === 1 ? (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        Đơn hàng sẽ được thanh toán khi nhận hàng.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePayment(selectedOrder)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                      >
                        <CreditCard className="h-4 w-4" />
                        {selectedOrder.order_order_payment_method_id === 2
                          ? "Thanh toán qua MoMo"
                          : "Thanh toán qua VNPay"}
                      </button>
                    ))}

                  <div className="border-t border-slate-100 pt-3" />

                  {/* Subtotal */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Tạm tính</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(selectedOrder.order_subtotal)}
                    </span>
                  </div>

                  {/* Shipping fee */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Phí vận chuyển</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(selectedOrder.order_shipping_fee)}
                    </span>
                  </div>

                  {/* Direct promotion discount */}
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <span>Giảm giá trực tiếp</span>
                    </div>

                    <span className="font-medium text-emerald-600">
                      -{" "}
                      {formatPrice(
                        selectedOrder.order_item.reduce(
                          (sum, item) =>
                            sum +
                            Number(
                              item.order_item_direct_discount_amount ?? 0,
                            ),
                          0,
                        ),
                      )}
                    </span>
                  </div>

                  {/* Coupon information */}
                  {selectedOrder.order_coupon_id != null && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                      <div className="flex items-start gap-2">
                        <TicketPercent className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-violet-800">
                            Coupon đã áp dụng
                          </p>

                          <p className="mt-1 text-sm font-semibold text-violet-700">
                            {selectedOrder.order_coupon_name ||
                              `Coupon #${selectedOrder.order_coupon_id}`}
                          </p>

                          <p className="mt-1 text-xs text-violet-700">
                            Mã coupon: #{selectedOrder.order_coupon_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coupon discount */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <TicketPercent className="h-4 w-4 text-violet-600" />
                      <span>Giảm giá coupon</span>
                    </div>

                    <span className="font-medium text-emerald-600">
                      -{" "}
                      {formatPrice(
                        selectedOrder.order_coupon_discount_amount,
                      )}
                    </span>
                  </div>

                  {/* Total discount */}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
                    <span className="font-semibold text-slate-600">
                      Tổng giảm giá
                    </span>
                    <span className="font-bold text-emerald-600">
                      - {formatPrice(selectedOrder.order_discount_amount)}
                    </span>
                  </div>

                  {/* Total amount */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="font-bold text-slate-800">
                      Tổng cộng
                    </span>
                    <span className="text-xl font-bold text-rose-600">
                      {formatPrice(selectedOrder.order_total_amount)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal footer */}
            <footer className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Đóng
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
