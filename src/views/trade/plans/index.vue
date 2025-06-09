<template>
  <div class="plans-container">
    <!-- 搜索和操作区域 -->
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>兑换计划管理</span>
          <div class="header-actions">
            <!-- 绑定群组开关 -->
            <div class="group-binding-switch">
              <el-switch
                v-model="groupBindingEnabled"
                active-text="绑定群组"
                inactive-text="独立执行"
                @change="handleGroupBindingChange"
              />
            </div>
            <el-button type="primary" @click="handleCreatePlan">
              <el-icon><Plus /></el-icon> 创建计划
            </el-button>
            <el-button type="success" @click="handleBatchExecute">
              <el-icon><VideoPlay /></el-icon> 批量执行
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.account"
            placeholder="请输入账号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="国家/地区">
          <el-select
            v-model="searchForm.country"
            placeholder="选择国家/地区"
            clearable
            filterable
            :loading="countriesLoading"
            :filter-method="filterCountries"
            style="width: 200px"
          >
            <el-option
              v-for="item in countriesList"
              :key="item?.code || item?.id"
              :value="item?.code || ''"
              :label="formatCountryLabel(item)"
            >
              <div class="country-simple-option">
                <span>{{ item?.name_zh || item?.code || "" }}</span>
                <span v-if="item?.name_en" class="country-en-name">
                  {{ item.name_en }} ({{ item?.code || "" }})
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待执行" value="draft" />
            <el-option label="进行中" value="processing" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <!-- 群组筛选 -->
        <el-form-item v-if="groupBindingEnabled" label="群组">
          <el-select
            v-model="searchForm.roomId"
            placeholder="选择群组"
            clearable
            filterable
            remote
            :remote-method="searchWechatRooms"
            :loading="roomsLoading"
            style="width: 200px"
          >
            <el-option
              v-for="room in wechatRooms"
              :key="room.roomId"
              :value="room.roomId"
              :label="room.roomName"
            >
              <div style="display: flex; justify-content: space-between">
                <span>{{ room.roomName }}</span>
                <span style="color: #8492a6; font-size: 13px">
                  {{ room.memberCount || 0 }}个成员
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 计划列表 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>计划列表</span>
          <div class="header-info">
            <el-tag type="info">共 {{ total }} 条记录</el-tag>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="plansList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="expand" width="30">
          <template #default="props">
            <div class="expand-content">
              <h4>计划详情1</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="计划ID">
                  {{ props.row.id }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ props.row.createdAt }}
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                  {{ props.row.updatedAt }}
                </el-descriptions-item>
                <el-descriptions-item label="备注">
                  {{ props.row.remark || "-" }}
                </el-descriptions-item>
              </el-descriptions>

              <h4 style="margin-top: 20px">充值明细</h4>
              <el-table :data="props.row.items || []" size="small" border>
                <el-table-column prop="day" label="天数" width="80" />
                <el-table-column prop="time" label="执行时间" width="180" />
                <el-table-column label="额度限制" width="150">
                  <template #default="scope">
                    <span
                      v-if="
                        scope.row.minAmount !== undefined &&
                        scope.row.maxAmount !== undefined
                      "
                    >
                      {{ scope.row.minAmount }}~{{ scope.row.maxAmount }}
                    </span>
                    <span v-else>{{ scope.row.amount || "0.00" }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="已兑换金额" width="120">
                  <template #default="scope">
                    <span class="executed-amount">{{
                      getExecutedAmount(scope.row)
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="说明" />
                <el-table-column label="执行状态" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="
                        getExecutionStatusType(
                          scope.row.executionStatus,
                          scope.row
                        )
                      "
                      size="small"
                    >
                      {{
                        getExecutionStatusText(
                          scope.row.executionStatus,
                          scope.row
                        )
                      }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="account" label="账号" min-width="150" />
        <el-table-column prop="country" label="国家" width="80" />
        <!-- 群组列 -->
        <el-table-column
          v-if="groupBindingEnabled"
          label="所属群组"
          width="200"
        >
          <template #default="scope">
            <div v-if="scope.row.wechatRoom" class="group-info">
              <div class="group-name">
                <el-tag type="primary" size="small">
                  {{ scope.row.wechatRoom.roomName }}
                </el-tag>
              </div>
              <div class="group-actions">
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="handleUnbindFromGroup(scope.row)"
                >
                  解绑
                </el-button>
              </div>
            </div>
            <el-button
              v-else
              link
              size="small"
              @click="handleBindToGroup(scope.row)"
            >
              绑定群组
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="100" />
        <el-table-column prop="chargedAmount" label="已充值" width="100">
          <template #default="scope">
            <span :class="{ 'text-success': scope.row.chargedAmount > 0 }">
              {{ scope.row.chargedAmount || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column label="进度" width="120">
          <template #default="scope">
            <el-progress
              :percentage="getProgress(scope.row)"
              :status="getProgressStatus(scope.row)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="plain">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewPlan(scope.row)"
            >
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              type="success"
              size="small"
              @click="handleStartPlan(scope.row)"
            >
              启动
            </el-button>
            <el-button
              v-if="scope.row.status === 'processing'"
              type="warning"
              size="small"
              @click="handlePausePlan(scope.row)"
            >
              暂停
            </el-button>
            <el-button
              v-if="scope.row.status === 'paused'"
              type="info"
              size="small"
              @click="handleResumePlan(scope.row)"
            >
              恢复
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleEditPlan(scope.row)"
            >
              编辑
            </el-button>
            <el-dropdown v-if="groupBindingEnabled" trigger="click">
              <el-button link size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleBindToGroup(scope.row)">
                    绑定群组
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="scope.row.wechatRoom"
                    @click="handleUnbindFromGroup(scope.row)"
                  >
                    解绑群组
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="danger"
              size="small"
              @click="handleDeletePlan(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 计划详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="计划详情"
      width="80%"
      destroy-on-close
    >
      <div v-if="currentPlan" class="plan-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="计划ID1">
            {{ currentPlan.id }}
          </el-descriptions-item>
          <el-descriptions-item label="账号">
            {{ currentPlan.account }}
          </el-descriptions-item>
          <el-descriptions-item label="国家/地区">
            {{ currentPlan.country }}
          </el-descriptions-item>
          <el-descriptions-item label="总金额">
            {{ currentPlan.totalAmount }}
          </el-descriptions-item>
          <el-descriptions-item label="已充值金额">
            {{ currentPlan.chargedAmount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentPlan.status)">
              {{ getStatusText(currentPlan.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentPlan.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ currentPlan.startTime }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ currentPlan.updatedAt }}
          </el-descriptions-item>
        </el-descriptions>

        <h3 style="margin: 20px 0">执行计划</h3>
        <el-table :data="currentPlan.items || []" border>
          <el-table-column prop="day" label="天数" width="80" />
          <el-table-column prop="time" label="执行时间" width="180" />
          <el-table-column label="额度限制" width="150">
            <template #default="scope">
              <span
                v-if="
                  scope.row.minAmount !== undefined &&
                  scope.row.maxAmount !== undefined
                "
              >
                {{ scope.row.minAmount }}~{{ scope.row.maxAmount }}
              </span>
              <span v-else>{{ scope.row.amount || "0.00" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已兑换金额" width="120">
            <template #default="scope">
              <span class="executed-amount">{{
                getExecutedAmount(scope.row)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
          <el-table-column label="执行状态" width="120">
            <template #default="scope">
              <el-tag
                :type="
                  getExecutionStatusType(scope.row.executionStatus, scope.row)
                "
              >
                {{
                  getExecutionStatusText(scope.row.executionStatus, scope.row)
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                v-if="scope.row.executionStatus === 'pending'"
                type="primary"
                size="small"
                @click="handleExecuteItem(scope.row)"
              >
                立即执行
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <h3 style="margin: 20px 0">执行记录</h3>
        <el-table
          v-loading="logsLoading"
          :data="logsList || []"
          border
          size="small"
        >
          <el-table-column prop="day" label="天数" width="80" />
          <el-table-column prop="time" label="时间" width="150" />
          <el-table-column prop="action" label="操作" width="120" />
          <el-table-column prop="details" label="详情" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag
                :type="scope.row.status === 'success' ? 'success' : 'danger'"
                size="small"
              >
                {{ scope.row.status === "success" ? "成功" : "失败" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="记录时间" width="180" />
        </el-table>
      </div>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量操作" width="50%">
      <div class="batch-content">
        <p>已选择 {{ selectedPlans.length }} 个计划</p>
        <el-form :model="batchForm" label-width="120px">
          <el-form-item label="操作类型">
            <el-radio-group v-model="batchForm.action">
              <el-radio value="start">批量启动</el-radio>
              <el-radio value="pause">批量暂停</el-radio>
              <el-radio value="cancel">批量取消</el-radio>
              <el-radio value="delete">批量删除</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="batchForm.action === 'delete'" label="确认删除">
            <el-checkbox v-model="batchForm.confirmDelete">
              我确认要删除选中的计划（此操作不可恢复）
            </el-checkbox>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmBatch">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 绑定群组对话框 -->
    <el-dialog
      v-model="bindGroupDialogVisible"
      title="绑定微信群组"
      width="50%"
    >
      <el-form :model="bindGroupForm" label-width="120px">
        <el-form-item label="选择群组" required>
          <el-select
            v-model="bindGroupForm.roomId"
            placeholder="请选择微信群组"
            filterable
            remote
            :remote-method="searchWechatRooms"
            :loading="roomsLoading"
            style="width: 100%"
          >
            <el-option
              v-for="room in wechatRooms"
              :key="room.roomId"
              :value="room.roomId"
              :label="room.roomName"
            >
              <div style="display: flex; justify-content: space-between">
                <span>{{ room.roomName }}</span>
                <span style="color: #8492a6; font-size: 13px">
                  {{ room.memberCount || 0 }}个成员
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bindGroupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmBindGroup">
            确认绑定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Search,
  Refresh,
  VideoPlay,
  ArrowDown
} from "@element-plus/icons-vue";
import { formatDate } from "@/utils/date";
import {
  getChargePlansApi,
  startChargePlanApi,
  pauseChargePlanApi,
  resumeChargePlanApi,
  deleteChargePlanApi,
  executeChargePlanItemApi,
  batchOperatePlansApi,
  getWechatRoomsApi,
  bindPlanToWechatRoomApi,
  unbindPlanFromWechatRoomApi,
  getWechatRoomBindingStatusApi,
  updateWechatRoomBindingStatusApi,
  batchBindPlansToWechatRoomApi,
  batchUnbindPlansFromWechatRoomApi
} from "@/api/trade/gift-exchange";
import { getPlanLogsApi } from "@/api/trade/charge-plan";
import { getCountriesListApi } from "@/api/system/countries";
import type { ChargePlan, ChargePlanItem, WechatRoom } from "@/api/trade/types";

// 国家数据
const countriesList = ref([]);
const countriesLoading = ref(false);

// 获取国家列表
const getCountriesList = async () => {
  countriesLoading.value = true;
  try {
    const response = await getCountriesListApi({
      pageSize: 100,
      status: "1"
    });

    if (response && response.code === 0 && response.data) {
      countriesList.value = Array.isArray(response.data.data)
        ? response.data.data.map(item => ({
            ...item,
            code: item.code || "",
            name_zh: item.name_zh || item.code || "",
            name_en: item.name_en || ""
          }))
        : [];
    } else {
      countriesList.value = [];
    }
  } catch (error) {
    console.error("获取国家列表失败:", error);
    countriesList.value = [];
  } finally {
    countriesLoading.value = false;
  }
};

// 国家选择器筛选方法
const filterCountries = (query, item) => {
  if (!query) return true;
  if (!item) return false;

  query = query.toLowerCase();
  return (
    (item.name_zh && item.name_zh.toLowerCase().includes(query)) ||
    (item.name_en && item.name_en.toLowerCase().includes(query)) ||
    (item.code && item.code.toLowerCase().includes(query)) ||
    (item.code2 && item.code2.toLowerCase().includes(query))
  );
};

// 格式化国家标签显示函数
const formatCountryLabel = item => {
  if (!item) return "";
  return item?.name_zh
    ? `${item.name_zh} (${item?.name_en || ""})`
    : item?.code || "";
};

// 数据状态
const loading = ref(false);
const plansList = ref<ChargePlan[]>([]);
const total = ref(0);

// 搜索表单
const searchForm = reactive({
  account: "",
  country: "",
  status: "",
  roomId: "",
  dateRange: [],
  page: 1,
  pageSize: 20
});

// 选中的计划
const selectedPlans = ref<ChargePlan[]>([]);

// 对话框状态
const detailDialogVisible = ref(false);
const batchDialogVisible = ref(false);
const currentPlan = ref<ChargePlan | null>(null);

// 批量操作表单
const batchForm = reactive({
  action: "start",
  confirmDelete: false
});

// 群组相关
const groupBindingEnabled = ref(false);
const wechatRooms = ref<WechatRoom[]>([]);
const roomsLoading = ref(false);
const roomSearchTimeout = ref<number | null>(null);

// 绑定群组对话框
const bindGroupDialogVisible = ref(false);
const bindGroupForm = reactive({
  roomId: ""
});

// 日志数据
const logsList = ref([]);
const logsLoading = ref(false);

// 搜索微信群组
const searchWechatRooms = async (query: string) => {
  if (roomSearchTimeout.value) {
    clearTimeout(roomSearchTimeout.value);
  }

  roomSearchTimeout.value = window.setTimeout(async () => {
    roomsLoading.value = true;
    try {
      const res = await getWechatRoomsApi({
        keyword: query,
        pageSize: 20
      });
      wechatRooms.value = res.data.list || [];
    } catch (error) {
      console.error("搜索微信群组失败:", error);
      ElMessage.error("搜索微信群组失败");
    } finally {
      roomsLoading.value = false;
    }
  }, 300);
};

// 获取计划列表
const loadPlansList = async () => {
  loading.value = true;
  try {
    const params = {
      page: searchForm.page,
      pageSize: searchForm.pageSize,
      account: searchForm.account || undefined,
      country: searchForm.country || undefined,
      status: searchForm.status || undefined,
      roomId: searchForm.roomId || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    };

    const res = await getChargePlansApi(params);
    plansList.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch (error) {
    console.error("获取计划列表失败:", error);
    ElMessage.error("获取计划列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  searchForm.page = 1;
  loadPlansList();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    account: "",
    country: "",
    status: "",
    roomId: "",
    dateRange: [],
    page: 1,
    pageSize: 20
  });
  loadPlansList();
};

// 分页处理
const handleSizeChange = (size: number) => {
  searchForm.pageSize = size;
  searchForm.page = 1;
  loadPlansList();
};

const handleCurrentChange = (page: number) => {
  searchForm.page = page;
  loadPlansList();
};

// 选择变化
const handleSelectionChange = (selection: ChargePlan[]) => {
  selectedPlans.value = selection;
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "draft":
      return "待执行";
    case "processing":
      return "进行中";
    case "paused":
      return "已暂停";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "draft":
      return "info";
    case "processing":
      return "primary";
    case "paused":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "info";
  }
};

// 获取执行状态文本
const getExecutionStatusText = (status: string, item?: any) => {
  // 如果传入了item，检查是否已达到最大额度
  if (item) {
    const executedAmount = parseFloat(getExecutedAmount(item)) || 0;
    const maxAmount = parseFloat(item.maxAmount) || 0;

    if (executedAmount >= maxAmount && maxAmount > 0) {
      return "已完成";
    }
  }

  switch (status) {
    case "pending":
      return "待执行";
    case "executing":
      return "执行中";
    case "completed":
      return "已完成";
    case "failed":
      return "执行失败";
    default:
      return "未知";
  }
};

// 获取执行状态类型
const getExecutionStatusType = (status: string, item?: any) => {
  // 如果传入了item，检查是否已达到最大额度
  if (item) {
    const executedAmount = parseFloat(getExecutedAmount(item)) || 0;
    const maxAmount = parseFloat(item.maxAmount) || 0;

    if (executedAmount >= maxAmount && maxAmount > 0) {
      return "success";
    }
  }

  switch (status) {
    case "pending":
      return "info";
    case "executing":
      return "primary";
    case "completed":
      return "success";
    case "failed":
      return "danger";
    default:
      return "info";
  }
};

// 获取进度
const getProgress = (plan: ChargePlan) => {
  const totalAmount =
    typeof plan.totalAmount === "string"
      ? parseFloat(plan.totalAmount)
      : plan.totalAmount;
  const chargedAmount =
    typeof plan.chargedAmount === "string"
      ? parseFloat(plan.chargedAmount || "0")
      : plan.chargedAmount || 0;

  if (!totalAmount || totalAmount === 0) return 0;
  return Math.round((chargedAmount / totalAmount) * 100);
};

// 获取进度状态
const getProgressStatus = (plan: ChargePlan) => {
  const progress = getProgress(plan);
  if (progress === 100) return "success";
  if (progress > 0) return "";
  return "";
};

// 获取已兑换金额
const getExecutedAmount = (item: any) => {
  // 如果有executedAmount字段，直接使用
  if (item.executedAmount !== undefined) {
    return item.executedAmount;
  }

  // 如果没有，但是状态是completed，使用amount
  if (item.status === "completed" && item.amount) {
    return item.amount;
  }

  // 如果有result字段，尝试从中提取金额
  if (item.result && typeof item.result === "string") {
    const match = item.result.match(/累计金额[:：]\s*(\d+\.?\d*)/);
    if (match) {
      return match[1];
    }
  }

  // 默认返回0.00
  return "0.00";
};

// 创建计划
const handleCreatePlan = () => {
  // 跳转到创建计划页面
  window.location.href = "/trade/gift-exchange";
};

// 查看计划
const handleViewPlan = async (plan: ChargePlan) => {
  currentPlan.value = plan;
  logsList.value = []; // 重置日志列表
  detailDialogVisible.value = true;

  // 加载计划日志
  await loadPlanLogs(plan.id!);
};

// 加载计划日志
const loadPlanLogs = async (planId: string) => {
  logsLoading.value = true;
  try {
    const response = await getPlanLogsApi(planId);
    if (response && response.code === 0) {
      // 处理分页数据结构
      if (response.data) {
        if (Array.isArray(response.data)) {
          // 如果直接是数组
          logsList.value = response.data;
        } else if (
          (response.data as any).list &&
          Array.isArray((response.data as any).list)
        ) {
          // 如果是分页结构 {list: [], total: number}
          logsList.value = (response.data as any).list;
        } else {
          // 其他情况设为空数组
          logsList.value = [];
        }
      } else {
        logsList.value = [];
      }
    } else {
      console.error("获取计划日志失败:", response);
      logsList.value = [];
    }
  } catch (error) {
    console.error("获取计划日志失败:", error);
    logsList.value = [];
  } finally {
    logsLoading.value = false;
  }
};

// 编辑计划
const handleEditPlan = (plan: ChargePlan) => {
  // 跳转到编辑页面，带上计划ID
  window.location.href = `/trade/gift-exchange?id=${plan.id}`;
};

// 启动计划
const handleStartPlan = async (plan: ChargePlan) => {
  try {
    await startChargePlanApi(plan.id!);
    ElMessage.success("计划启动成功");
    loadPlansList();
  } catch (error) {
    console.error("启动计划失败:", error);
    ElMessage.error("启动计划失败");
  }
};

// 暂停计划
const handlePausePlan = async (plan: ChargePlan) => {
  try {
    await pauseChargePlanApi(plan.id!);
    ElMessage.success("计划暂停成功");
    loadPlansList();
  } catch (error) {
    console.error("暂停计划失败:", error);
    ElMessage.error("暂停计划失败");
  }
};

// 恢复计划
const handleResumePlan = async (plan: ChargePlan) => {
  try {
    await resumeChargePlanApi(plan.id!);
    ElMessage.success("计划恢复成功");
    loadPlansList();
  } catch (error) {
    console.error("恢复计划失败:", error);
    ElMessage.error("恢复计划失败");
  }
};

// 删除计划
const handleDeletePlan = (plan: ChargePlan) => {
  ElMessageBox.confirm(
    `确定要删除账号"${plan.account}"的充值计划吗？此操作不可恢复。`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteChargePlanApi(plan.id!);
      ElMessage.success("删除成功");
      loadPlansList();
    } catch (error) {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  });
};

// 执行单个计划项
const handleExecuteItem = async (item: ChargePlanItem) => {
  try {
    await executeChargePlanItemApi(item.id!);
    ElMessage.success("执行成功");
    loadPlansList();
  } catch (error) {
    console.error("执行失败:", error);
    ElMessage.error("执行失败");
  }
};

// 批量执行
const handleBatchExecute = () => {
  if (selectedPlans.value.length === 0) {
    ElMessage.warning("请选择要操作的计划");
    return;
  }
  batchDialogVisible.value = true;
};

// 确认批量操作
const handleConfirmBatch = async () => {
  if (batchForm.action === "delete" && !batchForm.confirmDelete) {
    ElMessage.warning("请确认删除操作");
    return;
  }

  try {
    const planIds = selectedPlans.value.map(plan => plan.id!);
    await batchOperatePlansApi({
      action: batchForm.action,
      planIds
    });

    ElMessage.success("批量操作成功");
    batchDialogVisible.value = false;
    selectedPlans.value = [];
    loadPlansList();
  } catch (error) {
    console.error("批量操作失败:", error);
    ElMessage.error("批量操作失败");
  }
};

// 群组绑定变化
const handleGroupBindingChange = async () => {
  try {
    // 保存群组绑定状态到后端
    await updateWechatRoomBindingStatusApi({
      enabled: groupBindingEnabled.value
    });

    if (groupBindingEnabled.value) {
      // 开启群组绑定时，加载群组列表
      await loadWechatRooms();
      ElMessage.success("已开启微信群组绑定模式");
    } else {
      ElMessage.success("已切换到独立执行模式");
    }

    // 重新加载计划列表以显示/隐藏群组相关列
    loadPlansList();
  } catch (error) {
    console.error("更新群组绑定状态失败:", error);
    ElMessage.error("更新群组绑定状态失败");
    // 恢复开关状态
    groupBindingEnabled.value = !groupBindingEnabled.value;
  }
};

// 加载微信群组列表
const loadWechatRooms = async () => {
  roomsLoading.value = true;
  try {
    const res = await getWechatRoomsApi({
      pageSize: 20
    });
    wechatRooms.value = res.data.list || [];
  } catch (error) {
    console.error("加载微信群组失败:", error);
    ElMessage.error("加载微信群组失败");
  } finally {
    roomsLoading.value = false;
  }
};

// 获取群组名称
const getGroupName = (roomId: string | undefined) => {
  if (!roomId) return "-";
  const room = wechatRooms.value.find(r => r.roomId === roomId);
  return room?.roomName || "未知群组";
};

// 获取计划群组名称
const getPlanGroupName = (plan: ChargePlan) => {
  if (!plan.wechatRoom) return "-";
  return plan.wechatRoom.roomName || "未知群组";
};

// 绑定到群组
const handleBindToGroup = (plan: ChargePlan) => {
  currentPlan.value = plan;
  bindGroupForm.roomId = plan.wechatRoom?.roomId || "";
  bindGroupDialogVisible.value = true;
};

// 确认绑定群组
const handleConfirmBindGroup = async () => {
  if (!bindGroupForm.roomId) {
    ElMessage.warning("请选择群组");
    return;
  }

  if (!currentPlan.value?.id) {
    ElMessage.error("计划信息错误");
    return;
  }

  try {
    // 绑定计划到微信群组
    await bindPlanToWechatRoomApi(currentPlan.value.id, bindGroupForm.roomId);

    ElMessage.success("绑定群组成功");
    bindGroupDialogVisible.value = false;
    loadPlansList();
  } catch (error) {
    console.error("绑定群组失败:", error);
    ElMessage.error("绑定群组失败");
  }
};

// 解绑群组
const handleUnbindFromGroup = async (plan: ChargePlan) => {
  if (!plan.wechatRoom || !plan.id) {
    ElMessage.error("计划信息错误");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要将计划从群组"${plan.wechatRoom.roomName}"中解绑吗？`,
      "解绑确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await unbindPlanFromWechatRoomApi(plan.id);
    ElMessage.success("解绑群组成功");
    loadPlansList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("解绑群组失败:", error);
      ElMessage.error("解绑群组失败");
    }
  }
};

// 修改优先级 - 微信群组不需要优先级功能，移除此功能
const handleChangePriority = (plan: ChargePlan) => {
  ElMessage.info("微信群组模式下暂不支持优先级设置");
};

// 确认修改优先级 - 移除此功能
const handleConfirmChangePriority = async () => {
  ElMessage.info("微信群组模式下暂不支持优先级设置");
};

// 加载群组绑定状态
const loadGroupBindingStatus = async () => {
  try {
    const res = await getWechatRoomBindingStatusApi();
    groupBindingEnabled.value = res.data.enabled || false;

    if (groupBindingEnabled.value) {
      // 如果群组绑定已开启，加载群组列表
      await loadWechatRooms();
    }
  } catch (error) {
    console.error("加载群组绑定状态失败:", error);
    // 如果加载失败，默认为关闭状态
    groupBindingEnabled.value = false;
  }
};

// 页面加载时初始化
onMounted(() => {
  getCountriesList();
  loadGroupBindingStatus();
  loadPlansList();
});
</script>

<style scoped>
.plans-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-info {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 0;
}

.mb-4 {
  margin-bottom: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.expand-content {
  padding: 20px;
  background-color: #f8f9fa;
}

.expand-content h4 {
  margin: 0 0 15px 0;
  color: #409eff;
}

.plan-detail h3 {
  color: #409eff;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.text-success {
  color: #67c23a;
  font-weight: bold;
}

.executed-amount {
  font-weight: bold;
  color: #e6a23c;
}

.batch-content {
  padding: 20px 0;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.country-simple-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.country-en-name {
  color: #8492a6;
  font-size: 13px;
}

.group-binding-switch {
  margin-right: 15px;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.group-name {
  margin-bottom: 2px;
}

.group-actions {
  display: flex;
  gap: 4px;
}

.group-priority {
  font-size: 12px;
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
