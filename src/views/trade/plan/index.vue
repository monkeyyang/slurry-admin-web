<template>
  <div class="main">
    <!-- 搜索表单 -->
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="关键词：" prop="keyword">
        <el-input
          v-model="searchFormParams.keyword"
          placeholder="请输入计划名称"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="国家：" prop="countryId">
        <el-select
          v-model="searchFormParams.countryId"
          placeholder="请选择国家"
          clearable
          filterable
          :loading="countriesLoading"
          class="!w-[200px]"
        >
          <el-option
            v-for="item in countriesList"
            :key="item.id"
            :value="item.id"
            :label="item.name_zh"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-[180px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
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
    <PureTableBar title="计划管理" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openDialog()"
        >
          新增计划
        </el-button>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete(selectedRows)"
        >
          批量删除
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
          <!-- 总金额 -->
          <template #totalAmount="{ row }">
            <span class="font-medium text-orange-500">
              {{ row.totalAmount }}元
            </span>
          </template>

          <!-- 浮动金额 -->
          <template #floatAmount="{ row }">
            <span class="text-gray-600"> {{ row.floatAmount }}元 </span>
          </template>

          <!-- 兑换间隔 -->
          <template #exchangeInterval="{ row }">
            <span class="text-blue-600"> {{ row.exchangeInterval }}分钟 </span>
          </template>

          <!-- 天数间隔 -->
          <template #dayInterval="{ row }">
            <span class="text-purple-600"> {{ row.dayInterval }}小时 </span>
          </template>

          <!-- 状态 -->
          <template #status="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>

          <!-- 群聊绑定 -->
          <template #enableRoomBinding="{ row }">
            <el-tag :type="row.enableRoomBinding ? 'success' : 'info'">
              {{ row.enableRoomBinding ? "已开启" : "未开启" }}
            </el-tag>
          </template>

          <!-- 创建时间 -->
          <template #createdAt="{ row }">
            <span class="text-gray-600">
              {{ formatDateTime(row.createdAt) }}
            </span>
          </template>

          <!-- 操作 -->
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(View)"
              @click="openPreviewDialog(row)"
            >
              查看
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('edit', row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'disabled'"
              class="reset-margin"
              link
              type="success"
              :size="size"
              @click="handleUpdateStatus(row, 'enabled')"
            >
              启用
            </el-button>
            <el-button
              v-else
              class="reset-margin"
              link
              type="warning"
              :size="size"
              @click="handleUpdateStatus(row, 'disabled')"
            >
              禁用
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="info"
              :size="size"
              @click="openAddDaysDialog(row)"
            >
              添加天数
            </el-button>
            <el-popconfirm
              :title="`确定要删除计划 ${row.name} 吗？`"
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
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 新增/编辑对话框 -->
    <AddPlanDialog
      v-model="dialogVisible"
      :edit-data="currentEditData"
      @success="handleDialogSuccess"
    />

    <!-- 预览对话框 -->
    <PreviewDialog v-model="previewVisible" :plan-data="currentPreviewData" />

    <!-- 添加天数对话框 -->
    <AddDaysDialog
      v-model="addDaysVisible"
      :plan-data="currentAddDaysData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import AddPlanDialog from "./components/AddPlanDialog.vue";
import PreviewDialog from "./components/PreviewDialog.vue";
import AddDaysDialog from "./components/AddDaysDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import Plus from "@iconify-icons/ep/plus";
import View from "@iconify-icons/ep/view";

import type { PlanItem } from "@/api/trade/plan";

defineOptions({
  name: "PlanManagement"
});

const {
  tableRef,
  loading,
  countriesLoading,
  columns,
  pagination,
  searchFormParams,
  dataList,
  countriesList,
  statusOptions,
  getList,
  getCountriesList,
  onSearch,
  resetForm,
  handleDelete,
  handleBatchDelete,
  handleUpdateStatus,
  getStatusText,
  getStatusTagType
} = useHook();

const searchFormRef = ref();
const selectedRows = ref<PlanItem[]>([]);

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

// 对话框相关
const dialogVisible = ref(false);
const currentEditData = ref<PlanItem | null>(null);

// 预览对话框相关
const previewVisible = ref(false);
const currentPreviewData = ref<PlanItem | null>(null);

// 添加天数对话框相关
const addDaysVisible = ref(false);
const currentAddDaysData = ref<PlanItem | null>(null);

// 处理选择变化
const handleSelectionChange = (selection: PlanItem[]) => {
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

// 打开新增/编辑对话框
const openDialog = (type: "add" | "edit" = "add", row?: PlanItem) => {
  if (type === "edit" && row) {
    currentEditData.value = { ...row };
  } else {
    currentEditData.value = null;
  }
  dialogVisible.value = true;
};

// 打开预览对话框
const openPreviewDialog = (row: PlanItem) => {
  currentPreviewData.value = { ...row };
  previewVisible.value = true;
};

// 打开添加天数对话框
const openAddDaysDialog = (row: PlanItem) => {
  currentAddDaysData.value = { ...row };
  addDaysVisible.value = true;
};

// 处理对话框成功回调
const handleDialogSuccess = () => {
  getList();
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
}
</style>
