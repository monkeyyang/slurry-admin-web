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
  address?: string; // 新增：仓库地址
  contact?: string; // 新增：联系人
  phone?: string; // 新增：联系电话
  goods?: {
    warehouse_id: number;
    goods_id: number;
    goods_name: string;
  }[];
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
export interface WarehouseQuery {
  name?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// 仓库API函数

/**
 * 获取仓库列表
 * @param params 查询参数
 */
export function getWarehouseListApi(params?: WarehouseQuery) {
  return http.request("get", "/admin/warehouse/list", { params });
}

/**
 * 获取所有仓库（不分页）
 */
export function getAllWarehousesApi() {
  return http.request("get", "/admin/warehouse/all");
}

/**
 * 获取仓库信息
 * @param id 仓库ID
 */
export function getWarehouseInfoApi(id: number) {
  return http.request("get", `/admin/warehouse/info/${id}`);
}

/**
 * 添加仓库
 * @param data 仓库数据
 */
export function addWarehouseApi(
  data: Partial<WarehouseDTO> & { goods_ids?: number[] }
) {
  return http.request("post", "/admin/warehouse/create", { data });
}

/**
 * 更新仓库
 * @param id 仓库ID
 * @param data 仓库数据
 */
export function updateWarehouseApi(
  id: number,
  data: Partial<WarehouseDTO> & { goods_ids?: number[] }
) {
  return http.request("post", `/admin/warehouse/update/${id}`, { data });
}

/**
 * 更新仓库状态
 * @param data 包含id和status的对象
 */
export function updateWarehouseStatusApi(data: { id: number; status: string }) {
  return http.request("post", "/admin/warehouse/updateStatus", { data });
}

/**
 * 删除仓库
 * @param id 仓库ID
 */
export function deleteWarehouseApi(id: number) {
  return http.request("post", `/admin/warehouse/delete/${id}`);
}

/**
 * 获取仓库关联的货品
 * @param id 仓库ID
 */
export function getWarehouseGoodsApi(id: number) {
  return http.request("get", `/admin/warehouse/goods/${id}`);
}

/**
 * 获取货物列表
 * @param params 查询参数
 */
export function getWarehouseItemsApi(params: { warehouse_id: number }) {
  return http.request<WarehousePageData>("get", "/admin/warehouse/items", {
    params
  });
}
