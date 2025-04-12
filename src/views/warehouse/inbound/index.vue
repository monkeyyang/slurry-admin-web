<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useHook } from "@/views/warehouse/inbound/hook";
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
import Form from "./form.vue";
import BatchForm from "./batch-form.vue";
import { getWarehouseListApi } from "@/api/warehouse/index";
import {
  settleInboundApi,
  resetSettleInboundApi
} from "@/api/warehouse/inbound";
import { useRouter } from "vue-router";
import { http } from "@/utils/http";

defineOptions({
  name: "InboundManage"
});

const formRef = ref();
const dialogVisible = ref(false);
const batchDialogVisible = ref(false);
const dialogTitle = ref("");
const currentRow = ref({});
const warehouseOptions = ref([]);
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
  getList
} = useHook();

// 添加多选相关变量
const multipleSelection = ref([]);
const hasSelected = computed(() => multipleSelection.value.length > 0);

interface WarehouseQuery {
  pageNum: number;
  pageSize: number;
  status: string;
}

interface WarehouseResponse {
  code: number;
  data: {
    data: Array<{
      id: number;
      name: string;
    }>;
  };
  message: string;
}

interface SettleResponse {
  code: number;
}

// Add type declaration for the imported API function
// declare const getWarehouseListApi: (
//   params: WarehouseQuery
// ) => Promise<WarehouseResponse>;

// 获取仓库列表
const getWarehouseOptions = async () => {
  try {
    // 使用类型断言指定响应类型
    const response = (await getWarehouseListApi({
      page: 1,
      pageSize: 100,
      status: "1"
    })) as WarehouseResponse;

    console.log("获取仓库列表响应:", response);

    if (
      response &&
      response.code === 0 &&
      response.data &&
      response.data.data
    ) {
      warehouseOptions.value = response.data.data.map(item => ({
        label: item.name,
        value: item.id
      }));
    } else {
      console.warn("仓库API返回数据格式不符合预期", response);
      warehouseOptions.value = []; // 确保设置为空数组
    }
  } catch (error) {
    console.error("获取仓库列表失败", error);
    warehouseOptions.value = []; // 确保设置为空数组
  }
};

// 前端直接生成并下载模板
const downloadTemplate = () => {
  try {
    // 定义模板表头，根据截图调整
    const headers = [
      "订单编号",
      "货品名称",
      "订单链接",
      "物流链接",
      "国家",
      "订单状态",
      "创建时间"
    ];

    // 创建示例数据（根据截图调整）
    const exampleData = [
      [
        "W1307514784",
        "iPhone 16 Pro Max 256GB Desert Titanium",
        "https://www.apple.com/xz/us/vieworder/W1307514784/paperID@icloud.com",
        "http://www.apps.ups.com/etracking/tracking.cgi?TypeInquiry",
        "us",
        "准备发货",
        "2023-03-20 08:28:25"
      ],
      ["", "", "", "", "", "", ""]
    ];

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 订单编号
      { wch: 40 }, // 货品名称
      { wch: 60 }, // 订单链接
      { wch: 60 }, // 物流链接
      { wch: 10 }, // 国家
      { wch: 15 }, // 订单状态
      { wch: 20 } // 创建时间
    ];
    worksheet["!cols"] = colWidths;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "入库模板");

    // 下载文件
    XLSX.writeFile(workbook, "入库模板.xlsx");

    ElMessage.success("模板下载成功");
  } catch (error) {
    console.error("模板生成失败", error);
    ElMessage.error("模板下载失败");
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

// 处理表格选择变化
const handleSelectionChange = selection => {
  multipleSelection.value = selection;
};

onMounted(() => {
  getWarehouseOptions();
  // 检查单个权限
  console.log("是否有入库列表权限:", hasPerms("warehouse:inbound:list"));

  // 检查所有权限
  const testPermissions = [
    "warehouse:inbound:list",
    "warehouse:inbound:add",
    "warehouse:inbound:edit",
    "warehouse:inbound:delete",
    "warehouse:inbound:settle",
    "warehouse:inbound:reset-settle"
  ];

  testPermissions.forEach(perm => {
    console.log(`权限 ${perm}: ${hasPerms(perm) ? "有" : "无"}`);
  });
});

// 分页处理
const handlePageChange = (val: number) => {
  pagination.currentPage = val;
  getList();
};

const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  getList();
};
</script>

