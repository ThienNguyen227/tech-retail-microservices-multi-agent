"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";

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

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);
  const [updatingSkus, setUpdatingSkus] = useState<Set<string>>(new Set());


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
          `http://localhost:3004/api/v1/carts?userId=${userId}`
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

  // HÀM TĂNG / GIẢM SỐ LƯỢNG SẢN PHẨM
  const handleUpdateQuantity = async (sku: string, action: 'increase' | 'decrease') => {
    const userId =
      localStorage.getItem('userId') ?? sessionStorage.getItem('userId');
    if (!userId) return;

    try {
      setUpdatingSkus((prev) => new Set(prev).add(sku));
      const res = await fetch('http://localhost:3004/api/v1/carts/update-quantity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sku, action }),
      });

      if (!res.ok) {
        throw new Error('Cập nhật số lượng thất bại!');
      }

      const updatedCart = await res.json();
      setCart(updatedCart);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi cập nhật số lượng');
    } finally {
      setUpdatingSkus((prev) => {
        const next = new Set(prev);
        next.delete(sku);
        return next;
      });
    }
  };

  // HÀM XÓA 1 SẢN PHẨM KHỎI GIỎ HÀNG
  const handleRemoveItem = async (sku: string) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?");
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
        }
      );

      if (!res.ok) {
        throw new Error("Xóa sản phẩm thất bại!");
      }

      const updatedCart = await res.json();
      setCart(updatedCart);

      // Bắn sự kiện để Header cập nhật lại số lượng ngay lập tức
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi xóa sản phẩm");
    } finally {
      setDeletingSku(null);
    }
  };

  // HÀM XÓA TOÀN BỘ GIỎ HÀNG
  const handleClearCart = async () => {
    const confirmClear = window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?");
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
        }
      );

      if (!res.ok) {
        throw new Error("Xóa toàn bộ giỏ hàng thất bại!");
      }

      const updatedCart = await res.json();
      setCart(updatedCart);

      // Bắn sự kiện để Header cập nhật lại badge về 0
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi làm trống giỏ hàng");
    } finally {
      setClearing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#168b87] border-t-transparent"></div>
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

  const items = cart?.items || [];

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

          {/* Nút Xóa tất cả khi giỏ có hàng */}
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
          /* Cart Content Layout */
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
                        SKU: <span className="font-medium text-slate-600">{item.sku}</span>
                      </p>
                      <p className="mt-1 text-sm font-semibold text-red-600 sm:hidden">
                        {formatPrice(item.price)} ₫
                      </p>
                    </div>
                  </div>

                  {/* Quantity, Total & Delete Action */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:gap-6">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1">
                      {/* Nút giảm */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.sku, 'decrease')}
                        disabled={updatingSkus.has(item.sku) || item.quantity <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:shadow disabled:opacity-40"
                        title="Giảm số lượng"
                      >
                        <span className="text-lg font-bold leading-none">−</span>
                      </button>

                      {/* Số lượng */}
                      <span className="min-w-[24px] text-center text-sm font-semibold text-slate-800">
                        {updatingSkus.has(item.sku) ? '...' : item.quantity}
                      </span>

                      {/* Nút tăng */}
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.sku, 'increase')}
                        disabled={updatingSkus.has(item.sku)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:shadow disabled:opacity-40"
                        title="Tăng số lượng"
                      >
                        <span className="text-lg font-bold leading-none">+</span>
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

                    {/* Nút xóa sản phẩm */}
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

            {/* Order Summary Checkout */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
              <h2 className="text-base font-bold text-slate-900">
                Tóm tắt đơn hàng
              </h2>

              <div className="mt-4 space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(cart?.totalPrice || 0)} ₫
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">Tổng cộng</span>
                <span className="text-xl font-extrabold text-red-600">
                  {formatPrice(cart?.totalPrice || 0)} ₫
                </span>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-[#168b87] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#10736f] hover:shadow active:scale-[0.99]"
              >
                Tiến hành đặt hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}