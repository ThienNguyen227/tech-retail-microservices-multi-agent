"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Search,
  Warehouse,
  Package,
  Boxes,
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  LoaderCircle,
  X,
  CalendarDays,
  Store,
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
} from "lucide-react";

import axios from "axios";

import {
  adminInventoryService,
  type Inventory,
  type InventoryStock,
  type InventorySerial,
  type InventoryTransaction,
  type SerialStatus,
  type TransactionType,
} from "@/lib/axios/services/admin-services/inventory_service";

// ======================================================
// INTERFACES
// ======================================================

type InventoryTab = "STOCK" | "SERIAL" | "TRANSACTION";

type StockRow = InventoryStock & {
  inventory: Inventory;
};

type SelectedDetail =
  | {
      type: "STOCK";
      data: StockRow;
    }
  | {
      type: "SERIAL";
      data: InventorySerial;
    }
  | {
      type: "TRANSACTION";
      data: InventoryTransaction;
    };

interface SerialScope {
  inventoryId: number;
  sku: string;
}

const PAGE_SIZE = 8;

// ======================================================
// SERIAL STATUS OPTIONS
// ======================================================

const SERIAL_STATUS_OPTIONS = [
  {
    code: "AVAILABLE",
    label: "Có sẵn",
  },
  {
    code: "RESERVED",
    label: "Đã đặt",
  },
  {
    code: "CANCELLED",
    label: "Đã hủy đặt",
  },
  {
    code: "SOLD",
    label: "Đã bán",
  },
] as const;

// ======================================================
// TRANSACTION TYPE OPTIONS
// ======================================================

const TRANSACTION_TYPE_OPTIONS = [
  {
    code: "IMPORT",
    label: "Nhập kho",
  },
  {
    code: "EXPORT",
    label: "Xuất kho",
  },
  {
    code: "TRANSFER_IN",
    label: "Chuyển vào",
  },
  {
    code: "TRANSFER_OUT",
    label: "Chuyển ra",
  },
] as const;

// ======================================================
// TAB OPTIONS
// ======================================================

const TAB_OPTIONS: {
  code: InventoryTab;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    code: "STOCK",
    label: "Danh sách tồn kho",
    description: "Theo dõi số lượng tồn kho theo SKU và chi nhánh.",
    icon: <Boxes size={18} />,
  },
  {
    code: "SERIAL",
    label: "Serial Number",
    description: "Quản lý Serial Number và trạng thái từng sản phẩm.",
    icon: <Hash size={18} />,
  },
  {
    code: "TRANSACTION",
    label: "Lịch sử giao dịch",
    description: "Theo dõi lịch sử nhập kho, xuất kho và chuyển kho.",
    icon: <ClipboardList size={18} />,
  },
];

// ======================================================
// COMMON STYLES
// ======================================================

const SELECT_CLASS =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const TABLE_CELL_CLASS = "px-5 py-4 text-sm text-slate-600";

const ROW_CLASS = "transition hover:bg-slate-50/80";

// ======================================================
// HELPERS
// ======================================================

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ======================================================
// ERROR HANDLER
// ======================================================

function extractErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

// ======================================================
// STOCK STATUS HELPERS
// ======================================================

