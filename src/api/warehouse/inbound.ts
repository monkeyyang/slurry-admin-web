import { http } from "@/utils/http";

export interface InboundQuery {
  warehouseId?: number | string;
  goodsName?: string;
  trackingNumber?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
}

export interface InboundRequest {
  id?: number | string;
  warehouseId: number | string; // 仓库ID
  goodsId: number | string; // 货物ID
  orderNumber?: string; // 订单编号
  trackingNumber?: string; // 物流链接/跟踪号
  country?: string; // 国家
  quantity?: number; // 数量，默认为1
  remark?: string; // 备注
}

export interface InboundBatchRequest {
  warehouseId: number | string;
  items: Array<{
    goodsId: number | string;
    orderNumber?: string;
    trackingNumber?: string;
    country?: string;
    quantity?: number;
  }>;
}

// 获取入库列表
export const getInboundListApi = (params: any) => {
  return http.request("get", "/warehouse/stock-in/list", { params });
};

// 新增入库
export const addInboundApi = (data: any) => {
  return http.request("post", "/warehouse/stock-in/create", { data });
};

// 批量入库
export const batchInboundApi = (data: any) => {
  return http.request("post", "/warehouse/stock-in/batch-create", { data });
};

// 导入入库数据
export const importInboundApi = (data: FormData) => {
  return http.request("post", "/warehouse/stock-in/import", { data });
};

// 取消入库
export const cancelInboundApi = (id: number | string) => {
  return http.request("post", `/warehouse/stock-in/cancel/${id}`);
};

// 删除入库记录 (如果需要的话)
export const deleteInboundApi = (id: number | string) => {
  return http.request("delete", `/warehouse/stock-in/${id}`);
};

// 下载入库模板
export const downloadInboundTemplateApi = () => {
  return http.request("get", "/warehouse/inbound/template", {
    responseType: "blob"
  });
};

/**
 * 结算入库订单
 * @param id 入库订单ID
 * @returns Promise
 */
export function settleInboundApi(id: number | string) {
  return http.request("post", `/warehouse/inbound/settle/${id}`);
}

/**
 * 重置入库订单结算状态
 * @param id 入库订单ID
 * @returns Promise
 */
export function resetSettleInboundApi(id: number | string) {
  return http.request("post", `/warehouse/inbound/reset-settle/${id}`);
}

// 批量删除入库记录
export function batchDeleteInboundApi(ids: number[]) {
  return http.request("delete", "/warehouse/inbound/batch", { data: { ids } });
}
