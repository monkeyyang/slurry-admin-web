<template>
  <div class="main">
    <!-- 搜索表单 -->
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="账号" prop="account">
        <el-input
          v-model="searchFormParams.account"
          placeholder="请输入账号"
          clearable
          class="!w-[180px] !min-w-[120px]"
        />
      </el-form-item>
      <el-form-item label="用户" prop="uid">
        <el-input
          v-model="searchFormParams.uid"
          placeholder="请输入用户ID"
          clearable
          class="!w-[140px] !min-w-[100px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <PureTableBar title="账号查码" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="success"
          :icon="useRenderIcon(Download)"
          @click="handleExport"
        >
          导出数据
        </el-button>
        <el-button
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportDialog"
        >
          批量导入
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small' ? true : false"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <!-- 创建人 -->
          <template #uid="{ row }">
            <span>{{ row.user?.nickname || "-" }}</span>
          </template>

          <!-- 创建时间 -->
          <template #createdAt="{ row }">
            <span>{{ formatDateTime(row.created_at) }}</span>
          </template>

          <!-- 操作 -->
          <template #operation="{ row }">
            <el-space>
              <el-button
                type="primary"
                size="small"
                :icon="useRenderIcon(CopyDocument)"
                @click="handleCopyAccount(row)"
              >
                复制账号
              </el-button>
              <el-button
                type="success"
                size="small"
                :icon="useRenderIcon(Key)"
                @click="handleGetVerifyCode(row)"
              >
                查验证码
              </el-button>
              <el-button
                type="warning"
                size="small"
                :icon="useRenderIcon(Edit)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </el-space>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入账号"
      width="600px"
      @close="resetImportDialog"
    >
      <div class="import-content">
        <div class="import-tips">
          <el-alert title="导入说明" type="info" :closable="false" class="mb-4">
            <div class="text-sm">
              <p>1. 请按照以下格式导入：账号 验证码获取地址</p>
              <p>2. 每行一个账号，使用空格分隔账号和验证码获取地址</p>
              <p>3. 验证码获取地址为可选项，可以为空</p>
              <p><strong>示例：</strong></p>
              <p>
                tebs13n@icloud.com
                https://api.sms8.net/api/record?token=cfgaarx8k1o35udsix23f1v8yx0tl96hlop3
              </p>
            </div>
          </el-alert>
        </div>

        <el-input
          v-model="importText"
          type="textarea"
          :rows="10"
          placeholder="请输入账号信息，格式：账号 验证码获取地址（每行一个）"
          class="import-textarea"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="importLoading"
            :disabled="!importText.trim()"
            @click="handleImport"
          >
            确认导入
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑账号' : '添加账号'"
      width="500px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="editForm.account"
            placeholder="请输入账号"
            clearable
          />
        </el-form-item>
        <el-form-item label="验证码获取地址">
          <el-input
            v-model="editForm.verify_url"
            placeholder="请输入验证码获取地址（可选）"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="editLoading"
            @click="handleSaveEdit"
          >
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 验证码对话框 -->
    <el-dialog
      v-model="verifyCodeDialogVisible"
      title="获取验证码"
      width="500px"
      @close="resetVerifyCodeDialog"
    >
      <div class="verify-code-content">
        <div class="account-info">
          <p><strong>账号:</strong> {{ currentAccount?.account }}</p>
          <p>
            <strong>验证码获取地址:</strong>
            {{ currentAccount?.verify_url || "未设置" }}
          </p>
        </div>

        <el-form
          ref="verifyCodeFormRef"
          :model="verifyCodeForm"
          label-width="100px"
          class="mt-4"
        >
          <el-form-item label="指令">
            <el-input
              v-model="verifyCodeForm.commands"
              placeholder="请输入指令（可选）"
              clearable
            />
          </el-form-item>
        </el-form>

        <div v-if="verifyCodeResult" class="verify-code-result">
          <el-alert
            title="验证码获取成功"
            type="success"
            :closable="false"
            class="mb-4"
          >
            <div class="verify-code-display">
              <strong>验证码：</strong>
              <span class="verify-code-text">{{ verifyCodeResult }}</span>
              <el-button
                type="primary"
                size="small"
                :icon="useRenderIcon(CopyDocument)"
                @click="copyVerifyCode"
              >
                复制
              </el-button>
            </div>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="verifyCodeDialogVisible = false">关闭</el-button>
          <el-button
            type="primary"
            :loading="verifyCodeLoading"
            @click="handleGetVerifyCodeSubmit"
          >
            获取验证码
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 密码验证弹层 -->
    <el-dialog
      v-model="passwordVerifyDialogVisible"
      title="身份验证"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="cancelPasswordVerify"
    >
      <div class="password-verify-content">
        <el-alert
          title="安全提示"
          description="为了保护账号安全，请输入您的登录密码以继续操作"
          type="warning"
          :closable="false"
          class="mb-4"
        />

        <el-form
          :model="passwordVerifyForm"
          label-width="80px"
          @submit.prevent="confirmPasswordVerify"
        >
          <el-form-item label="密码" required>
            <el-input
              v-model="passwordVerifyForm.password"
              type="password"
              placeholder="请输入登录密码"
              show-password
              clearable
              @keyup.enter="confirmPasswordVerify"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelPasswordVerify">取消</el-button>
          <el-button
            type="primary"
            :loading="passwordVerifyLoading"
            :disabled="!passwordVerifyForm.password.trim()"
            @click="confirmPasswordVerify"
          >
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import Delete from "@iconify-icons/ep/delete";
import Upload from "@iconify-icons/ep/upload";
import CopyDocument from "@iconify-icons/ep/document-copy";
import Key from "@iconify-icons/ep/key";
import Edit from "@iconify-icons/ep/edit";
import Download from "@iconify-icons/ep/download";
import { useVerifyAccountHook } from "./hook";