function getStockStatusStyle(quantity: number) {
  if (quantity > 0) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (quantity === 0) {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
}

function getStockStatusLabel(quantity: number) {
  if (quantity > 0) return "Còn hàng";

  if (quantity === 0) return "Hết hàng";

  return "Tồn kho âm";
}

// ======================================================
// SERIAL STATUS HELPERS
// ======================================================

function getSerialStatusStyle(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700";

    case "RESERVED":
      return "bg-amber-50 text-amber-700";

    case "CANCELLED":
      return "bg-rose-50 text-rose-700";

    case "SOLD":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getSerialStatusLabel(
  status: string,
  name?: string,
) {
  if (name) return name;

  switch (status) {
    case "AVAILABLE":
      return "Có sẵn";

    case "RESERVED":
      return "Đã đặt";

    case "CANCELLED":
      return "Đã hủy đặt";

    case "SOLD":
      return "Đã bán";

    default:
      return status || "Không xác định";
  }
}

// ======================================================
// TRANSACTION TYPE HELPERS
// ======================================================

function getTransactionTypeStyle(type: string) {
  switch (type) {
    case "IMPORT":
      return "bg-emerald-50 text-emerald-700";

    case "EXPORT":
      return "bg-amber-50 text-amber-700";

    case "TRANSFER_IN":
      return "bg-blue-50 text-blue-700";

    case "TRANSFER_OUT":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getTransactionTypeLabel(
  type: string,
  name?: string,
) {
  if (name) return name;

  switch (type) {
    case "IMPORT":
      return "Nhập kho";

    case "EXPORT":
      return "Xuất kho";

    case "TRANSFER_IN":
      return "Chuyển vào";

    case "TRANSFER_OUT":
      return "Chuyển ra";

    default:
      return type || "Không xác định";
  }
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "IMPORT":
      return <ArrowDownToLine size={18} />;

    case "EXPORT":
      return <ArrowUpFromLine size={18} />;

    case "TRANSFER_IN":
    case "TRANSFER_OUT":
      return <ArrowLeftRight size={18} />;

    default:
      return <ClipboardList size={18} />;
  }
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function ManageInventoryPage() {

  // ======================================================
  // ACTIVE TAB
  // ======================================================

  const [activeTab, setActiveTab] =
    useState<InventoryTab>("STOCK");

  // ======================================================
  // DATA
  // ======================================================

  const [inventories, setInventories] =
    useState<Inventory[]>([]);

  const [serials, setSerials] =
    useState<InventorySerial[]>([]);

  const [transactions, setTransactions] =
    useState<InventoryTransaction[]>([]);

  const [statsInventories, setStatsInventories] =
    useState<Inventory[]>([]);

  // ======================================================
  // SEARCH AND FILTER
  // ======================================================

  const [keyword, setKeyword] = useState("");

  const [branchFilter, setBranchFilter] =
    useState("ALL");

  const [stockStatusFilter, setStockStatusFilter] =
    useState("ALL");

  const [serialStatusFilter, setSerialStatusFilter] =
    useState<SerialStatus | "ALL">("ALL");

  const [transactionTypeFilter, setTransactionTypeFilter] =
    useState<TransactionType | "ALL">("ALL");

  const [serialScope, setSerialScope] =
    useState<SerialScope | null>(null);

  // ======================================================
  // PAGINATION
  // ======================================================

  const [currentPage, setCurrentPage] = useState(1);

  // ======================================================
  // SELECTED DETAIL
  // ======================================================

  const [selectedDetail, setSelectedDetail] =
    useState<SelectedDetail | null>(null);

  // ======================================================
  // LOADING AND ERROR
  // ======================================================

  const [loading, setLoading] = useState(true);

  const [statsLoading, setStatsLoading] = useState(true);

  const [error, setError] = useState("");

  const [statsError, setStatsError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // ======================================================
  // LOAD STATISTICS
  // ======================================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatistics() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const response =
          await adminInventoryService.getInventoryList(
            undefined,
            undefined,
            controller.signal,
          );

        if (!controller.signal.aborted) {
          setStatsInventories(response.data ?? []);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setStatsError(
            extractErrorMessage(
              err,
              "Không thể tải dữ liệu thống kê kho hàng.",
            ),
          );

          console.error(
            "Get inventory statistics error:",
            err,
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  // ======================================================
  // SEARCH AND FILTER
  // ======================================================

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setCurrentPage(1);

    const timer = setTimeout(async () => {
      const branchId =
        branchFilter !== "ALL"
          ? Number(branchFilter)
          : undefined;

      const search = keyword.trim() || undefined;

      try {
        // ========================================
        // INVENTORY STOCK
        // ========================================

        if (activeTab === "STOCK") {
          const response =
            await adminInventoryService.getInventoryList(
              search,
              branchId,
              controller.signal,
            );

          if (!controller.signal.aborted) {
            setInventories(response.data ?? []);
          }
        }

        // ========================================
        // INVENTORY SERIAL
        // ========================================

        else if (activeTab === "SERIAL") {
          const response =
            await adminInventoryService.getInventorySerialList(
              search,
              branchId,
              serialScope?.inventoryId,
              serialScope?.sku,
              serialStatusFilter !== "ALL"
                ? serialStatusFilter
                : undefined,
              controller.signal,
            );

          if (!controller.signal.aborted) {
            setSerials(response.data ?? []);
          }
        }

        // ========================================
        // INVENTORY TRANSACTION
        // ========================================

        else if (activeTab === "TRANSACTION") {
          const response =
            await adminInventoryService.getInventoryTransactionList(
              search,
              branchId,
              undefined,
              transactionTypeFilter !== "ALL"
                ? transactionTypeFilter
                : undefined,
              controller.signal,
            );

          if (!controller.signal.aborted) {
            setTransactions(response.data ?? []);
          }
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(
            extractErrorMessage(
              err,
              "Không thể tải danh sách kho hàng.",
            ),
          );

          console.error(
            "Get inventory list error:",
            err,
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    activeTab,
    keyword,
    branchFilter,
    serialStatusFilter,
    transactionTypeFilter,
    serialScope,
    refreshKey,
  ]);

  // ======================================================
  // CLOSE MODAL WITH ESCAPE
  // ======================================================

  useEffect(() => {
    if (!selectedDetail) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedDetail(null);
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [selectedDetail]);

  // ======================================================
  // STATISTICS
  // ======================================================

  const statistics = useMemo(() => {
    const allStocks = statsInventories.flatMap(
      (inventory) => inventory.stocks ?? [],
    );

    return {
      totalInventories: statsInventories.length,

      totalSkus: new Set(
        allStocks.map(
          (stock) => stock.inventory_sku_id,
        ),
      ).size,

      totalQuantity: allStocks.reduce(
        (total, stock) =>
          total + stock.inventory_stock_quantity,
        0,
      ),

      outOfStock: allStocks.filter(
        (stock) =>
          stock.inventory_stock_quantity === 0,
      ).length,
    };
  }, [statsInventories]);

  // ======================================================
  // BRANCH OPTIONS
  // ======================================================

  const branchOptions = useMemo(() => {
    const branchIds = new Set(
      statsInventories.map(
        (inventory) => inventory.inventory_branch_id,
      ),
    );

    if (branchFilter !== "ALL") {
      branchIds.add(Number(branchFilter));
    }

    return Array.from(branchIds).sort(
      (a, b) => a - b,
    );
  }, [statsInventories, branchFilter]);

  // ======================================================
  // NORMALIZE INVENTORY STOCK
  // ======================================================

  const stockRows = useMemo<StockRow[]>(() => {
    return inventories
      .flatMap((inventory) =>
        (inventory.stocks ?? []).map((stock) => ({
          ...stock,
          inventory,
        })),
      )
      .filter((stock) => {
        if (stockStatusFilter === "IN_STOCK") {
          return stock.inventory_stock_quantity > 0;
        }

        if (stockStatusFilter === "OUT_OF_STOCK") {
          return stock.inventory_stock_quantity === 0;
        }

        if (stockStatusFilter === "NEGATIVE") {
          return stock.inventory_stock_quantity < 0;
        }

        return true;
      });
  }, [inventories, stockStatusFilter]);

  // ======================================================
  // PAGINATION
  // ======================================================

  const totalRecords =
    activeTab === "STOCK"
      ? stockRows.length
      : activeTab === "SERIAL"
        ? serials.length
        : transactions.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / PAGE_SIZE),
  );

  const safePage = Math.min(
    currentPage,
    totalPages,
  );

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const endIndex = safePage * PAGE_SIZE;

  const paginatedStocks = stockRows.slice(
    startIndex,
    endIndex,
  );

  const paginatedSerials = serials.slice(
    startIndex,
    endIndex,
  );

  const paginatedTransactions = transactions.slice(
    startIndex,
    endIndex,
  );

  const currentTab = TAB_OPTIONS.find(
    (tab) => tab.code === activeTab,
  );

  // ======================================================
  // ACTIONS
  // ======================================================

  function resetFilters() {
    setKeyword("");
    setBranchFilter("ALL");
    setStockStatusFilter("ALL");
    setSerialStatusFilter("ALL");
    setTransactionTypeFilter("ALL");
    setSerialScope(null);
    setCurrentPage(1);
  }

  function retryLoad() {
    setRefreshKey((key) => key + 1);
  }

  function handleChangeTab(tab: InventoryTab) {
    if (tab === activeTab) return;

    resetFilters();
    setSelectedDetail(null);
    setLoading(true);
    setActiveTab(tab);
  }

  // ======================================================
  // VIEW SERIALS OF STOCK
  // ======================================================

  function handleViewStockSerials(stock: StockRow) {
    resetFilters();

    setSelectedDetail(null);

    setBranchFilter(
      String(stock.inventory.inventory_branch_id),
    );

    setSerialScope({
      inventoryId: stock.inventory_id,
      sku: stock.sku.inventory_sku_code,
    });

    setLoading(true);
    setActiveTab("SERIAL");
  }

  // ======================================================
  // TABLE HEADERS
  // ======================================================

  const tableHeaders =
    activeTab === "STOCK"
      ? [
          "Mã kho",
          "Chi nhánh",
          "Mã SKU",
          "Số lượng tồn",
          "Trạng thái",
          "Thao tác",
        ]
      : activeTab === "SERIAL"
        ? [
            "Serial Number",
            "Mã SKU",
            "Mã kho",
            "Chi nhánh",
            "Trạng thái",
            "Thao tác",
          ]
        : [
            "Mã giao dịch",
            "Loại giao dịch",
            "Kho / Chi nhánh",
            "Nguồn / Đích đến",
            "Số lượng",
            "Ngày tạo",
            "Thao tác",
          ];

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <div className="min-h-full space-y-6">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">

              <span>Quản trị hệ thống</span>

              <ChevronRight size={14} />

              <span className="font-medium text-blue-600">
                Quản lý kho hàng
              </span>

            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
              Quản lý kho hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi số lượng tồn kho, Serial Number và
              lịch sử giao dịch tại các chi nhánh.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetFilters();
              retryLoad();
            }}
            className={BUTTON_CLASS}
          >
            <RefreshCw size={16} />

            Đặt lại bộ lọc
          </button>

        </div>

        {/* ================================================== */}
        {/* STATISTICS */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Tổng số kho"
            value={statistics.totalInventories}
            description="Tổng số kho trong hệ thống"
            icon={<Warehouse size={23} />}
            color="blue"
            loading={statsLoading}
            failed={!!statsError}
          />

          <StatCard
            title="Tổng số SKU"
            value={statistics.totalSkus}
            description="Số SKU khác nhau tại các kho"
            icon={<Package size={23} />}
            color="violet"
            loading={statsLoading}
            failed={!!statsError}
          />

          <StatCard
            title="Tổng tồn kho"
            value={statistics.totalQuantity}
            description="Tổng số lượng theo dữ liệu tồn kho"
            icon={<Boxes size={23} />}
            color="emerald"
            loading={statsLoading}
            failed={!!statsError}
          />

          <StatCard
            title="SKU hết hàng tại kho"
            value={statistics.outOfStock}
            description="Số dòng SKU tại kho có tồn bằng 0"
            icon={<AlertCircle size={23} />}
            color="amber"
            loading={statsLoading}
            failed={!!statsError}
          />

        </div>

        {/* ================================================== */}
        {/* STATISTICS ERROR */}
        {/* ================================================== */}

        {statsError && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div className="flex-1">

              <p className="text-sm font-medium text-amber-800">
                Không thể cập nhật thống kê
              </p>

              <p className="mt-1 text-sm text-amber-700">
                {statsError}
              </p>

            </div>

            <button
              type="button"
              onClick={retryLoad}
              className="text-sm font-semibold text-amber-800 hover:underline"
            >
              Thử lại
            </button>

          </div>
        )}

        {/* ================================================== */}
        {/* INVENTORY MANAGEMENT */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ================================================== */}
          {/* TABS */}
          {/* ================================================== */}

          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 pt-2">

            {TAB_OPTIONS.map((tab) => (
              <button
                key={tab.code}
                type="button"
                aria-pressed={activeTab === tab.code}
                onClick={() =>
                  handleChangeTab(tab.code)
                }
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition ${
                  activeTab === tab.code
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-blue-600"
                }`}
              >
                {tab.icon}

                {tab.label}
              </button>
            ))}

          </div>

          {/* ================================================== */}
          {/* SEARCH AND FILTER */}
          {/* ================================================== */}

          <div className="border-b border-slate-100 p-5">

            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">

              <div>

                <h2 className="text-base font-bold text-slate-800">
                  {currentTab?.label}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {currentTab?.description}
                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

                {/* SEARCH */}

                <div className="relative sm:w-72">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={keyword}
                    aria-label="Tìm kiếm kho hàng"
                    onChange={(event) =>
                      setKeyword(event.target.value)
                    }
                    placeholder={
                      activeTab === "STOCK"
                        ? "Tìm kiếm mã SKU..."
                        : activeTab === "SERIAL"
                          ? "Serial Number, SKU..."
                          : "SKU, nguồn hàng, đích đến..."
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {keyword && (
                    <button
                      type="button"
                      aria-label="Xóa từ khóa"
                      onClick={() => setKeyword("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}

                </div>

                {/* BRANCH FILTER */}

                <select
                  value={branchFilter}
                  aria-label="Lọc theo chi nhánh"
                  onChange={(event) => {
                    setBranchFilter(event.target.value);
                    setSerialScope(null);
                  }}
                  className={SELECT_CLASS}
                >
                  <option value="ALL">
                    Tất cả chi nhánh
                  </option>

                  {branchOptions.map((branchId) => (
                    <option
                      key={branchId}
                      value={branchId}
                    >
                      Chi nhánh #{branchId}
                    </option>
                  ))}

                </select>

                {/* STOCK STATUS FILTER */}

                {activeTab === "STOCK" && (
                  <select
                    value={stockStatusFilter}
                    aria-label="Lọc trạng thái tồn kho"
                    onChange={(event) => {
                      setStockStatusFilter(
                        event.target.value,
                      );

                      setCurrentPage(1);
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="ALL">
                      Tất cả trạng thái
                    </option>

                    <option value="IN_STOCK">
                      Còn hàng
                    </option>

                    <option value="OUT_OF_STOCK">
                      Hết hàng
                    </option>

                    <option value="NEGATIVE">
                      Tồn kho âm
                    </option>
                  </select>
                )}

                {/* SERIAL STATUS FILTER */}

                {activeTab === "SERIAL" && (
                  <select
                    value={serialStatusFilter}
                    aria-label="Lọc trạng thái Serial"
                    onChange={(event) =>
                      setSerialStatusFilter(
                        event.target.value as
                          | SerialStatus
                          | "ALL",
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="ALL">
                      Tất cả trạng thái
                    </option>

                    {SERIAL_STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status.code}
                          value={status.code}
                        >
                          {status.label}
                        </option>
                      ),
                    )}

                  </select>
                )}

                {/* TRANSACTION TYPE FILTER */}

                {activeTab === "TRANSACTION" && (
                  <select
                    value={transactionTypeFilter}
                    aria-label="Lọc loại giao dịch"
                    onChange={(event) =>
                      setTransactionTypeFilter(
                        event.target.value as
                          | TransactionType
                          | "ALL",
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="ALL">
                      Tất cả giao dịch
                    </option>

                    {TRANSACTION_TYPE_OPTIONS.map(
                      (type) => (
                        <option
                          key={type.code}
                          value={type.code}
                        >
                          {type.label}
                        </option>
                      ),
                    )}

                  </select>
                )}

                {/* REFRESH BUTTON */}

                <button
                  type="button"
                  onClick={retryLoad}
                  title="Làm mới dữ liệu"
                  aria-label="Làm mới dữ liệu"
                  className={BUTTON_CLASS}
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading ? "animate-spin" : ""
                    }
                  />
                </button>

              </div>

            </div>

            {/* SERIAL SKU SCOPE */}

            {activeTab === "SERIAL" && serialScope && (
              <div className="mt-4 flex flex-wrap items-center gap-3">

                <span className="break-all rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  Kho #{serialScope.inventoryId}
                  {" · "}
                  SKU: {serialScope.sku}
                </span>

                <button
                  type="button"
                  onClick={() => setSerialScope(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600"
                >
                  <X size={14} />

                  Bỏ lọc SKU
                </button>

              </div>
            )}

          </div>

          {/* ================================================== */}
          {/* INVENTORY TABLE */}
          {/* ================================================== */}

          <div
            className="overflow-x-auto"
            aria-busy={loading}
          >

            <table className="w-full min-w-[950px] text-left">

              <thead className="bg-slate-50">

                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">

                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className={`whitespace-nowrap px-5 py-4 ${
                        header === "Thao tác"
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {header}
                    </th>
                  ))}

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {/* LOADING */}

                {loading ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-5 py-16 text-center"
                    >

                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-blue-600"
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Đang tải dữ liệu kho hàng...
                      </p>

                    </td>
                  </tr>
                ) : error ? (

                  /* ERROR */

                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-5 py-16 text-center"
                    >

                      <AlertCircle
                        size={26}
                        className="mx-auto text-rose-500"
                      />

                      <p className="mt-3 font-semibold text-rose-600">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={retryLoad}
                        className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Thử tải lại
                      </button>

                    </td>
                  </tr>
                ) : totalRecords === 0 ? (

                  /* EMPTY DATA */

                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-5 py-16 text-center"
                    >

                      <Package
                        size={30}
                        className="mx-auto text-slate-400"
                      />

                      <p className="mt-3 font-semibold text-slate-700">
                        Không tìm thấy dữ liệu
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Thử thay đổi từ khóa hoặc điều kiện lọc.
                      </p>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Đặt lại bộ lọc
                      </button>

                    </td>
                  </tr>
                ) : (
                  <>

                    {/* ================================================== */}
                    {/* STOCK ROWS */}
                    {/* ================================================== */}

                    {activeTab === "STOCK" &&
                      paginatedStocks.map((stock) => (
                        <tr
                          key={`${stock.inventory_id}-${stock.inventory_sku_id}`}
                          className={ROW_CLASS}
                        >

                          {/* INVENTORY ID */}

                          <td className={TABLE_CELL_CLASS}>

                            <div className="flex items-center gap-3">

                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">

                                <Warehouse size={19} />

                              </div>

                              <div>

                                <p className="font-semibold text-slate-800">
                                  Kho #{stock.inventory_id}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  ID: {stock.inventory_id}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* BRANCH */}

                          <td className={TABLE_CELL_CLASS}>

                            <p className="font-medium text-slate-700">
                              Chi nhánh #
                              {
                                stock.inventory
                                  .inventory_branch_id
                              }
                            </p>

                          </td>

                          {/* SKU */}

                          <td className={TABLE_CELL_CLASS}>

                            <p className="font-semibold text-slate-800">
                              {stock.sku.inventory_sku_code}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              SKU ID: {stock.inventory_sku_id}
                            </p>

                          </td>

                          {/* QUANTITY */}

                          <td className={TABLE_CELL_CLASS}>

                            <p
                              className={`text-base font-bold ${
                                stock.inventory_stock_quantity > 0
                                  ? "text-slate-800"
                                  : "text-rose-600"
                              }`}
                            >
                              {formatNumber(
                                stock.inventory_stock_quantity,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Sản phẩm
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className={TABLE_CELL_CLASS}>

                            <StatusBadge
                              label={getStockStatusLabel(
                                stock.inventory_stock_quantity,
                              )}
                              style={getStockStatusStyle(
                                stock.inventory_stock_quantity,
                              )}
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className={TABLE_CELL_CLASS}>

                            <div className="flex items-center justify-center gap-1.5">

                              <DetailButton
                                title="Xem chi tiết tồn kho"
                                onClick={() =>
                                  setSelectedDetail({
                                    type: "STOCK",
                                    data: stock,
                                  })
                                }
                              />

                              <button
                                type="button"
                                title="Xem danh sách Serial Number"
                                aria-label="Xem danh sách Serial Number"
                                onClick={() =>
                                  handleViewStockSerials(stock)
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-violet-50 hover:text-violet-600"
                              >
                                <Hash size={18} />
                              </button>

                            </div>

                          </td>

                        </tr>
                      ))}

                    {/* ================================================== */}
                    {/* SERIAL ROWS */}
                    {/* ================================================== */}

                    {activeTab === "SERIAL" &&
                      paginatedSerials.map((serial) => {

                        const status =
                          serial.status
                            ?.inventory_sku_serial_status_code ??
                          "";

                        return (
                          <tr
                            key={serial.inventory_sku_serial_id}
                            className={ROW_CLASS}
                          >

                            {/* SERIAL NUMBER */}

                            <td className={TABLE_CELL_CLASS}>

                              <div className="flex items-center gap-3">

                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">

                                  <Hash size={19} />

                                </div>

                                <div>

                                  <p className="font-semibold text-slate-800">
                                    {
                                      serial.inventory_sku_serial_number
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    ID: {
                                      serial.inventory_sku_serial_id
                                    }
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* SKU */}

                            <td className={TABLE_CELL_CLASS}>

                              <p className="font-medium text-slate-800">
                                {serial.sku.inventory_sku_code}
                              </p>

                            </td>

                            {/* INVENTORY */}

                            <td className={TABLE_CELL_CLASS}>
                              Kho #{serial.inventory_id}
                            </td>

                            {/* BRANCH */}

                            <td className={TABLE_CELL_CLASS}>
                              Chi nhánh #
                              {
                                serial.inventory
                                  .inventory_branch_id
                              }
                            </td>

                            {/* STATUS */}

                            <td className={TABLE_CELL_CLASS}>

                              <StatusBadge
                                label={getSerialStatusLabel(
                                  status,
                                  serial.status
                                    ?.inventory_sku_serial_status_name,
                                )}
                                style={getSerialStatusStyle(
                                  status,
                                )}
                              />

                            </td>

                            {/* ACTIONS */}

                            <td className={TABLE_CELL_CLASS}>

                              <div className="flex justify-center">

                                <DetailButton
                                  title="Xem chi tiết Serial Number"
                                  onClick={() =>
                                    setSelectedDetail({
                                      type: "SERIAL",
                                      data: serial,
                                    })
                                  }
                                />

                              </div>

                            </td>

                          </tr>
                        );
                      })}

                    {/* ================================================== */}
                    {/* TRANSACTION ROWS */}
                    {/* ================================================== */}

                    {activeTab === "TRANSACTION" &&
                      paginatedTransactions.map(
                        (transaction) => {

                          const type =
                            transaction.type
                              ?.inventory_transaction_type_code ??
                            "";

                          const totalQuantity =
                            transaction.items.reduce(
                              (total, item) =>
                                total +
                                item.inventory_transaction_item_quantity,
                              0,
                            );

                          return (
                            <tr
                              key={
                                transaction.inventory_transaction_id
                              }
                              className={ROW_CLASS}
                            >

                              {/* TRANSACTION ID */}

                              <td className={TABLE_CELL_CLASS}>

                                <div className="flex items-center gap-3">

                                  <div
                                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${getTransactionTypeStyle(
                                      type,
                                    )}`}
                                  >

                                    {getTransactionIcon(type)}

                                  </div>

                                  <div>

                                    <p className="font-semibold text-slate-800">
                                      #
                                      {
                                        transaction.inventory_transaction_id
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      Giao dịch kho
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* TYPE */}

                              <td className={TABLE_CELL_CLASS}>

                                <StatusBadge
                                  label={getTransactionTypeLabel(
                                    type,
                                    transaction.type
                                      ?.inventory_transaction_type_name,
                                  )}
                                  style={getTransactionTypeStyle(
                                    type,
                                  )}
                                />

                              </td>

                              {/* INVENTORY AND BRANCH */}

                              <td className={TABLE_CELL_CLASS}>

                                <p className="font-semibold text-slate-800">
                                  Kho #
                                  {transaction.inventory_id}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Chi nhánh #
                                  {
                                    transaction.inventory
                                      .inventory_branch_id
                                  }
                                </p>

                              </td>

                              {/* FROM AND TO */}

                              <td className={TABLE_CELL_CLASS}>

                                <p className="text-sm text-slate-700">
                                  <span className="font-medium">
                                    Từ:
                                  </span>
                                  {" "}
                                  {transaction.inventory_transaction_from ||
                                    "—"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  <span className="font-medium">
                                    Đến:
                                  </span>
                                  {" "}
                                  {transaction.inventory_transaction_to ||
                                    "—"}
                                </p>

                              </td>

                              {/* QUANTITY */}

                              <td className={TABLE_CELL_CLASS}>

                                <p className="font-bold text-slate-800">
                                  {formatNumber(totalQuantity)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {transaction.items.length} SKU
                                </p>

                              </td>

                              {/* CREATED AT */}

                              <td className={TABLE_CELL_CLASS}>

                                <p className="whitespace-nowrap text-sm text-slate-600">
                                  {formatDateTime(
                                    transaction.inventory_transaction_created_at,
                                  )}
                                </p>

                              </td>

                              {/* ACTIONS */}

                              <td className={TABLE_CELL_CLASS}>

                                <div className="flex justify-center">

                                  <DetailButton
                                    title="Xem chi tiết giao dịch"
                                    onClick={() =>
                                      setSelectedDetail({
                                        type: "TRANSACTION",
                                        data: transaction,
                                      })
                                    }
                                  />

                                </div>

                              </td>

                            </tr>
                          );
                        },
                      )}

                  </>
                )}

              </tbody>

            </table>

          </div>

          {/* ================================================== */}
          {/* PAGINATION */}
          {/* ================================================== */}

          {!loading && !error && (
            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

              <p className="text-sm text-slate-500">

                Hiển thị{" "}

                <span className="font-semibold text-slate-700">

                  {totalRecords === 0
                    ? 0
                    : startIndex + 1}

                  {" - "}

                  {Math.min(
                    endIndex,
                    totalRecords,
                  )}

                </span>

                {" "}trên{" "}

                <span className="font-semibold text-slate-700">
                  {formatNumber(totalRecords)}
                </span>

                {" "}bản ghi

              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={safePage <= 1}
                  onClick={() =>
                    setCurrentPage(safePage - 1)
                  }
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                  Trang {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage(safePage + 1)
                  }
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>

              </div>

            </div>
          )}

        </section>

      </div>

      {/* ================================================== */}
      {/* DETAIL MODAL */}
      {/* ================================================== */}

      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedDetail(null);
            }
          }}
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-detail-title"
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2
                  id="inventory-detail-title"
                  className="text-lg font-bold text-slate-800"
                >

                  {selectedDetail.type === "STOCK"
                    ? "Chi tiết tồn kho"
                    : selectedDetail.type === "SERIAL"
                      ? "Chi tiết Serial Number"
                      : "Chi tiết giao dịch kho"}

                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Xem thông tin chi tiết dữ liệu kho hàng.
                </p>

              </div>

              <button
                type="button"
                aria-label="Đóng cửa sổ"
                onClick={() => setSelectedDetail(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">

              {selectedDetail.type === "STOCK" && (
                <StockDetail
                  stock={selectedDetail.data}
                />
              )}

              {selectedDetail.type === "SERIAL" && (
                <SerialDetail
                  serial={selectedDetail.data}
                />
              )}

              {selectedDetail.type === "TRANSACTION" && (
                <TransactionDetail
                  transaction={selectedDetail.data}
                />
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Đóng
              </button>

              {selectedDetail.type === "STOCK" && (
                <button
                  type="button"
                  onClick={() =>
                    handleViewStockSerials(
                      selectedDetail.data,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >

                  <Hash size={17} />

                  Xem Serial Number

                </button>
              )}

            </div>

          </section>

        </div>
      )}

    </>
  );
}

// ======================================================
// STOCK DETAIL COMPONENT
// ======================================================

function StockDetail({
  stock,
}: {
  stock: StockRow;
}) {
  return (
    <>
      {/* STOCK OVERVIEW */}

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-center gap-4">

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">

              <Package size={28} />

            </div>

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mã SKU
              </p>

              <h3 className="mt-1 break-all text-lg font-bold text-slate-800">
                {stock.sku.inventory_sku_code}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                SKU ID: {stock.inventory_sku_id}
              </p>

            </div>

          </div>

          <StatusBadge
            label={getStockStatusLabel(
              stock.inventory_stock_quantity,
            )}
            style={getStockStatusStyle(
              stock.inventory_stock_quantity,
            )}
          />

        </div>

      </div>

      {/* STOCK INFORMATION */}

      <section>

        <SectionTitle
          icon={<Warehouse size={18} />}
          title="Thông tin kho hàng"
        />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

          <DetailRow
            icon={<Warehouse size={18} />}
            label="Mã kho"
            value={`Kho #${stock.inventory_id}`}
          />

          <DetailRow
            icon={<Store size={18} />}
            label="Chi nhánh"
            value={`Chi nhánh #${stock.inventory.inventory_branch_id}`}
          />

          <DetailRow
            icon={<Hash size={18} />}
            label="SKU ID"
            value={String(stock.inventory_sku_id)}
          />

          <DetailRow
            icon={<Package size={18} />}
            label="Mã SKU"
            value={stock.sku.inventory_sku_code}
          />

          <DetailRow
            icon={<CalendarDays size={18} />}
            label="Ngày tạo kho"
            value={formatDateTime(
              stock.inventory.inventory_created_at,
            )}
          />

          <DetailRow
            icon={<CalendarDays size={18} />}
            label="Cập nhật thông tin kho"
            value={formatDateTime(
              stock.inventory.inventory_updated_at,
            )}
          />

        </div>

      </section>

      {/* STOCK QUANTITY */}

      <section>

        <SectionTitle
          icon={<Boxes size={18} />}
          title="Thông tin tồn kho"
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Số lượng tồn kho hiện tại
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${
                  stock.inventory_stock_quantity > 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {formatNumber(
                  stock.inventory_stock_quantity,
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Đơn vị: sản phẩm
              </p>

            </div>

            <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-emerald-600">

              <Boxes size={28} />

            </div>

          </div>

        </div>

      </section>
    </>
  );
}

// ======================================================
// SERIAL DETAIL COMPONENT
// ======================================================

function SerialDetail({
  serial,
}: {
  serial: InventorySerial;
}) {
  const status =
    serial.status?.inventory_sku_serial_status_code ??
    "";

  return (
    <>
      {/* SERIAL OVERVIEW */}

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-center gap-4">

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600">

              <Hash size={28} />

            </div>

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Serial Number
              </p>

              <h3 className="mt-1 break-all text-lg font-bold text-slate-800">
                {serial.inventory_sku_serial_number}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Serial ID: {
                  serial.inventory_sku_serial_id
                }
              </p>

            </div>

          </div>

          <StatusBadge
            label={getSerialStatusLabel(
              status,
              serial.status
                ?.inventory_sku_serial_status_name,
            )}
            style={getSerialStatusStyle(status)}
          />

        </div>

      </div>

      {/* SERIAL INFORMATION */}

      <section>

        <SectionTitle
          icon={<Hash size={18} />}
          title="Thông tin Serial Number"
        />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

          <DetailRow
            icon={<Hash size={18} />}
            label="Serial ID"
            value={String(
              serial.inventory_sku_serial_id,
            )}
          />

          <DetailRow
            icon={<Hash size={18} />}
            label="Serial Number"
            value={serial.inventory_sku_serial_number}
          />

          <DetailRow
            icon={<Package size={18} />}
            label="Mã SKU"
            value={serial.sku.inventory_sku_code}
          />

          <DetailRow
            icon={<Hash size={18} />}
            label="SKU ID"
            value={String(
              serial.inventory_sku_id,
            )}
          />

          <DetailRow
            icon={<Warehouse size={18} />}
            label="Kho hàng"
            value={`Kho #${serial.inventory_id}`}
          />

          <DetailRow
            icon={<Store size={18} />}
            label="Chi nhánh"
            value={`Chi nhánh #${serial.inventory.inventory_branch_id}`}
          />

          <DetailRow
            icon={<ClipboardList size={18} />}
            label="Trạng thái"
            value={getSerialStatusLabel(
              status,
              serial.status
                ?.inventory_sku_serial_status_name,
            )}
          />

          <DetailRow
            icon={<Hash size={18} />}
            label="Mã trạng thái"
            value={status}
          />

        </div>

      </section>
    </>
  );
}

// ======================================================
// TRANSACTION DETAIL COMPONENT
// ======================================================

function TransactionDetail({
  transaction,
}: {
  transaction: InventoryTransaction;
}) {
  const type =
    transaction.type
      ?.inventory_transaction_type_code ?? "";

  const totalQuantity =
    transaction.items.reduce(
      (total, item) =>
        total +
        item.inventory_transaction_item_quantity,
      0,
    );

  return (
    <>
      {/* TRANSACTION OVERVIEW */}

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Mã giao dịch
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-800">
              Giao dịch #
              {transaction.inventory_transaction_id}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {formatDateTime(
                transaction.inventory_transaction_created_at,
              )}
            </p>

          </div>

          <StatusBadge
            label={getTransactionTypeLabel(
              type,
              transaction.type
                ?.inventory_transaction_type_name,
            )}
            style={getTransactionTypeStyle(type)}
          />

        </div>

      </div>

      {/* TRANSACTION INFORMATION */}

      <section>

        <SectionTitle
          icon={<ClipboardList size={18} />}
          title="Thông tin giao dịch"
        />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

          <DetailRow
            icon={<Hash size={18} />}
            label="Transaction ID"
            value={String(
              transaction.inventory_transaction_id,
            )}
          />

          <DetailRow
            icon={<ClipboardList size={18} />}
            label="Loại giao dịch"
            value={getTransactionTypeLabel(
              type,
              transaction.type
                ?.inventory_transaction_type_name,
            )}
          />

          <DetailRow
            icon={<Warehouse size={18} />}
            label="Kho hàng"
            value={`Kho #${transaction.inventory_id}`}
          />

          <DetailRow
            icon={<Store size={18} />}
            label="Chi nhánh"
            value={`Chi nhánh #${transaction.inventory.inventory_branch_id}`}
          />

          <DetailRow
            icon={<ArrowUpFromLine size={18} />}
            label="Nguồn hàng"
            value={
              transaction.inventory_transaction_from ??
              "—"
            }
          />

          <DetailRow
            icon={<ArrowDownToLine size={18} />}
            label="Đích đến"
            value={
              transaction.inventory_transaction_to ??
              "—"
            }
          />

          <DetailRow
            icon={<CalendarDays size={18} />}
            label="Ngày tạo giao dịch"
            value={formatDateTime(
              transaction.inventory_transaction_created_at,
            )}
          />

          <DetailRow
            icon={<CalendarDays size={18} />}
            label="Cập nhật lần cuối"
            value={formatDateTime(
              transaction.inventory_transaction_updated_at,
            )}
          />

        </div>

      </section>

      {/* TRANSACTION SUMMARY */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">

          <p className="text-sm font-medium text-blue-700">
            Tổng số SKU
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {formatNumber(transaction.items.length)}
          </p>

        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">

          <p className="text-sm font-medium text-emerald-700">
            Tổng số lượng giao dịch
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatNumber(totalQuantity)}
          </p>

        </div>

      </section>

      {/* TRANSACTION ITEMS */}

      <section>

        <SectionTitle
          icon={<Package size={18} />}
          title="Danh sách sản phẩm trong giao dịch"
        />

        <div className="overflow-hidden rounded-xl border border-slate-200">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left">

              <thead className="bg-slate-50">

                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-4 py-3">
                    Mã SKU
                  </th>

                  <th className="px-4 py-3 text-center">
                    Số lượng
                  </th>

                  <th className="px-4 py-3 text-center">
                    Tồn trước
                  </th>

                  <th className="px-4 py-3 text-center">
                    Tồn sau
                  </th>

                  <th className="px-4 py-3 text-center">
                    Thay đổi
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {transaction.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Giao dịch không có sản phẩm.
                    </td>
                  </tr>
                ) : (
                  transaction.items.map((item) => {

                    const difference =
                      item.inventory_transaction_item_after -
                      item.inventory_transaction_item_before;

                    return (
                      <tr
                        key={`${item.inventory_transaction_id}-${item.inventory_sku_id}`}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-4 py-4">

                          <p className="text-sm font-semibold text-slate-800">
                            {item.sku.inventory_sku_code}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            SKU ID: {item.inventory_sku_id}
                          </p>

                        </td>

                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-800">

                          {formatNumber(
                            item.inventory_transaction_item_quantity,
                          )}

                        </td>

                        <td className="px-4 py-4 text-center text-sm text-slate-600">

                          {formatNumber(
                            item.inventory_transaction_item_before,
                          )}

                        </td>

                        <td className="px-4 py-4 text-center text-sm font-semibold text-slate-800">

                          {formatNumber(
                            item.inventory_transaction_item_after,
                          )}

                        </td>

                        <td className="px-4 py-4 text-center">

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              difference > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : difference < 0
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >

                            {difference > 0 ? "+" : ""}
                            {formatNumber(difference)}

                          </span>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>
    </>
  );
}

// ======================================================
// STATUS BADGE COMPONENT
// ======================================================

function StatusBadge({
  label,
  style,
}: {
  label: string;
  style: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >

      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {label}

    </span>
  );
}

// ======================================================
// DETAIL BUTTON COMPONENT
// ======================================================

function DetailButton({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
    >
      <Eye size={18} />
    </button>
  );
}

// ======================================================
// SECTION TITLE COMPONENT
// ======================================================

function SectionTitle({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">

      <span className="text-blue-600">
        {icon}
      </span>

      {title}

    </h3>
  );
}

// ======================================================
// DETAIL ROW COMPONENT
// ======================================================

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 shrink-0 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>

      </div>

    </div>
  );
}

// ======================================================
// STAT CARD COMPONENT
// ======================================================

function StatCard({
  title,
  value,
  description,
  icon,
  color,
  loading,
  failed,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  color: "blue" | "violet" | "amber" | "emerald";
  loading: boolean;
  failed: boolean;
}) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-slate-800",
    },

    violet: {
      icon: "bg-violet-50 text-violet-600",
      value: "text-violet-600",
    },

    amber: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <LoaderCircle
              size={24}
              className="mt-3 animate-spin text-slate-400"
            />
          ) : (
            <p
              className={`mt-2 text-3xl font-bold ${styles[color].value}`}
            >
              {failed
                ? "—"
                : value.toLocaleString("vi-VN")}
            </p>
          )}

        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${styles[color].icon}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}