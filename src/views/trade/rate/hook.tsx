import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import {
  rateApi,
  type RateItem,
  type RateQueryParams,
  type BackendRateItem
} from "@/api/trade/rate";
import { getCountriesListApi } from "@/api/system/countries";
import { getGroupsListApi } from "@/api/system/groups";

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

// 群组选项类型
interface GroupOption {
  id: string;
  name: string;
}

export function useHook() {
  const tableRef = ref();
  const loading = ref(false);
  const countriesLoading = ref(false);
  const groupsLoading = ref(false);

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
      label: "汇率名称",
      prop: "name",
      minWidth: 200,
      align: "left",
      showOverflowTooltip: true
    },
    {
      label: "国家/地区",
      prop: "countryName",
      width: 120,
      align: "center"
    },
    {
      label: "国家代码",
      prop: "country",
      width: 100,
      align: "center"
    },
    {
      label: "群聊",
      prop: "roomName",
      width: 120,
      align: "center",
      slot: "roomName"
    },
    {
      label: "群组",
      prop: "groupName",
      width: 120,
      align: "center",
      slot: "groupName"
    },
    {
      label: "面额约束",
      prop: "amountConstraint",
      width: 180,
      align: "center",
      slot: "amountConstraint"
    },
    {
      label: "汇率",
      prop: "rate",
      width: 100,
      align: "center",
      slot: "rate"
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      align: "center",
      slot: "status"
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
      width: 200,
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
  const searchFormParams = reactive<RateQueryParams>({
    page: 1,
    pageSize: 20,
    country: "",
    roomId: "",
    status: "",
    keyword: ""
  });

  // 数据列表
  const dataList = ref<RateItem[]>([]);

  // 选项数据
  const countriesList = ref<CountryOption[]>([]);
  const groupsList = ref<GroupOption[]>([]);

  // 状态选项
  const statusOptions = [
    { label: "全部", value: "" },
    { label: "启用", value: "active" },
    { label: "禁用", value: "inactive" }
  ];

  // 获取汇率列表
  const getList = async () => {
    try {
      loading.value = true;
      const params = {
        ...searchFormParams,
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      };

      const response = await rateApi.getList(params);

      // 处理后端返回的数据结构，映射字段名
      if (response.data?.list && Array.isArray(response.data.list)) {
        dataList.value = response.data.list.map(
          (item: BackendRateItem): RateItem => ({
            id: item.id?.toString(),
            country: item.country_code,
            countryName: item.country?.name || item.country_code, // 如果有country对象则使用，否则使用country_code
            roomId: item.room_id?.toString(), // 群聊ID
            roomName: item.room?.name || "", // 群聊名称
            groupId: item.group_id?.toString(), // 群组ID，用于提交
            groupName: item.group?.name || "", // 群组名称
            cardType: item.card_type,
            cardForm: item.card_form,
            amountConstraint: item.amount_constraint,
            fixedAmounts: item.fixed_amounts
              ? JSON.parse(item.fixed_amounts)
              : [],
            multipleBase: item.multiple_base,
            minAmount: parseFloat(item.min_amount || "0"),
            maxAmount: parseFloat(item.max_amount || "0"),
            rate: parseFloat(item.rate),
            name: item.name,
            description: item.description,
            status: item.status,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          })
        );
        pagination.total = response.data.total || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
      }

      return Promise.resolve();
    } catch (error) {
      console.error("获取汇率列表失败:", error);
      message("获取汇率列表失败", { type: "error" });
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

  // 获取群组列表
  const getGroupsList = async () => {
    try {
      groupsLoading.value = true;
      const response = await getGroupsListApi({
        pageNum: 1,
        pageSize: 1000,
        status: "1"
      });

      if (response.code === 0 && response.data?.data) {
        groupsList.value = response.data.data;
      }
    } catch (error) {
      console.error("获取群组列表失败:", error);
      message("获取群组列表失败", { type: "error" });
    } finally {
      groupsLoading.value = false;
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
      country: "",
      roomId: "",
      status: "",
      keyword: ""
    });
    pagination.currentPage = 1;
    return getList();
  };

  // 删除汇率
  const handleDelete = async (row: RateItem) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除汇率 "${row.name}" 吗？`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      await rateApi.delete(row.id!);
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
  const handleBatchDelete = async (rows: RateItem[]) => {
    if (!rows.length) {
      message("请选择要删除的汇率", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${rows.length} 个汇率吗？`,
        "批量删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      const ids = rows.map(row => row.id!);
      await rateApi.batchDelete(ids);
      message("批量删除成功", { type: "success" });
      getList();
    } catch (error) {
      if (error !== "cancel") {
        console.error("批量删除失败:", error);
        message("批量删除失败", { type: "error" });
      }
    }
  };

  // 获取约束类型文本
  const getConstraintText = (constraint: string) => {
    switch (constraint) {
      case "fixed":
        return "固定面额";
      case "multiple":
        return "倍数要求";
      case "all":
        return "全面额";
      default:
        return "未知";
    }
  };

  // 获取约束类型标签类型
  const getConstraintTagType = (constraint: string) => {
    switch (constraint) {
      case "fixed":
        return "warning";
      case "multiple":
        return "primary";
      case "all":
        return "success";
      default:
        return "primary";
    }
  };

  return {
    tableRef,
    loading,
    countriesLoading,
    groupsLoading,
    columns,
    pagination,
    searchFormParams,
    dataList,
    countriesList,
    groupsList,
    statusOptions,
    getList,
    getCountriesList,
    getGroupsList,
    onSearch,
    resetForm,
    handleDelete,
    handleBatchDelete,
    getConstraintText,
    getConstraintTagType
  };
}
