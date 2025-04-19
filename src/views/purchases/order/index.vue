<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { useHook } from "@/views/purchases/order/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { ElMessage } from "element-plus";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { hasPerms } from "@/utils/auth";
import Form from "./form.vue";

defineOptions({
  name: "PurchaseOrderManage"
});

const formRef = ref();
const dialogVisible = ref(false);
const dialogTitle = ref("");
const currentRow = ref({});
const supplierOptions = ref([
  { label: "供应商A", value: 1 },
  { label: "供应商B", value: 2 },
  { label: "供应商C", value: 3 }
]);

const {
  searchFormParams,
  pageLoading,
  columns,
  dataList,
  pagination,
  onSearch,
  resetForm,
  handleDelete,
  getList,
  tableRef
} = useHook();

function openDialog(title: string, row?: any) {
  console.log("openDialog被调用", title, row);
  dialogTitle.value = title;
  dialogVisible.value = true;
  if (row) {
    currentRow.value = { ...row };
  } else {
    currentRow.value = {};
  }
  // 强制更新弹窗状态
  nextTick(() => {
    console.log("dialogVisible:", dialogVisible.value);
    console.log("currentRow:", currentRow.value);
  });
}

onMounted(() => {
  // 检查权限
  console.log("是否有采购订单管理权限:", hasPerms("purchase:order:add"));
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

// 格式化时间
const formatDateTime = dateTimeStr => {
  if (!dateTimeStr) return "-";
  const date = new Date(dateTimeStr);
  return date.toLocaleString();
};

// 格式化金额
const formatAmount = amount => {
  if (amount === undefined || amount === null) return "0.00";
  return parseFloat(amount).toFixed(2);
};

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
        <el-form-item label="订单编号：" prop="orderNumber">
          <el-input
            v-model="searchFormParams.orderNumber"
            placeholder="请输入订单编号"
            clearable
            class="!w-[180px]"
          />
        </el-form-item>
        <el-form-item label="供应商：" prop="supplierId">
          <el-select
            v-model="searchFormParams.supplierId"
            placeholder="请选择供应商"
            clearable
            class="!w-[180px]"
          >
            <el-option
              v-for="item in supplierOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
            <el-option label="未审核" value="0" />
            <el-option label="已审核" value="1" />
            <el-option label="部分入库" value="2" />
            <el-option label="已完成" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单日期：" prop="dateRange">
          <el-date-picker
            v-model="searchFormParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="!w-[280px]"
          />
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

      <div class="main-content">
        <PureTableBar
          title="采购订单管理"
          :columns="columns"
          @refresh="getList"
        >
          <template #buttons>
            <el-button
              v-if="hasPerms('purchase:order:add')"
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openDialog('新增采购订单')"
            >
              新增采购订单
            </el-button>
          </template>

          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              ref="tableRef"
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
            >
              <template #operation="{ row, size }">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(EditPen)"
                  @click="openDialog('编辑采购订单', row)"
                >
                  编辑
                </el-button>

                <el-popconfirm
                  title="是否确认删除?"
                  @confirm="handleDelete(row)"
                >
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

              <!-- 自定义状态 -->
              <template #status="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>

              <!-- 自定义金额 -->
              <template #total_amount="{ row }">
                {{ formatAmount(row.totalAmount) }}
              </template>

              <!-- 自定义日期 -->
              <template #create_time="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </div>

      <!-- 表单弹窗 -->
      <Form
        v-model:visible="dialogVisible"
        :title="dialogTitle"
        :row="currentRow"
        :supplier-options="supplierOptions"
        @success="getList"
      />
    </div>
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
