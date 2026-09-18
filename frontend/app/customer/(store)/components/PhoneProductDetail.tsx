'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Check,
  ShoppingCart,
  Zap,
} from 'lucide-react';

export type ProductVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type Phone = {
  _id: string;
  id?: string;

  name: string;
  slug: string;
  image: string;

  brandId: string;
  categoryId: string;

  screenTech?: string;
  screenSize?: string;

  variants: ProductVariant[];

  specifications?: {
    chip?: string;
    ram?: string;
    storage?: string;
    rearCamera?: string;
    frontCamera?: string;
    battery?: string;
    [key: string]: any;
  };

  performanceAndStorage?: {
    os?: string;
    cpu?: string;
    cpuSpeed?: string;
    gpu?: string;
    ram?: string;
    internalStorage?: string;
    usableStorage?: string;
    contactsStorage?: string;
  };

  cameraAndScreen?: {
    rearCameraResolution?: string;
    rearVideoRecording?: string[];
    rearFlashlight?: boolean;
    rearCameraFeatures?: string[];

    frontCameraResolution?: string;
    frontCameraFeatures?: string[];

    screenTechnology?: string;
    screenResolution?: string;
    screenSize?: string;
    refreshRate?: string;
    maxBrightness?: string;
    touchScreenGlass?: string;
  };

  batteryAndCharge?: {
    batteryLife?: string;
    batteryType?: string;
    maxChargingPower?: string;
    batteryFeatures?: string[];
  };

  utilities?: {
    advancedSecurity?: string;
    specialFeatures?: string[];
    waterResistance?: string;
    audioRecording?: string[];
    supportedVideoFormats?: string[];
    supportedAudioFormats?: string[];
  };

  connectivity?: {
    mobileNetwork?: string;
    simType?: string;
    wifi?: string[];
    gps?: string[];
    bluetooth?: string;
    connectorPort?: string;
    headphoneJack?: string;
    otherConnectivity?: string;
  };

  designAndMaterials?: {
    designType?: string;
    materials?: string;
    dimensions?: string;
    weight?: string;
    releaseDate?: string;
  };
};

type PhoneProductDetailProps = {
  product: Phone;
  selectedSlug: string;
};

type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

/* =========================================================
   DETAIL SECTION
========================================================= */

