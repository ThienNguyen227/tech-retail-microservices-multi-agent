'use client';

import { useState } from 'react';
import Link from 'next/link';

export type StorageOption = {
  storage: string;
  price: number;
};

export type ProductSpecifications = {
  chip?: string;
  ram?: string;
  storage?: string;
  rearCamera?: string;
  frontCamera?: string;
  battery?: string;
  [key: string]: any;
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
  storageOptions?: StorageOption[];
  specifications?: ProductSpecifications;
};

type PhoneProductCardProps = {
  product: Phone;
};

export default function PhoneProductCard({ product }: PhoneProductCardProps) {
  // Quản lý option dung lượng được chọn (mặc định chọn bản đầu tiên)
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<number>(0);

  const selectedOption =
    product.storageOptions && product.storageOptions.length > 0
      ? product.storageOptions[selectedStorageIndex] || product.storageOptions[0]
      : null;

  const currentPrice = selectedOption ? selectedOption.price : 0;
  const currentStorage = selectedOption ? selectedOption.storage : '';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const imageUrl = product.image.startsWith('http')
    ? product.image
    : `/product/phone/${product.image.replace(/^\//, '').replace(/^product\//, '')}`;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-lg">
      <div>
        {/* 1. Ảnh sản phẩm */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-50"
        >
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* 2. Tên sản phẩm + Dung lượng đang chọn */}
        <Link href={`/product/${product.slug}`} className="mt-3 block">
          <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-red-600">
            {product.name} {currentStorage}
          </h3>
        </Link>

        {/* 3. Màn hình (tách riêng 2 badge cho Công nghệ màn hình và Kích thước) */}
        {(product.screenTech || product.screenSize) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {product.screenTech && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                {product.screenTech}
              </span>
            )}
            {product.screenSize && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                {product.screenSize}
              </span>
            )}
          </div>
        )}

        {/* 4. Các nút dung lượng: 256GB 512GB 1TB */}
        {product.storageOptions && product.storageOptions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {product.storageOptions.map((opt, index) => {
              const isSelected = index === selectedStorageIndex;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedStorageIndex(index)}
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt.storage}
                </button>
              );
            })}
          </div>
        )}

        {/* 5. Giá tiền */}
        <div className="mt-3">
          <span className="text-lg font-extrabold text-red-600">
            {currentPrice > 0 ? formatPrice(currentPrice) : 'Liên hệ'}
          </span>
        </div>

        {/* 6. Chi tiết thông số kỹ thuật dạng List Chấm Tròn */}
        <ul className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 pt-3 text-[11px] leading-relaxed text-gray-600">
          {product.specifications?.chip && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span className="line-clamp-1">
                <strong className="font-semibold text-gray-800">Chip:</strong> {product.specifications.chip}
              </span>
            </li>
          )}

          {product.specifications?.ram && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span className="line-clamp-1">
                <strong className="font-semibold text-gray-800">Ram:</strong> {product.specifications.ram}
              </span>
            </li>
          )}

          {/* {product.specifications?.storage && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span>
                <strong className="font-semibold text-gray-800">Dung lượng:</strong> {product.specifications.storage}
              </span>
            </li>
          )} */}
          {currentStorage && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span>
                <strong className="font-semibold text-gray-800">
                  Dung lượng:
                </strong>{' '}
                {currentStorage}
              </span>
            </li>
          )}

          {product.specifications?.rearCamera && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span className="line-clamp-2">
                <strong className="font-semibold text-gray-800">Camera sau:</strong> {product.specifications.rearCamera}
              </span>
            </li>
          )}

          {product.specifications?.frontCamera && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span>
                <strong className="font-semibold text-gray-800">Camera trước:</strong> {product.specifications.frontCamera}
              </span>
            </li>
          )}

          {product.specifications?.battery && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>
              <span className="line-clamp-1">
                <strong className="font-semibold text-gray-800">Pin:</strong> {product.specifications.battery}
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}