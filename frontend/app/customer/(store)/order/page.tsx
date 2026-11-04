// "use client";

// import { useEffect, useState } from "react";
// import {
//   Package,
//   Calendar,
//   MapPin,
//   Phone,
//   User,
//   X,
//   Truck,
//   Store,
//   CreditCard,
//   Clock,
//   CheckCircle2,
//   CircleX,
//   Loader2,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { customerOrderService } from "@/lib/axios/services/customer-services/order_service";

// // ============================================================
// // Types
// // ============================================================

// type OrderItem = {
//   order_item_id: number;
//   order_item_order_id: number;
//   order_item_sku: string;
//   order_item_serial_number: string | null;
//   order_item_product_name: string;
//   order_item_product_image: string | null;
//   order_item_unit_price: string;
//   order_item_quantity: number;
//   order_item_subtotal: string;
// };

// type Order = {
//   order_id: number;
//   order_code: string;
//   order_user_id: number;

//   order_order_processing_status_id: number;
//   order_order_payment_status_id: number;
//   order_order_delivery_method_id: number;
//   order_order_payment_method_id: number;

//   order_recipient_name: string;
//   order_recipient_phone: string;

//   order_address_line: string;
//   order_ward: string;
//   order_province: string;

//   order_subtotal: string;
//   order_shipping_fee: string;
//   order_discount_amount: string;
//   order_total_amount: string;

//   order_created_at: string;
//   order_updated_at: string;

//   order_item: OrderItem[];
// };

// // ============================================================
// // Master Data
// // ============================================================

// const processingStatusMap: Record<number, string> = {
//   1: "Chờ xác nhận",
//   2: "Đã xác nhận",
//   3: "Đang xử lý",
//   4: "Sẵn sàng nhận hàng",
//   5: "Đang giao hàng",
//   6: "Đã giao hàng",
//   7: "Hoàn thành",
//   8: "Đã hủy",
//   9: "Thất bại",
// };

// const paymentStatusMap: Record<number, string> = {
//   1: "Chưa thanh toán",
//   2: "Đã thanh toán",
//   3: "Thanh toán thất bại",
//   4: "Đã hoàn tiền",
// };

// const deliveryMethodMap: Record<number, string> = {
//   1: "Giao hàng tận nơi",
//   2: "Nhận tại cửa hàng",
// };

// const paymentMethodMap: Record<number, string> = {
//   1: "COD",
//   2: "MoMo",
//   3: "VNPay",
// };

// // ============================================================
// // Helpers
// // ============================================================

// const formatPrice = (price: string | number) => {
//   return `${Number(price).toLocaleString("vi-VN")} ₫`;
// };

// const formatDate = (date: string) => {
//   return new Date(date).toLocaleString("vi-VN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const getProcessingStatusClass = (statusId: number) => {
//   switch (statusId) {
//     case 1:
//       return "bg-yellow-50 text-yellow-700 border-yellow-200";

//     case 2:
//       return "bg-blue-50 text-blue-700 border-blue-200";

//     case 3:
//       return "bg-indigo-50 text-indigo-700 border-indigo-200";

//     case 4:
//       return "bg-purple-50 text-purple-700 border-purple-200";

//     case 5:
//       return "bg-orange-50 text-orange-700 border-orange-200";

//     case 6:
//       return "bg-cyan-50 text-cyan-700 border-cyan-200";

//     case 7:
//       return "bg-green-50 text-green-700 border-green-200";

//     case 8:
//       return "bg-red-50 text-red-700 border-red-200";

//     case 9:
//       return "bg-red-50 text-red-700 border-red-200";

//     default:
//       return "bg-gray-50 text-gray-700 border-gray-200";
//   }
// };

// const getPaymentStatusClass = (statusId: number) => {
//   switch (statusId) {
//     case 2:
//       return "bg-green-50 text-green-700 border-green-200";

//     case 3:
//       return "bg-red-50 text-red-700 border-red-200";

