import { http } from "@/utils/http";

// 定义通用响应数据接口
export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface GoodsQuery {
  name?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface GoodsAlias {
  id?: number;
  goods_id?: number;
  name: string; // 该国家/地区下的商品名称
  region: string; // 国家/地区代码
  create_time?: string;
  update_time?: string;
  deleted?: number;
}

export interface GoodsDTO {
  id: number;
  name: string; // 货物基本名称
  create_time: string;
  update_time: string;
  deleted: number;
  aliases?: GoodsAlias[]; // 别名列表
}

export interface GoodsPageData {
  current_page: number;
  data: GoodsDTO[];
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

export interface GoodsRequest {
  id?: number | string;
  name: string; // 货物基本名称
  aliases?: GoodsAlias[]; // 别名列表
  remark?: string; // 备注
}

/**
 * 获取货品列表
 * @param params 查询参数
 */
export const getGoodsListApi = (params?: GoodsQuery) => {
  return http
    .request<ResponseData<GoodsPageData>>("get", "/warehouse/goods/list", {
      params
    })
    .then(response => {
      console.log("API内部处理前的响应:", response);
      return response;
    })
    .catch(error => {
      console.error("API请求失败:", error);
      throw error;
    });
};

/**
 * 获取货品详情
 * @param id 货品ID
 */
export const getGoodsDetailApi = (id: string | number) => {
  return http.request<ResponseData<GoodsDTO>>(
    "get",
    `/warehouse/goods/info/${id}`
  );
};

/**
 * 新增货品
 * @param data 货品数据
 */
export const addGoodsApi = (data: GoodsRequest) => {
  return http.request<ResponseData<any>>("post", "/warehouse/goods/create", {
    data
  });
};

/**
 * 更新货品
 * @param id 货品ID
 * @param data 货品数据
 */
export const updateGoodsApi = (id: string | number, data: GoodsRequest) => {
  return http.request<ResponseData<any>>(
    "post",
    `/warehouse/goods/update/${id}`,
    { data }
  );
};

/**
 * 删除货品
 * @param id 货品ID
 */
export const deleteGoodsApi = (id: string | number) => {
  return http.request<ResponseData<any>>(
    "post",
    `/warehouse/goods/delete/${id}`
  );
};

/**
 * 删除货品别名
 * @param id 别名ID
 */
export const deleteGoodsAliasApi = (id: string | number) => {
  return http.request<ResponseData<any>>(
    "post",
    `/warehouse/goods/alias/delete/${id}`
  );
};

// 更新货物状态
export const updateGoodsStatusApi = (id: number | string, status: string) => {
  return http.request("put", `/warehouse/goods/${id}/status/${status}`);
};

// 批量删除货品
export function batchDeleteGoodsApi(ids: number[]) {
  return http.request("delete", "/warehouse/goods/batch", { data: { ids } });
}
