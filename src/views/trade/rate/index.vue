<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { Edit, Delete, View } from "@element-plus/icons-vue";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { hasPerms } from "@/utils/auth";
import { useHook } from "./hook";
import AddRateDialog from "./components/AddRateDialog.vue";
import PreviewDialog from "./components/PreviewDialog.vue";
import type { RateItem } from "@/api/trade/rate";

defineOptions({
  name: "RateManage"
});

// 使用 hook
const {
  tableRef,
  loading,
  statistics,
  statisticsLoading,
  columns,
  pagination,
  searchFormParams,
  dataList,
  countriesList,
  groupsList,
  statusOptions,
  getList,
  getCountriesList,
  getGroupsList,
  getStatistics,
  onSearch,
  resetForm,
  handleDelete,
  handleBatchDelete,
  getConstraintText,
  getConstraintTagType
} = useHook();

// 响应式数据
const formRef = ref();
const selectedRows = ref<RateItem[]>([]);
const addDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const editData = ref<RateItem | null>(null);
const previewData = ref<RateItem | null>(null);

// 计算属性
const hasSelected = computed(() => selectedRows.value.length > 0);

// 群组标签颜色映射 - 扩展到16种颜色
const groupColors = [
  "group-tag-1",
  "group-tag-2",
  "group-tag-3",
  "group-tag-4",
  "group-tag-5",
  "group-tag-6",
  "group-tag-7",
  "group-tag-8",
  "group-tag-9",
  "group-tag-10",
  "group-tag-11",
  "group-tag-12",
  "group-tag-13",
  "group-tag-14",
  "group-tag-15",
  "group-tag-16"
];

// 存储已分配的群组颜色
const groupColorMap = ref(new Map<string, string>());

// 预分配群组颜色
const preAssignGroupColors = () => {
  const uniqueGroups = [
    ...new Set(dataList.value.map(item => item.groupName).filter(Boolean))
  ];
  groupColorMap.value.clear();

  uniqueGroups.forEach((groupName, index) => {
    const colorClass = groupColors[index % groupColors.length];
    groupColorMap.value.set(groupName, colorClass);
  });
};

// 根据群组名称获取标签样式类
const getGroupTagClass = (groupName: string) => {
  return groupColorMap.value.get(groupName) || "group-tag-1";
};

// 表格选择变化
const handleSelectionChange = (rows: RateItem[]) => {
  selectedRows.value = rows;
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getList().then(() => {
    preAssignGroupColors();
  });
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  getList().then(() => {
    preAssignGroupColors();
  });
};

// 新增汇率
const handleAdd = () => {
  editData.value = null;
  addDialogVisible.value = true;
};

// 编辑汇率
const handleEdit = (row: RateItem) => {
  editData.value = row;
  addDialogVisible.value = true;
};

// 预览汇率
const handlePreview = (row: RateItem) => {
  previewData.value = row;
  previewDialogVisible.value = true;
};

// 批量删除处理
const handleBatchDeleteClick = () => {
  handleBatchDelete(selectedRows.value);
};

// 对话框成功回调
const handleDialogSuccess = () => {
  getList().then(() => {
    preAssignGroupColors();
  });
};

// 重置表单
const handleReset = () => {
  resetForm(formRef.value).then(() => {
    preAssignGroupColors();
  });
};

// 搜索处理
const handleSearch = () => {
  onSearch().then(() => {
    preAssignGroupColors();
  });
};

// 初始化
onMounted(() => {
  getList().then(() => {
    preAssignGroupColors();
  });
  getCountriesList();
  getGroupsList();
});
</script>

