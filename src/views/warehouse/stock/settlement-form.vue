<template>
  <el-dialog
    v-model="dialogVisible"
    title="结算"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="结算金额" prop="amount">
        <el-input
          v-model="form.amount"
          type="number"
          placeholder="请输入结算金额"
          @input="formatAmount"
        >
          <template #prefix>
            <span class="currency-symbol">¥</span>
          </template>
        </el-input>
        <div class="amount-tips text-gray-400 mt-1 text-xs">
          请输入结算金额，保留两位小数
        </div>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息（选填）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { ElMessage } from "element-plus";
import { settleStockApi } from "@/api/warehouse/stock";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  row: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = ref(false);
const loading = ref(false);
const formRef = ref();

const form = reactive({
  amount: "",
  remark: ""
});

const rules = {
  amount: [
    { required: true, message: "请输入结算金额", trigger: "blur" },
    {
      pattern: /^\d+(\.\d{1,2})?$/,
      message: "请输入正确的金额格式（最多两位小数）",
      trigger: "blur"
    }
  ]
};

// 格式化金额，限制为两位小数
const formatAmount = value => {
  if (value === "") return;

  // 移除非数字和小数点字符
  let formatted = value.toString().replace(/[^\d.]/g, "");

  // 确保只有一个小数点
  const parts = formatted.split(".");
  if (parts.length > 2) {
    formatted = parts[0] + "." + parts.slice(1).join("");
  }

  // 限制小数位数为两位
  if (parts.length === 2 && parts[1].length > 2) {
    formatted = parts[0] + "." + parts[1].substring(0, 2);
  }

  form.amount = formatted;
};

// 提交结算
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    loading.value = true;
    try {
      const res = await settleStockApi({
        id: props.row.id,
        amount: parseFloat(form.amount),
        remark: form.remark
      });

      if (res.code === 0) {
        ElMessage.success("结算成功");
        emit("success");
        closeDialog();
      } else {
        ElMessage.error(res.message || "结算失败");
      }
    } catch (error) {
      console.error("结算失败", error);
      ElMessage.error("结算失败，请重试");
    } finally {
      loading.value = false;
    }
  });
};

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
  form.amount = "";
  form.remark = "";
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
  }
);

watch(
  () => dialogVisible.value,
  val => {
    if (!val) {
      emit("update:visible", false);
    }
  }
);
</script>

<style scoped>
.currency-symbol {
  color: #67c23a;
  margin-right: 4px;
}
</style>
