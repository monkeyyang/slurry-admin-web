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
      <el-form-item label="国家/地区" prop="country">
        <el-select
          v-model="searchFormParams.country"
          placeholder="请选择国家"
          clearable
          :loading="countriesLoading"
          class="!w-[140px] !min-w-[100px]"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="item in countriesList"
            :key="item.code"
            :label="item.name_zh"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-[120px] !min-w-[100px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="登录状态" prop="loginStatus">
        <el-select
          v-model="searchFormParams.loginStatus"
          placeholder="请选择登录状态"
          clearable
          class="!w-[120px] !min-w-[100px]"
        >
          <el-option
            v-for="item in loginStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户昵称" prop="importedBy">
        <el-input
          v-model="searchFormParams.importedBy"
          placeholder="请输入导入者昵称"
          clearable
          class="!w-[140px] !min-w-[120px]"
        />
      </el-form-item>
      <el-form-item label="导入时间" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-[280px] !min-w-[240px]"
          @change="handleDateRangeChange"
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
    <PureTableBar title="账号管理" :columns="columns" @refresh="onSearch">
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
          <!-- 状态 -->
          <template #status="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>

          <!-- 登录状态 -->
          <template #loginStatus="{ row }">
            <el-tag :type="getLoginStatusTagType(row.loginStatus)">
              {{ getLoginStatusText(row.loginStatus) }}
            </el-tag>
          </template>

          <!-- 绑定计划信息 -->
          <template #planInfo="{ row }">
            <div v-if="row.plan" class="plan-info">
              <div class="plan-name">{{ row.plan.name || "未知计划" }}</div>
              <div class="plan-details">
                <!-- 当前天数/总天数 -->
                <el-tag size="small" type="primary">
                  第{{ row.currentPlanDay || 0 }}天/{{
                    row.plan.plan_days || 0
                  }}天
                </el-tag>
                <!-- 计划金额 -->
                <el-tag size="small" type="success">
                  计划: {{ row.plan.total_amount || 0 }}
                </el-tag>
                <!-- 浮动金额 -->
                <el-tag size="small" type="warning">
                  浮动: {{ row.plan.float_amount || 0 }}
                </el-tag>
              </div>
            </div>
            <span v-else class="text-gray-400">未绑定</span>
          </template>

          <!-- 汇率信息 -->
          <template #rateInfo="{ row }">
            <div v-if="row.rate" class="rate-info">
              <div class="rate-name">
                {{ row.rate.name || "-" }}
              </div>
              <div class="rate-details">
                <!-- 汇率值 -->
                <el-tag size="small" type="success">
                  汇率: {{ row.rate.rate || "-" }}
                </el-tag>

                <!-- 根据 amount_constraint 显示不同信息 -->
                <template v-if="row.rate.amount_constraint === 'multiple'">
                  <el-tag size="small" type="info">
                    倍数: {{ row.rate.multiple_base || 0 }}
                  </el-tag>
                  <el-tag size="small" type="warning">
                    {{ row.rate.min_amount || 0 }}-{{
                      row.rate.max_amount || 0
                    }}
                  </el-tag>
                </template>

                <template v-else-if="row.rate.amount_constraint === 'fixed'">
                  <el-tag size="small" type="primary">
                    固定: {{ formatFixedAmounts(row.rate.fixed_amounts) }}
                  </el-tag>
                </template>

                <template v-else-if="row.rate.amount_constraint === 'all'">
                  <el-tag size="small" type="success"> 全面额 </el-tag>
                </template>

                <template v-else-if="row.rate.amount_constraint">
                  <el-tag size="small" type="info">
                    {{ getAmountConstraintText(row.rate.amount_constraint) }}
                  </el-tag>
                </template>
              </div>
            </div>
            <span v-else class="text-gray-400">无汇率信息</span>
          </template>

          <!-- 群聊名称 -->
          <template #roomName="{ row }">
            <span v-if="row.room && row.room.room_name" class="text-blue-600">
              {{ row.room.room_name }}
            </span>
            <span v-else class="text-gray-400">未绑定群聊</span>
          </template>

          <!-- 创建人 -->
          <template v-if="hasCreateByPermission" #createdBy="{ row }">
            <span class="text-purple-600">
              {{ row.createdByName || "-" }}
            </span>
          </template>

          <!-- 绑定群聊 -->
          <template v-if="hasBindRoomPermission" #bindRoom="{ row }">
            <span v-if="row.bindRoom" class="text-green-600">
              {{ row.bindRoom }}
            </span>
            <span v-else class="text-gray-400">未绑定</span>
          </template>

          <!-- 导入者 -->
          <template #importedBy="{ row }">
            <span
              :class="row.importedByNickname ? 'imported-by' : 'text-muted'"
            >
              {{ row.importedByNickname || "未知" }}
            </span>
          </template>

          <!-- 导入时间 -->
          <template #importedAt="{ row }">
            <span :class="row.importedAt ? '' : 'text-muted'">
              {{ row.importedAt ? formatDateTime(row.importedAt) : "-" }}
            </span>
          </template>

          <!-- 创建时间 -->
          <template #createdAt="{ row }">
            <span class="text-gray-600">
              {{ formatDateTime(row.createdAt) }}
            </span>
          </template>

          <!-- 操作 -->
          <template #operation="{ row }">
            <div class="operation-buttons">
              <!-- 大屏幕显示所有按钮 -->
              <div class="desktop-operations">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(View)"
                  @click="openDetailDialog(row)"
                >
                  详情
                </el-button>
                <el-button
                  class="reset-margin"
                  link
                  type="warning"
                  :size="size"
                  :icon="useRenderIcon(EditPen)"
                  @click="openStatusDialog(row)"
                >
                  修改状态
                </el-button>
                <el-button
                  v-if="!row.plan"
                  class="reset-margin"
                  link
                  type="success"
                  :size="size"
                  @click="openBindPlanDialog(row)"
                >
                  绑定计划
                </el-button>
                <el-button
                  v-else
                  class="reset-margin"
                  link
                  type="warning"
                  :size="size"
                  @click="handleUnbindFromPlan(row)"
                >
                  解绑计划
                </el-button>
                <el-popconfirm
                  :title="`确定要删除账号 ${row.account} 吗？`"
                  @confirm="handleDelete(row)"
                >
                  <template #reference>
                    <el-button
                      class="reset-margin"
                      link
                      type="danger"
                      :size="size"
                      :icon="useRenderIcon(Delete)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>

              <!-- 小屏幕显示下拉菜单 -->
              <div class="mobile-operations">
                <el-dropdown trigger="click">
                  <el-button :size="size" type="primary" link>
                    操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="openDetailDialog(row)">
                        <component :is="useRenderIcon(View)" />详情
                      </el-dropdown-item>
                      <el-dropdown-item @click="openStatusDialog(row)">
                        <component :is="useRenderIcon(EditPen)" />修改状态
                      </el-dropdown-item>
                      <el-dropdown-item @click="handleDelete(row)">
                        <component :is="useRenderIcon(Delete)" />删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 导入对话框 -->
    <ImportDialog
      v-model="importDialogVisible"
      :countries-list="countriesList"
      :countries-loading="countriesLoading"
      @success="handleImportSuccess"
    />

    <!-- 详情对话框 -->
    <DetailDialog
      v-model="detailDialogVisible"
      :account-id="currentAccountId"
    />

    <!-- 状态更改对话框 -->
    <StatusDialog
      v-model="statusDialogVisible"
      :current-account="currentAccount"
      @success="handleStatusChangeSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import ImportDialog from "./components/ImportDialog.vue";
import DetailDialog from "./components/DetailDialog.vue";
import StatusDialog from "./components/StatusDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import Upload from "@iconify-icons/ep/upload";
import View from "@iconify-icons/ep/view";
import { ArrowDown } from "@element-plus/icons-vue";

import type { Account, BatchImportAccountsRequest } from "@/api/trade/account";

defineOptions({
  name: "AccountManage"
});

const {
  tableRef,
  loading,
  countriesLoading,
  hasCreateByPermission,
  hasBindRoomPermission,
  columns,
  pagination,
  searchFormParams,
  dataList,
  countriesList,
  statusOptions,
  loginStatusOptions,
  getList,
  getCountriesList,
  onSearch,
  resetForm,
  handleDelete,
  handleBatchDelete,
  handleUpdateStatus,
  handleBatchImport,
  handleBindToPlan,
  handleUnbindFromPlan,
  handleUpdateLoginStatus,
  getStatusText,
  getStatusTagType,
  getLoginStatusText,
  getLoginStatusTagType,
  formatFixedAmounts,
  getAmountConstraintText
} = useHook();

const searchFormRef = ref();
const selectedRows = ref<Account[]>([]);
const dateRange = ref<string[]>([]);

// 对话框状态
const importDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const statusDialogVisible = ref(false);
const currentAccount = ref<Account | null>(null);
const currentAccountId = ref<string>("");

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

// 处理选择变化
const handleSelectionChange = (selection: Account[]) => {
  selectedRows.value = selection;
};

// 处理页面大小变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getList();
};

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getList();
};

