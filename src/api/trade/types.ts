// iTunes卡交易类型定义

// 卡片面额约束类型
export type AmountConstraintType = "none" | "multiple" | "all";

// 卡片类型
export enum CardType {
  IMAGE = "image", // 卡图
  CODE = "code" // 卡密
}

// 基础汇率配置
export interface RateConfig {
  enabled: boolean;
  rate: number;
  minAmount: number;
  maxAmount: number;
  amountConstraint: AmountConstraintType;
  multipleBase: number;
  remarks: string[];
}

// 卡片类型配置
export interface CardTypeConfig {
  [CardType.IMAGE]: RateConfig; // 卡图配置
  [CardType.CODE]: RateConfig; // 卡密配置
}

// 国家交易配置
export interface CountryTradeConfig {
  id?: string;
  country: string;
  countryName: string;
  group: string; // 分组ID
  groupName: string; // 分组名称

  // 快卡设置
  fastCard: CardTypeConfig;

  // 慢卡设置
  slowCard: CardTypeConfig;

  // 次要汇率设置
  secondaryRateEnabled: boolean;
  secondaryRate: number;
  secondaryMinAmount: number;
  secondaryRemark: string;

  // 通用备注
  commonRemarks: string[];

  // 元数据
  createdAt?: string;
  updatedAt?: string;
}

// 基础交易表单数据接口 (单个国家的配置)
export interface TradeFormData extends CountryTradeConfig {
  // 继承国家交易配置
}

// 国家/地区选项
export interface CountryOption {
  value: string;
  label: string;
}

// 交易方式
export enum TradeType {
  FAST = "fast",
  SLOW = "slow"
}

// 预设模板
export interface TradeTemplate {
  id: string;
  name: string;
  data: CountryTradeConfig[];
  createdAt: string;
  updatedAt: string;
}

// 礼品卡充值计划相关类型定义

// 账号密码信息
export interface AccountCredentials {
  account: string;
  password: string;
  apiUrl?: string; // API链接
  raw?: string; // 原始输入字符串
}

// 充值计划项
export interface ChargePlanItem {
  id?: string;
  planId?: string;
  day: number;
  time: string;
  amount: number;
  minAmount: number;
  maxAmount: number;
  description: string;
  status?: "pending" | "processing" | "completed" | "failed";
  executedAt?: string;
  result?: string;
}

// 充值计划状态
export type ChargePlanStatus =
  | "draft"
  | "processing"
  | "paused"
  | "completed"
  | "cancelled";

// 充值计划
export interface ChargePlan {
  id?: string;
  account: string;
  password?: string;
  apiUrl?: string; // API链接
  country: string;
  totalAmount: string;
  days: number;
  multipleBase: string;
  floatAmount: string;
  intervalHours: number;
  startTime: string;
  items: ChargePlanItem[];
  status: string;
  currentDay?: number;
  progress: number;
  chargedAmount: string;
  dailyRemainingQuota?: string; // 当日剩余可兑换额度
  groupId?: string;
  priority: number;
  wechatRoom?: WechatRoom;
  createdAt: string;
  updatedAt: string;
}

// 批量充值计划
export interface ChargePlanBatch {
  id?: string;
  country: string;
  totalAmount: number;
  days: number;
  multipleBase: number;
  floatAmount: number;
  intervalHours: number;
  startTime: string;
  accounts: string[];
  plans?: ChargePlan[];
  createdAt?: string;
  updatedAt?: string;
}

// 计划执行日志
export interface ChargePlanLog {
  id?: string;
  planId: string;
  itemId?: string;
  day?: number;
  time: string;
  action: string;
  status: "success" | "failed";
  details: string;
  createdAt?: string;
}

// 计划模板
export interface ChargePlanTemplate {
  id?: string;
  name: string;
  country: string;
  totalAmount: number;
  days: number;
  multipleBase: number;
  floatAmount: number;
  intervalHours: number;
  items?: ChargePlanItem[];
  createdAt?: string;
  updatedAt?: string;
}

// 账号组
export interface AccountGroup {
  id?: string;
  name: string;
  description?: string;
  country: string;
  totalTargetAmount?: number; // 组目标总充值金额
  currentAmount?: number; // 当前已充值金额
  status: "active" | "paused" | "completed";
  accountCount?: number; // 账号数量
  autoSwitch: boolean; // 是否自动切换账号
  switchThreshold?: number; // 切换阈值（金额）
  plans?: ChargePlan[]; // 组内的计划
  createdAt?: string;
  updatedAt?: string;
}

// 微信群组
export interface WechatRoom {
  roomId: string;
  roomName: string;
  memberCount?: number;
}

// 微信群组绑定状态
export interface WechatRoomBindingStatus {
  enabled: boolean; // 是否启用微信群组绑定
  autoAssign: boolean; // 是否自动分配群组
  defaultRoomId?: string; // 默认群组ID
  maxPlansPerRoom?: number; // 每个群组最大计划数
}
