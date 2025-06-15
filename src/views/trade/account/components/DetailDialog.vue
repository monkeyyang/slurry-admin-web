<template>
  <el-dialog
    v-model="visible"
    title="账号详情"
    width="800px"
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
                {{ accountDetail.plan.totalAmount }}元
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
            </el-descriptions>

            <!-- 每日计划金额 -->
            <div class="daily-plan-section">
              <h4>每日计划金额</h4>
              <div class="daily-amounts-grid">
                <div
                  v-for="(amount, index) in accountDetail.plan.dailyAmounts"
                  :key="index"
                  class="daily-amount-card"
                >
                  <div class="day-number">第{{ index + 1 }}天</div>
                  <div class="amount">{{ amount }}元</div>
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
                <template #default="{ row }"> {{ row.amount }}元 </template>
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
                label="兑换金额"
                width="120"
                align="center"
              >
                <template #default="{ row }"> {{ row.amount }}元 </template>
              </el-table-column>
              <el-table-column
                prop="status"
                label="状态"
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
                prop="exchangeTime"
                label="兑换时间"
                width="180"
                align="center"
              >
                <template #default="{ row }">
                  {{ formatDateTime(row.exchangeTime) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="errorMessage"
                label="错误信息"
                align="left"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.errorMessage || "-" }}
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

// 权限检查
const hasCreateByPermission = hasAuth("Itunes:Trade:CreateBy");

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 获取账号详情
const getAccountDetail = async () => {
  if (!props.accountId) return;

  try {
    loading.value = true;
    const response = await accountApi.getDetail(props.accountId);
    if (response && response.code === 0) {
      accountDetail.value = response.data;
    }
  } catch (error) {
    console.error("获取账号详情失败:", error);
  } finally {
    loading.value = false;
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
}

.plan-info {
  margin-bottom: 20px;
}

.daily-plan-section {
  margin-top: 20px;
}

.daily-plan-section h4 {
  margin-bottom: 16px;
  color: #303133;
  font-weight: 500;
}

.daily-amounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.daily-amount-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  background-color: #fafafa;
}

.day-number {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.amount {
  font-size: 16px;
  font-weight: 500;
  color: #409eff;
}

.completion-info,
.exchange-logs {
  margin-top: 16px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-tab-pane) {
  padding: 20px;
}
</style>
