<script setup lang="ts">
import { ref } from "vue";
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
  name: "WarehouseManage"
});

const formRef = ref();
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
  handleSelectionChange,
  viewWarehouseStock,
  getCountryStyle
} = useHook();

function openDialog(title: string, row?: any) {
  dialogTitle.value = title;
  dialogVisible.value = true;
  if (row) {
    currentRow.value = { ...row };
  } else {
    currentRow.value = {};
  }
}
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
        <el-form-item label="仓库名称：" prop="name">
          <el-input
            v-model="searchFormParams.name"
            placeholder="请输入仓库名称"
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
            :loading="pageLoading"
            @click="onSearch"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <PureTableBar title="仓库列表" :columns="columns" @refresh="getList">
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('新增')"
          >
            新增仓库
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
            row-key="id"
            @page-size-change="getList"
            @page-current-change="getList"
            @selection-change="handleSelectionChange"
          >
            <template #empty>
              <div style="padding: 20px 0">
                <el-empty description="暂无数据" />
              </div>
            </template>
            <template #operation="{ row, size }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(View)"
                @click="viewWarehouseStock(row)"
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
            <template #country="{ row }">
              <el-tag
                v-if="row.country"
                :style="{
                  color: getCountryStyle(row.country).color,
                  backgroundColor: getCountryStyle(row.country).bg,
                  borderColor: getCountryStyle(row.country).color + '20'
                }"
              >
                {{ row.country_name_zh || row.country }}
                <span
                  v-if="row.country_name_en"
                  style="font-size: 12px; margin-left: 4px"
                >
                  ({{ row.country_name_en }})
                </span>
              </el-tag>
              <span v-else>-</span>
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

:deep(.goods-tags-container) {
  display: flex;
  flex-wrap: wrap;

  .goods-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }
}
</style>
