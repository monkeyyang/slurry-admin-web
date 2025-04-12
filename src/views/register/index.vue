<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import { register } from "@/api/user";
import { message } from "@/utils/message";
import { initRouter, getTopMenu } from "@/router/utils";
import Motion from "@/views/login/utils/motion";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import User from "@iconify-icons/ri/user-3-fill";
import Lock from "@iconify-icons/ri/lock-fill";
import Email from "@iconify-icons/ri/mail-fill";
import Invitation from "@iconify-icons/ri/coupon-fill";
import { useNav } from "@/layout/hooks/useNav";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useLayout } from "@/layout/hooks/useLayout";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import TypeIt from "@/components/ReTypeit";
import { setToken } from "@/utils/auth";
import axios from "axios";

defineOptions({
  name: "Register"
});

const router = useRouter();
const loading = ref(false);
const formRef = ref<FormInstance>();

const { username, password } = useUserStoreHook();

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  inviteCode: ""
});

// 密码强度计算
const passwordStrength = computed(() => {
  const password = form.password;
  if (!password) return 0;

  let strength = 0;

  // 长度检查
  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;

  // 包含数字
  if (/\d/.test(password)) strength += 1;

  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 1;

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength += 1;

  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  return Math.min(strength, 4); // 最高4级
});

// 密码强度文本
const strengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength === 0) return "";
  if (strength === 1) return "弱";
  if (strength === 2) return "中";
  if (strength === 3) return "强";
  return "非常强";
});

// 密码强度颜色
const strengthColor = computed(() => {
  const strength = passwordStrength.value;
  if (strength === 0) return "";
  if (strength === 1) return "#F56C6C";
  if (strength === 2) return "#E6A23C";
  if (strength === 3) return "#67C23A";
  return "#409EFF";
});

const rules = reactive<FormRules>({
  username: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur"
    },
    {
      min: 3,
      max: 20,
      message: "用户名长度应在3-20个字符之间",
      trigger: "blur"
    }
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur"
    },
    {
      min: 6,
      message: "密码长度应不少于6个字符",
      trigger: "blur"
    }
  ],
  confirmPassword: [
    {
      required: true,
      message: "请再次输入密码",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  email: [
    {
      type: "email",
      message: "请输入正确的邮箱格式",
      trigger: "blur"
    }
  ],
  inviteCode: [
    {
      required: true,
      message: "请输入邀请码",
      trigger: "blur"
    }
  ]
});

// 初始化主题
const { initStorage } = useLayout();
initStorage();
const { dataTheme, dataThemeChange } = useDataThemeChange();
dataThemeChange();
const { title } = useNav();

