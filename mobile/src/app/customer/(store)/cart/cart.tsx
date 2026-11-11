import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isAxiosError } from "axios";
import { FRONTEND_ASSET_URL } from "@/constants/api";
import { getStoredUser } from "@/lib/storage/secure_storage";
import { customerCustomerService } from "@/lib/axios/services/customer-services/customer_service";
import { customerCartService } from "@/lib/axios/services/customer-services/cart_service";
import { customerBranchService } from "@/lib/axios/services/customer-services/branch_service";
import { customerPromotionService } from "@/lib/axios/services/customer-services/promotion_service";
import { customerOrderService } from "@/lib/axios/services/customer-services/order_service";

const confirmAction = (message: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      "Xác nhận",
      message,
      [
        { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
        { text: "Xóa", style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error))
    return error.response?.data?.message || error.message || fallback;
  return error instanceof Error ? error.message : fallback;
};

const imageUrl = (image: string, attempt = 0) => {
  if (/^https?:\/\//.test(image)) return image;
  const path = image.replace(/^\/?product\//, "").replace(/^\//, "");
  const directory = ["", "phone/", "laptop/", "tablet/"][attempt] ?? "";
  return `${FRONTEND_ASSET_URL}/product/${directory}${path}`;
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
    icon: "₫",
  },
  {
    code: "MOMO",
    name: "Ví điện tử MoMo",
    description: "Thanh toán qua ứng dụng Ví MoMo",
    icon: "◈",
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

  const discount = subtotal * (toNumber(promotion.discountValue) / 100);

  const maxDiscount =
    promotion.maxDiscountValue == null
      ? Number.POSITIVE_INFINITY
      : toNumber(promotion.maxDiscountValue);

  return Math.min(discount, maxDiscount, subtotal);
}

export default function CartPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const retryCart = useRef<() => void>(() => {});
  const mutationLock = useRef(false);
  const [imageAttempts, setImageAttempts] = useState<Record<string, number>>(
    {},
  );

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [updatingSkus, setUpdatingSkus] = useState<Set<string>>(new Set());

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
  const [businessHourBranch, setBusinessHourBranch] = useState<Branch | null>(
    null,
  );

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

  const items = useMemo(() => cart?.items ?? [], [cart]);

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
          discount = (originalUnitPrice - discountedUnitPrice) * item.quantity;
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
    (sum, item) =>
      sum +
      (itemPricing[item.sku]?.discountedSubtotal ?? item.price * item.quantity),
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
        response?.customer ??
        response?.data?.customer ??
        response?.data ??
        response;

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
          } catch (err) {
            // SKU không có khuyến mãi thì bỏ qua, không làm lỗi toàn bộ giỏ hàng.
            if (isAxiosError(err) && err.response?.status === 404) {
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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadCart = async () => {
        try {
          setLoading(true);
          setError("");
          const { userId } = await getStoredUser();
          if (!userId) {
            router.replace("/customer/login");
            return;
          }
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

      retryCart.current = () => {
        void loadCart();
      };
      void loadCart();

      return () => {
        cancelled = true;
      };
    }, [router, fetchCustomer, fetchDirectPromotions]),
  );

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
      Alert.alert("Giỏ hàng", "Không tìm thấy tên người nhận.");
      return;
    }
    if (!receiverPhone.trim()) {
      Alert.alert("Giỏ hàng", "Vui lòng nhập số điện thoại.");
      return;
    }
    if (!selectedAddress) {
      Alert.alert("Giỏ hàng", "Vui lòng chọn địa chỉ nhận hàng.");
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
      Alert.alert("Giỏ hàng", "Không tìm thấy tên người nhận.");
      return;
    }
    if (!receiverPhone.trim()) {
      Alert.alert("Giỏ hàng", "Vui lòng nhập số điện thoại.");
      return;
    }
    if (!selectedBranch) {
      Alert.alert("Giỏ hàng", "Vui lòng chọn cửa hàng nhận hàng.");
      return;
    }
    if (!selectedBranch.address) {
      Alert.alert("Giỏ hàng", "Cửa hàng chưa có thông tin địa chỉ.");
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

  const busy =
    checkingOut || clearing || deletingSku !== null || updatingSkus.size > 0;

  const refreshCart = async () => {
    const response = await customerCartService.getCart();
    const cartData = response.cart ?? response;
    setCart(cartData);
    await fetchDirectPromotions(cartData.items ?? []);
  };

  const handleUpdateQuantity = async (
    sku: string,
    action: "increase" | "decrease",
  ) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    try {
      setUpdatingSkus((previous) => new Set(previous).add(sku));
      const updatedCart = await customerCartService.updateQuantity({
        sku,
        action,
      });
      const cartData = updatedCart.cart ?? updatedCart;
      setCart(cartData);
      await fetchDirectPromotions(cartData.items ?? []);
    } catch (err) {
      Alert.alert(
        "Giỏ hàng",
        getErrorMessage(err, "Có lỗi xảy ra khi cập nhật số lượng"),
      );
    } finally {
      mutationLock.current = false;
      setUpdatingSkus((previous) => {
        const next = new Set(previous);
        next.delete(sku);
        return next;
      });
    }
  };

  const handleRemoveItem = async (sku: string) => {
    if (
      !(await confirmAction("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?"))
    ) {
      return;
    }

    if (mutationLock.current) return;
    mutationLock.current = true;
    try {
      setDeletingSku(sku);
      const updatedCart = await customerCartService.removeItem(sku);
      const cartData = updatedCart.cart ?? updatedCart;
      setCart(cartData);
      await fetchDirectPromotions(cartData.items ?? []);
    } catch (err) {
      Alert.alert(
        "Giỏ hàng",
        getErrorMessage(err, "Có lỗi xảy ra khi xóa sản phẩm"),
      );
    } finally {
      mutationLock.current = false;
      setDeletingSku(null);
    }
  };

  const handleClearCart = async () => {
    if (
      !(await confirmAction(
        "Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?",
      ))
    ) {
      return;
    }

    if (mutationLock.current) return;
    mutationLock.current = true;
    try {
      setClearing(true);
      const updatedCart = await customerCartService.clearCart();
      const cartData = updatedCart.cart ?? updatedCart;
      setCart(cartData);
      setDirectPromotions({});
      setSelectedCoupon(null);
    } catch (err) {
      Alert.alert(
        "Giỏ hàng",
        getErrorMessage(err, "Có lỗi xảy ra khi làm trống giỏ hàng"),
      );
    } finally {
      mutationLock.current = false;
      setClearing(false);
    }
  };

  const handleCheckout = async () => {
    const { userId } = await getStoredUser();

    if (!userId) {
      router.push("/customer/login");
      return;
    }
    if (!cart || cart.items.length === 0) {
      Alert.alert("Giỏ hàng", "Giỏ hàng đang trống.");
      return;
    }
    if (!deliveryInfo) {
      handleOpenDeliveryModal();
      return;
    }
    if (!deliveryInfo.fullName?.trim() || !deliveryInfo.phone?.trim()) {
      Alert.alert("Giỏ hàng", "Vui lòng cung cấp đầy đủ thông tin người nhận.");
      return;
    }

    let addressLine = "";
    let ward = "";
    let province = "";
    let fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";

    if (deliveryInfo.type === "DELIVERY") {
      const address = deliveryInfo.address;
      if (!address) {
        Alert.alert("Giỏ hàng", "Vui lòng chọn địa chỉ nhận hàng.");
        return;
      }

      fulfillmentType = "HOME_DELIVERY";
      addressLine = address.customer_address_line;
      ward = address.customer_address_ward;
      province = address.customer_address_province;
    } else {
      const branch = deliveryInfo.branch;
      if (!branch?.address) {
        Alert.alert("Giỏ hàng", "Vui lòng chọn cửa hàng nhận hàng.");
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

    if (mutationLock.current) return;
    mutationLock.current = true;
    try {
      setCheckingOut(true);

      await customerOrderService.createOrder(orderData);

      Alert.alert("Giỏ hàng", "Đặt hàng thành công!");

      setDeliveryInfo(null);
      setSelectedCoupon(null);
      await refreshCart().catch(() => retryCart.current());
      router.push("/customer/order" as Href);
    } catch (err) {
      Alert.alert(
        "Giỏ hàng",
        err instanceof Error ? err.message : "Có lỗi xảy ra khi đặt hàng.",
      );
    } finally {
      mutationLock.current = false;
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator
          size="large"
          color="#168b87"
          accessibilityLabel="Đang tải giỏ hàng"
        />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Text className="text-center text-red-600" accessibilityRole="alert">
          {error}
        </Text>
        <Pressable
          onPress={() => retryCart.current()}
          accessibilityRole="button"
          className="mt-4 rounded-xl bg-[#168b87] px-6 py-3"
        >
          <Text className="font-bold text-white">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        }}
      >
        <View className="mb-5 flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/customer/home")}
            className="min-h-11 justify-center"
          >
            <Text className="text-sm font-medium text-slate-500">
              ← Tiếp tục mua sắm
            </Text>
          </Pressable>
          {items.length > 0 && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={handleClearCart}
              className={`min-h-11 justify-center ${busy ? "opacity-40" : ""}`}
            >
              <Text className="text-sm font-semibold text-red-600">
                {clearing ? "Đang xóa..." : "Xóa tất cả"}
              </Text>
            </Pressable>
          )}
        </View>
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold text-slate-900"
        >
          Giỏ hàng của bạn
        </Text>
        <Text className="mb-5 mt-1 text-sm text-slate-500">
          {items.length} loại sản phẩm
        </Text>

        {items.length === 0 ? (
          <View className="items-center rounded-3xl border border-slate-200 bg-white px-5 py-10">
            <Text className="rounded-2xl bg-[#e6f5f4] p-4 text-3xl">🛒</Text>
            <Text className="mt-4 text-center text-lg font-bold text-slate-800">
              Giỏ hàng của bạn đang trống
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              Hãy chọn sản phẩm bạn yêu thích nhé!
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/customer/home")}
              className="mt-6 rounded-xl bg-[#168b87] px-6 py-3"
            >
              <Text className="font-bold text-white">Khám phá sản phẩm</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {!!promotionError && (
              <Text
                accessibilityRole="alert"
                className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700"
              >
                {promotionError}. Giá sản phẩm vẫn được giữ nguyên nếu chưa tải
                được khuyến mãi.
              </Text>
            )}
            {items.map((item) => {
              const pricing = itemPricing[item.sku];
              const hasPromotion = Boolean(pricing?.promotion);
              const isUpdating = updatingSkus.has(item.sku);
              return (
                <View
                  key={item.sku}
                  className="mb-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Xem ${item.productName}`}
                    onPress={() =>
                      router.push(
                        `/customer/product-detail/${item.variantSlug}` as Href,
                      )
                    }
                    className="flex-row items-start gap-3"
                  >
                    {(imageAttempts[item.sku] ?? 0) < 4 ? (
                      <Image
                        source={{
                          uri: imageUrl(item.imageUrl, imageAttempts[item.sku]),
                        }}
                        accessibilityLabel={item.productName}
                        resizeMode="contain"
                        onError={() =>
                          setImageAttempts((previous) => ({
                            ...previous,
                            [item.sku]: (previous[item.sku] ?? 0) + 1,
                          }))
                        }
                        className="h-20 w-20 rounded-xl bg-slate-50"
                      />
                    ) : (
                      <View className="h-20 w-20 items-center justify-center rounded-xl bg-slate-50 p-2">
                        <Text className="text-center text-xs text-slate-400">
                          Không có ảnh
                        </Text>
                      </View>
                    )}
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-bold text-slate-800">
                        {item.productName}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        SKU: {item.sku}
                      </Text>
                      <Text className="mt-2 text-sm font-semibold text-red-600">
                        {formatPrice(pricing.discountedUnitPrice)} ₫
                      </Text>
                      {hasPromotion && (
                        <>
                          <Text className="text-xs text-slate-400 line-through">
                            {formatPrice(pricing.originalUnitPrice)} ₫
                          </Text>
                          <Text className="mt-1 text-xs font-bold text-red-600">
                            Khuyến mãi
                          </Text>
                          <Text className="mt-1 text-xs text-green-700">
                            {pricing.promotion?.promotionName ||
                              "Đã áp dụng khuyến mãi trực tiếp"}{" "}
                            · Tiết kiệm {formatPrice(pricing.discount)} ₫
                          </Text>
                        </>
                      )}
                    </View>
                  </Pressable>
                  <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <View className="flex-row items-center rounded-xl border border-slate-200">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Giảm số lượng ${item.productName}`}
                        disabled={busy || item.quantity <= 1}
                        onPress={() =>
                          handleUpdateQuantity(item.sku, "decrease")
                        }
                        className={`h-11 w-11 items-center justify-center ${busy || item.quantity <= 1 ? "opacity-30" : ""}`}
                      >
                        <Text className="text-xl text-slate-600">−</Text>
                      </Pressable>
                      <Text
                        accessibilityLiveRegion="polite"
                        className="min-w-7 text-center font-semibold"
                      >
                        {isUpdating ? "..." : item.quantity}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Tăng số lượng ${item.productName}`}
                        disabled={busy}
                        onPress={() =>
                          handleUpdateQuantity(item.sku, "increase")
                        }
                        className={`h-11 w-11 items-center justify-center ${busy ? "opacity-30" : ""}`}
                      >
                        <Text className="text-xl text-slate-600">+</Text>
                      </Pressable>
                    </View>
                    <View className="ml-auto items-end">
                      {hasPromotion && (
                        <Text className="text-xs text-slate-400 line-through">
                          {formatPrice(pricing.originalSubtotal)} ₫
                        </Text>
                      )}
                      <Text className="text-sm font-bold text-red-600">
                        {formatPrice(pricing.discountedSubtotal)} ₫
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa ${item.productName}`}
                      disabled={busy}
                      onPress={() => handleRemoveItem(item.sku)}
                      className="min-h-11 min-w-11 items-center justify-center"
                    >
                      <Text className="text-xs font-semibold text-red-500">
                        {deletingSku === item.sku ? "..." : "Xóa"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {promotionLoading && (
              <Text className="mb-3 text-xs text-slate-500">
                Đang kiểm tra khuyến mãi trực tiếp...
              </Text>
            )}

            <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Text
                accessibilityRole="header"
                className="text-base font-bold text-slate-900"
              >
                Tóm tắt đơn hàng
              </Text>
              <View className="mt-4 gap-3 border-b border-slate-100 pb-4">
                <View className="flex-row justify-between gap-3">
                  <Text className="flex-1 text-sm text-slate-600">
                    Tạm tính
                  </Text>
                  <Text className="text-sm font-semibold">
                    {formatPrice(cart?.totalPrice ?? 0)} ₫
                  </Text>
                </View>
                {directDiscountTotal > 0 && (
                  <View className="flex-row justify-between gap-3">
                    <Text className="flex-1 text-sm text-green-700">
                      Khuyến mãi trực tiếp
                    </Text>
                    <Text className="text-sm text-green-700">
                      -{formatPrice(directDiscountTotal)} ₫
                    </Text>
                  </View>
                )}
                <View className="flex-row justify-between gap-3">
                  <Text className="flex-1 text-sm text-slate-600">
                    Thành tiền sau khuyến mãi
                  </Text>
                  <Text className="text-sm font-semibold">
                    {formatPrice(subtotal)} ₫
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => {
                  setIsCouponModalOpen(true);
                  if (coupons.length === 0) void fetchCoupons();
                }}
                className="mt-4 rounded-xl border border-dashed border-[#168b87] bg-[#f0faf9] p-4"
              >
                <Text className="text-sm font-semibold text-[#168b87]">
                  {selectedCoupon
                    ? `Coupon #${selectedCoupon.couponId}`
                    : "Áp dụng mã giảm giá"}{" "}
                  ›
                </Text>
              </Pressable>
              {selectedCoupon && (
                <>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setSelectedCoupon(null)}
                    className="min-h-11 justify-center"
                  >
                    <Text className="text-xs font-medium text-red-500">
                      Bỏ mã giảm giá
                    </Text>
                  </Pressable>
                  <View className="flex-row justify-between gap-3">
                    <Text className="text-sm text-slate-600">
                      Giảm bằng coupon
                    </Text>
                    <Text className="font-semibold text-green-600">
                      -{formatPrice(couponDiscount)} ₫
                    </Text>
                  </View>
                </>
              )}
              <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2">
                <Text className="font-bold text-slate-800">
                  Tổng thanh toán
                </Text>
                <Text className="text-2xl font-bold text-red-600">
                  {formatPrice(totalAmount)} ₫
                </Text>
              </View>

              <View className="mt-5 border-t border-slate-100 pt-5">
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={handleOpenDeliveryModal}
                  className="rounded-xl border border-dashed border-[#168b87] bg-[#f0faf9] p-4"
                >
                  <Text className="font-bold text-slate-800">
                    {deliveryInfo
                      ? deliveryInfo.type === "DELIVERY"
                        ? "Giao tận nơi"
                        : "Nhận tại cửa hàng"
                      : "Cung cấp thông tin nhận hàng"}
                  </Text>
                  {deliveryInfo ? (
                    <>
                      <Text className="mt-2 text-sm text-slate-600">
                        {deliveryInfo.fullName} · {deliveryInfo.phone}
                      </Text>
                      <Text className="mt-1 text-sm text-slate-600">
                        {deliveryInfo.type === "DELIVERY"
                          ? `${deliveryInfo.address?.customer_address_line}, ${deliveryInfo.address?.customer_address_ward}, ${deliveryInfo.address?.customer_address_province}`
                          : `${deliveryInfo.branch?.branch_name} — ${deliveryInfo.branch?.address?.branch_address_address_line}, ${deliveryInfo.branch?.address?.branch_address_ward}, ${deliveryInfo.branch?.address?.branch_address_province}`}
                      </Text>
                      <Text className="mt-2 text-xs font-semibold text-[#168b87]">
                        Thay đổi ›
                      </Text>
                    </>
                  ) : (
                    <Text className="mt-1 text-xs text-slate-500">
                      Chọn giao tận nơi hoặc nhận tại cửa hàng ›
                    </Text>
                  )}
                </Pressable>
              </View>
              <View className="mt-5 border-t border-slate-100 pt-5">
                <Text className="mb-3 text-sm font-bold text-slate-800">
                  Phương thức thanh toán
                </Text>
                {PAYMENT_METHODS.map((method) => {
                  const selected = paymentMethod === method.code;
                  return (
                    <Pressable
                      key={method.code}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: busy }}
                      disabled={busy}
                      onPress={() => setPaymentMethod(method.code)}
                      className={`mb-2 flex-row items-center gap-3 rounded-xl border p-3 ${selected ? "border-[#168b87] bg-[#f0faf9]" : "border-slate-200"}`}
                    >
                      <Text className="text-xl text-[#168b87]">
                        {method.icon}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-800">
                          {method.name}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500">
                          {method.description}
                        </Text>
                      </View>
                      <Text className="text-lg text-[#168b87]">
                        {selected ? "◉" : "○"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={busy || promotionLoading}
                onPress={handleCheckout}
                className={`mt-4 min-h-12 items-center justify-center rounded-xl bg-[#168b87] px-4 py-4 ${busy || promotionLoading ? "opacity-50" : ""}`}
              >
                <Text className="text-sm font-bold text-white">
                  {checkingOut ? "Đang đặt hàng..." : "Tiến hành đặt hàng"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal thông tin nhận hàng */}
      <Modal
        visible={isDeliveryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (businessHourBranch) setBusinessHourBranch(null);
          else setIsDeliveryModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, paddingTop: insets.top + 16 }}
        >
          <View className="flex-1 justify-end bg-black/50">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng thông tin nhận hàng"
              className="flex-1"
              onPress={() => setIsDeliveryModalOpen(false)}
            />
            <View
              className="max-h-[90%] rounded-t-3xl bg-white"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-3">
                <View className="flex-1">
                  <Text
                    accessibilityRole="header"
                    className="text-lg font-bold"
                  >
                    Thông tin nhận hàng
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    Vui lòng cung cấp thông tin người nhận
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đóng thông tin nhận hàng"
                  onPress={() => setIsDeliveryModalOpen(false)}
                  className="h-11 w-11 items-center justify-center"
                >
                  <Text className="text-2xl text-slate-400">×</Text>
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20 }}
              >
                <Text className="font-bold">1. Thông tin người nhận</Text>
                {customerLoading ? (
                  <ActivityIndicator className="my-4" color="#168b87" />
                ) : customerError ? (
                  <View className="mt-3">
                    <Text className="text-sm text-red-600">
                      {customerError}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={fetchCustomer}
                      className="min-h-11 justify-center"
                    >
                      <Text className="font-semibold text-[#168b87]">
                        Thử lại
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <TextInput
                      value={customer?.customer_full_name ?? ""}
                      editable={false}
                      accessibilityLabel="Tên người nhận"
                      className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
                    />
                    <TextInput
                      value={receiverPhone}
                      onChangeText={setReceiverPhone}
                      keyboardType="phone-pad"
                      accessibilityLabel="Số điện thoại người nhận"
                      placeholder="Số điện thoại người nhận"
                      placeholderTextColor="#94a3b8"
                      className="mt-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800"
                    />
                  </>
                )}
                <Text className="mt-6 font-bold">2. Hình thức nhận hàng</Text>
                <View className="mt-4 flex-row rounded-xl bg-slate-100 p-1">
                  {(["DELIVERY", "PICKUP"] as const).map((tab) => (
                    <Pressable
                      key={tab}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: deliveryTab === tab }}
                      onPress={() => handleChangeDeliveryTab(tab)}
                      className={`min-h-12 flex-1 items-center justify-center rounded-lg px-2 py-3 ${deliveryTab === tab ? "bg-white" : ""}`}
                    >
                      <Text
                        className={`text-center text-sm font-semibold ${deliveryTab === tab ? "text-[#168b87]" : "text-slate-500"}`}
                      >
                        {tab === "DELIVERY"
                          ? "Giao tận nơi"
                          : "Nhận tại cửa hàng"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {deliveryTab === "DELIVERY" ? (
                  <View className="mt-4 gap-3">
                    {!customerLoading &&
                      !customerError &&
                      !customer?.addresses?.length && (
                        <>
                          <Text className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                            Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ trong
                            trang thông tin cá nhân.
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setIsDeliveryModalOpen(false);
                              router.push(
                                "/customer/profile/customer-information",
                              );
                            }}
                            className="min-h-11 justify-center"
                          >
                            <Text className="font-semibold text-[#168b87]">
                              Thêm địa chỉ ›
                            </Text>
                          </Pressable>
                        </>
                      )}
                    {customer?.addresses?.map((address) => {
                      const selected =
                        selectedAddress?.customer_address_id ===
                        address.customer_address_id;
                      return (
                        <Pressable
                          key={address.customer_address_id}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          onPress={() => setSelectedAddress(address)}
                          className={`rounded-xl border p-4 ${selected ? "border-[#168b87] bg-[#f0faf9]" : "border-slate-200"}`}
                        >
                          <Text className="text-sm font-semibold">
                            {address.customer_address_line}
                          </Text>
                          {address.customer_address_default && (
                            <Text className="mt-1 text-xs text-[#168b87]">
                              Mặc định
                            </Text>
                          )}
                          <Text className="mt-1 text-sm text-slate-600">
                            {address.customer_address_ward},{" "}
                            {address.customer_address_province}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      accessibilityRole="button"
                      disabled={
                        !selectedAddress ||
                        !receiverPhone.trim() ||
                        !customer?.customer_full_name?.trim()
                      }
                      onPress={handleConfirmDelivery}
                      className={`items-center rounded-xl bg-[#168b87] p-4 ${!selectedAddress || !receiverPhone.trim() || !customer?.customer_full_name?.trim() ? "opacity-40" : ""}`}
                    >
                      <Text className="font-bold text-white">
                        Xác nhận thông tin
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className="mt-4 gap-3">
                    {loadingBranches ? (
                      <ActivityIndicator color="#168b87" />
                    ) : branchError ? (
                      <View className="rounded-xl bg-red-50 p-4">
                        <Text className="text-sm text-red-600">
                          {branchError}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={fetchBranches}
                          className="min-h-11 justify-center"
                        >
                          <Text className="font-semibold text-[#168b87]">
                            Thử lại
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        {branches.length === 0 && (
                          <Text className="py-4 text-sm text-slate-500">
                            Hiện không có cửa hàng nhận hàng.
                          </Text>
                        )}
                        {branches.map((branch) => {
                          const selected =
                            selectedBranch?.branch_id === branch.branch_id;
                          return (
                            <View
                              key={branch.branch_id}
                              className={`rounded-xl border p-4 ${selected ? "border-[#168b87] bg-[#f0faf9]" : "border-slate-200"}`}
                            >
                              <Pressable
                                accessibilityRole="radio"
                                accessibilityState={{ checked: selected }}
                                onPress={() => setSelectedBranch(branch)}
                              >
                                <Text className="font-bold">
                                  {branch.branch_name}
                                </Text>
                                <Text className="mt-1 text-xs text-slate-500">
                                  {branch.branch_code}
                                </Text>
                                {branch.address && (
                                  <Text className="mt-2 text-sm text-slate-600">
                                    {branch.address.branch_address_address_line}
                                    , {branch.address.branch_address_ward},{" "}
                                    {branch.address.branch_address_province}
                                  </Text>
                                )}
                                <Text className="mt-2 text-xs text-slate-500">
                                  Điện thoại: {branch.branch_phone}
                                </Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => setBusinessHourBranch(branch)}
                                className="min-h-11 justify-center"
                              >
                                <Text className="text-xs font-semibold text-[#168b87]">
                                  Giờ hoạt động ›
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      disabled={
                        !selectedBranch?.address ||
                        !receiverPhone.trim() ||
                        !customer?.customer_full_name?.trim()
                      }
                      onPress={handleConfirmPickup}
                      className={`items-center rounded-xl bg-[#168b87] p-4 ${!selectedBranch?.address || !receiverPhone.trim() || !customer?.customer_full_name?.trim() ? "opacity-40" : ""}`}
                    >
                      <Text className="font-bold text-white">
                        Xác nhận cửa hàng
                      </Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            </View>
            {/* Đặt giờ hoạt động cùng modal để không chồng native modal trên iOS. */}
            {businessHourBranch && (
              <View className="absolute inset-0 justify-center bg-black/50 p-5">
                <View className="max-h-[90%] rounded-2xl bg-white p-5">
                  <View className="flex-row items-center justify-between">
                    <Text
                      accessibilityRole="header"
                      className="flex-1 text-lg font-bold"
                    >
                      Giờ hoạt động
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Đóng giờ hoạt động"
                      onPress={() => setBusinessHourBranch(null)}
                      className="h-11 w-11 items-center justify-center"
                    >
                      <Text className="text-2xl">×</Text>
                    </Pressable>
                  </View>
                  <Text className="mb-4 text-xs text-slate-500">
                    {businessHourBranch.branch_name}
                  </Text>
                  <ScrollView>
                    {businessHourBranch.businessHours.map((hour) => (
                      <View
                        key={hour.branch_business_hour_id}
                        className="mb-2 flex-row flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3"
                      >
                        <Text className="text-sm">
                          {dayOfWeekLabels[
                            hour.branch_business_hour_day_of_week
                          ] ?? hour.branch_business_hour_day_of_week}
                        </Text>
                        <Text className="text-sm font-semibold">
                          {hour.branch_business_hour_is_closed
                            ? "Đóng cửa"
                            : `${hour.branch_business_hour_open_time} - ${hour.branch_business_hour_close_time}`}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal coupon */}
      <Modal
        visible={isCouponModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCouponModalOpen(false)}
      >
        <View
          className="flex-1 justify-end bg-black/50"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng mã giảm giá"
            className="flex-1"
            onPress={() => setIsCouponModalOpen(false)}
          />
          <View
            className="max-h-[90%] rounded-t-3xl bg-white"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-3">
              <View className="flex-1">
                <Text accessibilityRole="header" className="text-lg font-bold">
                  Chọn mã giảm giá
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Chỉ áp dụng một coupon cho mỗi đơn hàng
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng mã giảm giá"
                onPress={() => setIsCouponModalOpen(false)}
                className="h-11 w-11 items-center justify-center"
              >
                <Text className="text-2xl text-slate-400">×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {couponLoading ? (
                <ActivityIndicator color="#168b87" />
              ) : couponError ? (
                <View className="rounded-xl bg-red-50 p-4">
                  <Text className="text-sm text-red-600">{couponError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={fetchCoupons}
                    className="min-h-11 justify-center"
                  >
                    <Text className="font-semibold text-[#168b87]">
                      Thử lại
                    </Text>
                  </Pressable>
                </View>
              ) : coupons.length === 0 ? (
                <Text className="py-8 text-center text-sm text-slate-500">
                  Hiện không có mã giảm giá.
                </Text>
              ) : (
                coupons.map((coupon) => {
                  const eligible = subtotal >= toNumber(coupon.minOrderValue);
                  const discount = calculateCouponDiscount(coupon);
                  const selected = selectedCoupon?.couponId === coupon.couponId;
                  return (
                    <View
                      key={coupon.couponId}
                      className={`mb-3 rounded-xl border p-4 ${selected ? "border-[#168b87] bg-[#f0faf9]" : "border-slate-200"} ${eligible ? "" : "opacity-60"}`}
                    >
                      <Text className="font-bold">
                        Coupon #{coupon.couponId}
                      </Text>
                      <Text className="mt-1 text-sm font-semibold text-red-600">
                        {coupon.discountType === "PERCENTAGE"
                          ? `Giảm ${coupon.discountValue}%`
                          : `Giảm ${formatPrice(toNumber(coupon.discountValue))} ₫`}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        Đơn tối thiểu{" "}
                        {formatPrice(toNumber(coupon.minOrderValue))} ₫
                      </Text>
                      {!eligible && (
                        <Text className="mt-1 text-xs text-red-500">
                          Chưa đủ điều kiện áp dụng
                        </Text>
                      )}
                      {eligible && (
                        <Text className="mt-3 text-xs text-green-700">
                          Được giảm {formatPrice(discount)} ₫
                        </Text>
                      )}
                      <Pressable
                        accessibilityRole="button"
                        disabled={!eligible}
                        onPress={() => {
                          setSelectedCoupon(coupon);
                          setIsCouponModalOpen(false);
                        }}
                        className={`mt-3 items-center rounded-lg bg-[#168b87] p-3 ${eligible ? "" : "opacity-40"}`}
                      >
                        <Text className="text-xs font-bold text-white">
                          {selected ? "Đã chọn" : "Áp dụng"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