//     case 4:
//       return "bg-purple-50 text-purple-700 border-purple-200";

//     default:
//       return "bg-yellow-50 text-yellow-700 border-yellow-200";
//   }
// };

// const getProcessingStatusIcon = (statusId: number) => {
//   switch (statusId) {
//     case 7:
//       return <CheckCircle2 className="h-4 w-4" />;

//     case 8:
//     case 9:
//       return <CircleX className="h-4 w-4" />;

//     case 1:
//     case 2:
//       return <Clock className="h-4 w-4" />;

//     default:
//       return <Loader2 className="h-4 w-4" />;
//   }
// };

//   // ============================================================
//   // Payment
//   // ============================================================

//   const handlePayment = async (order: Order) => {
//     try {
//       // COD
//       if (order.order_order_payment_method_id === 1) {
//         alert("Đơn hàng này sẽ được thanh toán khi nhận hàng.");
//         return;
//       }

//       const response = await fetch(
//         `http://localhost:3009/api/v1/payment`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             order_id: order.order_id,
//             payment_method_id: order.order_order_payment_method_id,
//           }),
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data?.message || "Không thể thực hiện thanh toán.",
//         );
//       }

//       // MoMo / VNPay trả về URL thanh toán
//       if (data.payUrl) {
//         window.location.href = data.payUrl;
//         return;
//       }

//       alert("Không nhận được đường dẫn thanh toán.");
//     } catch (error) {
//       console.error("PAYMENT ERROR:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Không thể thực hiện thanh toán.",
//       );
//     }
//   };


// // ============================================================
// // Page
// // ============================================================

// export default function OrdersPage() {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const router = useRouter();

//   // ============================================================
//   // (CHECK) USER-LOGIN
//   // ============================================================
//   useEffect(() => {
//     const userId = sessionStorage.getItem("userId");

//     if (!userId) {
//       router.replace("/customer/login");
//     }
//   }, [router]);

//   // ============================================================
//   // 1. (GET) ORDER-LIST
//   // ============================================================
//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const userId = sessionStorage.getItem("userId");

//         if (!userId) {
//           setError("Không tìm thấy thông tin người dùng.");
//           return;
//         }

//         const data: Order[] = await customerOrderService.getOrderList();

//         setOrders(data);
//       } catch (error) {
//         console.error("GET ORDERS ERROR:", error);
//         setError("Không thể tải danh sách đơn hàng.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, []);

//   // ============================================================
//   // 2. (PATCH) CANCEL-ORDER
//   // ============================================================

//   const handleCancelOrder = async (order: Order) => {
//     const confirmed = window.confirm(
//       `Bạn có chắc muốn hủy đơn hàng #${order.order_code}?`,
//     );

//     if (!confirmed) return;

//     try {
//       const response = await customerOrderService.cancelOrder(
//         order.order_id,
//       );

//       // Cập nhật trạng thái đơn hàng trên UI
//       setOrders((prevOrders) =>
//         prevOrders.map((item) =>
//           item.order_id === order.order_id
//             ? {
//                 ...item,
//                 order_order_processing_status_id: 8,
//               }
//             : item,
//         ),
//       );

//       // Nếu modal đang mở thì cập nhật luôn
//       setSelectedOrder((prev) =>
//         prev && prev.order_id === order.order_id
//           ? {
//               ...prev,
//               order_order_processing_status_id: 8,
//             }
//           : prev,
//       );

//       alert(response?.message || "Hủy đơn hàng thành công.");
//     } catch (error) {
//       console.error("CANCEL ORDER ERROR:", error);

//       alert(
//         error instanceof Error
//           ? error.message
//           : "Không thể hủy đơn hàng.",
//       );
//     }
//   };

//   // ============================================================
//   // Loading
//   // ============================================================

//   if (loading) {
//     return (
//       <div className="flex min-h-[500px] items-center justify-center bg-[#f5f7f8]">
//         <div className="flex flex-col items-center gap-3">
//           <Loader2 className="h-8 w-8 animate-spin text-[#12313a]" />