function DetailSection({title, children, defaultOpen = false}: DetailSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-bold text-slate-800">
          {title}
        </span>

        <ChevronDown
          size={19}
          className={`text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({label, value}: {label: string; value?: string | number | boolean;}) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium leading-6 text-slate-800">
        {typeof value === 'boolean'
          ? value
            ? 'Có'
            : 'Không'
          : value}
      </span>
    </div>
  );
}

/* =========================================================
   INFO LIST
========================================================= */

function InfoList({label, items,}: {label: string; items?: string[];}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="mb-2 text-sm text-slate-500">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs leading-5 text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PhoneProductDetail({product, selectedSlug}: PhoneProductDetailProps) {
  const router = useRouter();

  /* =======================================================
     TÌM VARIANT THEO SLUG TRÊN URL
     
     Ví dụ:
     /iphone-17-pro-max-512gb-xanh-dam

     => tìm đúng variant:
     storage = 512GB
     color = Xanh đậm
  ======================================================= */

  const initialVariant = product.variants.find((variant) => variant.slug === selectedSlug) ?? product.variants[0];

  const [selectedStorage, setSelectedStorage] = useState<string>(initialVariant?.storage ?? '');

  const [selectedColor, setSelectedColor] = useState<string>(initialVariant?.colorSlug ?? '');
  
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  /* =======================================================
     DANH SÁCH DUNG LƯỢNG
  ======================================================= */

  const storages = [...new Set(product.variants.map((variant) => variant.storage))];

  /* =======================================================
     DANH SÁCH MÀU
  ======================================================= */

  const colors = product.variants.reduce<
    { name: string; slug: string }[]
  >((result, variant) => {
    const exists = result.some(
      (color) => color.slug === variant.colorSlug,
    );

    if (!exists) {
      result.push({
        name: variant.color,
        slug: variant.colorSlug,
      });
    }

    return result;
  }, []);

  /* =======================================================
     TÌM VARIANT ĐANG ĐƯỢC CHỌN
  ======================================================= */

  const selectedVariant =
    product.variants.find(
      (variant) =>
        variant.storage === selectedStorage &&
        variant.colorSlug === selectedColor,
    ) ?? initialVariant;

  /* =======================================================
     FORMAT PRICE
  ======================================================= */

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  /* =======================================================
     ĐỔI DUNG LƯỢNG
     
     Giữ nguyên màu hiện tại.
     
     Ví dụ:
     256GB + Xanh đậm
          ↓
     512GB + Xanh đậm
  ======================================================= */

  function handleStorageChange(
    storage: string,
  ) {
    const variant = product.variants.find(
      (item) =>
        item.storage === storage &&
        item.colorSlug === selectedColor,
    );

    if (!variant) {
      return;
    }

    setSelectedStorage(storage);

    router.push(
      `/customer/product-detail/${variant.slug}`,
    );
  }

  /* =======================================================
     ĐỔI MÀU
     
     Giữ nguyên dung lượng hiện tại.
     
     Ví dụ:
     512GB + Xanh đậm
          ↓
     512GB + Bạc
  ======================================================= */

  function handleColorChange(colorSlug: string) {
    const variant = product.variants.find(
      (item) =>
        item.storage === selectedStorage &&
        item.colorSlug === colorSlug,
    );

    if (!variant) {
      return;
    }

    setSelectedColor(colorSlug);

    router.push(`/customer/product-detail/${variant.slug}`);
  }

  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  /* =======================================================
     THÊM VÀO GIỎ HÀNG
  ======================================================= */
  // async function handleAddToCart() {
  //   const userId = sessionStorage.getItem("userId");

  //   // 1. Kiểm tra tồn kho
  //   const inventoryRes = await fetch(
  //     `http://localhost:3006/api/v1/inventories/check?sku=${encodeURIComponent(
  //       selectedVariant.sku,
  //     )}&branch_id=1`,
  //   );

  //   const inventoryData = await inventoryRes.json();

  //   if (!inventoryRes.ok) {
  //     throw new Error(
  //       inventoryData?.message || "Không thể kiểm tra tồn kho",
  //     );
  //   }

  //   // 2. Lấy cart hiện tại
  //   const cartRes = await fetch(
  //     `http://localhost:3004/api/v1/carts?userId=${userId}`,
  //   );

  //   const cartData = await cartRes.json();

  //   if (!cartRes.ok) {
  //     throw new Error(
  //       cartData?.message || "Không thể lấy giỏ hàng",
  //     );
  //   }

  //   // 3. Tìm SKU trong cart
  //   const cart = cartData.cart || cartData;

  //   const existingItem = cart.items?.find(
  //     (item: any) => item.sku === selectedVariant.sku,
  //   );

  //   const currentCartQuantity = existingItem?.quantity ?? 0;

  //   // 4. Kiểm tra giới hạn
  //   if (
  //     currentCartQuantity + 1 >
  //     inventoryData.quantity
  //   ) {
  //     throw new Error(
  //       `Sản phẩm chỉ còn ${inventoryData.quantity} sản phẩm trong kho. ` +
  //       `Bạn đang có ${currentCartQuantity} sản phẩm trong giỏ.`,
  //     );
  //   }

  //   if (!selectedVariant) {
  //     alert("Vui lòng chọn phiên bản sản phẩm!");
  //     return;
  //   }

  //   if (!userId) {
  //     alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
  //     router.push("/customer/login");
  //     return;
  //   }

  //   const image =
  //     selectedVariant.images && selectedVariant.images.length > 0
  //       ? selectedVariant.images[0]
  //       : product.image;

  //   const payload = {
  //     userId,
  //     item: {
  //       productId: product._id,
  //       sku: selectedVariant.sku, 
  //       variantSlug: selectedVariant.slug,
  //       productName: `${product.name} ${selectedVariant.storage} ${selectedVariant.color}`,
  //       imageUrl: image,
  //       quantity: 1,
  //       price: selectedVariant.price,
  //     },
  //   };

  //   try {
  //     setIsAddingToCart(true);
  //     // console.log("PAYLOAD GỬI ĐI:", payload);
  //     const res = await fetch("http://localhost:3004/api/v1/carts/add", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json().catch(() => null);

  //     if (!res.ok) {
  //       // In ra lỗi chính xác do Backend trả về
  //       const errorMessage = data?.message || `Lỗi HTTP ${res.status}: Thêm vào giỏ hàng thất bại!`;
  //       throw new Error(Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage);
  //     }

  //     alert("Thêm vào giỏ hàng thành công!");
  //     window.dispatchEvent(new Event("cart-updated"));
  //   } catch (err: any) {
  //     console.error(err);
  //     alert(err.message || "Có lỗi xảy ra khi thêm vào giỏ hàng!");
  //   } finally {
  //     setIsAddingToCart(false);
  //   }
  // }
  async function handleAddToCart() {
    try {
      if (!selectedVariant) {
        alert("Vui lòng chọn phiên bản sản phẩm!");
        return;
      }

      const userId = sessionStorage.getItem("userId");

      if (!userId) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        router.push("/customer/login");
        return;
      }

      setIsAddingToCart(true);

      // 1. Kiểm tra tồn kho
      const inventoryRes = await fetch(
        `http://localhost:3006/api/v1/inventories/check?sku=${encodeURIComponent(
          selectedVariant.sku,
        )}&branch_id=1`,
      );

      const inventoryData = await inventoryRes.json();

      if (!inventoryRes.ok) {
        throw new Error(
          inventoryData?.message || "Không thể kiểm tra tồn kho",
        );
      }

      // 2. Lấy cart hiện tại
      const cartRes = await fetch(
        `http://localhost:3004/api/v1/carts?userId=${userId}`,
      );

      const cartData = await cartRes.json();

      if (!cartRes.ok) {
        throw new Error(
          cartData?.message || "Không thể lấy giỏ hàng",
        );
      }

      // 3. Tìm sản phẩm trong cart
      const cart = cartData.cart || cartData;

      const existingItem = cart.items?.find(
        (item: any) => item.sku === selectedVariant.sku,
      );

      const currentCartQuantity = existingItem?.quantity ?? 0;

      // 4. Kiểm tra tồn kho
      if (currentCartQuantity + 1 > inventoryData.quantity) {
        throw new Error(
          `Sản phẩm chỉ còn ${inventoryData.quantity} sản phẩm trong kho. ` +
          `Bạn đang có ${currentCartQuantity} sản phẩm trong giỏ.`,
        );
      }

      // 5. Chuẩn bị payload
      const image =
        selectedVariant.images && selectedVariant.images.length > 0
          ? selectedVariant.images[0]
          : product.image;

      const payload = {
        userId,
        item: {
          productId: product._id,
          sku: selectedVariant.sku,
          variantSlug: selectedVariant.slug,
          productName: `${product.name} ${selectedVariant.storage} ${selectedVariant.color}`,
          imageUrl: image,
          quantity: 1,
          price: selectedVariant.price,
        },
      };

      // 6. Thêm vào cart
      const res = await fetch(
        "http://localhost:3004/api/v1/carts/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMessage =
          data?.message ||
          `Lỗi HTTP ${res.status}: Thêm vào giỏ hàng thất bại!`;

        throw new Error(
          Array.isArray(errorMessage)
            ? errorMessage.join(", ")
            : errorMessage,
        );
      }

      alert("Thêm vào giỏ hàng thành công!");

      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      console.error(err);

      alert(
        err?.message ||
          "Có lỗi xảy ra khi thêm vào giỏ hàng!",
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-7">
          <p className="text-sm text-slate-500">
            Điện thoại / Sản phẩm
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {product.name}
          </h1>
        </div>

        {/* =================================================
            PRODUCT TOP
        ================================================= */}

        <div className="mb-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">

          {/* ================= IMAGE ================= */}
          <div className="h-full lg:col-span-5">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

              {/* MAIN IMAGE */}
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
                {selectedVariant?.images?.length > 0 ? (
                  <img
                    src={`/product/phone/${selectedVariant.images[selectedImageIndex]}`}
                    alt={`${product.name} ${selectedVariant.color}`}
                    className="h-full w-full object-contain p-8 transition-all duration-300"
                  />
                ) : (
                  <img
                    src={`/product/phone/${product.image}`}
                    alt={product.name}
                    className="h-full w-full object-contain p-8"
                  />
                )}
              </div>

              {/* IMAGE THUMBNAILS */}
              {selectedVariant?.images &&
                selectedVariant.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {selectedVariant.images.map((image, index) => {
                      const isSelected =
                        index === selectedImageIndex;

                      return (
                        <button
                          key={image}
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex(index)
                          }
                          className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                            isSelected
                              ? 'border-[#168b87] ring-2 ring-[#168b87]/20'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={`/product/phone/${image}`}
                            alt={`${product.name} ${index + 1}`}
                            className="h-full w-full object-contain p-2"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>

          {/* ================= BASIC INFO ================= */}

          <div className="lg:col-span-7">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              {/* NAME */}

              <div className="border-b border-slate-100 pb-5">
                <p className="text-sm text-slate-500">
                  Sản phẩm
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {product.name}
                </h2>

                {selectedVariant && (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedVariant.storage} ·{' '}
                    {selectedVariant.color}
                  </p>
                )}
              </div>

              {/* PRICE */}

              <div className="py-5">
                <p className="text-sm text-slate-500">
                  Giá bán
                </p>

                <p className="mt-1 text-3xl font-extrabold text-red-600">
                  {selectedVariant
                    ? `${formatPrice(
                        selectedVariant.price,
                      )} ₫`
                    : 'Liên hệ'}
                </p>
              </div>

              {/* ================= STORAGE ================= */}

              <div className="border-y border-slate-100 py-5">
                <h3 className="text-sm font-bold text-slate-800">
                  Dung lượng
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {storages.map((storage) => {
                    const isSelected = storage === selectedStorage;

                    const available = product.variants.some(
                      (variant) =>
                        variant.storage === storage &&
                        variant.colorSlug === selectedColor,
                    );

                    return (
                      <button
                        key={storage}
                        type="button"
                        disabled={!available}
                        onClick={() => handleStorageChange(storage)}
                        className={`relative rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                          isSelected
                            ? 'border-[#168b87] bg-[#e6f5f4] text-[#168b87]'
                            : available
                              ? 'border-slate-200 bg-white text-slate-700 hover:border-[#168b87]'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                      >
                        {storage}

                        {isSelected && (
                          <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#168b87] text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= COLOR ================= */}

              <div className="border-b border-slate-100 py-5">
                <h3 className="text-sm font-bold text-slate-800">
                  Màu sắc
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Màu: {selectedVariant?.color}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const isSelected =
                      color.slug === selectedColor;

                    const available = product.variants.some(
                      (variant) =>
                        variant.storage === selectedStorage &&
                        variant.colorSlug === color.slug,
                    );

                    return (
                      <button
                        key={color.slug}
                        type="button"
                        disabled={!available}
                        onClick={() =>
                          handleColorChange(color.slug)
                        }
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 transition ${
                          isSelected
                            ? 'border-[#168b87] bg-[#e6f5f4]'
                            : available
                              ? 'border-slate-200 bg-white hover:border-[#168b87]'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-40'
                        }`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full border ${
                            color.slug === 'bac'
                              ? 'border-slate-300 bg-white'
                              : color.slug === 'xanh-dam'
                                ? 'border-slate-700 bg-slate-800'
                                : 'border-orange-500 bg-orange-500'
                          }`}
                        />

                        <span
                          className={`text-sm font-semibold ${
                            isSelected
                              ? 'text-[#168b87]'
                              : 'text-slate-700'
                          }`}
                        >
                          {color.name}
                        </span>

                        {isSelected && (
                          <Check
                            size={15}
                            className="text-[#168b87]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              

              {/* SKU */}

              {selectedVariant && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-400">
                    SKU
                  </span>

                  <span className="text-xs font-semibold text-slate-700">
                    {selectedVariant.sku}
                  </span>
                </div>
              )}

              {/* ACTION */}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border border-[#168b87] text-sm font-bold text-[#168b87] transition hover:bg-[#e6f5f4] ${
                    isAddingToCart ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <ShoppingCart size={19} />
                  {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ"}
                </button>

                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#168b87] text-sm font-bold text-white transition hover:bg-[#10736f]"
                >
                  <Zap size={19} />
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            9 / 3 LAYOUT
        ================================================= */}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

          {/* =================================================
              LEFT 9
          ================================================= */}

          <div className="lg:col-span-9">

            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Thông số kỹ thuật
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Xem chi tiết cấu hình và thông số của sản phẩm
              </p>
            </div>

            {/* 2 CỘT */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* ================= CẤU HÌNH ================= */}

              <DetailSection
                title="Cấu hình & Bộ nhớ"
                defaultOpen
              >
                <InfoRow
                  label="Hệ điều hành"
                  value={
                    product.performanceAndStorage?.os
                  }
                />

                <InfoRow
                  label="CPU"
                  value={
                    product.performanceAndStorage?.cpu
                  }
                />

                <InfoRow
                  label="Tốc độ CPU"
                  value={
                    product.performanceAndStorage?.cpuSpeed
                  }
                />

                <InfoRow
                  label="GPU"
                  value={
                    product.performanceAndStorage?.gpu
                  }
                />

                <InfoRow
                  label="RAM"
                  value={
                    product.performanceAndStorage?.ram
                  }
                />

                <InfoRow
                  label="Bộ nhớ trong"
                  value={
                    selectedVariant?.storage
                  }
                />

                <InfoRow
                  label="Bộ nhớ khả dụng"
                  value={
                    product.performanceAndStorage
                      ?.usableStorage
                  }
                />

                <InfoRow
                  label="Lưu danh bạ"
                  value={
                    product.performanceAndStorage
                      ?.contactsStorage
                  }
                />
              </DetailSection>

              {/* ================= CAMERA ================= */}

              <DetailSection title="Camera & Màn hình">
                <InfoRow
                  label="Camera sau"
                  value={
                    product.cameraAndScreen
                      ?.rearCameraResolution
                  }
                />

                <InfoRow
                  label="Camera trước"
                  value={
                    product.cameraAndScreen
                      ?.frontCameraResolution
                  }
                />

                <InfoRow
                  label="Công nghệ màn hình"
                  value={
                    product.cameraAndScreen
                      ?.screenTechnology
                  }
                />

                <InfoRow
                  label="Độ phân giải"
                  value={
                    product.cameraAndScreen
                      ?.screenResolution
                  }
                />

                <InfoRow
                  label="Kích thước"
                  value={
                    product.cameraAndScreen
                      ?.screenSize
                  }
                />

                <InfoRow
                  label="Tần số quét"
                  value={
                    product.cameraAndScreen?.refreshRate
                  }
                />

                <InfoRow
                  label="Độ sáng tối đa"
                  value={
                    product.cameraAndScreen?.maxBrightness
                  }
                />

                <InfoRow
                  label="Kính màn hình"
                  value={
                    product.cameraAndScreen
                      ?.touchScreenGlass
                  }
                />

                <InfoList
                  label="Tính năng camera sau"
                  items={
                    product.cameraAndScreen
                      ?.rearCameraFeatures
                  }
                />

                <InfoList
                  label="Quay video"
                  items={
                    product.cameraAndScreen
                      ?.rearVideoRecording
                  }
                />

                <InfoList
                  label="Tính năng camera trước"
                  items={
                    product.cameraAndScreen
                      ?.frontCameraFeatures
                  }
                />
              </DetailSection>

              {/* ================= PIN ================= */}

              <DetailSection title="Pin & Sạc">
                <InfoRow
                  label="Thời lượng pin"
                  value={
                    product.batteryAndCharge?.batteryLife
                  }
                />

                <InfoRow
                  label="Loại pin"
                  value={
                    product.batteryAndCharge?.batteryType
                  }
                />

                <InfoRow
                  label="Công suất sạc"
                  value={
                    product.batteryAndCharge
                      ?.maxChargingPower
                  }
                />

                <InfoList
                  label="Tính năng pin"
                  items={
                    product.batteryAndCharge
                      ?.batteryFeatures
                  }
                />
              </DetailSection>

              {/* ================= TIỆN ÍCH ================= */}

              <DetailSection title="Tiện ích">
                <InfoRow
                  label="Bảo mật"
                  value={
                    product.utilities?.advancedSecurity
                  }
                />

                <InfoRow
                  label="Chống nước"
                  value={
                    product.utilities?.waterResistance
                  }
                />

                <InfoList
                  label="Tính năng đặc biệt"
                  items={
                    product.utilities?.specialFeatures
                  }
                />

                <InfoList
                  label="Ghi âm"
                  items={
                    product.utilities?.audioRecording
                  }
                />

                <InfoList
                  label="Định dạng video"
                  items={
                    product.utilities
                      ?.supportedVideoFormats
                  }
                />

                <InfoList
                  label="Định dạng âm thanh"
                  items={
                    product.utilities
                      ?.supportedAudioFormats
                  }
                />
              </DetailSection>

              {/* ================= KẾT NỐI ================= */}

              <DetailSection title="Kết nối">
                <InfoRow
                  label="Mạng di động"
                  value={
                    product.connectivity?.mobileNetwork
                  }
                />

                <InfoRow
                  label="SIM"
                  value={
                    product.connectivity?.simType
                  }
                />

                <InfoRow
                  label="Bluetooth"
                  value={
                    product.connectivity?.bluetooth
                  }
                />

                <InfoRow
                  label="Cổng kết nối"
                  value={
                    product.connectivity?.connectorPort
                  }
                />

                <InfoRow
                  label="Jack tai nghe"
                  value={
                    product.connectivity?.headphoneJack
                  }
                />

                <InfoRow
                  label="Kết nối khác"
                  value={
                    product.connectivity?.otherConnectivity
                  }
                />

                <InfoList
                  label="Wi-Fi"
                  items={
                    product.connectivity?.wifi
                  }
                />

                <InfoList
                  label="GPS"
                  items={
                    product.connectivity?.gps
                  }
                />
              </DetailSection>

              {/* ================= THIẾT KẾ ================= */}

              <DetailSection title="Thiết kế & Chất liệu">
                <InfoRow
                  label="Thiết kế"
                  value={
                    product.designAndMaterials
                      ?.designType
                  }
                />

                <InfoRow
                  label="Chất liệu"
                  value={
                    product.designAndMaterials?.materials
                  }
                />

                <InfoRow
                  label="Kích thước"
                  value={
                    product.designAndMaterials?.dimensions
                  }
                />

                <InfoRow
                  label="Trọng lượng"
                  value={
                    product.designAndMaterials?.weight
                  }
                />

                <InfoRow
                  label="Ngày ra mắt"
                  value={
                    product.designAndMaterials?.releaseDate
                  }
                />
              </DetailSection>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}