import Link from 'next/link';
import PhoneProductCard, {Phone} from '../../components/PhoneProductCard';
import ProductFilter from '../../components/ProductFilter';

type Brand = {
  _id: string;
  id: string;
  image: string,
  name: string;
  slug: string;
  categoryId: string;
};

async function getProducts(categorySlug: string, brandSlug?: string) {
  try {
    const params = new URLSearchParams();

    params.set('category', categorySlug);

    if (brandSlug) {
      params.set('brand', brandSlug);
    }

    const res = await fetch(
      `http://localhost:3003/api/v1/products?${params.toString()}`,
      {
        cache: 'no-store',
      },
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
    const res = await fetch(
      `http://localhost:3003/api/v1/products/brands?category=${slug}`,
      {
        cache: 'no-store',
      },
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

  // Gọi 2 API
  const [productData, brandData] = await Promise.all([
    getProducts(slug, brand),
    getBrandsByCategory(slug),
  ]);

  const categoryName =
    productData?.category?.name || decodeURIComponent(slug);

  const products = productData?.products || [];
  const brands: Brand[] = brandData?.brands || [];

  const categorySlug = productData?.category?.slug;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Danh mục:{' '}
          <span className="text-red-600">{categoryName}</span>
        </h1>

        <span className="text-sm text-gray-500">
          Hiển thị {products.length} sản phẩm
        </span>
      </div>

      {/* BRAND FILTER */}
      {brands.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {/* FILTER BUTTON */}
            <ProductFilter
              brands={brands}
              productCount={products.length}
            />

            {/* ALL */}
            <Link
              href={`/customer/product-category/${slug}`}
              className={`rounded-lg border px-5 py-2 text-sm font-medium transition ${
                !brand
                  ? 'border-red-500 bg-red-50 text-red-500'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-500 hover:text-red-500'
              }`}
            >
              Tất cả
            </Link>

            {/* BRAND LIST */}
            {[...brands]
            .sort((a, b) => Number(a.id) - Number(b.id))
            .map((brandItem) => (
              <Link
                key={brandItem.id}
                href={`/customer/product-category/${slug}?brand=${brandItem.slug}`}
                className={`flex h-10 w-20 items-center justify-center rounded-lg border p-2 transition ${
                  brand === brandItem.slug
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-red-500'
                }`}
              >
                <img
                  src={`/brand/${brandItem.image}`}
                  alt={brandItem.name}
                  className="max-h-6 max-w-full object-contain"
                />
              </Link>
            ))}

          </div>
        </div>
      )}

      {/* PRODUCT LIST */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

          {/* PHONE */}
          {categorySlug === 'dien-thoai-di-dong' &&
            (products as Phone[]).map((phone) => (
              <PhoneProductCard
                key={phone._id}
                product={phone}
              />
            ))}

          {/* LAPTOP */}
          {/* {categorySlug === 'laptop' &&
            (products as Laptop[]).map((laptop) => (
              <LaptopProductCard
                key={laptop._id}
                product={laptop}
              />
            ))} */}

          {/* TABLET */}
          {/* {categorySlug === 'tablet' &&
            (products as Tablet[]).map((tablet) => (
              <TabletProductCard
                key={tablet._id}
                product={tablet}
              />
            ))} */}

        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500">
            Chưa có sản phẩm nào trong danh mục này.
          </p>
        </div>
      )}
    </section>
  );
}