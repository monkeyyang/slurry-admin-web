import { http } from "@/utils/http";
import type { StockItem, CustomerOrderDetail } from "./types";

// 获取库存列表
export function getStockListApi(params: any) {
  // 如果后端API期望下划线格式，可以在这里转换参数名
  const apiParams = {
    ...params,
    // 将驼峰转换为下划线格式
    warehouse_id: params.warehouseId,
    goods_name: params.goodsName,
    tracking_no: params.trackingNo
  };

  // 删除原始驼峰命名的参数
  delete apiParams.warehouseId;
  delete apiParams.goodsName;
  delete apiParams.trackingNo;

  // 使用转换后的参数调用API
  return http.request<any>("get", "/warehouse/stock/list", {
    params: apiParams
  });
}

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

// 删除库存
export const deleteStockApi = (id: string | number) => {
  return http.request<{
    code: number;
    message: string;
  }>("delete", `/warehouse/stock/${id}`);
};

// 批量删除库存
export const batchDeleteStockApi = (ids: (string | number)[]) => {
  return http.request<{
    code: number;
    message: string;
  }>("delete", "/warehouse/stock/batch", { data: { ids } });
};
