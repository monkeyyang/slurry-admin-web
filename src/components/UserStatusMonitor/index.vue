<template>
  <div class="user-status-monitor">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>已登录用户状态监控</span>
          <div class="header-actions">
            <el-select
              v-model="selectedCountry"
              placeholder="选择国家/地区筛选"
              filterable
              clearable
              :loading="countriesLoading"
              :filter-method="filterCountries"
              style="width: 200px; margin-right: 10px"
              @change="handleCountryChange"
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
            <el-switch
              v-model="isMonitoring"
              active-text="监控中"
              inactive-text="已停止"
              @change="handleMonitorToggle"
            />
          </div>
        </div>
      </template>

      <el-empty v-if="isEmpty" description="暂无已登录用户数据" />

      <div v-else>
        <el-table
          v-loading="loading"
          :data="filteredUserStatusList"
          style="width: 100%"
          border
        >
          <el-table-column prop="username" label="用户名" min-width="150" />
          <el-table-column prop="balance" label="余额" width="100" />
          <el-table-column prop="country" label="国家/地区" width="120" />
          <el-table-column prop="countryCode" label="国家代码" width="100" />
          <el-table-column label="状态码" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.code)" effect="plain">
                {{ scope.row.code }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="refreshTime" label="刷新时间" width="180" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import userStatusMonitor, { UserStatusData } from "@/utils/userMonitor";
import { getCountriesListApi } from "@/api/system/countries";

// 监控状态
const isMonitoring = ref(false);
const loading = ref(false);

// 国家数据
const countriesList = ref([]);
const countriesLoading = ref(false);
const selectedCountry = ref("");

// 用户状态数据
const userStatusMap = ref<Map<string, UserStatusData[]>>(new Map());
const userStatusList = computed(() => {
  if (userStatusMap.value.size === 0) return [];

  // 将Map中的所有用户数据合并为一个平铺的数组
  const result: UserStatusData[] = [];
  userStatusMap.value.forEach(valueList => {
    if (valueList && valueList.length > 0) {
      result.push(...valueList);
    }
  });

  return result;
});

// 根据选择的国家/地区筛选用户列表
const filteredUserStatusList = computed(() => {
  if (!selectedCountry.value) return userStatusList.value;
  return userStatusList.value.filter(
    user => user.countryCode === selectedCountry.value
  );
});

// 是否为空数据
const isEmpty = computed(() => filteredUserStatusList.value.length === 0);

// 获取国家列表
const getCountriesList = async () => {
  countriesLoading.value = true;
  try {
    const response = await getCountriesListApi({
      pageSize: 100, // 获取最多100条国家数据
      status: "1" // 只获取启用状态的国家
    });

    if (response && response.code === 0 && response.data) {
      // 确保数据结构正确
      countriesList.value = Array.isArray(response.data.data)
        ? response.data.data.map(item => ({
            ...item,
            code: item.code || "",
            name_zh: item.name_zh || item.code || "",
            name_en: item.name_en || ""
          }))
        : [];
      console.log(`成功获取${countriesList.value.length}个国家`);
    } else {
      console.error("获取国家列表失败:", response);
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

// 处理国家变更
const handleCountryChange = value => {
  console.log("筛选国家变更为:", value);
};

// 切换监控状态
const handleMonitorToggle = (val: boolean) => {
  if (val) {
    startMonitoring();
  } else {
    stopMonitoring();
  }
};

// 开始监控
const startMonitoring = () => {
  loading.value = true;

  // 监听用户状态事件
  userStatusMonitor.on("userMonitor:init", handleInitEvent);
  userStatusMonitor.on("userMonitor:update", handleUpdateEvent);
  userStatusMonitor.on("userMonitor:delete", handleDeleteEvent);
  userStatusMonitor.on("userMonitor:connected", handleConnectedEvent);
  userStatusMonitor.on("userMonitor:disconnected", handleDisconnectedEvent);
  userStatusMonitor.on("userMonitor:error", handleErrorEvent);

  // 启动监控
  userStatusMonitor.start();
};

// 停止监控
const stopMonitoring = () => {
  // 取消监听
  userStatusMonitor.off("userMonitor:init", handleInitEvent);
  userStatusMonitor.off("userMonitor:update", handleUpdateEvent);
  userStatusMonitor.off("userMonitor:delete", handleDeleteEvent);
  userStatusMonitor.off("userMonitor:connected", handleConnectedEvent);
  userStatusMonitor.off("userMonitor:disconnected", handleDisconnectedEvent);
  userStatusMonitor.off("userMonitor:error", handleErrorEvent);

  // 停止监控
  userStatusMonitor.stop();

  loading.value = false;
};

// 处理状态事件
const handleInitEvent = (data: { key: string; value: UserStatusData[] }) => {
  userStatusMap.value = new Map();
  userStatusMap.value.set(data.key, data.value);
  loading.value = false;

  ElMessage.success("用户状态数据已初始化");
};

const handleUpdateEvent = (data: { key: string; value: UserStatusData[] }) => {
  userStatusMap.value.set(data.key, data.value);
};

const handleDeleteEvent = (data: { key: string; value: UserStatusData[] }) => {
  userStatusMap.value.delete(data.key);
};

const handleConnectedEvent = () => {
  loading.value = false;
  ElMessage.success("用户状态监控连接成功");
};

const handleDisconnectedEvent = (data: { code: number; reason: string }) => {
  loading.value = false;
  ElMessage.warning(`连接已断开: ${data.reason || "未知原因"}`);
};

const handleErrorEvent = (error: any) => {
  loading.value = false;
  ElMessage.error(`连接错误: ${error?.message || "未知错误"}`);
};

// 获取状态标签类型
const getStatusTagType = (
  code: number
): "success" | "warning" | "info" | "primary" | "danger" => {
  if (code === 0) return "success";
  if (code >= 400 && code < 500) return "warning";
  if (code >= 500) return "danger";
  return "info";
};

// 组件挂载时
onMounted(() => {
  getCountriesList();
  startMonitoring();
  isMonitoring.value = true;
});

// 组件卸载前
onBeforeUnmount(() => {
  if (isMonitoring.value) {
    stopMonitoring();
  }
});
</script>

<style scoped>
.user-status-monitor {
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
  align-items: center;
}

.mb-4 {
  margin-bottom: 16px;
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
</style>
