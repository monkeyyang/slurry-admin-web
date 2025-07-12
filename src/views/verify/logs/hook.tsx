import { ref, reactive } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import {
  operationLogApi,
  type OperationLog,
  type OperationLogQueryParams
} from "@/api/verify/index";

// 定义表格列类型
interface TableColumn {
  label?: string;
  prop?: string;
  minWidth?: number;
  width?: number;
  fixed?: "right" | "left";
  slot?: string;
  showOverflowTooltip?: boolean;
  type?: "selection" | "index" | "expand";
  align?: "left" | "center" | "right";
}

type TableColumnList = TableColumn[];

export function useVerifyLogsHook() {
  const _tableRef = ref();
  const loading = ref(false);
  const statisticsLoading = ref(false);

  // 表格列配置
  const columns: TableColumnList = [
    {
      label: "序号",
      type: "index",
      width: 70,
      align: "center"
    },
    {
      label: "操作类型",
      prop: "operation_type",
      width: 120,
      align: "center",
      slot: "operation_type"
    },
    {
      label: "来源群聊",
      prop: "room_name",
      minWidth: 120,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "来源微信",
      prop: "wx_nickname",
      minWidth: 120,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "目标账号",
      prop: "target_account",
      minWidth: 150,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "操作结果",
      prop: "result",
      width: 100,
      align: "center",
      slot: "result"
    },
    {
      label: "详细信息",
      prop: "details",
      minWidth: 200,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "操作用户",
      prop: "user.nickname",
      width: 120,
      align: "center",
      slot: "uid"
    },
    {
      label: "操作时间",
      prop: "created_at",
      minWidth: 160,
      align: "center",
      slot: "created_at"
    },
    {
      label: "操作",
      fixed: "right",
      minWidth: 120,
      slot: "operation"
    }
  ];

  // 分页配置
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 200,
    currentPage: 1,
    background: true,
    pageSizes: [50, 100, 200]
  });

  // 搜索表单参数
  const searchFormParams = reactive<OperationLogQueryParams>({
    pageNum: 1,
    pageSize: 200,
    operation_type: "",
    target_account: "",
    result: undefined,
    uid: undefined,
    startTime: "",
    endTime: ""
  });

  // 日期范围
  const dateRange = ref<[string, string] | null>(null);

  // 数据列表
  const dataList = ref<OperationLog[]>([]);

  // 选中的行
  const selectedRows = ref<OperationLog[]>([]);

  // 操作记录统计
  const operationStatistics = ref({
    totalOperations: 0,
    successOperations: 0,
    failedOperations: 0,
    todayCount: 0
  });

  // 详情对话框
  const detailDialogVisible = ref(false);
  const currentRecord = ref<OperationLog | null>(null);

  // 操作类型选项
  const operationTypeOptions = [
    { label: "全部", value: "" },
    { label: "页面访问", value: "page_init" },
    { label: "数据加载", value: "page_view" },
    { label: "搜索操作", value: "search" },
    { label: "重置表单", value: "reset_form" },
    { label: "分页切换", value: "page_change" },
    { label: "页面大小", value: "page_size_change" },
    { label: "选择变化", value: "selection_change" },
    { label: "日期范围", value: "date_range_change" },
    { label: "获取统计", value: "get_statistics" },
    { label: "刷新统计", value: "refresh_statistics" },
    { label: "删除记录", value: "delete_log" },
    { label: "批量删除", value: "batch_delete_log" },
    { label: "查看详情", value: "view_detail" },
    { label: "复制验证码", value: "copy_verify_code" },
    { label: "删除账号", value: "delete" },
    { label: "批量删除账号", value: "batchDelete" },
    { label: "复制账号", value: "copy" },
    { label: "获取验证码", value: "getVerifyCode" },
    { label: "编辑账号", value: "edit" },
    { label: "创建账号", value: "create" },
    { label: "导入账号", value: "import" },
    { label: "导出数据", value: "export" },
    { label: "密码验证", value: "password_verify_attempt" },
    { label: "密码验证成功", value: "password_verify_success" },
    { label: "密码验证失败", value: "password_verify_failed" },
    { label: "密码验证异常", value: "password_verify_error" }
  ];

  // 获取列表数据
  const getList = async () => {
    try {
      loading.value = true;
      const params = {
        ...searchFormParams,
        pageNum: pagination.currentPage,
        pageSize: pagination.pageSize
      };
      const response = await operationLogApi.getList(params);
      console.log("操作记录API响应数据:", response);

      if (response.code === 0) {
        dataList.value = response.data?.data || [];
        pagination.total = response.data?.total || 0;
      } else {
        message(response.message || "获取数据失败", { type: "error" });
      }
    } catch (error) {
      console.error("获取列表失败:", error);
      message("获取列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  // 获取统计数据
  const getStatistics = async () => {
    try {
      statisticsLoading.value = true;
      const params = {
        startTime: searchFormParams.startTime,
        endTime: searchFormParams.endTime
      };
      const response = await operationLogApi.getStatistics(params);
      console.log("操作记录统计API响应数据:", response);

      if (response.code === 0) {
        operationStatistics.value = {
          totalOperations: response.data.totalOperations,
          successOperations: response.data.successOperations,
          failedOperations: response.data.failedOperations,
          todayCount: response.data.operationsByType?.today || 0
        };
      } else {
        message(response.message || "获取统计失败", { type: "error" });
      }
    } catch (error) {
      console.error("获取统计失败:", error);
      message("获取统计失败", { type: "error" });
    } finally {
      statisticsLoading.value = false;
    }
  };

  // 刷新统计
  const handleRefreshStatistics = async () => {
    await getStatistics();
  };

  // 搜索
  const onSearch = () => {
    pagination.currentPage = 1;
    getList();
    getStatistics();
  };

  // 重置表单
  const resetForm = (formRef?: any) => {
    if (formRef) {
      formRef.resetFields();
    } else {
      searchFormParams.operation_type = "";
      searchFormParams.target_account = "";
      searchFormParams.result = undefined;
      searchFormParams.uid = undefined;
      searchFormParams.startTime = "";
      searchFormParams.endTime = "";
      dateRange.value = null;
    }
    pagination.currentPage = 1;
    getList();
    getStatistics();
  };

  // 处理选择变化
  const handleSelectionChange = (selection: OperationLog[]) => {
    selectedRows.value = selection;
  };

  // 处理页面大小变化
  const handleSizeChange = (val: number) => {
    pagination.pageSize = val;
    getList();
  };

  // 处理当前页变化
  const handleCurrentChange = (val: number) => {
    pagination.currentPage = val;
    getList();
  };

  // 处理日期范围变化
  const handleDateRangeChange = (range: [string, string] | null) => {
    if (range) {
      searchFormParams.startTime = range[0];
      searchFormParams.endTime = range[1];
    } else {
      searchFormParams.startTime = "";
      searchFormParams.endTime = "";
    }
  };

  // 查看详情
  const handleViewDetail = (row: OperationLog) => {
    currentRecord.value = row;
    detailDialogVisible.value = true;
  };

  // 重置详情对话框
  const resetDetailDialog = () => {
    currentRecord.value = null;
  };

  // 获取操作类型标签类型
  const getOperationTypeTagType = (operationType: string) => {
    switch (operationType) {
      case "page_init":
      case "page_view":
        return "info";
      case "search":
      case "reset_form":
        return "primary";
      case "delete":
      case "batchDelete":
      case "delete_log":
      case "batch_delete_log":
        return "danger";
      case "copy":
      case "copy_verify_code":
        return "success";
      case "getVerifyCode":
      case "get_statistics":
      case "refresh_statistics":
        return "warning";
      case "edit":
      case "create":
      case "import":
      case "export":
        return "primary";
      case "password_verify_attempt":
      case "password_verify_success":
      case "password_verify_failed":
      case "password_verify_error":
        return "warning";
      default:
        return "info";
    }
  };

  // 获取操作类型文本
  const getOperationTypeText = (operationType: string) => {
    const option = operationTypeOptions.find(
      opt => opt.value === operationType
    );
    return option ? option.label : operationType;
  };

  // 获取操作结果标签类型
  const getResultTagType = (result: string) => {
    switch (result) {
      case "success":
        return "success";
      case "failed":
        return "danger";
      case "password_error":
        return "warning";
      default:
        return "info";
    }
  };

  // 获取操作结果文本
  const getResultText = (result: string) => {
    switch (result) {
      case "success":
        return "成功";
      case "failed":
        return "失败";
      case "password_error":
        return "密码错误";
      default:
        return result;
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  return {
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
  };
}
