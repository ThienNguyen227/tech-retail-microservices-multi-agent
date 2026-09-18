// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";

// type CartItem = {
//   productId: string;
//   sku: string;
//   variantSlug: string;
//   productName: string;
//   imageUrl: string;
//   quantity: number;
//   price: number;
// };

// type Cart = {
//   userId: string;
//   items: CartItem[];
//   totalPrice: number;
// };

// export default function CartPage() {
//   const router = useRouter();
//   const [cart, setCart] = useState<Cart | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");
//   const [deletingSku, setDeletingSku] = useState<string | null>(null);
//   const [clearing, setClearing] = useState<boolean>(false);
//   const [updatingSkus, setUpdatingSkus] = useState<Set<string>>(new Set());


//   useEffect(() => {
//     const userId =
//       localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

//     if (!userId) {
//       router.push("/customer/login");
//       return;
//     }

//     async function fetchCart() {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `http://localhost:3004/api/v1/carts?userId=${userId}`
//         );

//         if (!res.ok) {
//           throw new Error("Không thể tải thông tin giỏ hàng");
//         }

//         const data = await res.json();
//         setCart(data.cart || data);
//       } catch (err: any) {
//         setError(err.message || "Đã xảy ra lỗi khi tải giỏ hàng");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchCart();
//   }, [router]);

//   // HÀM TĂNG / GIẢM SỐ LƯỢNG SẢN PHẨM
//   const handleUpdateQuantity = async (sku: string, action: 'increase' | 'decrease') => {
//     const userId =
//       localStorage.getItem('userId') ?? sessionStorage.getItem('userId');
//     if (!userId) return;

//     try {
//       setUpdatingSkus((prev) => new Set(prev).add(sku));
//       const res = await fetch('http://localhost:3004/api/v1/carts/update-quantity', {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userId, sku, action }),
//       });

//       if (!res.ok) {
//         throw new Error('Cập nhật số lượng thất bại!');
//       }

//       const updatedCart = await res.json();
//       setCart(updatedCart);
//       window.dispatchEvent(new Event('cart-updated'));
//     } catch (err: any) {
//       alert(err.message || 'Có lỗi xảy ra khi cập nhật số lượng');
//     } finally {
//       setUpdatingSkus((prev) => {
//         const next = new Set(prev);
//         next.delete(sku);
//         return next;
//       });
//     }
//   };

//   // HÀM XÓA 1 SẢN PHẨM KHỎI GIỎ HÀNG
//   const handleRemoveItem = async (sku: string) => {
//     const confirmDelete = window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?");
//     if (!confirmDelete) return;

//     const userId =
//       localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

//     if (!userId) return;

//     try {
//       setDeletingSku(sku);
//       const res = await fetch(
//         `http://localhost:3004/api/v1/carts/remove-item?userId=${userId}&sku=${sku}`,
//         {
//           method: "DELETE",
//         }
//       );

//       if (!res.ok) {
//         throw new Error("Xóa sản phẩm thất bại!");
//       }

//       const updatedCart = await res.json();
//       setCart(updatedCart);

//       // Bắn sự kiện để Header cập nhật lại số lượng ngay lập tức
//       window.dispatchEvent(new Event("cart-updated"));
//     } catch (err: any) {
//       alert(err.message || "Có lỗi xảy ra khi xóa sản phẩm");
//     } finally {
//       setDeletingSku(null);
//     }
//   };

//   // HÀM XÓA TOÀN BỘ GIỎ HÀNG
//   const handleClearCart = async () => {
//     const confirmClear = window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?");
//     if (!confirmClear) return;

//     const userId =
//       localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

//     if (!userId) return;

//     try {
//       setClearing(true);
//       const res = await fetch(
//         `http://localhost:3004/api/v1/carts/clear?userId=${userId}`,
//         {
//           method: "DELETE",
//         }
//       );

//       if (!res.ok) {
//         throw new Error("Xóa toàn bộ giỏ hàng thất bại!");
//       }