const {
  loading,
  dataList,
  columns,
  pagination,
  searchFormParams,
  selectedRows,
  importDialogVisible,
  importText,
  importLoading,
  editDialogVisible,
  editForm,
  editFormRules,
  editLoading,
  verifyCodeDialogVisible,
  verifyCodeForm,
  verifyCodeResult,
  verifyCodeLoading,
  currentAccount,
  getList,
  onSearch,
  resetForm,
  handleSelectionChange,
  handleSizeChange,
  handleCurrentChange,
  handleBatchDelete,
  handleDelete,
  handleEdit,
  handleCopyAccount,
  handleGetVerifyCode,
  openImportDialog,
  resetImportDialog,
  handleImport,
  resetEditForm,
  handleSaveEdit,
  resetVerifyCodeDialog,
  handleGetVerifyCodeSubmit,
  copyVerifyCode,
  formatDateTime,
  passwordVerifyDialogVisible,
  passwordVerifyForm,
  passwordVerifyLoading,
  cancelPasswordVerify,
  confirmPasswordVerify,
  handleExport,
  recordOperationLog
} = useVerifyAccountHook();

const searchFormRef = ref();
const tableRef = ref();
const editFormRef = ref();
const verifyCodeFormRef = ref();

// 页面加载时获取数据
onMounted(async () => {
  // 记录页面访问埋点
  await recordOperationLog(
    "page_init",
    "访问账号查码页面",
    "success",
    "用户访问账号查码页面"
  );
  getList();
});
</script>

<style scoped lang="scss">
.main {
  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }

  .import-content {
    .import-tips {
      margin-bottom: 16px;
    }

    .import-tabs {
      margin-bottom: 16px;
    }

    .import-textarea {
      width: 100%;
    }

    .preview-section {
      margin-top: 16px;

      h4 {
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }

      .preview-table {
        margin-bottom: 8px;
      }

      .preview-more {
        text-align: center;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }
  }

  .verify-code-content {
    .account-info {
      padding: 16px;
      background-color: var(--el-bg-color-page);
      border-radius: 4px;
      margin-bottom: 16px;

      p {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: var(--el-text-color-regular);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .verify-code-result {
      margin-top: 16px;

      .verify-code-display {
        display: flex;
        align-items: center;
        gap: 8px;

        .verify-code-text {
          font-family: "Consolas", "Monaco", monospace;
          font-size: 16px;
          font-weight: bold;
          color: var(--el-color-primary);
          padding: 4px 8px;
          background-color: var(--el-bg-color);
          border-radius: 4px;
        }
      }
    }
  }

  .password-verify-content {
    .password-verify-form {
      margin-top: 16px;
    }
  }
}
</style>
