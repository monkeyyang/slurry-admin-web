import { http } from "@/utils/http";

// 国家选项类型（与汇率设置保持一致）
export interface CountryOption {
  id: string;
  code: string;
  name_zh: string;
  name_en: string;
}

// 计划项目类型定义
export interface PlanItem {
  id?: string;
  name: string; // 计划名称：汇率名称_计划天数_计划总额
  countryId: string; // 选择的国家代码（如：CA、US等）
  countryName: string; // 国家名称
  rateId: string; // 选择的汇率ID
  rateName: string; // 汇率名称
  planDays: number; // 计划完成天数
  floatAmount: number; // 浮动金额，默认0
  totalAmount: number; // 兑换ID总额
  exchangeInterval: number; // 同ID兑换时间间隔（分钟），默认5
  dayInterval: number; // 同ID兑换天数间隔（小时），默认24
  dailyAmounts: number[]; // 每天的计划金额数组
  status: "enabled" | "disabled"; // 状态：启用/禁用
  enableRoomBinding?: boolean; // 是否开启群聊绑定
  description?: string; // 描述
  createdAt?: string;
  updatedAt?: string;
}

// 计划查询参数
export interface PlanQueryParams {
  page?: number;
  pageSize?: number;
  countryId?: string;
  rateId?: string;
  status?: string;
  keyword?: string;
}

// 计划列表响应
export interface PlanListResponse {
  data: PlanItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 后端返回的原始数据结构
export interface BackendPlanItem {
  id: number;
  uid: number;
  name: string;
  country_code: string; // 国家代码
  country_name: string;
  rate_id: number;
  rate_name: string;
  plan_days: number;
  float_amount: string;
  total_amount: string;
  exchange_interval: number;
  day_interval: number;
  daily_amounts: string; // JSON字符串
  status: "enabled" | "disabled";
  status_text: string;
  enable_room_binding?: boolean; // 是否开启群聊绑定
  description: string | null;
  created_at: string;
  updated_at: string;
  user: any | null;
  rate: any | null;
}

// 后端返回的列表响应结构
export interface BackendPlanListResponse {
  list: BackendPlanItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 提交给后端的数据格式
interface PlanSubmitData {
  name?: string;
  country_code?: string;
  rate_id?: number;
  plan_days?: number;
  float_amount?: number;
  total_amount?: number;
  exchange_interval?: number;
  day_interval?: number;
  daily_amounts?: number[];
  status?: string;
  enable_room_binding?: boolean; // 是否开启群聊绑定
  description?: string;
}

// API 方法
export const planApi = {
  // 获取计划列表
  getList: (params?: PlanQueryParams) => {
    return http.request<{ data: BackendPlanListResponse }>(
      "get",
      "/trade/itunes/plans",
      {
        params
      }
    );
  },

  // 获取计划详情
  getDetail: (id: string) => {
    return http.request<{ data: PlanItem }>("get", `/trade/itunes/plans/${id}`);
  },

  // 创建计划
  create: (data: Omit<PlanItem, "id" | "createdAt" | "updatedAt">) => {
    // 转换数据格式为后端期望的格式
    const submitData: PlanSubmitData = {
      name: data.name,
      country_code: data.countryId,
      rate_id: parseInt(data.rateId),
      plan_days: data.planDays,
      float_amount: data.floatAmount,
      total_amount: data.totalAmount,
      exchange_interval: data.exchangeInterval,
      day_interval: data.dayInterval,
      daily_amounts: data.dailyAmounts,
      status: data.status,
      enable_room_binding: data.enableRoomBinding,
      description: data.description
    };

    return http.request<{ data: PlanItem }>("post", "/trade/itunes/plans", {
      data: submitData
    });
  },

  // 更新计划
  update: (id: string, data: Partial<PlanItem>) => {
    // 转换数据格式为后端期望的格式
    const submitData: Partial<PlanSubmitData> = {
      name: data.name,
      country_code: data.countryId,
      rate_id: data.rateId ? parseInt(data.rateId) : undefined,
      plan_days: data.planDays,
      float_amount: data.floatAmount,
      total_amount: data.totalAmount,
      exchange_interval: data.exchangeInterval,
      day_interval: data.dayInterval,
      daily_amounts: data.dailyAmounts,
      status: data.status,
      enable_room_binding: data.enableRoomBinding,
      description: data.description
    };

    return http.request<{ data: PlanItem }>(
      "put",
      `/trade/itunes/plans/${id}`,
      {
        data: submitData
      }
    );
  },

  // 删除计划
  delete: (id: string) => {
    return http.request<{ message: string }>(
      "delete",
      `/trade/itunes/plans/${id}`
    );
  },

  // 批量删除计划
  batchDelete: (ids: string[]) => {
    return http.request<{ message: string }>(
      "delete",
      "/trade/itunes/plans/batch",
      {
        data: { ids }
      }
    );
  },

  // 更新计划状态
  updateStatus: (id: string, status: "enabled" | "disabled") => {
    return http.request<{ data: PlanItem }>(
      "patch",
      `/trade/itunes/plans/${id}/status`,
      {
        data: { status }
      }
    );
  },

  // 添加天数计划
  addDays: (id: string, additionalDays: number) => {
    return http.request<{ data: PlanItem }>(
      "post",
      `/trade/itunes/plans/${id}/add-days`,
      {
        data: { additional_days: additionalDays }
      }
    );
  }
};

// 汇率项目接口
export interface RateItem {
  id: string;
  name: string;
  country_code: string;
  group_id: number | null;
  room_id: number | null;
  card_type: string;
  card_type_text: string;
  card_form: string;
  card_form_text: string;
  amount_constraint: string;
  amount_constraint_text: string;
  fixed_amounts: string | null;
  multiple_base: number;
  min_amount: string;
  max_amount: string;
  rate: string;
  status: string;
  status_text: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  country: {
    code: string;
    name: string;
    name_en: string;
  };
  group: {
    id: number;
    name: string;
  } | null;
}

// 根据国家获取汇率列表
export const getRatesByCountry = (countryCode: string) => {
  return http.request<{ code: number; message: string; data: RateItem[] }>(
    "get",
    `/trade/itunes/rates/by-country/${countryCode}`
  );
};
