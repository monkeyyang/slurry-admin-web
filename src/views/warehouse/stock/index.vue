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
          <el-button type="primary" :icon="Search" @click="onSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="main-content">
        <PureTableBar title="库存管理" :columns="columns" @refresh="getList">
          <template #buttons>
            <el-button type="primary" :icon="Plus" @click="handleStorage">
              入库
            </el-button>
            <el-button
              type="success"
              :icon="useRenderIcon(ExcelFile)"
              @click="handleImport"
            >
              导入入库
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              :disabled="!selectedRows.length"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </template>

          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              ref="tableRef"
              border
              adaptive
              align-whole="center"
              table-layout="auto"
              :loading="loading"
              :size="size"
              :data="dataList"
              :columns="dynamicColumns"
              :pagination="pagination"
              :paginationSmall="size === 'small'"
              :header-cell-style="{
                background: 'var(--el-table-row-hover-bg-color)',
                color: 'var(--el-text-color-primary)'
              }"
              @selection-change="handleSelectionChange"
              @page-size-change="handleSizeChange"
              @page-current-change="handleCurrentChange"
            />
          </template>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useHook } from "@/views/warehouse/stock/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ImportForm from "./import-form.vue";
import StorageForm from "./storage-form.vue";
// 导入预报详情组件
import ForecastDetail from "./forecast-detail.vue";
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Check,
  Money
} from "@element-plus/icons-vue";
// 引入Excel图标
import Document from "@iconify-icons/ep/document";
// 引入更具体的Excel图标
import ExcelFile from "@iconify-icons/ri/file-excel-2-line";

const route = useRoute();
const {
  formRef,
  searchForm,
  loading,
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
  matchDialogVisible,
  matchedItems,
  detailDialogVisible,
  handleConfirmStockIn,
  handleSettle,
  handleStorage,
  storageDialogVisible,
  storageDialogTitle,
  handleDelete,
  handleBatchDelete,
  selectedRows
} = useHook();

// 监听路由参数变化
onMounted(() => {
  getWarehouseOptions();
  getList();
  // 如果URL中有仓库ID参数，自动设置搜索条件并触发搜索
  if (route.query.warehouse_id) {
    searchForm.warehouse_id = route.query.warehouse_id;
    searchForm.warehouse_name = route.query.warehouse_name;
    getList();
  }
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
