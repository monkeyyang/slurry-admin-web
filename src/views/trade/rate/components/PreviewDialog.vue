<template>
  <el-dialog
    v-model="visible"
    title="汇率预览"
    width="95%"
    :style="{ maxWidth: '1300px' }"
    class="responsive-dialog"
    :before-close="handleClose"
  >
    <div class="preview-container">
      <div class="preview-info mb-4">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="汇率名称">
            {{ rateData?.name || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="国家/地区">
            {{ rateData?.countryName || "-" }} ({{ rateData?.country || "-" }})
          </el-descriptions-item>
          <el-descriptions-item label="群聊">
            <el-tag v-if="rateData?.roomName" type="info" class="room-tag">
              {{ rateData.roomName }}
            </el-tag>
            <span v-else class="text-gray-400">未关联群聊</span>
          </el-descriptions-item>
          <el-descriptions-item label="群组">
            <el-tag v-if="rateData?.groupName" class="group-tag group-tag-1">
              {{ rateData.groupName }}
            </el-tag>
            <span v-else class="text-gray-400">未关联群组</span>
          </el-descriptions-item>
          <el-descriptions-item label="汇率">
            {{ rateData?.rate || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="面额约束">
            <div>
              <el-tag :type="getConstraintTagType(rateData?.amountConstraint)">
                {{ getConstraintText(rateData?.amountConstraint) }}
              </el-tag>
              <!-- 固定面额详情 -->
              <div
                v-if="
                  rateData?.amountConstraint === 'fixed' &&
                  rateData?.fixedAmounts?.length
                "
                class="mt-2"
              >
                <small class="text-gray-600">
                  固定面额: ${{ rateData.fixedAmounts.join(", $") }}
                </small>
              </div>
              <!-- 倍数要求详情 -->
              <div
                v-else-if="rateData?.amountConstraint === 'multiple'"
                class="mt-2"
              >
                <small class="text-gray-600">
                  <div v-if="rateData.multipleBase">
                    倍数基数: {{ rateData.multipleBase }}
                  </div>
                  <div>
                    最小面额:
                    {{
                      rateData.minAmount === 0
                        ? "无限制"
                        : `$${rateData.minAmount}`
                    }}
                  </div>
                  <div>
                    最大面额:
                    {{
                      rateData.maxAmount === 0
                        ? "无限制"
                        : `$${rateData.maxAmount}`
                    }}
                  </div>
                </small>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="rateData?.status === 'active' ? 'success' : 'danger'"
            >
              {{ rateData?.status === "active" ? "启用" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="preview-content">
        <div class="content-header mb-3">
          <span class="text-lg font-medium">汇率配置内容</span>
          <el-button
            type="primary"
            :icon="CopyDocument"
            :loading="copyLoading"
            @click="handleCopy"
          >
            复制内容
          </el-button>
        </div>

        <el-input
          v-model="previewText"
          type="textarea"
          :rows="15"
          placeholder="汇率配置内容将在这里显示..."
          class="preview-textarea"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          type="primary"
          :icon="CopyDocument"
          :loading="copyLoading"
          @click="handleCopy"
        >
          复制内容
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { CopyDocument } from "@element-plus/icons-vue";
import type { RateItem } from "@/api/trade/rate";

interface Props {
  modelValue: boolean;
  rateData?: RateItem | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  rateData: null
});

const emit = defineEmits<Emits>();

const copyLoading = ref(false);
const previewText = ref("");

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 获取约束类型文本
const getConstraintText = (constraint?: string) => {
  switch (constraint) {
    case "fixed":
      return "固定面额";
    case "multiple":
      return "倍数要求";
    case "all":
      return "全面额";
    default:
      return "未知";
  }
};

// 获取约束类型标签颜色
const getConstraintTagType = (constraint?: string) => {
  switch (constraint) {
    case "fixed":
      return "warning";
    case "multiple":
      return "primary";
    case "all":
      return "success";
    default:
      return "primary";
  }
};

// 生成预览文本
const generatePreviewText = (data: RateItem) => {
  const lines: string[] = [];

  lines.push("=== 汇率配置信息 ===");
  lines.push("");
  lines.push(`汇率名称: ${data.name}`);
  lines.push(`国家/地区: ${data.countryName} (${data.country})`);
  lines.push(`群聊: ${data.roomName || "未关联群聊"}`);
  lines.push(`群组: ${data.groupName || "未关联群组"}`);
  lines.push(`汇率: ${data.rate}`);
  lines.push(`面额约束: ${getConstraintText(data.amountConstraint)}`);

  // 根据约束类型添加详细信息
  if (data.amountConstraint === "fixed" && data.fixedAmounts?.length) {
    lines.push(`固定面额: $${data.fixedAmounts.join(", $")}`);
  } else if (data.amountConstraint === "multiple" && data.multipleBase) {
    lines.push(`倍数基数: ${data.multipleBase}`);
  }

  lines.push(`状态: ${data.status === "active" ? "启用" : "禁用"}`);

  if (data.description) {
    lines.push("");
    lines.push("=== 描述信息 ===");
    lines.push(data.description);
  }

  lines.push("");
  lines.push("=== 配置详情 ===");
  lines.push(`创建时间: ${data.createdAt || "未知"}`);
  lines.push(`更新时间: ${data.updatedAt || "未知"}`);

  // 添加使用说明
  lines.push("");
  lines.push("=== 使用说明 ===");

  switch (data.amountConstraint) {
    case "fixed":
      lines.push("• 仅接受指定的固定面额");
      if (data.fixedAmounts?.length) {
        lines.push(`• 可接受面额: $${data.fixedAmounts.join(", $")}`);
      }
      break;
    case "multiple":
      lines.push(`• 面额必须是 ${data.multipleBase} 的倍数`);
      lines.push(
        `• 例如: $${data.multipleBase}, $${data.multipleBase * 2}, $${data.multipleBase * 3}...`
      );
      break;
    case "all":
      lines.push("• 接受所有面额");
      break;
  }

  lines.push(`• 当前汇率: 1 USD = ${data.rate} CNY`);

  if (data.roomName) {
    lines.push(`• 适用群组: ${data.roomName}`);
  }

  return lines.join("\n");
};

// 复制内容到剪贴板
const handleCopy = async () => {
  if (!previewText.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }

  try {
    copyLoading.value = true;
    await navigator.clipboard.writeText(previewText.value);
    ElMessage.success("内容已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);

    // 降级方案：使用传统方法复制
    try {
      const textArea = document.createElement("textarea");
      textArea.value = previewText.value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      ElMessage.success("内容已复制到剪贴板");
    } catch (fallbackError) {
      console.error("降级复制也失败:", fallbackError);
      ElMessage.error("复制失败，请手动选择复制");
    }
  } finally {
    copyLoading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  emit("update:modelValue", false);
};

// 监听数据变化，生成预览文本
watch(
  () => props.rateData,
  newData => {
    if (newData) {
      previewText.value = generatePreviewText(newData);
    } else {
      previewText.value = "";
    }
  },
  { immediate: true }
);

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  visible => {
    if (visible && props.rateData) {
      previewText.value = generatePreviewText(props.rateData);
    }
  }
);
</script>

<style scoped>
.preview-container {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-info {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-textarea {
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
}

.preview-textarea :deep(.el-textarea__inner) {
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.text-gray-600 {
  color: #666;
}

.room-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  border-radius: 12px;
  padding: 4px 12px;
}

.group-tag {
  border: none !important;
  color: white !important;
  font-weight: 500;
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-tag-1 {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%) !important;
}
</style>
