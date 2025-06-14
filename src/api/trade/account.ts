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

// 账号信息接口
export interface Account {
  id?: string;
  account: string;
  country: string;
  status: "active" | "inactive" | "blocked";
  importedBy?: string; // 导入者用户名
  importedByUserId?: string; // 导入者用户ID
  importedByNickname?: string; // 导入者昵称
  importedAt?: string; // 导入时间
  createdAt?: string;
  updatedAt?: string;
}

// 批量导入账号接口
export interface ImportAccountInfo {
  account: string;
  password: string;
  apiUrl?: string;
}

export interface BatchImportAccountsRequest {
  country: string;
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
  importedBy?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

// 获取账号列表
export const getAccountsApi = (params: AccountQueryParams) => {
  return http.get<AccountQueryParams, ApiResponse<PageResponse<Account>>>(
    "/trade/accounts",
    { params }
  );
};

// 获取单个账号详情
export const getAccountApi = (id: string) => {
  return http.get<any, ApiResponse<Account>>(`/trade/accounts/${id}`);
};

// 批量导入账号
export const batchImportAccountsApi = (data: BatchImportAccountsRequest) => {
  return http.post<
    BatchImportAccountsRequest,
    ApiResponse<BatchImportResponse>
  >("/trade/accounts/batch-import", { data });
};

// 更新账号状态
export const updateAccountStatusApi = (id: string, status: string) => {
  return http.request<ApiResponse<Account>>(
    "put",
    `/trade/accounts/${id}/status`,
    { data: { status } }
  );
};

// 删除账号
export const deleteAccountApi = (id: string) => {
  return http.request<ApiResponse<null>>("delete", `/trade/accounts/${id}`);
};

// 批量删除账号
export const batchDeleteAccountsApi = (ids: string[]) => {
  return http.request<ApiResponse<null>>("delete", "/trade/accounts/batch", {
    data: { ids }
  });
};

// 获取国家列表
export const getCountriesForAccountApi = () => {
  return http.request<any>("get", "/system/countries/list", {
    params: { pageSize: 100, status: "1" }
  });
};
