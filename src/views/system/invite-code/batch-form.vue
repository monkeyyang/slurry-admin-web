<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { batchGenerateInviteCodeApi } from "@/api/system/inviteCode";

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive({
  count: 10,
  expireTime: "",
  remark: ""
});

const rules = reactive<FormRules>({
  count: [
    { required: true, message: "请输入生成数量", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 100,
      message: "数量范围1-100",
      trigger: "blur"
    }
  ],
  expireTime: [{ required: true, message: "请选择过期时间", trigger: "change" }]
});

function openDialog() {
  dialogVisible.value = true;
  formData.count = 10;
  formData.expireTime = "";
  formData.remark = "";
}

function close() {
  dialogVisible.value = false;
  formRef.value?.resetFields();
}

async function submit() {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        await batchGenerateInviteCodeApi(formData);
        message(`成功生成${formData.count}个邀请码`, { type: "success" });
        close();
        emit("success");
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    }
  });
}

const emit = defineEmits(["success"]);

defineExpose({
  openDialog
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量生成邀请码"
    width="500px"
    destroy-on-close
    @closed="close"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="生成数量" prop="count">
        <el-input-number
          v-model="formData.count"
          :min="1"
          :max="100"
          :precision="0"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="过期时间" prop="expireTime">
        <el-date-picker
          v-model="formData.expireTime"
          type="datetime"
          placeholder="请选择过期时间"
          style="width: 100%"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>