// 处理日期范围变化
const handleDateRangeChange = (dates: string[]) => {
  if (dates && dates.length === 2) {
    searchFormParams.startTime = dates[0];
    searchFormParams.endTime = dates[1];
  } else {
    searchFormParams.startTime = "";
    searchFormParams.endTime = "";
  }
};

// 打开导入对话框
const openImportDialog = () => {
  importDialogVisible.value = true;
};

// 打开详情对话框
const openDetailDialog = (row: Account) => {
  currentAccountId.value = row.id || "";
  detailDialogVisible.value = true;
};

// 打开状态更改对话框
const openStatusDialog = (row: Account) => {
  currentAccount.value = row;
  statusDialogVisible.value = true;
};

// 打开绑定计划对话框
const openBindPlanDialog = async (account: Account) => {
  try {
    // 这里可以实现一个选择计划的对话框，或者直接使用ElMessageBox
    const { value: planId } = await ElMessageBox.prompt(
      "请输入要绑定的计划ID:",
      "绑定计划",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S+/,
        inputErrorMessage: "计划ID不能为空"
      }
    );

    if (planId) {
      await handleBindToPlan(account, planId);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("绑定计划失败:", error);
    }
  }
};

// 处理导入成功
const handleImportSuccess = async (importData: BatchImportAccountsRequest) => {
  const result = await handleBatchImport(importData);
  if (result.success) {
    importDialogVisible.value = false;
  }
};

