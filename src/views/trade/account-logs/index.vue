<template>
  <div class="main">
    <!-- 统计卡片 -->
    <div class="statistics-cards mb-4">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon success">
                <el-icon><SuccessFilled /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ statistics.successCount }}</div>
                <div class="card-label">成功次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon danger">
                <el-icon><CircleCloseFilled /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ statistics.failedCount }}</div>
                <div class="card-label">失败次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon warning">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ statistics.pendingCount }}</div>
                <div class="card-label">待处理</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="statistics-card">
            <div class="card-content">
              <div class="card-icon primary">
                <el-icon><Money /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">
                  {{ (statistics.totalAmount || 0).toFixed(2) }}
                </div>
                <div class="card-label">总金额</div>
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
      <el-form-item label="关键词：" prop="keyword">
        <el-input
          v-model="searchFormParams.keyword"
          placeholder="请输入账号或计划名称"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="账号：" prop="accountId">
        <el-select
          v-model="searchFormParams.accountId"
          placeholder="请选择账号"
          clearable
          filterable
          class="!w-[200px]"
        >
          <el-option
            v-for="item in accountsList"
            :key="item.id"
            :value="item.id"
            :label="item.account"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="计划：" prop="planId">
        <el-select
          v-model="searchFormParams.planId"
          placeholder="请选择计划"
          clearable
          filterable
          class="!w-[200px]"
        >
          <el-option
            v-for="item in plansList"
            :key="item.id"
            :value="item.id"
            :label="item.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="执行状态：" prop="executionStatus">
        <el-select
          v-model="searchFormParams.executionStatus"
          placeholder="请选择执行状态"
          clearable
          class="!w-[150px]"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="执行类型：" prop="executionType">
        <el-select
          v-model="searchFormParams.executionType"
          placeholder="请选择执行类型"
          clearable
          class="!w-[150px]"
        >
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="执行时间：" prop="dateRange">
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
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <PureTableBar title="执行记录" :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button
          type="success"
          :icon="useRenderIcon(Refresh)"
          :loading="statisticsLoading"
          @click="getStatistics"
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
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <!-- 账号 -->
          <template #account="{ row }">
            <span>{{ row.account_info?.account || row.account || "-" }}</span>
          </template>

          <!-- 计划信息 -->
          <template #planInfo="{ row }">
            <div v-if="row.plan_info" class="plan-info">
              <div class="plan-name">
                {{ row.plan_info.name || "未知计划" }}
              </div>
              <div class="plan-details">
                <!-- 当前天数/总天数 -->
                <el-tag size="small" type="primary">
                  第{{ row.day || 0 }}天/{{ row.plan_info.plan_days || 0 }}天
                </el-tag>
                <!-- 计划金额 -->
                <el-tag size="small" type="success">
                  计划: {{ row.plan_info.total_amount || 0 }}
                </el-tag>
                <!-- 浮动金额 -->
                <el-tag size="small" type="warning">
                  浮动: {{ row.plan_info.float_amount || 0 }}
                </el-tag>
              </div>
            </div>
            <span v-else class="text-gray-400">未绑定</span>
          </template>

          <!-- 群聊名称 -->
          <template #roomName="{ row }">
            <span>{{ row.room_name || "-" }}</span>
          </template>

          <!-- 汇率信息 -->
          <template #rateInfo="{ row }">
            <div v-if="row.rate_info" class="rate-info">
              <div class="rate-name">
                {{ row.rate_info.name || "-" }}
              </div>
              <div class="rate-details">
                <!-- 汇率值 -->
                <el-tag size="small" type="success">
                  汇率: {{ row.rate_info.rate || "-" }}
                </el-tag>

                <!-- 根据 amount_constraint 显示不同信息 -->
                <template v-if="row.rate_info.amount_constraint === 'multiple'">
                  <el-tag size="small" type="info">
                    倍数: {{ row.rate_info.multiple_base || 0 }}
                  </el-tag>
                  <el-tag size="small" type="warning">
                    {{ row.rate_info.min_amount || 0 }}-{{
                      row.rate_info.max_amount || 0
                    }}
                  </el-tag>
                </template>

                <template
                  v-else-if="row.rate_info.amount_constraint === 'fixed'"
                >
                  <el-tag size="small" type="primary">
                    固定: {{ formatFixedAmounts(row.rate_info.fixed_amounts) }}
                  </el-tag>
                </template>

                <template v-else-if="row.rate_info.amount_constraint === 'all'">
                  <el-tag size="small" type="success"> 全面额 </el-tag>
                </template>

                <template v-else-if="row.rate_info.amount_constraint">
                  <el-tag size="small" type="info">
                    {{
                      getAmountConstraintText(row.rate_info.amount_constraint)
                    }}
                  </el-tag>
                </template>
              </div>
            </div>
            <span v-else class="text-gray-400">无汇率信息</span>
          </template>

          <!-- 执行金额 -->
          <template #amount="{ row }">
            <span class="font-medium text-green-600">
              {{ row.amount }}
            </span>
          </template>

          <!-- 执行状态 -->
          <template #status="{ row }">
            <el-tag :type="getExecutionStatusTagType(row.status)">
              {{ row.status_text || row.status || "-" }}
            </el-tag>
          </template>

          <!-- 错误信息 -->
          <template #error_message="{ row }">
            <span v-if="row.error_message" class="text-red-500">
              {{ row.error_message }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>

          <!-- 兑换时间 -->
          <template #exchange_time="{ row }">
            <span class="text-gray-600">
              {{ formatDateTime(row.exchange_time) }}
            </span>
          </template>

          <!-- 创建时间 -->
          <template #created_at="{ row }">
            <span class="text-gray-600">
              {{ formatDateTime(row.created_at) }}
            </span>
          </template>

          <!-- 操作 -->
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(View)"
              @click="handleViewDetail(row)"
            >
              查看
            </el-button>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 详情弹窗 -->
    <DetailDialog v-model="detailVisible" :detail-data="currentDetailData" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  SuccessFilled,
  CircleCloseFilled,
  WarningFilled,
  Money
} from "@element-plus/icons-vue";

