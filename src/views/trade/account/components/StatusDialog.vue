<template>
  <el-dialog
    v-model="visible"
    title="更改账号状态"
    width="90%"
    :style="{ maxWidth: '600px' }"
    @close="handleClose"
  >
    <el-form label-width="80px">
      <el-form-item label="账号">
        <span>{{ currentAccount?.account }}</span>
      </el-form-item>
      <el-form-item label="当前状态">
        <el-tag :type="getStatusTagType(currentAccount?.status)">
          {{ getStatusText(currentAccount?.status) }}
        </el-tag>
      </el-form-item>
      <el-form-item label="新状态">
        <el-select v-model="newStatus" placeholder="选择新状态" class="w-full">
          <el-option label="已完成" value="completed" />
          <el-option label="进行中" value="processing" />
          <el-option label="等待中" value="waiting" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定更改
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Account } from "@/api/trade/account";

interface Props {
  modelValue: boolean;
  currentAccount?: Account | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success", account: Account, newStatus: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const newStatus = ref("");

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

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

// 提交状态更改
const handleSubmit = () => {
  if (!props.currentAccount || !newStatus.value) return;

  emit("success", props.currentAccount, newStatus.value);
};

// 关闭对话框
const handleClose = () => {
  newStatus.value = "";
  emit("update:modelValue", false);
};

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  visible => {
    if (visible && props.currentAccount) {
      newStatus.value = props.currentAccount.status;
    } else if (!visible) {
      handleClose();
    }
  }
);
</script>

<style scoped>
.w-full {
  width: 100%;
}

/* 响应式弹层优化 */
:deep(.el-dialog) {
  @media (max-width: 768px) {
    margin: 15vh auto;
    width: 90% !important;
    max-width: none !important;
  }

  @media (max-width: 480px) {
    margin: 10vh auto;
    width: 95% !important;
  }
}

:deep(.el-form-item__label) {
  @media (max-width: 768px) {
    width: 70px !important;
    font-size: 14px;
  }
}

:deep(.el-dialog__body) {
  @media (max-width: 768px) {
    padding: 15px 20px;
  }

  @media (max-width: 480px) {
    padding: 12px 15px;
  }
}

:deep(.el-dialog__footer) {
  @media (max-width: 768px) {
    padding: 15px 20px;
  }

  @media (max-width: 480px) {
    padding: 12px 15px;
    text-align: center;

    .el-button {
      margin: 0 5px;
    }
  }
}
</style>
