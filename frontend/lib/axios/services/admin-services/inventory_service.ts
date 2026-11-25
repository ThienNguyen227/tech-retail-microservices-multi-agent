import { adminAxios } from "../../admin-axios";

// CALL DIRECT API
// const INVENTORY_SERVICE_URL = "http://localhost:3006/api/v1/admin-session/inventory-service";

// CALL THROUGH API GATEWAY (NGINX)
const INVENTORY_SERVICE_URL = "http://localhost/api/v1/admin-session/inventory-service";

export interface InventorySku {
  inventory_sku_id: number;
  inventory_sku_code: string;
}

export interface InventoryStock {
  inventory_id: number;
  inventory_sku_id: number;
  inventory_stock_quantity: number;
  sku: InventorySku;
}

export interface InventoryReference {
  inventory_id: number;
  inventory_branch_id: number;
}

export interface Inventory extends InventoryReference {
  inventory_created_at: string;
  inventory_updated_at: string;
  stocks: InventoryStock[];
  total_skus: number;
  total_stock_quantity: number;
}

export type SerialStatus = "AVAILABLE" | "RESERVED" | "CANCELLED" | "SOLD" | "EXPORTED";
export type TransactionType = "IMPORT" | "EXPORT" | "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT";

export interface InventorySerial {
  inventory_sku_serial_id: number;
  inventory_sku_serial_number: string;
  inventory_sku_serial_status_id: number;
  inventory_sku_id: number;
  inventory_id: number;
  sku: InventorySku;
  inventory: InventoryReference;
  status: {
    inventory_sku_serial_status_id: number;
    inventory_sku_serial_status_code: SerialStatus;
    inventory_sku_serial_status_name: string;
  };
}

export interface InventoryTransactionItem {
  inventory_sku_id: number;
  inventory_transaction_id: number;
  inventory_transaction_item_quantity: number;
  inventory_transaction_item_before: number;
  inventory_transaction_item_after: number;
  sku: InventorySku;
}

export interface InventoryTransaction {
  inventory_transaction_id: number;
  inventory_transaction_from: string | null;
  inventory_transaction_to: string | null;
  inventory_transaction_created_at: string;
  inventory_transaction_updated_at: string;
  inventory_transaction_type_id: number;
  inventory_id: number;
  inventory: InventoryReference;
  type: {
    inventory_transaction_type_id: number;
    inventory_transaction_type_code: TransactionType;
    inventory_transaction_type_name: string;
  };
  items: InventoryTransactionItem[];
}

export interface InventoryListResponse<T> {
  success: boolean;
  message: string;
  total: number;
  data: T[];
}

// ======================================================
// WAREHOUSE 1 INTERFACES
// ======================================================

export interface Warehouse1Serial {
  inventory_sku_serial_id: number;
  inventory_sku_serial_number: string;
  inventory_sku_serial_status_id: number;
  inventory_id: number;
  inventory_sku_id: number;

  status: {
    inventory_sku_serial_status_id: number;
    inventory_sku_serial_status_code: SerialStatus;
    inventory_sku_serial_status_name: string;
  };
}

export interface Warehouse1SerialStatistics {
  total: number;
  available: number;
  reserved: number;
  cancelled: number;
  sold: number;
}

export interface Warehouse1Stock {
  inventory_id: number;
  inventory_branch_id: number;

  inventory_sku_id: number;
  inventory_sku_code: string;

  inventory_stock_quantity: number;

  serial_statistics: Warehouse1SerialStatistics;

  serials: Warehouse1Serial[];
}

// ======================================================
// WAREHOUSE 1 CREATE SKU INTERFACES
// ======================================================

export interface CreateWarehouse1SkuRequest {
  sku: string;
}

export interface CreateWarehouse1SkuResponse {
  success: boolean;
  message: string;
  data: Warehouse1Stock;
}

// ======================================================
// WAREHOUSE 1 BULK CREATE SKU INTERFACES
// ======================================================

export interface CreateWarehouse1SkusRequest {
  skus: string[];
}

export interface Warehouse1SkippedSku {
  sku: string;
  reason: string;
}

export interface CreateWarehouse1SkusResult {
  total_requested: number;
  total_created: number;
  total_skipped: number;

  created_skus: string[];

  created_stocks: Warehouse1Stock[];

  skipped_skus: Warehouse1SkippedSku[];
}

