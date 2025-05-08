<template>
  <div class="main">
    <div>
      <el-form
        ref="formRef"
        :inline="true"
        :model="searchForm"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
      >
        <el-form-item label="仓库：" prop="warehouseId">
          <el-select
            v-model="searchForm.warehouseId"
            placeholder="请选择仓库"
            clearable
            class="!w-[180px]"
          >
            <el-option
              v-for="item in warehouseOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="货物名称：" prop="goodsName">
          <el-input
            v-model="searchForm.goodsName"
            placeholder="请输入货物名称"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item label="快递单号：" prop="trackingNo">
          <el-input
            v-model="searchForm.trackingNo"
            placeholder="请输入快递单号"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="onSearch"
          >
            搜索
          </el-button>
          <el-button
            :icon="Refresh"
            :loading="loading"
            @click="resetForm(formRef)"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="main-content">
        <PureTableBar
          title="库存管理"
          :columns="columns as any"
          @refresh="getList"
        >
          <template #buttons>
            <el-button
              type="primary"
              :icon="Plus"
              :loading="loading"
              @click="handleStorage"
            >
              入库
            </el-button>
            <el-button
              type="success"
              :icon="useRenderIcon(ExcelFile)"
              :loading="loading"
              @click="handleImport"
            >
              导入入库
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              :disabled="!selectedRows.length"
              :loading="loading"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </template>

          <transition name="fade" mode="out-in">
            <pure-table
              v-if="dataList.length > 0 || pageLoading"
              ref="tableRef"
              key="data-table"
              adaptive
              align-whole="center"
              table-layout="auto"
              :loading="pageLoading"
              :data="dataList"
              :columns="columns"
              :pagination="pagination"
              @page-size-change="handleSizeChange"
              @page-current-change="handleCurrentChange"
              @selection-change="handleSelectionChange"
            >
              <template #status="{ row }">
                <el-tag :type="statusMap[row.status]?.type" size="small">
                  {{ statusMap[row.status]?.label }}
                </el-tag>
              </template>
              <template #operation="{ row }">
                <!-- <el-button
              v-if="hasPerms(['forecast:scan'])"
              type="primary"
              link
              :icon="Tickets"
              @click="openScanDialog(row)"
            >
              扫码入库
            </el-button> -->
                <el-button
                  v-if="hasPerms(['forecast:update'])"
                  type="warning"
                  link
                  :icon="Edit"
                  :loading="editBtnLoading[row.id]"
                  @click="openEditDialog(row)"
                >
                  修改
                </el-button>
                <el-button
                  v-if="
                    hasPerms(['forecast:delete']) && parseInt(row.status) < 9
                  "
                  type="danger"
                  link
                  :icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
                <el-button
                  v-if="hasPerms(['stock:settle']) && row.status === 2"
                  type="success"
                  link
                  :icon="Money"
                  @click="handleSettlement(row)"
                >
                  结算
                </el-button>
              </template>
            </pure-table>

            <div v-else key="empty-placeholder" class="empty-placeholder">
              <el-empty description="暂无数据" />
            </div>
          </transition>
        </PureTableBar>
      </div>

      <!-- 导入表单弹窗 -->
      <import-form
        v-model:visible="importDialogVisible"
        :warehouse-options="warehouseOptions"
        @success="getList"
      />

      <!-- 入库表单弹窗 -->
      <storage-form
        v-model:visible="storageDialogVisible"
        :title="storageDialogTitle"
        :row="currentRow"
        :warehouse-options="warehouseOptions"
        @success="getList"
      />

      <!-- 添加预报详情弹窗组件 -->
      <forecast-detail
        v-model:visible="detailDialogVisible"
        :row="currentRow"
      />

      <!-- 添加结算表单组件 -->
      <settlement-form
        v-model:visible="settlementDialogVisible"
        :row="currentSettlementRow"
        @success="getList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import { useHook } from "@/views/warehouse/stock/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ImportForm from "./import-form.vue";
import StorageForm from "./storage-form.vue";
// 导入预报详情组件
import ForecastDetail from "./forecast-detail.vue";
import { hasPerms } from "@/utils/auth";
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Check,
  Money,
  Edit
} from "@element-plus/icons-vue";
// 引入Excel图标
import Document from "@iconify-icons/ep/document";
// 引入更具体的Excel图标
import ExcelFile from "@iconify-icons/ri/file-excel-2-line";
// 导入结算表单组件
import SettlementForm from "./settlement-form.vue";

const statusMap = {
  "1": { type: "info", label: "待入库" },
  "2": { type: "primary", label: "已入库" },
  "3": { type: "success", label: "已结算" }
} as const;

const route = useRoute();
const {
  formRef,
  searchForm,
  loading,
  pageLoading,
  dataList,
  pagination,
  columns,
  tableRef,
  warehouseOptions,
  importDialogVisible,
  currentRow,
  onSearch,
  resetForm,
  getList,
  handleSelectionChange,
  handleImport,
  handleSizeChange,
  handleCurrentChange,
  getWarehouseOptions,
  detailDialogVisible,
  handleStorage,
  storageDialogVisible,
  storageDialogTitle,
  handleDelete,
  handleBatchDelete,
  selectedRows,
  settlementDialogVisible,
  currentSettlementRow,
  handleSettlement
} = useHook();

const editBtnLoading = ref<Record<string | number, boolean>>({});
const openEditDialog = (row: any) => {
  currentRow.value = row;
  detailDialogVisible.value = true;
};

onMounted(async () => {
  // 首先获取仓库选项
  await getWarehouseOptions();

  // 检查 URL 中是否有参数，并在发起请求前直接设置这些参数
  if (route.query.warehouse_id) {
    // 直接设置值
    searchForm.warehouseId = route.query.warehouse_id as string;
    console.log("从 URL 中设置的仓库 ID:", searchForm.warehouseId);

    // 等待下一个 DOM 更新周期再发起请求
    await nextTick();

    // 此时参数已正确设置，获取列表数据
    getList();
  } else {
    // URL 中没有仓库 ID，直接获取所有数据
    getList();
  }
});

// 监听路由变化以支持从其他页面跳转
watch(
  () => route.query,
  query => {
    if (query.warehouse_id) {
      console.log("路由变化 - 设置仓库ID:", query.warehouse_id);
      searchForm.warehouseId = String(query.warehouse_id); // Convert to string
      getList();
    }
  },
  { deep: true }
);
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