//           <p className="text-sm font-medium text-gray-500">
//             Đang tải đơn hàng...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // ============================================================
//   // Render
//   // ============================================================

//   return (
//     <div className="min-h-screen bg-[#f5f7f8] px-4 py-8">
//       <div className="mx-auto max-w-6xl">
//         {/* ================================================== */}
//         {/* Page Header */}
//         {/* ================================================== */}

//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-[#12313a]">
//             Đơn hàng của tôi
//           </h1>

//           <p className="mt-1 text-sm text-[#70858b]">
//             Theo dõi và xem thông tin các đơn hàng của bạn.
//           </p>
//         </div>

//         {/* ================================================== */}
//         {/* Error */}
//         {/* ================================================== */}

//         {error && (
//           <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//             {error}
//           </div>
//         )}

//         {/* ================================================== */}
//         {/* Empty */}
//         {/* ================================================== */}

//         {orders.length === 0 ? (
//           <div className="rounded-2xl bg-white px-6 py-20 text-center shadow-sm">
//             <Package className="mx-auto mb-4 h-14 w-14 text-gray-300" />

//             <h2 className="text-lg font-semibold text-[#12313a]">
//               Chưa có đơn hàng
//             </h2>

//             <p className="mt-2 text-sm text-gray-500">
//               Bạn chưa có đơn hàng nào.
//             </p>
//           </div>
//         ) : (
//           /* ================================================== */
//           /* Orders */
//           /* ================================================== */

//           <div className="space-y-4">
//             {orders.map((order) => {
//               const totalQuantity = order.order_item.reduce(
//                 (total, item) => total + Number(item.order_item_quantity),
//                 0,
//               );

//               return (
//                 <div
//                   key={order.order_id}
//                   className="overflow-hidden rounded-2xl bg-white shadow-sm"
//                 >
//                   {/* ================================================== */}
//                   {/* Order Header */}
//                   {/* ================================================== */}

//                   <div className="border-b border-gray-100 px-5 py-4">
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <Package className="h-5 w-5 text-[#12313a]" />

//                           <span className="font-bold text-[#12313a]">
//                             Đơn hàng #{order.order_code}
//                           </span>
//                         </div>

//                         <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
//                           <Calendar className="h-4 w-4" />

//                           <span>
//                             Đặt lúc {formatDate(order.order_created_at)}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="flex flex-wrap gap-2">
//                         {/* Processing Status */}

//                         <span
//                           className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getProcessingStatusClass(
//                             order.order_order_processing_status_id,
//                           )}`}
//                         >
//                           {getProcessingStatusIcon(
//                             order.order_order_processing_status_id,
//                           )}

//                           {
//                             processingStatusMap[
//                               order.order_order_processing_status_id
//                             ]
//                           }
//                         </span>

//                         {/* Delivery Method */}

//                         <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
//                           {order.order_order_delivery_method_id === 1 ? (
//                             <Truck className="h-4 w-4" />
//                           ) : (
//                             <Store className="h-4 w-4" />
//                           )}

//                           {
//                             deliveryMethodMap[
//                               order.order_order_delivery_method_id
//                             ]
//                           }
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* ================================================== */}
//                   {/* Order Summary */}
//                   {/* ================================================== */}

//                   <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
//                     {/* Recipient */}

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Người nhận
//                       </p>

//                       <p className="mt-1 font-semibold text-[#12313a]">
//                         {order.order_recipient_name}
//                       </p>
//                     </div>

//                     {/* Phone */}

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Số điện thoại
//                       </p>

//                       <p className="mt-1 font-semibold text-[#12313a]">
//                         {order.order_recipient_phone}
//                       </p>
//                     </div>

//                     {/* Products */}

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Số sản phẩm
//                       </p>

//                       <p className="mt-1 font-semibold text-[#12313a]">
//                         {totalQuantity} sản phẩm
//                       </p>
//                     </div>

