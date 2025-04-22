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
  pageNum?: number;
  pageSize?: number;
}) => {
  return http.request<{
    data: StockItem[];
    total: number;
  }>("get", "/warehouse/stock/list", { params });
};

// 批量导入库存
export const importStockApi = (formData: FormData) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("post", "/warehouse/stock/import", { data: formData });
};

// 匹配预报
export const matchForecastApi = (items: StockItem[]) => {
  return http.request<{
    code: number;
    message: string;
    data: StockItem[];
  }>("post", "/warehouse/stock/match", { data: { items } });
};

// 确认入库
export const confirmStockInApi = (id: string | number) => {
  return http.request<{
    code: number;
    message: string;
  }>("post", `/warehouse/stock/confirm/${id}`);
};

// 获取预报详情
export const getCustomerOrderDetailApi = (id: string | number) => {
  return http.request<{
    code: number;
    message: string;
    data: CustomerOrderDetail;
  }>("get", `/warehouse/stock/forecast/${id}`);
};

// 结算库存
export const settleStockApi = (id: string | number) => {
  return http.request<{
    code: number;
    message: string;
  }>("post", `/warehouse/stock/settle/${id}`);
};

// 获取仓库列表
export const getWarehouseListApi = () => {
  return http.request<{
    code: number;
    data: Array<{ id: string; name: string }>;
  }>("get", "/admin/warehouse/list");
};
