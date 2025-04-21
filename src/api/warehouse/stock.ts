import { http } from "@/utils/http";

// 获取库存列表
export const getStockListApi = (params: {
  warehouseId?: number | string;
  goodsName?: string;
  trackingNo?: string;
  pageNum: number;
  pageSize: number;
}) => {
  return http.request("get", "/warehouse/stock/list", { params });
};

// 批量导入库存
export const importStockApi = (data: {
  warehouseId: number | string;
  items: Array<{
    goodsName: string;
    trackingNo: string;
    productCode?: string;
  }>;
}) => {
  return http.request("post", "/warehouse/stock/import", { data });
};

// 匹配预报
export const matchForecastApi = (data: {
  warehouseId: number | string;
  items: Array<{
    trackingNo: string;
  }>;
}) => {
  return http.request("post", "/warehouse/stock/match", { data });
};

// 确认入库
export const confirmStorageApi = (id: number | string) => {
  return http.request("post", `/warehouse/stock/confirm/${id}`);
};

// 获取预报详情
export const getForecastDetailApi = (id: number | string) => {
  return http.request("get", `/warehouse/stock/forecast/${id}`);
};

// 结算库存
export const settleStockApi = (id: number | string) => {
  return http.request("post", `/warehouse/stock/settle/${id}`);
};
