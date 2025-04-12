import { http } from "@/utils/http";

// 仓库DTO接口
export interface WarehouseDTO {
  id: number;
  name: string;
  status: string | number;
  remark: string | null;
  create_time: string;
  update_time: string;
  deleted: number;
  goods?: WarehouseGoodsDTO[];
}

// 仓库关联货品DTO接口
export interface WarehouseGoodsDTO {
  warehouse_id: number;
  goods_id: number;
  goods_name: string;
}

// 仓库分页数据接口
export interface WarehousePageData {
  current_page: number;
  data: WarehouseDTO[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// 仓库查询参数接口
export interface WarehouseQuery extends BasePageQuery {
  name?: string;
  status?: string;
}

// 货物数据传输对象
export interface WarehouseItemDTO {
  id: number;
  name: string;
  warehouse_id: number;
  in_stock: number; // 库存数量
  pending: number; // 未结算数量
  status: string; // 状态
  create_time: Date;
}

// 仓库API函数

/**
 * 获取仓库列表
 * @param params 查询参数
 */
export const getWarehouseListApi = (params?: WarehouseQuery) => {
  return http.request<WarehousePageData>("get", "/warehouse/list", { params });
};

/**
 * 获取仓库信息
 * @param id 仓库ID
 */
export function getWarehouseInfoApi(id: number) {
  return http.request<ResponseData<WarehouseDTO>>(
    "get",
    "/admin/warehouse/info",
    { params: { id } }
  );
}

/**
 * 添加仓库
 * @param data 仓库数据
 */
export const addWarehouseApi = (data: Partial<WarehouseDTO>) => {
  return http.request<WarehouseDTO>("post", "/admin/warehouse/add", { data });
};

/**
 * 更新仓库
 * @param id 仓库ID
 * @param data 仓库数据
 */
export const updateWarehouseApi = (id: number, data: Partial<WarehouseDTO>) => {
  return http.request<WarehouseDTO>("put", `/admin/warehouse/update/${id}`, {
    data
  });
};

/**
 * 删除仓库
 * @param id 仓库ID
 */
export const deleteWarehouseApi = (id: number) => {
  return http.request("delete", `/admin/warehouse/delete/${id}`);
};

/**
 * 更新仓库状态
 * @param id 仓库ID
 * @param status 状态值
 */
export const updateWarehouseStatusApi = (id: number, status: string) => {
  return http.request("put", `/admin/warehouse/status/${id}`, {
    data: { status }
  });
};

// 获取货物列表
export function getWarehouseItemsApi(params: { warehouse_id: number }) {
  return http.request<ResponseData<PageDTO<WarehouseItemDTO>>>(
    "get",
    "/admin/warehouse/items",
    { params }
  );
}
