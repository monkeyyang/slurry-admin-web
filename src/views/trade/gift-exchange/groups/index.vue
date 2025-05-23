<template>
  <div class="account-group-container">
    <!-- 账号组列表 -->
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>礼品卡账号组管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateGroup">
              <el-icon><Plus /></el-icon> 创建账号组
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="accountGroups"
        style="width: 100%"
        border
      >
        <el-table-column prop="name" label="组名称" min-width="120" />
        <el-table-column prop="country" label="国家/地区" width="100" />
        <el-table-column label="账号数量" width="100">
          <template #default="scope">
            {{ scope.row.accountCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="总目标金额" width="120">
          <template #default="scope">
            {{ scope.row.totalTargetAmount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="已充值金额" width="120">
          <template #default="scope">
            {{ scope.row.currentAmount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="自动切换" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.autoSwitch ? 'success' : 'info'"
              effect="plain"
            >
              {{ scope.row.autoSwitch ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="切换阈值" width="100">
          <template #default="scope">
            {{ scope.row.switchThreshold || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="plain">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEditGroup(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleManagePlans(scope.row)"
            >
              管理计划
            </el-button>
            <el-button
              v-if="scope.row.status !== 'active'"
              type="warning"
              size="small"
              @click="handleStartGroup(scope.row)"
            >
              启动
            </el-button>
            <el-button
              v-if="scope.row.status === 'active'"
              type="info"
              size="small"
              @click="handlePauseGroup(scope.row)"
            >
              暂停
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteGroup(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑账号组对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="currentGroup.id ? '编辑账号组' : '创建账号组'"
      width="50%"
    >
      <el-form
        ref="groupFormRef"
        :model="currentGroup"
        label-width="120px"
        :rules="groupRules"
      >
        <el-form-item label="组名称" prop="name">
          <el-input v-model="currentGroup.name" placeholder="请输入组名称" />
        </el-form-item>
        <el-form-item label="国家/地区" prop="country">
          <el-select v-model="currentGroup.country" placeholder="选择国家/地区">
            <el-option
              v-for="item in countries"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="currentGroup.description"
            type="textarea"
            placeholder="请输入描述信息"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="总目标金额">
          <el-input-number
            v-model="currentGroup.totalTargetAmount"
            :min="0"
            :step="1000"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="自动切换账号" prop="autoSwitch">
          <el-switch v-model="currentGroup.autoSwitch" />
        </el-form-item>
        <el-form-item
          v-if="currentGroup.autoSwitch"
          label="切换阈值"
          prop="switchThreshold"
        >
          <el-input-number
            v-model="currentGroup.switchThreshold"
            :min="0"
            :step="100"
            style="width: 100%"
          />
          <div class="form-tip">当账号达到此金额后，自动切换到下一个账号</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveGroup">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 管理计划对话框 -->
    <el-dialog v-model="plansDialogVisible" title="管理账号组计划" width="70%">
      <template #header>
        <div class="dialog-header">
          <span>管理账号组计划：{{ currentGroup.name }}</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="组内计划" name="groupPlans">
          <div class="tab-actions mb-4">
            <el-button type="primary" @click="showAddPlansDialog">
              <el-icon><Plus /></el-icon> 添加计划
            </el-button>
          </div>

          <el-table
            v-loading="plansLoading"
            :data="groupPlans"
            style="width: 100%"
            border
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="account" label="账号" min-width="150" />
            <el-table-column prop="country" label="国家" width="80" />
            <el-table-column prop="totalAmount" label="总金额" width="100" />
            <el-table-column prop="chargedAmount" label="已充值" width="100" />
            <el-table-column label="优先级" width="120">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.priority"
                  :min="1"
                  :max="999"
                  size="small"
                  @change="handlePriorityChange(scope.row)"
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
            <el-table-column label="操作" width="160">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="handleRemovePlan(scope.row)"
                >
                  移出组
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="执行记录" name="executionLogs">
          <el-table
            v-loading="logsLoading"
            :data="executionLogs"
            style="width: 100%"
            border
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="planId" label="计划ID" width="220" />
            <el-table-column prop="time" label="执行时间" width="180" />
            <el-table-column prop="action" label="操作" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag
                  :type="scope.row.status === 'success' ? 'success' : 'danger'"
                  effect="plain"
                >
                  {{ scope.row.status === "success" ? "成功" : "失败" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="details" label="详情" min-width="200" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="自动执行设置" name="autoSettings">
          <el-form :model="autoSettings" label-width="150px">
            <el-form-item label="启用自动执行">
              <el-switch v-model="autoSettings.enabled" />
            </el-form-item>
            <el-form-item label="执行间隔(分钟)">
              <el-input-number
                v-model="autoSettings.executionInterval"
                :min="1"
                :max="60"
              />
            </el-form-item>
            <el-form-item label="最大并发计划数">
              <el-input-number
                v-model="autoSettings.maxConcurrentPlans"
                :min="1"
                :max="10"
              />
            </el-form-item>
            <el-form-item label="日志级别">
              <el-select v-model="autoSettings.logLevel">
                <el-option label="详细" value="verbose" />
                <el-option label="普通" value="normal" />
                <el-option label="简略" value="simple" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveAutoSettings">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider>执行状态</el-divider>
          <div v-if="executionStatus" class="status-info">
            <p>
              <span class="status-label">运行状态:</span>
              <el-tag :type="executionStatus.isRunning ? 'success' : 'info'">
                {{ executionStatus.isRunning ? "运行中" : "已停止" }}
              </el-tag>
            </p>
            <p>
              <span class="status-label">活跃组数量:</span>
              {{ executionStatus.activeGroups }}
            </p>
            <p>
              <span class="status-label">活跃计划数量:</span>
              {{ executionStatus.activePlans }}
            </p>
            <p>
              <span class="status-label">上次执行时间:</span>
              {{ executionStatus.lastExecutionTime || "-" }}
            </p>
            <p>
              <span class="status-label">下次执行时间:</span>
              {{ executionStatus.nextExecutionTime || "-" }}
            </p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 添加计划对话框 -->
    <el-dialog
      v-model="addPlansDialogVisible"
      title="添加计划到账号组"
      width="70%"
    >
      <el-form :inline="true" :model="planSearchForm" class="mb-4">
        <el-form-item label="账号">
          <el-input
            v-model="planSearchForm.account"
            placeholder="请输入账号"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="planSearchForm.status"
            placeholder="选择状态"
            clearable
          >
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="processing" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchPlans">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="plansLoading"
        :data="availablePlans"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="account" label="账号" min-width="150" />
        <el-table-column prop="country" label="国家" width="80" />
        <el-table-column prop="totalAmount" label="总金额" width="100" />
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="plain">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="planTotal"
          :page-size="10"
          @current-change="handlePageChange"
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addPlansDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addPlansToGroup">添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, InfoFilled, SetUp } from "@element-plus/icons-vue";
import { formatDate } from "@/utils/date";
import {
  getAccountGroupsApi,
  getAccountGroupApi,
  createAccountGroupApi,
  updateAccountGroupApi,
  deleteAccountGroupApi,
  getChargePlansApi,
  addPlansToGroupApi,
  removePlansFromGroupApi,
  updatePlanPriorityApi,
  startAccountGroupApi,
  pauseAccountGroupApi,
  getAutoExecutionStatusApi,
  updateAutoExecutionSettingsApi
} from "@/api/trade/gift-exchange";
import type { AccountGroup, ChargePlan } from "@/api/trade/types";

// 国家选项
const countries = [
  { value: "CAD", label: "加拿大" },
  { value: "USD", label: "美国" },
  { value: "GBP", label: "英国" },
  { value: "AUD", label: "澳大利亚" },
  { value: "EUR", label: "欧洲" },
  { value: "JPY", label: "日本" }
];

// 加载状态
const loading = ref(false);
const plansLoading = ref(false);
const logsLoading = ref(false);

// 账号组列表
const accountGroups = ref<AccountGroup[]>([]);

// 编辑对话框
const editDialogVisible = ref(false);
const groupFormRef = ref();
const currentGroup = ref<AccountGroup>({
  name: "",
  country: "CAD",
  description: "",
  totalTargetAmount: 0,
  autoSwitch: false,
  switchThreshold: 0,
  status: "paused"
});

// 表单验证规则
const groupRules = {
  name: [{ required: true, message: "请输入组名称", trigger: "blur" }],
  country: [{ required: true, message: "请选择国家/地区", trigger: "change" }],
  autoSwitch: [
    { required: true, message: "请选择是否自动切换", trigger: "change" }
  ]
};

// 管理计划对话框
const plansDialogVisible = ref(false);
const activeTab = ref("groupPlans");
const groupPlans = ref<ChargePlan[]>([]);
const executionLogs = ref<any[]>([]);

// 自动执行设置
const autoSettings = ref({
  enabled: true,
  executionInterval: 5,
  maxConcurrentPlans: 3,
  logLevel: "normal"
});

// 执行状态
const executionStatus = ref<any>(null);

// 添加计划对话框
const addPlansDialogVisible = ref(false);
const availablePlans = ref<ChargePlan[]>([]);
const selectedPlans = ref<ChargePlan[]>([]);
const planTotal = ref(0);
const planSearchForm = reactive({
  account: "",
  status: "",
  page: 1,
  pageSize: 10
});

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "活跃";
    case "paused":
      return "暂停";
    case "completed":
      return "完成";
    case "draft":
      return "草稿";
    case "processing":
      return "进行中";
    case "cancelled":
      return "取消";
    default:
      return status;
  }
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "active":
    case "completed":
      return "success";
    case "paused":
      return "warning";
    case "draft":
      return "info";
    case "processing":
      return "primary";
    case "cancelled":
      return "danger";
    default:
      return "info";
  }
};

// 加载账号组列表
const loadAccountGroups = async () => {
  loading.value = true;
  try {
    const res = await getAccountGroupsApi();
    accountGroups.value = res.data.list || [];
  } catch (error) {
    console.error("加载账号组失败", error);
    ElMessage.error("加载账号组失败");
  } finally {
    loading.value = false;
  }
};

// 创建账号组
const handleCreateGroup = () => {
  currentGroup.value = {
    name: "",
    country: "CAD",
    description: "",
    totalTargetAmount: 0,
    autoSwitch: false,
    switchThreshold: 0,
    status: "paused"
  };
  editDialogVisible.value = true;
};

// 编辑账号组
const handleEditGroup = (group: AccountGroup) => {
  currentGroup.value = JSON.parse(JSON.stringify(group));
  editDialogVisible.value = true;
};

// 保存账号组
const saveGroup = async () => {
  if (!groupFormRef.value) return;

  await groupFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (currentGroup.value.id) {
          // 更新账号组
          await updateAccountGroupApi(
            currentGroup.value.id,
            currentGroup.value
          );
          ElMessage.success("更新账号组成功");
        } else {
          // 创建账号组
          await createAccountGroupApi(currentGroup.value);
          ElMessage.success("创建账号组成功");
        }

        editDialogVisible.value = false;
        loadAccountGroups();
      } catch (error) {
        console.error("保存账号组失败", error);
        ElMessage.error("保存账号组失败");
      }
    }
  });
};

// 删除账号组
const handleDeleteGroup = (group: AccountGroup) => {
  ElMessageBox.confirm(
    `确定要删除账号组"${group.name}"吗？此操作不可恢复。`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      if (group.id) {
        await deleteAccountGroupApi(group.id);
        ElMessage.success("删除账号组成功");
        loadAccountGroups();
      }
    } catch (error) {
      console.error("删除账号组失败", error);
      ElMessage.error("删除账号组失败");
    }
  });
};

// 管理计划
const handleManagePlans = async (group: AccountGroup) => {
  currentGroup.value = JSON.parse(JSON.stringify(group));
  plansDialogVisible.value = true;
  activeTab.value = "groupPlans";

  // 加载组内计划
  await loadGroupPlans();

  // 加载执行状态
  loadExecutionStatus();
};

// 加载组内计划
const loadGroupPlans = async () => {
  if (!currentGroup.value.id) return;

  plansLoading.value = true;
  try {
    // 这里应该使用获取组内计划的API
    // 由于没有具体API，这里模拟使用getChargePlansApi带groupId参数
    const res = await getChargePlansApi({ groupId: currentGroup.value.id });
    groupPlans.value = res.data.list || [];
  } catch (error) {
    console.error("加载组内计划失败", error);
    ElMessage.error("加载组内计划失败");
  } finally {
    plansLoading.value = false;
  }
};

// 优先级变更
const handlePriorityChange = async (plan: ChargePlan) => {
  if (!currentGroup.value.id || !plan.id) return;

  try {
    await updatePlanPriorityApi(currentGroup.value.id, [
      { planId: plan.id, priority: plan.priority || 1 }
    ]);
    ElMessage.success("更新优先级成功");
  } catch (error) {
    console.error("更新优先级失败", error);
    ElMessage.error("更新优先级失败");
  }
};

// 从组中移除计划
const handleRemovePlan = async (plan: ChargePlan) => {
  if (!currentGroup.value.id || !plan.id) return;

  ElMessageBox.confirm(
    `确定要将账号"${plan.account}"的计划从组中移除吗？`,
    "移除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await removePlansFromGroupApi(currentGroup.value.id!, [plan.id!]);
      ElMessage.success("移除计划成功");
      loadGroupPlans();
    } catch (error) {
      console.error("移除计划失败", error);
      ElMessage.error("移除计划失败");
    }
  });
};

// 显示添加计划对话框
const showAddPlansDialog = async () => {
  addPlansDialogVisible.value = true;
  planSearchForm.page = 1;
  selectedPlans.value = [];

  // 加载可用计划
  await searchPlans();
};

// 搜索计划
const searchPlans = async () => {
  plansLoading.value = true;
  try {
    // 构建查询参数
    const params = {
      page: planSearchForm.page,
      pageSize: planSearchForm.pageSize,
      country: currentGroup.value.country
    };

    if (planSearchForm.account) {
      params["account"] = planSearchForm.account;
    }

    if (planSearchForm.status) {
      params["status"] = planSearchForm.status;
    }

    // 不在当前组内的计划
    params["notInGroup"] = currentGroup.value.id;

    const res = await getChargePlansApi(params);
    availablePlans.value = res.data.list || [];
    planTotal.value = res.data.total || 0;
  } catch (error) {
    console.error("搜索计划失败", error);
    ElMessage.error("搜索计划失败");
  } finally {
    plansLoading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (page: number) => {
  planSearchForm.page = page;
  searchPlans();
};

// 处理选择变化
const handleSelectionChange = (selection: ChargePlan[]) => {
  selectedPlans.value = selection;
};

// 添加计划到组
const addPlansToGroup = async () => {
  if (!currentGroup.value.id) return;

  if (selectedPlans.value.length === 0) {
    ElMessage.warning("请选择要添加的计划");
    return;
  }

  try {
    const planIds = selectedPlans.value.map(plan => plan.id!).filter(id => id);
    await addPlansToGroupApi(currentGroup.value.id, planIds);
    ElMessage.success("添加计划成功");
    addPlansDialogVisible.value = false;
    loadGroupPlans();
  } catch (error) {
    console.error("添加计划失败", error);
    ElMessage.error("添加计划失败");
  }
};

// 启动账号组
const handleStartGroup = async (group: AccountGroup) => {
  if (!group.id) return;

  try {
    await startAccountGroupApi(group.id);
    ElMessage.success("启动账号组成功");
    loadAccountGroups();
  } catch (error) {
    console.error("启动账号组失败", error);
    ElMessage.error("启动账号组失败");
  }
};

// 暂停账号组
const handlePauseGroup = async (group: AccountGroup) => {
  if (!group.id) return;

  try {
    await pauseAccountGroupApi(group.id);
    ElMessage.success("暂停账号组成功");
    loadAccountGroups();
  } catch (error) {
    console.error("暂停账号组失败", error);
    ElMessage.error("暂停账号组失败");
  }
};

// 加载执行状态
const loadExecutionStatus = async () => {
  try {
    const res = await getAutoExecutionStatusApi();
    executionStatus.value = res.data;
  } catch (error) {
    console.error("加载执行状态失败", error);
  }
};

// 保存自动执行设置
const saveAutoSettings = async () => {
  try {
    await updateAutoExecutionSettingsApi(autoSettings.value);
    ElMessage.success("保存设置成功");
    loadExecutionStatus();
  } catch (error) {
    console.error("保存设置失败", error);
    ElMessage.error("保存设置失败");
  }
};

// 页面加载时初始化
onMounted(() => {
  loadAccountGroups();
});
</script>

<style scoped>
.account-group-container {
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

.mb-4 {
  margin-bottom: 16px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.status-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.status-label {
  display: inline-block;
  width: 120px;
  font-weight: bold;
  margin-right: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
