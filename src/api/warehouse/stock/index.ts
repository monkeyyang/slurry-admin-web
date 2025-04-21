import { http } from "@/utils/http";
import type {
  StockItem,
  ImportExcelParams,
  BatchStockInParams,
  CustomerOrderDetail,
  PageResult
} from "./types";

// 获取库存列表
export const getStockListApi = (params: {
  warehouseId?: string;
  goodsName?: string;
  trackingNo?: string;
  pageSize: number;
  pageNum: number;
}) => {
  return http.request<PageResult<StockItem>>("get", "/warehouse/stock/list", {
    params
  });
};

// 导入Excel
export const importStockExcelApi = (params: ImportExcelParams) => {
  const formData = new FormData();
  formData.append("warehouseId", params.warehouseId);
  formData.append("file", params.file);
  return http.request<{ code: number; data: StockItem[] }>(
    "post",
    "/warehouse/stock/import",
    { data: formData }
  );
};

// 批量入库
export const batchStockInApi = (params: BatchStockInParams) => {
  return http.request<{ code: number; data: StockItem[] }>(
    "post",
    "/warehouse/stock/batch-in",
    { data: params }
  );
};

// 确认入库
export const confirmStockInApi = (id: string) => {
  return http.request<{ code: number; data: null }>(
    "post",
    `/warehouse/stock/confirm/${id}`
  );
};

// 结算
export const settleStockApi = (id: string) => {
  return http.request<{ code: number; data: null }>(
    "post",
    `/warehouse/stock/settle/${id}`
  );
};

// 获取客户预报详情
export const getCustomerOrderDetailApi = (id: string) => {
  return http.request<{ code: number; data: CustomerOrderDetail }>(
    "get",
    `/warehouse/stock/customer-order/${id}`
  );
};

// 获取仓库列表
export const getWarehouseListApi = () => {
  return http.request<{
    code: number;
    data: Array<{ id: string; name: string }>;
  }>("get", "/warehouse/list");
};
