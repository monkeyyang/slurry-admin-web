<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useHook } from "@/views/warehouse/stock/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import * as XLSX from "xlsx";
import { hasAuth, getAuths } from "@/router/utils";
import { hasPerms } from "@/utils/auth";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Download from "@iconify-icons/ep/download";
import Upload from "@iconify-icons/ep/upload";
import Check from "@iconify-icons/ep/check";
import RefreshLeft from "@iconify-icons/ep/refresh-left";
import { useUserStoreHook } from "@/store/modules/user";
import View from "@iconify-icons/ep/view";
import Form from "./import-form.vue";
import BatchForm from "./storage-form.vue";
import ForecastDetail from "./forecast-detail.vue";
import { getWarehouseListApi } from "@/api/warehouse/index";
import {
  settleInboundApi,
  resetSettleInboundApi
} from "@/api/warehouse/inbound";
import { useRouter } from "vue-router";
import { http } from "@/utils/http";
import Money from "@iconify-icons/ri/money-cny-circle-line";
import { UploadFilled } from "@element-plus/icons-vue";
import ImportForm from "./import-form.vue";
import {
  Refresh as RefreshIcon,
  Setting,
  FullScreen
} from "@element-plus/icons-vue";

defineOptions({
  name: "InboundManage"
});

const formRef = ref();
const dialogVisible = ref(false);
const batchDialogVisible = ref(false);
const dialogTitle = ref("");
const currentRow = ref({});
const warehouseOptions = ref<Array<{ value: string; label: string }>>([]);
const settleDialogVisible = ref(false);
const resetSettleDialogVisible = ref(false);
const currentSettleItem = ref(null);
const router = useRouter();

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
  multipleSelection,
  handleSelectionChange,
  importDialogVisible,
  importForm,
  orderDetailDialogVisible,
  currentOrderDetail,
  handleImportExcel,
  handleBatchStockIn,
  handleConfirmStockIn,
  handleSettle,
  handleViewOrderDetail,
  handleSizeChange,
  handleCurrentChange
} = useHook();

// 计算是否有选中项
const hasSelected = computed(
  () => multipleSelection.value && multipleSelection.value.length > 0
);

interface WarehouseQuery {
  pageNum: number;
  pageSize: number;
  status: string;
}

interface WarehouseResponse {
  code: number;
  data: {
    data: Array<{
      id: string;
      name: string;
    }>;
  };
  message: string;
}

interface SettleResponse {
  code: number;
}

// 获取仓库列表
const getWarehouseOptions = async () => {
  try {
    const response = (await getWarehouseListApi({
      page: 1,
      pageSize: 100,
      status: "1"
    })) as WarehouseResponse;

    if (response?.code === 0 && response?.data?.data) {
      warehouseOptions.value = response.data.data.map(item => ({
        label: item.name,
        value: item.id
      }));
    } else {
      console.warn("仓库API返回数据格式不符合预期", response);
      warehouseOptions.value = [];
    }
  } catch (error) {
    console.error("获取仓库列表失败", error);
    warehouseOptions.value = [];
  }
};

function openDialog(title: string, row?: any) {
  dialogTitle.value = title;
  dialogVisible.value = true;
  if (row) {
    currentRow.value = { ...row };
  } else {
    currentRow.value = {};
  }
}

function openBatchDialog() {
  batchDialogVisible.value = true;
}

// 打开结算确认弹窗
function openSettleDialog(row) {
  currentSettleItem.value = row;
  settleDialogVisible.value = true;
}

// 打开重置结算确认弹窗
function openResetSettleDialog(row) {
  currentSettleItem.value = row;
  resetSettleDialogVisible.value = true;
}

// 确认结算
async function confirmSettle() {
  try {
    const { code } = (await settleInboundApi(
      currentSettleItem.value.id
    )) as SettleResponse;
    if (code === 0) {
      ElMessage.success("结算成功");
      getList(); // 刷新列表
      settleDialogVisible.value = false;
    }
  } catch (error) {
    console.error("结算错误:", error);
    ElMessage.error("结算失败，请重试");
  }
}

