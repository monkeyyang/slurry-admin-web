import { http } from "@/utils/http";
import type { ChargePlan, AccountGroup } from "./types";

// 保存充值计划
export const saveChargePlanApi = (plan: ChargePlan) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", "/trade/gift-exchange/plans", { data: plan });
};

// 批量导入账号并创建充值计划
export const batchCreatePlansApi = (data: {
  country: string;
  totalAmount: number;
  days: number;
  multipleBase: number;
  floatAmount: number;
  intervalHours: number;
  startTime: string;
  accounts: string[];
}) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      successCount: number;
      failCount: number;
      plans: ChargePlan[];
    };
  }>("post", "/trade/gift-exchange/plans/batch", { data });
};

// 获取充值计划列表
export const getChargePlansApi = (params?: any) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      list: ChargePlan[];
      total: number;
    };
  }>("get", "/trade/gift-exchange/plans", { params });
};

// 获取单个充值计划
export const getChargePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("get", `/trade/gift-exchange/plans/${id}`);
};

// 更新充值计划
export const updateChargePlanApi = (id: string, plan: ChargePlan) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("put", `/trade/gift-exchange/plans/${id}`, { data: plan });
};

// 删除充值计划
export const deleteChargePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: null;
  }>("delete", `/trade/gift-exchange/plans/${id}`);
};

// 更新计划状态
export const updatePlanStatusApi = (id: string, status: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("put", `/trade/gift-exchange/plans/${id}/status`, {
    data: { status }
  });
};

// 执行充值计划
export const executePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/execute`);
};

// 暂停充值计划
export const pausePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/pause`);
};

// 恢复充值计划
export const resumePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/resume`);
};

// 取消充值计划
export const cancelPlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/cancel`);
};

// 获取计划执行记录
export const getPlanExecutionLogsApi = (planId: string) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      list: any[];
      total: number;
    };
  }>("get", `/trade/gift-exchange/plans/${planId}/logs`);
};

// 导出计划为CSV
export const exportPlanApi = (id: string) => {
  return http.request<Blob>("get", `/trade/gift-exchange/plans/${id}/export`, {
    responseType: "blob" as "json"
  });
};

// 从模板创建计划
export const createPlanFromTemplateApi = (data: {
  templateId: string;
  accounts: string[];
  startTime: string;
}) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      successCount: number;
      failCount: number;
      plans: ChargePlan[];
    };
  }>("post", "/trade/gift-exchange/plans/from-template", { data });
};

// 保存计划为模板
export const savePlanAsTemplateApi = (planId: string, name: string) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      id: string;
      name: string;
    };
  }>("post", `/trade/gift-exchange/templates`, {
    data: { planId, name }
  });
};

// 获取计划模板列表
export const getPlanTemplatesApi = () => {
  return http.request<{
    code: number;
    message: string;
    data: {
      list: any[];
      total: number;
    };
  }>("get", "/trade/gift-exchange/templates");
};

// ========== 账号组管理接口 ==========

// 创建账号组
export const createAccountGroupApi = (group: AccountGroup) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("post", "/trade/gift-exchange/account-groups", { data: group });
};

// 获取账号组列表
export const getAccountGroupsApi = (params?: any) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      list: AccountGroup[];
      total: number;
    };
  }>("get", "/trade/gift-exchange/account-groups", { params });
};

// 获取单个账号组
export const getAccountGroupApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("get", `/trade/gift-exchange/account-groups/${id}`);
};

// 更新账号组
export const updateAccountGroupApi = (id: string, group: AccountGroup) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("put", `/trade/gift-exchange/account-groups/${id}`, { data: group });
};

// 删除账号组
export const deleteAccountGroupApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: null;
  }>("delete", `/trade/gift-exchange/account-groups/${id}`);
};

// 向账号组添加计划
export const addPlansToGroupApi = (groupId: string, planIds: string[]) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("post", `/trade/gift-exchange/account-groups/${groupId}/plans`, {
    data: { planIds }
  });
};

// 从账号组移除计划
export const removePlansFromGroupApi = (groupId: string, planIds: string[]) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("delete", `/trade/gift-exchange/account-groups/${groupId}/plans`, {
    data: { planIds }
  });
};

// 更新组内计划优先级
export const updatePlanPriorityApi = (
  groupId: string,
  planPriorities: { planId: string; priority: number }[]
) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("put", `/trade/gift-exchange/account-groups/${groupId}/priorities`, {
    data: { planPriorities }
  });
};