//                     {/* Total */}

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Tổng tiền
//                       </p>

//                       <p className="mt-1 text-lg font-bold text-[#d70018]">
//                         {formatPrice(order.order_total_amount)}
//                       </p>
//                     </div>
//                   </div>

//                   {/* ================================================== */}
//                   {/* Payment Summary */}
//                   {/* ================================================== */}

//                   <div className="mx-5 mb-5 flex flex-wrap gap-2 rounded-xl bg-[#f7f9fa] p-3">
//                     <div className="flex items-center gap-2 text-sm">
//                       <CreditCard className="h-4 w-4 text-[#12313a]" />

//                       <span className="text-gray-500">
//                         Thanh toán:
//                       </span>

//                       <span className="font-semibold text-[#12313a]">
//                         {
//                           paymentMethodMap[
//                             order.order_order_payment_method_id
//                           ]
//                         }
//                       </span>
//                     </div>

//                     <span className="text-gray-300">|</span>

//                     <span
//                       className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
//                         order.order_order_payment_status_id,
//                       )}`}
//                     >
//                       {
//                         paymentStatusMap[
//                           order.order_order_payment_status_id
//                         ]
//                       }
//                     </span>
//                   </div>

//                   {/* ================================================== */}
//                   {/* Footer */}
//                   {/* ================================================== */}

//                   {/* <div className="flex justify-end border-t border-gray-100 px-5 py-4">
//                     <button
//                       type="button"
//                       onClick={() => setSelectedOrder(order)}
//                       className="rounded-lg bg-[#12313a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4651]"
//                     >
//                       Xem chi tiết
//                     </button>
//                   </div> */}
//                   <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
//                     {/* Hủy đơn - chỉ khi Chờ xác nhận */}
//                     {order.order_order_processing_status_id === 1 && order.order_order_payment_status_id === 1 && (
//                       <button
//                         type="button"
//                         onClick={() => handleCancelOrder(order)}
//                         className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
//                       >
//                         Hủy đơn
//                       </button>
//                     )}

//                     {/* Xem chi tiết */}
//                     <button
//                       type="button"
//                       onClick={() => setSelectedOrder(order)}
//                       className="rounded-lg bg-[#12313a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4651]"
//                     >
//                       Xem chi tiết
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ====================================================== */}
//       {/* Detail Modal */}
//       {/* ====================================================== */}

//       {selectedOrder && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
//           onClick={() => setSelectedOrder(null)}
//         >
//           <div
//             className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
//             onClick={(event) => event.stopPropagation()}
//           >
//             {/* ================================================== */}
//             {/* Modal Header */}
//             {/* ================================================== */}

//             <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
//               <div>
//                 <h2 className="text-lg font-bold text-[#12313a]">
//                   Chi tiết đơn hàng
//                 </h2>

//                 <p className="mt-1 text-sm font-medium text-gray-500">
//                   #{selectedOrder.order_code}
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() => setSelectedOrder(null)}
//                 className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#12313a]"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             <div className="space-y-6 p-6">
//               {/* ================================================== */}
//               {/* Order Information */}
//               {/* ================================================== */}

//               <section>
//                 <h3 className="mb-3 text-base font-bold text-[#12313a]">
//                   Thông tin đơn hàng
//                 </h3>

//                 <div className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
//                   {/* Order Code */}

//                   <div>
//                     <p className="text-xs font-medium text-gray-500">
//                       Mã đơn hàng
//                     </p>

//                     <p className="mt-1 font-semibold text-[#12313a]">
//                       #{selectedOrder.order_code}
//                     </p>
//                   </div>

//                   {/* Created */}

//                   <div>
//                     <p className="text-xs font-medium text-gray-500">
//                       Ngày đặt
//                     </p>

//                     <p className="mt-1 font-semibold text-[#12313a]">
//                       {formatDate(selectedOrder.order_created_at)}
//                     </p>
//                   </div>

//                   {/* Processing Status */}

