<template>
  <el-dialog
    v-model="visible"
    title="计划详情"
    width="95%"
    :style="{ maxWidth: '1300px' }"
    class="responsive-dialog"
    :before-close="handleClose"
  >
    <div v-if="planData" class="plan-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">计划名称：</span>
              <span class="value">{{ planData.name }}</span>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="detail-item">
              <span class="label">汇率名称：</span>
              <span class="value">{{ planData.rateName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">计划天数：</span>
              <span class="value">{{ planData.planDays }}天</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">兑换总额：</span>
              <span class="value amount">{{ planData.totalAmount }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">浮动金额：</span>
              <span class="value">{{ planData.floatAmount }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">状态：</span>
              <el-tag :type="getStatusTagType(planData.status)">
                {{ getStatusText(planData.status) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">绑定群聊：</span>
              <el-tag :type="planData.enableRoomBinding ? 'success' : 'info'">
                {{ planData.enableRoomBinding ? "已开启" : "未开启" }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 汇率详细信息 -->
      <div v-if="planData.rate" class="detail-section">
        <h3 class="section-title">汇率详细信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">国家/地区：</span>
              <span class="value">{{ planData.countryName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">汇率：</span>
              <span class="value rate-value">{{ planData.rate.rate }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">卡类型：</span>
              <el-tag
                :type="
                  planData.rate.card_type === 'fast' ? 'success' : 'warning'
                "
              >
                {{ planData.rate.card_type === "fast" ? "快卡" : "慢卡" }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">卡形式：</span>
              <el-tag
                :type="planData.rate.card_form === 'image' ? 'primary' : 'info'"
              >
                {{ planData.rate.card_form === "image" ? "卡图" : "卡密" }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="detail-item">
              <span class="label">面额限制：</span>
              <el-tag
                :type="
                  getAmountConstraintTagType(planData.rate.amount_constraint)
                "
              >
                {{ getAmountConstraintText(planData.rate.amount_constraint) }}
              </el-tag>
            </div>
          </el-col>

          <!-- 根据 amount_constraint 显示不同的详细信息 -->
          <template v-if="planData.rate.amount_constraint === 'fixed'">
            <el-col :span="24">
              <div class="detail-item">
                <span class="label">固定面额：</span>
                <div class="fixed-amounts">
                  <el-tag
                    v-for="amount in formatFixedAmounts(
                      planData.rate.fixed_amounts
                    )"
                    :key="amount"
                    type="info"
                    class="amount-tag"
                  >
                    {{ amount }}
                  </el-tag>
                </div>
              </div>
            </el-col>
          </template>

          <template v-if="planData.rate.amount_constraint === 'multiple'">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">倍数基数：</span>
                <span class="value">{{ planData.rate.multiple_base }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">最小面额：</span>
                <span class="value">{{ planData.rate.min_amount || "-" }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">最大面额：</span>
                <span class="value">{{ planData.rate.max_amount || "-" }}</span>
              </div>
            </el-col>
          </template>

          <template v-if="planData.rate.amount_constraint === 'all'">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">最小面额：</span>
                <span class="value">{{
                  planData.rate.min_amount || "无限制"
                }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">最大面额：</span>
                <span class="value">{{
                  planData.rate.max_amount || "无限制"
                }}</span>
              </div>
            </el-col>
          </template>

          <el-col v-if="planData.rate.description" :span="24">
            <div class="detail-item">
              <span class="label">汇率描述：</span>
              <span class="value">{{ planData.rate.description }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 时间配置 -->
      <div class="detail-section">
        <h3 class="section-title">时间配置</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">兑换时间间隔：</span>
              <span class="value">{{ planData.exchangeInterval }}分钟</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">天数间隔：</span>
              <span class="value">{{ planData.dayInterval }}小时</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 每日计划金额 -->
      <div class="detail-section">
        <h3 class="section-title">每日计划金额</h3>
        <div class="daily-amounts-grid">
          <div
            v-for="(amount, index) in planData.dailyAmounts"
            :key="index"
            class="daily-amount-card"
          >
            <div class="day-number">第{{ index + 1 }}天</div>
            <div class="amount-value">{{ amount }}</div>
          </div>
        </div>
        <div class="amounts-summary">
          <div class="summary-item">
            <span class="summary-label">总计：</span>
            <span class="summary-value">{{ dailyAmountsSum }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">平均每天：</span>
            <span class="summary-value">{{ averageDailyAmount }}</span>
          </div>
        </div>
      </div>

      <!-- 描述信息 -->
      <div v-if="planData.description" class="detail-section">
        <h3 class="section-title">描述信息</h3>
        <div class="description-content">
          {{ planData.description }}
        </div>
      </div>

      <!-- 时间信息 -->
      <div class="detail-section">
        <h3 class="section-title">时间信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">创建时间：</span>
              <span class="value">{{
                formatDateTime(planData.createdAt)
              }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">更新时间：</span>
              <span class="value">{{
                formatDateTime(planData.updatedAt)
              }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlanItem } from "@/api/trade/plan";

interface Props {
  modelValue: boolean;
  planData?: PlanItem | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  planData: null
});

const emit = defineEmits<Emits>();

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

// 格式化固定金额
const formatFixedAmounts = (fixedAmounts?: string | null) => {
  if (!fixedAmounts) return [];
  try {
    const amounts = JSON.parse(fixedAmounts);
    if (Array.isArray(amounts)) {
      return amounts;
    }
    return [];
  } catch (error) {
    return [];
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

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 每日金额总和
const dailyAmountsSum = computed(() => {
  if (!props.planData?.dailyAmounts) return 0;
  return props.planData.dailyAmounts.reduce((sum, amount) => sum + amount, 0);
});

// 平均每日金额
const averageDailyAmount = computed(() => {
  if (!props.planData?.dailyAmounts?.length) return 0;
  return Math.round(dailyAmountsSum.value / props.planData.dailyAmounts.length);
});

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "enabled":
      return "启用";
    case "disabled":
      return "禁用";
    default:
      return "未知";
  }
};

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case "enabled":
      return "success";
    case "disabled":
      return "danger";
    default:
      return "primary";
  }
};

// 关闭弹窗
const handleClose = () => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.plan-detail {
  padding: 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-height: 32px;
}

.detail-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #303133;
  flex: 1;
}

.detail-item .value.amount {
  font-weight: 600;
  color: #e6a23c;
}

.daily-amounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.daily-amount-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.daily-amount-card:hover {
  transform: translateY(-2px);
}

.day-number {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 16px;
  font-weight: 600;
}

.amounts-summary {
  display: flex;
  justify-content: space-around;
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.rate-value {
  color: #67c23a;
  font-weight: bold;
  font-size: 16px;
}

.fixed-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.amount-tag {
  margin: 0;
}

.description-content {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