<template>
  <div class="main">
    <div>
      <el-form
        ref="formRef"
        :inline="true"
        :model="searchFormParams"
        class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
      >
        <el-form-item label="仓库：" prop="warehouseId">
          <el-select
            v-model="searchFormParams.warehouseId"
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
        <el-form-item label="货品名称：" prop="goodsName">
          <el-input
            v-model="searchFormParams.goodsName"
            placeholder="请输入货品名称"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item label="物流链接：" prop="trackingNumber">
          <el-input
            v-model="searchFormParams.trackingNumber"
            placeholder="请输入物流链接"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item label="状态：" prop="status">
          <el-select
            v-model="searchFormParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-[180px]"
          >
            <el-option
              v-for="dict in useUserStoreHook().dictionaryList['common.status']"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
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

      <PureTableBar title="入库管理" :columns="columns" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增入库')"
          >
            新增入库
          </el-button>
          <el-button
            type="success"
            :icon="useRenderIcon(Upload)"
            @click="openBatchDialog"
          >
            批量导入
          </el-button>
          <el-button
            type="info"
            :icon="useRenderIcon(Download)"
            @click="downloadTemplate"
          >
            下载模板
          </el-button>
          <el-button
            type="danger"
            :icon="useRenderIcon(Delete)"
            :disabled="!hasSelected"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            border
            adaptive
            align-whole="center"
            table-layout="auto"
            :loading="pageLoading"
            :size="size"
            :data="dataList"
            :columns="dynamicColumns"
            :pagination="pagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-table-row-hover-bg-color)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleSizeChange"
            @page-current-change="handlePageChange"
            @selection-change="handleSelectionChange"
          >
            <template #operation="{ row, size }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(View)"
                @click="openDialog('查看', row)"
              >
                查看
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('编辑', row)"
              >
                修改
              </el-button>

              <!-- 使用hasPerms函数检查权限 -->
              <el-button
                v-if="
                  hasPerms('warehouse:inbound:settle') && row.is_settled === 0
                "
                class="reset-margin"
                link
                type="success"
                :size="size"
                :icon="useRenderIcon(Check)"
                @click="openSettleDialog(row)"
              >
                结算
              </el-button>

              <!-- 使用hasAuth函数检查权限 -->
              <el-button
                v-if="
                  hasPerms('warehouse:inbound:reset-settle') &&
                  row.is_settled === 1
                "
                class="reset-margin"
                link
                type="warning"
                :size="size"
                :icon="useRenderIcon(RefreshLeft)"
                @click="openResetSettleDialog(row)"
              >
                重置结算
              </el-button>

              <el-popconfirm title="是否确认删除?" @confirm="handleDelete(row)">
                <template #reference>
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>

            <template #is_settled="{ row }">
              <el-tag :type="row.is_settled === 1 ? 'success' : 'info'">
                {{ row.is_settled === 1 ? "已结算" : "未结算" }}
              </el-tag>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>

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
          <p><strong>仓库：</strong>{{ currentSettleItem.warehouse_name }}</p>
          <p><strong>货品：</strong>{{ currentSettleItem.goods_name }}</p>
          <p><strong>数量：</strong>{{ currentSettleItem.quantity || 1 }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="settleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSettle">确认结算</el-button>
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
          <p><strong>仓库：</strong>{{ currentSettleItem.warehouse_name }}</p>
          <p><strong>货品：</strong>{{ currentSettleItem.goods_name }}</p>
          <p><strong>数量：</strong>{{ currentSettleItem.quantity || 1 }}</p>
          <p>
            <strong>结算人：</strong>{{ currentSettleItem.settle_user_name }}
          </p>
          <p><strong>结算时间：</strong>{{ currentSettleItem.settle_time }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="resetSettleDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmResetSettle"
          >确认重置</el-button
        >
      </template>
    </el-dialog>
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
