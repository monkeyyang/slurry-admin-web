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

// 验证码账号接口
export interface VerifyAccount {
  id?: string;
  uid?: number;
  account: string;
  password: string;
  verify_url?: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  // 关联用户信息
  user?: {
    nickname: string;
  };
}

// 查码记录接口
export interface VerifyLog {
  id?: string;
  uid: number;
  account_id: string;
  account: string;
  type: "copy" | "check_code";
  commands?: string;
  room_id?: string;
  wxid?: string;
  verify_code?: string;
  msg?: string;
  created_at?: string;
  updated_at?: string;
  // 关联用户信息
  user?: {
    nickname: string;
  };
  // 关联账号信息
  verify_account?: VerifyAccount;
}

// 批量导入账号接口
export interface ImportVerifyAccountInfo {
  account: string;
  password: string;
  verify_url?: string;
}

export interface BatchImportVerifyAccountsRequest {
  accounts: ImportVerifyAccountInfo[];
}

// 批量导入响应
export interface BatchImportVerifyResponse {
  successCount: number;
  failCount?: number;
  duplicateAccounts?: string[];
  accounts: VerifyAccount[];
  restoredCount?: number;
  createdCount?: number;
  updatedCount?: number;
}

// 验证码账号查询参数
export interface VerifyAccountQueryParams {
  account?: string;
  uid?: number;
  pageNum?: number;
  pageSize?: number;
}

// 查码记录查询参数
export interface VerifyLogQueryParams {
  account?: string;
  account_id?: string;
  type?: "copy" | "check_code";
  uid?: number;
  room_id?: string;
  wxid?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

// 查码记录统计
export interface VerifyLogStatistics {
  totalCount: number;
  copyCount: number;
  checkCodeCount: number;
  todayCount: number;
}

// 操作记录埋点接口
export interface OperationLog {
  id?: string;
  uid?: number;
  operation_type: string; // 操作类型: search, delete, copy, getVerifyCode, edit, create, import, export, password_verify, page_view
  target_account?: string; // 目标账号
  result: "success" | "failed" | "password_error"; // 操作结果
  details?: string; // 详细信息
  user_agent?: string; // 用户代理
  ip_address?: string; // IP地址
  created_at: string; // 创建时间
  user?: {
    nickname: string;
  };
}

// 操作记录查询参数
export interface OperationLogQueryParams {
  operation_type?: string;
  target_account?: string;
  result?: "success" | "failed" | "password_error";
  uid?: number;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

// 操作记录创建参数
export interface CreateOperationLogRequest {
  operation_type: string;
  target_account?: string;
  result: "success" | "failed" | "password_error";
  details?: string;
  user_agent?: string;
  ip_address?: string;
}

// 验证码账号API
export const verifyAccountApi = {
  // 获取验证码账号列表
  getList: (params?: VerifyAccountQueryParams) => {
    return http.request<ApiResponse<PageResponse<VerifyAccount>>>(
      "get",
      "/verify/accounts",
      { params }
    );
  },

  // 获取验证码账号详情
  getDetail: (id: string) => {
    return http.request<ApiResponse<VerifyAccount>>(
      "get",
      `/verify/accounts/${id}`
    );
  },

  // 创建验证码账号
  create: (data: Partial<VerifyAccount>) => {
    return http.request<ApiResponse<VerifyAccount>>(
      "post",
      "/verify/accounts",
      { data }
    );
  },

  // 更新验证码账号
  update: (id: string, data: Partial<VerifyAccount>) => {
    return http.request<ApiResponse<VerifyAccount>>(
      "put",
      `/verify/accounts/${id}`,
      { data }
    );
  },

  // 删除验证码账号
  delete: (id: string) => {
    return http.request<ApiResponse<null>>("delete", `/verify/accounts/${id}`);
  },

  // 批量删除验证码账号
  batchDelete: (ids: string[]) => {
    return http.request<ApiResponse<null>>("delete", "/verify/accounts/batch", {
      data: { ids }
    });
  },

  // 批量导入验证码账号
  batchImport: (data: BatchImportVerifyAccountsRequest) => {
    return http.request<ApiResponse<BatchImportVerifyResponse>>(
      "post",
      "/verify/accounts/batch-import",
      { data }
    );
  },

  // 复制账号密码
  copyAccount: (id: string) => {
    return http.request<ApiResponse<{ account: string; password: string }>>(
      "post",
      `/verify/accounts/${id}/copy`
    );
  },

  // 获取验证码
  getVerifyCode: (id: string, commands?: string) => {
    return http.request<ApiResponse<{ verify_code: string }>>(
      "post",
      `/verify/accounts/${id}/verify-code`,
      { data: { commands } }
    );
  }
};

// 查码记录API
export const verifyLogApi = {
  // 获取查码记录列表
  getList: (params?: VerifyLogQueryParams) => {
    return http.request<ApiResponse<PageResponse<VerifyLog>>>(
      "get",
      "/verify/logs",
      { params }
    );
  },

  // 获取查码记录详情
  getDetail: (id: string) => {
    return http.request<ApiResponse<VerifyLog>>("get", `/verify/logs/${id}`);
  },

  // 获取查码记录统计
  getStatistics: (params?: { startTime?: string; endTime?: string }) => {
    return http.request<ApiResponse<VerifyLogStatistics>>(
      "get",
      "/verify/logs/statistics",
      { params }
    );
  },

  // 删除查码记录
  delete: (id: string) => {
    return http.request<ApiResponse<null>>("delete", `/verify/logs/${id}`);
  },

  // 批量删除查码记录
  batchDelete: (ids: string[]) => {
    return http.request<ApiResponse<null>>("delete", "/verify/logs/batch", {
      data: { ids }
    });
  }
};

// 操作记录API
export const operationLogApi = {
  // 创建操作记录
  create: (data: CreateOperationLogRequest) => {
    return http.request<ApiResponse<OperationLog>>(
      "post",
      "/verify/operation-logs",
      { data }
    );
  },

  // 获取操作记录列表
  getList: (params?: OperationLogQueryParams) => {
    return http.request<ApiResponse<PageResponse<OperationLog>>>(
      "get",
      "/verify/operation-logs",
      { params }
    );
  },

  // 获取操作记录详情
  getDetail: (id: string) => {
    return http.request<ApiResponse<OperationLog>>(
      "get",
      `/verify/operation-logs/${id}`
    );
  },

  // 删除操作记录
  delete: (id: string) => {
    return http.request<ApiResponse<null>>(
      "delete",
      `/verify/operation-logs/${id}`
    );
  },

  // 批量删除操作记录
  batchDelete: (ids: string[]) => {
    return http.request<ApiResponse<null>>(
      "delete",
      "/verify/operation-logs/batch",
      { data: { ids } }
    );
  },

  // 获取操作统计
  getStatistics: (params?: { startTime?: string; endTime?: string }) => {
    return http.request<
      ApiResponse<{
        totalOperations: number;
        successOperations: number;
        failedOperations: number;
        operationsByType: Record<string, number>;
      }>
    >("get", "/verify/operation-logs/statistics", { params });
  }
};
