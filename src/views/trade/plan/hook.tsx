import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import {
  planApi,
  type PlanItem,
  type PlanQueryParams,
  type BackendPlanItem,
  type CountryOption
} from "@/api/trade/plan";
import { getCountriesListApi } from "@/api/system/countries";

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

export function useHook() {
  const tableRef = ref();
  const loading = ref(false);
  const countriesLoading = ref(false);

  // 表格列配置
  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "left"
    },
    {
      label: "序号",
      type: "index",
      width: 70,
      align: "center"
    },
    {
      label: "计划名称",
      prop: "name",
      minWidth: 200,
      align: "left",
      showOverflowTooltip: true
    },
    {
      label: "国家",
      prop: "countryName",
      width: 120,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "汇率信息",
      prop: "rateInfo",
      minWidth: 220,
      align: "center",
      slot: "rateInfo",
      showOverflowTooltip: true
    },
    {
      label: "计划天数",
      prop: "planDays",
      width: 100,
      align: "center"
    },
    {
      label: "总金额",
      prop: "totalAmount",
      width: 120,
      align: "center",
      slot: "totalAmount"
    },
    {
      label: "浮动金额",
      prop: "floatAmount",
      width: 100,
      align: "center",
      slot: "floatAmount"
    },
    {
      label: "兑换间隔",
      prop: "exchangeInterval",
      width: 100,
      align: "center",
      slot: "exchangeInterval"
    },
    {
      label: "天数间隔",
      prop: "dayInterval",
      width: 100,
      align: "center",
      slot: "dayInterval"
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      align: "center",
      slot: "status"
    },
    {
      label: "群聊绑定",
      prop: "enableRoomBinding",
      width: 100,
      align: "center",
      slot: "enableRoomBinding"
    },
    {
      label: "创建时间",
      prop: "createdAt",
      width: 180,
      align: "center",
      slot: "createdAt"
    },
    {
      label: "操作",
      fixed: "right",
      width: 280,
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
  const searchFormParams = reactive<PlanQueryParams>({
    page: 1,
    pageSize: 20,
    countryId: "",
    rateId: "",
    status: "",
    keyword: ""
  });

  // 数据列表
  const dataList = ref<PlanItem[]>([]);

  // 选项数据
  const countriesList = ref<CountryOption[]>([]);

  // 状态选项
  const statusOptions = [
    { label: "全部", value: "" },
    { label: "启用", value: "enabled" },
    { label: "禁用", value: "disabled" }
  ];

  // 获取计划列表
  const getList = async () => {
    try {
      loading.value = true;
      const params = {
        ...searchFormParams,
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      };

      const response = await planApi.getList(params);

      // 处理后端返回的数据结构，映射字段名
      if (response.data?.list && Array.isArray(response.data.list)) {
        dataList.value = response.data.list.map(
          (item: BackendPlanItem): PlanItem => ({
            id: item.id?.toString(),
            name: item.name,
            countryId: item.country_code,
            countryName: item.country_name,
            rateId: item.rate_id?.toString(),
            rateName: item.rate_name,
            planDays: item.plan_days,
            floatAmount: parseFloat(item.float_amount || "0"),
            totalAmount: parseFloat(item.total_amount || "0"),
            exchangeInterval: item.exchange_interval,
            dayInterval: item.day_interval,
            dailyAmounts: item.daily_amounts
              ? JSON.parse(item.daily_amounts)
              : [],
            status: item.status,
            enableRoomBinding: item.bind_room === 1,
            description: item.description,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            // 添加汇率信息
            rate: item.rate,
            rate_name: item.rate_name
          })
        );
        pagination.total = response.data.total || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
      }

      return Promise.resolve();
    } catch (error) {
      console.error("获取计划列表失败:", error);
      message("获取计划列表失败", { type: "error" });
      dataList.value = [];
      pagination.total = 0;
      return Promise.reject(error);
    } finally {
      loading.value = false;
    }
  };

  // 获取国家列表
  const getCountriesList = async () => {
    try {
      countriesLoading.value = true;
      const response = await getCountriesListApi({
        page_index: 1,
        page_size: 1000,
        status: "1"
      });

      if (response.code === 0 && response.data?.data) {
        // 适配数据结构，添加id字段
        countriesList.value = response.data.data.map(item => ({
          ...item,
          id: item.code // 使用code作为id
        }));
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
      message("获取国家列表失败", { type: "error" });
    } finally {
      countriesLoading.value = false;
    }
  };

  // 搜索
  const onSearch = () => {
    pagination.currentPage = 1;
    return getList();
  };

  // 重置搜索表单
  const resetForm = (formRef?: any) => {
    if (formRef) {
      formRef.resetFields();
    }
    Object.assign(searchFormParams, {
      page: 1,
      pageSize: 20,
      countryId: "",
      rateId: "",
      status: "",
      keyword: ""
    });
    pagination.currentPage = 1;
    return getList();
  };

  // 删除计划
  const handleDelete = async (row: PlanItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除计划 "${row.name}" 吗？`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      await planApi.delete(row.id!);
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除失败:", error);
        message("删除失败", { type: "error" });
      }
    }
  };

  // 批量删除
  const handleBatchDelete = async (rows: PlanItem[]) => {
    if (!rows.length) {
      message("请选择要删除的计划", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${rows.length} 个计划吗？`,
        "批量删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      const ids = rows.map(row => row.id!);
      await planApi.batchDelete(ids);
      message("批量删除成功", { type: "success" });
      getList();
    } catch (error) {
      if (error !== "cancel") {
        console.error("批量删除失败:", error);
        message("批量删除失败", { type: "error" });
      }
    }
  };

  // 更新状态
  const handleUpdateStatus = async (
    row: PlanItem,
    status: "enabled" | "disabled"
  ) => {
    try {
      await planApi.updateStatus(row.id!, status);
      message(`${status === "enabled" ? "启用" : "禁用"}成功`, {
        type: "success"
      });
      getList();
    } catch (error) {
      console.error("更新状态失败:", error);
      message("更新状态失败", { type: "error" });
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "enabled":
        return "启用";
      case "disabled":
        return "禁用";
      default:
        return "未知";
    }
  };

  // 获取状态标签类型
  const getStatusTagType = (status: string) => {
    switch (status) {
      case "enabled":
        return "success";
      case "disabled":
        return "danger";
      default:
        return "primary";
    }
  };

  return {
    tableRef,
    loading,
    countriesLoading,
    columns,
    pagination,
    searchFormParams,
    dataList,
    countriesList,
    statusOptions,
    getList,
    getCountriesList,
    onSearch,
    resetForm,
    handleDelete,
    handleBatchDelete,
    handleUpdateStatus,
    getStatusText,
    getStatusTagType
  };
}
