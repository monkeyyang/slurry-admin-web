<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="账号" prop="account">
        <el-input
          v-model="searchFormParams.account"
          placeholder="请输入账号"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="国家/地区" prop="country">
        <el-select
          v-model="searchFormParams.country"
          placeholder="请选择国家"
          clearable
          class="!w-[150px]"
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
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-[120px]"
        >
          <el-option label="全部" value="" />
          <el-option label="活跃" value="active" />
          <el-option label="非活跃" value="inactive" />
          <el-option label="已封禁" value="blocked" />
        </el-select>
      </el-form-item>
      <el-form-item label="导入者" prop="importedBy">
        <el-input
          v-model="searchFormParams.importedBy"
          placeholder="请输入导入者昵称"
          clearable
          class="!w-[150px]"
        />
      </el-form-item>
      <el-form-item label="导入时间" prop="dateRange">
        <el-date-picker
          v-model="searchFormParams.dateRange"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-[300px]"
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
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="账号管理" @refresh="getList">
      <template #buttons>
        <el-button
          type="danger"
          :icon="useRenderIcon(DeleteIcon)"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="primary"
          :icon="useRenderIcon(UploadIcon)"
          @click="openImportDialog"
        >
          批量导入
        </el-button>
      </template>

      <transition name="fade" mode="out-in">
        <el-table
          v-if="accountList.length > 0 || loading"
          ref="tableRef"
          key="data-table"
          v-loading="loading"
          :data="accountList"
          border
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            type="index"
            label="序号"
            width="70"
            align="center"
          />
          <el-table-column
            prop="account"
            label="账号"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column
            prop="country"
            label="国家"
            width="80"
            align="center"
          />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="导入者" width="120" align="center">
            <template #default="{ row }">
              <span
                :class="row.importedByNickname ? 'imported-by' : 'text-muted'"
              >
                {{ row.importedByNickname || "未知" }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="导入时间" width="180" align="center">
            <template #default="{ row }">
              <span :class="row.importedAt ? '' : 'text-muted'">
                {{ row.importedAt ? formatDateTime(row.importedAt) : "-" }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180" align="center">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            fixed="right"
            width="160"
            align="center"
          >
            <template #default="{ row }">
              <el-button
                type="warning"
                link
                :icon="Edit"
                @click="changeAccountStatus(row)"
              >
                修改状态
              </el-button>
              <el-button
                type="danger"
                link
                :icon="Delete"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-else key="empty-placeholder" class="empty-placeholder">
          <el-empty description="暂无数据" />
        </div>
      </transition>

      <template #pagination>
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          :background="pagination.background"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </template>
    </PureTableBar>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入账号"
      width="600px"
      @close="resetImportForm"
    >
      <el-form
        ref="importFormRef"
        :model="importForm"
        :rules="importRules"
        label-width="100px"
      >
        <el-form-item label="账号信息" prop="accounts">
          <el-input
            v-model="importForm.accounts"
            type="textarea"
            :rows="8"
            placeholder="请输入账号信息，每行一个账号"
          />
          <div class="form-tip">
            格式说明：每行一个账号，使用空格分隔账号、密码和API链接（API链接可选）<br />
            示例1：gordon123@icloud.com MyPassword123<br />
            示例2：gordon123@icloud.com MyPassword123
            https://api.example.com/endpoint<br />
            示例3：test456@gmail.com SecurePass456
            https://secure-api.example.com/verify
          </div>
        </el-form-item>
        <el-form-item label="国家/地区" prop="country">
          <el-select
            v-model="importForm.country"
            placeholder="选择国家/地区"
            class="w-full"
          >
            <el-option
              v-for="item in countriesList"
              :key="item.code"
              :label="item.name_zh"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImportAccounts"
          >确定导入</el-button
        >
      </template>
    </el-dialog>

    <!-- 状态更改对话框 -->
    <el-dialog v-model="showStatusDialog" title="更改账号状态" width="400px">
      <el-form label-width="80px">
        <el-form-item label="账号">
          <span>{{ currentAccount?.account }}</span>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(currentAccount?.status)" size="small">
            {{ getStatusText(currentAccount?.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新状态">
          <el-select
            v-model="newStatus"
            placeholder="选择新状态"
            class="w-full"
          >
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="已封禁" value="blocked" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="handleStatusChange"
          >确定更改</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { Edit, Delete, Upload } from "@element-plus/icons-vue";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import DeleteIcon from "@iconify-icons/ep/delete";
import UploadIcon from "@iconify-icons/ep/upload";
import {
  getAccountsApi,
  batchImportAccountsApi,
  updateAccountStatusApi,
  deleteAccountApi,
  batchDeleteAccountsApi,
  getCountriesForAccountApi,
  type Account,
  type AccountQueryParams,
  type BatchImportAccountsRequest,
  type ImportAccountInfo
} from "@/api/trade/account";

defineOptions({
  name: "AccountManage"
});

// 页面状态
const formRef = ref();
const tableRef = ref();
const loading = ref(false);
const showImportDialog = ref(false);
const showStatusDialog = ref(false);

// 列表数据
const accountList = ref<Account[]>([]);
const selectedRows = ref<Account[]>([]);
const total = ref(0);
const currentAccount = ref<Account | null>(null);
const newStatus = ref("");

// 下拉选项
const countriesList = ref([]);

// 分页配置
const pagination = reactive({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  background: true
});

// 搜索表单
const searchFormParams = reactive({
  account: "",
  country: "",
  status: "",
  importedBy: "",
  dateRange: []
});

// 导入表单
const importForm = reactive({
  accounts: "",
  country: ""
});

const importRules = {
  accounts: [{ required: true, message: "请输入账号信息", trigger: "blur" }],
  country: [{ required: true, message: "请选择国家/地区", trigger: "change" }]
};

const importFormRef = ref();

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "活跃";
    case "inactive":
      return "非活跃";
    case "blocked":
      return "已封禁";
    default:
      return "未知";
  }
};

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 表格选择变化
const handleSelectionChange = (selection: Account[]) => {
  selectedRows.value = selection;
};

// 搜索
const onSearch = async () => {
  pagination.currentPage = 1;
  await getList();
};

// 重置搜索
const resetForm = (formEl: any) => {
  if (!formEl) return;
  formEl.resetFields();
  Object.assign(searchFormParams, {
    account: "",
    country: "",
    status: "",
    importedBy: "",
    dateRange: []
  });
  onSearch();
};

// 更改账号状态
const changeAccountStatus = (account: Account) => {
  currentAccount.value = account;
  newStatus.value = account.status;
  showStatusDialog.value = true;
};

// 确认状态更改
const handleStatusChange = async () => {
  if (!currentAccount.value?.id || !newStatus.value) return;

  try {
    await updateAccountStatusApi(currentAccount.value.id, newStatus.value);
    ElMessage.success("状态更改成功");
    showStatusDialog.value = false;
    await getList();
  } catch (error) {
    console.error("状态更改失败:", error);
    ElMessage.error("状态更改失败");
  }
};

// 删除账号
const handleDelete = async (account: Account) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账号 ${account.account} 吗？`,
      "确认删除",
      {
        type: "warning"
      }
    );

    if (account.id) {
      await deleteAccountApi(account.id);
      ElMessage.success("删除成功");
      await getList();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 批量删除
const handleBatchDelete = async (rows: Account[]) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${rows.length} 个账号吗？`,
      "确认批量删除",
      {
        type: "warning"
      }
    );

    const ids = rows.map(row => row.id!).filter(Boolean);
    await batchDeleteAccountsApi(ids);
    ElMessage.success(`成功删除 ${rows.length} 个账号`);
    await getList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("批量删除失败");
    }
  }
};

