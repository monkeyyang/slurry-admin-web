import { http } from "@/utils/http";

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 日志级别枚举
export enum LogLevel {
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG"
}

// 日志状态枚举
export enum LogStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PROCESSING = "processing",
  WAITING = "waiting"
}

// 日志条目接口
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  accountId?: string;
  planId?: string;
  amount?: number;
  status?: LogStatus;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// 日志查询参数
export interface LogQueryParams {
  level?: LogLevel;
  status?: LogStatus;
  accountId?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
}

// 分页响应接口
export interface PageResponse<T> {
  data: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 监控统计数据
export interface MonitorStats {
  totalExchanges: number;
  successCount: number;
  failedCount: number;
  processingCount: number;
  successRate: number;
  todayExchanges: number;
  todaySuccessCount: number;
  todayFailedCount: number;
}

// 实时状态数据
export interface RealtimeStatus {
  isRunning: boolean;
  currentTask?: {
    accountId: string;
    account: string;
    planId: string;
    currentDay: number;
    startTime: string;
  };
  queueCount: number;
  lastUpdateTime: string;
}

// 执行记录接口定义
export interface ExecutionLog {
  id: number;
  account_id: number;
  account: string | null;
  plan_id: number;
  rate_id: number;
  country_code: string;
  day: number;
  amount: number;
  after_amount: number; // 账户余额（执行后的余额）
  code: string;
  status: string;
  status_text: string;
  exchange_time: string;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  msgid: string | null;
  room_id: string | null;
  room_name: string | null;
  wxid: string | null;
  batch_id: string | null;
  account_info: {
    id: number;
    account: string;
  } | null;
  plan_info: {
    id: number;
    name: string;
    status: string;
    plan_days: number;
    total_amount: string;
    float_amount: string;
    exchange_interval: number;
    day_interval: number;
    daily_amounts: number[];
    completed_days: number[];
  } | null;
  rate_info: {
    id: number;
    name: string;
    rate: string;
    card_type: string;
    card_form: string;
    amount_constraint: string;
    fixed_amounts: string | null;
    multiple_base: number;
    min_amount: string;
    max_amount: string;
    status: string;
  } | null;
}

// 查询参数
export interface ExecutionLogQueryParams {
  page?: number;
  pageSize?: number;
  accountId?: string;
  planId?: string;
  executionStatus?: string;
  executionType?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
}

// 后端返回的列表响应结构
export interface ExecutionLogListResponse {
  data: ExecutionLog[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 统计信息接口
export interface ExecutionStatistics {
  totalCount: number; // 总执行次数
  successCount: number; // 成功次数
  failedCount: number; // 失败次数
  pendingCount: number; // 待处理次数
  totalAmount: number; // 总执行金额
  successAmount: number; // 成功金额
  averageAmount: number; // 平均金额
  successRate: number; // 成功率
}

// 今日统计信息
export interface TodayStatistics extends ExecutionStatistics {
  todayCount: number; // 今日执行次数
  yesterdayCount: number; // 昨日执行次数
  compareRate: number; // 环比增长率
}

// 账号维度统计
export interface AccountExecutionStats {
  accountId: string;
  account: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalAmount: number;
  successRate: number;
  lastExecutionTime?: string;
}

// 计划维度统计
export interface PlanExecutionStats {
  planId: string;
  planName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalAmount: number;
  successRate: number;
  lastExecutionTime?: string;
}

// 监控API
export const monitorApi = {
  // 获取日志列表
  getLogs: (params?: LogQueryParams) => {
    return http.request<ApiResponse<PageResponse<LogEntry>>>(
      "get",
      "/trade/monitor/logs",
      { params }
    );
  },

  // 获取监控统计数据
  getStats: () => {
    return http.request<ApiResponse<MonitorStats>>(
      "get",
      "/trade/monitor/stats"
    );
  },

  // 获取实时状态
  getRealtimeStatus: () => {
    return http.request<ApiResponse<RealtimeStatus>>(
      "get",
      "/trade/monitor/status"
    );
  },

  // 清空日志
  clearLogs: () => {
    return http.request<ApiResponse<null>>("delete", "/trade/monitor/logs");
  },

  // 导出日志
  exportLogs: (params?: LogQueryParams) => {
    return http.request<Blob>("get", "/trade/monitor/logs/export", {
      params,
      responseType: "blob"
    });
  }
};

// WebSocket连接类
export class MonitorWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isManualClose = false;

  constructor(
    private url: string,
    private onMessage: (data: LogEntry) => void,
    private onStatusChange: (status: RealtimeStatus) => void,
    private onError?: (error: Event) => void
  ) {}

  connect() {
    try {
      // 构建WebSocket URL，添加认证token
      const token = localStorage.getItem("token");
      const wsUrl = `${this.url}?token=${token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("监控WebSocket连接已建立");
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "log") {
            this.onMessage(data.data as LogEntry);
          } else if (data.type === "status") {
            this.onStatusChange(data.data as RealtimeStatus);
          }
        } catch (error) {
          console.error("解析WebSocket消息失败:", error);
        }
      };

      this.ws.onclose = event => {
        console.log("监控WebSocket连接已关闭", event.code, event.reason);

        if (
          !this.isManualClose &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          console.log(
            `尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );

          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = error => {
        console.error("监控WebSocket连接错误:", error);
        if (this.onError) {
          this.onError(error);
        }
      };
    } catch (error) {
      console.error("创建WebSocket连接失败:", error);
      if (this.onError) {
        this.onError(error as Event);
      }
    }
  }

  disconnect() {
    this.isManualClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// API 方法
export const executionLogApi = {
  // 获取执行记录列表
  getList: (params?: ExecutionLogQueryParams) => {
    return http.get<any, { data: ExecutionLogListResponse }>(
      "/trade/itunes/execution-logs",
      { params }
    );
  },

  // 获取执行记录详情
  getDetail: (id: string) => {
    return http.request<{ data: ExecutionLog }>(
      "get",
      `/trade/itunes/execution-logs/${id}`
    );
  },

  // 获取执行记录统计
  getStatistics: () => {
    return http.request<{ data: ExecutionStatistics }>(
      "get",
      "/trade/itunes/execution-logs-statistics"
    );
  },

  // 获取今日统计
  getTodayStatistics: () => {
    return http.request<{ data: TodayStatistics }>(
      "get",
      "/trade/itunes/execution-logs/today-statistics"
    );
  },

  // 根据账号ID获取执行记录
  getByAccount: (accountId: string, params?: ExecutionLogQueryParams) => {
    return http.request<{ data: ExecutionLogListResponse }>(
      "get",
      `/trade/itunes/execution-logs/by-account/${accountId}`,
      { params }
    );
  },

  // 根据计划ID获取执行记录
  getByPlan: (planId: string, params?: ExecutionLogQueryParams) => {
    return http.request<{ data: ExecutionLogListResponse }>(
      "get",
      `/trade/itunes/execution-logs/by-plan/${planId}`,
      { params }
    );
  }
};

// 汇率统计API
export const rateStatisticsApi = {
  // 获取汇率统计
  getStatistics: () => {
    return http.request<{ data: any }>("get", "/trade/itunes/rates-statistics");
  }
};

// 账号统计API
export const accountStatisticsApi = {
  // 获取账号统计
  getStatistics: () => {
    return http.request<{ data: any }>(
      "get",
      "/trade/itunes/accounts/statistics"
    );
  },

  // 获取可用账号
  getAvailableAccounts: () => {
    return http.request<{ data: any }>(
      "get",
      "/trade/itunes/accounts/available"
    );
  }
};
