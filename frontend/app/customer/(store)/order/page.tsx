"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  X,
  Truck,
  Store,
  CreditCard,
  Clock,
  CheckCircle2,
  CircleX,
  Loader2,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

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

  order_created_at: string;
  order_updated_at: string;

  order_item: OrderItem[];
};

// ============================================================
// Master Data
// ============================================================

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
  1: "COD",
  2: "MoMo",
  3: "VNPay",
};

// ============================================================
// Helpers
// ============================================================

const formatPrice = (price: string | number) => {
  return `${Number(price).toLocaleString("vi-VN")} ₫`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getProcessingStatusClass = (statusId: number) => {
  switch (statusId) {
    case 1:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case 2:
      return "bg-blue-50 text-blue-700 border-blue-200";

    case 3:
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case 4:
      return "bg-purple-50 text-purple-700 border-purple-200";

    case 5:
      return "bg-orange-50 text-orange-700 border-orange-200";

    case 6:
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case 7:
      return "bg-green-50 text-green-700 border-green-200";

    case 8:
      return "bg-red-50 text-red-700 border-red-200";

    case 9:
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getPaymentStatusClass = (statusId: number) => {
  switch (statusId) {
    case 2:
      return "bg-green-50 text-green-700 border-green-200";

    case 3:
      return "bg-red-50 text-red-700 border-red-200";

    case 4:
      return "bg-purple-50 text-purple-700 border-purple-200";

    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
};

const getProcessingStatusIcon = (statusId: number) => {
  switch (statusId) {
    case 7:
      return <CheckCircle2 className="h-4 w-4" />;

    case 8:
    case 9:
      return <CircleX className="h-4 w-4" />;

    case 1:
    case 2:
      return <Clock className="h-4 w-4" />;

    default:
      return <Loader2 className="h-4 w-4" />;
  }
};

// ============================================================
// Page
// ============================================================

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // Fetch Orders
  // ============================================================

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const userId = sessionStorage.getItem("userId");

        if (!userId) {
          setError("Không tìm thấy thông tin người dùng.");
          return;
        }

        const response = await fetch(
          `http://localhost:3007/api/v1/order?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách đơn hàng");
        }

        const data: Order[] = await response.json();

        setOrders(data);
      } catch (error) {
        console.error("GET ORDERS ERROR:", error);
        setError("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#f5f7f8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#12313a]" />

          <p className="text-sm font-medium text-gray-500">
            Đang tải đơn hàng...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f5f7f8] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* ================================================== */}
        {/* Page Header */}
        {/* ================================================== */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#12313a]">
            Đơn hàng của tôi
          </h1>

          <p className="mt-1 text-sm text-[#70858b]">
            Theo dõi và xem thông tin các đơn hàng của bạn.
          </p>
        </div>

        {/* ================================================== */}
        {/* Error */}
        {/* ================================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* Empty */}
        {/* ================================================== */}

        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-20 text-center shadow-sm">
            <Package className="mx-auto mb-4 h-14 w-14 text-gray-300" />

            <h2 className="text-lg font-semibold text-[#12313a]">
              Chưa có đơn hàng
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Bạn chưa có đơn hàng nào.
            </p>
          </div>
        ) : (
          /* ================================================== */
          /* Orders */
          /* ================================================== */

          <div className="space-y-4">
            {orders.map((order) => {
              const totalQuantity = order.order_item.reduce(
                (total, item) => total + Number(item.order_item_quantity),
                0,
              );

              return (
                <div
                  key={order.order_id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {/* ================================================== */}
                  {/* Order Header */}
                  {/* ================================================== */}

                  <div className="border-b border-gray-100 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-[#12313a]" />

                          <span className="font-bold text-[#12313a]">
                            Đơn hàng #{order.order_code}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />

                          <span>
                            Đặt lúc {formatDate(order.order_created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Processing Status */}

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getProcessingStatusClass(
                            order.order_order_processing_status_id,
                          )}`}
                        >
                          {getProcessingStatusIcon(
                            order.order_order_processing_status_id,
                          )}

                          {
                            processingStatusMap[
                              order.order_order_processing_status_id
                            ]
                          }
                        </span>

                        {/* Delivery Method */}

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
                          {order.order_order_delivery_method_id === 1 ? (
                            <Truck className="h-4 w-4" />
                          ) : (
                            <Store className="h-4 w-4" />
                          )}

                          {
                            deliveryMethodMap[
                              order.order_order_delivery_method_id
                            ]
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ================================================== */}
                  {/* Order Summary */}
                  {/* ================================================== */}

                  <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Recipient */}

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Người nhận
                      </p>

                      <p className="mt-1 font-semibold text-[#12313a]">
                        {order.order_recipient_name}
                      </p>
                    </div>

                    {/* Phone */}

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Số điện thoại
                      </p>

                      <p className="mt-1 font-semibold text-[#12313a]">
                        {order.order_recipient_phone}
                      </p>
                    </div>

                    {/* Products */}

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Số sản phẩm
                      </p>

                      <p className="mt-1 font-semibold text-[#12313a]">
                        {totalQuantity} sản phẩm
                      </p>
                    </div>

                    {/* Total */}

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Tổng tiền
                      </p>

                      <p className="mt-1 text-lg font-bold text-[#d70018]">
                        {formatPrice(order.order_total_amount)}
                      </p>
                    </div>
                  </div>

                  {/* ================================================== */}
                  {/* Payment Summary */}
                  {/* ================================================== */}

                  <div className="mx-5 mb-5 flex flex-wrap gap-2 rounded-xl bg-[#f7f9fa] p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-[#12313a]" />

                      <span className="text-gray-500">
                        Thanh toán:
                      </span>

                      <span className="font-semibold text-[#12313a]">
                        {
                          paymentMethodMap[
                            order.order_order_payment_method_id
                          ]
                        }
                      </span>
                    </div>

                    <span className="text-gray-300">|</span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
                        order.order_order_payment_status_id,
                      )}`}
                    >
                      {
                        paymentStatusMap[
                          order.order_order_payment_status_id
                        ]
                      }
                    </span>
                  </div>

                  {/* ================================================== */}
                  {/* Footer */}
                  {/* ================================================== */}

                  <div className="flex justify-end border-t border-gray-100 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg bg-[#12313a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4651]"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* Detail Modal */}
      {/* ====================================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* ================================================== */}
            {/* Modal Header */}
            {/* ================================================== */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12313a]">
                  Chi tiết đơn hàng
                </h2>

                <p className="mt-1 text-sm font-medium text-gray-500">
                  #{selectedOrder.order_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#12313a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* ================================================== */}
              {/* Order Information */}
              {/* ================================================== */}

              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Thông tin đơn hàng
                </h3>

                <div className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
                  {/* Order Code */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Mã đơn hàng
                    </p>

                    <p className="mt-1 font-semibold text-[#12313a]">
                      #{selectedOrder.order_code}
                    </p>
                  </div>

                  {/* Created */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Ngày đặt
                    </p>

                    <p className="mt-1 font-semibold text-[#12313a]">
                      {formatDate(selectedOrder.order_created_at)}
                    </p>
                  </div>

                  {/* Processing Status */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Trạng thái đơn hàng
                    </p>

                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getProcessingStatusClass(
                        selectedOrder.order_order_processing_status_id,
                      )}`}
                    >
                      {getProcessingStatusIcon(
                        selectedOrder.order_order_processing_status_id,
                      )}

                      {
                        processingStatusMap[
                          selectedOrder.order_order_processing_status_id
                        ]
                      }
                    </span>
                  </div>

                  {/* Delivery */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Hình thức nhận hàng
                    </p>

                    <p className="mt-1 flex items-center gap-2 font-semibold text-[#12313a]">
                      {selectedOrder.order_order_delivery_method_id === 1 ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}

                      {
                        deliveryMethodMap[
                          selectedOrder.order_order_delivery_method_id
                        ]
                      }
                    </p>
                  </div>

                  {/* Payment Method */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Phương thức thanh toán
                    </p>

                    <p className="mt-1 flex items-center gap-2 font-semibold text-[#12313a]">
                      <CreditCard className="h-4 w-4" />

                      {
                        paymentMethodMap[
                          selectedOrder.order_order_payment_method_id
                        ]
                      }
                    </p>
                  </div>

                  {/* Payment Status */}

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Trạng thái thanh toán
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStatusClass(
                        selectedOrder.order_order_payment_status_id,
                      )}`}
                    >
                      {
                        paymentStatusMap[
                          selectedOrder.order_order_payment_status_id
                        ]
                      }
                    </span>
                  </div>
                </div>
              </section>

              {/* ================================================== */}
              {/* Recipient */}
              {/* ================================================== */}

              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Thông tin người nhận
                </h3>

                <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                  {/* Name */}

                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 shrink-0 text-[#12313a]" />

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Họ và tên
                      </p>

                      <p className="mt-1 font-semibold text-[#12313a]">
                        {selectedOrder.order_recipient_name}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}

                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#12313a]" />

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Số điện thoại
                      </p>

                      <p className="mt-1 font-semibold text-[#12313a]">
                        {selectedOrder.order_recipient_phone}
                      </p>
                    </div>
                  </div>

                  {/* Address */}

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#12313a]" />

                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Địa chỉ
                      </p>

                      <p className="mt-1 font-semibold leading-6 text-[#12313a]">
                        {selectedOrder.order_address_line},{" "}
                        {selectedOrder.order_ward},{" "}
                        {selectedOrder.order_province}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ================================================== */}
              {/* Products */}
              {/* ================================================== */}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#12313a]">
                    Sản phẩm
                  </h3>

                  <span className="text-sm font-medium text-gray-500">
                    {selectedOrder.order_item.reduce(
                      (total, item) =>
                        total + Number(item.order_item_quantity),
                      0,
                    )}{" "}
                    sản phẩm
                  </span>
                </div>

                {selectedOrder.order_item.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-sm font-medium text-gray-600">
                    Không có sản phẩm.
                  </div>
                ) : (
                  <div className="divide-y overflow-hidden rounded-xl border border-gray-200">
                    {selectedOrder.order_item.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex gap-4 p-4"
                      >
                        {/* Image */}

                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {item.order_item_product_image ? (
                            <img
                              src={`/product/phone/${item.order_item_product_image}`}
                              alt={item.order_item_product_name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Product */}

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#12313a]">
                            {item.order_item_product_name}
                          </p>

                          <p className="mt-1 text-xs font-medium text-gray-500">
                            SKU: {item.order_item_sku}
                          </p>

                          {/* Serial Number */}

                          {item.order_item_serial_number && (
                            <p className="mt-1 text-xs font-medium text-gray-500">
                              Serial:{" "}
                              <span className="font-semibold text-[#12313a]">
                                {item.order_item_serial_number}
                              </span>
                            </p>
                          )}

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-gray-500">
                                Đơn giá
                              </p>

                              <p className="text-sm font-semibold text-[#12313a]">
                                {formatPrice(item.order_item_unit_price)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">
                                Số lượng
                              </p>

                              <p className="text-sm font-semibold text-[#12313a]">
                                x{item.order_item_quantity}
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-xs text-gray-500">
                                Thành tiền
                              </p>

                              <p className="font-bold text-[#12313a]">
                                {formatPrice(item.order_item_subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ================================================== */}
              {/* Payment */}
              {/* ================================================== */}

              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Thanh toán
                </h3>

                <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                  {/* Payment Method */}

                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Phương thức
                    </span>

                    <span className="font-semibold text-[#12313a]">
                      {
                        paymentMethodMap[
                          selectedOrder.order_order_payment_method_id
                        ]
                      }
                    </span>
                  </div>

                  {/* Payment Status */}

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Trạng thái
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                        selectedOrder.order_order_payment_status_id,
                      )}`}
                    >
                      {
                        paymentStatusMap[
                          selectedOrder.order_order_payment_status_id
                        ]
                      }
                    </span>
                  </div>

                  {/* Subtotal */}

                  <div className="flex justify-between border-t border-gray-100 pt-3 text-sm">
                    <span className="font-medium text-gray-600">
                      Tạm tính
                    </span>

                    <span className="font-semibold text-[#12313a]">
                      {formatPrice(selectedOrder.order_subtotal)}
                    </span>
                  </div>

                  {/* Shipping */}

                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Phí vận chuyển
                    </span>

                    <span className="font-semibold text-[#12313a]">
                      {formatPrice(selectedOrder.order_shipping_fee)}
                    </span>
                  </div>

                  {/* Discount */}

                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Giảm giá
                    </span>

                    <span className="font-semibold text-green-600">
                      - {formatPrice(selectedOrder.order_discount_amount)}
                    </span>
                  </div>

                  {/* Total */}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#12313a]">
                        Tổng cộng
                      </span>

                      <span className="text-xl font-bold text-[#d70018]">
                        {formatPrice(selectedOrder.order_total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ================================================== */}
            {/* Modal Footer */}
            {/* ================================================== */}

            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-lg bg-[#12313a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4651]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}