export interface CreateWarehouse1SkusResponse {
  success: boolean;
  message: string;

  data: CreateWarehouse1SkusResult;
}

// ======================================================
// WAREHOUSE 1 UPDATE SKU INTERFACES
// ======================================================

export interface UpdateWarehouse1SkuRequest {
  sku: string;
}

export interface UpdateWarehouse1SkuResult
  extends Warehouse1Stock {
  old_inventory_sku_id: number;
  old_inventory_sku_code: string;
}

export interface UpdateWarehouse1SkuResponse {
  success: boolean;
  message: string;
  data: UpdateWarehouse1SkuResult;
}

// ======================================================
// WAREHOUSE 1 CREATE SERIALS INTERFACES
// ======================================================

export interface CreateWarehouse1SerialsRequest {
  serialNumbers: string[];
  source?: string;
}

export interface Warehouse1SkippedSerial {
  serial_number: string;
  reason: string;
}

export interface CreateWarehouse1SerialsResult {
  inventory_id: number;
  inventory_branch_id: number;

  inventory_sku_id: number;
  inventory_sku_code: string;

  total_requested: number;
  total_created: number;
  total_skipped: number;

  inventory_stock_quantity_before: number;
  inventory_stock_quantity_after: number;

  inventory_transaction_id: number | null;

  created_serials: Warehouse1Serial[];

  skipped_serials: Warehouse1SkippedSerial[];
}

export interface CreateWarehouse1SerialsResponse {
  success: boolean;
  message: string;
  data: CreateWarehouse1SerialsResult;
}

// ======================================================
// WAREHOUSE 1 UPDATE SERIAL INTERFACES
// ======================================================

export interface UpdateWarehouse1SerialRequest {
  serialNumber?: string;
  status?: "AVAILABLE" | "CANCELLED";
}

export interface UpdateWarehouse1SerialResult {
  inventory_id: number;
  inventory_branch_id: number;

  inventory_sku_id: number;
  inventory_sku_code: string;

  old_serial_number: string;
  new_serial_number: string;

  old_status: SerialStatus;
  new_status: SerialStatus;

  quantity_change: number;

  inventory_stock_quantity_before: number;
  inventory_stock_quantity_after: number;

  inventory_transaction_id: number | null;

  serial: Warehouse1Serial;
}

export interface UpdateWarehouse1SerialResponse {
  success: boolean;
  message: string;
  data: UpdateWarehouse1SerialResult;
}

// ======================================================
// WAREHOUSE 1 EXPORT INVENTORY INTERFACES
// ======================================================

export type Warehouse1ExportType =
  | "TRANSFER"
  | "EXPORT";

export type ExportWarehouse1InventoryRequest =
  | {
      type: "TRANSFER";
      destinationBranchId: number;
      destination?: never;
      serialIds: number[];
    }
  | {
      type: "EXPORT";
      destination: string;
      destinationBranchId?: never;
      serialIds: number[];
    };

export interface Warehouse1ExportSource
  extends InventoryReference {
  name: string;
}

export interface Warehouse1ExportDestination {
  inventory_id: number | null;
  inventory_branch_id: number | null;
  name: string;
}

export interface Warehouse1ExportItem {
  inventory_sku_id: number;
  inventory_sku_code: string;

  quantity: number;

  source_quantity_before: number;
  source_quantity_after: number;

  destination_quantity_before: number | null;
  destination_quantity_after: number | null;

  serial_ids: number[];
  serial_numbers: string[];
}

export interface ExportWarehouse1InventoryResult {
  type: Warehouse1ExportType;

  source: Warehouse1ExportSource;
  destination: Warehouse1ExportDestination;

  total_skus: number;
  total_serials: number;
  total_quantity: number;

  source_transaction_id: number;
  destination_transaction_id: number | null;

  items: Warehouse1ExportItem[];
}

export interface ExportWarehouse1InventoryResponse {
  success: boolean;
  message: string;
  data: ExportWarehouse1InventoryResult;
}