<template>
  <div class="main">
    <!-- 搜索表单 -->
    <el-form
      ref="formRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="关键词" prop="keyword">
        <el-input
          v-model="searchFormParams.keyword"
          placeholder="请输入汇率名称或描述"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>

      <el-form-item label="国家/地区" prop="country">
        <el-select
          v-model="searchFormParams.country"
          placeholder="选择国家"
          clearable
          filterable
          class="!w-[150px]"
        >
          <el-option
            v-for="item in countriesList"
            :key="item.code"
            :value="item.code"
            :label="`${item.name_zh} (${item.code})`"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="群组" prop="roomId">
        <el-select
          v-model="searchFormParams.roomId"
          placeholder="选择群组"
          clearable
          filterable
          class="!w-[150px]"
        >
          <el-option
            v-for="item in groupsList"
            :key="item.id"
            :value="item.id"
            :label="item.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="选择状态"
          clearable
          class="!w-[120px]"
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
          @click="handleSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 表格工具栏 -->
    <PureTableBar title="汇率管理" :columns="columns" @refresh="getList">
      <template #buttons>
        <el-button
          v-if="hasPerms(['rate:create'])"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新增汇率
        </el-button>
        <el-button
          v-if="hasPerms(['rate:delete'])"
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="!hasSelected"
          @click="handleBatchDeleteClick"
        >
          批量删除
        </el-button>
      </template>

      <pure-table
        ref="tableRef"
        border
        align-whole="center"
        showOverflowTooltip
        table-layout="auto"
        :loading="loading"
        adaptive
        :data="dataList"
        :columns="columns"
        :pagination="pagination"
        :header-cell-style="{
          background: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-primary)'
        }"
        @selection-change="handleSelectionChange"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #operation="{ row }">
          <el-button
            v-if="hasPerms(['rate:update'])"
            class="reset-margin"
            link
            type="primary"
            :icon="useRenderIcon(Edit)"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            class="reset-margin"
            link
            type="success"
            :icon="useRenderIcon(View)"
            @click="handlePreview(row)"
          >
            预览
          </el-button>
          <el-button
            v-if="hasPerms(['rate:delete'])"
            class="reset-margin"
            link
            type="danger"
            :icon="useRenderIcon(Delete)"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>

        <!-- 群聊列 -->
        <template #roomName="{ row }">
          <el-tag v-if="row.roomName" type="info" class="room-tag">
            {{ row.roomName }}
          </el-tag>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- 群组列 -->
        <template #groupName="{ row }">
          <el-tag
            v-if="row.groupName"
            :class="getGroupTagClass(row.groupName)"
            class="group-tag"
          >
            {{ row.groupName }}
          </el-tag>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- 面额约束列 -->
        <template #amountConstraint="{ row }">
          <div>
            <el-tag :type="getConstraintTagType(row.amountConstraint)">
              {{ getConstraintText(row.amountConstraint) }}
            </el-tag>
            <div class="constraint-details mt-1">
              <!-- 固定面额详情 -->
              <div
                v-if="
                  row.amountConstraint === 'fixed' && row.fixedAmounts?.length
                "
              >
                <small class="text-gray-600">
                  固定面额: ${{ row.fixedAmounts.join(", $") }}
                </small>
              </div>
              <!-- 倍数要求详情 -->
              <div v-else-if="row.amountConstraint === 'multiple'">
                <small class="text-gray-600">
                  <div v-if="row.multipleBase">
                    倍数: {{ row.multipleBase }}
                  </div>
                  <div>
                    最小:
                    {{ row.minAmount === 0 ? "无限制" : `$${row.minAmount}` }}
                  </div>
                  <div>
                    最大:
                    {{ row.maxAmount === 0 ? "无限制" : `$${row.maxAmount}` }}
                  </div>
                </small>
              </div>
            </div>
          </div>
        </template>

        <!-- 状态列 -->
        <template #status="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === "active" ? "启用" : "禁用" }}
          </el-tag>
        </template>

        <!-- 汇率列 -->
        <template #rate="{ row }">
          <span class="font-medium text-primary">{{ row.rate }}</span>
        </template>

        <!-- 创建时间列 -->
        <template #createdAt="{ row }">
          <span>{{ row.createdAt || "-" }}</span>
        </template>
      </pure-table>
    </PureTableBar>

    <!-- 新增/编辑弹窗 -->
    <AddRateDialog
      v-model="addDialogVisible"
      :edit-data="editData"
      @success="handleDialogSuccess"
    />

    <!-- 预览弹窗 -->
    <PreviewDialog v-model="previewDialogVisible" :rate-data="previewData" />
  </div>
</template>

<style scoped>
.main {
  margin: 0;
  padding: 0;
}

.search-form {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-radius: 6px;
}

.reset-margin {
  margin: 0 !important;
}

.constraint-details {
  font-size: 12px;
  line-height: 1.2;
}

.constraint-details small {
  color: #666;
}

.constraint-details div {
  margin: 2px 0;
}

.mt-1 {
  margin-top: 4px;
}

.text-gray-600 {
  color: #666;
}

.text-gray-400 {
  color: #9ca3af;
}

/* 群聊标签样式 - 固定背景色 */
.room-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  border-radius: 12px;
  padding: 4px 12px;
}

/* 群组标签基础样式 */
.group-tag {
  border: none !important;
  color: white !important;
  font-weight: 500;
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 群组标签不同颜色 */
.group-tag-1 {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%) !important;
}

.group-tag-2 {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%) !important;
}

.group-tag-3 {
  background: linear-gradient(135deg, #45b7d1 0%, #96c93d 100%) !important;
}

.group-tag-4 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
}

.group-tag-5 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
}

.group-tag-6 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
}

.group-tag-7 {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important;
}

.group-tag-8 {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important;
  color: #333 !important;
}

.group-tag-9 {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%) !important;
  color: #333 !important;
}

.group-tag-10 {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%) !important;
}

.group-tag-11 {
  background: linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%) !important;
}

.group-tag-12 {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%) !important;
  color: #333 !important;
}

.group-tag-13 {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%) !important;
  color: #333 !important;
}

.group-tag-14 {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%) !important;
  color: #333 !important;
}

.group-tag-15 {
  background: linear-gradient(135deg, #ff8a80 0%, #ea4c89 100%) !important;
}

.group-tag-16 {
  background: linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%) !important;
  color: #333 !important;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
