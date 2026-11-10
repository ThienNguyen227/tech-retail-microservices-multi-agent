"use client";

import { useCallback, useEffect, useState, type ReactNode, type FormEvent } from "react";
import {
  Search,
  ShoppingBag,
  Clock3,
  Truck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  LoaderCircle,
  X,
  CalendarDays,
  Package,
  Hash,
  UserRound,
  ImageIcon,
  Phone,
  MapPin,
  CreditCard,
  WalletCards,
  AlertCircle,
  Tag,
  ReceiptText,
  Store,
  ClipboardList,
  Pencil,
  Save,
  CircleAlert,
  FilePenLine,
} from "lucide-react";

import axios from "axios";
import { adminOrderService } from "@/lib/axios/services/admin-services/order_service";

// ======================================================
// INTERFACES
// ======================================================

type DecimalValue = string | number | null;

interface OrderProcessingStatus {
  order_processing_status_id: number;
  order_processing_status_code: string;
  order_processing_status_name: string;
}

interface OrderPaymentStatus {
  order_payment_status_id: number;
  order_payment_status_code: string;
  order_payment_status_name: string;
}

interface OrderDeliveryMethod {
  delivery_method_id: number;
  delivery_method_code: string;
  delivery_method_name: string;
}

interface OrderPaymentMethod {
  payment_method_id: number;
  payment_method_code: string;
  payment_method_name: string;
  payment_method_status: boolean;
}

interface OrderItem {
  order_item_id: number;
  order_item_order_id: number;
  order_item_sku: string;
  order_item_serial_number: string | null;
  order_item_product_name: string;
  order_item_product_image: string;
  order_item_unit_price: DecimalValue;
  order_item_quantity: number;
  order_item_subtotal: DecimalValue;

  order_item_promotion_id: number | null;
  order_item_promotion_name: string | null;
  order_item_direct_discount_amount: DecimalValue;
}

interface Order {
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

  order_subtotal: DecimalValue;
  order_shipping_fee: DecimalValue;

  order_coupon_id: number | null;
  order_coupon_name: string | null;
  order_coupon_discount_amount: DecimalValue;

  order_discount_amount: DecimalValue;
  order_total_amount: DecimalValue;

  order_created_at: string;
  order_updated_at: string;

  order_processing_status: OrderProcessingStatus;
  order_payment_status: OrderPaymentStatus;
  order_delivery_method: OrderDeliveryMethod;
  order_payment_method: OrderPaymentMethod;

  order_item: OrderItem[];
}

interface OrderListResponse {
  success?: boolean;
  message?: string;
  total?: number;
  data?: Order[];
}

interface EditOrderForm {
  order_recipient_name: string;
  order_recipient_phone: string;
  order_address_line: string;
  order_ward: string;
  order_province: string;
  order_order_delivery_method_id: string;
  order_order_payment_method_id: string;
  order_coupon_id: string;
  order_coupon_name: string;
  order_coupon_discount_amount: string;
  order_subtotal: string;
  order_shipping_fee: string;
  order_discount_amount: string;
  order_total_amount: string;
}

const PAGE_SIZE = 8;

// ======================================================
// PROCESSING STATUS OPTIONS
// ======================================================

const PROCESSING_STATUS_OPTIONS = [
  {
    code: "PENDING",
    label: "Chờ xác nhận",
  },
  {
    code: "CONFIRMED",
    label: "Đã xác nhận",
  },
  {
    code: "PROCESSING",
    label: "Đang xử lý",
  },
  {
    code: "READY_FOR_PICKUP",
    label: "Sẵn sàng nhận hàng",
  },
  {
    code: "SHIPPING",
    label: "Đang giao hàng",
  },
  {
    code: "DELIVERED",
    label: "Đã giao hàng",
  },
  {
    code: "COMPLETED",
    label: "Hoàn thành",
  },
  {
    code: "CANCELLED",
    label: "Đã hủy",
  },
  {
    code: "FAILED",
    label: "Thất bại",
  },
] as const;

// ======================================================
// HELPERS
// ======================================================

// Chuẩn hóa dữ liệu trả về từ API

function normalizeOrderData(response: unknown): {
  orders: Order[];
  total: number;
} {
  if (Array.isArray(response)) {
    return {
      orders: response as Order[],
      total: response.length,
    };
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    const result = response as OrderListResponse;

    if (Array.isArray(result.data)) {
      return {
        orders: result.data,
        total:
          typeof result.total === "number"
            ? result.total
            : result.data.length,
      };
    }
  }

  return {
    orders: [],
    total: 0,
  };
}

// Định dạng tiền tệ

function formatCurrency(value?: DecimalValue) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `${amount.toLocaleString("vi-VN")} ₫`;
}

// Định dạng ngày giờ

function formatDateTime(date?: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ======================================================
// ORDER PROCESSING STATUS
// ======================================================

function getOrderStatusStyle(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "CONFIRMED":
      return "bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "bg-violet-50 text-violet-700";

    case "READY_FOR_PICKUP":
      return "bg-indigo-50 text-indigo-700";

    case "SHIPPING":
      return "bg-cyan-50 text-cyan-700";

    case "DELIVERED":
      return "bg-teal-50 text-teal-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-rose-50 text-rose-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getOrderStatusDot(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500";

    case "CONFIRMED":
      return "bg-blue-500";

    case "PROCESSING":
      return "bg-violet-500";

    case "READY_FOR_PICKUP":
      return "bg-indigo-500";

    case "SHIPPING":
      return "bg-cyan-500";

    case "DELIVERED":
      return "bg-teal-500";

    case "COMPLETED":
      return "bg-emerald-500";

    case "CANCELLED":
    case "FAILED":
      return "bg-rose-500";

    default:
      return "bg-slate-400";
  }
}

function getOrderStatusLabel(status: string, name?: string) {
  if (name) return name;

  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";

    case "CONFIRMED":
      return "Đã xác nhận";

    case "PROCESSING":
      return "Đang xử lý";

    case "READY_FOR_PICKUP":
      return "Sẵn sàng nhận hàng";

    case "SHIPPING":
      return "Đang giao hàng";

    case "DELIVERED":
      return "Đã giao hàng";

    case "COMPLETED":
      return "Hoàn thành";

    case "CANCELLED":
      return "Đã hủy";

    case "FAILED":
      return "Thất bại";

    default:
      return status || "Không xác định";
  }
}

