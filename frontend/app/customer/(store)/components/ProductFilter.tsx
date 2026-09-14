'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Brand = {
  _id: string;
  id: string;
  name: string;
  slug: string;
  categoryId: string;
};

type ProductFilterProps = {
  brands: Brand[];
  productCount: number;
};

const RAM_OPTIONS = [3, 4, 6, 8, 12, 16];

const STORAGE_OPTIONS = [
  { value: '64', label: '64GB' },
  { value: '128', label: '128GB' },
  { value: '256', label: '256GB' },
  { value: '512', label: '512GB' },
  { value: '1024', label: '1TB' },
];

const PRICE_MAX = 100_000_000;

export default function ProductFilter({
  brands,
  productCount,
}: ProductFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);

  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get('brand')?.split(',').filter(Boolean) || [],
  );

  const [maxPrice, setMaxPrice] = useState<number>(
    Number(searchParams.get('maxPrice')) || PRICE_MAX,
  );

  const [selectedRam, setSelectedRam] = useState<number[]>(
    searchParams
      .get('ram')
      ?.split(',')
      .map(Number)
      .filter(Boolean) || [],
  );

  const [selectedStorage, setSelectedStorage] = useState<string[]>(
    searchParams.get('storage')?.split(',').filter(Boolean) || [],
  );

  // =========================
  // BRAND
  // =========================

  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : [...prev, slug],
    );
  };

  // =========================
  // RAM
  // =========================

  const toggleRam = (ram: number) => {
    setSelectedRam((prev) =>
      prev.includes(ram)
        ? prev.filter((item) => item !== ram)
        : [...prev, ram],
    );
  };

  // =========================
  // STORAGE
  // =========================

  const toggleStorage = (storage: string) => {
    setSelectedStorage((prev) =>
      prev.includes(storage)
        ? prev.filter((item) => item !== storage)
        : [...prev, storage],
    );
  };

  // =========================
  // APPLY FILTER
  // =========================

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedBrands.length > 0) {
      params.set('brand', selectedBrands.join(','));
    } else {
      params.delete('brand');
    }

    if (maxPrice < PRICE_MAX) {
      params.set('maxPrice', maxPrice.toString());
    } else {
      params.delete('maxPrice');
    }

    if (selectedRam.length > 0) {
      params.set('ram', selectedRam.join(','));
    } else {
      params.delete('ram');
    }

    if (selectedStorage.length > 0) {
      params.set('storage', selectedStorage.join(','));
    } else {
      params.delete('storage');
    }

    router.push(`?${params.toString()}`);

    setOpen(false);
  };

  // =========================
  // CLEAR
  // =========================

  const clearFilter = () => {
    setSelectedBrands([]);
    setMaxPrice(PRICE_MAX);
    setSelectedRam([]);
    setSelectedStorage([]);
  };

  // =========================
  // SELECTED COUNT
  // =========================

  const selectedCount =
    selectedBrands.length +
    selectedRam.length +
    selectedStorage.length +
    (maxPrice < PRICE_MAX ? 1 : 0);

  return (
    <>
      {/* FILTER BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-red-500 hover:text-red-500"
      >
        Bộ lọc
        {selectedCount > 0 && (
          <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
            {selectedCount}
          </span>
        )}
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          {/* POPUP */}
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Bộ lọc
                </h2>

                <button
                  onClick={() => setOpen(false)}
                  className="text-2xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* SELECTED FILTERS */}
              {selectedCount > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    Đã chọn
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {selectedBrands.map((slug) => {
                      const brand = brands.find(
                        (item) => item.slug === slug,
                      );

                      return (
                        <span
                          key={slug}
                          className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600"
                        >
                          {brand?.name || slug}
                        </span>
                      );
                    })}

                    {maxPrice < PRICE_MAX && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600">
                        ≤ {maxPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}

                    {selectedRam.map((ram) => (
                      <span
                        key={ram}
                        className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600"
                      >
                        RAM {ram}GB
                      </span>
                    ))}

                    {selectedStorage.map((storage) => {
                      const option = STORAGE_OPTIONS.find(
                        (item) => item.value === storage,
                      );

                      return (
                        <span
                          key={storage}
                          className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600"
                        >
                          {option?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* HÃNG */}
              <div className="mb-7">
                <h3 className="mb-3 text-base font-semibold text-gray-900">
                  Hãng
                </h3>

                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => {
                    const selected = selectedBrands.includes(
                      brand.slug,
                    );

                    return (
                      <button
                        key={brand._id}
                        onClick={() => toggleBrand(brand.slug)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-400'
                        }`}
                      >
                        {brand.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GIÁ */}
              <div className="mb-7">
                <h3 className="mb-3 text-base font-semibold text-gray-900">
                  Giá
                </h3>

                <div className="px-2">
                  <input
                    type="range"
                    min={0}
                    max={PRICE_MAX}
                    step={1_000_000}
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(Number(e.target.value))
                    }
                    className="w-full accent-red-500"
                  />

                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>0đ</span>

                    <span className="font-medium text-red-600">
                      {maxPrice.toLocaleString('vi-VN')}đ
                    </span>

                    <span>100tr</span>
                  </div>
                </div>
              </div>

              {/* RAM */}
              <div className="mb-7">
                <h3 className="mb-3 text-base font-semibold text-gray-900">
                  RAM
                </h3>

                <div className="flex flex-wrap gap-2">
                  {RAM_OPTIONS.map((ram) => {
                    const selected = selectedRam.includes(ram);

                    return (
                      <button
                        key={ram}
                        onClick={() => toggleRam(ram)}
                        className={`min-w-16 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-400'
                        }`}
                      >
                        {ram}GB
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DUNG LƯỢNG */}
              <div>
                <h3 className="mb-3 text-base font-semibold text-gray-900">
                  Dung lượng
                </h3>

                <div className="flex flex-wrap gap-2">
                  {STORAGE_OPTIONS.map((option) => {
                    const selected = selectedStorage.includes(
                      option.value,
                    );

                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          toggleStorage(option.value)
                        }
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <button
                onClick={clearFilter}
                className="text-sm font-medium text-gray-500 hover:text-red-500"
              >
                Xóa tất cả
              </button>

              <button
                onClick={applyFilter}
                className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Xem {productCount} kết quả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}