<template>
  <el-dialog
    v-model="visible"
    title="账号详情"
    width="95%"
    :style="{ maxWidth: '1400px' }"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-container">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="账号">
              {{ accountDetail?.account || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="国家">
              {{ accountDetail?.country || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(accountDetail?.status)">
                {{ getStatusText(accountDetail?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="登录状态">
              <el-tag :type="getLoginStatusTagType(accountDetail?.loginStatus)">
                {{ getLoginStatusText(accountDetail?.loginStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前计划天数">
              {{
                accountDetail?.currentPlanDay
                  ? `第${accountDetail.currentPlanDay}天`
                  : "-"
              }}
            </el-descriptions-item>
            <el-descriptions-item v-if="hasCreateByPermission" label="创建人">
              {{ accountDetail?.createdByName || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="导入时间">
              {{ formatDateTime(accountDetail?.importedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDateTime(accountDetail?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDateTime(accountDetail?.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 绑定计划 -->
        <el-tab-pane label="绑定计划" name="plan">
          <div v-if="accountDetail?.plan" class="plan-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="计划名称">
                {{ accountDetail.plan.name }}
              </el-descriptions-item>
              <el-descriptions-item label="计划天数">
                {{ accountDetail.plan.planDays }}天
              </el-descriptions-item>
              <el-descriptions-item label="总金额">
                {{ accountDetail.plan.totalAmount }}
              </el-descriptions-item>
              <el-descriptions-item label="浮动金额">
                {{ accountDetail.plan.floatAmount || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="计划状态">
                <el-tag
                  :type="
                    accountDetail.plan.status === 'enabled'
                      ? 'success'
                      : 'danger'
                  "
                >
                  {{
                    accountDetail.plan.status === "enabled" ? "启用" : "禁用"
                  }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="绑定群聊">
                <el-tag
                  :type="
                    accountDetail.plan.enableRoomBinding ? 'success' : 'info'
                  "
                >
                  {{
                    accountDetail.plan.enableRoomBinding ? "已开启" : "未开启"
                  }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <!-- 汇率详细信息 -->
            <div v-if="rateDetail" class="rate-detail-section">
              <h4>绑定汇率详情</h4>
              <el-descriptions :column="2" border class="detail-descriptions">
                <el-descriptions-item label="汇率名称" :span="2">
                  <el-text truncated>{{
                    accountDetail.plan.rateName || rateDetail.name
                  }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="汇率值">
                  <el-text type="warning" class="font-medium rate-text">{{
                    rateDetail.rate
                  }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="国家/地区">
                  {{ accountDetail.plan.countryName || rateDetail.countryName }}
                </el-descriptions-item>
                <el-descriptions-item label="卡类型">
                  <el-tag
                    size="small"
                    :type="rateDetail.cardType === 'fast' ? 'success' : 'info'"
                  >
                    {{ rateDetail.cardType === "fast" ? "快卡" : "慢卡" }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="卡形式">
                  <el-tag size="small">
                    {{ rateDetail.cardForm === "image" ? "卡图" : "卡号" }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="金额约束">
                  <el-tag size="small" type="warning">
                    {{ getAmountConstraintText(rateDetail.amountConstraint) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="rateDetail.amountConstraint === 'multiple'"
                  label="倍数基数"
                >
                  <el-text class="font-medium">{{
                    rateDetail.multipleBase
                  }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="rateDetail.amountConstraint === 'multiple'"
                  label="金额范围"
                >
                  <el-text
                    >{{ rateDetail.minAmount }} -
                    {{ rateDetail.maxAmount }}</el-text
                  >
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="
                    rateDetail.amountConstraint === 'fixed' &&
                    rateDetail.fixedAmounts
                  "
                  label="固定面额"
                  :span="2"
                >
                  <div class="fixed-amounts-detailed">
                    <el-tag
                      v-for="amount in rateDetail.fixedAmounts"
                      :key="amount"
                      size="small"
                      type="primary"
                      class="mr-1 mb-1"
                    >
                      {{ amount }}
                    </el-tag>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item
                  label="汇率状态"
                  :span="rateDetail.amountConstraint === 'fixed' ? 2 : 1"
                >
                  <el-tag
                    :type="
                      rateDetail.status === 'active' ? 'success' : 'danger'
                    "
                  >
                    {{ rateDetail.status === "active" ? "激活" : "禁用" }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="rateDetail.description"
                  label="汇率描述"
                  :span="2"
                >
                  <el-text>{{ rateDetail.description }}</el-text>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 每日计划金额 -->
            <div class="daily-plan-section">
              <h4>每日计划金额</h4>
              <div class="daily-amounts-grid">
                <div
                  v-for="(amount, index) in accountDetail.plan.daily_amounts ||
                  accountDetail.plan.dailyAmounts"
                  :key="index"
                  class="daily-amount-card"
                  :class="{
                    'current-day': index + 1 === accountDetail.currentPlanDay
                  }"
                >
                  <div class="day-number">第{{ index + 1 }}天</div>
                  <div class="amount">{{ amount }}</div>
                  <div
                    v-if="index + 1 === accountDetail.currentPlanDay"
                    class="current-indicator"
                  >
                    当前
                  </div>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无绑定计划" />
        </el-tab-pane>

        <!-- 完成情况 -->
        <el-tab-pane label="完成情况" name="completion">
          <div
            v-if="accountDetail?.completedDays?.length"
            class="completion-info"
          >
            <!-- 当天汇总 -->
            <div class="today-summary">
              <el-card shadow="hover">
                <template #header>
                  <span>当天汇总</span>
                </template>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="summary-item">
                      <div class="summary-label">今日总兑换金额</div>
                      <div class="summary-value">{{ todayTotalAmount }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="summary-item">
                      <div class="summary-label">今日成功次数</div>
                      <div class="summary-value">{{ todaySuccessCount }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="summary-item">
                      <div class="summary-label">今日完成率</div>
                      <div class="summary-value">{{ todaySuccessRate }}%</div>
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </div>
            <el-table :data="accountDetail.completedDays" border stripe>
              <el-table-column
                prop="day"
                label="天数"
                width="80"
                align="center"
              >
                <template #default="{ row }"> 第{{ row.day }}天 </template>
              </el-table-column>
              <el-table-column
                prop="amount"
                label="完成金额"
                width="120"
                align="center"
              >
                <template #default="{ row }"> {{ row.amount }} </template>
              </el-table-column>
              <el-table-column
                prop="status"
                label="状态"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="getCompletionStatusTagType(row.status)">
                    {{ getCompletionStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="time" label="完成时间" align="center">
                <template #default="{ row }">
                  {{ formatDateTime(row.time) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无完成记录" />
        </el-tab-pane>

        <!-- 兑换日志 -->
        <el-tab-pane label="兑换日志" name="logs">
          <div v-if="accountDetail?.exchangeLogs?.length" class="exchange-logs">
            <el-table :data="accountDetail.exchangeLogs" border stripe>
              <el-table-column prop="id" label="ID" width="80" align="center" />
              <el-table-column
                prop="day"
                label="执行天数"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag type="info" size="small">第{{ row.day }}天</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="amount"
                label="执行金额"
                width="120"
                align="center"
              >
                <template #default="{ row }">
                  <el-text type="success" class="font-medium">{{
                    row.amount
                  }}</el-text>
                </template>
              </el-table-column>
              <el-table-column
                prop="after_amount"
                label="账户余额"
                width="120"
                align="center"
              >
                <template #default="{ row }">
                  <el-text type="primary" class="font-medium">{{
                    row.after_amount || 0
                  }}</el-text>
                </template>
              </el-table-column>
              <el-table-column
                prop="code"
                label="兑换码"
                width="150"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-text class="font-mono exchange-code-text">{{
                    row.code || "-"
                  }}</el-text>
                </template>
              </el-table-column>
              <el-table-column
                prop="status"
                label="执行状态"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag :type="getExchangeStatusTagType(row.status)">
                    {{ getExchangeStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="room_name"
                label="群聊名称"
                width="150"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.room_name || "-" }}
                </template>
              </el-table-column>
              <el-table-column
                prop="exchange_time"
                label="执行时间"
                width="160"
                align="center"
              >
                <template #default="{ row }">
                  <el-text class="time-text">{{
                    formatDateTime(row.exchange_time || row.exchangeTime)
                  }}</el-text>
                </template>
              </el-table-column>
              <el-table-column
                prop="error_message"
                label="错误信息"
                align="left"
                show-overflow-tooltip
                min-width="200"
              >
                <template #default="{ row }">
                  <el-text
                    v-if="row.error_message || row.errorMessage"
                    type="danger"
                  >
                    {{ row.error_message || row.errorMessage }}
                  </el-text>
                  <span v-else class="text-gray-400">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无兑换日志" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { accountApi, type AccountDetail } from "@/api/trade/account";
import { rateApi, type RateItem } from "@/api/trade/rate";
import { hasAuth } from "@/router/utils";

interface Props {
  modelValue: boolean;
  accountId?: string;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const activeTab = ref("basic");
const accountDetail = ref<AccountDetail | null>(null);
const rateDetail = ref<RateItem | null>(null);

// 权限检查
const hasCreateByPermission = hasAuth("Itunes:Trade:CreateBy");

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 今日总兑换金额
const todayTotalAmount = computed(() => {
  if (!accountDetail.value?.completedDays?.length) return 0;

  const today = new Date().toDateString();
  const todayCompletions = accountDetail.value.completedDays.filter(item => {
    if (!item.time) return false;
    return new Date(item.time).toDateString() === today;
  });

  return todayCompletions.reduce((sum, item) => sum + (item.amount || 0), 0);
});

// 今日成功次数
const todaySuccessCount = computed(() => {
  if (!accountDetail.value?.completedDays?.length) return 0;

  const today = new Date().toDateString();
  return accountDetail.value.completedDays.filter(item => {
    if (!item.time) return false;
    return (
      new Date(item.time).toDateString() === today && item.status === "complete"
    );
  }).length;
});

// 今日完成率
const todaySuccessRate = computed(() => {
  if (!accountDetail.value?.completedDays?.length) return 0;

  const today = new Date().toDateString();
  const todayItems = accountDetail.value.completedDays.filter(item => {
    if (!item.time) return false;
    return new Date(item.time).toDateString() === today;
  });

  if (todayItems.length === 0) return 0;

  const successCount = todayItems.filter(
    item => item.status === "complete"
  ).length;
  return Math.round((successCount / todayItems.length) * 100);
});

// 获取账号详情
const getAccountDetail = async () => {
  if (!props.accountId) return;

  try {
    loading.value = true;
    const response = await accountApi.getDetail(props.accountId);
    if (response && response.code === 0) {
      accountDetail.value = response.data;
      // 如果账号绑定了计划，并且计划有汇率ID，则获取汇率详情
      if (accountDetail.value?.plan?.rateId) {
        await getRateDetail(accountDetail.value.plan.rateId);
      }
    }
  } catch (error) {
    console.error("获取账号详情失败:", error);
  } finally {
    loading.value = false;
  }
};

// 获取汇率详情
const getRateDetail = async (rateId: string) => {
  try {
    const response = await rateApi.getDetail(rateId);
    if (response.data) {
      rateDetail.value = response.data;
    }
  } catch (error) {
    console.error("获取汇率详情失败:", error);
    rateDetail.value = null;
  }
};

// 格式化日期时间
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 获取状态文本
const getStatusText = (status?: string) => {
  switch (status) {
    case "completed":
      return "已完成";
    case "processing":
      return "进行中";
    case "waiting":
      return "等待中";
    case "locking":
      return "锁定";
    default:
      return "未知";
  }
};

// 获取状态标签类型
const getStatusTagType = (status?: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "processing":
      return "primary";
    case "waiting":
      return "info";
    case "locking":
      return "danger";
    default:
      return "info";
  }
};

// 获取登录状态文本
const getLoginStatusText = (status?: string) => {
  switch (status) {
    case "valid":
      return "有效";
    case "invalid":
      return "失效";
    default:
      return "未知";
  }
};

// 获取登录状态标签类型
const getLoginStatusTagType = (status?: string) => {
  switch (status) {
    case "valid":
      return "success";
    case "invalid":
      return "danger";
    default:
      return "info";
  }
};

// 获取完成状态文本
const getCompletionStatusText = (status: string) => {
  switch (status) {
    case "complete":
      return "已完成";
    case "processing":
      return "进行中";
    case "waiting":
      return "等待中";
    default:
      return "未知";
  }
};

// 获取完成状态标签类型
const getCompletionStatusTagType = (status: string) => {
  switch (status) {
    case "complete":
      return "success";
    case "processing":
      return "primary";
    case "waiting":
      return "info";
    default:
      return "info";
  }
};

// 获取兑换状态文本
const getExchangeStatusText = (status: string) => {
  switch (status) {
    case "success":
      return "成功";
    case "failed":
      return "失败";
    case "pending":
      return "处理中";
    default:
      return "未知";
  }
};

// 获取兑换状态标签类型
const getExchangeStatusTagType = (status: string) => {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "info";
  }
};

// 获取面额限制文本
const getAmountConstraintText = (constraint: string) => {
  switch (constraint) {
    case "fixed":
      return "固定面额";
    case "multiple":
      return "倍数要求";
    case "all":
      return "全面额";
    default:
      return constraint;
  }
};

// 获取面额限制标签类型
const getAmountConstraintTagType = (constraint: string) => {
  switch (constraint) {
    case "fixed":
      return "primary";
    case "multiple":
      return "success";
    case "all":
      return "info";
    default:
      return "info";
  }
};

// 关闭对话框
const handleClose = () => {
  activeTab.value = "basic";
  accountDetail.value = null;
  emit("update:modelValue", false);
};

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  visible => {
    if (visible && props.accountId) {
      getAccountDetail();
    } else if (!visible) {
      handleClose();
    }
  }
);
</script>

<style scoped>
.detail-container {
  min-height: 400px;

  @media (max-width: 768px) {
    min-height: 300px;
  }
}

.plan-info {
  margin-bottom: 20px;

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
}

.daily-plan-section {
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }
}

.daily-plan-section h4 {
  margin-bottom: 16px;
  color: #303133;
  font-weight: 500;

  @media (max-width: 768px) {
    margin-bottom: 12px;
    font-size: 16px;
  }
}

.daily-amounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.daily-amount-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  background-color: #fafafa;

  @media (max-width: 768px) {
    padding: 8px;
  }
}

.day-number {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.amount {
  font-size: 16px;
  font-weight: 500;
  color: #409eff;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.completion-info,
.exchange-logs {
  margin-top: 16px;

  @media (max-width: 768px) {
    margin-top: 12px;
  }
}

.today-summary {
  margin-bottom: 20px;

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 6px;
  }
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;

  @media (max-width: 768px) {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-tab-pane) {
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
}

/* 响应式弹层优化 */
:deep(.el-dialog) {
  @media (max-width: 768px) {
    margin: 5vh auto;
    width: 95% !important;
    max-width: none !important;
  }

  @media (max-width: 480px) {
    margin: 2vh auto;
    width: 98% !important;
  }
}

/* 描述列表响应式 */
:deep(.el-descriptions) {
  @media (max-width: 768px) {
    .el-descriptions__body .el-descriptions__table {
      display: block;

      .el-descriptions__row {
        display: block;
        border: none;

        .el-descriptions__cell {
          display: block;
          width: 100% !important;
          padding: 8px 0;
          border-bottom: 1px solid #ebeef5;

          &.is-bordered-label {
            background-color: #fafafa;
            font-weight: 500;
          }
        }
      }
    }
  }
}

/* 表格响应式 */
:deep(.el-table) {
  @media (max-width: 768px) {
    font-size: 12px;

    .el-table__cell {
      padding: 8px 4px;
    }

    .el-table__header-wrapper {
      .el-table__header {
        font-size: 12px;
      }
    }
  }
}

/* 汇总卡片响应式 */
:deep(.el-row) {
  @media (max-width: 768px) {
    .el-col {
      margin-bottom: 12px;
    }
  }
}

/* 汇率详细信息样式 */
.rate-detail-section {
  margin-bottom: 20px;

  h4 {
    color: #303133;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e4e7ed;
  }

  @media (max-width: 768px) {
    margin-bottom: 16px;

    h4 {
      font-size: 14px;
      margin-bottom: 12px;
    }
  }
}

.rate-value {
  color: #67c23a;
  font-weight: bold;
  font-size: 16px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.fixed-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }
}

.amount-tag {
  margin: 0;

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 0 6px;
    height: 24px;
    line-height: 24px;
  }
}

/* 增强样式 */
.detail-descriptions {
  --el-descriptions-item-bordered-label-background: #fafafa;
}

.rate-text {
  font-size: 16px;
  font-weight: 600;
}

.fixed-amounts-detailed {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mr-1 {
  margin-right: 4px;
}

.mb-1 {
  margin-bottom: 4px;
}

.exchange-code-text {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 12px;
  color: #409eff;
  background-color: #f0f8ff;
  padding: 2px 4px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.time-text {
  font-size: 12px;
  color: #606266;
}

.text-gray-400 {
  color: #9ca3af;
}

/* 当前天数高亮 */
.daily-amount-card.current-day {
  background: linear-gradient(135deg, #e6f7ff 0%, #d1f2eb 100%);
  border: 2px solid #67c23a;
  position: relative;

  .amount {
    color: #67c23a;
    font-weight: 600;
  }
}

.current-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #67c23a;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}
</style>