import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import View from "@iconify-icons/ep/view";
import { useHook } from "./hook";
import DetailDialog from "./components/DetailDialog.vue";
import type { ExecutionLog } from "@/api/trade/monitor";

const {
  tableRef,
  loading,
  statisticsLoading,
  countriesLoading,
  columns,
  pagination,
  searchFormParams,
  dateRange,
  dataList,
  countriesList,
  plansList,
  accountsList,
  statistics,
  todayStatistics,
  statusOptions,
  typeOptions,
  getList,
  getStatistics,
  getCountriesList,
  getPlansList,
  getAccountsList,
  onSearch,
  resetForm,
  handleDateRangeChange,
  handleSizeChange,
  handleCurrentChange,
  getExecutionStatusTagType,
  formatDateTime,
  formatFixedAmounts,
  getAmountConstraintText
} = useHook();

// 重新定义查看详情函数
const handleViewDetail = (row: ExecutionLog) => {
  currentDetailData.value = row;
  detailVisible.value = true;
};

const searchFormRef = ref();

// 详情弹窗相关
const detailVisible = ref(false);
const currentDetailData = ref<ExecutionLog | null>(null);

onMounted(() => {
  getList();
  getStatistics();
  getCountriesList();
  getPlansList();
  getAccountsList();
});
</script>

<style scoped lang="scss">
.statistics-cards {
  .statistics-card {
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    :deep(.el-card__body) {
      padding: 20px;
    }

    .card-content {
      display: flex;
      align-items: center;

      .card-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        .el-icon {
          font-size: 24px;
          color: white;
        }

        &.success {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }

        &.danger {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }

        &.warning {
          background: linear-gradient(135deg, #e6a23c, #ebb563);
        }

        &.primary {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }
      }

      .card-info {
        flex: 1;

        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
          margin-bottom: 8px;
        }

        .card-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

.search-form {
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 6px;
}

.rate-info {
  text-align: center;
}

.rate-name {
  font-size: 12px;
  margin-bottom: 4px;
  color: #303133;
  font-weight: 500;
}

.plan-info {
  text-align: center;
}

.plan-name {
  font-size: 12px;
  margin-bottom: 4px;
  color: #303133;
  font-weight: 500;
}
</style>
