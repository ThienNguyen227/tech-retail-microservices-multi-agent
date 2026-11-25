"use client";

import {
  useRef,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";

import {
  Search,
  Warehouse,
  Package,
  Boxes,
  Hash,
  Clock3,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  LoaderCircle,
  X,
  CheckCircle2,
  ClipboardList,
  ScanBarcode,
  Plus,
  PackagePlus,
  Pencil,
  Save,
} from "lucide-react";

import axios from "axios";

import {
  adminInventoryService,
  type Warehouse1Stock,
  type Warehouse1Serial,
  type SerialStatus,
  type CreateWarehouse1SkusResult,
  type UpdateWarehouse1SkuResult,
  type CreateWarehouse1SerialsResult,
  type UpdateWarehouse1SerialResult,
} from "@/lib/axios/services/admin-services/inventory_service";

// ======================================================
// CONSTANTS
// ======================================================

const PAGE_SIZE = 8;

const SERIAL_PAGE_SIZE = 10;
const MAX_BATCH_SIZE = 500;
const MAX_SKU_LENGTH = 200;
const MAX_SERIAL_LENGTH = 200;
const MAX_SOURCE_LENGTH = 255;

// Thời gian chờ giữa hai lần đồng bộ thành công hoặc thất bại.
const POLLING_INTERVAL = 5000;

// ======================================================
// TYPES
// ======================================================

type StockStatusFilter =
  | "ALL"
  | "IN_STOCK"
  | "OUT_OF_STOCK"
  | "NEGATIVE";

type SerialStatusFilter = SerialStatus | "ALL";
type EditableSerialStatus = "AVAILABLE" | "CANCELLED";

function isEditableSerialStatus(status: string): status is EditableSerialStatus {
  return status === "AVAILABLE" || status === "CANCELLED";
}

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
// COMMON STYLES
// ======================================================

const SELECT_CLASS =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const PAGINATION_BUTTON_CLASS =
  "grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

// ======================================================
// HELPERS
// ======================================================

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
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

  if (error instanceof Error && !axios.isAxiosError(error) && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

// ======================================================
// STOCK STATUS HELPERS
// ======================================================

function getStockStatusLabel(quantity: number) {
  if (quantity > 0) {
    return "Còn hàng";
  }

  if (quantity === 0) {
    return "Hết hàng";
  }

  return "Tồn kho âm";
}

function getStockStatusStyle(quantity: number) {
  if (quantity > 0) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (quantity === 0) {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
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
// MERGE SERIAL UPDATE RESPONSE
// ======================================================

function mergeUpdatedSerial(stock: Warehouse1Stock, result: UpdateWarehouse1SerialResult): Warehouse1Stock {
  if (stock.inventory_id !== result.inventory_id || stock.inventory_sku_id !== result.inventory_sku_id) return stock;

  const current = stock.serials.find((serial) => serial.inventory_sku_serial_id === result.serial.inventory_sku_serial_id);
  if (!current) return stock;

  // Nếu GET đã nhận dữ liệu mới (hoặc một thay đổi khác), không ghi đè snapshot đó.
  if (current.inventory_sku_serial_number !== result.old_serial_number ||
      current.status.inventory_sku_serial_status_code !== result.old_status) return stock;

  const serials = stock.serials.map((serial) =>
    serial.inventory_sku_serial_id === result.serial.inventory_sku_serial_id ? result.serial : serial,
  );
  return {
    ...stock,
    inventory_stock_quantity: result.inventory_stock_quantity_after,
    serials,
    serial_statistics: {
      total: serials.length,
      available: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "AVAILABLE").length,
      reserved: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "RESERVED").length,
      cancelled: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "CANCELLED").length,
      sold: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "SOLD").length,
    },
  };
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function Warehouse1Page() {

  // ======================================================
  // DATA, FILTERS AND MODAL
  // ======================================================

  const [allStocks, setAllStocks] = useState<Warehouse1Stock[]>([]);
  const [keyword, setKeyword] = useState("");
  const [stockStatusFilter, setStockStatusFilter] =
    useState<StockStatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // CREATE SKU
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bulkResult, setBulkResult] = useState<CreateWarehouse1SkusResult | null>(null);
  const [createdSkuIds, setCreatedSkuIds] = useState<number[]>([]);
  const [showCreatedOnly, setShowCreatedOnly] = useState(false);
  // UPDATE SKU: giữ ID và mã gốc, lấy số lượng/Serial từ snapshot mới nhất.
  const [editingSku, setEditingSku] = useState<{ id: number; code: string } | null>(null);
  const [updateToast, setUpdateToast] = useState<{ id: number; message: string } | null>(null);
  const mutationVersion = useRef(0);
  const canReadRef = useRef(false);

  // Tự ẩn thông báo nếu tất cả SKU đều được thêm. Nếu có SKU bị bỏ qua,
  // giữ kết quả đến khi người dùng chủ động đóng để có thời gian kiểm tra.
  useEffect(() => {
    if (!bulkResult || bulkResult.total_skipped > 0) return;
    const timer = window.setTimeout(() => setBulkResult(null), 5000);
    return () => window.clearTimeout(timer);
  }, [bulkResult]);

  useEffect(() => {
    if (!updateToast) return;
    const timer = window.setTimeout(() => setUpdateToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [updateToast]);

  // ======================================================
  // AUTO REFRESH (POLLING)
  // ======================================================

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;

    function clearTimer() {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    }

    function scheduleNext() {
      clearTimer();
      if (!controller.signal.aborted && !document.hidden) {
        timer = setTimeout(() => void loadWarehouseData(), POLLING_INTERVAL);
      }
    }

    async function loadWarehouseData() {
      // Không gửi request chồng nhau hoặc khi tab đang bị ẩn.
      if (controller.signal.aborted || inFlight || document.hidden) return;

      clearTimer();
      inFlight = true;
      const requestVersion = mutationVersion.current;
      setIsRefreshing(true);

      try {
        const response = await adminInventoryService.getWarehouse1InventoryList(
          undefined,
          controller.signal,
        );

        // Không để GET bắt đầu trước POST/PATCH ghi đè dữ liệu vừa thay đổi.
        if (controller.signal.aborted || requestVersion !== mutationVersion.current) return;

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || "Dữ liệu Kho 1 không hợp lệ.");
        }

        const nextStocks = response.data;
        canReadRef.current = true;
        setAllStocks(nextStocks);
        setLastUpdated(new Date());
        setStatsError("");

        // Đóng modal nếu SKU đang xem không còn thuộc Kho 1.
        setSelectedSkuId((id) =>
          id !== null && !nextStocks.some((stock) => stock.inventory_sku_id === id)
            ? null
            : id,
        );
      } catch (err: unknown) {
        if (controller.signal.aborted || requestVersion !== mutationVersion.current) return;

        // Không giữ dữ liệu kho khi Backend từ chối quyền truy cập.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401 || status === 403) {
          canReadRef.current = false;
          setAllStocks([]);
          setLastUpdated(null);
          setSelectedSkuId(null);
          setCreatedSkuIds([]);
          setShowCreatedOnly(false);
          setBulkResult(null);
          setEditingSku(null);
          setShowCreateModal(false);
          setUpdateToast(null);
        }

        // Với lỗi mạng tạm thời, giữ snapshot thành công gần nhất.
        setStatsError(extractErrorMessage(err, "Không thể tải dữ liệu Kho 1."));
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) {
          setStatsLoading(false);
          setIsRefreshing(false);
          scheduleNext();
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearTimer();
      } else {
        void loadWarehouseData();
      }
    }

    function handleFocus() {
      if (!document.hidden) void loadWarehouseData();
    }

    void loadWarehouseData();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      controller.abort();
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshKey]);

  // Chỉ hiển thị loading toàn bảng khi chưa có snapshot thành công.
  const loading = statsLoading;
  const error = lastUpdated ? "" : statsError;

  // Modal luôn sử dụng dữ liệu mới nhất, không lưu bản sao SKU vào state.
  const selectedStock = useMemo(
    () => allStocks.find((stock) => stock.inventory_sku_id === selectedSkuId),
    [allStocks, selectedSkuId],
  );

  const editingStock = allStocks.find(
    (stock) => stock.inventory_sku_id === editingSku?.id,
  );

  // ======================================================
  // WAREHOUSE STATISTICS
  // ======================================================

  const statistics = useMemo(() => {
    return allStocks.reduce(
      (result, stock) => {

        result.totalSkus += 1;

        result.totalStockQuantity +=
          stock.inventory_stock_quantity;

        result.totalSerials +=
          stock.serial_statistics.total;

        result.availableSerials +=
          stock.serial_statistics.available;

        result.reservedSerials +=
          stock.serial_statistics.reserved;

        result.cancelledSerials +=
          stock.serial_statistics.cancelled;

        result.soldSerials +=
          stock.serial_statistics.sold;

        if (stock.inventory_stock_quantity === 0) {
          result.outOfStockSkus += 1;
        }

        return result;
      },
      {
        totalSkus: 0,
        totalStockQuantity: 0,
        totalSerials: 0,
        availableSerials: 0,
        reservedSerials: 0,
        cancelledSerials: 0,
        soldSerials: 0,
        outOfStockSkus: 0,
      },
    );
  }, [allStocks]);

  // ======================================================
  // FILTER SKU, SERIAL NUMBER AND STOCK STATUS
  // ======================================================

  const filteredStocks = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    const createdIds = new Set(createdSkuIds);
    const matches = allStocks.filter((stock) => {
      if (showCreatedOnly && !createdIds.has(stock.inventory_sku_id)) return false;
      const matchesSearch =
        !search ||
        stock.inventory_sku_code.toLowerCase().includes(search) ||
        stock.serials.some((serial) =>
          serial.inventory_sku_serial_number.toLowerCase().includes(search),
        );

      if (!matchesSearch) return false;

      const quantity = stock.inventory_stock_quantity;

      switch (stockStatusFilter) {
        case "IN_STOCK":
          return quantity > 0;

        case "OUT_OF_STOCK":
          return quantity === 0;

        case "NEGATIVE":
          return quantity < 0;

        default:
          return true;
      }
    });

    // Ưu tiên mã SKU khớp chính xác khi tìm kiếm (kể cả SKU vừa thêm).
    if (search) {
      matches.sort((a, b) =>
        Number(b.inventory_sku_code.toLowerCase() === search) -
        Number(a.inventory_sku_code.toLowerCase() === search),
      );
    }
    return matches;
  }, [allStocks, keyword, stockStatusFilter, showCreatedOnly, createdSkuIds]);

  // ======================================================
  // PAGINATION
  // ======================================================

  const totalRecords = filteredStocks.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;

  const endIndex = safePage * PAGE_SIZE;

  const paginatedStocks = filteredStocks.slice(
    startIndex,
    endIndex,
  );

  // ======================================================
  // ACTIONS
  // ======================================================

  function handleSearch(value: string) {
    setShowCreatedOnly(false);
    setKeyword(value);
    setCurrentPage(1);
  }

  function handleStockStatusChange(value: StockStatusFilter) {
    setShowCreatedOnly(false);
    setStockStatusFilter(value);
    setCurrentPage(1);
  }

  function resetFilters() {
    setShowCreatedOnly(false);
    setCreatedSkuIds([]);
    setKeyword("");
    setStockStatusFilter("ALL");
    setCurrentPage(1);
  }

  function retryLoad() {
    if (isRefreshing) return;
    setRefreshKey((previous) => previous + 1);
  }

  function handleChangePage(page: number) {
    setCurrentPage(page);
  }

  // ======================================================
  // CREATE SKU SUCCESS
  // ======================================================

  function handleCreateSuccess(result: CreateWarehouse1SkusResult) {
    // Vô hiệu hóa snapshot GET cũ trước khi cập nhật dữ liệu vừa tạo.
    mutationVersion.current += 1;
    if (canReadRef.current && result.created_stocks.length > 0) {
      setAllStocks((previous) => {
        const byId = new Map(previous.map((stock) => [stock.inventory_sku_id, stock]));
        for (const stock of result.created_stocks) {
          byId.set(stock.inventory_sku_id, stock);
        }
        return [...byId.values()].sort((a, b) => a.inventory_sku_id - b.inventory_sku_id);
      });
      // Chỉ hiển thị các SKU vừa tạo để người dùng thấy ngay cả khi có nhiều trang.
      setCreatedSkuIds(result.created_stocks.map((stock) => stock.inventory_sku_id));
      setShowCreatedOnly(true);
      setKeyword("");
      setStockStatusFilter("ALL");
      setCurrentPage(1);
    }
    setShowCreateModal(false);
    setBulkResult(canReadRef.current ? result : null);
    // Buộc GET mới chạy ngay, không chờ polling định kỳ.
    setRefreshKey((previous) => previous + 1);
  }

  // ======================================================
  // UPDATE SKU SUCCESS
  // ======================================================

  function handleUpdateSuccess(result: UpdateWarehouse1SkuResult, message: string) {
    // Loại bỏ snapshot GET đã bắt đầu trước khi PATCH hoàn tất.
    mutationVersion.current += 1;
    if (canReadRef.current) {
      const { old_inventory_sku_id, old_inventory_sku_code, ...updatedStock } = result;
      setAllStocks((previous) => {
        const byId = new Map(previous.map((stock) => [stock.inventory_sku_id, stock]));
        byId.delete(old_inventory_sku_id);
        byId.set(updatedStock.inventory_sku_id, updatedStock);
        return [...byId.values()].sort((a, b) => a.inventory_sku_id - b.inventory_sku_id);
      });
      // Đồng bộ các ID của bộ lọc SKU vừa thêm nếu ID đã thay đổi.
      setCreatedSkuIds((ids) => [...new Set(ids.map((id) =>
        id === old_inventory_sku_id ? updatedStock.inventory_sku_id : id,
      ))]);
      setSelectedSkuId(null);
      setShowCreatedOnly(false);
      setKeyword(updatedStock.inventory_sku_code);
      setStockStatusFilter("ALL");
      setCurrentPage(1);
      setUpdateToast({
        id: updatedStock.inventory_sku_id,
        message: message || `Đã cập nhật SKU "${old_inventory_sku_code}" thành "${updatedStock.inventory_sku_code}".`,
      });
    }
    setEditingSku(null);
    // Đồng bộ lại ngay, kể cả khi GET trước đó chưa hoàn thành.
    setRefreshKey((previous) => previous + 1);
  }

  // ======================================================
  // CREATE SERIALS SUCCESS
  // ======================================================

  function handleCreateSerialsSuccess(result: CreateWarehouse1SerialsResult) {
    // Vô hiệu hóa GET đã bắt đầu trước khi nhận kết quả POST.
    mutationVersion.current += 1;

    if (canReadRef.current && result.total_created > 0) {
      setAllStocks((previous) => previous.map((stock) => {
        if (stock.inventory_id !== result.inventory_id ||
            stock.inventory_sku_id !== result.inventory_sku_id) return stock;

        // Polling có thể đã lấy được một phần hoặc toàn bộ Serial mới.
        // Giữ trạng thái mới nhất của Serial đã có, chỉ ghép Serial còn thiếu.
        const byId = new Map(stock.serials.map((serial) => [serial.inventory_sku_serial_id, serial]));
        let added = false;
        for (const serial of result.created_serials) {
          if (!byId.has(serial.inventory_sku_serial_id)) {
            byId.set(serial.inventory_sku_serial_id, serial);
            added = true;
          }
        }
        if (!added) return stock;

        const serials = [...byId.values()].sort((a, b) => a.inventory_sku_serial_id - b.inventory_sku_serial_id);
        const serial_statistics = {
          total: serials.length,
          available: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "AVAILABLE").length,
          reserved: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "RESERVED").length,
          cancelled: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "CANCELLED").length,
          sold: serials.filter((serial) => serial.status.inventory_sku_serial_status_code === "SOLD").length,
        };
        return {
          ...stock,
          // Sử dụng số lượng Backend xác nhận, không tự cộng lần thứ hai.
          inventory_stock_quantity: result.inventory_stock_quantity_after,
          serial_statistics,
          serials,
        };
      }));
    }

    // Giữ Modal chi tiết mở, lấy lại snapshot kể cả khi tất cả Serial bị trùng.
    setRefreshKey((previous) => previous + 1);
  }

  // ======================================================
  // UPDATE SERIAL SUCCESS
  // ======================================================

  function handleUpdateSerialSuccess(result: UpdateWarehouse1SerialResult) {
    mutationVersion.current += 1;
    if (canReadRef.current) {
      setAllStocks((previous) => previous.map((stock) => mergeUpdatedSerial(stock, result)));
    }
    // Lấy snapshot mới ngay, không chờ polling; không đóng modal cha.
    setRefreshKey((previous) => previous + 1);
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-full space-y-6">
      {/* ================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Quản trị hệ thống</span>
            <ChevronRight size={14} />
            <span>Quản lý kho hàng</span>
            <ChevronRight size={14} />
            <span className="font-medium text-blue-600">
              Kho 1
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Quản lý Kho 1
            </h1>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Warehouse #1
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi tồn kho và danh sách Serial Number của từng SKU tại Kho 1.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-left text-xs text-slate-500 sm:text-right" aria-live="polite">
            <p className="flex items-center gap-1.5 font-medium text-slate-600 sm:justify-end">
              <span className={`h-2 w-2 rounded-full ${statsError ? "bg-amber-500" : "bg-emerald-500"}`} />
              {statsError ? "Đồng bộ gián đoạn" : isRefreshing ? "Đang đồng bộ..." : "Tự động cập nhật mỗi 5 giây"}
            </p>
            <p className="mt-1">
              Cập nhật lần cuối: {lastUpdated ? lastUpdated.toLocaleTimeString("vi-VN") : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className={BUTTON_CLASS}
          >
            <RefreshCw size={16} />
            Đặt lại bộ lọc
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setShowCreateModal(true)}
            disabled={statsLoading || !lastUpdated}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={19} />
            Thêm mã SKU sản phẩm
          </button>
        </div>
      </div>
      {/* ================================================== */}
      {/* WAREHOUSE INFORMATION */}
      {/* ================================================== */}
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <Warehouse size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Kho hàng số 1
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý sản phẩm và tồn kho tại chi nhánh số 1.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Inventory ID
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              #1
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Branch ID
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              #1
            </p>
          </div>
        </div>
      </div>
      {/* ================================================== */}
      {/* STATISTICS */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng số SKU"
          value={statistics.totalSkus}
          description="Tổng số SKU được quản lý tại Kho 1"
          icon={<Package size={23} />}
          color="blue"
          loading={statsLoading}
          failed={!!error}
        />
        <StatCard
          title="Tổng tồn kho"
          value={statistics.totalStockQuantity}
          description="Tổng số lượng theo dữ liệu tồn kho"
          icon={<Boxes size={23} />}
          color="emerald"
          loading={statsLoading}
          failed={!!error}
        />
        <StatCard
          title="Serial đã đặt"
          value={statistics.reservedSerials}
          description="Serial có trạng thái RESERVED"
          icon={<Clock3 size={23} />}
          color="amber"
          loading={statsLoading}
          failed={!!error}
        />
        <StatCard
          title="SKU hết hàng"
          value={statistics.outOfStockSkus}
          description="SKU có số lượng tồn bằng 0"
          icon={<AlertCircle size={23} />}
          color="rose"
          loading={statsLoading}
          failed={!!error}
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
            <p className="text-sm font-semibold text-amber-800">
              {lastUpdated ? "Không thể đồng bộ dữ liệu Kho 1" : "Không thể tải dữ liệu Kho 1"}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {statsError}
              {lastUpdated && " — Đang hiển thị dữ liệu của lần cập nhật thành công gần nhất."}
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
      {/* SERIAL STATISTICS */}
      {/* ================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScanBarcode
              size={20}
              className="text-blue-600"
            />
            <h2 className="text-base font-bold text-slate-800">
              Thống kê Serial Number
            </h2>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">

            Tổng:{" "}
            {statsLoading || error
              ? "—"
              : formatNumber(statistics.totalSerials)}
            {" "}Serial
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SerialStatCard
            title="Có sẵn"
            code="AVAILABLE"
            value={statistics.availableSerials}
            style="border-emerald-100 bg-emerald-50 text-emerald-700"
            loading={statsLoading}
            failed={!!error}
          />
          <SerialStatCard
            title="Đã đặt"
            code="RESERVED"
            value={statistics.reservedSerials}
            style="border-amber-100 bg-amber-50 text-amber-700"
            loading={statsLoading}
            failed={!!error}
          />
          <SerialStatCard
            title="Đã hủy đặt"
            code="CANCELLED"
            value={statistics.cancelledSerials}
            style="border-rose-100 bg-rose-50 text-rose-700"
            loading={statsLoading}
            failed={!!error}
          />
          <SerialStatCard
            title="Đã bán"
            code="SOLD"
            value={statistics.soldSerials}
            style="border-blue-100 bg-blue-50 text-blue-700"
            loading={statsLoading}
            failed={!!error}
          />
        </div>
      </section>
      {/* ================================================== */}
      {/* INVENTORY LIST */}
      {/* ================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ================================================== */}
        {/* SEARCH AND FILTER */}
        {/* ================================================== */}
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <ClipboardList
                  size={19}
                  className="text-blue-600"
                />

                Danh sách SKU trong Kho 1
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tìm kiếm SKU và xem danh sách Serial Number tương ứng.
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
                  aria-label="Tìm kiếm SKU hoặc Serial Number"
                  onChange={(event) =>
                    handleSearch(event.target.value)
                  }
                  placeholder="Mã SKU, Serial Number..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {keyword && (
                  <button
                    type="button"
                    aria-label="Xóa từ khóa"
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {/* STOCK STATUS FILTER */}
              <select
                value={stockStatusFilter}
                aria-label="Lọc trạng thái tồn kho"
                onChange={(event) =>
                  handleStockStatusChange(
                    event.target.value as StockStatusFilter,
                  )
                }
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
              {/* REFRESH */}
              <button
                type="button"
                title="Làm mới dữ liệu"
                aria-label="Làm mới dữ liệu"
                onClick={retryLoad}
                disabled={isRefreshing}
                className={BUTTON_CLASS}
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
        {showCreatedOnly && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-800">
            <span>Đang hiển thị {formatNumber(createdSkuIds.length)} SKU vừa thêm.</span>
            <button type="button" onClick={resetFilters} className="font-semibold text-blue-700 hover:underline">Xem tất cả SKU</button>
          </div>
        )}
        {/* ================================================== */}
        {/* INVENTORY TABLE */}
        {/* ================================================== */}
        <div
          className="overflow-x-auto"
          aria-busy={loading}
        >
          <table className="w-full min-w-[1200px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">
                  Mã SKU
                </th>
                <th className="px-5 py-4 text-center">
                  Tồn kho
                </th>
                <th className="px-5 py-4 text-center">
                  Tổng Serial
                </th>
                <th className="px-5 py-4 text-center">
                  Có sẵn
                </th>
                <th className="px-5 py-4 text-center">
                  Đã đặt
                </th>
                <th className="px-5 py-4 text-center">
                  Đã hủy đặt
                </th>
                <th className="px-5 py-4 text-center">
                  Đã bán
                </th>
                <th className="px-5 py-4">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* LOADING */}
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <LoaderCircle
                      size={28}
                      className="mx-auto animate-spin text-blue-600"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Đang tải danh sách SKU...
                    </p>
                  </td>
                </tr>

              ) : error ? (

                /* ERROR */
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <AlertCircle
                      size={28}
                      className="mx-auto text-rose-500"
                    />
                    <p className="mt-3 text-sm font-semibold text-rose-600">
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

              ) : paginatedStocks.length === 0 ? (

                /* EMPTY DATA */
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <Package
                      size={30}
                      className="mx-auto text-slate-400"
                    />
                    <p className="mt-3 font-semibold text-slate-700">
                      Không tìm thấy SKU
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

                /* SKU LIST */

                paginatedStocks.map((stock) => {

                  const quantity =
                    stock.inventory_stock_quantity;

                  const serialStatistics =
                    stock.serial_statistics;

                  return (
                    <tr
                      key={stock.inventory_sku_id}
                      className={`transition ${
                        updateToast?.id === stock.inventory_sku_id
                          ? "bg-blue-50/80 hover:bg-blue-50"
                          : createdSkuIds.includes(stock.inventory_sku_id)
                            ? "bg-emerald-50/70 hover:bg-emerald-50"
                            : "hover:bg-slate-50/80"
                      }`}
                    >
                        {/* SKU INFORMATION */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                              <Package size={21} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {stock.inventory_sku_code}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                SKU ID: {stock.inventory_sku_id}
                              </p>
                              {updateToast?.id === stock.inventory_sku_id && (
                                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                                  <CheckCircle2 size={13} /> Vừa cập nhật
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* STOCK QUANTITY */}
                        <td className="px-5 py-4 text-center">
                          <p
                            className={`text-base font-bold ${
                              quantity > 0
                                ? "text-slate-800"
                                : "text-rose-600"
                            }`}
                          >
                            {formatNumber(quantity)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Sản phẩm
                          </p>
                        </td>
                        {/* TOTAL SERIAL */}
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                            {formatNumber(serialStatistics.total)}
                          </span>
                        </td>
                        {/* AVAILABLE */}
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                            {formatNumber(serialStatistics.available)}
                          </span>
                        </td>
                        {/* RESERVED */}
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
                            {formatNumber(serialStatistics.reserved)}
                          </span>
                        </td>
                        {/* CANCELLED */}
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700">
                            {formatNumber(serialStatistics.cancelled)}
                          </span>
                        </td>
                        {/* SOLD */}
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                            {formatNumber(serialStatistics.sold)}
                          </span>
                        </td>
                        {/* STOCK STATUS */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            label={getStockStatusLabel(quantity)}
                            style={getStockStatusStyle(quantity)}
                          />
                        </td>
                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              title="Xem danh sách Serial Number"
                              onClick={() => setSelectedSkuId(stock.inventory_sku_id)}
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              title={`Cập nhật SKU ${stock.inventory_sku_code}`}
                              onClick={() => setEditingSku({ id: stock.inventory_sku_id, code: stock.inventory_sku_code })}
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* ================================================== */}
        {/* PAGINATION */}
        {/* ================================================== */}
        {!loading && !error && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={PAGE_SIZE}
            unit="SKU"
            onChange={handleChangePage}
          />

        )}
      </section>
      {showCreateModal && (
        <CreateSkuModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {editingSku && (
        <UpdateSkuModal
          key={editingSku.id}
          skuId={editingSku.id}
          originalCode={editingSku.code}
          stock={editingStock}
          onClose={() => setEditingSku(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}
      {updateToast && (
        <div role="status" aria-live="polite" className="fixed right-4 top-20 z-50 w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl sm:right-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-700">Cập nhật SKU thành công</p>
              <p className="mt-1 break-words text-sm text-slate-600">{updateToast.message}</p>
            </div>
            <button type="button" aria-label="Đóng thông báo cập nhật" onClick={() => setUpdateToast(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button>
          </div>
        </div>
      )}
      {bulkResult && (
        <div role="status" aria-live="polite" className={`fixed bottom-6 right-4 z-50 w-[calc(100%_-_2rem)] max-w-md rounded-2xl border bg-white p-4 shadow-xl sm:right-6 ${bulkResult.total_skipped ? "border-amber-200" : "border-emerald-200"}`}>
          <div className="flex items-start gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bulkResult.total_created ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              {bulkResult.total_created ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${bulkResult.total_created ? "text-emerald-700" : "text-amber-700"}`}>
                {bulkResult.total_created === 0 ? "Không có SKU mới" : bulkResult.total_skipped ? "Hoàn tất thêm SKU (có mã bị bỏ qua)" : "Thêm SKU thành công"}
              </p>
              <p className="mt-1 text-sm text-slate-600">Đã xử lý {formatNumber(bulkResult.total_requested)} mã SKU.</p>
            </div>
            <button type="button" aria-label="Đóng thông báo" onClick={() => setBulkResult(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><p className="text-xs">Đã thêm</p><p className="text-xl font-bold">{formatNumber(bulkResult.total_created)}</p></div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><p className="text-xs">Bỏ qua</p><p className="text-xl font-bold">{formatNumber(bulkResult.total_skipped)}</p></div>
          </div>
          {bulkResult.skipped_skus.length > 0 && (
            <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-amber-100 bg-amber-50/60 p-3">
              <p className="text-xs font-semibold text-amber-800">Chi tiết mã SKU bị bỏ qua</p>
              {bulkResult.skipped_skus.map((item, index) => (
                <div key={`${item.sku}-${index}`} className="border-t border-amber-100 pt-2 text-xs">
                  <p className="break-all font-semibold text-slate-700">{item.sku}</p>
                  <p className="mt-0.5 text-amber-700">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {selectedStock && (
        <SerialModal
          key={selectedStock.inventory_sku_id}
          stock={selectedStock}
          onClose={() => setSelectedSkuId(null)}
          onRefresh={retryLoad}
          onCreateSerialsSuccess={handleCreateSerialsSuccess}
          onUpdateSerialSuccess={handleUpdateSerialSuccess}
          isRefreshing={isRefreshing}
          error={statsError}
        />
      )}
    </div>
  );
}

// ======================================================
// CREATE SKU MODAL COMPONENT
// ======================================================

function CreateSkuModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (result: CreateWarehouse1SkusResult) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submitLock = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const [skuText, setSkuText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Dán từ Excel (tab / xuống dòng) hoặc phân cách bằng dấu phẩy, chấm phẩy.
  const skus = useMemo(() => skuText.split(/[\s,;]+/).map((sku) => sku.trim()).filter(Boolean), [skuText]);
  const duplicateCount = skus.length - new Set(skus).size;
  const invalidLength = skus.some((sku) => sku.length > MAX_SKU_LENGTH);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      requestRef.current?.abort();
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeModal() {
    if (!submitLock.current) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    if (!skus.length || skus.length > MAX_BATCH_SIZE || invalidLength) {
      setError(!skus.length ? "Vui lòng nhập ít nhất một SKU." : invalidLength ? `Mỗi mã SKU tối đa ${MAX_SKU_LENGTH} ký tự.` : `Tối đa ${MAX_BATCH_SIZE} SKU mỗi lần.`);
      inputRef.current?.focus();
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      // Không loại mã lặp ở FE: BE sẽ báo cáo chính xác từng mã bị bỏ qua.
      const response = await adminInventoryService.createWarehouse1Skus({ skus }, controller.signal);
      if (controller.signal.aborted) return;
      if (!response.success || !response.data || !Array.isArray(response.data.created_stocks) || !Array.isArray(response.data.skipped_skus)) {
        setError(response.message || "Kết quả thêm SKU không hợp lệ. Hãy kiểm tra danh sách kho trước khi thử lại.");
        return;
      }
      onSuccess(response.data);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      let fallback = "Không thể thêm SKU vào Kho 1. Vui lòng thử lại.";
      if (status === 403) fallback = "Bạn không có quyền thêm SKU vào Kho 1.";
      else if (status === 401) fallback = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      else if (status === 404) fallback = "Không tìm thấy Kho 1 hoặc API thêm nhiều SKU.";
      else if (axios.isAxiosError(err) && !err.response) fallback = "Không nhận được phản hồi. Hãy kiểm tra danh sách kho trước khi gửi lại.";
      setError(extractErrorMessage(err, fallback));
    } finally {
      submitLock.current = false;
      requestRef.current = null;
      if (!controller.signal.aborted) setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="warehouse-create-sku-title"
      onCancel={(event) => { event.preventDefault(); closeModal(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-auto rounded-2xl border-0 bg-transparent p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="overflow-hidden rounded-2xl bg-white">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><PackagePlus size={25} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="warehouse-create-sku-title" className="text-lg font-bold text-slate-800">Thêm SKU hàng loạt</h2>
            <p className="mt-1 text-sm text-slate-500">Đăng ký nhiều mã SKU vào Kho 1 chỉ với một thao tác.</p>
          </div>
          <button type="button" disabled={submitting} onClick={closeModal} aria-label="Đóng modal" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={20} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Warehouse size={21} className="shrink-0 text-blue-600" />
            <div><p className="text-sm font-semibold text-slate-700">Kho hàng số 1</p><p className="mt-0.5 text-xs text-slate-500">Inventory ID: 1 · Branch ID: 1</p></div>
          </div>
          <div>
            <label htmlFor="warehouse-bulk-skus" className="mb-2 block text-sm font-semibold text-slate-700">Danh sách mã SKU <span className="text-rose-500">*</span></label>
            <textarea ref={inputRef} id="warehouse-bulk-skus" value={skuText} onChange={(event) => { setSkuText(event.target.value); setError(""); }} disabled={submitting} rows={7} spellCheck={false} aria-invalid={!!error || skus.length > MAX_BATCH_SIZE || invalidLength} aria-describedby="warehouse-bulk-help" placeholder={"IP17PM-256GB-CAM-VU-TRU\nIP17PM-512GB-CAM-VU-TRU\nMBA-M4-256GB"} className={`w-full resize-y rounded-xl border bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 disabled:bg-slate-50 ${error || skus.length > MAX_BATCH_SIZE || invalidLength ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`} />
            <p id="warehouse-bulk-help" className="mt-2 text-xs leading-relaxed text-slate-500">Mỗi dòng một SKU hoặc dán trực tiếp từ một cột Excel. Hỗ trợ dấu phẩy, chấm phẩy và khoảng trắng. Tối đa 500 SKU/lần.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-700"><p className="text-xs font-medium">Đã nhập</p><p className="mt-1 text-xl font-bold">{formatNumber(skus.length)} / {MAX_BATCH_SIZE}</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-700"><p className="text-xs font-medium">Mã lặp trong danh sách</p><p className="mt-1 text-xl font-bold">{formatNumber(duplicateCount)}</p></div>
          </div>
          {(error || skus.length > MAX_BATCH_SIZE || invalidLength) && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
              <div className="min-w-0"><p className="text-sm font-semibold text-rose-800">Không thể thêm SKU</p><p className="mt-1 break-words text-sm text-rose-700">{error || (invalidLength ? `Mỗi mã SKU tối đa ${MAX_SKU_LENGTH} ký tự.` : `Vui lòng giảm xuống tối đa ${MAX_BATCH_SIZE} SKU.`)}</p></div>
            </div>
          )}
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-700"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p className="text-xs leading-relaxed">SKU đã tồn tại trong Kho 1 và các mã lặp sẽ được bỏ qua. SKU mới có tồn kho ban đầu bằng 0; chưa tạo Serial Number hoặc giao dịch nhập kho.</p></div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button type="button" disabled={submitting} onClick={closeModal} className={BUTTON_CLASS}>Hủy bỏ</button>
          <button type="submit" disabled={submitting || !skus.length || skus.length > MAX_BATCH_SIZE || invalidLength} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={18} />}
            {submitting ? "Đang thêm SKU..." : `Thêm ${formatNumber(skus.length)} SKU`}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ======================================================
// UPDATE SKU MODAL COMPONENT
// ======================================================

function UpdateSkuModal({
  skuId,
  originalCode,
  stock,
  onClose,
  onSuccess,
}: {
  skuId: number;
  originalCode: string;
  stock: Warehouse1Stock | undefined;
  onClose: () => void;
  onSuccess: (result: UpdateWarehouse1SkuResult, message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const mountedRef = useRef(false);
  const [sku, setSku] = useState(originalCode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const newSku = sku.trim();
  const blockedReason = !stock
    ? "SKU không còn xuất hiện trong Kho 1. Vui lòng kiểm tra lại danh sách."
    : stock.inventory_sku_code !== originalCode
      ? "Mã SKU đã thay đổi. Vui lòng đóng và mở lại cửa sổ chỉnh sửa."
      : stock.inventory_stock_quantity !== 0
        ? "Không thể chỉnh sửa SKU vì số lượng tồn kho khác 0."
        : stock.serial_statistics.total > 0
          ? "Không thể chỉnh sửa SKU vì đã có Serial Number."
          : "";
  const invalidLength = newSku.length > MAX_SKU_LENGTH;
  const unchanged = newSku === originalCode;

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    if (!dialog) return () => { mountedRef.current = false; };
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    inputRef.current?.select();
    return () => {
      mountedRef.current = false;
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeModal() {
    if (!submitLock.current) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;

    if (blockedReason || !newSku || invalidLength || unchanged) {
      setError(blockedReason || (!newSku
        ? "Vui lòng nhập mã SKU mới."
        : invalidLength
          ? `Mã SKU tối đa ${MAX_SKU_LENGTH} ký tự.`
          : "Mã SKU mới phải khác mã SKU hiện tại."));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setError("");

    try {
      // PATCH không cần AbortSignal; việc hủy request không rollback DB.
      const response = await adminInventoryService.updateWarehouse1Sku(skuId, { sku: newSku });
      if (!mountedRef.current) return;
      const result = response.data;
      if (!response.success || !result || result.old_inventory_sku_id !== skuId ||
          !Number.isSafeInteger(result.inventory_sku_id) || result.inventory_sku_id <= 0 ||
          result.inventory_sku_code !== newSku || result.inventory_id !== 1 ||
          result.inventory_branch_id !== 1 || !result.serial_statistics || !Array.isArray(result.serials)) {
        setError(response.message && !response.success ? response.message : "Phản hồi cập nhật không hợp lệ. Hãy kiểm tra danh sách kho trước khi thử lại.");
        return;
      }
      onSuccess(result, response.message);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      let fallback = "Không thể cập nhật SKU. Vui lòng thử lại.";
      if (status === 400) fallback = "Mã SKU mới không hợp lệ.";
      else if (status === 401) fallback = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      else if (status === 403) fallback = "Bạn không có quyền cập nhật SKU trong Kho 1.";
      else if (status === 404) fallback = "Không tìm thấy SKU trong Kho 1.";
      else if (status === 409) fallback = "SKU đã tồn tại hoặc không đủ điều kiện chỉnh sửa. Vui lòng kiểm tra lại.";
      else if (axios.isAxiosError(err) && !err.response) fallback = "Không nhận được phản hồi. Hãy kiểm tra danh sách kho trước khi gửi lại.";
      setError(extractErrorMessage(err, fallback));
    } finally {
      submitLock.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="warehouse-update-sku-title"
      onCancel={(event) => { event.preventDefault(); closeModal(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-auto rounded-2xl border-0 bg-transparent p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="overflow-hidden rounded-2xl bg-white">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Pencil size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="warehouse-update-sku-title" className="text-lg font-bold text-slate-800">Cập nhật SKU</h2>
            <p className="mt-1 text-sm text-slate-500">Chỉnh sửa mã SKU đã đăng ký tại Kho 1.</p>
          </div>
          <button type="button" disabled={submitting} onClick={closeModal} aria-label="Đóng modal cập nhật" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={20} /></button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Package size={21} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">Mã SKU hiện tại · Kho 1</p>
                <p className="mt-1 break-all text-sm font-bold text-slate-800">{originalCode}</p>
                <p className="mt-1 text-xs text-slate-400">SKU ID: {skuId}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
              <div><p className="text-xs text-slate-500">Số lượng tồn kho</p><p className="mt-1 text-lg font-bold text-slate-800">{stock ? formatNumber(stock.inventory_stock_quantity) : "—"}</p></div>
              <div><p className="text-xs text-slate-500">Tổng Serial Number</p><p className="mt-1 text-lg font-bold text-slate-800">{stock ? formatNumber(stock.serial_statistics.total) : "—"}</p></div>
            </div>
          </div>

          <div>
            <label htmlFor="warehouse-update-sku" className="mb-2 block text-sm font-semibold text-slate-700">Mã SKU mới <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                id="warehouse-update-sku"
                value={sku}
                onChange={(event) => { setSku(event.target.value); setError(""); }}
                disabled={submitting || !!blockedReason}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!!error || invalidLength}
                aria-describedby="warehouse-update-help"
                placeholder="Nhập mã SKU mới..."
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition disabled:bg-slate-100 disabled:text-slate-500 ${error || invalidLength ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
              />
            </div>
            <p id="warehouse-update-help" className="mt-2 text-xs text-slate-500">Nhập mã SKU chính xác, tối đa {MAX_SKU_LENGTH} ký tự.</p>
          </div>

          {(error || blockedReason || invalidLength) && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
              <div className="min-w-0"><p className="text-sm font-bold text-rose-800">Không thể cập nhật SKU</p><p className="mt-1 break-words text-sm text-rose-700">{error || blockedReason || `Mã SKU tối đa ${MAX_SKU_LENGTH} ký tự.`}</p></div>
            </div>
          )}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">Chỉ được chỉnh sửa SKU có tồn kho bằng 0, chưa có Serial Number và chưa có giao dịch tại Kho 1. Backend sẽ kiểm tra quyền, lịch sử giao dịch và trùng mã trước khi lưu. Thao tác không đổi mã SKU ở các kho khác.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button type="button" disabled={submitting} onClick={closeModal} className={BUTTON_CLASS}>Hủy bỏ</button>
          <button type="submit" disabled={submitting || !!blockedReason || !newSku || unchanged || invalidLength} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={18} />}
            {submitting ? "Đang cập nhật..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ======================================================
// CREATE SERIAL MODAL COMPONENT
// ======================================================

function CreateSerialModal({
  stock,
  onClose,
  onSuccess,
}: {
  stock: Warehouse1Stock;
  onClose: () => void;
  onSuccess: (result: CreateWarehouse1SerialsResult) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submitLock = useRef(false);
  const mountedRef = useRef(false);
  const [serialText, setSerialText] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Giữ khoảng trắng bên trong mã Serial; phân cách theo dòng, tab, phẩy hoặc chấm phẩy.
  const serialNumbers = useMemo(() => serialText.split(/[\r\n\t,;]+/).map((serial) => serial.trim()).filter(Boolean), [serialText]);
  const uniqueCount = new Set(serialNumbers).size;
  const duplicateCount = serialNumbers.length - uniqueCount;
  const knownSerials = new Set(stock.serials.map((serial) => serial.inventory_sku_serial_number));
  const knownDuplicates = [...new Set(serialNumbers)].filter((serial) => knownSerials.has(serial)).length;
  const estimatedNew = uniqueCount - knownDuplicates;
  const invalidLength = serialNumbers.some((serial) => serial.length > MAX_SERIAL_LENGTH);
  const validationError = serialNumbers.length > MAX_BATCH_SIZE
    ? `Chỉ được thêm tối đa ${MAX_BATCH_SIZE} Serial Number mỗi lần.`
    : invalidLength
      ? `Mỗi Serial Number tối đa ${MAX_SERIAL_LENGTH} ký tự.`
      : source.trim().length > MAX_SOURCE_LENGTH
        ? `Nguồn nhập hàng tối đa ${MAX_SOURCE_LENGTH} ký tự.`
        : "";

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
    // Modal cha đã khóa cuộn body; modal con không ghi đè overflow.
    return () => {
      mountedRef.current = false;
      if (dialog?.open) dialog.close();
    };
  }, []);

  function closeModal() {
    if (!submitLock.current) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    if (!serialNumbers.length || validationError) {
      setError(validationError || "Vui lòng nhập ít nhất một Serial Number.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError("");

    try {
      // Gửi cả mã lặp để Backend trả về đầy đủ lý do bỏ qua.
      // Không tự hủy POST: hủy chờ ở FE không rollback giao dịch đã chạy ở BE.
      const response = await adminInventoryService.createWarehouse1Serials(
        stock.inventory_sku_id,
        { serialNumbers, source: source.trim() || undefined },
      );
      if (!mountedRef.current) return;
      const result = response.data;
      if (!response.success || !result ||
          result.inventory_id !== stock.inventory_id ||
          result.inventory_sku_id !== stock.inventory_sku_id ||
          !Array.isArray(result.created_serials) || !Array.isArray(result.skipped_serials) ||
          !Number.isFinite(result.inventory_stock_quantity_after) ||
          result.total_created !== result.created_serials.length ||
          result.total_skipped !== result.skipped_serials.length) {
        setError(response.message && !response.success ? response.message : "Kết quả trả về không hợp lệ. Hãy kiểm tra lại danh sách Serial trước khi gửi lại.");
        return;
      }
      onSuccess(result);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      let fallback = "Không thể thêm Serial Number. Vui lòng thử lại.";
      if (status === 401) fallback = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      else if (status === 403) fallback = "Bạn không có quyền thêm Serial Number vào Kho 1.";
      else if (status === 404) fallback = "SKU không còn thuộc Kho 1 hoặc API không tồn tại.";
      else if (status === 409) fallback = "Dữ liệu kho đang thay đổi. Vui lòng kiểm tra và thử lại.";
      else if (axios.isAxiosError(err) && !err.response) fallback = "Không nhận được phản hồi. Hãy kiểm tra danh sách Serial trước khi gửi lại.";
      setError(extractErrorMessage(err, fallback));
    } finally {
      submitLock.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="warehouse-create-serial-title"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); closeModal(); }}
      onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) closeModal(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-auto rounded-2xl border-0 bg-transparent p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="overflow-hidden rounded-2xl bg-white">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><ScanBarcode size={26} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="warehouse-create-serial-title" className="text-lg font-bold text-slate-800">Thêm Serial Number</h2>
            <p className="mt-1 text-sm text-slate-500">Nhập hàng cho SKU đang xem tại Kho 1.</p>
          </div>
          <button type="button" disabled={submitting} onClick={closeModal} aria-label="Đóng modal thêm Serial" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={20} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Package size={22} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">SKU hiện tại · Kho 1</p>
              <p className="mt-1 break-all text-sm font-bold text-slate-800">{stock.inventory_sku_code}</p>
              <p className="mt-1 text-xs text-slate-500">SKU ID: {stock.inventory_sku_id} · Tồn kho: {formatNumber(stock.inventory_stock_quantity)}</p>
            </div>
          </div>
          <div>
            <label htmlFor="warehouse-serial-source" className="mb-2 block text-sm font-semibold text-slate-700">Nguồn nhập hàng <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
            <input id="warehouse-serial-source" value={source} onChange={(event) => { setSource(event.target.value); setError(""); }} disabled={submitting} maxLength={MAX_SOURCE_LENGTH} placeholder="Ví dụ: Nhà cung cấp ABC" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
          </div>
          <div>
            <label htmlFor="warehouse-serial-numbers" className="mb-2 block text-sm font-semibold text-slate-700">Danh sách Serial Number <span className="text-rose-500">*</span></label>
            <textarea ref={inputRef} id="warehouse-serial-numbers" value={serialText} onChange={(event) => { setSerialText(event.target.value); setError(""); }} disabled={submitting} rows={6} spellCheck={false} aria-invalid={!!error || !!validationError} aria-describedby="warehouse-serial-help" placeholder={"SN-IP17PM-00001\nSN-IP17PM-00002\nSN-IP17PM-00003"} className={`w-full resize-y rounded-xl border bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 disabled:bg-slate-50 ${error || validationError ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`} />
            <p id="warehouse-serial-help" className="mt-2 text-xs leading-relaxed text-slate-500">Mỗi dòng một Serial hoặc dán từ Excel. Hỗ trợ tab, dấu phẩy, chấm phẩy. Tối đa {MAX_BATCH_SIZE} Serial/lần.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-700"><p className="text-xs font-medium">Đã nhập</p><p className="mt-1 text-xl font-bold">{formatNumber(serialNumbers.length)}</p></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-700"><p className="text-xs font-medium">Mã lặp / đã biết</p><p className="mt-1 text-xl font-bold">{formatNumber(duplicateCount + knownDuplicates)}</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700"><p className="text-xs font-medium">Có thể thêm</p><p className="mt-1 text-xl font-bold">{formatNumber(estimatedNew)}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700"><p className="text-xs font-medium">Tồn kho dự kiến</p><p className="mt-1 text-xl font-bold">{formatNumber(stock.inventory_stock_quantity + estimatedNew)}</p></div>
          </div>
          {(error || validationError) && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
              <div className="min-w-0"><p className="text-sm font-bold text-rose-800">Không thể thêm Serial Number</p><p className="mt-1 break-words text-sm text-rose-700">{error || validationError}</p></div>
            </div>
          )}
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">Serial mới có trạng thái AVAILABLE. Backend kiểm tra trùng trên toàn hệ thống, tăng tồn kho theo số Serial thực sự được thêm và ghi giao dịch IMPORT. Số lượng dự kiến chỉ dựa trên dữ liệu SKU đang xem.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button type="button" disabled={submitting} onClick={closeModal} className={BUTTON_CLASS}>Hủy bỏ</button>
          <button type="submit" disabled={submitting || !serialNumbers.length || !!validationError} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={18} />}
            {submitting ? "Đang thêm Serial..." : `Thêm ${formatNumber(serialNumbers.length)} Serial`}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ======================================================
// SERIAL IMPORT RESULT COMPONENT
// ======================================================

function SerialImportResult({ result, onClose }: {
  result: CreateWarehouse1SerialsResult;
  onClose: () => void;
}) {
  const hasNew = result.total_created > 0;
  return (
    <div role="status" aria-live="polite" className={`m-4 space-y-3 rounded-xl border p-4 ${hasNew ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${hasNew ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {hasNew ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${hasNew ? "text-emerald-800" : "text-amber-800"}`}>{hasNew ? "Thêm Serial Number thành công" : "Không có Serial Number mới"}</p>
          <p className="mt-1 text-xs text-slate-600">Đã xử lý {formatNumber(result.total_requested)} Serial. {result.inventory_transaction_id !== null ? `Giao dịch nhập kho #${result.inventory_transaction_id}.` : "Không phát sinh giao dịch nhập kho."}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng kết quả thêm Serial" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"><X size={17} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Đã thêm</p><p className="mt-1 text-lg font-bold text-emerald-700">{formatNumber(result.total_created)}</p></div>
        <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Bỏ qua</p><p className="mt-1 text-lg font-bold text-amber-700">{formatNumber(result.total_skipped)}</p></div>
        <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Tồn trước nhập</p><p className="mt-1 text-lg font-bold text-slate-700">{formatNumber(result.inventory_stock_quantity_before)}</p></div>
        <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Tồn sau nhập</p><p className="mt-1 text-lg font-bold text-blue-700">{formatNumber(result.inventory_stock_quantity_after)}</p></div>
      </div>
      {result.skipped_serials.length > 0 && (
        <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-800">Serial Number bị bỏ qua</p>
          {result.skipped_serials.map((serial, index) => (
            <div key={`${serial.serial_number}-${index}`} className="border-t border-amber-100 pt-2 text-xs">
              <p className="break-all font-semibold text-slate-700">{serial.serial_number}</p>
              <p className="mt-0.5 break-words text-amber-700">{serial.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================================================
// UPDATE SERIAL MODAL COMPONENT
// ======================================================

function UpdateSerialModal({
  stock,
  original,
  onClose,
  onSuccess,
}: {
  stock: Warehouse1Stock;
  original: Warehouse1Serial;
  onClose: () => void;
  onSuccess: (result: UpdateWarehouse1SerialResult, message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const mountedRef = useRef(false);
  const originalStatus = original.status.inventory_sku_serial_status_code;
  const [serialNumber, setSerialNumber] = useState(original.inventory_sku_serial_number);
  const [status, setStatus] = useState<EditableSerialStatus>(originalStatus === "CANCELLED" ? "CANCELLED" : "AVAILABLE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const serialId = original.inventory_sku_serial_id;
  const current = stock.serials.find((serial) => serial.inventory_sku_serial_id === serialId);
  const newSerialNumber = serialNumber.trim();
  const nameChanged = newSerialNumber !== original.inventory_sku_serial_number;
  const statusChanged = status !== originalStatus;
  const quantityChange = Number(status === "AVAILABLE") - Number(originalStatus === "AVAILABLE");
  const quantityBefore = stock.inventory_stock_quantity;
  const quantityAfter = quantityBefore + quantityChange;
  const blockedReason = !current
    ? "Serial không còn thuộc SKU này tại Kho 1. Vui lòng đóng cửa sổ và kiểm tra lại."
    : !isEditableSerialStatus(originalStatus) || !isEditableSerialStatus(current.status.inventory_sku_serial_status_code)
      ? "Không thể chỉnh sửa Serial đang được đặt hoặc đã bán."
      : current.inventory_sku_serial_number !== original.inventory_sku_serial_number || current.status.inventory_sku_serial_status_code !== originalStatus
        ? "Serial đã thay đổi trong lúc chỉnh sửa. Vui lòng đóng và mở lại cửa sổ."
        : "";
  const duplicateInSku = nameChanged && stock.serials.some((serial) =>
    serial.inventory_sku_serial_id !== serialId && serial.inventory_sku_serial_number === newSerialNumber,
  );
  const validationError = !newSerialNumber
    ? "Vui lòng nhập Serial Number."
    : newSerialNumber.length > MAX_SERIAL_LENGTH
      ? `Serial Number tối đa ${MAX_SERIAL_LENGTH} ký tự.`
      : duplicateInSku
        ? "Serial Number đã tồn tại trong SKU này."
        : statusChanged && quantityBefore !== stock.serial_statistics.available
          ? "Tồn kho không khớp số Serial AVAILABLE. Vui lòng kiểm tra lại dữ liệu kho."
          : statusChanged && quantityAfter < 0
            ? "Không thể cập nhật vì tồn kho sẽ bị âm."
            : "";

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
    inputRef.current?.select();
    // Modal cha đang khóa body scroll; modal con không thay đổi overflow.
    return () => {
      mountedRef.current = false;
      if (dialog?.open) dialog.close();
    };
  }, []);

  function closeModal() {
    if (!submitLock.current) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    if (blockedReason || validationError || (!nameChanged && !statusChanged)) {
      setError(blockedReason || validationError || "Chưa có dữ liệu nào thay đổi.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      // Chỉ gửi trường thực sự thay đổi. Backend kiểm tra quyền và trùng toàn hệ thống.
      const response = await adminInventoryService.updateWarehouse1Serial(serialId, {
        serialNumber: nameChanged ? newSerialNumber : undefined,
        status: statusChanged ? status : undefined,
      });
      if (!mountedRef.current) return;
      const result = response.data;
      if (!response.success || !result || !result.serial || !result.serial.status ||
          result.inventory_id !== stock.inventory_id || result.inventory_branch_id !== stock.inventory_branch_id ||
          result.inventory_sku_id !== stock.inventory_sku_id || result.serial.inventory_sku_serial_id !== serialId ||
          result.serial.inventory_id !== stock.inventory_id || result.serial.inventory_sku_id !== stock.inventory_sku_id ||
          !Number.isFinite(result.inventory_stock_quantity_before) || !Number.isFinite(result.inventory_stock_quantity_after) ||
          result.serial.inventory_sku_serial_number !== result.new_serial_number ||
          result.serial.status.inventory_sku_serial_status_code !== result.new_status) {
        setError(!response.success && response.message ? response.message : "Phản hồi không hợp lệ. Hãy kiểm tra danh sách Serial trước khi gửi lại.");
        return;
      }
      onSuccess(result, response.message || `Đã cập nhật Serial Number "${result.new_serial_number}".`);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
      let fallback = "Không thể cập nhật Serial Number. Vui lòng thử lại.";
      if (httpStatus === 401) fallback = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      else if (httpStatus === 403) fallback = "Bạn không có quyền cập nhật Serial Number tại Kho 1.";
      else if (httpStatus === 404) fallback = "Không tìm thấy Serial Number tại Kho 1 hoặc API không tồn tại.";
      else if (httpStatus === 409) fallback = "Serial bị trùng hoặc dữ liệu kho đã thay đổi. Vui lòng kiểm tra lại.";
      else if (axios.isAxiosError(err) && !err.response) fallback = "Không nhận được phản hồi. Hãy kiểm tra danh sách Serial trước khi gửi lại.";
      setError(extractErrorMessage(err, fallback));
    } finally {
      submitLock.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="warehouse-update-serial-title"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); closeModal(); }}
      onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) closeModal(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-auto rounded-2xl border-0 bg-transparent p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="overflow-hidden rounded-2xl bg-white">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Pencil size={24} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="warehouse-update-serial-title" className="text-lg font-bold text-slate-800">Cập nhật Serial Number</h2>
            <p className="mt-1 text-sm text-slate-500">Chỉnh sửa mã và trạng thái Serial tại Kho 1.</p>
          </div>
          <button type="button" disabled={submitting} onClick={closeModal} aria-label="Đóng modal cập nhật Serial" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={20} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><ScanBarcode size={21} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">SKU · Kho 1</p>
                <p className="mt-1 break-all text-sm font-bold text-slate-800">{stock.inventory_sku_code}</p>
                <p className="mt-1 text-xs text-slate-500">SKU ID: {stock.inventory_sku_id} · Serial ID: {serialId}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              <p className="break-all text-xs text-slate-500">Mã hiện tại: <span className="font-semibold text-slate-800">{original.inventory_sku_serial_number}</span></p>
              <StatusBadge label={getSerialStatusLabel(originalStatus, original.status.inventory_sku_serial_status_name)} style={getSerialStatusStyle(originalStatus)} />
            </div>
          </div>
          <div>
            <label htmlFor="warehouse-update-serial-number" className="mb-2 block text-sm font-semibold text-slate-700">Serial Number <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input ref={inputRef} id="warehouse-update-serial-number" value={serialNumber} onChange={(event) => { setSerialNumber(event.target.value); setError(""); }} disabled={submitting || !!blockedReason} autoComplete="off" spellCheck={false} aria-invalid={!!validationError} aria-describedby="warehouse-update-serial-help" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100" placeholder="Nhập Serial Number..." />
            </div>
            <p id="warehouse-update-serial-help" className="mt-2 text-xs text-slate-500">Tối đa {MAX_SERIAL_LENGTH} ký tự. Mã Serial phải duy nhất trên toàn hệ thống.</p>
          </div>
          <div>
            <label htmlFor="warehouse-update-serial-status" className="mb-2 block text-sm font-semibold text-slate-700">Trạng thái <span className="text-rose-500">*</span></label>
            <select id="warehouse-update-serial-status" value={status} disabled={submitting || !!blockedReason} onChange={(event) => { if (isEditableSerialStatus(event.target.value)) { setStatus(event.target.value); setError(""); } }} className={`${SELECT_CLASS} w-full disabled:bg-slate-100`}>
              <option value="AVAILABLE">Có sẵn (AVAILABLE)</option>
              <option value="CANCELLED">Đã hủy đặt (CANCELLED)</option>
            </select>
          </div>
          {!blockedReason && (
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div><p className="text-xs text-slate-500">Tồn hiện tại</p><p className="mt-1 text-lg font-bold text-slate-800">{formatNumber(quantityBefore)}</p></div>
              <div><p className="text-xs text-slate-500">Thay đổi</p><p className={`mt-1 text-lg font-bold ${quantityChange < 0 ? "text-rose-600" : quantityChange > 0 ? "text-emerald-600" : "text-slate-600"}`}>{quantityChange > 0 ? "+" : ""}{quantityChange}</p></div>
              <div><p className="text-xs text-slate-500">Tồn dự kiến</p><p className="mt-1 text-lg font-bold text-blue-700">{formatNumber(quantityAfter)}</p></div>
            </div>
          )}
          {(blockedReason || error || validationError) && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-rose-600" />
              <div className="min-w-0"><p className="text-sm font-semibold text-rose-800">Không thể cập nhật Serial Number</p><p className="mt-1 break-words text-sm text-rose-700">{blockedReason || error || validationError}</p></div>
            </div>
          )}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">Chỉ cho phép chỉnh sửa AVAILABLE và CANCELLED. Đổi sang CANCELLED giảm tồn kho 1; đổi sang AVAILABLE tăng tồn kho 1. Chỉ sửa mã không làm đổi tồn kho. Số lượng cuối cùng do Backend xác nhận.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button type="button" disabled={submitting} onClick={closeModal} className={BUTTON_CLASS}>Hủy bỏ</button>
          <button type="submit" disabled={submitting || !!blockedReason || !!validationError || (!nameChanged && !statusChanged)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={18} />}
            {submitting ? "Đang cập nhật..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ======================================================
// SERIAL MODAL COMPONENT
// ======================================================

function SerialModal({
  stock,
  onClose,
  onRefresh,
  onCreateSerialsSuccess,
  onUpdateSerialSuccess,
  isRefreshing,
  error,
}: {
  stock: Warehouse1Stock;
  onClose: () => void;
  onRefresh: () => void;
  onCreateSerialsSuccess: (result: CreateWarehouse1SerialsResult) => void;
  onUpdateSerialSuccess: (result: UpdateWarehouse1SerialResult) => void;
  isRefreshing: boolean;
  error: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="warehouse-serial-modal-title"
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-5xl overflow-auto rounded-2xl border-0 bg-transparent p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <SerialList
        stock={stock}
        onClose={onClose}
        onRefresh={onRefresh}
        onCreateSerialsSuccess={onCreateSerialsSuccess}
        onUpdateSerialSuccess={onUpdateSerialSuccess}
        isRefreshing={isRefreshing}
        error={error}
      />
    </dialog>
  );
}

// ======================================================
// SERIAL LIST COMPONENT
// ======================================================

function SerialList({
  stock,
  onClose,
  onRefresh,
  onCreateSerialsSuccess,
  onUpdateSerialSuccess,
  isRefreshing,
  error,
}: {
  stock: Warehouse1Stock;
  onClose: () => void;
  onRefresh: () => void;
  onCreateSerialsSuccess: (result: CreateWarehouse1SerialsResult) => void;
  onUpdateSerialSuccess: (result: UpdateWarehouse1SerialResult) => void;
  isRefreshing: boolean;
  error: string;
}) {

  // ======================================================
  // SEARCH AND FILTER
  // ======================================================

  const [keyword, setKeyword] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<SerialStatusFilter>("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [showAddSerialModal, setShowAddSerialModal] = useState(false);
  const [serialResult, setSerialResult] = useState<CreateWarehouse1SerialsResult | null>(null);
  const [newSerialIds, setNewSerialIds] = useState<number[]>([]);
  // Giữ bản gốc khi mở modal để phát hiện thay đổi từ polling.
  const [editingSerial, setEditingSerial] = useState<Warehouse1Serial | null>(null);
  const [serialUpdate, setSerialUpdate] = useState<{ result: UpdateWarehouse1SerialResult; message: string } | null>(null);

  function handleSerialUpdateSuccess(result: UpdateWarehouse1SerialResult, message: string) {
    onUpdateSerialSuccess(result);
    setEditingSerial(null);
    setSerialResult(null);
    setSerialUpdate({ result, message });
    // Đưa Serial vừa sửa lên đầu, kể cả khi mã/trạng thái không còn khớp bộ lọc cũ.
    setNewSerialIds([result.serial.inventory_sku_serial_id]);
    setKeyword("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  }

  function handleSerialSuccess(result: CreateWarehouse1SerialsResult) {
    onCreateSerialsSuccess(result);
    setShowAddSerialModal(false);
    setSerialResult(result);
    setSerialUpdate(null);
    if (result.total_created > 0) {
      setNewSerialIds(result.created_serials.map((serial) => serial.inventory_sku_serial_id));
      setKeyword("");
      setStatusFilter("ALL");
      setCurrentPage(1);
    }
  }

  // ======================================================
  // FILTER SERIALS
  // ======================================================

  const filteredSerials = useMemo(() => {

    const search = keyword.trim().toLowerCase();

    const matches = (stock.serials ?? []).filter((serial) => {

      const matchesKeyword =
        !search ||
        serial.inventory_sku_serial_number
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        serial.status.inventory_sku_serial_status_code ===
          statusFilter;

      return matchesKeyword && matchesStatus;
    });

    // Đưa Serial vừa thêm lên đầu danh sách, không thay đổi mảng gốc.
    const recent = new Set(newSerialIds);
    return matches.sort((a, b) =>
      Number(recent.has(b.inventory_sku_serial_id)) - Number(recent.has(a.inventory_sku_serial_id)) ||
      a.inventory_sku_serial_id - b.inventory_sku_serial_id,
    );
  }, [stock.serials, keyword, statusFilter, newSerialIds]);

  // ======================================================
  // SERIAL PAGINATION
  // ======================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSerials.length / SERIAL_PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedSerials = filteredSerials.slice(
    (safePage - 1) * SERIAL_PAGE_SIZE,
    safePage * SERIAL_PAGE_SIZE,
  );

  // ======================================================
  // RENDER SERIAL LIST
  // ======================================================

  return (
    <>
    <div
      id={`serial-list-${stock.inventory_sku_id}`}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* ================================================== */}
      {/* SERIAL HEADER */}
      {/* ================================================== */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <ScanBarcode size={22} />
          </div>
          <div>
            <h3 id="warehouse-serial-modal-title" className="text-base font-bold text-slate-800">
              Danh sách Serial Number
            </h3>
            <p className="mt-1 text-xs text-slate-500">

              SKU:{" "}
              <span className="font-semibold text-blue-600">
                {stock.inventory_sku_code}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
            {formatNumber(stock.serial_statistics.total)}
            {" "}Serial Number
          </span>
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Tồn kho: {formatNumber(stock.inventory_stock_quantity)}
          </span>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setShowAddSerialModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} /> Thêm Serial Number
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Làm mới dữ liệu Serial"
            aria-label="Làm mới dữ liệu Serial"
            className="grid h-9 w-9 place-items-center rounded-lg text-blue-600 transition hover:bg-blue-50 disabled:opacity-40"
          >
            <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            title="Đóng modal"
            aria-label="Đóng danh sách Serial"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>
      </div>
      {/* ================================================== */}
      {/* SERIAL SEARCH AND FILTER */}
      {/* ================================================== */}
      {error && (
        <p role="status" className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Không thể đồng bộ: {error}. Đang hiển thị dữ liệu gần nhất.
        </p>
      )}
      {serialResult && (
        <SerialImportResult result={serialResult} onClose={() => setSerialResult(null)} />
      )}
      {serialUpdate && (
        <div role="status" className="mx-4 mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-800">Cập nhật Serial Number thành công</p>
              <p className="mt-1 break-words text-sm text-emerald-700">{serialUpdate.message}</p>
              <p className="mt-1 break-all text-xs text-emerald-800">{serialUpdate.result.old_serial_number} → {serialUpdate.result.new_serial_number}</p>
              <p className="mt-1 text-xs text-emerald-800">{getSerialStatusLabel(serialUpdate.result.old_status)} → {getSerialStatusLabel(serialUpdate.result.new_status)}</p>
              {serialUpdate.result.inventory_transaction_id !== null && (
                <p className="mt-1 text-xs text-emerald-700">Giao dịch điều chỉnh #{serialUpdate.result.inventory_transaction_id}</p>
              )}
            </div>
            <button type="button" onClick={() => setSerialUpdate(null)} aria-label="Đóng thông báo cập nhật Serial" className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Tồn trước</p><p className="mt-1 font-bold text-slate-800">{formatNumber(serialUpdate.result.inventory_stock_quantity_before)}</p></div>
            <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Thay đổi</p><p className={`mt-1 font-bold ${serialUpdate.result.quantity_change < 0 ? "text-rose-600" : "text-emerald-700"}`}>{serialUpdate.result.quantity_change > 0 ? "+" : ""}{serialUpdate.result.quantity_change}</p></div>
            <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Tồn sau</p><p className="mt-1 font-bold text-blue-700">{formatNumber(serialUpdate.result.inventory_stock_quantity_after)}</p></div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={keyword}
            aria-label="Tìm Serial Number trong SKU"
            onChange={(event) => {
              setKeyword(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm Serial Number..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={statusFilter}
          aria-label="Lọc trạng thái Serial Number"
          onChange={(event) => {
            setStatusFilter(
              event.target.value as SerialStatusFilter,
            );

            setCurrentPage(1);
          }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
        >
          <option value="ALL">
            Tất cả trạng thái
          </option>
          {SERIAL_STATUS_OPTIONS.map((status) => (
            <option
              key={status.code}
              value={status.code}
            >
              {status.label}
            </option>

          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setKeyword("");
            setStatusFilter("ALL");
            setCurrentPage(1);
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={14} />

          Đặt lại
        </button>
      </div>
      {/* ================================================== */}
      {/* SERIAL TABLE */}
      {/* ================================================== */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">
                STT
              </th>
              <th className="px-4 py-3">
                Serial ID
              </th>
              <th className="px-4 py-3">
                Serial Number
              </th>
              <th className="px-4 py-3">
                Mã SKU
              </th>
              <th className="px-4 py-3">
                Trạng thái
              </th>
              <th className="px-4 py-3">
                Mã trạng thái
              </th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedSerials.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center"
                >
                  <Hash
                    size={26}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Không tìm thấy Serial Number
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    SKU chưa có Serial hoặc không khớp bộ lọc.
                  </p>
                </td>
              </tr>

            ) : (

              paginatedSerials.map((serial, index) => (
                <SerialTableRow
                  key={serial.inventory_sku_serial_id}
                  serial={serial}
                  skuCode={stock.inventory_sku_code}
                  onEdit={() => setEditingSerial(serial)}
                  recentlyUpdated={serialUpdate?.result.serial.inventory_sku_serial_id === serial.inventory_sku_serial_id}
                  index={
                    (safePage - 1) * SERIAL_PAGE_SIZE +
                    index +
                    1
                  }
                />

              ))

            )}
          </tbody>
        </table>
      </div>
      {/* ================================================== */}
      {/* SERIAL PAGINATION */}
      {/* ================================================== */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalRecords={filteredSerials.length}
        pageSize={SERIAL_PAGE_SIZE}
        unit="Serial"
        onChange={setCurrentPage}
      />
    </div>
    {showAddSerialModal && (
      <CreateSerialModal
        stock={stock}
        onClose={() => setShowAddSerialModal(false)}
        onSuccess={handleSerialSuccess}
      />
    )}
    {editingSerial && (
      <UpdateSerialModal
        key={editingSerial.inventory_sku_serial_id}
        stock={stock}
        original={editingSerial}
        onClose={() => setEditingSerial(null)}
        onSuccess={handleSerialUpdateSuccess}
      />
    )}
    </>
  );
}

// ======================================================
// SERIAL TABLE ROW COMPONENT
// ======================================================

function SerialTableRow({
  serial,
  skuCode,
  index,
  onEdit,
  recentlyUpdated,
}: {
  serial: Warehouse1Serial;
  skuCode: string;
  index: number;
  onEdit: () => void;
  recentlyUpdated: boolean;
}) {

  const status =
    serial.status?.inventory_sku_serial_status_code ?? "";

  return (
    <tr className={`transition ${recentlyUpdated ? "bg-blue-50/80 hover:bg-blue-50" : "hover:bg-slate-50/80"}`}>
      {/* INDEX */}
      <td className="px-4 py-3.5 text-sm text-slate-500">
        {index}
      </td>
      {/* SERIAL ID */}
      <td className="px-4 py-3.5 text-sm font-medium text-slate-600">
        #{serial.inventory_sku_serial_id}
      </td>
      {/* SERIAL NUMBER */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <Hash size={16} />
          </div>
          <span className="break-all text-sm font-semibold text-slate-800">
            {serial.inventory_sku_serial_number}
          </span>
        </div>
      </td>
      {/* SKU CODE */}
      <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
        {skuCode}
      </td>
      {/* SERIAL STATUS */}
      <td className="px-4 py-3.5">
        <StatusBadge
          label={getSerialStatusLabel(
            status,
            serial.status?.inventory_sku_serial_status_name,
          )}
          style={getSerialStatusStyle(status)}
        />
      </td>
      {/* STATUS CODE */}
      <td className="px-4 py-3.5">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          {status || "—"}
        </span>
      </td>
      {/* ACTIONS */}
      <td className="px-4 py-3.5 text-center">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`Chỉnh sửa Serial ${serial.inventory_sku_serial_number}`}
          title={isEditableSerialStatus(status) ? "Chỉnh sửa Serial Number" : "Không thể sửa Serial đang đặt hoặc đã bán"}
          disabled={!isEditableSerialStatus(status)}
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <Pencil size={15} /> Chỉnh sửa
        </button>
      </td>
    </tr>
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
  color: "blue" | "emerald" | "amber" | "rose";
  loading: boolean;
  failed: boolean;
}) {

  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-slate-800",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },

    amber: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
    },

    rose: {
      icon: "bg-rose-50 text-rose-600",
      value: "text-rose-600",
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
              {failed ? "—" : formatNumber(value)}
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

// ======================================================
// SERIAL STAT CARD COMPONENT
// ======================================================

function SerialStatCard({
  title,
  code,
  value,
  style,
  loading,
  failed,
}: {
  title: string;
  code: string;
  value: number;
  style: string;
  loading: boolean;
  failed: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${style}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {title}
        </p>
        {code === "AVAILABLE" ? (
          <CheckCircle2 size={18} />
        ) : code === "RESERVED" ? (
          <Clock3 size={18} />
        ) : code === "CANCELLED" ? (
          <X size={18} />
        ) : (
          <Package size={18} />
        )}
      </div>
      {loading ? (
        <LoaderCircle
          size={22}
          className="mt-3 animate-spin"
        />

      ) : (
        <p className="mt-2 text-2xl font-bold">
          {failed ? "—" : formatNumber(value)}
        </p>

      )}
      <p className="mt-1 text-[10px] font-semibold opacity-70">
        {code}
      </p>
    </div>
  );
}

// ======================================================
// PAGINATION COMPONENT
// ======================================================

function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  unit,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  unit: string;
  onChange: (page: number) => void;
}) {

  const start =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const end = Math.min(
    currentPage * pageSize,
    totalRecords,
  );

  return (
    <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
      <p className="text-sm text-slate-500">

        Hiển thị{" "}
        <span className="font-semibold text-slate-700">
          {start} - {end}
        </span>
        {" "}trên{" "}
        <span className="font-semibold text-slate-700">
          {formatNumber(totalRecords)}
        </span>
        {" "}{unit}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="min-w-24 text-center text-sm font-medium text-slate-600">

          Trang {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          aria-label="Trang sau"
          disabled={currentPage >= totalPages}
          onClick={() => onChange(currentPage + 1)}
          className={PAGINATION_BUTTON_CLASS}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
