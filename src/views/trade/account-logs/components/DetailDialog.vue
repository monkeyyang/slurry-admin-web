<template>
  <el-dialog
    v-model="visible"
    title="执行记录详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="detailData" class="detail-content">
      <!-- 基础信息 -->
      <el-card class="mb-4" header="基础信息">
        <el-descriptions :column="3" border class="detail-descriptions">
          <el-descriptions-item label="记录ID" label-class-name="detail-label">
            {{ detailData.id }}
          </el-descriptions-item>
          <el-descriptions-item label="账号ID" label-class-name="detail-label">
            {{ detailData.account_id }}
          </el-descriptions-item>
          <el-descriptions-item label="汇率ID" label-class-name="detail-label">
            {{ detailData.rate_id }}
          </el-descriptions-item>
          <el-descriptions-item
            label="账号"
            label-class-name="detail-label"
            :span="2"
          >
            <el-text class="account-text" truncated>
              {{
                detailData.account_info?.account || detailData.account || "-"
              }}
            </el-text>
          </el-descriptions-item>
          <el-descriptions-item label="计划ID" label-class-name="detail-label">
            {{ detailData.plan_id }}
          </el-descriptions-item>
          <el-descriptions-item
            label="计划名称"
            label-class-name="detail-label"
            :span="3"
          >
            <el-text class="plan-name-text" truncated>
              {{ detailData.plan_info?.name || "-" }}
            </el-text>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 执行信息 -->
      <el-card class="mb-4" header="执行信息">
        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item
            label="国家代码"
            label-class-name="detail-label"
          >
            {{ detailData.country_code }}
          </el-descriptions-item>
          <el-descriptions-item
            label="执行天数"
            label-class-name="detail-label"
          >
            <el-tag type="info" size="small">第{{ detailData.day }}天</el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="执行金额"
            label-class-name="detail-label"
          >
            <el-text type="success" class="font-medium amount-text">
              {{ detailData.amount }}
            </el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="账户余额"
            label-class-name="detail-label"
          >
            <el-text type="primary" class="font-medium amount-text">
              {{ detailData.after_amount || 0 }}
            </el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="兑换码"
            label-class-name="detail-label"
            :span="2"
          >
            <el-text class="font-mono exchange-code">{{
              detailData.code
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="执行状态"
            label-class-name="detail-label"
            :span="2"
          >
            <el-tag :type="getStatusTagType(detailData.status)">
              {{ detailData.status_text || detailData.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 计划信息 -->
      <el-card v-if="detailData.plan_info" class="mb-4" header="计划详情">
        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item
            label="计划名称"
            label-class-name="detail-label"
            :span="2"
          >
            <el-text truncated class="plan-name-text">{{
              detailData.plan_info.name
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="计划天数"
            label-class-name="detail-label"
          >
            <el-tag type="primary" size="small"
              >{{ detailData.plan_info.plan_days }}天</el-tag
            >
          </el-descriptions-item>
          <el-descriptions-item
            label="计划总金额"
            label-class-name="detail-label"
          >
            <el-text type="success" class="font-medium amount-text">{{
              detailData.plan_info.total_amount
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="浮动金额"
            label-class-name="detail-label"
          >
            <el-text type="warning" class="font-medium amount-text">{{
              detailData.plan_info.float_amount
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="兑换间隔"
            label-class-name="detail-label"
          >
            <el-tag size="small"
              >{{ detailData.plan_info.exchange_interval }}分钟</el-tag
            >
          </el-descriptions-item>
          <el-descriptions-item
            label="天数间隔"
            label-class-name="detail-label"
          >
            <el-tag size="small"
              >{{ detailData.plan_info.day_interval }}小时</el-tag
            >
          </el-descriptions-item>
          <el-descriptions-item
            label="计划状态"
            label-class-name="detail-label"
          >
            <el-tag
              :type="
                detailData.plan_info.status === 'enabled' ? 'success' : 'danger'
              "
            >
              {{ detailData.plan_info.status === "enabled" ? "启用" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="每日金额"
            label-class-name="detail-label"
            :span="2"
          >
            <div class="daily-amounts">
              <el-tag
                v-for="(amount, index) in detailData.plan_info.daily_amounts"
                :key="index"
                size="small"
                :type="index + 1 === detailData.day ? 'success' : 'info'"
                class="mr-1 mb-1"
              >
                第{{ index + 1 }}天: {{ amount }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item
            label="已完成天数"
            label-class-name="detail-label"
            :span="2"
          >
            <div class="completed-days">
              <el-tag
                v-for="day in detailData.plan_info.completed_days"
                :key="day"
                size="small"
                type="success"
                class="mr-1 mb-1"
              >
                第{{ day }}天
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 汇率信息 -->
      <el-card v-if="detailData.rate_info" class="mb-4" header="汇率详情">
        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item
            label="汇率名称"
            label-class-name="detail-label"
            :span="2"
          >
            <el-text truncated>{{ detailData.rate_info.name }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="汇率值" label-class-name="detail-label">
            <el-text type="warning" class="font-medium rate-text">{{
              detailData.rate_info.rate
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="卡片类型"
            label-class-name="detail-label"
          >
            <el-tag
              size="small"
              :type="
                detailData.rate_info.card_type === 'fast' ? 'success' : 'info'
              "
            >
              {{ detailData.rate_info.card_type === "fast" ? "快卡" : "慢卡" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="卡片形式"
            label-class-name="detail-label"
          >
            <el-tag size="small">
              {{ detailData.rate_info.card_form === "image" ? "卡图" : "卡号" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            label="金额约束"
            label-class-name="detail-label"
          >
            <el-tag size="small" type="warning">
              {{
                getAmountConstraintText(detailData.rate_info.amount_constraint)
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detailData.rate_info.amount_constraint === 'multiple'"
            label="倍数基数"
            label-class-name="detail-label"
          >
            <el-text class="font-medium">{{
              detailData.rate_info.multiple_base
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detailData.rate_info.amount_constraint === 'multiple'"
            label="金额范围"
            label-class-name="detail-label"
          >
            <el-text
              >{{ detailData.rate_info.min_amount }} -
              {{ detailData.rate_info.max_amount }}</el-text
            >
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detailData.rate_info.amount_constraint === 'fixed'"
            label="固定面额"
            label-class-name="detail-label"
            :span="2"
          >
            <div class="fixed-amounts">
              <el-tag
                v-for="amount in getFixedAmounts(
                  detailData.rate_info.fixed_amounts
                )"
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
            label-class-name="detail-label"
            :span="detailData.rate_info.amount_constraint === 'fixed' ? 2 : 1"
          >
            <el-tag
              :type="
                detailData.rate_info.status === 'active' ? 'success' : 'danger'
              "
            >
              {{ detailData.rate_info.status === "active" ? "激活" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 时间信息 -->
      <el-card class="mb-4" header="时间信息">
        <el-descriptions :column="3" border class="detail-descriptions">
          <el-descriptions-item
            label="兑换时间"
            label-class-name="detail-label"
          >
            <el-text class="time-text">{{
              formatDateTime(detailData.exchange_time)
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="创建时间"
            label-class-name="detail-label"
          >
            <el-text class="time-text">{{
              formatDateTime(detailData.created_at)
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item
            label="更新时间"
            label-class-name="detail-label"
          >
            <el-text class="time-text">{{
              formatDateTime(detailData.updated_at)
            }}</el-text>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 错误信息 -->
      <el-card v-if="detailData.error_message" class="mb-4" header="错误信息">
        <div class="error-message">
          <el-text type="danger">{{ detailData.error_message }}</el-text>
        </div>
      </el-card>

      <!-- 其他信息 -->
      <el-card header="其他信息">
        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item
            label="群聊名称"
            label-class-name="detail-label"
            :span="2"
          >
            <el-text truncated>{{ detailData.room_name || "-" }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="消息ID" label-class-name="detail-label">
            <el-text class="font-mono" truncated>{{
              detailData.msgid || "-"
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="群聊ID" label-class-name="detail-label">
            <el-text class="font-mono" truncated>{{
              detailData.room_id || "-"
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="微信ID" label-class-name="detail-label">
            <el-text class="font-mono" truncated>{{
              detailData.wxid || "-"
            }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="批次ID" label-class-name="detail-label">
            <el-text class="font-mono" truncated>{{
              detailData.batch_id || "-"
            }}</el-text>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ExecutionLog } from "@/api/trade/monitor";

interface Props {
  modelValue: boolean;
  detailData: ExecutionLog | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);

// 监听props变化
watch(
  () => props.modelValue,
  val => {
    visible.value = val;
  },
  { immediate: true }
);

// 监听visible变化
watch(visible, val => {
  emit("update:modelValue", val);
});

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
};

// 格式化时间
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 获取状态标签类型
const getStatusTagType = (status: string) => {
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

// 获取金额约束类型文本
const getAmountConstraintText = (constraint: string): string => {
  switch (constraint) {
    case "fixed":
      return "固定面额";
    case "multiple":
      return "倍数要求";
    case "all":
      return "全面额";
    default:
      return constraint || "未知";
  }
};

// 解析固定面额
const getFixedAmounts = (fixedAmounts: string | null): string[] => {
  if (!fixedAmounts) return [];
  try {
    const amounts = JSON.parse(fixedAmounts);
    if (Array.isArray(amounts)) {
      return amounts.map(String);
    }
    return [String(fixedAmounts)];
  } catch (error) {
    return [String(fixedAmounts)];
  }
};
</script>

<style scoped lang="scss">
.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .label {
    font-weight: 500;
    color: #606266;
    min-width: 80px;
    margin-right: 8px;
  }

  .value {
    color: #303133;
    word-break: break-all;
  }
}

.error-message {
  padding: 12px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  word-break: break-all;
}

.font-mono {
  font-family: "Courier New", Courier, monospace;
}

/* 新增样式优化 */
.detail-descriptions {
  --el-descriptions-item-bordered-label-background: #fafafa;
}

:deep(.detail-label) {
  font-weight: 500 !important;
  width: 120px !important;
  text-align: right !important;
  color: #606266 !important;
}

.account-text {
  max-width: 300px;
  word-break: break-all;
}

.plan-name-text {
  max-width: 400px;
  word-break: break-all;
}

.exchange-code {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  color: #409eff;
  background-color: #f0f8ff;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.time-text {
  font-size: 13px;
  color: #606266;
}

.amount-text {
  font-size: 14px;
  font-weight: 600;
}

.rate-text {
  font-size: 16px;
  font-weight: 600;
}

.daily-amounts,
.completed-days,
.fixed-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mr-1 {
  margin-right: 4px;
}

.mb-1 {
  margin-bottom: 4px;
}

/* 卡片样式优化 */
.el-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 14px 20px;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0;
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 描述列表样式优化 */
:deep(.el-descriptions__body .el-descriptions__table) {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-descriptions__label) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  border-right: 1px solid #dee2e6 !important;
  padding: 14px 16px !important;
  vertical-align: middle !important;
  font-weight: 500 !important;
  color: #495057 !important;
  border-bottom: 1px solid #dee2e6 !important;
}

:deep(.el-descriptions__content) {
  padding: 14px 16px !important;
  vertical-align: middle !important;
  color: #212529 !important;
  background-color: #ffffff !important;
  border-bottom: 1px solid #dee2e6 !important;
}

/* 移除最后一行的底边框 */
:deep(.el-descriptions__table tr:last-child .el-descriptions__label),
:deep(.el-descriptions__table tr:last-child .el-descriptions__content) {
  border-bottom: none !important;
}

/* 响应式优化 */
@media (max-width: 768px) {
  :deep(.detail-label) {
    width: 100px !important;
    font-size: 12px !important;
  }

  .account-text,
  .plan-name-text {
    max-width: 200px;
  }

  .exchange-code {
    font-size: 11px;
    padding: 1px 4px;
  }

  .detail-content {
    max-height: 60vh;
  }

  :deep(.el-card__header) {
    padding: 12px 16px;
    font-size: 14px;
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  :deep(.el-descriptions__label),
  :deep(.el-descriptions__content) {
    padding: 10px 12px !important;
    font-size: 13px !important;
  }
}
</style>