// ======================================================
// ORDER PAYMENT STATUS
// ======================================================

function getPaymentStatusStyle(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "PAID":
      return "bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "bg-rose-50 text-rose-700";

    case "REFUNDED":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getPaymentStatusLabel(status: string, name?: string) {
  if (name) return name;

  switch (status) {
    case "PENDING":
      return "Chưa thanh toán";

    case "PAID":
      return "Đã thanh toán";

    case "FAILED":
      return "Thanh toán thất bại";

    case "REFUNDED":
      return "Đã hoàn tiền";

    default:
      return status || "Không xác định";
  }
}

// ======================================================
// DELIVERY METHOD
// ======================================================

function getDeliveryMethodLabel(method: string, name?: string) {
  if (name) return name;

  switch (method) {
    case "HOME_DELIVERY":
      return "Giao hàng tận nơi";

    case "STORE_PICKUP":
      return "Nhận tại cửa hàng";

    default:
      return method || "Không xác định";
  }
}

// ======================================================
// PAYMENT METHOD
// ======================================================

function getPaymentMethodLabel(method: string, name?: string) {
  if (name) return name;

  switch (method) {
    case "COD":
      return "Thanh toán khi nhận hàng";

    case "MOMO":
      return "Thanh toán qua MOMO";

    case "VNPAY":
      return "Thanh toán qua VNPAY";

    default:
      return method || "Không xác định";
  }
}

// ======================================================
// ERROR HANDLER
// ======================================================

function extractErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

// ======================================================
// ADDRESS HELPER
// ======================================================

function getFullAddress(order: Order) {
  return [
    order.order_address_line,
    order.order_ward,
    order.order_province,
  ]
    .filter(Boolean)
    .join(", ");
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function ManageOrderPage() {

  // ======================================================
  // DATA
  // ======================================================

  const [orders, setOrders] = useState<Order[]>([]);

  const [statsOrders, setStatsOrders] = useState<Order[]>([]);

  // ======================================================
  // SEARCH AND FILTER
  // ======================================================

  const [keyword, setKeyword] = useState("");

  const [processingStatusFilter, setProcessingStatusFilter] =
    useState("ALL");

  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  // ======================================================
  // SELECTED ORDER
  // ======================================================

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    null,
  );

  // ======================================================
  // UPDATE PROCESSING STATUS MODAL
  // ======================================================

  const [showUpdateStatusModal, setShowUpdateStatusModal] =
    useState(false);

  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(
    null,
  );

  const [selectedProcessingStatus, setSelectedProcessingStatus] =
    useState("");

  const [statusFormError, setStatusFormError] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);

  // ======================================================
  // EDIT ORDER INFORMATION MODAL
  // ======================================================

  const [showEditOrderModal, setShowEditOrderModal] = useState(false);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [editOrderForm, setEditOrderForm] = useState<EditOrderForm>({
    order_recipient_name: "",
    order_recipient_phone: "",
    order_address_line: "",
    order_ward: "",
    order_province: "",
    order_order_delivery_method_id: "1",
    order_order_payment_method_id: "1",
    order_coupon_id: "",
    order_coupon_name: "",
    order_coupon_discount_amount: "",
    order_subtotal: "",
    order_shipping_fee: "",
    order_discount_amount: "",
    order_total_amount: "",
  });

  const [editOrderError, setEditOrderError] = useState("");

  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // ======================================================
  // SUCCESS TOAST
  // ======================================================

  const [successMessage, setSuccessMessage] = useState("");

  // ======================================================
  // LOADING AND ERROR
  // ======================================================

  const [loading, setLoading] = useState(true);

  const [statsLoading, setStatsLoading] = useState(true);

  const [error, setError] = useState("");

  const [statsError, setStatsError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // ======================================================
  // SUCCESS TOAST TIMER
  // ======================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // ======================================================
  // LOAD STATISTICS
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    async function loadStatistics() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const response = await adminOrderService.getOrderList();

        const result = normalizeOrderData(response);

        if (!cancelled) {
          setStatsOrders(result.orders);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setStatsError(
            extractErrorMessage(
              err,
              "Không thể tải dữ liệu thống kê đơn hàng.",
            ),
          );

          console.error("Get order statistics error:", err);
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // ======================================================
  // SEARCH AND FILTER
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminOrderService.getOrderList(
          keyword.trim() || undefined,

          processingStatusFilter !== "ALL"
            ? processingStatusFilter
            : undefined,

          paymentStatusFilter !== "ALL"
            ? paymentStatusFilter
            : undefined,
        );

        const result = normalizeOrderData(response);

        if (!cancelled) {
          setOrders(result.orders);
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setOrders([]);

          setError(
            extractErrorMessage(
              err,
              "Không thể tải danh sách đơn hàng.",
            ),
          );

          console.error("Get order list error:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    keyword,
    processingStatusFilter,
    paymentStatusFilter,
    refreshKey,
  ]);

  // ======================================================
  // CLOSE MODAL WITH ESCAPE
  // ======================================================

  useEffect(() => {
    if (
      !selectedOrder &&
      !showUpdateStatusModal &&
      !showEditOrderModal
    ) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (showEditOrderModal) {
        if (!isSavingOrder) {
          handleCloseEditOrder();
        }
      } else if (showUpdateStatusModal) {
        if (!isUpdating) {
          handleCloseUpdateStatus();
        }
      } else {
        setSelectedOrder(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedOrder,
    showUpdateStatusModal,
    isUpdating,
    showEditOrderModal,
    isSavingOrder,
  ]);

  // ======================================================
  // PAGINATION
  // ======================================================

  const totalPages = Math.max(
    1,
    Math.ceil(orders.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = orders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // ======================================================
  // STATISTICS
  // ======================================================

  const totalOrderCount = statsOrders.length;

  const pendingOrderCount = statsOrders.filter(
    (order) =>
      order.order_processing_status?.order_processing_status_code ===
      "PENDING",
  ).length;

  const shippingOrderCount = statsOrders.filter(
    (order) =>
      order.order_processing_status?.order_processing_status_code ===
      "SHIPPING",
  ).length;

  const completedOrderCount = statsOrders.filter((order) =>
    ["DELIVERED", "COMPLETED"].includes(
      order.order_processing_status?.order_processing_status_code ?? "",
    ),
  ).length;

  // ======================================================
  // ACTIONS
  // ======================================================

  const resetFilters = useCallback(() => {
    setKeyword("");
    setProcessingStatusFilter("ALL");
    setPaymentStatusFilter("ALL");
    setCurrentPage(1);
  }, []);

  function retryLoad() {
    setRefreshKey((key) => key + 1);
  }

  // Mở modal chi tiết

  function handleOpenDetail(order: Order) {
    setSelectedOrder(order);
  }

  // ======================================================
  // UPDATE ORDER STATUS ACTIONS
  // ======================================================

  function handleOpenUpdateStatus(order: Order) {
    setUpdatingOrder(order);

    setSelectedProcessingStatus(
      order.order_processing_status
        ?.order_processing_status_code ?? "",
    );

    setStatusFormError("");

    setShowUpdateStatusModal(true);
  }

  function handleCloseUpdateStatus() {
    if (isUpdating) return;

    setShowUpdateStatusModal(false);
    setUpdatingOrder(null);
    setSelectedProcessingStatus("");
    setStatusFormError("");
  }

  // ======================================================
  // SUBMIT UPDATE ORDER STATUS
  // ======================================================

  async function handleUpdateStatusSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setStatusFormError("");
    setSuccessMessage("");

    if (!updatingOrder) {
      setStatusFormError("Không tìm thấy thông tin đơn hàng.");
      return;
    }

    if (!selectedProcessingStatus) {
      setStatusFormError("Vui lòng chọn trạng thái đơn hàng.");
      return;
    }

    const currentStatus =
      updatingOrder.order_processing_status
        ?.order_processing_status_code ?? "";

    if (selectedProcessingStatus === currentStatus) {
      setStatusFormError(
        "Trạng thái mới phải khác trạng thái hiện tại.",
      );
      return;
    }

    try {
      setIsUpdating(true);

      // Gọi API cập nhật trạng thái đơn hàng

      const response =
        await adminOrderService.updateOrderProcessingStatus(
          updatingOrder.order_id,
          selectedProcessingStatus,
        );

      // Lấy thông tin đơn hàng sau khi cập nhật

      const updatedOrder = response?.data as Order | undefined;

      // Cập nhật dữ liệu trực tiếp nếu backend trả về đơn hàng

      if (
        updatedOrder &&
        updatedOrder.order_id === updatingOrder.order_id
      ) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.order_id === updatedOrder.order_id
              ? updatedOrder
              : order,
          ),
        );

        setStatsOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.order_id === updatedOrder.order_id
              ? updatedOrder
              : order,
          ),
        );

        setSelectedOrder((currentOrder) =>
          currentOrder?.order_id === updatedOrder.order_id
            ? updatedOrder
            : currentOrder,
        );
      }

      // Đóng modal cập nhật

      setShowUpdateStatusModal(false);
      setUpdatingOrder(null);
      setSelectedProcessingStatus("");
      setStatusFormError("");

      // Thông báo thành công

      setSuccessMessage(
        response?.message ||
          "Cập nhật trạng thái đơn hàng thành công!",
      );

      // Tải lại danh sách và thống kê từ backend

      setRefreshKey((prev) => prev + 1);

    } catch (err: unknown) {
      console.error("Update order processing status error:", err);

      setStatusFormError(
        extractErrorMessage(
          err,
          "Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  // ======================================================
  // EDIT ORDER ACTIONS
  // ======================================================

  function handleOpenEditOrder(order: Order) {
    setEditingOrder(order);

    setEditOrderForm({
      order_recipient_name: order.order_recipient_name ?? "",
      order_recipient_phone: order.order_recipient_phone ?? "",
      order_address_line: order.order_address_line ?? "",
      order_ward: order.order_ward ?? "",
      order_province: order.order_province ?? "",
      order_order_delivery_method_id: String(
        order.order_order_delivery_method_id ?? "",
      ),
      order_order_payment_method_id: String(
        order.order_order_payment_method_id ?? "",
      ),
      order_coupon_id:
        order.order_coupon_id === null
          ? ""
          : String(order.order_coupon_id),
      order_coupon_name: order.order_coupon_name ?? "",
      order_coupon_discount_amount:
        order.order_coupon_discount_amount === null
          ? ""
          : String(order.order_coupon_discount_amount),
      order_subtotal: String(order.order_subtotal ?? ""),
      order_shipping_fee: String(order.order_shipping_fee ?? ""),
      order_discount_amount: String(order.order_discount_amount ?? ""),
      order_total_amount: String(order.order_total_amount ?? ""),
    });

    setEditOrderError("");
    setShowEditOrderModal(true);
  }

  function handleCloseEditOrder() {
    if (isSavingOrder) return;

    setShowEditOrderModal(false);
    setEditingOrder(null);
    setEditOrderError("");
  }

  function handleEditOrderFieldChange(
    field: keyof EditOrderForm,
    value: string,
  ) {
    setEditOrderForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (editOrderError) {
      setEditOrderError("");
    }
  }

  // ======================================================
  // SUBMIT EDIT ORDER
  // ======================================================

  async function handleEditOrderSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setEditOrderError("");
    setSuccessMessage("");

    if (!editingOrder) {
      setEditOrderError("Không tìm thấy thông tin đơn hàng.");
      return;
    }

    const requiredTextFields = [
      editOrderForm.order_recipient_name,
      editOrderForm.order_recipient_phone,
      editOrderForm.order_address_line,
      editOrderForm.order_ward,
      editOrderForm.order_province,
    ];

    if (requiredTextFields.some((value) => !value.trim())) {
      setEditOrderError("Vui lòng nhập đầy đủ thông tin người nhận và địa chỉ.");
      return;
    }

    const numericFields = [
      { label: "Phương thức giao hàng", value: editOrderForm.order_order_delivery_method_id },
      { label: "Phương thức thanh toán", value: editOrderForm.order_order_payment_method_id },
      { label: "Tổng tiền sản phẩm", value: editOrderForm.order_subtotal },
      { label: "Phí vận chuyển", value: editOrderForm.order_shipping_fee },
      { label: "Tổng giảm giá", value: editOrderForm.order_discount_amount },
      { label: "Tổng thanh toán", value: editOrderForm.order_total_amount },
    ];

    for (const field of numericFields) {
      if (field.value.trim() === "" || !Number.isFinite(Number(field.value))) {
        setEditOrderError(`${field.label} không hợp lệ.`);
        return;
      }
    }

    const amountFields = [
      { label: "Tổng tiền sản phẩm", value: editOrderForm.order_subtotal },
      { label: "Phí vận chuyển", value: editOrderForm.order_shipping_fee },
      { label: "Tổng giảm giá", value: editOrderForm.order_discount_amount },
      { label: "Tổng thanh toán", value: editOrderForm.order_total_amount },
    ];

    for (const field of amountFields) {
      if (Number(field.value) < 0) {
        setEditOrderError(`${field.label} không được nhỏ hơn 0.`);
        return;
      }
    }

    const couponId = editOrderForm.order_coupon_id.trim();
    const couponDiscount = editOrderForm.order_coupon_discount_amount.trim();

    if (couponId && (!Number.isInteger(Number(couponId)) || Number(couponId) <= 0)) {
      setEditOrderError("Coupon ID phải là số nguyên dương.");
      return;
    }

    if (
      couponDiscount &&
      (!Number.isFinite(Number(couponDiscount)) || Number(couponDiscount) < 0)
    ) {
      setEditOrderError("Số tiền giảm từ coupon không hợp lệ.");
      return;
    }

    const payload = {
      order_recipient_name: editOrderForm.order_recipient_name.trim(),
      order_recipient_phone: editOrderForm.order_recipient_phone.trim(),
      order_address_line: editOrderForm.order_address_line.trim(),
      order_ward: editOrderForm.order_ward.trim(),
      order_province: editOrderForm.order_province.trim(),

      order_order_delivery_method_id: Number(
        editOrderForm.order_order_delivery_method_id,
      ),
      order_order_payment_method_id: Number(
        editOrderForm.order_order_payment_method_id,
      ),

      order_coupon_id: couponId ? Number(couponId) : null,
      order_coupon_name: editOrderForm.order_coupon_name.trim() || null,
      order_coupon_discount_amount: couponDiscount
        ? Number(couponDiscount)
        : null,

      order_subtotal: Number(editOrderForm.order_subtotal),
      order_shipping_fee: Number(editOrderForm.order_shipping_fee),
      order_discount_amount: Number(editOrderForm.order_discount_amount),
      order_total_amount: Number(editOrderForm.order_total_amount),
    };

    try {
      setIsSavingOrder(true);

      const response = await adminOrderService.updateOrder(
        editingOrder.order_id,
        payload,
      );

      const updatedOrder = response?.data as Order | undefined;

      if (updatedOrder && updatedOrder.order_id === editingOrder.order_id) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.order_id === updatedOrder.order_id
              ? updatedOrder
              : order,
          ),
        );

        setStatsOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.order_id === updatedOrder.order_id
              ? updatedOrder
              : order,
          ),
        );

        setSelectedOrder((currentOrder) =>
          currentOrder?.order_id === updatedOrder.order_id
            ? updatedOrder
            : currentOrder,
        );
      }

      setShowEditOrderModal(false);
      setEditingOrder(null);
      setEditOrderError("");

      setSuccessMessage(
        response?.message || "Cập nhật thông tin đơn hàng thành công!",
      );

      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      console.error("Update order error:", err);

      setEditOrderError(
        extractErrorMessage(
          err,
          "Không thể cập nhật thông tin đơn hàng. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSavingOrder(false);
    }
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      {/* ================================================== */}
      {/* SUCCESS TOAST */}
      {/* ================================================== */}

      {successMessage && (
        <div className="fixed right-5 top-5 z-[100] flex w-[calc(100%-40px)] max-w-md items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-700">
              Thành công
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>

        </div>
      )}

      <div className="min-h-full space-y-6">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Quản trị hệ thống</span>

              <ChevronRight size={14} />

              <span className="font-medium text-blue-600">
                Quản lý đơn hàng
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
              Quản lý đơn hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi thông tin đơn hàng, sản phẩm, thanh toán và quá
              trình giao nhận.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetFilters();
              retryLoad();
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Đặt lại bộ lọc
          </button>

        </div>

        {/* ================================================== */}
        {/* STATISTICS */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Tổng đơn hàng"
            value={totalOrderCount}
            description="Tổng số đơn hàng trong hệ thống"
            icon={<ShoppingBag size={23} />}
            color="blue"
            loading={statsLoading}
          />

          <StatCard
            title="Chờ xác nhận"
            value={pendingOrderCount}
            description="Đơn hàng đang chờ xác nhận"
            icon={<Clock3 size={23} />}
            color="amber"
            loading={statsLoading}
          />

          <StatCard
            title="Đang giao hàng"
            value={shippingOrderCount}
            description="Đơn hàng có trạng thái SHIPPING"
            icon={<Truck size={23} />}
            color="cyan"
            loading={statsLoading}
          />

          <StatCard
            title="Đã giao / hoàn thành"
            value={completedOrderCount}
            description="Đơn hàng đã giao hoặc hoàn thành"
            icon={<CheckCircle2 size={23} />}
            color="emerald"
            loading={statsLoading}
          />

        </div>

        {/* ================================================== */}
        {/* STATISTICS ERROR */}
        {/* ================================================== */}

        {statsError && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Không thể cập nhật thống kê
              </p>

              <p className="mt-1 text-sm text-amber-700">
                {statsError}
              </p>
            </div>

            <button
              type="button"
              onClick={retryLoad}
              className="text-sm font-semibold text-amber-800 hover:underline"
            >
              Thử lại
            </button>

          </div>
        )}

        {/* ================================================== */}
        {/* ORDER LIST */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH AND FILTER */}

          <div className="border-b border-slate-100 p-5">

            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Danh sách đơn hàng
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tìm kiếm, lọc và quản lý thông tin đơn hàng.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

                {/* SEARCH */}

                <div className="relative sm:w-72">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900"
                  />

                  <input
                    value={keyword}
                    onChange={(event) =>
                      setKeyword(event.target.value)
                    }
                    placeholder="Mã đơn, người nhận, SĐT, SKU..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* PROCESSING STATUS */}

                <select
                  value={processingStatusFilter}
                  onChange={(event) =>
                    setProcessingStatusFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-blue-500"
                >
                  <option value="ALL">
                    Tất cả trạng thái đơn hàng
                  </option>

                  {PROCESSING_STATUS_OPTIONS.map((status) => (
                    <option
                      key={status.code}
                      value={status.code}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>

                {/* PAYMENT STATUS */}

                <select
                  value={paymentStatusFilter}
                  onChange={(event) =>
                    setPaymentStatusFilter(event.target.value)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-blue-500"
                >
                  <option value="ALL">
                    Tất cả thanh toán
                  </option>

                  <option value="PENDING">
                    Chưa thanh toán
                  </option>

                  <option value="PAID">
                    Đã thanh toán
                  </option>

                  <option value="FAILED">
                    Thanh toán thất bại
                  </option>

                  <option value="REFUNDED">
                    Đã hoàn tiền
                  </option>
                </select>

              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* ORDER TABLE */}
          {/* ================================================== */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left">

              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">

                  <th className="px-5 py-4">
                    Mã đơn hàng
                  </th>

                  <th className="px-5 py-4">
                    Người nhận
                  </th>

                  <th className="px-5 py-4">
                    Tổng thanh toán
                  </th>

                  <th className="px-5 py-4">
                    Trạng thái đơn
                  </th>

                  <th className="px-5 py-4">
                    Thanh toán
                  </th>

                  <th className="px-5 py-4 text-center">
                    Thao tác
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">

                      <LoaderCircle
                        className="mx-auto animate-spin text-blue-600"
                        size={28}
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Đang tải danh sách đơn hàng...
                      </p>

                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">

                      <AlertCircle
                        size={26}
                        className="mx-auto text-rose-500"
                      />

                      <p className="mt-3 font-semibold text-rose-600">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={retryLoad}
                        className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Thử tải lại
                      </button>

                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">

                      <Search
                        size={26}
                        className="mx-auto text-slate-400"
                      />

                      <p className="mt-3 font-semibold text-slate-700">
                        Không tìm thấy đơn hàng
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Thử thay đổi từ khóa hoặc điều kiện lọc.
                      </p>

                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {

                    const processingStatus =
                      order.order_processing_status
                        ?.order_processing_status_code ?? "";

                    const paymentStatus =
                      order.order_payment_status
                        ?.order_payment_status_code ?? "";

                    return (
                      <tr
                        key={order.order_id}
                        className="transition hover:bg-slate-50/80"
                      >

                        {/* ORDER CODE */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold text-slate-800">
                            {order.order_code}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {order.order_id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(order.order_created_at)}
                          </p>

                        </td>

                        {/* RECIPIENT */}

                        <td className="px-5 py-4">

                          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                            {order.order_recipient_name}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={12} />

                            {order.order_recipient_phone}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Khách hàng ID: {order.order_user_id}
                          </p>

                        </td>

                        {/* TOTAL AMOUNT */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-bold text-slate-800">
                            {formatCurrency(order.order_total_amount)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {order.order_item?.length ?? 0} loại sản phẩm
                          </p>

                        </td>

                        {/* PROCESSING STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusStyle(processingStatus)}`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getOrderStatusDot(processingStatus)}`}
                            />

                            {getOrderStatusLabel(
                              processingStatus,
                              order.order_processing_status
                                ?.order_processing_status_name,
                            )}

                          </span>

                        </td>

                        {/* PAYMENT STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(paymentStatus)}`}
                          >
                            {getPaymentStatusLabel(
                              paymentStatus,
                              order.order_payment_status
                                ?.order_payment_status_name,
                            )}
                          </span>

                          <p className="mt-1 text-xs text-slate-400">
                            {order.order_payment_method
                              ?.payment_method_name ?? "—"}
                          </p>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-center gap-1.5">

                            {/* VIEW DETAIL */}

                            <button
                              type="button"
                              title="Xem chi tiết đơn hàng"
                              aria-label={`Xem chi tiết ${order.order_code}`}
                              onClick={() => handleOpenDetail(order)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye size={18} />
                            </button>

                            {/* EDIT ORDER INFORMATION */}

                            <button
                              type="button"
                              title="Chỉnh sửa thông tin đơn hàng"
                              aria-label={`Chỉnh sửa thông tin ${order.order_code}`}
                              onClick={() => handleOpenEditOrder(order)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <FilePenLine size={17} />
                            </button>

                            {/* UPDATE STATUS */}

                            <button
                              type="button"
                              title="Cập nhật trạng thái đơn hàng"
                              aria-label={`Cập nhật trạng thái ${order.order_code}`}
                              onClick={() =>
                                handleOpenUpdateStatus(order)
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Pencil size={17} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>
            </table>

          </div>

          {/* ================================================== */}
          {/* PAGINATION */}
          {/* ================================================== */}

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

            <p className="text-sm text-slate-500">

              Hiển thị{" "}

              <span className="font-semibold text-slate-700">

                {orders.length === 0
                  ? 0
                  : (safePage - 1) * PAGE_SIZE + 1}

                {" - "}

                {Math.min(
                  safePage * PAGE_SIZE,
                  orders.length,
                )}

              </span>

              {" "}trên{" "}

              <span className="font-semibold text-slate-700">
                {orders.length}
              </span>

              {" "}đơn hàng

            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={safePage <= 1 || loading}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                Trang {safePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages || loading}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>

            </div>
          </div>

        </section>
      </div>

      {/* ================================================== */}
      {/* ORDER DETAIL MODAL */}
      {/* ================================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
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
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h2
                    id="order-detail-title"
                    className="text-lg font-bold text-slate-800"
                  >
                    Chi tiết đơn hàng
                  </h2>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedOrder.order_code}
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Thông tin đơn hàng, sản phẩm và thanh toán.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">

              {/* ORDER OVERVIEW */}

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Mã đơn hàng
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-800">
                      {selectedOrder.order_code}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Order ID: {selectedOrder.order_id}
                    </p>

                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getOrderStatusStyle(
                        selectedOrder.order_processing_status
                          ?.order_processing_status_code ?? "",
                      )}`}
                    >

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getOrderStatusDot(
                          selectedOrder.order_processing_status
                            ?.order_processing_status_code ?? "",
                        )}`}
                      />

                      {getOrderStatusLabel(
                        selectedOrder.order_processing_status
                          ?.order_processing_status_code ?? "",
                        selectedOrder.order_processing_status
                          ?.order_processing_status_name,
                      )}

                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getPaymentStatusStyle(
                        selectedOrder.order_payment_status
                          ?.order_payment_status_code ?? "",
                      )}`}
                    >
                      {getPaymentStatusLabel(
                        selectedOrder.order_payment_status
                          ?.order_payment_status_code ?? "",
                        selectedOrder.order_payment_status
                          ?.order_payment_status_name,
                      )}
                    </span>

                  </div>

                </div>
              </div>

              {/* RECIPIENT INFORMATION */}

              <section>

                <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                  <UserRound size={18} className="text-blue-600" />
                  Thông tin người nhận
                </h3>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

                  <DetailRow
                    icon={<UserRound size={18} />}
                    label="Tên người nhận"
                    value={selectedOrder.order_recipient_name}
                  />

                  <DetailRow
                    icon={<Phone size={18} />}
                    label="Số điện thoại"
                    value={selectedOrder.order_recipient_phone}
                  />

                  <DetailRow
                    icon={<MapPin size={18} />}
                    label="Địa chỉ nhận hàng"
                    value={getFullAddress(selectedOrder)}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="ID tài khoản khách hàng"
                    value={String(selectedOrder.order_user_id)}
                  />

                </div>
              </section>

              {/* ORDER INFORMATION */}

              <section>

                <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                  <ClipboardList size={18} className="text-blue-600" />
                  Thông tin đơn hàng
                </h3>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="Mã đơn hàng"
                    value={selectedOrder.order_code}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="Order ID"
                    value={String(selectedOrder.order_id)}
                  />

                  <DetailRow
                    icon={<Truck size={18} />}
                    label="Phương thức giao hàng"
                    value={getDeliveryMethodLabel(
                      selectedOrder.order_delivery_method
                        ?.delivery_method_code ?? "",
                      selectedOrder.order_delivery_method
                        ?.delivery_method_name,
                    )}
                  />

                  <DetailRow
                    icon={<Store size={18} />}
                    label="Mã phương thức giao hàng"
                    value={
                      selectedOrder.order_delivery_method
                        ?.delivery_method_code ?? "—"
                    }
                  />

                  <DetailRow
                    icon={<CreditCard size={18} />}
                    label="Phương thức thanh toán"
                    value={getPaymentMethodLabel(
                      selectedOrder.order_payment_method
                        ?.payment_method_code ?? "",
                      selectedOrder.order_payment_method
                        ?.payment_method_name,
                    )}
                  />

                  <DetailRow
                    icon={<WalletCards size={18} />}
                    label="Mã phương thức thanh toán"
                    value={
                      selectedOrder.order_payment_method
                        ?.payment_method_code ?? "—"
                    }
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Ngày tạo đơn hàng"
                    value={formatDateTime(
                      selectedOrder.order_created_at,
                    )}
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Cập nhật lần cuối"
                    value={formatDateTime(
                      selectedOrder.order_updated_at,
                    )}
                  />

                </div>
              </section>

              {/* PRODUCT LIST */}

              <section>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">

                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Package size={18} className="text-blue-600" />
                    Danh sách sản phẩm
                  </h3>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedOrder.order_item?.length ?? 0} sản phẩm
                  </span>

                </div>

                {!selectedOrder.order_item ||
                selectedOrder.order_item.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">

                    <Package
                      size={24}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Đơn hàng chưa có sản phẩm
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {selectedOrder.order_item.map((item, index) => (

                      <div
                        key={item.order_item_id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >

                        <div className="flex flex-col gap-4 sm:flex-row">

                          {/* PRODUCT IMAGE */}

                          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">

                            {item.order_item_product_image ? (
                              <img
                                src={item.order_item_product_image}
                                alt={item.order_item_product_name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ImageIcon
                                size={30}
                                className="text-slate-300"
                              />
                            )}

                          </div>

                          {/* PRODUCT INFORMATION */}

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">

                              <div className="min-w-0">

                                <p className="text-xs font-semibold text-slate-400">
                                  Sản phẩm #{index + 1}
                                </p>

                                <h4 className="mt-1 break-words text-sm font-bold text-slate-800">
                                  {item.order_item_product_name}
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                  SKU: {item.order_item_sku}
                                </p>

                                {item.order_item_serial_number && (
                                  <p className="mt-1 break-all text-xs text-slate-500">
                                    Serial Number: {item.order_item_serial_number}
                                  </p>
                                )}

                              </div>

                              <p className="shrink-0 text-sm font-bold text-slate-800">
                                {formatCurrency(item.order_item_subtotal)}
                              </p>

                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">

                              <div>
                                <p className="text-xs text-slate-400">
                                  Đơn giá
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  {formatCurrency(
                                    item.order_item_unit_price,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">
                                  Số lượng
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  {item.order_item_quantity}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">
                                  Thành tiền
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                  {formatCurrency(
                                    item.order_item_subtotal,
                                  )}
                                </p>
                              </div>

                            </div>

                            {/* DIRECT PROMOTION */}

                            {item.order_item_promotion_name && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 p-3">

                                <Tag
                                  size={16}
                                  className="shrink-0 text-emerald-600"
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-emerald-700">
                                    {item.order_item_promotion_name}
                                  </p>
                                </div>

                                {item.order_item_direct_discount_amount !== null && (
                                  <p className="text-xs font-semibold text-emerald-700">
                                    -{formatCurrency(
                                      item.order_item_direct_discount_amount,
                                    )}
                                  </p>
                                )}

                              </div>
                            )}

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </section>

              {/* PAYMENT INFORMATION */}

              <section>

                <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                  <ReceiptText size={18} className="text-blue-600" />
                  Chi tiết thanh toán
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                  <div className="space-y-3">

                    {/* SUBTOTAL */}

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-sm text-slate-500">
                        Tổng tiền sản phẩm
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(
                          selectedOrder.order_subtotal,
                        )}
                      </p>

                    </div>

                    {/* SHIPPING FEE */}

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-sm text-slate-500">
                        Phí vận chuyển
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(
                          selectedOrder.order_shipping_fee,
                        )}
                      </p>

                    </div>

                    {/* TOTAL DISCOUNT */}

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-sm text-slate-500">
                        Tổng giảm giá
                      </p>

                      <p className="text-sm font-semibold text-emerald-600">
                        -{formatCurrency(
                          selectedOrder.order_discount_amount,
                        )}
                      </p>

                    </div>

                    {/* COUPON */}

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-sm text-slate-500">
                        Coupon áp dụng
                      </p>

                      <p className="text-right text-sm font-medium text-slate-700">
                        {selectedOrder.order_coupon_name || "Không áp dụng"}
                      </p>

                    </div>

                    {/* COUPON DISCOUNT */}

                    {selectedOrder.order_coupon_discount_amount !== null && (
                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm text-slate-500">
                          Giảm giá Coupon
                        </p>

                        <p className="text-sm font-semibold text-emerald-600">
                          -{formatCurrency(
                            selectedOrder.order_coupon_discount_amount,
                          )}
                        </p>

                      </div>
                    )}

                    {/* TOTAL */}

                    <div className="border-t border-dashed border-slate-300 pt-3">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm font-bold text-slate-700">
                          Tổng thanh toán
                        </p>

                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(
                            selectedOrder.order_total_amount,
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>
              </section>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Đóng
              </button>

            </div>

          </section>
        </div>
      )}

      {/* ================================================== */}
      {/* UPDATE ORDER PROCESSING STATUS MODAL */}
      {/* ================================================== */}

      {showUpdateStatusModal && updatingOrder && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isUpdating
            ) {
              handleCloseUpdateStatus();
            }
          }}
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-order-status-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <RefreshCw size={20} />
                </div>

                <h2
                  id="update-order-status-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Cập nhật trạng thái đơn hàng
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Thay đổi trạng thái xử lý của đơn hàng.
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseUpdateStatus}
                disabled={isUpdating}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleUpdateStatusSubmit}>

              <div className="space-y-5 p-6">

                {/* ORDER SUMMARY */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Thông tin đơn hàng
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <div>

                      <p className="text-xs text-slate-400">
                        Mã đơn hàng
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                        {updatingOrder.order_code}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Người nhận
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {updatingOrder.order_recipient_name}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Tổng thanh toán
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatCurrency(
                          updatingOrder.order_total_amount,
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Trạng thái hiện tại
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusStyle(
                          updatingOrder.order_processing_status
                            ?.order_processing_status_code ?? "",
                        )}`}
                      >
                        {getOrderStatusLabel(
                          updatingOrder.order_processing_status
                            ?.order_processing_status_code ?? "",
                          updatingOrder.order_processing_status
                            ?.order_processing_status_name,
                        )}
                      </span>

                    </div>

                  </div>

                </div>

                {/* NEW STATUS */}

                <div>

                  <label
                    htmlFor="order-processing-status"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Trạng thái mới{" "}
                    <span className="text-rose-500">*</span>
                  </label>

                  <select
                    id="order-processing-status"
                    value={selectedProcessingStatus}
                    onChange={(event) => {
                      setSelectedProcessingStatus(event.target.value);

                      if (statusFormError) {
                        setStatusFormError("");
                      }
                    }}
                    disabled={isUpdating}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >

                    <option value="" disabled>
                      -- Chọn trạng thái đơn hàng --
                    </option>

                    {PROCESSING_STATUS_OPTIONS.map((status) => (

                      <option
                        key={status.code}
                        value={status.code}
                      >
                        {status.label}
                      </option>

                    ))}

                  </select>

                  <p className="mt-2 text-xs text-slate-400">
                    Chọn trạng thái xử lý mới cho đơn hàng.
                  </p>

                </div>

                {/* NEW STATUS PREVIEW */}

                {selectedProcessingStatus && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">

                    <p className="mb-2 text-xs font-semibold text-blue-700">
                      Trạng thái sau khi cập nhật
                    </p>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getOrderStatusStyle(
                        selectedProcessingStatus,
                      )}`}
                    >

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getOrderStatusDot(
                          selectedProcessingStatus,
                        )}`}
                      />

                      {getOrderStatusLabel(selectedProcessingStatus)}

                    </span>

                  </div>
                )}

                {/* BUSINESS WARNING */}

                {(selectedProcessingStatus === "CANCELLED" ||
                  selectedProcessingStatus === "FAILED") && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">

                    <CircleAlert
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-800">
                      Bạn đang chọn trạng thái{" "}
                      <strong>
                        {getOrderStatusLabel(selectedProcessingStatus)}
                      </strong>
                      . Hãy kiểm tra kỹ đơn hàng trước khi xác nhận.
                    </p>

                  </div>
                )}

                {/* FORM ERROR */}

                {statusFormError && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />

                    <p>{statusFormError}</p>

                  </div>
                )}

              </div>

              {/* MODAL FOOTER */}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCloseUpdateStatus}
                  disabled={isUpdating}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={
                    isUpdating ||
                    !selectedProcessingStatus ||
                    selectedProcessingStatus ===
                      updatingOrder.order_processing_status
                        ?.order_processing_status_code
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {isUpdating ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Cập nhật trạng thái
                    </>
                  )}

                </button>

              </div>

            </form>

          </section>
        </div>
      )}

      {/* ================================================== */}
      {/* EDIT ORDER INFORMATION MODAL */}
      {/* ================================================== */}

      {showEditOrderModal && editingOrder && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSavingOrder
            ) {
              handleCloseEditOrder();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FilePenLine size={20} />
                </div>

                <h2
                  id="edit-order-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Chỉnh sửa thông tin đơn hàng
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Cập nhật thông tin người nhận, giao hàng và giá trị đơn hàng.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditOrder}
                disabled={isSavingOrder}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditOrderSubmit}>
              <div className="max-h-[65vh] space-y-6 overflow-y-auto p-6">
                {/* ORDER SUMMARY */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Thông tin định danh đơn hàng
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">Mã đơn hàng</p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                        {editingOrder.order_code}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Order ID</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {editingOrder.order_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Customer ID</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {editingOrder.order_user_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RECIPIENT INFORMATION */}

                <section>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                    <UserRound size={18} className="text-blue-600" />
                    Thông tin người nhận
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-recipient-name" className="mb-2 block text-sm font-semibold text-slate-700">
                        Tên người nhận <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-recipient-name"
                        value={editOrderForm.order_recipient_name}
                        onChange={(event) => handleEditOrderFieldChange("order_recipient_name", event.target.value)}
                        required
                        maxLength={150}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-recipient-phone" className="mb-2 block text-sm font-semibold text-slate-700">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-recipient-phone"
                        type="tel"
                        value={editOrderForm.order_recipient_phone}
                        onChange={(event) => handleEditOrderFieldChange("order_recipient_phone", event.target.value)}
                        required
                        maxLength={20}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="edit-address-line" className="mb-2 block text-sm font-semibold text-slate-700">
                        Địa chỉ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-address-line"
                        value={editOrderForm.order_address_line}
                        onChange={(event) => handleEditOrderFieldChange("order_address_line", event.target.value)}
                        required
                        maxLength={255}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-ward" className="mb-2 block text-sm font-semibold text-slate-700">
                        Phường / xã <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-ward"
                        value={editOrderForm.order_ward}
                        onChange={(event) => handleEditOrderFieldChange("order_ward", event.target.value)}
                        required
                        maxLength={150}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-province" className="mb-2 block text-sm font-semibold text-slate-700">
                        Tỉnh / thành phố <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-province"
                        value={editOrderForm.order_province}
                        onChange={(event) => handleEditOrderFieldChange("order_province", event.target.value)}
                        required
                        maxLength={150}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </section>

                {/* DELIVERY AND PAYMENT */}

                <section>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                    <Truck size={18} className="text-blue-600" />
                    Giao hàng và thanh toán
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-delivery-method" className="mb-2 block text-sm font-semibold text-slate-700">
                        Phương thức giao hàng <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="edit-delivery-method"
                        value={editOrderForm.order_order_delivery_method_id}
                        onChange={(event) => handleEditOrderFieldChange("order_order_delivery_method_id", event.target.value)}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      >
                        <option value="1">Giao hàng tận nơi</option>
                        <option value="2">Nhận tại cửa hàng</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-payment-method" className="mb-2 block text-sm font-semibold text-slate-700">
                        Phương thức thanh toán <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="edit-payment-method"
                        value={editOrderForm.order_order_payment_method_id}
                        onChange={(event) => handleEditOrderFieldChange("order_order_payment_method_id", event.target.value)}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      >
                        <option value="1">Thanh toán khi nhận hàng (COD)</option>
                        <option value="2">Thanh toán qua MOMO</option>
                        <option value="3">Thanh toán qua VNPAY</option>
                      </select>
                    </div>
                  </div>

                  {editingOrder.order_payment_status?.order_payment_status_code === "PAID" ||
                  editingOrder.order_payment_status?.order_payment_status_code === "REFUNDED" ? (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                      Đơn hàng đã thanh toán hoặc hoàn tiền. Backend sẽ từ chối thay đổi phương thức thanh toán nếu phương thức mới khác phương thức hiện tại.
                    </p>
                  ) : null}
                </section>

                {/* COUPON INFORMATION */}

                <section>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                    <Tag size={18} className="text-blue-600" />
                    Thông tin Coupon
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-coupon-id" className="mb-2 block text-sm font-semibold text-slate-700">
                        Coupon ID
                      </label>
                      <input
                        id="edit-coupon-id"
                        type="number"
                        min="1"
                        step="1"
                        value={editOrderForm.order_coupon_id}
                        onChange={(event) => handleEditOrderFieldChange("order_coupon_id", event.target.value)}
                        placeholder="Để trống nếu không áp dụng"
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-coupon-name" className="mb-2 block text-sm font-semibold text-slate-700">
                        Tên Coupon
                      </label>
                      <input
                        id="edit-coupon-name"
                        value={editOrderForm.order_coupon_name}
                        onChange={(event) => handleEditOrderFieldChange("order_coupon_name", event.target.value)}
                        placeholder="Tên coupon"
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="edit-coupon-discount" className="mb-2 block text-sm font-semibold text-slate-700">
                        Số tiền giảm từ Coupon (₫)
                      </label>
                      <input
                        id="edit-coupon-discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editOrderForm.order_coupon_discount_amount}
                        onChange={(event) => handleEditOrderFieldChange("order_coupon_discount_amount", event.target.value)}
                        placeholder="Để trống nếu không áp dụng"
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </section>

                {/* ORDER AMOUNTS */}

                <section>
                  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                    <ReceiptText size={18} className="text-blue-600" />
                    Giá trị đơn hàng
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-subtotal" className="mb-2 block text-sm font-semibold text-slate-700">
                        Tổng tiền sản phẩm (₫) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-subtotal"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editOrderForm.order_subtotal}
                        onChange={(event) => handleEditOrderFieldChange("order_subtotal", event.target.value)}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-shipping-fee" className="mb-2 block text-sm font-semibold text-slate-700">
                        Phí vận chuyển (₫) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-shipping-fee"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editOrderForm.order_shipping_fee}
                        onChange={(event) => handleEditOrderFieldChange("order_shipping_fee", event.target.value)}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-discount-amount" className="mb-2 block text-sm font-semibold text-slate-700">
                        Tổng giảm giá (₫) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-discount-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editOrderForm.order_discount_amount}
                        onChange={(event) => handleEditOrderFieldChange("order_discount_amount", event.target.value)}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-total-amount" className="mb-2 block text-sm font-semibold text-slate-700">
                        Tổng thanh toán (₫) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="edit-total-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editOrderForm.order_total_amount}
                        onChange={(event) => handleEditOrderFieldChange("order_total_amount", event.target.value)}
                        disabled={isSavingOrder}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </section>

                {/* EDIT NOTICE */}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs leading-5 text-amber-800">
                    Lưu ý: Modal này chỉ chỉnh sửa thông tin cấp đơn hàng. Trạng thái xử lý, trạng thái thanh toán và danh sách sản phẩm không được chỉnh sửa tại đây. Coupon và các khoản tiền cần được kiểm tra lại với quy tắc nghiệp vụ trước khi lưu.
                  </p>
                </div>

                {/* FORM ERROR */}

                {editOrderError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>{editOrderError}</p>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseEditOrder}
                  disabled={isSavingOrder}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingOrder ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

// ======================================================
// DETAIL ROW COMPONENT
// ======================================================

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 shrink-0 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>

      </div>

    </div>
  );
}

// ======================================================
// STAT CARD COMPONENT
// ======================================================

function StatCard({
  title,
  value,
  description,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  color: "blue" | "amber" | "cyan" | "emerald";
  loading: boolean;
}) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-slate-800",
    },

    amber: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
    },

    cyan: {
      icon: "bg-cyan-50 text-cyan-600",
      value: "text-cyan-600",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <LoaderCircle
              size={24}
              className="mt-3 animate-spin text-slate-400"
            />
          ) : (
            <p className={`mt-2 text-3xl font-bold ${styles[color].value}`}>
              {value.toLocaleString("vi-VN")}
            </p>
          )}

        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${styles[color].icon}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