// 打开导入对话框
const openImportDialog = () => {
  showImportDialog.value = true;
};

// 批量导入账号
const handleImportAccounts = async () => {
  if (!importFormRef.value) return;

  try {
    await importFormRef.value.validate();

    // 解析账号信息 - 支持账号、密码、API链接格式
    const accounts = importForm.accounts
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) {
          return null; // 至少需要账号和密码
        }

        const account = parts[0];
        const password = parts[1];
        const apiUrl = parts[2] || ""; // API链接可选

        // 简单邮箱格式验证
        if (!account.includes("@")) {
          return null;
        }

        return {
          account,
          password,
          apiUrl
        } as ImportAccountInfo;
      })
      .filter((item): item is ImportAccountInfo => item !== null);

    if (accounts.length === 0) {
      ElMessage.error("请输入有效的账号信息（格式：邮箱 密码 [API链接]）");
      return;
    }

    const importData: BatchImportAccountsRequest = {
      country: importForm.country,
      accounts: accounts
    };

    const response = await batchImportAccountsApi(importData);

    // 检查响应数据，处理成功和失败情况
    if (response && response.code === 0 && response.data) {
      const data = response.data;
      const { successCount, failCount, duplicateAccounts } = data;

      if (successCount > 0 && failCount === 0) {
        // 全部成功
        ElMessage.success(`成功导入 ${successCount} 个账号`);
        showImportDialog.value = false;
        resetImportForm();
        await getList();
      } else if (successCount > 0 && failCount > 0) {
        // 部分成功
        let message = `成功导入 ${successCount} 个账号，失败 ${failCount} 个`;
        if (duplicateAccounts && duplicateAccounts.length > 0) {
          message += `。重复账号：${duplicateAccounts.join(", ")}`;
        }
        ElMessage.warning(message);
        showImportDialog.value = false;
        resetImportForm();
        await getList();
      } else if (failCount > 0) {
        // 全部失败
        let message = `导入失败，共 ${failCount} 个账号`;
        if (duplicateAccounts && duplicateAccounts.length > 0) {
          message += `。重复账号：${duplicateAccounts.join(", ")}`;
        }
        ElMessage.error(message);
      } else {
        // 未知情况
        ElMessage.error("导入账号失败");
      }
    } else {
      ElMessage.error(response?.message || "导入账号失败");
    }
  } catch (error) {
    console.error("导入账号失败:", error);
    ElMessage.error("导入账号失败");
  }
};

