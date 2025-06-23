import {
  type LogEntry,
  type MonitorStats,
  type RealtimeStatus,
  LogLevel,
  LogStatus
} from "@/api/trade/monitor";

// 模拟账号列表
const mockAccounts = [
  "test001@example.com",
  "test002@example.com",
  "test003@example.com",
  "user001@gmail.com",
  "user002@gmail.com"
];

// 模拟日志消息模板
const logMessageTemplates = {
  [LogLevel.INFO]: [
    "开始兑换礼品卡 - 账号: {account}, 计划ID: {planId}, 第{day}天",
    "礼品卡兑换成功 - 账号: {account}, 金额: ${amount}",
    "批量兑换任务已启动 - 队列中有{count}个任务",
    "批量兑换任务完成 - 成功: {success}, 失败: {failed}",
    "账号登录验证成功 - 账号: {account}",
    "获取礼品卡列表成功 - 账号: {account}, 数量: {count}"
  ],
  [LogLevel.WARNING]: [
    "账号登录状态异常 - 账号: {account}, 需要重新验证",
    "礼品卡余额不足 - 账号: {account}, 当前余额: ${amount}",
    "网络连接不稳定 - 重试中...",
    "API请求频率过高 - 等待{seconds}秒后重试",
    "账号{account}今日兑换次数接近限制"
  ],
  [LogLevel.ERROR]: [
    "礼品卡兑换失败 - 账号: {account}, 错误: {error}",
    "账号登录失败 - 账号: {account}, 密码错误或账号被锁定",
    "API请求失败 - 状态码: {code}, 错误信息: {error}",
    "数据库连接失败 - 无法保存兑换记录",
    "系统异常 - {error}"
  ],
  [LogLevel.DEBUG]: [
    "发送API请求 - URL: {url}, 参数: {params}",
    "接收API响应 - 状态码: {code}, 响应时间: {time}ms",
    "解析礼品卡数据 - 账号: {account}, 数据量: {size}KB",
    "更新账号状态 - 账号: {account}, 状态: {status}",
    "缓存数据更新 - 键: {key}, 过期时间: {expire}"
  ]
};

// 生成随机ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 随机选择数组元素
const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// 随机整数
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 随机金额
const randomAmount = (): number => {
  return Math.round(Math.random() * 100 * 100) / 100; // 0-100之间的金额，保留2位小数
};

// 替换模板变量
const replaceTemplate = (
  template: string,
  vars: Record<string, any>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key].toString() : match;
  });
};

// 生成模拟日志条目
export const generateMockLogEntry = (
  level?: LogLevel,
  status?: LogStatus
): LogEntry => {
  const logLevel = level || randomChoice(Object.values(LogLevel));
  const logStatus = status || randomChoice(Object.values(LogStatus));
  const account = randomChoice(mockAccounts);
  const planId = `plan_${randomInt(1, 10)}`;
  const day = randomInt(1, 30);
  const amount = randomAmount();

  const templates = logMessageTemplates[logLevel];
  const template = randomChoice(templates);

  const vars = {
    account,
    planId,
    day,
    amount,
    count: randomInt(1, 20),
    success: randomInt(1, 15),
    failed: randomInt(0, 5),
    seconds: randomInt(1, 60),
    error: "网络超时",
    code: randomChoice([200, 400, 401, 403, 404, 500]),
    url: "/api/trade/exchange",
    params: '{"account":"' + account + '"}',
    time: randomInt(100, 2000),
    size: randomInt(1, 100),
    status: randomChoice(["active", "inactive", "processing"]),
    key: "cache_" + randomInt(1000, 9999),
    expire: randomInt(300, 3600)
  };

  const message = replaceTemplate(template, vars);

  const log: LogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: logLevel,
    message,
    status: logStatus
  };

  // 添加可选字段
  if (Math.random() > 0.7) {
    log.accountId = `acc_${randomInt(1000, 9999)}`;
  }

  if (Math.random() > 0.8) {
    log.planId = planId;
  }

  if (Math.random() > 0.6) {
    log.amount = amount;
  }

  if (logLevel === LogLevel.ERROR && Math.random() > 0.5) {
    log.errorMessage = randomChoice([
      "网络连接超时",
      "服务器内部错误",
      "认证失败",
      "参数验证失败",
      "数据库操作失败",
      "第三方API调用失败"
    ]);
  }

  if (Math.random() > 0.9) {
    log.metadata = {
      requestId: generateId(),
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ip: `192.168.1.${randomInt(1, 254)}`,
      duration: randomInt(100, 5000),
      memoryUsage: `${randomInt(50, 200)}MB`
    };
  }

  return log;
};

// 生成模拟统计数据
export const generateMockStats = (): MonitorStats => {
  const totalExchanges = randomInt(100, 1000);
  const successCount = randomInt(
    Math.floor(totalExchanges * 0.7),
    Math.floor(totalExchanges * 0.95)
  );
  const failedCount = randomInt(
    Math.floor(totalExchanges * 0.02),
    Math.floor(totalExchanges * 0.15)
  );
  const processingCount = totalExchanges - successCount - failedCount;
  const successRate = Math.round((successCount / totalExchanges) * 100);

  return {
    totalExchanges,
    successCount,
    failedCount,
    processingCount,
    successRate,
    todayExchanges: randomInt(10, 100),
    todaySuccessCount: randomInt(8, 80),
    todayFailedCount: randomInt(0, 10)
  };
};

// 生成模拟实时状态
export const generateMockRealtimeStatus = (): RealtimeStatus => {
  const isRunning = Math.random() > 0.3; // 70% 概率运行中

  const status: RealtimeStatus = {
    isRunning,
    queueCount: randomInt(0, 50),
    lastUpdateTime: new Date().toISOString()
  };

  if (isRunning && Math.random() > 0.4) {
    status.currentTask = {
      accountId: `acc_${randomInt(1000, 9999)}`,
      account: randomChoice(mockAccounts),
      planId: `plan_${randomInt(1, 10)}`,
      currentDay: randomInt(1, 30),
      startTime: new Date(Date.now() - randomInt(1000, 300000)).toISOString()
    };
  }

  return status;
};

// 模拟WebSocket消息生成器
export class MockWebSocketGenerator {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private onMessage: (data: LogEntry) => void,
    private onStatusChange: (status: RealtimeStatus) => void,
    private interval = 2000 // 默认2秒发送一次消息
  ) {}

  start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // 立即发送一次状态更新
    this.onStatusChange(generateMockRealtimeStatus());

    this.intervalId = setInterval(() => {
      // 80% 概率发送日志，20% 概率发送状态更新
      if (Math.random() > 0.2) {
        this.onMessage(generateMockLogEntry());
      } else {
        this.onStatusChange(generateMockRealtimeStatus());
      }
    }, this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  // 手动发送特定类型的日志
  sendLog(level?: LogLevel, status?: LogStatus) {
    this.onMessage(generateMockLogEntry(level, status));
  }

  // 手动发送状态更新
  sendStatus() {
    this.onStatusChange(generateMockRealtimeStatus());
  }
}

// 生成批量模拟日志
export const generateMockLogs = (count: number): LogEntry[] => {
  const logs: LogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const log = generateMockLogEntry();
    // 让时间戳有一定的间隔
    log.timestamp = new Date(Date.now() - (count - i) * 1000).toISOString();
    logs.push(log);
  }

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