//                   <div>
//                     <p className="text-xs font-medium text-gray-500">
//                       Trạng thái đơn hàng
//                     </p>

//                     <span
//                       className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getProcessingStatusClass(
//                         selectedOrder.order_order_processing_status_id,
//                       )}`}
//                     >
//                       {getProcessingStatusIcon(
//                         selectedOrder.order_order_processing_status_id,
//                       )}

//                       {
//                         processingStatusMap[
//                           selectedOrder.order_order_processing_status_id
//                         ]
//                       }
//                     </span>
//                   </div>

//                   {/* Delivery */}

//                   <div>
//                     <p className="text-xs font-medium text-gray-500">
//                       Hình thức nhận hàng
//                     </p>

//                     <p className="mt-1 flex items-center gap-2 font-semibold text-[#12313a]">
//                       {selectedOrder.order_order_delivery_method_id === 1 ? (
//                         <Truck className="h-4 w-4" />
//                       ) : (
//                         <Store className="h-4 w-4" />
//                       )}

//                       {
//                         deliveryMethodMap[
//                           selectedOrder.order_order_delivery_method_id
//                         ]
//                       }
//                     </p>
//                   </div>

//                   {/* Payment Method */}

//                   <div>
//                     <p className="text-xs font-medium text-gray-500">
//                       Phương thức thanh toán
//                     </p>

//                     <p className="mt-1 flex items-center gap-2 font-semibold text-[#12313a]">
//                       <CreditCard className="h-4 w-4" />

//                       {
//                         paymentMethodMap[
//                           selectedOrder.order_order_payment_method_id
//                         ]
//                       }
//                     </p>
//                   </div>

//                   {/* Payment Status */}

//                   <div>
//                     <p className="text-xs font-medium text-gray-500">
//                       Trạng thái thanh toán
//                     </p>

//                     <span
//                       className={`mt-1 inline-block rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStatusClass(
//                         selectedOrder.order_order_payment_status_id,
//                       )}`}
//                     >
//                       {
//                         paymentStatusMap[
//                           selectedOrder.order_order_payment_status_id
//                         ]
//                       }
//                     </span>
//                   </div>
//                 </div>
//               </section>

//               {/* ================================================== */}
//               {/* Recipient */}
//               {/* ================================================== */}

//               <section>
//                 <h3 className="mb-3 text-base font-bold text-[#12313a]">
//                   Thông tin người nhận
//                 </h3>

//                 <div className="space-y-4 rounded-xl border border-gray-200 p-4">
//                   {/* Name */}

//                   <div className="flex items-start gap-3">
//                     <User className="mt-0.5 h-5 w-5 shrink-0 text-[#12313a]" />

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Họ và tên
//                       </p>

//                       <p className="mt-1 font-semibold text-[#12313a]">
//                         {selectedOrder.order_recipient_name}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Phone */}

//                   <div className="flex items-start gap-3">
//                     <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#12313a]" />

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Số điện thoại
//                       </p>

//                       <p className="mt-1 font-semibold text-[#12313a]">
//                         {selectedOrder.order_recipient_phone}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Address */}

//                   <div className="flex items-start gap-3">
//                     <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#12313a]" />

//                     <div>
//                       <p className="text-xs font-medium text-gray-500">
//                         Địa chỉ
//                       </p>

//                       <p className="mt-1 font-semibold leading-6 text-[#12313a]">
//                         {selectedOrder.order_address_line},{" "}
//                         {selectedOrder.order_ward},{" "}
//                         {selectedOrder.order_province}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </section>

//               {/* ================================================== */}
//               {/* Products */}
//               {/* ================================================== */}

//               <section>
//                 <div className="mb-3 flex items-center justify-between">
//                   <h3 className="text-base font-bold text-[#12313a]">
//                     Sản phẩm
//                   </h3>

//                   <span className="text-sm font-medium text-gray-500">
//                     {selectedOrder.order_item.reduce(
//                       (total, item) =>
//                         total + Number(item.order_item_quantity),
//                       0,
//                     )}{" "}
//                     sản phẩm
//                   </span>
//                 </div>