// 启动账号组自动执行
export const startAccountGroupApi = (groupId: string) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("post", `/trade/gift-exchange/account-groups/${groupId}/start`);
};

// 暂停账号组执行
export const pauseAccountGroupApi = (groupId: string) => {
  return http.request<{
    code: number;
    message: string;
    data: AccountGroup;
  }>("post", `/trade/gift-exchange/account-groups/${groupId}/pause`);
};

// 获取自动执行状态
export const getAutoExecutionStatusApi = () => {
  return http.request<{
    code: number;
    message: string;
    data: {
      isRunning: boolean;
      activeGroups: number;
      activePlans: number;
      lastExecutionTime: string;
      nextExecutionTime: string;
    };
  }>("get", "/trade/gift-exchange/auto-execution/status");
};

// 更新系统自动执行设置
export const updateAutoExecutionSettingsApi = (settings: {
  enabled: boolean;
  executionInterval: number;
  maxConcurrentPlans: number;
  logLevel: string;
}) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("put", "/trade/gift-exchange/auto-execution/settings", { data: settings });
};

// 启动充值计划
export const startChargePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/start`);
};

// 暂停充值计划
export const pauseChargePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/pause`);
};

// 恢复充值计划
export const resumeChargePlanApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: ChargePlan;
  }>("post", `/trade/gift-exchange/plans/${id}/resume`);
};

// 执行单个计划项
export const executeChargePlanItemApi = (itemId: string) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("post", `/trade/gift-exchange/plan-items/${itemId}/execute`);
};

// 批量操作计划
export const batchOperatePlansApi = (data: {
  action: string;
  planIds: string[];
}) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      successCount: number;
      failCount: number;
      results: any[];
    };
  }>("post", "/trade/gift-exchange/plans/batch-operate", { data });
};

// ========== 微信群组绑定状态管理接口 ==========

// 获取微信群组绑定状态
export const getWechatRoomBindingStatusApi = () => {
  return http.request<{
    code: number;
    message: string;
    data: {
      enabled: boolean;
      autoAssign: boolean;
      defaultRoomId?: string;
      maxPlansPerRoom?: number;
    };
  }>("get", "/trade/gift-exchange/wechat-room-binding/status");
};

// 更新微信群组绑定状态
export const updateWechatRoomBindingStatusApi = (data: {
  enabled: boolean;
  autoAssign?: boolean;
  defaultRoomId?: string;
  maxPlansPerRoom?: number;
}) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("put", "/trade/gift-exchange/wechat-room-binding/status", { data });
};

// 获取微信群组列表
export const getWechatRoomsApi = (params?: any) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      list: Array<{
        id: string;
        roomId: string;
        roomName: string;
        memberCount?: number;
        isActive?: boolean;
        planCount?: number; // 当前绑定的计划数量
      }>;
      total: number;
    };
  }>("get", "/trade/gift-exchange/wechat-rooms", { params });
};

// 绑定计划到微信群组
export const bindPlanToWechatRoomApi = (planId: string, roomId: string) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("post", `/trade/gift-exchange/plans/${planId}/bind-room`, {
    data: { roomId }
  });
};

// 解绑计划的微信群组
export const unbindPlanFromWechatRoomApi = (planId: string) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("post", `/trade/gift-exchange/plans/${planId}/unbind-room`);
};

// 批量绑定计划到微信群组
export const batchBindPlansToWechatRoomApi = (data: {
  roomId: string;
  planIds: string[];
}) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      successCount: number;
      failCount: number;
      results: any[];
    };
  }>("post", "/trade/gift-exchange/wechat-room-binding/batch-bind", { data });
};

// 批量解绑计划的微信群组
export const batchUnbindPlansFromWechatRoomApi = (planIds: string[]) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      successCount: number;
      failCount: number;
      results: any[];
    };
  }>("post", "/trade/gift-exchange/wechat-room-binding/batch-unbind", {
    data: { planIds }
  });
};

// 获取微信群组执行统计
export const getWechatRoomStatsApi = (roomId?: string) => {
  return http.request<{
    code: number;
    message: string;
    data: {
      totalRooms: number;
      activeRooms: number;
      totalPlans: number;
      activePlans: number;
      completedPlans: number;
      roomStats: Array<{
        roomId: string;
        roomName: string;
        planCount: number;
        completedCount: number;
        totalAmount: number;
        chargedAmount: number;
        progress: number;
      }>;
    };
  }>("get", "/trade/gift-exchange/wechat-room-binding/stats", {
    params: roomId ? { roomId } : undefined
  });
};
