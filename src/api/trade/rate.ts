import { http } from "@/utils/http";

// 后端返回的原始数据结构
export interface BackendRateItem {
  id: number;
  uid: number;
  name: string;
  country_code: string;
  group_id: number | null;
  room_id: number | null;
  card_type: "fast" | "slow";
  card_type_text: string;
  card_form: "image" | "code";
  card_form_text: string;
  amount_constraint: "fixed" | "multiple" | "all";
  amount_constraint_text: string;
  fixed_amounts: string | null;
  multiple_base: number;
  max_amount: string;
  min_amount: string;
  rate: string;
  status: "active" | "inactive";
  status_text: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user: any | null;
  country: any | null;
  room: any | null;
  group: any | null;
}

// 前端使用的汇率数据结构
export interface RateItem {
  id?: string;
  country: string; // 国家代码
  countryName: string; // 国家名称
  roomId?: string; // 群ID，可选
  roomName?: string; // 群名称
  groupId?: string; // 群组ID，用于提交到后端
  groupName?: string; // 群组名称，用于显示
  cardType: "fast" | "slow"; // 卡类型：快卡、慢卡
  cardForm: "image" | "code"; // 卡形式：卡图、卡密
  amountConstraint: "fixed" | "multiple" | "all"; // 面额约束：固定面额、倍数要求、全面额
  fixedAmounts?: number[]; // 固定面额数组
  multipleBase?: number; // 倍数基数
  minAmount?: number; // 最小面额
  maxAmount?: number; // 最大面额
  rate: number; // 汇率
  name: string; // 汇率名称：国家代码_群组名称_快卡（或慢卡）_卡图（或卡密）_面额约束_汇率
  description?: string; // 描述
  status: "active" | "inactive"; // 状态
  createdAt?: string;
  updatedAt?: string;
}

// 汇率查询参数
export interface RateQueryParams {
  page?: number;
  pageSize?: number;
  country?: string;
  roomId?: string;
  status?: string;
  keyword?: string;
}

// 后端返回的列表响应结构
export interface BackendRateListResponse {
  list: BackendRateItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 前端使用的汇率列表响应
export interface RateListResponse {
  data: RateItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 群组选项
export interface RoomOption {
  id: string;
  name: string;
}

// 提交到后端的数据结构
export interface RateSubmitData {
  country: string;
  countryName: string;
  group_id?: number; // 后端期望的群组ID字段名
  cardType: "fast" | "slow";
  cardForm: "image" | "code";
  amountConstraint: "fixed" | "multiple" | "all";
  fixedAmounts?: number[];
  multipleBase?: number;
  minAmount?: number;
  maxAmount?: number;
  rate: number;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

// API 方法
export const rateApi = {
  // 获取汇率列表
  getList: (params?: RateQueryParams) => {
    return http.request<{ data: BackendRateListResponse }>(
      "get",
      "/trade/itunes/rates",
      {
        params
      }
    );
  },

  // 获取汇率详情
  getDetail: (id: string) => {
    return http.request<{ data: RateItem }>("get", `/trade/itunes/rates/${id}`);
  },

  // 创建汇率
  create: (data: Omit<RateItem, "id" | "createdAt" | "updatedAt">) => {
    // 转换数据格式为后端期望的格式
    const submitData: RateSubmitData = {
      country: data.country,
      countryName: data.countryName,
      group_id: data.groupId ? parseInt(data.groupId) : undefined,
      cardType: data.cardType,
      cardForm: data.cardForm,
      amountConstraint: data.amountConstraint,
      fixedAmounts: data.fixedAmounts,
      multipleBase: data.multipleBase,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      rate: data.rate,
      name: data.name,
      description: data.description,
      status: data.status
    };

    return http.request<{ data: RateItem }>("post", "/trade/itunes/rates", {
      data: submitData
    });
  },

  // 更新汇率
  update: (id: string, data: Partial<RateItem>) => {
    // 转换数据格式为后端期望的格式
    const submitData: Partial<RateSubmitData> = {
      country: data.country,
      countryName: data.countryName,
      group_id: data.groupId ? parseInt(data.groupId) : undefined,
      cardType: data.cardType,
      cardForm: data.cardForm,
      amountConstraint: data.amountConstraint,
      fixedAmounts: data.fixedAmounts,
      multipleBase: data.multipleBase,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      rate: data.rate,
      name: data.name,
      description: data.description,
      status: data.status
    };

    return http.request<{ data: RateItem }>(
      "put",
      `/trade/itunes/rates/${id}`,
      {
        data: submitData
      }
    );
  },

  // 删除汇率
  delete: (id: string) => {
    return http.request<{ message: string }>(
      "delete",
      `/trade/itunes/rates/${id}`
    );
  },

  // 批量删除汇率
  batchDelete: (ids: string[]) => {
    return http.request<{ message: string }>(
      "delete",
      "/trade/itunes/rates/batch",
      {
        data: { ids }
      }
    );
  },

  // 批量更新状态
  batchUpdateStatus: (ids: string[], status: "active" | "inactive") => {
    return http.request<{ message: string }>(
      "post",
      "/trade/itunes/rates/batch-status",
      {
        data: { ids, status }
      }
    );
  },

  // 获取汇率统计
  getStatistics: () => {
    return http.request<{ data: any }>("get", "/trade/itunes/rates-statistics");
  },

  // 获取群组列表
  getRooms: () => {
    return http.request<{ data: RoomOption[] }>("get", "/trade/itunes/rooms");
  },

  // 获取国家列表
  getCountries: () => {
    return http.request<{ data: { code: string; name: string }[] }>(
      "get",
      "/trade/itunes/countries"
    );
  }
};