//                 {selectedOrder.order_item.length === 0 ? (
//                   <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-sm font-medium text-gray-600">
//                     Không có sản phẩm.
//                   </div>
//                 ) : (
//                   <div className="divide-y overflow-hidden rounded-xl border border-gray-200">
//                     {selectedOrder.order_item.map((item) => (
//                       <div
//                         key={item.order_item_id}
//                         className="flex gap-4 p-4"
//                       >
//                         {/* Image */}

//                         <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
//                           {item.order_item_product_image ? (
//                             <img
//                               src={`/product/phone/${item.order_item_product_image}`}
//                               alt={item.order_item_product_name}
//                               className="h-full w-full object-contain"
//                             />
//                           ) : (
//                             <div className="flex h-full items-center justify-center">
//                               <Package className="h-8 w-8 text-gray-300" />
//                             </div>
//                           )}
//                         </div>

//                         {/* Product */}

//                         <div className="min-w-0 flex-1">
//                           <p className="font-semibold text-[#12313a]">
//                             {item.order_item_product_name}
//                           </p>

//                           <p className="mt-1 text-xs font-medium text-gray-500">
//                             SKU: {item.order_item_sku}
//                           </p>

//                           {/* Serial Number */}

//                           {item.order_item_serial_number && (
//                             <p className="mt-1 text-xs font-medium text-gray-500">
//                               Serial:{" "}
//                               <span className="font-semibold text-[#12313a]">
//                                 {item.order_item_serial_number}
//                               </span>
//                             </p>
//                           )}

//                           <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//                             <div>
//                               <p className="text-xs text-gray-500">
//                                 Đơn giá
//                               </p>

//                               <p className="text-sm font-semibold text-[#12313a]">
//                                 {formatPrice(item.order_item_unit_price)}
//                               </p>
//                             </div>

//                             <div>
//                               <p className="text-xs text-gray-500">
//                                 Số lượng
//                               </p>

//                               <p className="text-sm font-semibold text-[#12313a]">
//                                 x{item.order_item_quantity}
//                               </p>
//                             </div>

//                             <div className="sm:text-right">
//                               <p className="text-xs text-gray-500">
//                                 Thành tiền
//                               </p>

//                               <p className="font-bold text-[#12313a]">
//                                 {formatPrice(item.order_item_subtotal)}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </section>

//               {/* ================================================== */}
//               {/* Payment */}
//               {/* ================================================== */}

//               <section>
//                 <h3 className="mb-3 text-base font-bold text-[#12313a]">
//                   Thanh toán
//                 </h3>

//                 <div className="space-y-3 rounded-xl border border-gray-200 p-4">
//                   {/* Payment Method */}

//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium text-gray-600">
//                       Phương thức
//                     </span>

//                     <span className="font-semibold text-[#12313a]">
//                       {
//                         paymentMethodMap[
//                           selectedOrder.order_order_payment_method_id
//                         ]
//                       }
//                     </span>
//                   </div>

//                   {/* Payment Status */}

//                   <div className="flex items-center justify-between text-sm">
//                     <span className="font-medium text-gray-600">
//                       Trạng thái
//                     </span>

//                     <span
//                       className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
//                         selectedOrder.order_order_payment_status_id,
//                       )}`}
//                     >
//                       {
//                         paymentStatusMap[
//                           selectedOrder.order_order_payment_status_id
//                         ]
//                       }
//                     </span>
//                   </div>

//                   {/* Payment Button */}

//                   {selectedOrder.order_order_payment_status_id === 1 && (
//                     <div className="border-t border-gray-100 pt-4">
//                       {selectedOrder.order_order_payment_method_id === 1 ? (
//                         <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
//                           <p className="text-sm font-semibold text-blue-700">
//                             Thanh toán khi nhận hàng
//                           </p>