//       const updatedCart = await res.json();
//       setCart(updatedCart);

//       // Bắn sự kiện để Header cập nhật lại badge về 0
//       window.dispatchEvent(new Event("cart-updated"));
//     } catch (err: any) {
//       alert(err.message || "Có lỗi xảy ra khi làm trống giỏ hàng");
//     } finally {
//       setClearing(false);
//     }
//   };

//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat("vi-VN").format(price);
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center">
//         <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#168b87] border-t-transparent"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="mx-auto max-w-4xl px-4 py-16 text-center">
//         <p className="text-red-500">{error}</p>
//         <button
//           onClick={() => window.location.reload()}
//           className="mt-4 rounded-xl bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
//         >
//           Thử lại
//         </button>
//       </div>
//     );
//   }

//   const items = cart?.items || [];

//   return (
//     <div className="min-h-screen bg-[#f8fafc] py-8">
//       <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
//         {/* Header Breadcrumb */}
//         <div className="mb-6 flex items-center justify-between">
//           <Link
//             href="/customer/home"
//             className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#168b87]"
//           >
//             <ArrowLeft size={16} />
//             Tiếp tục mua sắm
//           </Link>

//           {/* Nút Xóa tất cả khi giỏ có hàng */}
//           {items.length > 0 && (
//             <button
//               type="button"
//               onClick={handleClearCart}
//               disabled={clearing}
//               className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
//             >
//               <Trash2 size={16} />
//               {clearing ? "Đang xóa..." : "Xóa tất cả"}
//             </button>
//           )}
//         </div>

//         <div className="mb-6 flex items-center justify-between">
//           <h1 className="text-2xl font-bold text-slate-900">
//             Giỏ hàng của bạn
//           </h1>
//           <span className="text-sm text-slate-500">
//             {items.length} loại sản phẩm
//           </span>
//         </div>

//         {items.length === 0 ? (
//           /* Empty State */
//           <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
//             <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e6f5f4] text-[#168b87]">
//               <ShoppingBag size={32} />
//             </div>
//             <h2 className="mt-4 text-lg font-bold text-slate-800">
//               Giỏ hàng của bạn đang trống
//             </h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Hãy dạo qua các sản phẩm nổi bật để chọn món đồ ưng ý nhé!
//             </p>
//             <Link
//               href="/customer/home"
//               className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#168b87] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#10736f]"
//             >
//               Khám phá sản phẩm ngay
//             </Link>
//           </div>
//         ) : (
//           /* Cart Content Layout */
//           <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
//             {/* List Cart Items */}
//             <div className="space-y-4 lg:col-span-8">
//               {items.map((item) => (
//                 <div
//                   key={item.sku}
//                   className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow sm:flex-row sm:items-center sm:justify-between"
//                 >
//                   {/* Thumbnail & Title */}
//                   <div className="flex items-center gap-4">
//                     <Link
//                       href={`/customer/product-detail/${item.variantSlug}`}
//                       className="aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2"
//                     >
//                       <img
//                         src={`/product/phone/${item.imageUrl}`}
//                         alt={item.productName}
//                         className="h-full w-full object-contain"
//                       />
//                     </Link>

//                     <div>
//                       <Link
//                         href={`/customer/product-detail/${item.variantSlug}`}
//                         className="line-clamp-2 text-sm font-bold text-slate-800 transition hover:text-[#168b87]"
//                       >
//                         {item.productName}
//                       </Link>
//                       <p className="mt-1 text-xs text-slate-400">
//                         SKU: <span className="font-medium text-slate-600">{item.sku}</span>
//                       </p>
//                       <p className="mt-1 text-sm font-semibold text-red-600 sm:hidden">
//                         {formatPrice(item.price)} ₫
//                       </p>
//                     </div>
//                   </div>