// 确认重置结算状态
async function confirmResetSettle() {
  try {
    const { code } = (await resetSettleInboundApi(
      currentSettleItem.value.id
    )) as SettleResponse;
    if (code === 0) {
      ElMessage.success("重置结算状态成功");
      getList(); // 刷新列表
      resetSettleDialogVisible.value = false;
    }
  } catch (error) {
    console.error("重置结算状态错误:", error);
    ElMessage.error("重置结算状态失败，请重试");
  }
}

onMounted(() => {
  getWarehouseOptions();

  getList();
  onSearch();
});

// 获取状态样式
const getStatusType = status => {
  const statusMap = {
    0: "info", // 未审核
    1: "success", // 已审核
    2: "warning", // 部分入库
    3: "primary" // 已完成
  };
  return statusMap[status] || "info";
};

// 获取状态文本
const getStatusText = status => {
  const statusMap = {
    0: "未审核",
    1: "已审核",
    2: "部分入库",
    3: "已完成"
  };
  return statusMap[status] || "未知";
};

// 文件上传相关
const handleFileChange = (file: any) => {
  importForm.file = file.raw;
};
</script>

<template>
  <div class="app-main">
    <el-scrollbar>
      <div class="main-content">
        <!-- 搜索栏 -->
        <div class="search-bar mb-4">
          <el-form :inline="true" :model="searchFormParams">
            <el-form-item label="仓库">
              <el-select
                v-model="searchFormParams.warehouseId"
                placeholder="请选择仓库"
                clearable
                class="w-[180px]"
              >
                <el-option
                  v-for="item in warehouseOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="商品名称">
              <el-input
                v-model="searchFormParams.goodsName"
                placeholder="请输入商品名称"
                clearable
                class="w-[180px]"
              />
            </el-form-item>
            <el-form-item label="快递单号">
              <el-input
                v-model="searchFormParams.trackingNo"
                placeholder="请输入快递单号"
                clearable
                class="w-[180px]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSearch"> 搜索 </el-button>
              <el-button @click="resetForm(formRef)">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 标题栏 -->
        <div class="title-bar flex justify-between items-center mb-4">
          <span class="text-lg font-bold">库存管理</span>
          <div class="flex items-center gap-2">
            <el-button type="primary" @click="importDialogVisible = true">
              入库
            </el-button>
            <el-button @click="onSearch">
              <el-icon><RefreshIcon /></el-icon>
            </el-button>
            <el-button>
              <el-icon><Setting /></el-icon>
            </el-button>
            <el-button>
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 表格 -->
        <pure-table
          ref="tableRef"
          :loading="pageLoading"
          :data="dataList"
          :columns="columns"
          :pagination="pagination"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #status="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
            <el-tag v-if="row.matched" type="success" class="ml-2">
              已匹配
            </el-tag>
            <el-tag v-else type="warning" class="ml-2">
              未匹配到客户订单
            </el-tag>
          </template>

          <template #operation="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              link
              @click="handleConfirmStockIn(row.id)"
            >
              确认入库
            </el-button>
            <el-button
              v-if="row.status === 'stored' && row.matched"
              type="primary"
              link
              @click="handleViewOrderDetail(row.id)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'stored'"
              type="success"
              link
              @click="handleSettle(row.id)"
            >
              结算
            </el-button>
          </template>
        </pure-table>

        <!-- 单个入库表单 -->
        <Form
          v-model:visible="dialogVisible"
          :title="dialogTitle"
          :row="currentRow"
          :warehouse-options="warehouseOptions"
          @success="getList"
        />

        <!-- 批量入库表单 -->
        <BatchForm
          v-model:visible="batchDialogVisible"
          :warehouse-options="warehouseOptions"
          @success="getList"
        />

        <!-- 结算确认弹窗 -->
        <el-dialog
          v-model="settleDialogVisible"
          title="确认结算"
          width="30%"
          :close-on-click-modal="false"
        >
          <div class="settle-confirm-content">
            <p>
              确认将此订单标记为已结算吗？结算后将减少对应仓库货物的未结算数量。
            </p>
            <div v-if="currentSettleItem" class="settle-info">
              <p>
                <strong>仓库：</strong>{{ currentSettleItem.warehouse_name }}
              </p>
              <p><strong>货品：</strong>{{ currentSettleItem.goods_name }}</p>
              <p>
                <strong>数量：</strong>{{ currentSettleItem.quantity || 1 }}
              </p>
            </div>
          </div>
          <template #footer>
            <el-button @click="settleDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmSettle"
              >确认结算</el-button
            >
          </template>
        </el-dialog>

        <!-- 重置结算状态确认弹窗 -->
        <el-dialog
          v-model="resetSettleDialogVisible"
          title="重置结算状态"
          width="30%"
          :close-on-click-modal="false"
        >
          <div class="settle-confirm-content">
            <p>
              确认将此订单重置为未结算状态吗？重置后将增加对应仓库货物的未结算数量。
            </p>
            <div v-if="currentSettleItem" class="settle-info">
              <p>
                <strong>仓库：</strong>{{ currentSettleItem.warehouse_name }}
              </p>
              <p><strong>货品：</strong>{{ currentSettleItem.goods_name }}</p>
              <p>
                <strong>数量：</strong>{{ currentSettleItem.quantity || 1 }}
              </p>
              <p>
                <strong>结算人：</strong
                >{{ currentSettleItem.settle_user_name }}
              </p>
              <p>
                <strong>结算时间：</strong>{{ currentSettleItem.settle_time }}
              </p>
            </div>
          </div>
          <template #footer>
            <el-button @click="resetSettleDialogVisible = false"
              >取消</el-button
            >
            <el-button type="warning" @click="confirmResetSettle"
              >确认重置</el-button
            >
          </template>
        </el-dialog>

        <!-- 入库弹层 -->
        <el-dialog
          v-model="importDialogVisible"
          title="入库"
          width="600px"
          destroy-on-close
        >
          <el-form :model="importForm" label-width="80px">
            <el-form-item label="仓库" required>
              <el-select
                v-model="importForm.warehouseId"
                placeholder="请选择仓库"
                class="w-full"
              >
                <el-option
                  v-for="item in warehouseOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Excel">
              <el-upload
                class="w-full"
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
              >
                <template #trigger>
                  <el-button type="primary">选择文件</el-button>
                </template>
                <template #tip>
                  <div class="el-upload__tip">
                    请上传Excel文件，包含货物名称、快递单号、UPC/IMEI（可选）
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item label="或">
              <el-input
                v-model="importForm.textContent"
                type="textarea"
                :rows="5"
                placeholder="请输入货物名称、快递单号、UPC/IMEI，每行一条记录，用逗号分隔"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="importDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              @click="
                importForm.file
                  ? handleImportExcel(importForm.file)
                  : handleBatchStockIn()
              "
            >
              确定
            </el-button>
          </template>
        </el-dialog>

        <!-- 客户预报详情弹层 -->
        <el-dialog
          v-model="orderDetailDialogVisible"
          title="客户预报详情"
          width="600px"
        >
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户名称">
              {{ currentOrderDetail?.customerName }}
            </el-descriptions-item>
            <el-descriptions-item label="商品名称">
              {{ currentOrderDetail?.goodsName }}
            </el-descriptions-item>
            <el-descriptions-item label="快递单号">
              {{ currentOrderDetail?.trackingNo }}
            </el-descriptions-item>
            <el-descriptions-item label="仓库">
              {{ currentOrderDetail?.warehouseName }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ currentOrderDetail?.createTime }}
            </el-descriptions-item>
          </el-descriptions>
        </el-dialog>

        <!-- 导入表单组件 -->
        <ImportForm
          v-model:visible="importDialogVisible"
          :warehouse-options="warehouseOptions"
          @success="onSearch"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.app-main {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  :deep(.el-scrollbar) {
    height: 100%;
  }
}

.main-content {
  padding: 15px;
}

.search-bar {
  background-color: var(--el-bg-color);
  padding: 16px;
  border-radius: 4px;
}

.title-bar {
  background-color: var(--el-bg-color);
  padding: 16px;
  border-radius: 4px;
}

:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.warning-box {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 4px;

  .warning-title {
    color: #e6a23c;
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    align-items: center;

    .warning-icon {
      margin-right: 8px;
    }
  }

  .warning-list {
    margin: 0;
    padding-left: 24px;

    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  }
}

.settle-confirm-content {
  padding: 10px 0;
}

.settle-info {
  margin-top: 15px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 4px;

  p {
    margin: 5px 0;
  }
}
</style>
