import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import {
  executionLogApi,
  type ExecutionLog,
  type ExecutionLogQueryParams,
  type ExecutionStatistics
} from "@/api/trade/monitor";
import { getCountriesListApi } from "@/api/system/countries";
import { planApi } from "@/api/trade/plan";
import { accountApi } from "@/api/trade/account";
// 格式化日期时间
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN");
};

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

// 国家选项类型
interface CountryOption {
  id: string;
  code: string;
  name_zh: string;
  name_en: string;
}

// 计划选项类型
interface PlanOption {
  id: string;
  name: string;
}

// 账号选项类型
interface AccountOption {
  id: string;
  account: string;
}

export function useHook() {
  const tableRef = ref();
  const loading = ref(false);
  const statisticsLoading = ref(false);
  const countriesLoading = ref(false);

  // 表格列配置 - 按要求顺序：id、兑换码、国家、执行金额、账号、计划、汇率、群聊、错误信息、执行状态、执行时间、操作
  const columns: TableColumnList = [
    {
      label: "ID",
      prop: "id",
      width: 80,
      align: "center"
    },
    {
      label: "兑换码",
      prop: "code",
      minWidth: 120,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "国家",
      prop: "country_code",
      width: 80,
      align: "center"
    },
    {
      label: "执行金额",
      prop: "amount",
      width: 120,
      align: "center",
      slot: "amount"
    },
    {
      label: "账户余额",
      prop: "after_amount",
      width: 120,
      align: "center",
      slot: "after_amount"
    },
    {
      label: "账号",
      prop: "account",
      minWidth: 120,
      align: "center",
      showOverflowTooltip: true,
      slot: "account"
    },
    {
      label: "计划",
      prop: "planInfo",
      minWidth: 200,
      align: "center",
      showOverflowTooltip: true,
      slot: "planInfo"
    },
    {
      label: "汇率",
      prop: "rateInfo",
      minWidth: 200,
      align: "center",
      showOverflowTooltip: true,
      slot: "rateInfo"
    },
    {
      label: "群聊",
      prop: "roomName",
      minWidth: 150,
      align: "center",
      showOverflowTooltip: true,
      slot: "roomName"
    },
    {
      label: "错误信息",
      prop: "error_message",
      minWidth: 200,
      align: "center",
      showOverflowTooltip: true,
      slot: "error_message"
    },
    {
      label: "执行状态",
      prop: "status",
      width: 100,
      align: "center",
      slot: "status"
    },
    {
      label: "执行时间",
      prop: "exchange_time",
      width: 150,
      align: "center",
      slot: "exchange_time"
    },
    {
      label: "操作",
      fixed: "right",
      width: 120,
      slot: "operation"
    }
  ];

  // 分页配置
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true
  });

  // 搜索表单参数
  const searchFormParams = reactive<ExecutionLogQueryParams>({
    page: 1,
    pageSize: 20,
    accountId: "",
    planId: "",
    executionStatus: "",
    executionType: "",
    startTime: "",
    endTime: "",
    keyword: ""
  });

  // 日期范围
  const dateRange = ref<[string, string] | null>(null);

  // 数据列表
  const dataList = ref<ExecutionLog[]>([]);

  // 选项数据
  const countriesList = ref<CountryOption[]>([]);
  const plansList = ref<PlanOption[]>([]);
  const accountsList = ref<AccountOption[]>([]);

  // 统计数据
  const statistics = ref<ExecutionStatistics>({
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalAmount: 0,
    successAmount: 0,
    averageAmount: 0,
    successRate: 0
  });

  const todayStatistics = ref<any>({
    today_total: 0,
    today_success: 0,
    today_failed: 0,
    today_amount: 0,
    success_rate: 0
  });

  // 状态选项
  const statusOptions = [
    { label: "全部", value: "" },
    { label: "成功", value: "success" },
    { label: "失败", value: "failed" },
    { label: "待处理", value: "pending" }
  ];

  // 执行类型选项
  const typeOptions = [
    { label: "全部", value: "" },
    { label: "手动", value: "manual" },
    { label: "自动", value: "auto" }
  ];

  // 获取执行记录列表
  const getList = async () => {
    try {
      loading.value = true;
      const params = {
        ...searchFormParams,
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      };

      const response = await executionLogApi.getList(params);

      // 根据实际后端返回的数据结构调整
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        dataList.value = response.data.data;
        pagination.total = response.data.total || 0;
      } else if (response.data && Array.isArray(response.data)) {
        // 如果直接是数组格式
        dataList.value = response.data;
        pagination.total = response.data.length || 0;
      } else {
        // 使用空数据避免错误
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (error) {
      console.error("获取执行记录列表失败:", error);
      message("获取执行记录列表失败", { type: "error" });
      dataList.value = [];
      pagination.total = 0;
    } finally {
      loading.value = false;
    }
  };

  // 获取统计数据
  const getStatistics = async () => {
    try {
      statisticsLoading.value = true;

      // 主要使用今日统计数据
      const todayResponse = await executionLogApi.getTodayStatistics();

      console.log("今日统计数据响应:", todayResponse);

      // 处理今日统计数据
      if (todayResponse?.data) {
        const data = todayResponse.data as any;
        console.log("今日统计数据:", data);

        statistics.value = {
          totalCount: data.today_total || 0,
          successCount: data.today_success || 0,
          failedCount: data.today_failed || 0,
          pendingCount: Math.max(
            0,
            (data.today_total || 0) -
              (data.today_success || 0) -
              (data.today_failed || 0)
          ),
          totalAmount: data.today_amount || 0,
          successAmount: data.today_amount || 0, // 暂时使用总金额
          averageAmount: data.today_total
            ? (data.today_amount || 0) / data.today_total
            : 0,
          successRate: data.success_rate || 0
        };

        console.log("更新后的统计数据:", statistics.value);
      } else {
        // 使用默认值
        statistics.value = {
          totalCount: 0,
          successCount: 0,
          failedCount: 0,
          pendingCount: 0,
          totalAmount: 0,
          successAmount: 0,
          averageAmount: 0,
          successRate: 0
        };
        console.log("使用默认统计数据");
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
      message("获取统计数据失败", { type: "error" });

      // 出错时使用默认值
      statistics.value = {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0,
        totalAmount: 0,
        successAmount: 0,
        averageAmount: 0,
        successRate: 0
      };
    } finally {
      statisticsLoading.value = false;
    }
  };

  // 获取国家列表
  const getCountriesList = async () => {
    try {
      countriesLoading.value = true;
      const response = await getCountriesListApi({
        pageSize: 100,
        status: "1"
      });

      if (response.code === 0 && response.data?.data) {
        countriesList.value = response.data.data.map(item => ({
          ...item,
          id: item.code // 使用code作为id
        }));
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
    } finally {
      countriesLoading.value = false;
    }
  };

  // 获取计划列表
  const getPlansList = async () => {
    try {
      const response = await planApi.getList({ pageSize: 100 });
      if (response.data?.list) {
        plansList.value = response.data.list.map(item => ({
          id: item.id?.toString() || "",
          name: item.name
        }));
      }
    } catch (error) {
      console.error("获取计划列表失败:", error);
      // 使用空数组避免页面报错
      plansList.value = [];
    }
  };

  // 获取账号列表
  const getAccountsList = async () => {
    try {
      const response = await accountApi.getAvailableAccounts();
      if (response.data && Array.isArray(response.data)) {
        accountsList.value = response.data.map(item => ({
          id: item.id || "",
          account: item.account
        }));
      } else {
        accountsList.value = [];
      }
    } catch (error) {
      console.error("获取账号列表失败:", error);
      // 使用空数组避免页面报错
      accountsList.value = [];
    }
  };

  // 搜索
  const onSearch = () => {
    pagination.currentPage = 1;
    getList();
  };

  // 重置表单
  const resetForm = (formRef?: any) => {
    if (formRef) {
      formRef.resetFields();
    }
    Object.assign(searchFormParams, {
      page: 1,
      pageSize: 20,
      accountId: "",
      planId: "",
      executionStatus: "",
      executionType: "",
      startTime: "",
      endTime: "",
      keyword: ""
    });
    dateRange.value = null;
    pagination.currentPage = 1;
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

  // 分页大小改变
  const handleSizeChange = (val: number) => {
    pagination.pageSize = val;
    getList();
  };

  // 当前页改变
  const handleCurrentChange = (val: number) => {
    pagination.currentPage = val;
    getList();
  };

  // 获取执行状态标签类型
  const getExecutionStatusTagType = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "failed":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "info";
    }
  };

  // 格式化固定面额
  const formatFixedAmounts = (fixedAmounts: string | null): string => {
    if (!fixedAmounts) return "-";
    try {
      const amounts = JSON.parse(fixedAmounts);
      if (Array.isArray(amounts)) {
        return amounts.join(", ");
      }
      return fixedAmounts;
    } catch (error) {
      return fixedAmounts;
    }
  };

  // 获取约束类型文本
  const getAmountConstraintText = (constraint: string): string => {
    switch (constraint) {
      case "fixed":
        return "固定面额";
      case "multiple":
        return "倍数要求";
      case "all":
        return "全面额";
      default:
        return constraint || "未知";
    }
  };

  return {
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
  };
}
