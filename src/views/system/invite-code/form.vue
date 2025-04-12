<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import {
  addInviteCodeApi,
  updateInviteCodeApi,
  getInviteCodeDetailApi
} from "@/api/system/inviteCode";

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = ref(false);
const currentId = ref<number | null>(null);

const formData = reactive({
  code: "",
  expireTime: "",
  remark: ""
});

const rules = reactive<FormRules>({
  code: [
    { required: true, message: "请输入邀请码", trigger: "blur" },
    {
      min: 6,
      max: 20,
      message: "邀请码长度应在6-20个字符之间",
      trigger: "blur"
    }
  ],
  expireTime: [{ required: true, message: "请选择过期时间", trigger: "change" }]
});

function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  formData.code = result;
}

function openDialog(row = null) {
  dialogVisible.value = true;
  if (row) {
    isEdit.value = true;
    currentId.value = row.id;
    // 获取详细信息
    getInviteCodeDetailApi(row.id).then(({ data }) => {
      formData.code = data.code;
      formData.expireTime = data.expireTime;
      formData.remark = data.remark;
    });
  } else {
    isEdit.value = false;
    currentId.value = null;
    formData.code = "";
    formData.expireTime = "";
    formData.remark = "";
    // 自动生成随机邀请码
    generateRandomCode();
  }
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
        if (isEdit.value && currentId.value) {
          await updateInviteCodeApi(currentId.value, formData);
          message("更新成功", { type: "success" });
        } else {
          await addInviteCodeApi(formData);
          message("创建成功", { type: "success" });
        }
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
    :title="isEdit ? '编辑邀请码' : '新增邀请码'"
    width="500px"
    destroy-on-close
    @closed="close"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="邀请码" prop="code">
        <div class="flex">
          <el-input
            v-model="formData.code"
            placeholder="请输入邀请码"
            clearable
            style="width: 100%"
          />
          <el-button
            v-if="!isEdit"
            type="primary"
            style="margin-left: 10px"
            @click="generateRandomCode"
          >
            生成
          </el-button>
        </div>
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