export const adminInventoryService = {
  // ======================================================
  // 1. (GET) INVENTORY-LIST
  // ======================================================

  async getInventoryList(
    search?: string,
    branchId?: number,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.get<
      InventoryListResponse<Inventory>
    >(
      `${INVENTORY_SERVICE_URL}/inventory-list`,
      {
        params: {
          search: search?.trim() || undefined,
          branchId,
        },
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 2. (GET) INVENTORY-SERIAL-LIST
  // ======================================================

  async getInventorySerialList(
    search?: string,
    branchId?: number,
    inventoryId?: number,
    sku?: string,
    status?: SerialStatus,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.get<
      InventoryListResponse<InventorySerial>
    >(
      `${INVENTORY_SERVICE_URL}/inventory-serial-list`,
      {
        params: {
          search: search?.trim() || undefined,
          branchId,
          inventoryId,
          sku: sku?.trim() || undefined,
          status,
        },
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 3. (GET) INVENTORY-TRANSACTION-LIST
  // ======================================================

  async getInventoryTransactionList(
    search?: string,
    branchId?: number,
    inventoryId?: number,
    transactionType?: TransactionType,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.get<
      InventoryListResponse<InventoryTransaction>
    >(
      `${INVENTORY_SERVICE_URL}/inventory-transaction-list`,
      {
        params: {
          search: search?.trim() || undefined,
          branchId,
          inventoryId,
          transactionType,
        },
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 4. (GET) WAREHOUSE-1 INVENTORY-LIST
  // ======================================================

  async getWarehouse1InventoryList(
    search?: string,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.get<
      InventoryListResponse<Warehouse1Stock>
    >(
      `${INVENTORY_SERVICE_URL}/warehouse-1/inventory-list`,
      {
        params: {
          search: search?.trim() || undefined,
        },
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 5. (POST) WAREHOUSE-1 CREATE MULTIPLE INVENTORY SKUS
  // ======================================================

  async createWarehouse1Skus(
    data: CreateWarehouse1SkusRequest,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.post<
      CreateWarehouse1SkusResponse
    >(
      `${INVENTORY_SERVICE_URL}/warehouse-1/inventory-skus`,
      {
        skus: data.skus.map((sku) => sku.trim()),
      },
      {
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 6. (PATCH) WAREHOUSE-1 UPDATE INVENTORY SKU
  // ======================================================

  async updateWarehouse1Sku(
    skuId: number,
    data: UpdateWarehouse1SkuRequest,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.patch<
      UpdateWarehouse1SkuResponse
    >(
      `${INVENTORY_SERVICE_URL}/warehouse-1/inventory-skus/${skuId}`,
      {
        sku: data.sku.trim(),
      },
      {
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 7. (POST) WAREHOUSE-1 CREATE MULTIPLE INVENTORY SERIALS
  // ======================================================
  async createWarehouse1Serials(
    skuId: number,
    data: CreateWarehouse1SerialsRequest,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.post<
      CreateWarehouse1SerialsResponse
    >(
      `${INVENTORY_SERVICE_URL}/warehouse-1/inventory-skus/${skuId}/serials`,
      {
        serialNumbers: data.serialNumbers.map(
          (serial) => serial.trim(),
        ),

        source: data.source?.trim() || undefined,
      },
      {
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 8. (PATCH) WAREHOUSE-1 UPDATE INVENTORY SERIAL
  // ======================================================

  async updateWarehouse1Serial(
    serialId: number,
    data: UpdateWarehouse1SerialRequest,
    signal?: AbortSignal,
  ) {
    const response = await adminAxios.patch<
      UpdateWarehouse1SerialResponse
    >(
      `${INVENTORY_SERVICE_URL}/warehouse-1/inventory-serials/${serialId}`,
      {
        serialNumber: data.serialNumber?.trim(),
        status: data.status,
      },
      {
        signal,
      },
    );

    return response.data;
  },

  // ======================================================
  // 9. (POST) WAREHOUSE-1 EXPORT INVENTORY
  // ======================================================

  async exportWarehouse1Inventory(
    data: ExportWarehouse1InventoryRequest,
    signal?: AbortSignal,
  ) {
    const payload: ExportWarehouse1InventoryRequest =
      data.type === "TRANSFER"
        ? {
            type: "TRANSFER",
            destinationBranchId: data.destinationBranchId,
            serialIds: data.serialIds,
          }
        : {
            type: "EXPORT",
            destination: data.destination.trim(),
            serialIds: data.serialIds,
          };

    const response = await adminAxios.post<
      ExportWarehouse1InventoryResponse
    >(
      `${INVENTORY_SERVICE_URL}/warehouse-1/export`,
      payload,
      {
        signal,
      },
    );

    return response.data;
  },
};
