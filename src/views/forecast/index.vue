<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { Edit, Delete, WarningFilled } from "@element-plus/icons-vue";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Upload from "@iconify-icons/ep/upload";
import Spider from "@iconify-icons/ri/bug-line";
import { hasPerms } from "@/utils/auth";
import ImportForm from "./components/import-form.vue";
import AddUrl from "./components/AddUrl.vue";
import EditForm from "./components/EditForm.vue";
import { ElMessage } from "element-plus";
import { getCountryColorStyle } from "@/utils/countryColors";
import { getCountryCode } from "../hook"; // 假设已在hook中导出

const statusMap = {
  "-3": { type: "warning", label: "等待支付" },
  "-2": { type: "danger", label: "系统取消" },
  "-1": { type: "danger", label: "抓取数据失败" },
  "0": { type: "info", label: "正在爬取数据" },
  "1": { type: "primary", label: "第一步" },
  "2": { type: "primary", label: "正在处理" },
  "3": { type: "primary", label: "准备发货" },
  "4": { type: "primary", label: "货物运输" },
  "5": { type: "primary", label: "订单完成" },
  "9": { type: "success", label: "已入库" },
  "10": { type: "success", label: "已结算" }
} as const;

defineOptions({
  name: "PreorderManage"
});

const formRef = ref();
const addUrlVisible = ref(false);
const importFormVisible = ref(false);
const currentRow = ref<any>({});
const editDialogVisible = ref(false);

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
  tableRef,
  warehouseOptions,
  getWarehouseOptions,
  handleBatchAddToCrawlerQueue,
  warehouseLoading
} = useHook();

// 选中的行
const selectedRows = ref<any[]>([]);

// 表格选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows;
};

// 添加按钮加载状态变量
const editBtnLoading = ref<Record<string | number, boolean>>({});

// 打开URL输入弹窗
const openAddUrlDialog = () => {
  addUrlVisible.value = true;
};

// 打开Excel导入弹窗
const openImportDialog = () => {
  importFormVisible.value = true;
};

// 打开编辑弹窗
const openEditDialog = async (row: any) => {
  // 检查状态，已入库及以上状态不允许修改
  if (parseInt(row.status) >= 9) {
    ElMessage.error("已入库状态的预报不可修改");
    return;
  }

  // 设置当前行的加载状态
  editBtnLoading.value[row.id] = true;

  try {
    // 确保currentRow包含正确的字段名和仓库信息
    currentRow.value = {
      ...row,
      warehouseId:
        typeof row.warehouseId === "string"
          ? Number(row.warehouseId)
          : row.warehouseId,
      // 确保有仓库名称
      warehouseName: row.warehouseName
    };

    console.log("编辑预报数据:", currentRow.value);

    // 显示弹窗
    editDialogVisible.value = true;
  } catch (error) {
    console.error("加载编辑表单数据失败", error);
    ElMessage.error("加载数据失败，请重试");
  } finally {
    // 恢复按钮状态
    editBtnLoading.value[row.id] = false;
  }
};

onMounted(() => {
  getList();
  getWarehouseOptions(); // 获取真实仓库选项
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

// 添加处理函数
const handleUpdateSuccess = updatedData => {
  if (updatedData) {
    // 本地更新数据，避免整个列表刷新
    const index = dataList.value.findIndex(item => item.id === updatedData.id);
    if (index !== -1) {
      // 查找更新后的仓库名称
      const warehouseName = warehouseOptions.value.find(
        w => w.value === Number(updatedData.warehouseId)
      )?.label;

      console.log("找到匹配的仓库:", warehouseName);

      // 更新单条数据，保留其他字段不变
      dataList.value[index] = {
        ...dataList.value[index],
        productName: updatedData.productName,
        warehouseId: updatedData.warehouseId,
        warehouseName: warehouseName || dataList.value[index].warehouseName
      };

      console.log("已更新本地数据:", dataList.value[index]);

      // 使用一个标志变量避免重复刷新
      const refreshing = ref(false);

      // 只在没有刷新进行中时才启动延迟刷新
      if (!refreshing.value) {
        refreshing.value = true;

        // 延迟后台刷新，确保UI先更新
        setTimeout(() => {
          console.log("执行后台数据刷新");
          getList().finally(() => {
            refreshing.value = false;
          });
        }, 1000); // 缩短延迟时间
      }
    }
  } else {
    // 如果没有传递更新的数据，则直接刷新列表
    getList();
  }
};

// 处理加载仓库事件
const handleLoadWarehouses = () => {
  getWarehouseOptions();
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

    <PureTableBar
      title="货物预报管理"
      :columns="columns as any"
      @refresh="getList"
    >
      <template #buttons>
        <el-button
          type="success"
          :icon="useRenderIcon(Spider)"
          :disabled="!selectedRows.length"
          @click="handleBatchAddToCrawlerQueue(selectedRows)"
        >
          爬取订单
        </el-button>
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
            <el-tooltip
              v-if="row.status === '-1'"
              :content="row.crawler_error || '未获取到具体失败原因'"
              placement="top"
              effect="dark"
            >
              <el-tag type="danger" size="small">
                {{ statusMap[row.status]?.label }}
                <el-icon class="warning-icon">
                  <WarningFilled />
                </el-icon>
              </el-tag>
            </el-tooltip>
            <el-tag v-else :type="statusMap[row.status]?.type" size="small">
              {{ statusMap[row.status]?.label }}
            </el-tag>
          </template>
          <template #operation="{ row }">
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
              v-if="hasPerms(['forecast:delete']) && parseInt(row.status) < 9"
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </pure-table>

        <div v-else key="empty-placeholder" class="empty-placeholder">
          <el-empty description="暂无数据" />
        </div>
      </transition>
    </PureTableBar>

    <!-- URL输入弹窗 -->
    <AddUrl
      v-model:visible="addUrlVisible"
      :warehouse-options="warehouseOptions"
      @success="getList"
    />

    <!-- Excel导入弹窗 -->
    <ImportForm
      v-model:visible="importFormVisible"
      :warehouse-options="warehouseOptions"
      :warehouse-loading="warehouseLoading"
      @load-warehouses="handleLoadWarehouses"
      @success="getList"
    />

    <!-- 修改预报表单 -->
    <edit-form
      v-model:visible="editDialogVisible"
      :title="'修改预报'"
      :row="currentRow"
      :warehouse-options="warehouseOptions"
      @success="handleUpdateSuccess"
    />
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.empty-placeholder {
  padding: 40px 0;
}

.warning-icon {
  margin-left: 4px;
  font-size: 14px;
  color: #e6a23c;
  vertical-align: middle;
}

/* 确保样式正确应用到渲染的单元格上 */
:deep(.warehouse-column) {
  display: flex;
  align-items: center;
}

:deep(.warehouse-name) {
  font-weight: 500;
}

:deep(.el-tag) {
  white-space: nowrap;
}
</style>
