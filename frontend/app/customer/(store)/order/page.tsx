"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";

type OrderItem = {
  order_item_id: string;
  order_item_order_id: string;
  order_item_sku: string;
  order_item_product_name: string;
  order_item_product_image: string | null;
  order_item_unit_price: string;
  order_item_quantity: number;
  order_item_subtotal: string;
};

type Order = {
  order_id: string;
  order_code: string;
  order_user_id: string;
  order_fulfillment_type: "HOME_DELIVERY" | "STORE_PICKUP";

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

  order_items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
          return;
        }

        const response = await fetch(
          `http://localhost:3007/api/v1/orders?userId=${userId}`,
        );

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách đơn hàng");
        }

        const data = await response.json();

        setOrders(data);
      } catch (error) {
        console.error("GET ORDERS ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#12313a]">
            Đơn hàng của tôi
          </h1>

          <p className="mt-1 text-sm text-[#70858b]">
            Theo dõi và xem thông tin các đơn hàng của bạn.
          </p>
        </div>

        {/* Empty */}
        {orders.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />

            <h2 className="text-lg font-semibold text-[#12313a]">
              Chưa có đơn hàng
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Bạn chưa có đơn hàng nào.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                {/* Order header */}
                <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-[#12313a]" />

                      <span className="font-bold text-[#12313a]">
                        {order.order_code}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />

                      {formatDate(order.order_created_at)}
                    </div>
                  </div>

                  <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {order.order_fulfillment_type === "HOME_DELIVERY"
                      ? "Giao hàng tận nơi"
                      : "Nhận tại cửa hàng"}
                  </span>
                </div>

                {/* Summary */}
                <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      {order.order_items.reduce(
                        (total, item) =>
                          total + Number(item.order_item_quantity),
                        0,
                      )}{" "}
                      sản phẩm
                    </p>
                  </div>

                  {/* Total */}
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Tổng tiền
                    </p>

                    <p className="mt-1 font-bold text-[#d70018]">
                      {formatPrice(order.order_total_amount)}
                    </p>
                  </div>
                </div>

                {/* Button */}
                <div className="flex justify-end border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-lg bg-[#12313a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d4651]"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12313a]">
                  Chi tiết đơn hàng
                </h2>

                <p className="mt-1 text-sm font-medium text-gray-600">
                  {selectedOrder.order_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-[#12313a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Order Info */}
              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Thông tin đơn hàng
                </h3>

                <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
                  {/* Order Code */}
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Mã đơn hàng
                    </p>

                    <p className="mt-1 font-semibold text-[#12313a]">
                      {selectedOrder.order_code}
                    </p>
                  </div>

                  {/* Created At */}
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Ngày đặt
                    </p>

                    <p className="mt-1 font-semibold text-[#12313a]">
                      {formatDate(selectedOrder.order_created_at)}
                    </p>
                  </div>

                  {/* Fulfillment */}
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Hình thức nhận hàng
                    </p>

                    <p className="mt-1 font-semibold text-[#12313a]">
                      {selectedOrder.order_fulfillment_type ===
                      "HOME_DELIVERY"
                        ? "Giao hàng tận nơi"
                        : "Nhận tại cửa hàng"}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Trạng thái
                    </p>

                    <span className="mt-1 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Đã đặt hàng
                    </span>
                  </div>
                </div>
              </section>

              {/* Recipient */}
              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Thông tin người nhận
                </h3>

                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                  {/* Name */}
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-[#12313a]" />

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
                    <Phone className="mt-0.5 h-5 w-5 text-[#12313a]" />

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
                    <MapPin className="mt-0.5 h-5 w-5 text-[#12313a]" />

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

              {/* Products */}
              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Sản phẩm
                </h3>

                {selectedOrder.order_items.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-sm font-medium text-gray-600">
                    Không có sản phẩm.
                  </div>
                ) : (
                  <div className="divide-y overflow-hidden rounded-xl border border-gray-200">
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex gap-4 p-4"
                      >
                        {/* Image */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
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

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#12313a]">
                            {item.order_item_product_name}
                          </p>

                          <p className="mt-1 text-xs font-medium text-gray-500">
                            SKU: {item.order_item_sku}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              x{item.order_item_quantity}
                            </span>

                            <span className="font-bold text-[#12313a]">
                              {formatPrice(item.order_item_subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Payment */}
              <section>
                <h3 className="mb-3 text-base font-bold text-[#12313a]">
                  Thanh toán
                </h3>

                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
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
          </div>
        </div>
      )}
    </div>
  );
}
