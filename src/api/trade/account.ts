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
  status: "completed" | "processing" | "waiting";
  loginStatus: "valid" | "invalid";
  planId?: string;
  completedDays?: DailyCompletion[];
  currentPlanDay?: number;
  createdByName?: string;
  importedByNickname?: string;
  importedAt?: string;
  createdAt: string;
  updatedAt?: string;
  bindRoom?: string; // 绑定群聊
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
  failCount: number;
  duplicateAccounts: string[];
  accounts: Account[];
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
    planDays: number;
    dailyAmounts: number[];
    totalAmount: number;
    status: string;
  };
  exchangeLogs?: ExchangeLog[];
}
