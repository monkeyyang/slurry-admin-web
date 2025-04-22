<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { Tickets, Edit, Delete } from "@element-plus/icons-vue";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Upload from "@iconify-icons/ep/upload";
import { hasPerms } from "@/utils/auth";
import ImportExcel from "./components/ImportExcel.vue";
import AddUrl from "./components/AddUrl.vue";
import ScanDialog from "./components/ScanDialog.vue";
import EditDialog from "./components/EditDialog.vue";
import ImportStorage from "./components/ImportStorage.vue";

defineOptions({
  name: "PreorderManage"
});

const formRef = ref();
const addUrlVisible = ref(false);
const importExcelVisible = ref(false);
const dialogTitle = ref("");
const currentRow = ref<any>({});
const scanDialogVisible = ref(false);
const editDialogVisible = ref(false);
const importStorageVisible = ref(false);

const {
  searchFormParams,
  pageLoading,
  columns,
  dataList,
  pagination,
  onSearch,
  resetForm,
  handleDelete,
  handleBatchDelete,
  getList,
  tableRef
} = useHook();

// 选中的行
const selectedRows = ref<any[]>([]);

// 表格选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

// 状态映射
const statusMap = {
  "-3": { type: "info", label: "等待支付" },
  "-2": { type: "danger", label: "系统取消" },
  "-1": { type: "danger", label: "同步失败" },
  "0": { type: "warning", label: "待收货" },
  "1": { type: "primary", label: "第一步" },
  "2": { type: "primary", label: "正在处理" },
  "3": { type: "primary", label: "准备发货" },
  "4": { type: "primary", label: "货物运输" },
  "5": { type: "primary", label: "订单完成" },
  "9": { type: "success", label: "已入库" },
  "10": { type: "success", label: "已结算" }
} as const;

// 打开URL输入弹窗
const openAddUrlDialog = () => {
  addUrlVisible.value = true;
};

// 打开Excel导入弹窗
const openImportDialog = () => {
  importExcelVisible.value = true;
};

// 打开扫码弹窗
const openScanDialog = (row: any) => {
  currentRow.value = row;
  scanDialogVisible.value = true;
};

// 打开编辑弹窗
const openEditDialog = (row: any) => {
  currentRow.value = row;
  editDialogVisible.value = true;
};

// 打开导入入库弹窗
const openImportStorageDialog = () => {
  importStorageVisible.value = true;
};

onMounted(() => {
  getList();
});

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getList();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getList();
};
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="预报编号" prop="preorderNo">
        <el-input
          v-model="searchFormParams.preorderNo"
          placeholder="请输入预报编号"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item label="快递单号" prop="trackingNo">
        <el-input
          v-model="searchFormParams.trackingNo"
          placeholder="请输入快递单号"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-[180px]"
        >
          <el-option label="待收货" value="0" />
          <el-option label="已收货" value="1" />
          <el-option label="已发货" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="货物预报管理" :columns="columns" @refresh="getList">
      <template #buttons>
        <el-button
          v-if="hasPerms(['forecast:batch:delete'])"
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openAddUrlDialog"
        >
          新增预报
        </el-button>
        <el-button
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportDialog"
        >
          导入预报
        </el-button>
        <!-- <el-button
          v-if="hasPerms(['warehouse:preorder:inbound'])"
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportStorageDialog"
        >
          批量入库
        </el-button> -->
      </template>

      <pure-table
        ref="tableRef"
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
          <el-button
            v-if="hasPerms(['forecast:scan'])"
            type="primary"
            link
            :icon="Tickets"
            @click="openScanDialog(row)"
          >
            扫码入库
          </el-button>
          <el-button
            v-if="hasPerms(['forecast:update'])"
            type="warning"
            link
            :icon="Edit"
            @click="openEditDialog(row)"
          >
            修改
          </el-button>
          <el-button
            v-if="hasPerms(['forecast:delete'])"
            type="danger"
            link
            :icon="Delete"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </pure-table>
    </PureTableBar>

    <!-- URL输入弹窗 -->
    <AddUrl v-model:visible="addUrlVisible" @success="getList" />

    <!-- Excel导入弹窗 -->
    <ImportExcel v-model:visible="importExcelVisible" @success="getList" />

    <!-- 扫码弹窗 -->
    <ScanDialog
      v-model:visible="scanDialogVisible"
      :row="currentRow"
      @success="getList"
    />

    <!-- 编辑弹窗 -->
    <EditDialog
      v-model:visible="editDialogVisible"
      :row="currentRow"
      @success="getList"
    />

    <!-- 导入入库弹窗 -->
    <ImportStorage v-model:visible="importStorageVisible" @success="getList" />
  </div>
</template>

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
