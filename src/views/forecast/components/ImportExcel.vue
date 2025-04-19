<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useHook } from "../hook";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "success"]);

const { warehouseOptions, getWarehouseOptions } = useHook();

const loading = ref(false);
const fileList = ref([]);
const warehouseId = ref("");

// 文件上传前的验证
const beforeUpload = file => {
  if (!warehouseId.value) {
    ElMessage.warning("请先选择仓库");
    return false;
  }

  const isExcel =
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";
  if (!isExcel) {
    ElMessage.error("只能上传 Excel 文件!");
    return false;
  }
  return true;
};

// 上传成功
const handleSuccess = response => {
  loading.value = false;
  if (response.code === 200) {
    ElMessage.success("导入成功");
    emit("success");
    closeDialog();
  } else {
    ElMessage.error(response.message || "导入失败");
  }
};

// 上传失败
const handleError = () => {
  loading.value = false;
  ElMessage.error("导入失败，请重试");
};

// 关闭弹窗
const closeDialog = () => {
  fileList.value = [];
  warehouseId.value = "";
  emit("update:visible", false);
};

// 组件挂载时获取仓库列表
onMounted(() => {
  getWarehouseOptions();
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="导入Excel"
    width="500px"
    :destroy-on-close="true"
    @update:model-value="val => emit('update:visible', val)"
  >
    <el-form>
      <el-form-item label="选择仓库" required>
        <el-select
          v-model="warehouseId"
          placeholder="请选择仓库"
          class="w-full"
          clearable
        >
          <el-option
            v-for="item in warehouseOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <el-upload
      class="upload-demo"
      drag
      :action="`https://slurry-api.1105.me/forecast/import?warehouseId=${warehouseId}`"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :file-list="fileList"
      accept=".xlsx,.xls"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">
          只能上传 Excel 文件，且文件大小不超过 10MB
        </div>
      </template>
    </el-upload>

    <template #footer>
      <el-button @click="closeDialog">取 消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.upload-demo {
  text-align: center;
}
</style>
