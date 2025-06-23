<template>
  <el-dialog
    v-model="visible"
    title="批量导入账号"
    width="90%"
    :style="{ maxWidth: '1200px' }"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="账号信息" prop="accounts">
        <el-input
          v-model="form.accounts"
          type="textarea"
          :rows="8"
          placeholder="请输入账号信息，每行一个账号"
        />
        <div class="import-tips">
          <el-alert title="格式说明" type="info" :closable="false" show-icon>
            <template #default>
              <div class="tips-content">
                <p>
                  每行一个账号，使用空格分隔账号、密码和API链接（API链接可选）
                </p>
                <div class="examples">
                  <p>
                    <strong>示例1：</strong
                    ><code>gordon123@icloud.com MyPassword123</code>
                  </p>
                  <p>
                    <strong>示例2：</strong
                    ><code
                      >gordon123@icloud.com MyPassword123
                      https://api.example.com/endpoint</code
                    >
                  </p>
                  <p>
                    <strong>示例3：</strong
                    ><code
                      >test456@gmail.com SecurePass456
                      https://secure-api.example.com/verify</code
                    >
                  </p>
                </div>
              </div>
            </template>
          </el-alert>
        </div>
      </el-form-item>
      <el-form-item label="国家/地区" prop="country">
        <el-select
          v-model="form.country"
          placeholder="选择国家/地区"
          class="w-full"
          :loading="countriesLoading"
        >
          <el-option
            v-for="item in countriesList"
            :key="item.code"
            :label="item.name_zh"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type {
  BatchImportAccountsRequest,
  ImportAccountInfo
} from "@/api/trade/account";

interface Props {
  modelValue: boolean;
  countriesList: any[];
  countriesLoading: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success", data: BatchImportAccountsRequest): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);

// 表单数据
const form = ref({
  accounts: "",
  country: ""
});

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 表单验证规则
const rules: FormRules = {
  accounts: [{ required: true, message: "请输入账号信息", trigger: "blur" }],
  country: [{ required: true, message: "请选择国家/地区", trigger: "change" }]
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 解析账号信息 - 支持账号、密码、API链接格式
    const accounts = form.value.accounts
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) {
          return null; // 至少需要账号和密码
        }

        const account = parts[0];
        const password = parts[1];
        const apiUrl = parts[2] || ""; // API链接可选

        // 简单邮箱格式验证
        if (!account.includes("@")) {
          return null;
        }

        return {
          account,
          password,
          apiUrl
        } as ImportAccountInfo;
      })
      .filter((item): item is ImportAccountInfo => item !== null);

    if (accounts.length === 0) {
      ElMessage.error("请输入有效的账号信息（格式：邮箱 密码 [API链接]）");
      return;
    }

    const importData: BatchImportAccountsRequest = {
      country_code: form.value.country,
      accounts: accounts
    };

    emit("success", importData);
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields();
  form.value = {
    accounts: "",
    country: ""
  };
  emit("update:modelValue", false);
};

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  visible => {
    if (!visible) {
      handleClose();
    }
  }
);
</script>

<style scoped>
.import-tips {
  margin-top: 10px;
  margin-left: 0; /* 确保与输入框对齐 */
}

.tips-content {
  padding: 10px;

  @media (max-width: 768px) {
    padding: 8px;
  }
}

.examples {
  margin-top: 10px;
}

.examples p {
  margin: 5px 0;
  font-size: 13px;

  @media (max-width: 768px) {
    font-size: 12px;
    margin: 3px 0;
  }
}

.examples code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #e74c3c;
  word-break: break-all;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 1px 4px;
    display: block;
    margin-top: 2px;
  }
}

.w-full {
  width: 100%;
}

/* 响应式弹层优化 */
:deep(.el-dialog) {
  @media (max-width: 768px) {
    margin: 5vh auto;
    width: 95% !important;
    max-width: none !important;
  }

  @media (max-width: 480px) {
    margin: 2vh auto;
    width: 98% !important;
  }
}

:deep(.el-form-item__label) {
  @media (max-width: 768px) {
    width: 80px !important;
    font-size: 14px;
  }
}

:deep(.el-textarea__inner) {
  @media (max-width: 768px) {
    font-size: 14px;
  }
}
</style>
