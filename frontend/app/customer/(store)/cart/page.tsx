"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customerCustomerService } from "@/lib/axios/services/customer-services/customer_service";
import { customerCartService } from "@/lib/axios/services/customer-services/cart_service";
import { customerBranchService } from "@/lib/axios/services/customer-services/branch_service";
import { customerPromotionService } from "@/lib/axios/services/customer-services/promotion_service";
import {
  ArrowLeft,
  Banknote,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { customerOrderService } from "@/lib/axios/services/customer-services/order_service";

type InventoryStock = {
  sku: string;
  quantity: number;
  inStock: boolean;
};

type CartItem = {
  productId: string;
  sku: string;
  variantSlug: string;
  productName: string;
  imageUrl: string;
  quantity: number;
  price: number;
};

type Cart = {
  userId: string;
  items: CartItem[];
  totalPrice: number;
};

type CustomerAddress = {
  customer_address_id: string;
  customer_address_customer_id: string;
  customer_address_line: string;
  customer_address_ward: string;
  customer_address_province: string;
  customer_address_default: boolean;
  customer_address_created_at: string;
  customer_address_updated_at: string;
};

type Customer = {
  customer_id: string;
  customer_user_id: string;
  customer_code: string;
  customer_full_name: string;
  customer_date_of_birth: string;
  customer_gender: string;
  customer_status: string;
  customer_created_at: string;
  customer_updated_at: string;
  addresses: CustomerAddress[];
};

type BranchAddress = {
  branch_address_id: string;
  branch_id: string;
  branch_address_address_line: string;
  branch_address_ward: string;
  branch_address_province: string;
};

type BusinessHour = {
  branch_business_hour_id: string;
  branch_id: string;
  branch_business_hour_day_of_week: string;
  branch_business_hour_open_time: string;
  branch_business_hour_close_time: string;
  branch_business_hour_is_closed: boolean;
};

type Branch = {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  branch_phone: string;
  branch_email: string;
  branch_status: string;
  branch_created_at: string;
  branch_updated_at: string;
  address: BranchAddress | null;
  businessHours: BusinessHour[];
};

type DeliveryInfo = {
  type: "DELIVERY" | "PICKUP";
  fullName?: string;
  phone?: string;
  addressId?: string;
  address?: CustomerAddress;
  branch?: Branch;
};

type Coupon = {
  couponId: number;
  couponName: string;
  discountValue: string;
  minOrderValue: string;
  maxDiscountValue: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
};

type DirectPromotion = {
  sku: string;
  promotionId?: number | string;
  promotionName?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string | number;
  maxDiscountValue?: string | number | null;
  minOrderValue?: string | number | null;
  // Nếu API trả giá sau giảm trực tiếp, có thể dùng trường này.
  discountedPrice?: string | number | null;
};

type ItemPricing = {
  originalUnitPrice: number;
  discountedUnitPrice: number;
  originalSubtotal: number;
  discountedSubtotal: number;
  discount: number;
  promotion: DirectPromotion | null;
};

const PAYMENT_METHODS = [
  {
    code: "COD",
    name: "Thanh toán khi nhận hàng (COD)",
    description: "Thanh toán bằng tiền mặt khi nhận hàng",
    icon: Banknote,
  },
  {
    code: "MOMO",
    name: "Ví điện tử MoMo",
    description: "Thanh toán qua ứng dụng Ví MoMo",
    icon: Wallet,
  },
];

const dayOfWeekLabels: Record<string, string> = {
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "Chủ nhật",
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(value)));

const toNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function calculatePromotionDiscount(
  promotion: DirectPromotion,
  subtotal: number,
) {
  const minOrderValue = toNumber(promotion.minOrderValue);

  if (subtotal < minOrderValue) return 0;

  if (promotion.discountType === "FIXED_AMOUNT") {
    return Math.min(toNumber(promotion.discountValue), subtotal);
  }

  const discount =
    subtotal * (toNumber(promotion.discountValue) / 100);

  const maxDiscount =
    promotion.maxDiscountValue == null
      ? Number.POSITIVE_INFINITY
      : toNumber(promotion.maxDiscountValue);

  return Math.min(discount, maxDiscount, subtotal);
}

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [updatingSkus, setUpdatingSkus] = useState<Set<string>>(new Set());

  const [inventoryStocks, setInventoryStocks] = useState<
    Record<string, InventoryStock>
  >({});

  const [directPromotions, setDirectPromotions] = useState<
    Record<string, DirectPromotion | null>
  >({});
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState("");

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [businessHourBranch, setBusinessHourBranch] =
    useState<Branch | null>(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryTab, setDeliveryTab] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [receiverPhone, setReceiverPhone] = useState("");
  const [selectedAddress, setSelectedAddress] =
    useState<CustomerAddress | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [checkingOut, setCheckingOut] = useState(false);

  const items = cart?.items ?? [];

  const itemPricing = useMemo<Record<string, ItemPricing>>(() => {
    const result: Record<string, ItemPricing> = {};

    for (const item of items) {
      const originalUnitPrice = toNumber(item.price);
      const originalSubtotal = originalUnitPrice * item.quantity;
      const promotion = directPromotions[item.sku] ?? null;

      let discount = 0;
      let discountedUnitPrice = originalUnitPrice;

      if (promotion) {
        if (promotion.discountedPrice != null) {
          discountedUnitPrice = Math.min(
            originalUnitPrice,
            Math.max(0, toNumber(promotion.discountedPrice)),
          );
          discount =
            (originalUnitPrice - discountedUnitPrice) * item.quantity;
        } else {
          discount = calculatePromotionDiscount(promotion, originalSubtotal);
          discountedUnitPrice =
            item.quantity > 0
              ? Math.max(0, originalUnitPrice - discount / item.quantity)
              : originalUnitPrice;
        }
      }

      result[item.sku] = {
        originalUnitPrice,
        discountedUnitPrice,
        originalSubtotal,
        discountedSubtotal: Math.max(0, originalSubtotal - discount),
        discount: Math.max(0, discount),
        promotion,
      };
    }

    return result;
  }, [items, directPromotions]);

  const subtotal = items.reduce(
    (sum, item) => sum + (itemPricing[item.sku]?.discountedSubtotal ?? item.price * item.quantity),
    0,
  );

  const directDiscountTotal = items.reduce(
    (sum, item) => sum + (itemPricing[item.sku]?.discount ?? 0),
    0,
  );

  const calculateCouponDiscount = useCallback(
    (coupon: Coupon) => {
      const discountValue = toNumber(coupon.discountValue);
      const minOrderValue = toNumber(coupon.minOrderValue);

      if (subtotal < minOrderValue) return 0;

      if (coupon.discountType === "FIXED_AMOUNT") {
        return Math.min(discountValue, subtotal);
      }

      const discount = subtotal * (discountValue / 100);
      const maxDiscount =
        coupon.maxDiscountValue == null
          ? Number.POSITIVE_INFINITY
          : toNumber(coupon.maxDiscountValue);

      return Math.min(discount, maxDiscount, subtotal);
    },
    [subtotal],
  );

  const couponDiscount = selectedCoupon
    ? calculateCouponDiscount(selectedCoupon)
    : 0;

  const totalAmount = Math.max(0, subtotal - couponDiscount);

  const fetchCustomer = useCallback(async () => {
    try {
      setCustomerLoading(true);
      setCustomerError("");

      const response = await customerCustomerService.getCustomerInformation();

      // Hỗ trợ response trả trực tiếp customer hoặc bọc trong data/customer
      const data: Customer =
        response?.customer ?? response?.data?.customer ?? response?.data ?? response;

      if (!data) {
        throw new Error("Không tìm thấy thông tin khách hàng");
      }

      setCustomer(data);

      const defaultAddress =
        data.addresses?.find((address) => address.customer_address_default) ??
        data.addresses?.[0] ??
        null;

      setSelectedAddress(defaultAddress);
    } catch (err) {
      setCustomerError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải thông tin khách hàng",
      );
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const fetchDirectPromotions = useCallback(async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) {
      setDirectPromotions({});
      return;
    }

    setPromotionLoading(true);
    setPromotionError("");

    try {
      const results = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const payload = await customerPromotionService.getDirectDiscount(
              item.sku,
            );

            const promotion =
              payload?.promotion ??
              payload?.data?.promotion ??
              payload?.data ??
              payload;

            if (
              !promotion ||
              !promotion.discountType ||
              promotion.discountValue == null
            ) {
              return [item.sku, null] as const;
            }

            return [
              item.sku,
              {
                ...promotion,
                sku: item.sku,
              } as DirectPromotion,
            ] as const;
          } catch (err: any) {
            // SKU không có khuyến mãi thì bỏ qua, không làm lỗi toàn bộ giỏ hàng.
            if (err.response?.status === 404) {
              return [item.sku, null] as const;
            }

            throw err;
          }
        }),
      );

      setDirectPromotions(Object.fromEntries(results));
    } catch (err) {
      setPromotionError(
        err instanceof Error
          ? err.message
          : "Không thể tải khuyến mãi sản phẩm",
      );
    } finally {
      setPromotionLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await customerPromotionService.getAllCoupons();
      const data: Coupon[] = response?.coupons ?? response?.data ?? response;

      setCoupons(data);
    } catch (err) {
      setCouponError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải mã giảm giá",
      );
    } finally {
      setCouponLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      router.push("/customer/login");
      return;
    }

    let cancelled = false;

    const loadCart = async () => {
      try {
        setLoading(true);
        await fetchCustomer();

        const response = await customerCartService.getCart();
        const cartData = response.cart ?? response;

        if (cancelled) return;

        setCart(cartData);
        await fetchDirectPromotions(cartData.items ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi khi tải dữ liệu",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [router, fetchCustomer, fetchDirectPromotions]);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      setBranchError("");

      const data = await customerBranchService.getBranchList("ACTIVE");
      setBranches(data);
    } catch (err) {
      setBranchError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách cửa hàng",
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleOpenDeliveryModal = () => {
    setIsDeliveryModalOpen(true);
    if (branches.length === 0) void fetchBranches();
  };

  const handleChangeDeliveryTab = (tab: "DELIVERY" | "PICKUP") => {
    setDeliveryTab(tab);
    if (tab === "PICKUP" && branches.length === 0) void fetchBranches();
  };

  const handleConfirmDelivery = () => {
    if (!customer?.customer_full_name.trim()) {
      alert("Không tìm thấy tên người nhận.");
      return;
    }
    if (!receiverPhone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!selectedAddress) {
      alert("Vui lòng chọn địa chỉ nhận hàng.");
      return;
    }

    setDeliveryInfo({
      type: "DELIVERY",
      fullName: customer.customer_full_name,
      phone: receiverPhone.trim(),
      addressId: selectedAddress.customer_address_id,
      address: selectedAddress,
    });
    setIsDeliveryModalOpen(false);
  };

  const handleConfirmPickup = () => {
    if (!customer?.customer_full_name.trim()) {
      alert("Không tìm thấy tên người nhận.");
      return;
    }
    if (!receiverPhone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!selectedBranch) {
      alert("Vui lòng chọn cửa hàng nhận hàng.");
      return;
    }
    if (!selectedBranch.address) {
      alert("Cửa hàng chưa có thông tin địa chỉ.");
      return;
    }

    setDeliveryInfo({
      type: "PICKUP",
      fullName: customer.customer_full_name,
      phone: receiverPhone.trim(),
      branch: selectedBranch,
    });
    setIsDeliveryModalOpen(false);
  };

  const refreshCart = async () => {
    const response = await customerCartService.getCart();
    const cartData = response.cart ?? response;
    setCart(cartData);
    await fetchDirectPromotions(cartData.items ?? []);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const handleUpdateQuantity = async (
    sku: string,
    action: "increase" | "decrease",
  ) => {
    try {
      setUpdatingSkus((previous) => new Set(previous).add(sku));
      const updatedCart = await customerCartService.updateQuantity({
        sku,
        action,
      });
      const cartData = updatedCart.cart ?? updatedCart;
      setCart(cartData);
      await fetchDirectPromotions(cartData.items ?? []);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi cập nhật số lượng",
      );
    } finally {
      setUpdatingSkus((previous) => {
        const next = new Set(previous);
        next.delete(sku);
        return next;
      });
    }
  };

  const handleRemoveItem = async (sku: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      return;
    }

    try {
      setDeletingSku(sku);
      const updatedCart = await customerCartService.removeItem(sku);
      const cartData = updatedCart.cart ?? updatedCart;
      setCart(cartData);
      await fetchDirectPromotions(cartData.items ?? []);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi xóa sản phẩm",
      );
    } finally {
      setDeletingSku(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?")) {
      return;
    }

    try {
      setClearing(true);
      const updatedCart = await customerCartService.clearCart();
      const cartData = updatedCart.cart ?? updatedCart;
      setCart(cartData);
      setDirectPromotions({});
      setSelectedCoupon(null);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi làm trống giỏ hàng",
      );
    } finally {
      setClearing(false);
    }
  };

  const handleCheckout = async () => {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      router.push("/customer/login");
      return;
    }
    if (!cart || cart.items.length === 0) {
      alert("Giỏ hàng đang trống.");
      return;
    }
    if (!deliveryInfo) {
      handleOpenDeliveryModal();
      return;
    }
    if (!deliveryInfo.fullName?.trim() || !deliveryInfo.phone?.trim()) {
      alert("Vui lòng cung cấp đầy đủ thông tin người nhận.");
      return;
    }

    let addressLine = "";
    let ward = "";
    let province = "";
    let fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";

    if (deliveryInfo.type === "DELIVERY") {
      const address = deliveryInfo.address;
      if (!address) {
        alert("Vui lòng chọn địa chỉ nhận hàng.");
        return;
      }

      fulfillmentType = "HOME_DELIVERY";
      addressLine = address.customer_address_line;
      ward = address.customer_address_ward;
      province = address.customer_address_province;
    } else {
      const branch = deliveryInfo.branch;
      if (!branch?.address) {
        alert("Vui lòng chọn cửa hàng nhận hàng.");
        return;
      }

      fulfillmentType = "STORE_PICKUP";
      addressLine = branch.address.branch_address_address_line;
      ward = branch.address.branch_address_ward;
      province = branch.address.branch_address_province;
    }

    const orderItems = cart.items.map((item) => {
      const pricing = itemPricing[item.sku];
      return {
        sku: item.sku,
        productName: item.productName,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        price: pricing?.discountedUnitPrice ?? item.price,
        subtotal: pricing?.discountedSubtotal ?? item.price * item.quantity,

        // Thông tin khuyến mãi trực tiếp
        promotionId: pricing?.promotion?.promotionId ?? null,
        promotionName: pricing?.promotion?.promotionName ?? null,
        directDiscountAmount: pricing?.discount ?? 0,
      };
    });

    const branchId =
      deliveryInfo.type === "PICKUP"
        ? Number(deliveryInfo.branch?.branch_id)
        : 10; // Kho tổng

    const orderData = {
      userId,
      fulfillmentType,
      branchId, 
      recipientName: deliveryInfo.fullName.trim(),
      recipientPhone: deliveryInfo.phone.trim(),
      addressLine,
      ward,
      province,
      items: orderItems,
      subtotal,
      shippingFee: 0,
      
      // Coupon áp dụng cho toàn đơn hàng
      couponId: selectedCoupon?.couponId ?? null,
      couponName: selectedCoupon?.couponName ?? null,
      couponDiscountAmount: couponDiscount,

      discountAmount: directDiscountTotal + couponDiscount,
      totalAmount,
      paymentMethod,
    };

    try {
      setCheckingOut(true);

      await customerOrderService.createOrder(orderData);

      alert("Đặt hàng thành công!");
      window.dispatchEvent(new Event("order-updated"));
      router.push("/customer/order");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi đặt hàng.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#168b87] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/customer/home"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#168b87]"
          >
            <ArrowLeft size={16} />
            Tiếp tục mua sắm
          </Link>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {clearing ? "Đang xóa..." : "Xóa tất cả"}
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Giỏ hàng của bạn</h1>
          <span className="text-sm text-slate-500">
            {items.length} loại sản phẩm
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e6f5f4] text-[#168b87]">
              <ShoppingBag size={32} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hãy chọn sản phẩm bạn yêu thích nhé!
            </p>
            <Link
              href="/customer/home"
              className="mt-6 inline-flex rounded-xl bg-[#168b87] px-6 py-3 text-sm font-bold text-white hover:bg-[#10736f]"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {promotionError && (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  {promotionError}. Giá sản phẩm vẫn được giữ nguyên nếu chưa tải
                  được khuyến mãi.
                </div>
              )}

              {items.map((item) => {
                const pricing = itemPricing[item.sku];
                const hasPromotion = Boolean(pricing?.promotion);
                const isUpdating = updatingSkus.has(item.sku);

                return (
                  <div
                    key={item.sku}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/customer/product-detail/${item.variantSlug}`}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2"
                      >
                        <img
                          src={`/product/${item.imageUrl}`}
                          alt={item.productName}
                          className="h-full w-full object-contain"
                        />
                      </Link>

                      <div>
                        <Link
                          href={`/customer/product-detail/${item.variantSlug}`}
                          className="line-clamp-2 text-sm font-bold text-slate-800 hover:text-[#168b87]"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-xs text-slate-400">
                          SKU: <span className="text-slate-600">{item.sku}</span>
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {hasPromotion ? (
                            <>
                              <span className="text-sm font-semibold text-red-600">
                                {formatPrice(pricing.discountedUnitPrice)} ₫
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(pricing.originalUnitPrice)} ₫
                              </span>
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                Khuyến mãi
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-red-600">
                              {formatPrice(item.price)} ₫
                            </span>
                          )}
                        </div>

                        {hasPromotion && (
                          <p className="mt-1 text-xs text-green-700">
                            {pricing.promotion?.promotionName ||
                              "Đã áp dụng khuyến mãi trực tiếp"}{" "}
                            · Tiết kiệm {formatPrice(pricing.discount)} ₫
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:gap-6 sm:border-t-0 sm:pt-0">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(item.sku, "decrease")
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-[28px] text-center text-sm font-semibold">
                            {isUpdating ? "..." : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(item.sku, "increase")
                            }
                            disabled={
                              isUpdating ||
                              item.quantity >=
                                (inventoryStocks[item.sku]?.quantity ??
                                  Number.POSITIVE_INFINITY)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        {inventoryStocks[item.sku] && (
                          <span className="text-xs text-slate-500">
                            Còn {inventoryStocks[item.sku].quantity} sản phẩm
                          </span>
                        )}
                      </div>

                      <div className="min-w-[110px] text-right">
                        {hasPromotion && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatPrice(pricing.originalSubtotal)} ₫
                          </p>
                        )}
                        <p className="text-sm font-bold text-red-600">
                          {formatPrice(
                            pricing?.discountedSubtotal ??
                              item.price * item.quantity,
                          )}{" "}
                          ₫
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.sku)}
                        disabled={deletingSku === item.sku}
                        className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {promotionLoading && (
                <p className="text-xs text-slate-500">
                  Đang kiểm tra khuyến mãi trực tiếp...
                </p>
              )}
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
              <h2 className="text-base font-bold text-slate-900">
                Tóm tắt đơn hàng
              </h2>

              <div className="mt-4 space-y-3 border-b border-slate-100 pb-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(cart?.totalPrice ?? 0)} ₫
                  </span>
                </div>
                {directDiscountTotal > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Khuyến mãi trực tiếp</span>
                    <span>-{formatPrice(directDiscountTotal)} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Thành tiền sau khuyến mãi</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(subtotal)} ₫
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCouponModalOpen(true);
                    if (coupons.length === 0) void fetchCoupons();
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-[#168b87] bg-[#f0faf9] px-4 py-3 text-sm hover:bg-[#e6f5f4]"
                >
                  <span className="font-semibold text-[#168b87]">
                    {selectedCoupon
                      ? `Coupon #${selectedCoupon.couponId}`
                      : "Áp dụng mã giảm giá"}
                  </span>
                  <span className="text-[#168b87]">›</span>
                </button>

                {selectedCoupon && (
                  <button
                    type="button"
                    onClick={() => setSelectedCoupon(null)}
                    className="mt-2 text-xs font-medium text-red-500 hover:underline"
                  >
                    Bỏ mã giảm giá
                  </button>
                )}
              </div>

              {selectedCoupon && (
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-slate-600">Giảm bằng coupon</span>
                  <span className="font-semibold text-green-600">
                    -{formatPrice(couponDiscount)} ₫
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-slate-900">Tổng cộng</span>
                <span className="text-xl font-extrabold text-red-600">
                  {formatPrice(totalAmount)} ₫
                </span>
              </div>

              <div className="mt-5">
                {deliveryInfo ? (
                  <div className="rounded-xl border border-[#b7e2df] bg-[#f0faf9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {deliveryInfo.type === "DELIVERY" ? (
                          <Truck size={18} className="text-[#168b87]" />
                        ) : (
                          <Store size={18} className="text-[#168b87]" />
                        )}
                        <h3 className="text-sm font-bold text-slate-800">
                          Thông tin nhận hàng
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenDeliveryModal}
                        className="text-xs font-semibold text-[#168b87] hover:underline"
                      >
                        Thay đổi
                      </button>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {deliveryInfo.fullName}
                      </p>
                      <p>{deliveryInfo.phone}</p>
                      {deliveryInfo.type === "DELIVERY" ? (
                        <p>
                          {deliveryInfo.address?.customer_address_line},{" "}
                          {deliveryInfo.address?.customer_address_ward},{" "}
                          {deliveryInfo.address?.customer_address_province}
                        </p>
                      ) : (
                        <p>
                          {deliveryInfo.branch?.branch_name} —{" "}
                          {deliveryInfo.branch?.address?.branch_address_address_line},{" "}
                          {deliveryInfo.branch?.address?.branch_address_ward},{" "}
                          {deliveryInfo.branch?.address?.branch_address_province}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenDeliveryModal}
                    className="w-full rounded-xl border border-dashed border-[#168b87] bg-[#f0faf9] p-4 text-left hover:bg-[#e6f5f4]"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className="text-[#168b87]" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Cung cấp thông tin nhận hàng
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Chọn giao tận nơi hoặc nhận tại cửa hàng
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="mb-3 text-sm font-bold text-slate-800">
                  Phương thức thanh toán
                </h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.code;

                    return (
                      <label
                        key={method.code}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 ${
                          selected
                            ? "border-[#168b87] bg-[#f0faf9]"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {method.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {method.description}
                            </p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selected}
                          onChange={() => setPaymentMethod(method.code)}
                          className="accent-[#168b87]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut || items.length === 0}
                className="mt-4 w-full rounded-xl bg-[#168b87] py-3.5 text-sm font-bold text-white hover:bg-[#10736f] disabled:opacity-50"
              >
                {checkingOut ? "Đang đặt hàng..." : "Tiến hành đặt hàng"}
              </button>
            </aside>
          </div>
        )}
      </div>

      {/* Modal thông tin nhận hàng */}
      {isDeliveryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsDeliveryModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Thông tin nhận hàng</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Vui lòng cung cấp thông tin người nhận
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-7 overflow-y-auto p-6">
              <section>
                <h3 className="font-bold">1. Thông tin người nhận</h3>
                {customerLoading ? (
                  <p className="mt-3 text-sm text-slate-500">Đang tải...</p>
                ) : customerError ? (
                  <p className="mt-3 text-sm text-red-600">{customerError}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <input
                      value={customer?.customer_full_name ?? ""}
                      readOnly
                      className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm"
                    />
                    <input
                      type="tel"
                      value={receiverPhone}
                      onChange={(event) => setReceiverPhone(event.target.value)}
                      placeholder="Số điện thoại người nhận"
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                    />
                  </div>
                )}
              </section>

              <section>
                <h3 className="font-bold">2. Hình thức nhận hàng</h3>
                <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleChangeDeliveryTab("DELIVERY")}
                    className={`rounded-lg py-3 text-sm font-semibold ${
                      deliveryTab === "DELIVERY"
                        ? "bg-white text-[#168b87] shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    <Truck className="mr-2 inline" size={17} />
                    Giao tận nơi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeDeliveryTab("PICKUP")}
                    className={`rounded-lg py-3 text-sm font-semibold ${
                      deliveryTab === "PICKUP"
                        ? "bg-white text-[#168b87] shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    <Store className="mr-2 inline" size={17} />
                    Nhận tại cửa hàng
                  </button>
                </div>

                {deliveryTab === "DELIVERY" && (
                  <div className="mt-4 space-y-3">
                    {!customer?.addresses?.length ? (
                      <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                        Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ trong trang
                        thông tin cá nhân.
                      </p>
                    ) : (
                      customer.addresses.map((address) => {
                        const selected =
                          selectedAddress?.customer_address_id ===
                          address.customer_address_id;

                        return (
                          <button
                            type="button"
                            key={address.customer_address_id}
                            onClick={() => setSelectedAddress(address)}
                            className={`w-full rounded-xl border p-4 text-left ${
                              selected
                                ? "border-[#168b87] bg-[#f0faf9]"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between gap-3">
                              <span className="text-sm font-semibold">
                                {address.customer_address_line}
                              </span>
                              {address.customer_address_default && (
                                <span className="text-xs text-[#168b87]">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {address.customer_address_ward},{" "}
                              {address.customer_address_province}
                            </p>
                          </button>
                        );
                      })
                    )}
                    <button
                      type="button"
                      onClick={handleConfirmDelivery}
                      disabled={!selectedAddress || !receiverPhone.trim()}
                      className="w-full rounded-xl bg-[#168b87] py-3 font-bold text-white disabled:opacity-40"
                    >
                      Xác nhận thông tin
                    </button>
                  </div>
                )}

                {deliveryTab === "PICKUP" && (
                  <div className="mt-4 space-y-3">
                    {loadingBranches ? (
                      <p className="py-6 text-center text-sm text-slate-500">
                        Đang tải cửa hàng...
                      </p>
                    ) : branchError ? (
                      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                        {branchError}
                        <button
                          type="button"
                          onClick={() => void fetchBranches()}
                          className="ml-2 font-semibold underline"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      branches.map((branch) => {
                        const selected =
                          selectedBranch?.branch_id === branch.branch_id;

                        return (
                          <div
                            key={branch.branch_id}
                            onClick={() => setSelectedBranch(branch)}
                            className={`cursor-pointer rounded-xl border p-4 ${
                              selected
                                ? "border-[#168b87] bg-[#f0faf9]"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold">{branch.branch_name}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {branch.branch_code}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setBusinessHourBranch(branch);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#168b87]"
                              >
                                <Clock size={14} />
                                Giờ hoạt động
                              </button>
                            </div>
                            {branch.address && (
                              <p className="mt-2 text-sm text-slate-600">
                                {branch.address.branch_address_address_line},{" "}
                                {branch.address.branch_address_ward},{" "}
                                {branch.address.branch_address_province}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                              <Phone size={13} className="mr-1 inline" />
                              {branch.branch_phone}
                            </p>
                          </div>
                        );
                      })
                    )}
                    <button
                      type="button"
                      onClick={handleConfirmPickup}
                      disabled={!selectedBranch || !receiverPhone.trim()}
                      className="w-full rounded-xl bg-[#168b87] py-3 font-bold text-white disabled:opacity-40"
                    >
                      Xác nhận cửa hàng
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modal giờ hoạt động */}
      {businessHourBranch && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setBusinessHourBranch(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Giờ hoạt động</h2>
                <p className="text-xs text-slate-500">
                  {businessHourBranch.branch_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBusinessHourBranch(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 p-6">
              {businessHourBranch.businessHours.map((hour) => (
                <div
                  key={hour.branch_business_hour_id}
                  className="flex justify-between rounded-lg bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm">
                    {dayOfWeekLabels[hour.branch_business_hour_day_of_week] ??
                      hour.branch_business_hour_day_of_week}
                  </span>
                  <span className="text-sm font-semibold">
                    {hour.branch_business_hour_is_closed
                      ? "Đóng cửa"
                      : `${hour.branch_business_hour_open_time} - ${hour.branch_business_hour_close_time}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal coupon */}
      {isCouponModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsCouponModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Chọn mã giảm giá</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Chỉ áp dụng một coupon cho mỗi đơn hàng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-6">
              {couponLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Đang tải mã giảm giá...
                </p>
              ) : couponError ? (
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <p className="text-sm text-red-600">{couponError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchCoupons()}
                    className="mt-3 rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Thử lại
                  </button>
                </div>
              ) : coupons.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Hiện không có mã giảm giá.
                </p>
              ) : (
                coupons.map((coupon) => {
                  const eligible = subtotal >= toNumber(coupon.minOrderValue);
                  const discount = calculateCouponDiscount(coupon);
                  const selected =
                    selectedCoupon?.couponId === coupon.couponId;

                  return (
                    <div
                      key={coupon.couponId}
                      className={`rounded-xl border p-4 ${
                        selected
                          ? "border-[#168b87] bg-[#f0faf9]"
                          : "border-slate-200"
                      } ${eligible ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold">
                            Coupon #{coupon.couponId}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-red-600">
                            {coupon.discountType === "PERCENTAGE"
                              ? `Giảm ${coupon.discountValue}%`
                              : `Giảm ${formatPrice(
                                  toNumber(coupon.discountValue),
                                )} ₫`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Đơn tối thiểu{" "}
                            {formatPrice(toNumber(coupon.minOrderValue))} ₫
                          </p>
                          {!eligible && (
                            <p className="mt-1 text-xs text-red-500">
                              Chưa đủ điều kiện áp dụng
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={!eligible}
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setIsCouponModalOpen(false);
                          }}
                          className="rounded-lg bg-[#168b87] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {selected ? "Đã chọn" : "Áp dụng"}
                        </button>
                      </div>

                      {eligible && (
                        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                          Được giảm{" "}
                          <span className="font-bold text-green-600">
                            {formatPrice(discount)} ₫
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
