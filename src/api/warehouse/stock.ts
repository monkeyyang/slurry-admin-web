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
export const settleStockApi = (data: {
  id: string | number;
  settle_money: number;
  remark?: string;
}) => {
  return http.request("post", "/warehouse/stock/settle", { data });
};

// 检查快递单号是否已存在
export const checkTrackingNoExistsApi = (params: {
  warehouseId: string;
  trackingNos: string[];
}) => {
  return http.request<{
    code: number;
    message: string;
    data: string[]; // 返回已存在的快递单号列表
  }>("post", "/warehouse/stock/check-exists", { data: params });
};