// 处理状态更改成功
const handleStatusChangeSuccess = async (
  account: Account,
  newStatus: string
) => {
  await handleUpdateStatus(account, newStatus);
  statusDialogVisible.value = false;
};

onMounted(() => {
  getList();
  getCountriesList();
});
</script>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  // 响应式布局优化
  @media (max-width: 1200px) {
    padding-left: 16px !important;

    :deep(.el-form-item) {
      margin-right: 8px;
    }
  }

  @media (max-width: 768px) {
    padding-left: 12px !important;

    :deep(.el-form-item) {
      margin-bottom: 8px;
      margin-right: 4px;

      .el-form-item__label {
        min-width: 60px !important;
      }
    }
  }
}

.text-muted {
  color: #999;
}

.imported-by {
  font-weight: 500;
  color: #409eff;
}

.text-blue-600 {
  color: #2563eb;
}

.text-purple-600 {
  color: #9333ea;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-600 {
  color: #4b5563;
}

.text-green-600 {
  color: #059669;
}

.plan-info {
  text-align: center;
}

.plan-name {
  font-size: 12px;
  margin-bottom: 4px;
  color: #303133;
  font-weight: 500;
}

.plan-details {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.rate-info {
  text-align: center;
}

.rate-name {
  font-size: 12px;
  margin-bottom: 4px;
  color: #303133;
  font-weight: 500;
}

.rate-details {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;

  .el-tag {
    margin: 1px;
    font-size: 11px;
  }
}

// 表格响应式优化
:deep(.pure-table) {
  .el-table {
    @media (max-width: 768px) {
      font-size: 12px;

      .el-table__cell {
        padding: 8px 4px;
      }

      .el-button {
        padding: 4px 8px;
        font-size: 12px;
      }
    }
  }
}

// 操作按钮响应式
.operation-buttons {
  .desktop-operations {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-operations {
    display: none;

    @media (max-width: 768px) {
      display: block;
      width: 100%;
      text-align: center;
    }
  }
}

// 操作列宽度优化
:deep(.pure-table) {
  @media (max-width: 768px) {
    .el-table__fixed-right {
      width: 80px !important;
    }

    .el-table__fixed-right-patch {
      width: 80px !important;
    }
  }
}
</style>
