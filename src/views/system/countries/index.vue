<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="关键词" prop="keyword">
        <el-input
          v-model="searchFormParams.keyword"
          placeholder="请输入中文名称、英文名称、国家代码"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="请选择"
          clearable
          class="!w-[160px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="searchFormLoading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="onReset(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 表格部分 -->
    <PureTableBar title="国家管理" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(CirclePlus)"
          @click="onAdd"
        >
          新增国家
        </el-button>
      </template>
      <template #default="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          align-whole="center"
          :loading="tableLoading"
          :size="size"
          :data="tableData"
          :columns="dynamicColumns"
          :header-cell-style="{
            background: 'var(--el-table-row-hover-bg-color)',
            color: 'var(--el-text-color-primary)'
          }"
          :pagination="pagination"
          @page-size-change="onPageSizeChange"
          @page-current-change="onPageChange"
        >
          <!-- 空数据展示 -->
          <template #empty>
            <div style="padding: 20px 0">
              <el-empty description="暂无数据" />
            </div>
          </template>

          <!-- 状态列 -->
          <template #status="{ row }">
            <el-tag
              :type="row.status === '1' ? 'success' : 'info'"
              disable-transitions
            >
              {{ row.status === "1" ? "启用" : "禁用" }}
            </el-tag>
          </template>

          <!-- 操作列 -->
          <template #operation="{ row }">
            <el-button
              v-if="row.status === 0 || row.status === '0'"
              class="reset-margin"
              link
              type="success"
              :size="size"
              :icon="useRenderIcon(Enable)"
              @click="onEnable(row)"
            >
              启用
            </el-button>
            <el-button
              v-if="row.status === 1 || row.status === '1'"
              class="reset-margin"
              link
              type="danger"
              :size="size"
              :icon="useRenderIcon(Disable)"
              @click="onDisable(row)"
            >
              禁用
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="onEdit(row)"
            >
              编辑
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="countryFormRef"
        :model="countryForm"
        label-width="120px"
        :rules="countryFormRules"
      >
        <el-form-item label="中文名称" prop="name_zh">
          <el-input
            v-model="countryForm.name_zh"
            placeholder="请输入中文名称"
          />
        </el-form-item>
        <el-form-item label="英文名称" prop="name_en">
          <el-input
            v-model="countryForm.name_en"
            placeholder="请输入英文名称"
          />
        </el-form-item>
        <el-form-item label="国家代码" prop="code">
          <el-input
            v-model="countryForm.code"
            placeholder="请输入三位字母代码"
          />
        </el-form-item>
        <el-form-item label="两位代码" prop="code2">
          <el-input
            v-model="countryForm.code2"
            placeholder="请输入两位字母代码"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="countryForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import CirclePlus from "@iconify-icons/ep/circle-plus";
import Disable from "@iconify-icons/ep/circle-close";
import Enable from "@iconify-icons/ep/circle-check";
import EditPen from "@iconify-icons/ep/edit-pen";
import { FormInstance } from "element-plus";

defineOptions({
  name: "CountriesManage"
});

const formRef = ref<FormInstance>();
const countryFormRef = ref<FormInstance>();
const dialogVisible = ref(false);
const dialogTitle = ref("新增国家");
const submitLoading = ref(false);
const tableRef = ref();

const {
  searchFormParams,
  searchFormRules,
  searchFormLoading,
  tableLoading,
  tableData,
  pagination,
  countryForm,
  countryFormRules,
  columns,
  onSearch,
  onReset,
  onAdd,
  onEdit,
  onEnable,
  onDisable,
  onPageChange,
  onPageSizeChange,
  submitForm,
  isEdit
} = useHook(dialogVisible, dialogTitle, submitLoading, countryFormRef);

// 添加状态选项
const statusOptions = [
  { label: "启用", value: "1" },
  { label: "禁用", value: "0" }
];
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