// 重置导入表单
const resetImportForm = () => {
  if (importFormRef.value) {
    importFormRef.value.resetFields();
  }
  Object.assign(importForm, {
    accounts: "",
    country: ""
  });
};

// 加载账号列表
const getList = async () => {
  loading.value = true;
  try {
    const params: AccountQueryParams = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
      account: searchFormParams.account || undefined,
      country: searchFormParams.country || undefined,
      status: searchFormParams.status || undefined,
      importedBy: searchFormParams.importedBy || undefined
    };

    // 处理日期范围
    if (searchFormParams.dateRange && searchFormParams.dateRange.length === 2) {
      params.startTime = searchFormParams.dateRange[0];
      params.endTime = searchFormParams.dateRange[1];
    }

    const response = await getAccountsApi(params);

    if (response && response.code === 0) {
      // 处理不同的数据结构
      if (response.data) {
        if (Array.isArray(response.data)) {
          // 如果data直接是数组
          accountList.value = response.data.map(item => ({
            ...item,
            id: item.id || Math.random().toString(),
            account: item.account || "",
            country: item.country || "",
            status: item.status || "inactive",
            importedByNickname: item.importedByNickname || "",
            importedAt: item.importedAt || "",
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
          }));
          pagination.total = response.data.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 如果是分页结构 {data: [], total: number}
          accountList.value = response.data.data.map(item => ({
            ...item,
            id: item.id || Math.random().toString(),
            account: item.account || "",
            country: item.country || "",
            status: item.status || "inactive",
            importedByNickname: item.importedByNickname || "",
            importedAt: item.importedAt || "",
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
          }));
          pagination.total = response.data.total || response.data.data.length;
        } else if (
          (response.data as any).list &&
          Array.isArray((response.data as any).list)
        ) {
          // 如果是 {list: [], total: number} 结构
          accountList.value = (response.data as any).list.map(item => ({
            ...item,
            id: item.id || Math.random().toString(),
            account: item.account || "",
            country: item.country || "",
            status: item.status || "inactive",
            importedByNickname: item.importedByNickname || "",
            importedAt: item.importedAt || "",
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || ""
          }));
          pagination.total =
            (response.data as any).total || (response.data as any).list.length;
        } else {
          console.warn("未知的数据结构:", response.data);
          accountList.value = [];
          pagination.total = 0;
        }
      } else {
        accountList.value = [];
        pagination.total = 0;
      }
    } else {
      console.error("获取账号列表失败:", response);
      ElMessage.error(response?.message || "获取账号列表失败");
      accountList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error("获取账号列表失败:", error);
    ElMessage.error("获取账号列表失败");
    // 失败时设置为空数组，避免页面报错
    accountList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 加载国家列表
const loadCountries = async () => {
  try {
    const response = await getCountriesForAccountApi();
    if (response && response.code === 0 && response.data) {
      // 处理分页数据格式
      countriesList.value = Array.isArray(response.data.data)
        ? response.data.data.map(item => ({
            code: item.code || "",
            name_zh: item.name_zh || item.code || "",
            name_en: item.name_en || ""
          }))
        : [];
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

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getList();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getList();
};

// 初始化
onMounted(async () => {
  await Promise.all([getList(), loadCountries()]);
});
</script>

<style scoped lang="scss">
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.empty-placeholder {
  padding: 40px 0;
}

.text-muted {
  color: #999;
}

.imported-by {
  font-weight: 500;
  color: #409eff;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  line-height: 1.4;
}

:deep(.el-tag) {
  white-space: nowrap;
}
</style>