//                   {/* Quantity, Total & Delete Action */}
//                   <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:gap-6">
//                     <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1">
//                       {/* Nút giảm */}
//                       <button
//                         type="button"
//                         onClick={() => handleUpdateQuantity(item.sku, 'decrease')}
//                         disabled={updatingSkus.has(item.sku) || item.quantity <= 1}
//                         className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:shadow disabled:opacity-40"
//                         title="Giảm số lượng"
//                       >
//                         <span className="text-lg font-bold leading-none">−</span>
//                       </button>

//                       {/* Số lượng */}
//                       <span className="min-w-[24px] text-center text-sm font-semibold text-slate-800">
//                         {updatingSkus.has(item.sku) ? '...' : item.quantity}
//                       </span>

//                       {/* Nút tăng */}
//                       <button
//                         type="button"
//                         onClick={() => handleUpdateQuantity(item.sku, 'increase')}
//                         disabled={updatingSkus.has(item.sku)}
//                         className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:shadow disabled:opacity-40"
//                         title="Tăng số lượng"
//                       >
//                         <span className="text-lg font-bold leading-none">+</span>
//                       </button>
//                     </div>

//                     <div className="text-right">
//                       <p className="text-sm font-bold text-red-600">
//                         {formatPrice(item.price * item.quantity)} ₫
//                       </p>
//                       <p className="hidden text-xs text-slate-400 sm:block">
//                         {formatPrice(item.price)} ₫ / sp
//                       </p>
//                     </div>

//                     {/* Nút xóa sản phẩm */}
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveItem(item.sku)}
//                       disabled={deletingSku === item.sku}
//                       className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//                       title="Xóa sản phẩm"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Order Summary Checkout */}
//             <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
//               <h2 className="text-base font-bold text-slate-900">
//                 Tóm tắt đơn hàng
//               </h2>

//               <div className="mt-4 space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-4">
//                 <div className="flex justify-between">
//                   <span>Tạm tính</span>
//                   <span className="font-semibold text-slate-800">
//                     {formatPrice(cart?.totalPrice || 0)} ₫
//                   </span>
//                 </div>
//               </div>

//               <div className="mt-4 flex items-center justify-between">
//                 <span className="text-base font-bold text-slate-900">Tổng cộng</span>
//                 <span className="text-xl font-extrabold text-red-600">
//                   {formatPrice(cart?.totalPrice || 0)} ₫
//                 </span>
//               </div>

//               <button
//                 type="button"
//                 className="mt-6 w-full rounded-xl bg-[#168b87] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#10736f] hover:shadow active:scale-[0.99]"
//               >
//                 Tiến hành đặt hàng
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Truck,
  Store,
  Clock,
  X,
  MapPin,
  Phone,
} from "lucide-react";

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
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  branch?: Branch;
};

