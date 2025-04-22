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
            >
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleViewDetail(row)">
                    详情
                  </el-button>
                  <el-button link type="danger" @click="handleDelete(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </pure-table>
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

      <!-- 匹配结果弹层 -->
      <el-dialog v-model="matchDialogVisible" title="匹配结果" width="800px">
        <el-table :data="matchedItems">
          <el-table-column label="货物名称" prop="goodsName" />
          <el-table-column label="快递单号" prop="trackingNo" />
          <el-table-column label="匹配状态">
            <template #default="{ row }">
              <el-tag :type="row.matched ? 'success' : 'info'">
                {{ row.matched ? "已匹配" : "未匹配" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleConfirmStockIn(row)">
                确认入库
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>

      <!-- 客户预报详情弹层 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="客户预报详情"
        width="600px"
      >
        <el-descriptions :column="1" border>
          <el-descriptions-item label="客户名称">
            {{ customerOrderDetail?.customerName }}
          </el-descriptions-item>
          <el-descriptions-item label="货物名称">
            {{ customerOrderDetail?.goodsName }}
          </el-descriptions-item>
          <el-descriptions-item label="快递单号">
            {{ customerOrderDetail?.trackingNo }}
          </el-descriptions-item>
          <el-descriptions-item label="仓库">
            {{ customerOrderDetail?.warehouseName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ customerOrderDetail?.createTime }}
          </el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useHook } from "@/views/warehouse/stock/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ImportForm from "./import-form.vue";
import StorageForm from "./storage-form.vue";
import ForecastForm from "./forecast-form.vue";
import { Search, Refresh, Plus, Delete } from "@element-plus/icons-vue";
// 引入Excel图标
import Document from "@iconify-icons/ep/document";
// 引入更具体的Excel图标
import ExcelFile from "@iconify-icons/ri/file-excel-2-line";
import { ElMessageBox } from "element-plus";

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
  dialogVisible,
  dialogTitle,
  currentRow,
  onSearch,
  resetForm,
  getList,
  handleSelectionChange,
  handleImport,
  handleEdit,
  handleSizeChange,
  handleCurrentChange,
  getWarehouseOptions,
  matchDialogVisible,
  matchedItems,
  detailDialogVisible,
  customerOrderDetail,
  handleConfirmStockIn,
  handleSettle,
  handleViewDetail,
  handleMatch,
  handleStorage,
  storageDialogVisible,
  storageDialogTitle,
  handleDelete,
  handleBatchDelete,
  selectedRows
} = useHook();

onMounted(() => {
  getWarehouseOptions();
  getList();
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