function onRegister() {
  if (!formRef.value) return;
  formRef.value.validate(valid => {
    if (valid) {
      loading.value = true;

      // 根据后端API要求调整字段名
      const requestData = {
        username: form.username,
        password: form.password,
        password_confirmation: form.confirmPassword,
        email: form.email || "",
        invitation_code: form.inviteCode
      };

      console.log("发送注册请求:", requestData);

      // 使用 axios 直接发送请求，确保包含正确的基础 URL
      const baseURL = import.meta.env.VITE_API_BASE_URL || "/dev-api";

      axios({
        method: "post",
        url: `${baseURL}/register`,
        data: requestData,
        headers: {
          "Content-Type": "application/json",
          "X-Register-Request": "true"
        }
      })
        .then(response => {
          console.log("注册响应:", response.data);

          const responseData = response.data;

          // 检查响应中的 code 字段
          if (responseData.code === 0) {
            // 只有当 code 为 0 时才认为是成功
            message("注册成功，请登录", { type: "success" });
            router.push("/login");
          } else {
            // 其他情况都视为失败，显示错误信息
            message(responseData.message || "注册失败", { type: "error" });
          }
        })
        .catch(error => {
          console.error("注册错误:", error);
          if (error.response && error.response.data) {
            // 显示后端返回的错误信息
            const errorData = error.response.data;
            if (errorData.message) {
              message(errorData.message, { type: "error" });
            } else if (errorData.errors) {
              // 如果有详细的错误信息，显示第一个错误
              const firstError = Object.values(errorData.errors)[0];
              if (Array.isArray(firstError) && firstError.length > 0) {
                message(firstError[0], { type: "error" });
              } else {
                message("注册信息有误，请检查", { type: "error" });
              }
            } else {
              message("注册失败", { type: "error" });
            }
          } else {
            message(error.message || "注册失败", { type: "error" });
          }
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
}

function toLogin() {
  router.push("/login");
}
</script>

<template>
  <div class="select-none">
    <div class="absolute flex-c right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        inline-prompt
        @change="dataThemeChange"
      />
    </div>
    <div
      class="login-container"
      style="
        height: 90vh;
        display: flex;
        justify-content: center;
        align-items: center;
      "
    >
      <div class="login-box">
        <div class="login-form">
          <Motion>
            <h2 class="outline-none">
              <TypeIt :cursor="false" :speed="150" :values="['用户注册']" />
            </h2>
          </Motion>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            @keyup.enter="onRegister"
          >
            <Motion :delay="100">
              <el-form-item prop="username">
                <el-input
                  v-model="form.username"
                  :prefix-icon="useRenderIcon(User)"
                  clearable
                  placeholder="请输入用户名"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="form.password"
                  :prefix-icon="useRenderIcon(Lock)"
                  clearable
                  placeholder="请输入密码"
                  show-password
                />
                <!-- 密码强度指示器 -->
                <div v-if="form.password" class="password-strength-container">
                  <div class="password-strength-text">
                    密码强度:
                    <span :style="{ color: strengthColor }">{{
                      strengthText
                    }}</span>
                  </div>
                  <div class="password-strength-bar">
                    <div
                      class="password-strength-progress"
                      :style="{
                        width: passwordStrength * 25 + '%',
                        backgroundColor: strengthColor
                      }"
                    />
                  </div>
                </div>
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  :prefix-icon="useRenderIcon(Lock)"
                  clearable
                  placeholder="请再次输入密码"
                  show-password
                />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-form-item prop="email">
                <el-input
                  v-model="form.email"
                  :prefix-icon="useRenderIcon(Email)"
                  clearable
                  placeholder="请输入邮箱"
                >
                  <template #append>
                    <div class="optional-tag">选填</div>
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="300">
              <el-form-item prop="inviteCode">
                <el-input
                  v-model="form.inviteCode"
                  :prefix-icon="useRenderIcon(Invitation)"
                  clearable
                  placeholder="请输入邀请码"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="350">
              <el-button
                :loading="loading"
                class="w-full mt-4"
                size="default"
                type="primary"
                @click="onRegister"
              >
                注册
              </el-button>
            </Motion>

            <Motion :delay="400">
              <div class="login-options">
                <div class="register-link">
                  已有账号？
                  <el-button type="primary" link @click="toLogin">
                    立即登录
                  </el-button>
                </div>
              </div>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
    <!--  底部  -->
    <div class="flex items-center justify-center h-full">
      <div class="flex flex-col items-center justify-center mb-3">
        <span>粤顺 ©2025 powered by ys</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");

.password-strength-container {
  margin-top: 5px;
  font-size: 12px;
}

.password-strength-text {
  margin-bottom: 3px;
}

.password-strength-bar {
  height: 4px;
  background-color: #ebeef5;
  border-radius: 2px;
  overflow: hidden;
}

.password-strength-progress {
  height: 100%;
  transition:
    width 0.3s,
    background-color 0.3s;
}

.optional-tag {
  background-color: #f2f6fc;
  color: #909399;
  padding: 0 10px;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 12px;
  border-left: 1px solid #dcdfe6;
}

:deep(.el-input-group__append) {
  padding: 0;
}
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.login-options {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.register-link {
  display: flex;
  align-items: center;
}
</style>
