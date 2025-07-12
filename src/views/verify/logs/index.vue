<template>
  <div class="main">
    <!-- 统计卡片 -->
    <div class="statistics-cards mb-4">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon primary">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  {{ operationStatistics.totalOperations }}
                </div>
                <div class="card-label">总操作数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon success">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  {{ operationStatistics.successOperations }}
                </div>
                <div class="card-label">成功操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon warning">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  {{ operationStatistics.failedOperations }}
                </div>
                <div class="card-label">失败操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon danger">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  {{ operationStatistics.todayCount }}
                </div>
                <div class="card-label">今日操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索表单 -->
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="操作类型：" prop="operation_type">
        <el-select
          v-model="searchFormParams.operation_type"
          placeholder="请选择操作类型"
          clearable
          class="!w-[150px]"
        >
          <el-option
            v-for="item in operationTypeOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="目标账号：" prop="target_account">
        <el-input
          v-model="searchFormParams.target_account"
          placeholder="请输入目标账号"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="操作结果：" prop="result">
        <el-select
          v-model="searchFormParams.result"
          placeholder="请选择操作结果"
          clearable
          class="!w-[120px]"
        >
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="密码错误" value="password_error" />
        </el-select>
      </el-form-item>
      <el-form-item label="用户：" prop="uid">
        <el-input
          v-model="searchFormParams.uid"
          placeholder="请输入用户ID"
          clearable
          class="!w-[150px]"
        />
      </el-form-item>
      <el-form-item label="操作时间：" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-[300px]"
          @change="handleDateRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="Search"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="resetForm(searchFormRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <PureTableBar title="操作记录" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="success"
          :icon="Refresh"
          :loading="statisticsLoading"
          @click="handleRefreshStatistics"
        >
          刷新统计
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :paginationSmall="size === 'small' ? true : false"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <!-- 操作类型 -->
          <template #operation_type="{ row }">
            <el-tag
              :type="getOperationTypeTagType(row.operation_type)"
              size="small"
              effect="light"
            >
              {{ getOperationTypeText(row.operation_type) }}
            </el-tag>
          </template>

          <!-- 操作结果 -->
          <template #result="{ row }">
            <el-tag
              :type="getResultTagType(row.result)"
              size="small"
              effect="light"
            >
              {{ getResultText(row.result) }}
            </el-tag>
          </template>

          <!-- 操作用户 -->
          <template #uid="{ row }">
            <span>{{ row.user?.nickname || "-" }}</span>
          </template>

          <!-- 操作时间 -->
          <template #created_at="{ row }">
            <span>{{ formatDateTime(row.created_at) }}</span>
          </template>

          <!-- 来源群聊 -->
          <template #room_name="{ row }">
            <span>{{ row.room_name || "-" }}</span>
          </template>

          <!-- 来源微信 -->
          <template #wx_nickname="{ row }">
            <span>{{ row.wx_nickname || "-" }}</span>
          </template>

          <!-- 操作 -->
          <template #operation="{ row }">
            <el-space>
              <el-button
                type="primary"
                size="small"
                :icon="View"
                @click="handleViewDetail(row)"
              >
                查看详情
              </el-button>
            </el-space>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="操作记录详情"
      width="600px"
      @close="resetDetailDialog"
    >
      <div v-if="currentRecord" class="detail-content">
        <h4>基本信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">
            {{ currentRecord.id }}
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag
              :type="getOperationTypeTagType(currentRecord.operation_type)"
              size="small"
              effect="light"
            >
              {{ getOperationTypeText(currentRecord.operation_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="目标账号">
            {{ currentRecord.target_account || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag
              :type="getResultTagType(currentRecord.result)"
              size="small"
              effect="light"
            >
              {{ getResultText(currentRecord.result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作用户">
            {{ currentRecord.user?.nickname || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ formatDateTime(currentRecord.created_at) }}
          </el-descriptions-item>
        </el-descriptions>

        <h4>详细信息</h4>
        <div class="details-display">
          <el-input
            v-model="currentRecord.details"
            type="textarea"
            :rows="4"
            readonly
            placeholder="无详细信息"
          />
        </div>

        <h4>用户代理</h4>
        <div class="user-agent-display">
          <el-input
            v-model="currentRecord.user_agent"
            type="textarea"
            :rows="2"
            readonly
            placeholder="无用户代理信息"
          />
        </div>

        <h4>IP地址</h4>
        <el-input
          v-model="currentRecord.ip_address"
          readonly
          placeholder="无IP地址信息"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  Search,
  Refresh,
  View,
  TrendCharts,
  Calendar,
  CircleCheck,
  Warning
} from "@element-plus/icons-vue";
import { useVerifyLogsHook } from "./hook";

const {
  loading,
  statisticsLoading,
  dataList,
  columns,
  pagination,
  searchFormParams,
  dateRange,
  selectedRows,
  operationStatistics,
  operationTypeOptions,
  detailDialogVisible,
  currentRecord,
  getList,
  getStatistics,
  onSearch,
  resetForm,
  handleSelectionChange,
  handleSizeChange,
  handleCurrentChange,
  handleDateRangeChange,
  handleViewDetail,
  resetDetailDialog,
  getOperationTypeTagType,
  getOperationTypeText,
  getResultTagType,
  getResultText,
  formatDateTime,
  handleRefreshStatistics
} = useVerifyLogsHook();

const searchFormRef = ref();
const tableRef = ref();

// 页面加载时获取数据
onMounted(() => {
  getList();
  getStatistics();
});
</script>

<style scoped lang="scss">
.main {
  .statistics-cards {
    .statistics-card {
      .card-content {
        display: flex;
        align-items: center;
        padding: 8px 0;

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;

          &.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          &.success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          &.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          &.danger {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
          }
        }

        .card-info {
          flex: 1;

          .card-value {
            font-size: 28px;
            font-weight: bold;
            color: var(--el-text-color-primary);
            line-height: 1;
            margin-bottom: 4px;
          }

          .card-label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }

  .detail-content {
    h4 {
      margin: 16px 0 8px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
      font-weight: 600;
    }

    .details-display,
    .user-agent-display {
      :deep(.el-textarea__inner) {
        font-family: "Consolas", "Monaco", monospace;
        font-size: 12px;
        background-color: var(--el-bg-color-page);
        border: 1px solid var(--el-border-color-light);
      }
    }
  }
}
</style>
