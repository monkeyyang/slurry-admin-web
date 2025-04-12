<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useHook } from "./hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import InviteCodeForm from "./form.vue";
import BatchGenerateForm from "./batch-form.vue";

import Delete from "@iconify-icons/ep/delete";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import InfoFill from "@iconify-icons/ep/info-filled";
import EditPen from "@iconify-icons/ep/edit-pen";
import More from "@iconify-icons/ep/more-filled";
import Download from "@iconify-icons/ep/download";
import Upload from "@iconify-icons/ep/upload";

defineOptions({
  name: "InviteCodeManagement"
});

const formRef = ref();
const batchFormRef = ref();
const {
  dataList,
  pagination,
  searchFormParams,
  pageLoading,
  getList,
  onSearch,
  resetForm,
  handleDelete,
  handleDisable
} = useHook();

function openDialog(type: string, row = null) {
  if (type === "add") {
    formRef.value.openDialog();
  } else if (type === "edit") {
    formRef.value.openDialog(row);
  } else if (type === "batch") {
    batchFormRef.value.openDialog();
  }
}

function handleSuccess() {
  getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="main">
    <el-card class="box-card !border-none" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">邀请码管理</span>
          <el-tooltip
            effect="dark"
            content="邀请码用于新用户注册，可以批量生成或单个创建"
            placement="top"
          >
            <el-icon class="cursor-pointer">
              <component :is="useRenderIcon(InfoFill)" />
            </el-icon>
          </el-tooltip>
        </div>
      </template>

      <PureTableBar
        title="邀请码列表"
        :columns="[
          {
            label: '邀请码',
            prop: 'code'
          },
          {
            label: '状态',
            prop: 'status'
          },
          {
            label: '创建人',
            prop: 'createdBy'
          },
          {
            label: '使用人',
            prop: 'usedBy'
          }
        ]"
        @refresh="getList"
      >
        <template #buttons>
          <el-button
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('add')"
          >
            新增邀请码
          </el-button>
          <el-button
            type="success"
            :icon="useRenderIcon(Upload)"
            @click="openDialog('batch')"
          >
            批量生成
          </el-button>
        </template>

        <template v-slot="{ size, dynamicColumns }">
          <div class="bg-bg_color w-full overflow-auto">
            <el-form
              ref="searchFormRef"
              :inline="true"
              :model="searchFormParams"
              class="search-form bg-bg_color px-8 py-5"
            >
              <el-form-item label="邀请码" prop="code">
                <el-input
                  v-model="searchFormParams.code"
                  placeholder="请输入邀请码"
                  clearable
                  class="!w-52"
                />
              </el-form-item>

              <el-form-item label="状态" prop="status">
                <el-select
                  v-model="searchFormParams.status"
                  placeholder="请选择状态"
                  clearable
                  class="!w-52"
                >
                  <el-option label="未使用" value="unused" />
                  <el-option label="已使用" value="used" />
                  <el-option label="已过期" value="expired" />
                </el-select>
              </el-form-item>

              <el-form-item label="创建人" prop="createdBy">
                <el-input
                  v-model="searchFormParams.createdBy"
                  placeholder="请输入创建人"
                  clearable
                  class="!w-52"
                />
              </el-form-item>

              <el-form-item label="使用人" prop="usedBy">
                <el-input
                  v-model="searchFormParams.usedBy"
                  placeholder="请输入使用人"
                  clearable
                  class="!w-52"
                />
              </el-form-item>

              <el-form-item label="创建时间" prop="timeRange">
                <el-date-picker
                  v-model="searchFormParams.timeRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  class="!w-52"
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
                <el-button :icon="useRenderIcon(Refresh)" @click="resetForm">
                  重置
                </el-button>
              </el-form-item>
            </el-form>

            <el-table
              v-loading="pageLoading"
              :data="dataList"
              style="width: 100%"
              :header-cell-style="{
                background: 'var(--el-table-row-hover-bg-color)',
                color: 'var(--el-text-color-primary)'
              }"
            >
              <el-table-column
                type="selection"
                width="55"
                align="center"
                fixed="left"
              />
              <el-table-column
                prop="code"
                label="邀请码"
                min-width="120"
                show-overflow-tooltip
                fixed="left"
              />
              <el-table-column prop="status" label="状态" min-width="100">
                <template #default="scope">
                  <el-tag
                    :type="
                      scope.row.status === 'unused'
                        ? 'success'
                        : scope.row.status === 'used'
                          ? 'info'
                          : 'danger'
                    "
                  >
                    {{
                      scope.row.status === "unused"
                        ? "未使用"
                        : scope.row.status === "used"
                          ? "已使用"
                          : "已过期"
                    }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="createdBy"
                label="创建人"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column
                prop="createdTime"
                label="创建时间"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column
                prop="usedBy"
                label="使用人"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column
                prop="usedTime"
                label="使用时间"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column
                prop="expireTime"
                label="过期时间"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column
                prop="remark"
                label="备注"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column
                label="操作"
                width="160"
                align="center"
                fixed="right"
              >
                <template #default="scope">
                  <el-button
                    v-if="scope.row.status === 'unused'"
                    type="primary"
                    link
                    :icon="useRenderIcon(EditPen)"
                    @click="openDialog('edit', scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="scope.row.status === 'unused'"
                    type="danger"
                    link
                    :icon="useRenderIcon(Delete)"
                    @click="handleDelete(scope.row.id)"
                  >
                    删除
                  </el-button>
                  <el-button
                    v-if="scope.row.status === 'unused'"
                    type="warning"
                    link
                    :icon="useRenderIcon(More)"
                    @click="handleDisable(scope.row.id)"
                  >
                    禁用
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="flex justify-end mt-4">
              <el-pagination
                v-model:current-page="pagination.currentPage"
                v-model:page-size="pagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :background="true"
                layout="total, sizes, prev, pager, next, jumper"
                :total="pagination.total"
                @size-change="getList"
                @current-change="getList"
              />
            </div>
          </div>
        </template>
      </PureTableBar>
    </el-card>

    <InviteCodeForm ref="formRef" @success="handleSuccess" />
    <BatchGenerateForm ref="batchFormRef" @success="handleSuccess" />
  </div>
</template>
