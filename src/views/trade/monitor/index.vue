<template>
  <div class="monitor-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon success">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.successCount }}</div>
            <div class="stat-label">成功兑换</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon error">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.failedCount }}</div>
            <div class="stat-label">失败次数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon processing">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.processingCount }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon rate">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.successRate }}%</div>
            <div class="stat-label">成功率</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 实时状态 -->
    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">实时状态</span>
          <div class="status-indicator">
            <div
              :class="[
                'status-dot',
                realtimeStatus.isRunning ? 'running' : 'stopped'
              ]"
            />
            <span class="status-text">
              {{ realtimeStatus.isRunning ? "运行中" : "已停止" }}
            </span>
          </div>
        </div>
      </template>

      <div class="status-content">
        <div v-if="realtimeStatus.currentTask" class="current-task">
          <div class="task-info">
            <span class="task-label">当前任务:</span>
            <span class="task-account">{{
              realtimeStatus.currentTask.account
            }}</span>
            <span class="task-day"
              >第{{ realtimeStatus.currentTask.currentDay }}天</span
            >
          </div>
          <div class="task-time">
            开始时间:
            {{
              formatDate(
                new Date(realtimeStatus.currentTask.startTime),
                "YYYY-MM-DD HH:mm:ss"
              )
            }}
          </div>
        </div>
        <div v-else class="no-task">
          <span>暂无执行任务</span>
        </div>

        <div class="queue-info">
          <span>队列中任务: {{ realtimeStatus.queueCount }}</span>
        </div>
      </div>
    </el-card>

    <!-- 控制面板 -->
    <el-card class="control-panel">
      <template #header>
        <div class="card-header">
          <span class="card-title">监控控制</span>
          <div class="connection-status">
            <div
              :class="[
                'connection-dot',
                isWebSocketConnected ? 'connected' : 'disconnected'
              ]"
            />
            <span class="connection-text">
              {{ isWebSocketConnected ? "已连接" : "未连接" }}
            </span>
          </div>
        </div>
      </template>

      <div class="control-content">
        <!-- 开发模式切换 -->
        <div class="dev-mode-section">
          <el-switch
            v-model="isDevelopmentMode"
            active-text="开发模式"
            inactive-text="生产模式"
            @change="handleDevModeChange"
          />
          <span class="dev-mode-tip"> 开发模式将使用模拟数据进行演示 </span>
        </div>

        <div class="control-buttons">
          <el-button
            type="primary"
            :icon="isWebSocketConnected ? VideoPause : VideoPlay"
            @click="toggleWebSocket"
          >
            {{ isWebSocketConnected ? "停止监控" : "开始监控" }}
          </el-button>

          <el-button
            type="success"
            :icon="Refresh"
            :loading="refreshing"
            @click="refreshData"
          >
            刷新数据
          </el-button>

          <el-button type="warning" :icon="Download" @click="exportLogs">
            导出日志
          </el-button>

          <el-button type="danger" :icon="Delete" @click="clearLogs">
            清空日志
          </el-button>

          <!-- 开发模式下的测试按钮 -->
          <template v-if="isDevelopmentMode">
            <el-button type="info" @click="sendTestLog(LogLevel.ERROR)">
              发送错误日志
            </el-button>
            <el-button type="warning" @click="sendTestLog(LogLevel.WARNING)">
              发送警告日志
            </el-button>
            <el-button type="success" @click="sendTestLog(LogLevel.INFO)">
              发送信息日志
            </el-button>
          </template>
        </div>
      </div>
    </el-card>

    <!-- 日志过滤器 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="日志级别">
          <el-select
            v-model="filterForm.level"
            placeholder="全部级别"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="错误" value="ERROR" />
            <el-option label="警告" value="WARNING" />
            <el-option label="信息" value="INFO" />
            <el-option label="调试" value="DEBUG" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部状态"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="处理中" value="processing" />
            <el-option label="等待中" value="waiting" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索日志内容"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="applyFilter">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 实时日志显示 -->
    <el-card class="log-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">实时日志</span>
          <div class="log-controls">
            <el-switch
              v-model="autoScroll"
              active-text="自动滚动"
              inactive-text="停止滚动"
            />
            <el-button
              size="small"
              type="primary"
              :icon="Bottom"
              @click="scrollToBottom"
            >
              滚动到底部
            </el-button>
          </div>
        </div>
      </template>

      <div ref="logContainer" class="log-container" @scroll="handleScroll">
        <div
          v-for="log in displayLogs"
          :key="log.id"
          :class="['log-entry', `log-${log.level.toLowerCase()}`]"
        >
          <div class="log-header">
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <el-tag
              :type="getLogLevelTagType(log.level)"
              size="small"
              class="log-level"
            >
              {{ log.level }}
            </el-tag>
            <el-tag
              v-if="log.status"
              :type="getLogStatusTagType(log.status)"
              size="small"
              class="log-status"
            >
              {{ getLogStatusText(log.status) }}
            </el-tag>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.errorMessage" class="log-error">
            错误详情: {{ log.errorMessage }}
          </div>
          <div v-if="log.metadata" class="log-metadata">
            <el-collapse>
              <el-collapse-item title="详细信息" name="metadata">
                <pre>{{ JSON.stringify(log.metadata, null, 2) }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>

        <div v-if="displayLogs.length === 0" class="no-logs">
          <el-empty description="暂无日志数据" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  SuccessFilled,
  CircleCloseFilled,
  Loading,
  TrendCharts,
  VideoPlay,
  VideoPause,
  Refresh,
  Download,
  Delete,
  Bottom
} from "@element-plus/icons-vue";
import {
  monitorApi,
  MonitorWebSocket,
  type LogEntry,
  type MonitorStats,
  type RealtimeStatus,
  type LogQueryParams,
  LogLevel,
  LogStatus
} from "@/api/trade/monitor";
import { formatDate } from "@/utils/date";
import {
  generateMockStats,
  generateMockRealtimeStatus,
  generateMockLogs,
  MockWebSocketGenerator
} from "@/utils/mockMonitorData";

