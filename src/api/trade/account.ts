import { http } from "@/utils/http";

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

// 每日完成情况接口
export interface DailyCompletion {
  day: number;
  amount: number;
  status: "complete" | "processing" | "waiting";
  time?: string;
}

// 账号信息接口
export interface Account {
  id?: string;
  account: string;
  password: string;
  apiUrl?: string;
  country: string;
  status: "completed" | "processing" | "waiting" | "locking";
  loginStatus: "valid" | "invalid";
  planId?: string;
  planName?: string; // 计划名称
  planAmount?: number; // 计划金额
  completedDays?: DailyCompletion[];
  currentPlanDay?: number;
  createdByName?: string;
  importedByNickname?: string;
  importedAt?: string;
  createdAt: string;
  updatedAt?: string;
  bindRoom?: string; // 绑定群聊
  // 添加计划详细信息
  plan?: {
    id: string;
    name: string;
    country_code: string;
    rate_id: number;
    plan_days: number;
    float_amount: string;
    total_amount: string;
    exchange_interval: number;
    day_interval: number;
    daily_amounts: number[];
    completed_days: number[];
    bind_room: number;
    status: string;
    description: string | null;
  };
  // 汇率信息（直接在账号下）
  rate?: {
    id: number;
    name: string;
    country_code: string;
    card_type: string;
    card_form: string;
    amount_constraint: string;
    fixed_amounts: string | null;
    multiple_base: number;
    min_amount: string;
    max_amount: string;
    rate: string;
    status: string;
    description: string | null;
  };
  // 群聊信息
  room?: {
    id: number;
    room_name: string;
  } | null;
  // 用户信息
  user?: {
    nickname: string;
  } | null;
}

// 批量导入账号接口
export interface ImportAccountInfo {
  account: string;
  password: string;
  apiUrl?: string;
}

export interface BatchImportAccountsRequest {
  country_code: string;
  accounts: ImportAccountInfo[];
}

// 批量导入响应
export interface BatchImportResponse {
  successCount: number;
  failCount?: number;
  duplicateAccounts?: string[];
  accounts: Account[];
  // 后端实际返回的字段
  restoredCount?: number;
  createdCount?: number;
  updatedCount?: number;
}

// 查询参数接口
export interface AccountQueryParams {
  account?: string;
  country?: string;
  status?: string;
  loginStatus?: string;
  importedBy?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

// 获取账号列表
export const accountApi = {
  // 获取账号列表
  getList: (params?: AccountQueryParams) => {
    return http.request<ApiResponse<PageResponse<Account>>>(
      "get",
      "/trade/itunes/accounts",
      { params }
    );
  },

  // 获取账号详情
  getDetail: (id: string) => {
    return http.request<ApiResponse<AccountDetail>>(
      "get",
      `/trade/itunes/accounts/${id}`
    );
  },

  // 更新账号状态
  updateStatus: (id: string, status: string) => {
    return http.request<ApiResponse<Account>>(
      "patch",
      `/trade/itunes/accounts/${id}/status`,
      { data: { status } }
    );
  },

  // 删除账号
  delete: (id: string) => {
    return http.request<ApiResponse<null>>(
      "delete",
      `/trade/itunes/accounts/${id}`
    );
  },

  // 批量删除账号
  batchDelete: (ids: string[]) => {
    return http.request<ApiResponse<null>>(
      "delete",
      "/trade/itunes/accounts/batch",
      { data: { ids } }
    );
  },

  // 批量导入账号
  batchImport: (data: BatchImportAccountsRequest) => {
    return http.request<ApiResponse<BatchImportResponse>>(
      "post",
      "/trade/itunes/accounts/batch-import",
      { data }
    );
  },

  // 绑定到计划
  bindToPlan: (id: string, planId: string) => {
    return http.request<ApiResponse<Account>>(
      "post",
      `/trade/itunes/accounts/${id}/bind-plan`,
      { data: { planId } }
    );
  },

  // 从计划解绑
  unbindFromPlan: (id: string) => {
    return http.request<ApiResponse<Account>>(
      "post",
      `/trade/itunes/accounts/${id}/unbind-plan`
    );
  },

  // 更新登录状态
  updateLoginStatus: (id: string, loginStatus: string) => {
    return http.request<ApiResponse<Account>>(
      "put",
      `/trade/itunes/accounts/${id}/login-status`,
      { data: { loginStatus } }
    );
  },

  // 获取账号统计
  getStatistics: () => {
    return http.request<ApiResponse<any>>(
      "get",
      "/trade/itunes/accounts/statistics"
    );
  },

  // 获取可用账号
  getAvailableAccounts: () => {
    return http.request<ApiResponse<Account[]>>(
      "get",
      "/trade/itunes/accounts/available"
    );
  }
};

// 获取国家列表
export const getCountriesForAccountApi = () => {
  return http.request<any>("get", "/system/countries/list", {
    params: { pageSize: 100, status: "1" }
  });
};

// 兑换日志接口
export interface ExchangeLog {
  id: string;
  accountId: string;
  planId: string;
  day: number;
  amount: number;
  code?: string; // 礼品卡Code
  status: "success" | "failed" | "pending";
  exchangeTime: string;
  errorMessage?: string;
  createdAt: string;
}

// 账号详情接口（包含计划信息）
export interface AccountDetail extends Account {
  plan?: {
    id: string;
    name: string;
    country_code: string;
    rate_id: number;
    plan_days: number;
    float_amount: string;
    total_amount: string;
    exchange_interval: number;
    day_interval: number;
    daily_amounts: number[];
    completed_days: number[];
    bind_room: number;
    status: string;
    description: string | null;
    // 兼容旧字段
    planDays?: number;
    totalAmount?: number;
    floatAmount?: number;
    enableRoomBinding?: boolean;
    rateId?: string; // 汇率ID
    rateName?: string; // 汇率名称
    countryCode?: string; // 国家代码
    countryName?: string; // 国家名称
  };
  exchangeLogs?: ExchangeLog[];
}