const dayOfWeekLabels: Record<string, string> = {
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "Chủ nhật",
};

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);
  const [updatingSkus, setUpdatingSkus] = useState<Set<string>>(new Set());

  // =========================
  // DELIVERY INFO
  // =========================

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] =
    useState<boolean>(false);

  const [deliveryTab, setDeliveryTab] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  // Form giao tận nơi
  const [deliveryForm, setDeliveryForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    address: "",
  });

  // =========================
  // BRANCH
  // =========================

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [branchError, setBranchError] = useState<string>("");

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Popup giờ hoạt động
  const [businessHourBranch, setBusinessHourBranch] =
    useState<Branch | null>(null);

  // =========================
  // FETCH CART
  // =========================

  useEffect(() => {
    const userId =
      localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

    if (!userId) {
      router.push("/customer/login");
      return;
    }

    async function fetchCart() {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:3004/api/v1/carts?userId=${userId}`,
        );

        if (!res.ok) {
          throw new Error("Không thể tải thông tin giỏ hàng");
        }

        const data = await res.json();
        setCart(data.cart || data);
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi khi tải giỏ hàng");
      } finally {
        setLoading(false);
      }
    }

    fetchCart();
  }, [router]);

  // =========================
  // FETCH BRANCHES
  // =========================

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      setBranchError("");

      const res = await fetch(
        "http://localhost:3005/api/v1/branches?status=ACTIVE",
      );

      if (!res.ok) {
        throw new Error("Không thể tải danh sách cửa hàng");
      }

      const data = await res.json();

      setBranches(data);
    } catch (err: any) {
      setBranchError(
        err.message || "Đã xảy ra lỗi khi tải danh sách cửa hàng",
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  // =========================
  // OPEN DELIVERY MODAL
  // =========================

  const handleOpenDeliveryModal = () => {
    setIsDeliveryModalOpen(true);

    // Mỗi lần mở tab nhận tại cửa hàng thì lấy danh sách branch
    if (branches.length === 0) {
      fetchBranches();
    }
  };

  // =========================
  // CHANGE TAB
  // =========================

  const handleChangeDeliveryTab = (tab: "DELIVERY" | "PICKUP") => {
    setDeliveryTab(tab);

    if (tab === "PICKUP" && branches.length === 0) {
      fetchBranches();
    }
  };

  // =========================
  // CONFIRM DELIVERY
  // =========================

  const handleConfirmDelivery = () => {
    if (!deliveryForm.fullName.trim()) {
      alert("Vui lòng nhập họ và tên.");
      return;
    }

    if (!deliveryForm.phone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }

    if (!deliveryForm.province.trim()) {
      alert("Vui lòng nhập tỉnh/thành phố.");
      return;
    }

    if (!deliveryForm.district.trim()) {
      alert("Vui lòng nhập quận/huyện.");
      return;
    }

    if (!deliveryForm.ward.trim()) {
      alert("Vui lòng nhập phường/xã.");
      return;
    }

    if (!deliveryForm.address.trim()) {
      alert("Vui lòng nhập địa chỉ cụ thể.");
      return;
    }

    setDeliveryInfo({
      type: "DELIVERY",
      ...deliveryForm,
    });

    setIsDeliveryModalOpen(false);
  };

  // =========================
  // CONFIRM PICKUP
  // =========================

  const handleConfirmPickup = () => {
    if (!selectedBranch) {
      alert("Vui lòng chọn cửa hàng nhận hàng.");
      return;
    }

    setDeliveryInfo({
      type: "PICKUP",
      branch: selectedBranch,
    });

    setIsDeliveryModalOpen(false);
  };

  // =========================
  // UPDATE QUANTITY
  // =========================

  const handleUpdateQuantity = async (
    sku: string,
    action: "increase" | "decrease",
  ) => {
    const userId =
      localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

    if (!userId) return;

    try {
      setUpdatingSkus((prev) => new Set(prev).add(sku));

      const res = await fetch(
        "http://localhost:3004/api/v1/carts/update-quantity",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, sku, action }),
        },
      );

      if (!res.ok) {
        throw new Error("Cập nhật số lượng thất bại!");
      }

      const updatedCart = await res.json();
      setCart(updatedCart);

      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi cập nhật số lượng");
    } finally {
      setUpdatingSkus((prev) => {
        const next = new Set(prev);
        next.delete(sku);
        return next;
      });
    }
  };

  // =========================
  // REMOVE ITEM
  // =========================

  const handleRemoveItem = async (sku: string) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
    );

    if (!confirmDelete) return;

    const userId =
      localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

    if (!userId) return;

    try {
      setDeletingSku(sku);

      const res = await fetch(
        `http://localhost:3004/api/v1/carts/remove-item?userId=${userId}&sku=${sku}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error("Xóa sản phẩm thất bại!");
      }

      const updatedCart = await res.json();
      setCart(updatedCart);

      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi xóa sản phẩm");
    } finally {
      setDeletingSku(null);
    }
  };

  // =========================
  // CLEAR CART
  // =========================

  const handleClearCart = async () => {
    const confirmClear = window.confirm(
      "Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?",
    );

    if (!confirmClear) return;

    const userId =
      localStorage.getItem("userId") ?? sessionStorage.getItem("userId");

    if (!userId) return;

    try {
      setClearing(true);

      const res = await fetch(
        `http://localhost:3004/api/v1/carts/clear?userId=${userId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error("Xóa toàn bộ giỏ hàng thất bại!");
      }

      const updatedCart = await res.json();
      setCart(updatedCart);

      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi làm trống giỏ hàng");
    } finally {
      setClearing(false);
    }
  };

  // =========================
  // CHECKOUT
  // =========================

  const handleCheckout = () => {
    if (!deliveryInfo) {
      handleOpenDeliveryModal();
      return;
    }

    // Tạm thời kiểm tra flow.
    // Sau này thay bằng API tạo order.
    alert("Thông tin nhận hàng đã đầy đủ. Tiến hành đặt hàng!");
  };

  // =========================
  // FORMAT
  // =========================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#168b87] border-t-transparent"></div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

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

  const items = cart?.items || [];

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header Breadcrumb */}
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
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {clearing ? "Đang xóa..." : "Xóa tất cả"}
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Giỏ hàng của bạn
          </h1>

          <span className="text-sm text-slate-500">
            {items.length} loại sản phẩm
          </span>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e6f5f4] text-[#168b87]">
              <ShoppingBag size={32} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-800">
              Giỏ hàng của bạn đang trống
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Hãy dạo qua các sản phẩm nổi bật để chọn món đồ ưng ý nhé!
            </p>

            <Link
              href="/customer/home"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#168b87] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#10736f]"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          /* Cart Content */
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">

            {/* List Cart Items */}
            <div className="space-y-4 lg:col-span-8">
              {items.map((item) => (
                <div
                  key={item.sku}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/customer/product-detail/${item.variantSlug}`}
                      className="aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2"
                    >
                      <img
                        src={`/product/phone/${item.imageUrl}`}
                        alt={item.productName}
                        className="h-full w-full object-contain"
                      />
                    </Link>

                    <div>
                      <Link
                        href={`/customer/product-detail/${item.variantSlug}`}
                        className="line-clamp-2 text-sm font-bold text-slate-800 transition hover:text-[#168b87]"
                      >
                        {item.productName}
                      </Link>

                      <p className="mt-1 text-xs text-slate-400">
                        SKU:{" "}
                        <span className="font-medium text-slate-600">
                          {item.sku}
                        </span>
                      </p>

                      <p className="mt-1 text-sm font-semibold text-red-600 sm:hidden">
                        {formatPrice(item.price)} ₫
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:gap-6">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(item.sku, "decrease")
                        }
                        disabled={
                          updatingSkus.has(item.sku) || item.quantity <= 1
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:shadow disabled:opacity-40"
                      >
                        <span className="text-lg font-bold leading-none">
                          −
                        </span>
                      </button>

                      <span className="min-w-[24px] text-center text-sm font-semibold text-slate-800">
                        {updatingSkus.has(item.sku) ? "..." : item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(item.sku, "increase")
                        }
                        disabled={updatingSkus.has(item.sku)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:shadow disabled:opacity-40"
                      >
                        <span className="text-lg font-bold leading-none">
                          +
                        </span>
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatPrice(item.price * item.quantity)} ₫
                      </p>

                      <p className="hidden text-xs text-slate-400 sm:block">
                        {formatPrice(item.price)} ₫ / sp
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.sku)}
                      disabled={deletingSku === item.sku}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* =========================
                ORDER SUMMARY
            ========================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
              <h2 className="text-base font-bold text-slate-900">
                Tóm tắt đơn hàng
              </h2>

              <div className="mt-4 space-y-3 border-b border-slate-100 pb-4 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>

                  <span className="font-semibold text-slate-800">
                    {formatPrice(cart?.totalPrice || 0)} ₫
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">
                  Tổng cộng
                </span>

                <span className="text-xl font-extrabold text-red-600">
                  {formatPrice(cart?.totalPrice || 0)} ₫
                </span>
              </div>

              {/* =========================
                  THÔNG TIN NHẬN HÀNG
              ========================= */}
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

                    {deliveryInfo.type === "DELIVERY" ? (
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {deliveryInfo.fullName}
                        </p>

                        <p>{deliveryInfo.phone}</p>

                        <p>
                          {deliveryInfo.address},{" "}
                          {deliveryInfo.ward},{" "}
                          {deliveryInfo.district},{" "}
                          {deliveryInfo.province}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {deliveryInfo.branch?.branch_name}
                        </p>

                        <p className="flex items-start gap-1">
                          <MapPin size={13} className="mt-0.5 shrink-0" />

                          <span>
                            {
                              deliveryInfo.branch?.address
                                ?.branch_address_address_line
                            }
                            ,{" "}
                            {
                              deliveryInfo.branch?.address
                                ?.branch_address_ward
                            }
                            ,{" "}
                            {
                              deliveryInfo.branch?.address
                                ?.branch_address_province
                            }
                          </span>
                        </p>

                        <p className="flex items-center gap-1">
                          <Phone size={13} />
                          {deliveryInfo.branch?.branch_phone}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenDeliveryModal}
                    className="w-full rounded-xl border border-dashed border-[#168b87] bg-[#f0faf9] p-4 text-left transition hover:bg-[#e6f5f4]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[#168b87] shadow-sm">
                        <MapPin size={20} />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">
                          Vui lòng cung cấp thông tin nhận hàng
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Chọn giao tận nơi hoặc nhận tại cửa hàng
                        </p>
                      </div>

                      <span className="text-lg text-[#168b87]">›</span>
                    </div>
                  </button>
                )}
              </div>

              {/* CHECKOUT */}
              <button
                type="button"
                onClick={handleCheckout}
                className="mt-4 w-full rounded-xl bg-[#168b87] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#10736f] hover:shadow active:scale-[0.99]"
              >
                Tiến hành đặt hàng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          POPUP THÔNG TIN NHẬN HÀNG
      ===================================================== */}
      {isDeliveryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsDeliveryModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Thông tin nhận hàng
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Vui lòng chọn hình thức nhận hàng
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => handleChangeDeliveryTab("DELIVERY")}
                className={`flex items-center justify-center gap-2 border-b-2 py-4 text-sm font-semibold transition ${
                  deliveryTab === "DELIVERY"
                    ? "border-[#168b87] text-[#168b87]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Truck size={18} />
                Giao tận nơi
              </button>

              <button
                type="button"
                onClick={() => handleChangeDeliveryTab("PICKUP")}
                className={`flex items-center justify-center gap-2 border-b-2 py-4 text-sm font-semibold transition ${
                  deliveryTab === "PICKUP"
                    ? "border-[#168b87] text-[#168b87]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Store size={18} />
                Nhận tại cửa hàng
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">

              {/* =========================
                  DELIVERY
              ========================= */}
              {deliveryTab === "DELIVERY" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Họ và tên
                    </label>

                    <input
                      type="text"
                      value={deliveryForm.fullName}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Nhập họ và tên"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#168b87] focus:ring-2 focus:ring-[#168b87]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Số điện thoại
                    </label>

                    <input
                      type="tel"
                      value={deliveryForm.phone}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Nhập số điện thoại"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#168b87] focus:ring-2 focus:ring-[#168b87]/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Tỉnh / Thành phố
                      </label>

                      <input
                        type="text"
                        value={deliveryForm.province}
                        onChange={(e) =>
                          setDeliveryForm({
                            ...deliveryForm,
                            province: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: TP.HCM"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#168b87]"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Quận / Huyện
                      </label>

                      <input
                        type="text"
                        value={deliveryForm.district}
                        onChange={(e) =>
                          setDeliveryForm({
                            ...deliveryForm,
                            district: e.target.value,
                          })
                        }
                        placeholder="Nhập quận / huyện"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#168b87]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Phường / Xã
                    </label>

                    <input
                      type="text"
                      value={deliveryForm.ward}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          ward: e.target.value,
                        })
                      }
                      placeholder="Nhập phường / xã"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#168b87]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Địa chỉ cụ thể
                    </label>

                    <textarea
                      rows={3}
                      value={deliveryForm.address}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          address: e.target.value,
                        })
                      }
                      placeholder="Số nhà, tên đường..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#168b87]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmDelivery}
                    className="w-full rounded-xl bg-[#168b87] py-3 font-bold text-white transition hover:bg-[#10736f]"
                  >
                    Xác nhận thông tin
                  </button>
                </div>
              )}

              {/* =========================
                  PICKUP
              ========================= */}
              {deliveryTab === "PICKUP" && (
                <div>
                  {loadingBranches ? (
                    <div className="flex min-h-[250px] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#168b87] border-t-transparent" />
                    </div>
                  ) : branchError ? (
                    <div className="rounded-xl bg-red-50 p-4 text-center">
                      <p className="text-sm text-red-600">
                        {branchError}
                      </p>

                      <button
                        type="button"
                        onClick={fetchBranches}
                        className="mt-3 rounded-lg bg-[#168b87] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : branches.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-500">
                      Hiện không có cửa hàng nào đang hoạt động.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {branches.map((branch) => {
                        const isSelected =
                          selectedBranch?.branch_id === branch.branch_id;

                        return (
                          <div
                            key={branch.branch_id}
                            onClick={() => setSelectedBranch(branch)}
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              isSelected
                                ? "border-[#168b87] bg-[#f0faf9] ring-1 ring-[#168b87]"
                                : "border-slate-200 hover:border-[#168b87]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Radio */}
                              <div
                                className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                                  isSelected
                                    ? "border-[#168b87]"
                                    : "border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-[#168b87]" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="font-bold text-slate-800">
                                      {branch.branch_name}
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {branch.branch_code}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBusinessHourBranch(branch);
                                    }}
                                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#168b87] hover:underline"
                                  >
                                    <Clock size={14} />
                                    Xem giờ hoạt động
                                  </button>
                                </div>

                                {branch.address && (
                                  <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
                                    <MapPin
                                      size={15}
                                      className="mt-0.5 shrink-0 text-slate-400"
                                    />

                                    <span>
                                      {
                                        branch.address
                                          .branch_address_address_line
                                      }
                                      ,{" "}
                                      {
                                        branch.address
                                          .branch_address_ward
                                      }
                                      ,{" "}
                                      {
                                        branch.address
                                          .branch_address_province
                                      }
                                    </span>
                                  </p>
                                )}

                                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                  <Phone size={14} />
                                  {branch.branch_phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleConfirmPickup}
                        disabled={!selectedBranch}
                        className="mt-4 w-full rounded-xl bg-[#168b87] py-3 font-bold text-white transition hover:bg-[#10736f] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Xác nhận cửa hàng
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          POPUP GIỜ HOẠT ĐỘNG
      ===================================================== */}
      {businessHourBranch && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setBusinessHourBranch(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Giờ hoạt động
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {businessHourBranch.branch_name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBusinessHourBranch(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {businessHourBranch.businessHours.map((hour) => (
                  <div
                    key={hour.branch_business_hour_id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {dayOfWeekLabels[
                        hour.branch_business_hour_day_of_week
                      ] || hour.branch_business_hour_day_of_week}
                    </span>

                    {hour.branch_business_hour_is_closed ? (
                      <span className="text-sm font-semibold text-red-500">
                        Đóng cửa
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-800">
                        {hour.branch_business_hour_open_time} -{" "}
                        {hour.branch_business_hour_close_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setBusinessHourBranch(null)}
                className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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

