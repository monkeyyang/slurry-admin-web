<script setup lang="ts">
import { ref, reactive } from "vue";
import type { Ref } from "vue";
import { ElMessage, ElInput } from "element-plus";
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
const productCodeInput = ref<InstanceType<typeof ElInput>>();

const { scanInbound } = useHook();

const loading = ref(false);
const formData = reactive({
  trackingNo: "",
  productCode: ""
});

// 提交数据
const handleSubmit = async () => {
  if (!formData.trackingNo || !formData.productCode) {
    ElMessage.warning("请扫描快递单号和IMEI/UPC");
    return;
  }

  loading.value = true;
  try {
    const success = await scanInbound({
      id: props.row.id,
      ...formData
    });

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
  formData.trackingNo = "";
  formData.productCode = "";
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="扫码入库"
    width="500px"
    :destroy-on-close="true"
    @update:model-value="val => emit('update:visible', val)"
  >
    <el-form>
      <el-form-item label="快递单号" required>
        <el-input
          v-model="formData.trackingNo"
          placeholder="请扫描快递单号"
          clearable
          @keyup.enter="productCodeInput?.focus()"
        />
      </el-form-item>
      <el-form-item label="IMEI/UPC" required>
        <el-input
          ref="productCodeInput"
          v-model="formData.productCode"
          placeholder="请扫描IMEI/UPC"
          clearable
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>
