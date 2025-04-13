<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import { useUserStoreHook } from "@/store/modules/user";
import View from "@iconify-icons/ep/view";
import Form from "./form.vue";

defineOptions({
  name: "GoodsManage"
});

const formRef = ref();
const tableRef = ref();
const dialogVisible = ref(false);
const dialogTitle = ref("");
const currentRow = ref({});

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
  multipleSelection,
  handleBatchDelete,
  handleSelectionChange
} = useHook();

// 在组件挂载后立即获取数据
onMounted(() => {
  console.log("组件挂载，获取数据");
  getList();
});

function openDialog(title: string, row?: any) {
  dialogTitle.value = title;
  dialogVisible.value = true;
  if (row) {
    currentRow.value = { ...row };
  } else {
    currentRow.value = {};
  }
}

// 调试输出
console.log("初始化时的数据列表:", dataList.value);

// 计算是否有选中项
const hasSelected = computed(
  () => multipleSelection.value && multipleSelection.value.length > 0
);
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
        <el-form-item label="货物名称：" prop="name">
          <el-input
            v-model="searchFormParams.name"
            placeholder="请输入货物名称"
            clearable
            class="!w-[160px]"
          />
        </el-form-item>
        <el-form-item label="状态：" prop="status">
          <el-select
            v-model="searchFormParams.status"
            placeholder="请选择"
            clearable
            class="!w-[160px]"
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

      <PureTableBar title="货物列表" :columns="columns" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增
          </el-button>

          <!-- 添加批量删除按钮 -->
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
            @page-size-change="getList"
            @page-current-change="getList"
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
          </pure-table>
        </template>
      </PureTableBar>
    </div>

    <Form
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :row="currentRow"
      :is-view="dialogTitle === '查看'"
      @success="getList"
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

:deep(.alias-tags-container) {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .alias-tag-item {
    display: flex;
    align-items: center;

    .region-tag {
      margin-right: 8px;
      min-width: 40px;
      text-align: center;
    }

    .alias-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
