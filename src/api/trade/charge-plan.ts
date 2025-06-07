import { http } from "@/utils/http";
import type { ChargePlan, ChargePlanBatch } from "./types";

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页响应接口
export interface PageResponse<T> {
  data: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 查询参数接口
export interface ChargePlanQueryParams {
  account?: string;
  country?: string;
  status?: string;
  groupId?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

// 获取充值计划列表
export const getChargePlansApi = (params: ChargePlanQueryParams) => {
  return http.get<ChargePlanQueryParams, ApiResponse<PageResponse<ChargePlan>>>(
    "/trade/gift-exchange/plans",
    { params }
  );
};

// 获取单个充值计划详情
export const getChargePlanApi = (id: string) => {
  return http.get<any, ApiResponse<ChargePlan>>(
    `/trade/gift-exchange/plans/${id}`
  );
};

// 创建充值计划
export const createChargePlanApi = (data: Partial<ChargePlan>) => {
  return http.post<Partial<ChargePlan>, ApiResponse<ChargePlan>>(
    "/trade/gift-exchange/plans",
    { data }
  );
};

// 批量创建充值计划
export const createBatchChargePlansApi = (data: ChargePlanBatch) => {
  return http.post<ChargePlanBatch, ApiResponse<ChargePlan[]>>(
    "/trade/gift-exchange/plans/batch",
    { data }
  );
};

// 从模板创建计划
export const createPlanFromTemplateApi = (templateId: string, data: any) => {
  return http.post<any, ApiResponse<ChargePlan[]>>(
    "/trade/gift-exchange/plans/from-template",
    { data: { templateId, ...data } }
  );
};

// 更新充值计划
export const updateChargePlanApi = (id: string, data: Partial<ChargePlan>) => {
  return http.request<ApiResponse<ChargePlan>>(
    "put",
    `/trade/gift-exchange/plans/${id}`,
    { data }
  );
};

// 更新计划状态
export const updateChargePlanStatusApi = (id: string, status: string) => {
  return http.request<ApiResponse<ChargePlan>>(
    "put",
    `/trade/gift-exchange/plans/${id}/status`,
    { data: { status } }
  );
};

// 删除充值计划
export const deleteChargePlanApi = (id: string) => {
  return http.request<ApiResponse<null>>(
    "delete",
    `/trade/gift-exchange/plans/${id}`
  );
};

// 执行计划
export const executePlanApi = (id: string) => {
  return http.post<any, ApiResponse<ChargePlan>>(
    `/trade/gift-exchange/plans/${id}/start`,
    {}
  );
};

// 暂停计划
export const pausePlanApi = (id: string) => {
  return http.post<any, ApiResponse<ChargePlan>>(
    `/trade/gift-exchange/plans/${id}/pause`,
    {}
  );
};

// 恢复计划
export const resumePlanApi = (id: string) => {
  return http.post<any, ApiResponse<ChargePlan>>(
    `/trade/gift-exchange/plans/${id}/resume`,
    {}
  );
};

// 取消计划
export const cancelPlanApi = (id: string) => {
  return http.post<any, ApiResponse<ChargePlan>>(
    `/trade/gift-exchange/plans/${id}/cancel`,
    {}
  );
};

// 获取计划日志
export const getPlanLogsApi = (id: string) => {
  return http.get<any, ApiResponse<any[]>>(
    `/trade/gift-exchange/plans/${id}/logs`
  );
};

// 批量删除充值计划
export const batchDeleteChargePlansApi = (ids: string[]) => {
  return http.request<ApiResponse<null>>(
    "delete",
    "/trade/gift-exchange/plans/batch",
    { data: { ids } }
  );
};

// 批量操作计划 (通用方法，可用于批量执行、暂停等)
export const batchOperateChargePlansApi = (ids: string[], action: string) => {
  return http.post<{ ids: string[]; action: string }, ApiResponse<null>>(
    "/trade/gift-exchange/plans/batch-operate",
    { data: { ids, action } }
  );
};

// 获取国家列表
export const getCountriesForChargePlanApi = () => {
  return http.request<any>("get", "/system/countries/list", {
    params: { pageSize: 100, status: "1" }
  });
};

// 获取群组列表
export const getGroupsForChargePlanApi = () => {
  return http.request<any>("get", "/trade/itunes/groups", {
    params: { pageSize: 100, status: "1" }
  });
};

// 为了向后兼容，保留原来的方法名
export const toggleChargePlanStatusApi = updateChargePlanStatusApi;
