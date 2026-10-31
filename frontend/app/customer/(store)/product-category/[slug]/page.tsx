import Link from 'next/link';
import PhoneProductCard, { Phone } from '../../components/PhoneProductCard';
import LaptopProductCard, { Laptop } from '../../components/LaptopProductCard';
import TabletProductCard, { Tablet } from '../../components/TabletProductCard';
import ProductFilter from '../../components/ProductFilter';

type Brand = {
  _id: string;
  id: string;
  image: string;
  name: string;
  slug: string;
  categoryId: string;
};

async function getProducts(categorySlug: string, brandSlug?: string) {
  try {
    const params = new URLSearchParams({ category: categorySlug });

    if (brandSlug) {
      params.set('brand', brandSlug);
    }

    const res = await fetch(
      `http://localhost:3003/api/v1/customer-session/product-service/product-list?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error('Fetch products error:', error);
    return null;
  }
}

async function getBrandsByCategory(slug: string) {
  try {
    const params = new URLSearchParams({ category: slug });

    const res = await fetch(
      `http://localhost:3003/api/v1/customer-session/product-service/brand-list?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error('Fetch brands error:', error);
    return null;
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ brand?: string }>;
};

export default async function ProductCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { brand } = await searchParams;

  const [productData, brandData] = await Promise.all([
    getProducts(slug, brand),
    getBrandsByCategory(slug),
  ]);

  const categoryName =
    productData?.category?.name || decodeURIComponent(slug);

  const products = productData?.products || [];
  const brands: Brand[] = brandData?.brands || [];
  const categorySlug = productData?.category?.slug;

  const selectedBrand = brands.find((item) => item.slug === brand);

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/customer' },
    { label: 'Sản phẩm', href: '/customer/product-category' },
    { label: categoryName },
  ];

  const allProductsHref = `/customer/product-category/${slug}`;

  return (
    <main className="min-h-screen bg-[#F5F8FA]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm"
        >
          {breadcrumbItems.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              {index > 0 && (
                <span className="select-none text-slate-300">/</span>
              )}

              {item.href ? (
                <Link
                  href={item.href}
                  className="text-slate-500 transition-colors duration-200 hover:text-teal-700"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-800">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* BRAND FILTER */}
        {brands.length > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Lọc theo thương hiệu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn thương hiệu để thu hẹp danh sách sản phẩm.
                </p>
              </div>

              <ProductFilter
                brands={brands}
                productCount={products.length}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={allProductsHref}
                className={`group flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                  !brand
                    ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                Tất cả
              </Link>

              {[...brands]
                .sort((a, b) => Number(a.id) - Number(b.id))
                .map((brandItem) => {
                  const isSelected = brand === brandItem.slug;

                  return (
                    <Link
                      key={brandItem.id}
                      href={`${allProductsHref}?brand=${encodeURIComponent(
                        brandItem.slug,
                      )}`}
                      aria-label={brandItem.name}
                      title={brandItem.name}
                      className={`group flex h-11 min-w-20 items-center justify-center rounded-xl border px-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 shadow-sm ring-2 ring-teal-100'
                          : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/60'
                      }`}
                    >
                      <img
                        src={`/brand/${brandItem.image}`}
                        alt={brandItem.name}
                        className="max-h-6 max-w-20 object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </Link>
                  );
                })}
            </div>
          </section>
        )}

        {/* PRODUCT LIST HEADER */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Danh sách sản phẩm
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedBrand
                ? `Đang hiển thị sản phẩm thương hiệu ${selectedBrand.name}`
                : 'Các sản phẩm hiện có trong danh mục'}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Hiển thị
            <span className="font-bold text-slate-900">{products.length}</span>
            sản phẩm
          </div>
        </div>

        {/* PRODUCT LIST */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {categorySlug === 'dien-thoai-di-dong' &&
              (products as Phone[]).map((phone) => (
                <div
                  key={phone._id}
                  className="group min-w-0 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:drop-shadow-[0_12px_16px_rgba(15,23,42,0.10)]"
                >
                  <PhoneProductCard product={phone} />
                </div>
              ))}

            {categorySlug === 'may-tinh-xach-tay' &&
              (products as Laptop[]).map((laptop) => (
                <div
                  key={laptop._id}
                  className="group min-w-0 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:drop-shadow-[0_12px_16px_rgba(15,23,42,0.10)]"
                >
                  <LaptopProductCard product={laptop} />
                </div>
              ))}

            {categorySlug === 'may-tinh-bang' &&
              (products as Tablet[]).map((tablet) => (
                <div
                  key={tablet._id}
                  className="group min-w-0 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:drop-shadow-[0_12px_16px_rgba(15,23,42,0.10)]"
                >
                  <TabletProductCard product={tablet} />
                </div>
              ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 7h12l1 13H5L6 7Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V6a3 3 0 0 1 6 0v3"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Chưa có sản phẩm phù hợp
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Thử chọn thương hiệu khác hoặc quay lại xem tất cả sản phẩm trong
              danh mục.
            </p>

            {brand && (
              <Link
                href={allProductsHref}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-700/20"
              >
                Xem tất cả sản phẩm
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