// 响应式数据
const stats = ref<MonitorStats>({
  totalExchanges: 0,
  successCount: 0,
  failedCount: 0,
  processingCount: 0,
  successRate: 0,
  todayExchanges: 0,
  todaySuccessCount: 0,
  todayFailedCount: 0
});

const realtimeStatus = ref<RealtimeStatus>({
  isRunning: false,
  queueCount: 0,
  lastUpdateTime: ""
});

const logs = ref<LogEntry[]>([]);
const isWebSocketConnected = ref(false);
const autoScroll = ref(true);
const refreshing = ref(false);
const isDevelopmentMode = ref(false);

// 过滤表单
const filterForm = reactive<LogQueryParams>({
  level: undefined,
  status: undefined,
  keyword: ""
});

// WebSocket实例
let webSocket: MonitorWebSocket | null = null;

// 模拟数据生成器
let mockGenerator: MockWebSocketGenerator | null = null;

// DOM引用
const logContainer = ref<HTMLElement>();

// 计算属性 - 过滤后的日志
const displayLogs = computed(() => {
  let filtered = logs.value;

  if (filterForm.level) {
    filtered = filtered.filter(log => log.level === filterForm.level);
  }

  if (filterForm.status) {
    filtered = filtered.filter(log => log.status === filterForm.status);
  }

  if (filterForm.keyword) {
    const keyword = filterForm.keyword.toLowerCase();
    filtered = filtered.filter(
      log =>
        log.message.toLowerCase().includes(keyword) ||
        (log.errorMessage && log.errorMessage.toLowerCase().includes(keyword))
    );
  }

  return filtered;
});

