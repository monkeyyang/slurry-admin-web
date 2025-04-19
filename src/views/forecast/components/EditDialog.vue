<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { useHook } from "../hook";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  row: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["update:visible", "success"]);

const { updateForecast } = useHook();

const loading = ref(false);
const formData = reactive({
  ...props.row
});

// 提交数据
const handleSubmit = async () => {
  loading.value = true;
  try {
    const success = await updateForecast(formData);
    if (success) {
      emit("success");
      closeDialog();
    }
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const closeDialog = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="修改预报"
    width="500px"
    :destroy-on-close="true"
    @update:model-value="val => emit('update:visible', val)"
  >
    <el-form>
      <el-form-item label="货物名称" required>
        <el-input v-model="formData.productName" />
      </el-form-item>
      <el-form-item label="数量" required>
        <el-input-number v-model="formData.quantity" :min="1" />
      </el-form-item>
      <!-- 其他需要修改的字段 -->
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>
