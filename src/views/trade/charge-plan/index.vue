<template>
  <div class="charge-plan-container">
    <!-- 顶部操作栏 -->
    <el-card class="mb-4">
      <div class="header-controls">
        <div class="left-controls">
          <span class="title">兑换计划管理</span>
          <el-switch
            v-model="independentMode"
            active-text="独立执行"
            inactive-text="绑定群组"
            class="ml-4"
          />
        </div>
        <div class="right-controls">
          <el-button type="primary" @click="showAddAccountDialog = true">
            十创建计划
          </el-button>
          <!-- <el-button type="success" @click="handleBatchAction">
            ◎批量执行
          </el-button> -->
        </div>
      </div>
    </el-card>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.account"
            placeholder="请输入账号"
            clearable
          />
        </el-form-item>
        <el-form-item label="国家/地区">
          <el-select
            v-model="searchForm.country"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="item in countriesList"
              :key="item.code"
              :label="item.name_zh"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="进行中" value="processing" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="群组">
          <el-select
            v-model="searchForm.groupId"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="item in groupsList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch"> ◎搜索 </el-button>
          <el-button @click="handleReset"> ◎重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 计划列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>计划列表</span>
          <span class="record-count">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="planList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="account" label="账号" width="200" />
        <el-table-column prop="country" label="国家" width="80" />
        <el-table-column label="API链接" width="150">
          <template #default="scope">
            <el-link
              v-if="scope.row.verifyUrl"
              :href="scope.row.verifyUrl"
              target="_blank"
              type="primary"
              style="font-size: 12px"
            >
              {{
                scope.row.verifyUrl.length > 20
                  ? scope.row.verifyUrl.substring(0, 20) + "..."
                  : scope.row.verifyUrl
              }}
            </el-link>
            <span v-else class="text-primary">未设置</span>
          </template>
        </el-table-column>
        <el-table-column label="所属群组" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.wechatRoom" type="info" size="small">
              {{ scope.row.wechatRoom.roomName }}
            </el-tag>
            <span v-else class="text-warning">未分组</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="100" />
        <el-table-column prop="chargedAmount" label="已充值" width="100">
          <template #default="scope">
            <span class="charged-amount">{{ scope.row.chargedAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当日剩余额度" width="120">
          <template #default="scope">
            <span class="remaining-quota-primary">{{
              scope.row.dailyRemainingQuota || "0.00"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column label="进度" width="120">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.progress || 0"
              :color="getProgressColor(scope.row.progress || 0)"
              :stroke-width="8"
              :show-text="true"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewPlan(scope.row)">
              查看
            </el-button>
            <el-button
              :type="scope.row.status === 'processing' ? 'warning' : 'success'"
              size="small"
              @click="togglePlanStatus(scope.row)"
            >
              {{ scope.row.status === "processing" ? "暂停" : "开始" }}
            </el-button>
            <el-dropdown @command="handleMoreAction">
              <el-button size="small" link>
                更多 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :command="{ action: 'edit', row: scope.row }"
                  >
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="{ action: 'delete', row: scope.row }"
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 添加账号对话框 -->
    <el-dialog
      v-model="showAddAccountDialog"
      title="添加账号"
      width="800px"
      @close="resetAccountForm"
    >
      <el-form
        ref="accountFormRef"
        :model="accountForm"
        :rules="accountRules"
        label-width="120px"
      >
        <el-form-item label="账号信息" prop="accounts">
          <el-input
            v-model="accountForm.accounts"
            type="textarea"
            :rows="6"
            placeholder="请输入账号信息，每行一个，格式：账号 密码 [API链接]"
          />
          <div class="form-tip">
            格式说明：每行一个账号，使用空格分隔账号、密码和API链接（API链接可选）<br />
            示例1：gordon123@icloud.com MyPassword123<br />
            示例2：gordon123@icloud.com MyPassword123
            https://api.example.com/endpoint
          </div>
        </el-form-item>
        <el-form-item label="国家/地区" prop="country">
          <el-select v-model="accountForm.country" placeholder="选择国家/地区">
            <el-option
              v-for="item in countriesList"
              :key="item.code"
              :label="item.name_zh"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="总金额" prop="totalAmount">
          <el-input-number
            v-model="accountForm.totalAmount"
            :min="1"
            :step="100"
            placeholder="请输入总金额"
          />
        </el-form-item>
        <el-form-item label="执行天数" prop="days">
          <el-input-number
            v-model="accountForm.days"
            :min="1"
            :max="30"
            placeholder="请输入执行天数"
          />
        </el-form-item>
        <el-form-item label="倍数基数" prop="multipleBase">
          <el-input-number
            v-model="accountForm.multipleBase"
            :min="1"
            placeholder="请输入倍数基数"
          />
        </el-form-item>
        <el-form-item label="浮动金额" prop="floatAmount">
          <el-input-number
            v-model="accountForm.floatAmount"
            :min="0"
            placeholder="请输入浮动金额"
          />
        </el-form-item>
        <el-form-item label="间隔小时" prop="intervalHours">
          <el-input-number
            v-model="accountForm.intervalHours"
            :min="1"
            :max="24"
            placeholder="请输入间隔小时"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="accountForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAccountDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddAccount">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑计划对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑计划"
      width="800px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <el-form-item label="账号" prop="account">
          <el-input v-model="editForm.account" disabled />
        </el-form-item>
        <el-form-item label="国家/地区" prop="country">
          <el-select v-model="editForm.country" placeholder="选择国家/地区">
            <el-option
              v-for="item in countriesList"
              :key="item.code"
              :label="item.name_zh"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="总金额" prop="totalAmount">
          <el-input-number
            v-model="editForm.totalAmount"
            :min="1"
            :step="100"
          />
        </el-form-item>
        <el-form-item label="执行天数" prop="days">
          <el-input-number v-model="editForm.days" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="倍数基数" prop="multipleBase">
          <el-input-number v-model="editForm.multipleBase" :min="1" />
        </el-form-item>
        <el-form-item label="浮动金额" prop="floatAmount">
          <el-input-number v-model="editForm.floatAmount" :min="0" />
        </el-form-item>
        <el-form-item label="间隔小时" prop="intervalHours">
          <el-input-number
            v-model="editForm.intervalHours"
            :min="1"
            :max="24"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="editForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看计划详情对话框 -->
    <el-dialog
      v-model="showViewDialog"
      title="计划详情"
      width="800px"
      @close="resetViewData"
    >
      <div v-if="viewData" class="plan-detail">
        <!-- 基本信息 -->
        <el-card class="mb-4">
          <template #header>
            <span class="detail-title">基本信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>账号：</label>
                <span>{{ viewData.account }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>国家：</label>
                <span>{{ viewData.country }}</span>
              </div>
            </el-col>
            <el-col v-if="viewData.verifyUrl" :span="24">
              <div class="detail-item">
                <label>API链接：</label>
                <el-link
                  :href="viewData.verifyUrl"
                  target="_blank"
                  type="primary"
                >
                  {{ viewData.verifyUrl }}
                </el-link>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>总金额：</label>
                <span class="amount">{{ viewData.totalAmount }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>已充值：</label>
                <span class="amount charged-amount">{{
                  viewData.chargedAmount
                }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>当日剩余额度：</label>
                <span class="amount remaining-quota-primary">{{
                  viewData.dailyRemainingQuota || "0.00"
                }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>执行天数：</label>
                <span>{{ viewData.days }} 天</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>状态：</label>
                <el-tag :type="getStatusType(viewData.status)">
                  {{ getStatusText(viewData.status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>进度：</label>
                <el-progress
                  :percentage="viewData.progress"
                  :color="getProgressColor(viewData.progress)"
                  style="width: 150px"
                />
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 配置信息 -->
        <el-card class="mb-4">
          <template #header>
            <span class="detail-title">配置信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>倍数基数：</label>
                <span>{{ viewData.multipleBase }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>浮动金额：</label>
                <span>{{ viewData.floatAmount }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>间隔小时：</label>
                <span>{{ viewData.intervalHours }} 小时</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>开始时间：</label>
                <span>{{ viewData.startTime }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>创建时间：</label>
                <span>{{ viewData.createdAt }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>更新时间：</label>
                <span>{{ viewData.updatedAt }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 群组信息 -->
        <el-card v-if="viewData.wechatRoom" class="mb-4">
          <template #header>
            <span class="detail-title">群组信息</span>
          </template>
          <div class="detail-item">
            <label>所属群组：</label>
            <el-tag type="info">{{ viewData.wechatRoom.roomName }}</el-tag>
          </div>
        </el-card>

        <!-- 执行计划 -->
        <el-card class="mb-4">
          <template #header>
            <span class="detail-title">执行计划</span>
          </template>
          <el-table :data="viewData.items" border size="small">
            <el-table-column prop="day" label="天数" width="80" />
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
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getItemStatusType(scope.row)" size="small">
                  {{ getItemStatusText(scope.row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executedAt" label="执行时间" width="150" />
          </el-table>
        </el-card>

        <!-- 执行记录 -->
        <el-card>
          <template #header>
            <span class="detail-title">执行记录</span>
          </template>
          <el-table
            v-loading="logsLoading"
            :data="logsList"
            border
            size="small"
          >
            <el-table-column prop="day" label="天数" width="80" />
            <el-table-column prop="action" label="操作" width="120" />
            <el-table-column prop="details" label="详情">
              <template #default="scope">
                <div class="details-cell">
                  <div
                    :class="[
                      'details-content',
                      { expanded: scope.row._expanded }
                    ]"
                  >
                    {{ scope.row.details }}
                  </div>
                  <el-button
                    v-if="isTextLong(scope.row.details)"
                    link
                    size="small"
                    type="primary"
                    class="expand-btn"
                    @click="toggleExpand(scope.row)"
                  >
                    {{ scope.row._expanded ? "收起" : "展开" }}
                  </el-button>
                </div>
              </template>
            </el-table-column>
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
        </el-card>
      </div>
      <template #footer>
        <el-button @click="showViewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import type { ChargePlan } from "@/api/trade/types";
import {
  getChargePlansApi,
  createBatchChargePlansApi,
  updateChargePlanApi,
  deleteChargePlanApi,
  updateChargePlanStatusApi,
  executePlanApi,
  pausePlanApi,
  resumePlanApi,
  batchOperateChargePlansApi,
  getCountriesForChargePlanApi,
  getGroupsForChargePlanApi,
  getPlanLogsApi,
  type ChargePlanQueryParams
} from "@/api/trade/charge-plan";

// 页面状态
const loading = ref(false);
const independentMode = ref(true);
const showAddAccountDialog = ref(false);
const showEditDialog = ref(false);
const showViewDialog = ref(false);

// 列表数据
const planList = ref<ChargePlan[]>([]);
const selectedPlans = ref<ChargePlan[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const viewData = ref<ChargePlan | null>(null);

// 下拉选项
const countriesList = ref([]);
const groupsList = ref([]);

// 日志数据
const logsList = ref([]);
const logsLoading = ref(false);

// 搜索表单
const searchForm = reactive({
  account: "",
  country: "",
  status: "",
  groupId: "",
  dateRange: []
});

// 初始化时确保表单为空，让placeholder显示
const initSearchForm = () => {
  searchForm.account = "";
  searchForm.country = "";
  searchForm.status = "";
  searchForm.groupId = "";
  searchForm.dateRange = [];
};

// 添加账号表单
const accountForm = reactive({
  accounts: "",
  country: "",
  totalAmount: 1000,
  days: 3,
  multipleBase: 50,
  floatAmount: 0,
  intervalHours: 8,
  startTime: ""
});

const accountRules = {
  accounts: [{ required: true, message: "请输入账号信息", trigger: "blur" }],
  country: [{ required: true, message: "请选择国家/地区", trigger: "change" }],
  totalAmount: [{ required: true, message: "请输入总金额", trigger: "blur" }],
  days: [{ required: true, message: "请输入执行天数", trigger: "blur" }],
  multipleBase: [
    { required: true, message: "请输入倍数基数", trigger: "blur" }
  ],
  intervalHours: [
    { required: true, message: "请输入间隔小时", trigger: "blur" }
  ],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }]
};

// 编辑表单
const editForm = reactive({
  id: "",
  account: "",
  country: "",
  totalAmount: 0,
  days: 0,
  multipleBase: 0,
  floatAmount: 0,
  intervalHours: 0,
  startTime: ""
});

const editRules = {
  country: [{ required: true, message: "请选择国家/地区", trigger: "change" }],
  totalAmount: [{ required: true, message: "请输入总金额", trigger: "blur" }],
  days: [{ required: true, message: "请输入执行天数", trigger: "blur" }],
  multipleBase: [
    { required: true, message: "请输入倍数基数", trigger: "blur" }
  ],
  intervalHours: [
    { required: true, message: "请输入间隔小时", trigger: "blur" }
  ],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }]
};

const accountFormRef = ref();
const editFormRef = ref();

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return "#67c23a"; // 完成时为绿色
  return "#409eff"; // 未完成时为primary蓝色
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "processing":
      return "warning";
    case "completed":
      return "success";
    case "paused":
      return "info";
    case "cancelled":
      return "danger";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "processing":
      return "进行中";
    case "completed":
      return "已完成";
    case "paused":
      return "已暂停";
    case "cancelled":
      return "已取消";
    default:
      return "未知";
  }
};

// 处理选择变化
const handleSelectionChange = (selection: ChargePlan[]) => {
  selectedPlans.value = selection;
};

// 搜索
const handleSearch = async () => {
  await loadPlanList();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    account: "",
    country: "",
    status: "",
    groupId: "",
    dateRange: []
  });
  handleSearch();
};

// 批量操作
const handleBatchAction = async () => {
  if (selectedPlans.value.length === 0) {
    ElMessage.warning("请先选择要操作的计划");
    return;
  }

  try {
    const ids = selectedPlans.value.map(plan => plan.id!);
    await batchOperateChargePlansApi(ids, "execute");
    ElMessage.success(`批量操作 ${selectedPlans.value.length} 个计划成功`);
    await loadPlanList();
  } catch (error) {
    console.error("批量操作失败:", error);
    ElMessage.error("批量操作失败");
  }
};

// 查看计划
const viewPlan = async (plan: ChargePlan) => {
  viewData.value = plan;
  logsList.value = []; // 重置日志列表
  showViewDialog.value = true;

  // 加载计划日志
  await loadPlanLogs(plan.id!);
};

// 切换计划状态
const togglePlanStatus = async (plan: ChargePlan) => {
  const action = plan.status === "processing" ? "暂停" : "开始";

  try {
    await ElMessageBox.confirm(
      `确定要${action}计划 ${plan.account} 吗？`,
      "确认操作"
    );

    // 根据当前状态调用不同的API
    if (plan.status === "processing") {
      await pausePlanApi(plan.id!);
      plan.status = "paused";
    } else {
      await executePlanApi(plan.id!);
      plan.status = "processing";
    }

    ElMessage.success(`${action}成功`);
    await loadPlanList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("操作失败:", error);
      ElMessage.error("操作失败");
    } else {
      ElMessage.info("已取消操作");
    }
  }
};

// 更多操作
const handleMoreAction = (command: { action: string; row: ChargePlan }) => {
  const { action, row } = command;
  if (action === "edit") {
    editPlan(row);
  } else if (action === "delete") {
    deletePlan(row);
  }
};

// 编辑计划
const editPlan = (plan: ChargePlan) => {
  Object.assign(editForm, {
    id: plan.id,
    account: plan.account,
    country: plan.country,
    totalAmount: parseFloat(plan.totalAmount),
    days: plan.days,
    multipleBase: parseFloat(plan.multipleBase),
    floatAmount: parseFloat(plan.floatAmount),
    intervalHours: plan.intervalHours,
    startTime: plan.startTime
  });
  showEditDialog.value = true;
};

// 删除计划
const deletePlan = async (plan: ChargePlan) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除计划 ${plan.account} 吗？`,
      "确认删除",
      {
        type: "warning"
      }
    );

    await deleteChargePlanApi(plan.id!);
    ElMessage.success("删除成功");
    await loadPlanList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    } else {
      ElMessage.info("已取消删除");
    }
  }
};

// 添加账号
const handleAddAccount = async () => {
  if (!accountFormRef.value) return;

  try {
    await accountFormRef.value.validate();

    // 解析账号信息
    const accounts = accountForm.accounts
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        // 使用正则表达式分割，支持多个空格
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const [account, password, ...apiParts] = parts;
          // API链接可选，如果有多个部分则组合为API链接
          const verifyUrl = apiParts.length > 0 ? apiParts.join(" ") : null;

          return {
            account: account?.trim(),
            password: password?.trim(),
            verifyUrl: verifyUrl?.trim() || null
          };
        }
        return null;
      })
      .filter(
        item =>
          item &&
          item.account &&
          item.password &&
          (!item.verifyUrl ||
            item.verifyUrl.startsWith("http://") ||
            item.verifyUrl.startsWith("https://"))
      );

    if (accounts.length === 0) {
      ElMessage.error(
        "请输入有效的账号信息，格式：账号 密码 [API链接]（每行一个）"
      );
      return;
    }

    const batchData = {
      country: accountForm.country,
      totalAmount: accountForm.totalAmount,
      days: accountForm.days,
      multipleBase: accountForm.multipleBase,
      floatAmount: accountForm.floatAmount,
      intervalHours: accountForm.intervalHours,
      startTime: accountForm.startTime,
      accounts: accounts.map(item =>
        item.verifyUrl
          ? `${item.account} ${item.password} ${item.verifyUrl}`
          : `${item.account} ${item.password}`
      )
    };

    const response = await createBatchChargePlansApi(batchData);

    // 检查响应数据，处理成功和失败情况
    if (response && response.code === 0 && response.data) {
      const data = response.data as any;
      const { successCount, failCount, duplicateAccounts } = data;

      if (successCount > 0 && failCount === 0) {
        // 全部成功
        ElMessage.success(`成功添加 ${successCount} 个账号`);
        showAddAccountDialog.value = false;
        resetAccountForm();
        await loadPlanList();
      } else if (successCount > 0 && failCount > 0) {
        // 部分成功
        let message = `成功添加 ${successCount} 个账号，失败 ${failCount} 个`;
        if (duplicateAccounts && duplicateAccounts.length > 0) {
          message += `。重复账号：${duplicateAccounts.join(", ")}`;
        }
        ElMessage.warning(message);
        showAddAccountDialog.value = false;
        resetAccountForm();
        await loadPlanList();
      } else if (failCount > 0) {
        // 全部失败
        let message = `添加失败，共 ${failCount} 个账号`;
        if (duplicateAccounts && duplicateAccounts.length > 0) {
          message += `。重复账号：${duplicateAccounts.join(", ")}`;
        }
        ElMessage.error(message);
      } else {
        // 未知情况
        ElMessage.error("添加账号失败");
      }
    } else {
      ElMessage.error(response?.message || "添加账号失败");
    }
  } catch (error) {
    console.error("添加账号失败:", error);
    ElMessage.error("添加账号失败");
  }
};

// 保存编辑
const handleEditSave = async () => {
  if (!editFormRef.value) return;

  try {
    await editFormRef.value.validate();

    const updateData = {
      country: editForm.country,
      totalAmount: editForm.totalAmount.toString(),
      days: editForm.days,
      multipleBase: editForm.multipleBase.toString(),
      floatAmount: editForm.floatAmount.toString(),
      intervalHours: editForm.intervalHours,
      startTime: editForm.startTime
    };

    await updateChargePlanApi(editForm.id, updateData);
    ElMessage.success("保存成功");
    showEditDialog.value = false;
    resetEditForm();
    await loadPlanList();
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("保存失败");
  }
};

// 重置表单
const resetAccountForm = () => {
  if (accountFormRef.value) {
    accountFormRef.value.resetFields();
  }
  Object.assign(accountForm, {
    accounts: "",
    country: "",
    totalAmount: 1000,
    days: 3,
    multipleBase: 50,
    floatAmount: 0,
    intervalHours: 8,
    startTime: ""
  });
};

const resetEditForm = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
  Object.assign(editForm, {
    id: "",
    account: "",
    country: "",
    totalAmount: 0,
    days: 0,
    multipleBase: 0,
    floatAmount: 0,
    intervalHours: 0,
    startTime: ""
  });
};

const resetViewData = () => {
  viewData.value = null;
  logsList.value = [];
};

// 加载计划列表
const loadPlanList = async () => {
  loading.value = true;
  try {
    const params: ChargePlanQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      account: searchForm.account || undefined,
      country: searchForm.country || undefined,
      status: searchForm.status || undefined,
      groupId: searchForm.groupId || undefined
    };

    // 处理日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startTime = searchForm.dateRange[0];
      params.endTime = searchForm.dateRange[1];
    }

    const response = await getChargePlansApi(params);
    console.log("计划列表API响应:", response);

    if (response && response.code === 0) {
      // 处理不同的数据结构
      if (response.data) {
        if (Array.isArray(response.data)) {
          // 如果data直接是数组
          planList.value = response.data.map(item => ({
            ...item,
            // 确保必要字段存在
            id: item.id || Math.random().toString(),
            account: item.account || "",
            country: item.country || "",
            verifyUrl: item.verifyUrl || null, // API链接可选
            totalAmount: item.totalAmount || "0.00",
            chargedAmount: item.chargedAmount || "0.00",
            dailyRemainingQuota: item.dailyRemainingQuota || "0.00",
            days: item.days || 0,
            status: item.status || "draft",
            // 使用后端返回的进度，如果没有则计算
            progress:
              item.progress !== undefined
                ? Math.round(item.progress)
                : item.totalAmount && item.chargedAmount
                  ? Math.round(
                      (parseFloat(item.chargedAmount) /
                        parseFloat(item.totalAmount)) *
                        100
                    )
                  : 0,
            // 其他字段保持原样
            multipleBase: item.multipleBase || "0",
            floatAmount: item.floatAmount || "0",
            intervalHours: item.intervalHours || 24,
            startTime: item.startTime || "",
            items: item.items || [],
            priority: item.priority || 1,
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
          }));
          total.value = response.data.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 如果是分页结构 {data: [], total: number}
          planList.value = response.data.data.map(item => ({
            ...item,
            // 确保必要字段存在
            id: item.id || Math.random().toString(),
            account: item.account || "",
            country: item.country || "",
            verifyUrl: item.verifyUrl || null, // API链接可选
            totalAmount: item.totalAmount || "0.00",
            chargedAmount: item.chargedAmount || "0.00",
            dailyRemainingQuota: item.dailyRemainingQuota || "0.00",
            days: item.days || 0,
            status: item.status || "draft",
            // 使用后端返回的进度，如果没有则计算
            progress:
              item.progress !== undefined
                ? Math.round(item.progress)
                : item.totalAmount && item.chargedAmount
                  ? Math.round(
                      (parseFloat(item.chargedAmount) /
                        parseFloat(item.totalAmount)) *
                        100
                    )
                  : 0,
            // 其他字段保持原样
            multipleBase: item.multipleBase || "0",
            floatAmount: item.floatAmount || "0",
            intervalHours: item.intervalHours || 24,
            startTime: item.startTime || "",
            items: item.items || [],
            priority: item.priority || 1,
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
          }));
          total.value = response.data.total || response.data.data.length;
        } else if (
          (response.data as any).list &&
          Array.isArray((response.data as any).list)
        ) {
          // 如果是 {list: [], total: number} 结构
          planList.value = (response.data as any).list.map(item => ({
            ...item,
            // 确保必要字段存在
            id: item.id || Math.random().toString(),
            account: item.account || "",
            country: item.country || "",
            verifyUrl: item.verifyUrl || null, // API链接可选
            totalAmount: item.totalAmount || "0.00",
            chargedAmount: item.chargedAmount || "0.00",
            dailyRemainingQuota: item.dailyRemainingQuota || "0.00",
            days: item.days || 0,
            status: item.status || "draft",
            // 使用后端返回的进度，如果没有则计算
            progress:
              item.progress !== undefined
                ? Math.round(item.progress)
                : item.totalAmount && item.chargedAmount
                  ? Math.round(
                      (parseFloat(item.chargedAmount) /
                        parseFloat(item.totalAmount)) *
                        100
                    )
                  : 0,
            // 其他字段保持原样
            multipleBase: item.multipleBase || "0",
            floatAmount: item.floatAmount || "0",
            intervalHours: item.intervalHours || 24,
            startTime: item.startTime || "",
            items: item.items || [],
            priority: item.priority || 1,
            wechatRoom: item.wechatRoom || null,
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
          }));
          total.value =
            (response.data as any).total || (response.data as any).list.length;
        } else {
          console.warn("未知的数据结构:", response.data);
          planList.value = [];
          total.value = 0;
        }
      } else {
        planList.value = [];
        total.value = 0;
      }

      console.log(`成功获取${planList.value.length}条计划数据`);
      console.log("处理后的数据:", planList.value);
      if (planList.value.length > 0) {
        console.log(
          "第一条数据的进度:",
          planList.value[0].progress,
          typeof planList.value[0].progress
        );
      }
    } else {
      console.error("获取计划列表失败:", response);
      ElMessage.error(response?.message || "获取计划列表失败");
      planList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("获取计划列表失败:", error);
    ElMessage.error("获取计划列表失败");
    // 失败时设置为空数组，避免页面报错
    planList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 加载国家列表
const loadCountries = async () => {
  try {
    const response = await getCountriesForChargePlanApi();
    if (response && response.code === 0 && response.data) {
      // 处理分页数据格式
      countriesList.value = Array.isArray(response.data.data)
        ? response.data.data.map(item => ({
            code: item.code || "",
            name_zh: item.name_zh || item.code || "",
            name_en: item.name_en || ""
          }))
        : [];
      console.log(`成功获取${countriesList.value.length}个国家`);
    } else {
      console.error("获取国家列表失败:", response);
    }
  } catch (error) {
    console.error("获取国家列表失败:", error);
    // 失败时使用默认数据
    countriesList.value = [
      { code: "CA", name_zh: "加拿大" },
      { code: "US", name_zh: "美国" },
      { code: "UK", name_zh: "英国" }
    ];
  }
};

// 加载群组列表
const loadGroups = async () => {
  try {
    const response = await getGroupsForChargePlanApi();
    if (response && response.code === 0 && response.data) {
      // 处理分页数据格式
      groupsList.value = Array.isArray(response.data.data)
        ? response.data.data.map(item => ({
            id: item.id?.toString() || "",
            name: item.name || ""
          }))
        : [];
      console.log(`成功获取${groupsList.value.length}个群组`);
    } else {
      console.error("获取群组列表失败:", response);
    }
  } catch (error) {
    console.error("获取群组列表失败:", error);
    // 失败时使用默认数据
    groupsList.value = [
      { id: "1", name: "A组" },
      { id: "2", name: "B组" }
    ];
  }
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
          logsList.value = response.data.map(item => ({
            ...item,
            _expanded: false // 添加展开状态
          }));
        } else {
          // 处理分页结构 {list: [], total: number}
          const data = response.data as any;
          if (data.list && Array.isArray(data.list)) {
            logsList.value = data.list.map(item => ({
              ...item,
              _expanded: false // 添加展开状态
            }));
          } else {
            logsList.value = [];
          }
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

// 判断文本是否过长
const isTextLong = (text: string) => {
  if (!text) return false;
  return text.length > 100; // 超过100个字符认为过长
};

// 切换展开状态
const toggleExpand = (row: any) => {
  row._expanded = !row._expanded;
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

  // 默认返回0.00或-
  return "0.00";
};

// 获取项目状态类型
const getItemStatusType = (item: any) => {
  // 检查是否已达到最大额度
  const executedAmount = parseFloat(getExecutedAmount(item)) || 0;
  const maxAmount = parseFloat(item.maxAmount) || 0;

  if (executedAmount >= maxAmount && maxAmount > 0) {
    return "success"; // 已完成
  }

  if (item.status === "completed") {
    return "success";
  } else if (item.status === "failed") {
    return "danger";
  } else if (item.status === "processing") {
    return "warning";
  } else {
    return "info";
  }
};

// 获取项目状态文本
const getItemStatusText = (item: any) => {
  // 检查是否已达到最大额度
  const executedAmount = parseFloat(getExecutedAmount(item)) || 0;
  const maxAmount = parseFloat(item.maxAmount) || 0;

  if (executedAmount >= maxAmount && maxAmount > 0) {
    return "已完成";
  }

  if (item.status === "completed") {
    return "已完成";
  } else if (item.status === "failed") {
    return "失败";
  } else if (item.status === "processing") {
    return "进行中";
  } else {
    return "等待中";
  }
};

// 初始化
onMounted(async () => {
  // 初始化搜索表单
  initSearchForm();

  await Promise.all([loadPlanList(), loadCountries(), loadGroups()]);
});
</script>

<style scoped>
.charge-plan-container {
  padding: 20px;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-controls {
  display: flex;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.right-controls {
  display: flex;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-count {
  color: #666;
  font-size: 14px;
}

.text-warning {
  color: #e6a23c;
}

.text-primary {
  color: #409eff;
}

.charged-amount {
  font-weight: bold;
  color: #67c23a;
}

.executed-amount {
  font-weight: bold;
  color: #e6a23c;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-4 {
  margin-left: 16px;
}

.plan-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
  min-width: 120px;
  margin-right: 10px;
}

.amount {
  font-weight: bold;
  color: #409eff;
}

.remaining-quota-primary {
  font-weight: bold;
  color: #409eff;
}

.details-cell {
  position: relative;
}

.details-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  max-height: 2.8em; /* 2行高度 */
  word-break: break-all;
  transition: max-height 0.3s ease;
}

.details-content.expanded {
  display: block;
  max-height: none;
  -webkit-line-clamp: unset;
}

.expand-btn {
  margin-top: 4px;
  padding: 0 !important;
  font-size: 12px;
}
</style>