// 获取WebSocket URL
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws/monitor`;
};

// 初始化WebSocket连接
const initWebSocket = () => {
  if (isDevelopmentMode.value) {
    // 开发模式使用模拟数据
    initMockGenerator();
  } else {
    // 生产模式使用真实WebSocket
    if (webSocket) {
      webSocket.disconnect();
    }

    webSocket = new MonitorWebSocket(
      getWebSocketUrl(),
      handleNewLog,
      handleStatusUpdate,
      handleWebSocketError
    );

    webSocket.connect();
    isWebSocketConnected.value = webSocket.isConnected();
  }
};

// 初始化模拟数据生成器
const initMockGenerator = () => {
  if (mockGenerator) {
    mockGenerator.stop();
  }

  mockGenerator = new MockWebSocketGenerator(
    handleNewLog,
    handleStatusUpdate,
    1500 // 1.5秒发送一次消息
  );

  mockGenerator.start();
  isWebSocketConnected.value = mockGenerator.isActive();
};

// 处理新日志
const handleNewLog = (log: LogEntry) => {
  logs.value.unshift(log);

  // 限制日志数量，避免内存溢出
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(0, 1000);
  }

  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }

  // 更新统计数据
  updateStatsFromLog(log);
};

// 处理状态更新
const handleStatusUpdate = (status: RealtimeStatus) => {
  realtimeStatus.value = status;
};

// 处理WebSocket错误
const handleWebSocketError = (error: Event) => {
  console.error("WebSocket连接错误:", error);
  isWebSocketConnected.value = false;
  ElMessage.error("WebSocket连接失败，请检查网络连接");
};

// 从日志更新统计数据
const updateStatsFromLog = (log: LogEntry) => {
  if (log.status === LogStatus.SUCCESS) {
    stats.value.successCount++;
    stats.value.todaySuccessCount++;
  } else if (log.status === LogStatus.FAILED) {
    stats.value.failedCount++;
    stats.value.todayFailedCount++;
  } else if (log.status === LogStatus.PROCESSING) {
    stats.value.processingCount++;
  }

  stats.value.totalExchanges++;
  stats.value.todayExchanges++;

  // 重新计算成功率
  if (stats.value.totalExchanges > 0) {
    stats.value.successRate = Math.round(
      (stats.value.successCount / stats.value.totalExchanges) * 100
    );
  }
};

// 切换WebSocket连接
const toggleWebSocket = () => {
  if (isWebSocketConnected.value) {
    if (isDevelopmentMode.value) {
      mockGenerator?.stop();
    } else {
      webSocket?.disconnect();
    }
    isWebSocketConnected.value = false;
    ElMessage.success("监控已停止");
  } else {
    initWebSocket();
    ElMessage.success("监控已启动");
  }
};

// 处理开发模式切换
const handleDevModeChange = () => {
  // 停止当前连接
  if (isWebSocketConnected.value) {
    if (isDevelopmentMode.value) {
      webSocket?.disconnect();
    } else {
      mockGenerator?.stop();
    }
    isWebSocketConnected.value = false;
  }

  // 清空现有日志
  logs.value = [];

  // 重新加载数据
  refreshData();

  ElMessage.success(`已切换到${isDevelopmentMode.value ? "开发" : "生产"}模式`);
};

// 发送测试日志
const sendTestLog = (level: LogLevel) => {
  if (isDevelopmentMode.value && mockGenerator) {
    mockGenerator.sendLog(level);
    ElMessage.success(`已发送${level}级别测试日志`);
  }
};

// 刷新数据
const refreshData = async () => {
  refreshing.value = true;
  try {
    if (isDevelopmentMode.value) {
      // 开发模式使用模拟数据
      stats.value = generateMockStats();
      realtimeStatus.value = generateMockRealtimeStatus();
      logs.value = generateMockLogs(50);
    } else {
      // 生产模式调用真实API
      await Promise.all([loadStats(), loadRealtimeStatus(), loadLogs()]);
    }
    ElMessage.success("数据刷新成功");
  } catch (error) {
    console.error("刷新数据失败:", error);
    ElMessage.error("数据刷新失败");
  } finally {
    refreshing.value = false;
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await monitorApi.getStats();
    stats.value = response.data;
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
};

// 加载实时状态
const loadRealtimeStatus = async () => {
  try {
    const response = await monitorApi.getRealtimeStatus();
    realtimeStatus.value = response.data;
  } catch (error) {
    console.error("加载实时状态失败:", error);
  }
};

// 加载日志
const loadLogs = async () => {
  try {
    const response = await monitorApi.getLogs({
      pageNum: 1,
      pageSize: 100
    });
    logs.value = response.data.data;
  } catch (error) {
    console.error("加载日志失败:", error);
  }
};

// 导出日志
const exportLogs = async () => {
  try {
    if (isDevelopmentMode.value) {
      ElMessage.info("开发模式下暂不支持导出功能");
      return;
    }

    const blob = await monitorApi.exportLogs(filterForm);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monitor_logs_${new Date().getTime()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success("日志导出成功");
  } catch (error) {
    console.error("导出日志失败:", error);
    ElMessage.error("导出日志失败");
  }
};

// 清空日志
const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有日志吗？此操作不可恢复。",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    if (isDevelopmentMode.value) {
      logs.value = [];
    } else {
      await monitorApi.clearLogs();
      logs.value = [];
    }

    ElMessage.success("日志清空成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("清空日志失败:", error);
      ElMessage.error("清空日志失败");
    }
  }
};

// 应用过滤器
const applyFilter = () => {
  // 过滤逻辑在计算属性中处理
  ElMessage.success("过滤条件已应用");
};

// 重置过滤器
const resetFilter = () => {
  filterForm.level = undefined;
  filterForm.status = undefined;
  filterForm.keyword = "";
  ElMessage.success("过滤条件已重置");
};

// 滚动到底部
const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
};

// 处理滚动事件
const handleScroll = () => {
  if (!logContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = logContainer.value;
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

  if (!isAtBottom) {
    autoScroll.value = false;
  }
};

// 格式化日志时间
const formatLogTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};

// 获取日志级别标签类型
const getLogLevelTagType = (level: LogLevel) => {
  switch (level) {
    case LogLevel.ERROR:
      return "danger";
    case LogLevel.WARNING:
      return "warning";
    case LogLevel.INFO:
      return "primary";
    case LogLevel.DEBUG:
      return "info";
    default:
      return "primary";
  }
};

// 获取日志状态标签类型
const getLogStatusTagType = (status: LogStatus) => {
  switch (status) {
    case LogStatus.SUCCESS:
      return "success";
    case LogStatus.FAILED:
      return "danger";
    case LogStatus.PROCESSING:
      return "warning";
    case LogStatus.WAITING:
      return "info";
    default:
      return "primary";
  }
};

// 获取日志状态文本
const getLogStatusText = (status: LogStatus) => {
  switch (status) {
    case LogStatus.SUCCESS:
      return "成功";
    case LogStatus.FAILED:
      return "失败";
    case LogStatus.PROCESSING:
      return "处理中";
    case LogStatus.WAITING:
      return "等待中";
    default:
      return "";
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化数据
  refreshData();

  // 启动WebSocket连接
  initWebSocket();

  // 定期检查WebSocket连接状态
  const checkConnection = setInterval(() => {
    if (isDevelopmentMode.value) {
      isWebSocketConnected.value = mockGenerator?.isActive() || false;
    } else {
      isWebSocketConnected.value = webSocket?.isConnected() || false;
    }
  }, 1000);

  // 清理定时器
  onUnmounted(() => {
    clearInterval(checkConnection);
  });
});

onUnmounted(() => {
  // 断开WebSocket连接
  if (webSocket) {
    webSocket.disconnect();
  }

  // 停止模拟数据生成器
  if (mockGenerator) {
    mockGenerator.stop();
  }
});
</script>

<style scoped>
.monitor-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.error {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

/* 状态卡片 */
.status-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot.running {
  background-color: #67c23a;
  animation: pulse 2s infinite;
}

.status-dot.stopped {
  background-color: #f56c6c;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(103, 194, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}

.status-text {
  font-size: 14px;
  color: #606266;
}

.status-content {
  padding: 15px 0;
}

.current-task {
  margin-bottom: 15px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.task-label {
  font-weight: bold;
  color: #303133;
}

.task-account {
  color: #409eff;
  font-weight: bold;
}

.task-day {
  background-color: #e1f3d8;
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.task-time {
  font-size: 12px;
  color: #909399;
}

.no-task {
  color: #909399;
  font-style: italic;
}

.queue-info {
  color: #606266;
  font-size: 14px;
}

/* 控制面板 */
.control-panel {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.connection-status {
  display: flex;
  align-items: center;
}

.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.connection-dot.connected {
  background-color: #67c23a;
}

.connection-dot.disconnected {
  background-color: #f56c6c;
}

.connection-text {
  font-size: 14px;
  color: #606266;
}

.control-content {
  padding: 15px 0;
}

.dev-mode-section {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dev-mode-tip {
  font-size: 12px;
  color: #909399;
}

.control-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 过滤卡片 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-form {
  margin: 0;
}

/* 日志卡片 */
.log-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-container {
  height: 600px;
  overflow-y: auto;
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 15px;
}

.log-entry {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
  background-color: #2d2d2d;
}

.log-entry.log-error {
  border-left-color: #f56c6c;
  background-color: #2d1b1b;
}

.log-entry.log-warning {
  border-left-color: #e6a23c;
  background-color: #2d2419;
}

.log-entry.log-info {
  border-left-color: #409eff;
  background-color: #1b2329;
}

.log-entry.log-debug {
  border-left-color: #909399;
  background-color: #252525;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.log-time {
  color: #909399;
  font-size: 12px;
  font-family: "Courier New", monospace;
}

.log-level {
  font-size: 11px;
}

.log-status {
  font-size: 11px;
}

.log-message {
  color: #e4e7ed;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.log-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
  font-style: italic;
}

.log-metadata {
  margin-top: 10px;
}

.log-metadata pre {
  background-color: #1a1a1a;
  color: #e4e7ed;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monitor-container {
    padding: 10px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .control-buttons {
    flex-direction: column;
  }

  .control-buttons .el-button {
    width: 100%;
  }

  .log-container {
    height: 400px;
  }
}
</style>
