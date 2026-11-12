import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';

import type {
  Phone,
  PhoneVariant as ProductVariant,
} from './phone-product-card';
import type { Laptop, LaptopVariant } from './laptop-product-card';
import type { Tablet, TabletVariant } from './tablet-product-card';

// ============================================================
// TYPES - PHONE
// ============================================================

export type ComparePhoneItem = {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  image: string;

  variant: {
    sku: string;
    slug: string;
    storage: string;
    color: string;
    price: number;
    image: string;
  };
};

// ============================================================
// TYPES - LAPTOP
// ============================================================

export type CompareLaptopVariant = {
  sku: string;
  slug: string;
  ram: string;
  ssd: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type CompareLaptopProduct = {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;

  ram?: string;
  ssd?: string;

  variants: CompareLaptopVariant[];
};

export type CompareLaptopItem = {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  image: string;

  variant: {
    sku: string;
    slug: string;
    ram: string;
    ssd: string;
    color: string;
    colorSlug: string;
    price: number;
    image: string;
  };
};

// ============================================================
// TYPES - TABLET
// ============================================================

export type CompareTabletVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type CompareTabletProduct = {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;

  screenTech?: string;
  screenSize?: string;

  variants: CompareTabletVariant[];
};

export type CompareTabletItem = {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  image: string;

  variant: {
    sku: string;
    slug: string;
    storage: string;
    color: string;
    colorSlug: string;
    price: number;
    image: string;
  };
};

// ============================================================
// RESULT TYPES
// ============================================================

export type AddPhoneResult = 'added' | 'duplicate' | 'limit';

export type AddLaptopResult = 'added' | 'duplicate' | 'limit';

export type AddTabletResult = 'added' | 'duplicate' | 'limit';

// ============================================================
// CONTEXT TYPE
// ============================================================

type ProductCompareContextType = {
  // Phone
  phones: ComparePhoneItem[];
  phoneCount: number;
  canAddMorePhones: boolean;

  addPhone: (product: Phone, variant: ProductVariant) => AddPhoneResult;

  removePhone: (productId: string) => void;
  clearPhones: () => void;

  // Laptop
  laptops: CompareLaptopItem[];
  laptopCount: number;
  canAddMoreLaptops: boolean;

  addLaptop: (product: Laptop, variant: LaptopVariant) => AddLaptopResult;

  removeLaptop: (productId: string) => void;
  clearLaptops: () => void;

  // Tablet
  tablets: CompareTabletItem[];
  tabletCount: number;
  canAddMoreTablets: boolean;

  addTablet: (product: Tablet, variant: TabletVariant) => AddTabletResult;

  removeTablet: (productId: string) => void;
  clearTablets: () => void;

  // Common
  storageError: string;
  isHydrated: boolean;
};

// ============================================================
// CONSTANTS
// ============================================================

const PHONE_STORAGE_KEY = 'smarthub-phone-compare';
const LAPTOP_STORAGE_KEY = 'smarthub-laptop-compare';
const TABLET_STORAGE_KEY = 'smarthub-tablet-compare';

const MAX_COMPARE_PRODUCTS = 3;

// ============================================================
// CONTEXT
// ============================================================

const ProductCompareContext = createContext<
  ProductCompareContextType | undefined
>(undefined);

// ============================================================
// ASYNC STORAGE VALIDATION - PHONE
// ============================================================

function isValidComparePhone(value: unknown): value is ComparePhoneItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant = variant as Record<string, unknown>;

  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.image === 'string' &&
    typeof selectedVariant.sku === 'string' &&
    typeof selectedVariant.slug === 'string' &&
    typeof selectedVariant.storage === 'string' &&
    typeof selectedVariant.color === 'string' &&
    typeof selectedVariant.price === 'number' &&
    Number.isFinite(selectedVariant.price) &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// ASYNC STORAGE VALIDATION - LAPTOP
// ============================================================

function isValidCompareLaptop(value: unknown): value is CompareLaptopItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant = variant as Record<string, unknown>;

  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.image === 'string' &&
    typeof selectedVariant.sku === 'string' &&
    typeof selectedVariant.slug === 'string' &&
    typeof selectedVariant.ram === 'string' &&
    typeof selectedVariant.ssd === 'string' &&
    typeof selectedVariant.color === 'string' &&
    typeof selectedVariant.colorSlug === 'string' &&
    typeof selectedVariant.price === 'number' &&
    Number.isFinite(selectedVariant.price) &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// ASYNC STORAGE VALIDATION - TABLET
// ============================================================

function isValidCompareTablet(value: unknown): value is CompareTabletItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant = variant as Record<string, unknown>;

  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.image === 'string' &&
    typeof selectedVariant.sku === 'string' &&
    typeof selectedVariant.slug === 'string' &&
    typeof selectedVariant.storage === 'string' &&
    typeof selectedVariant.color === 'string' &&
    typeof selectedVariant.colorSlug === 'string' &&
    typeof selectedVariant.price === 'number' &&
    Number.isFinite(selectedVariant.price) &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// REMOVE DUPLICATE ITEMS
// ============================================================

function getUniqueItems<T extends { productId: string }>(items: T[]): T[] {
  return items
    .filter(
      (item, index, array) =>
        array.findIndex((other) => other.productId === item.productId) ===
        index,
    )
    .slice(0, MAX_COMPARE_PRODUCTS);
}

// ============================================================
// PROVIDER
// ============================================================

export function ProductCompareProvider({ children }: { children: ReactNode }) {
  const [phones, setPhones] = useState<ComparePhoneItem[]>([]);
  const [laptops, setLaptops] = useState<CompareLaptopItem[]>([]);
  const [tablets, setTablets] = useState<CompareTabletItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState('');

  const phonesRef = useRef<ComparePhoneItem[]>([]);
  const phonesWriteQueue = useRef(Promise.resolve());
  const laptopsRef = useRef<CompareLaptopItem[]>([]);
  const laptopsWriteQueue = useRef(Promise.resolve());
  const tabletsRef = useRef<CompareTabletItem[]>([]);
  const tabletsWriteQueue = useRef(Promise.resolve());

  // ==========================================================
  // LOAD DATA FROM ASYNC STORAGE
  // ==========================================================

  useEffect(() => {
    let active = true;

    const loadComparison = async () => {
      // LOAD PHONES
      try {
        const storedPhones = await AsyncStorage.getItem(PHONE_STORAGE_KEY);
        if (!active) return;

        if (storedPhones) {
          const parsedPhones: unknown = JSON.parse(storedPhones);

          if (Array.isArray(parsedPhones)) {
            const validPhones = getUniqueItems(
              parsedPhones.filter(isValidComparePhone),
            );
            phonesRef.current = validPhones;
            setPhones(validPhones);
          }
        }
      } catch {
        if (active)
          setStorageError('Không thể khôi phục một số sản phẩm đã lưu.');
      }

      // LOAD LAPTOPS
      try {
        const storedLaptops = await AsyncStorage.getItem(LAPTOP_STORAGE_KEY);
        if (!active) return;

        if (storedLaptops) {
          const parsedLaptops: unknown = JSON.parse(storedLaptops);

          if (Array.isArray(parsedLaptops)) {
            const validLaptops = getUniqueItems(
              parsedLaptops.filter(isValidCompareLaptop),
            );
            laptopsRef.current = validLaptops;
            setLaptops(validLaptops);
          }
        }
      } catch {
        if (active)
          setStorageError('Không thể khôi phục một số sản phẩm đã lưu.');
      }

      // LOAD TABLETS
      try {
        const storedTablets = await AsyncStorage.getItem(TABLET_STORAGE_KEY);
        if (!active) return;

        if (storedTablets) {
          const parsedTablets: unknown = JSON.parse(storedTablets);

          if (Array.isArray(parsedTablets)) {
            const validTablets = getUniqueItems(
              parsedTablets.filter(isValidCompareTablet),
            );
            tabletsRef.current = validTablets;
            setTablets(validTablets);
          }
        }
      } catch {
        if (active)
          setStorageError('Không thể khôi phục một số sản phẩm đã lưu.');
      }

      if (active) setIsHydrated(true);
    };

    void loadComparison();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================================
  // SAVE PHONES TO ASYNC STORAGE
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) return;

    const serialized = JSON.stringify(phones);
    phonesWriteQueue.current = phonesWriteQueue.current.then(async () => {
      try {
        await AsyncStorage.setItem(PHONE_STORAGE_KEY, serialized);
      } catch {
        setStorageError('Không thể lưu danh sách so sánh trên thiết bị.');
      }
    });
  }, [phones, isHydrated]);

  // ==========================================================
  // SAVE LAPTOPS TO ASYNC STORAGE
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) return;

    const serialized = JSON.stringify(laptops);
    laptopsWriteQueue.current = laptopsWriteQueue.current.then(async () => {
      try {
        await AsyncStorage.setItem(LAPTOP_STORAGE_KEY, serialized);
      } catch {
        setStorageError('Không thể lưu danh sách so sánh trên thiết bị.');
      }
    });
  }, [laptops, isHydrated]);

  // ==========================================================
  // SAVE TABLETS TO ASYNC STORAGE
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) return;

    const serialized = JSON.stringify(tablets);
    tabletsWriteQueue.current = tabletsWriteQueue.current.then(async () => {
      try {
        await AsyncStorage.setItem(TABLET_STORAGE_KEY, serialized);
      } catch {
        setStorageError('Không thể lưu danh sách so sánh trên thiết bị.');
      }
    });
  }, [tablets, isHydrated]);

  // ==========================================================
  // ADD PHONE
  // ==========================================================

  const addPhone = useCallback(
    (product: Phone, variant: ProductVariant): AddPhoneResult => {
      const isDuplicate = phonesRef.current.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      if (phonesRef.current.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const selectedImage = variant.images?.[0] || product.image;

      const newPhone: ComparePhoneItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId ?? '',
        image: selectedImage,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          storage: variant.storage ?? '',
          color: variant.color ?? '',
          price: variant.price,
          image: selectedImage,
        },
      };

      // Giữ lựa chọn mới nhất khi người dùng chạm liên tiếp.
      phonesRef.current = [...phonesRef.current, newPhone];
      setPhones(phonesRef.current);

      return 'added';
    },
    [],
  );

  // ==========================================================
  // REMOVE PHONE
  // ==========================================================

  const removePhone = useCallback((productId: string) => {
    phonesRef.current = phonesRef.current.filter(
      (phone) => phone.productId !== productId,
    );
    setPhones(phonesRef.current);
  }, []);

  // ==========================================================
  // CLEAR PHONES
  // ==========================================================

  const clearPhones = useCallback(() => {
    phonesRef.current = [];
    setPhones([]);
  }, []);

  // ==========================================================
  // ADD LAPTOP
  // ==========================================================

  const addLaptop = useCallback(
    (product: Laptop, variant: LaptopVariant): AddLaptopResult => {
      const isDuplicate = laptopsRef.current.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      if (laptopsRef.current.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const selectedImage = variant.images?.[0] || product.image;

      const newLaptop: CompareLaptopItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId ?? '',
        image: selectedImage,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          ram: variant.ram ?? product.ram ?? '',
          ssd: variant.ssd ?? product.ssd ?? '',
          color: variant.color ?? '',
          colorSlug: variant.colorSlug ?? '',
          price: variant.price,
          image: selectedImage,
        },
      };

      // Giữ lựa chọn mới nhất khi người dùng chạm liên tiếp.
      laptopsRef.current = [...laptopsRef.current, newLaptop];
      setLaptops(laptopsRef.current);

      return 'added';
    },
    [],
  );

  // ==========================================================
  // REMOVE LAPTOP
  // ==========================================================

  const removeLaptop = useCallback((productId: string) => {
    laptopsRef.current = laptopsRef.current.filter(
      (laptop) => laptop.productId !== productId,
    );
    setLaptops(laptopsRef.current);
  }, []);

  // ==========================================================
  // CLEAR LAPTOPS
  // ==========================================================

  const clearLaptops = useCallback(() => {
    laptopsRef.current = [];
    setLaptops([]);
  }, []);

  // ==========================================================
  // ADD TABLET
  // ==========================================================

  const addTablet = useCallback(
    (product: Tablet, variant: TabletVariant): AddTabletResult => {
      const isDuplicate = tabletsRef.current.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      if (tabletsRef.current.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const selectedImage = variant.images?.[0] || product.image;

      const newTablet: CompareTabletItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId ?? '',
        image: selectedImage,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          storage: variant.storage ?? '',
          color: variant.color ?? '',
          colorSlug: variant.colorSlug ?? '',
          price: variant.price,
          image: selectedImage,
        },
      };

      // Giữ lựa chọn mới nhất khi người dùng chạm liên tiếp.
      tabletsRef.current = [...tabletsRef.current, newTablet];
      setTablets(tabletsRef.current);

      return 'added';
    },
    [],
  );

  // ==========================================================
  // REMOVE TABLET
  // ==========================================================

  const removeTablet = useCallback((productId: string) => {
    tabletsRef.current = tabletsRef.current.filter(
      (tablet) => tablet.productId !== productId,
    );
    setTablets(tabletsRef.current);
  }, []);

  // ==========================================================
  // CLEAR TABLETS
  // ==========================================================

  const clearTablets = useCallback(() => {
    tabletsRef.current = [];
    setTablets([]);
  }, []);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo(
    () => ({
      // Phone
      phones,
      phoneCount: phones.length,
      canAddMorePhones: phones.length < MAX_COMPARE_PRODUCTS,
      addPhone,
      removePhone,
      clearPhones,

      // Laptop
      laptops,
      laptopCount: laptops.length,
      canAddMoreLaptops: laptops.length < MAX_COMPARE_PRODUCTS,
      addLaptop,
      removeLaptop,
      clearLaptops,

      // Tablet
      tablets,
      tabletCount: tablets.length,
      canAddMoreTablets: tablets.length < MAX_COMPARE_PRODUCTS,
      addTablet,
      removeTablet,
      clearTablets,

      // Common
      storageError,
      isHydrated,
    }),
    [
      phones,
      laptops,
      tablets,
      isHydrated,
      storageError,
      addPhone,
      removePhone,
      clearPhones,
      addLaptop,
      removeLaptop,
      clearLaptops,
      addTablet,
      removeTablet,
      clearTablets,
    ],
  );

  return (
    <ProductCompareContext.Provider value={value}>
      {children}
    </ProductCompareContext.Provider>
  );
}

// ============================================================
// CUSTOM HOOK
// ============================================================

export function useProductCompare() {
  const context = useContext(ProductCompareContext);

  if (!context) {
    throw new Error(
      'useProductCompare phải được sử dụng bên trong ProductCompareProvider',
    );
  }

  return context;
}