//                           <p className="mt-1 text-xs text-blue-600">
//                             Bạn sẽ thanh toán cho nhân viên giao hàng khi nhận
//                             được sản phẩm.
//                           </p>
//                         </div>
//                       ) : (
//                         <button
//                           type="button"
//                           onClick={() => handlePayment(selectedOrder)}
//                           className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#12313a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4651]"
//                         >
//                           <CreditCard className="h-4 w-4" />

//                           {selectedOrder.order_order_payment_method_id === 2
//                             ? "Thanh toán qua MoMo"
//                             : "Thanh toán qua VNPay"}
//                         </button>
//                       )}
//                     </div>
//                   )}

//                   {/* Subtotal */}

//                   <div className="flex justify-between border-t border-gray-100 pt-3 text-sm">
//                     <span className="font-medium text-gray-600">
//                       Tạm tính
//                     </span>

//                     <span className="font-semibold text-[#12313a]">
//                       {formatPrice(selectedOrder.order_subtotal)}
//                     </span>
//                   </div>

//                   {/* Shipping */}

//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium text-gray-600">
//                       Phí vận chuyển
//                     </span>

//                     <span className="font-semibold text-[#12313a]">
//                       {formatPrice(selectedOrder.order_shipping_fee)}
//                     </span>
//                   </div>

//                   {/* Discount */}

//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium text-gray-600">
//                       Giảm giá
//                     </span>

//                     <span className="font-semibold text-green-600">
//                       - {formatPrice(selectedOrder.order_discount_amount)}
//                     </span>
//                   </div>

//                   {/* Total */}

//                   <div className="border-t border-gray-200 pt-4">
//                     <div className="flex items-center justify-between">
//                       <span className="text-base font-bold text-[#12313a]">
//                         Tổng cộng
//                       </span>

//                       <span className="text-xl font-bold text-[#d70018]">
//                         {formatPrice(selectedOrder.order_total_amount)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </section>
//             </div>

//             {/* ================================================== */}
//             {/* Modal Footer */}
//             {/* ================================================== */}

//             <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
//               <button
//                 type="button"
//                 onClick={() => setSelectedOrder(null)}
//                 className="w-full rounded-lg bg-[#12313a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4651]"
//               >
//                 Đóng
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { customerOrderService } from "@/lib/axios/services/customer-services/order_service";

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

const formatPrice = (price: string | number) =>
  `${Number(price).toLocaleString("vi-VN")} ₫`;

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

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("userId")) {
      router.replace("/customer/login");
    }
  }, [router]);

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

  const handlePayment = async (order: Order) => {
    try {
      if (order.order_order_payment_method_id === 1) {
        setActionError("Đơn hàng này sẽ được thanh toán khi nhận hàng.");
        return;
      }

      const response = await fetch("http://localhost:3009/api/v1/payment", {
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

      {/* Cancel confirmation modal */}
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
                <p className="text-xs font-medium text-slate-500">Mã đơn hàng</p>
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

      {/* Order detail modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
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
              {/* Order information */}
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
                      ]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Hình thức nhận hàng</p>
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

              {/* Recipient */}
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

              {/* Products */}
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
                            <p className="text-xs text-slate-500">Thành tiền</p>
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

              {/* Payment */}
              <section>
                <h3 className="mb-3 font-bold text-slate-800">Thanh toán</h3>
                <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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

                  {selectedOrder.order_order_payment_status_id === 1 && (
                    selectedOrder.order_order_payment_method_id === 1 ? (
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
                    )
                  )}

                  <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">Tạm tính</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(selectedOrder.order_subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Phí vận chuyển</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(selectedOrder.order_shipping_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Giảm giá</span>
                    <span className="font-medium text-emerald-600">
                      - {formatPrice(selectedOrder.order_discount_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="font-bold text-slate-800">Tổng cộng</span>
                    <span className="text-xl font-bold text-rose-600">
                      {formatPrice(selectedOrder.order_total_amount)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

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