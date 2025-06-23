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
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">记录ID：</span>
              <span class="value">{{ detailData.id }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">账号ID：</span>
              <span class="value">{{ detailData.account_id }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">账号：</span>
              <span class="value">{{
                detailData.account_info?.account || detailData.account || "-"
              }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="mt-3">
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">计划ID：</span>
              <span class="value">{{ detailData.plan_id }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">计划名称：</span>
              <span class="value">{{ detailData.plan_info?.name || "-" }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">汇率ID：</span>
              <span class="value">{{ detailData.rate_id }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 执行信息 -->
      <el-card class="mb-4" header="执行信息">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">国家代码：</span>
              <span class="value">{{ detailData.country_code }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">执行天数：</span>
              <span class="value">第{{ detailData.day }}天</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">执行金额：</span>
              <span class="value text-green-600 font-medium">{{
                detailData.amount
              }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="mt-3">
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">兑换码：</span>
              <span class="value font-mono">{{ detailData.code }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">执行状态：</span>
              <el-tag :type="getStatusTagType(detailData.status)">
                {{ detailData.status_text || detailData.status }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 汇率信息 -->
      <el-card v-if="detailData.rate_info" class="mb-4" header="汇率信息">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">汇率名称：</span>
              <span class="value">{{ detailData.rate_info.name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">汇率值：</span>
              <span class="value">{{ detailData.rate_info.rate }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 时间信息 -->
      <el-card class="mb-4" header="时间信息">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">兑换时间：</span>
              <span class="value">{{
                formatDateTime(detailData.exchange_time)
              }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">创建时间：</span>
              <span class="value">{{
                formatDateTime(detailData.created_at)
              }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">更新时间：</span>
              <span class="value">{{
                formatDateTime(detailData.updated_at)
              }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 错误信息 -->
      <el-card v-if="detailData.error_message" class="mb-4" header="错误信息">
        <div class="error-message">
          <el-text type="danger">{{ detailData.error_message }}</el-text>
        </div>
      </el-card>

      <!-- 其他信息 -->
      <el-card header="其他信息">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">消息ID：</span>
              <span class="value">{{ detailData.msgid || "-" }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">房间ID：</span>
              <span class="value">{{ detailData.room_id || "-" }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">微信ID：</span>
              <span class="value">{{ detailData.wxid || "-" }}</span>
            </div>
          </el-col>
        </el-row>
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
</style>
