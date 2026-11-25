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

export type SerialStatus = "AVAILABLE" | "RESERVED" | "CANCELLED" | "SOLD";
export type TransactionType = "IMPORT" | "EXPORT" | "TRANSFER_IN" | "TRANSFER_OUT";

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
};
