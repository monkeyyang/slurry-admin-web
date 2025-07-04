import { ref, reactive } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import {
  accountApi,
  getCountriesForAccountApi,
  type Account,
  type AccountQueryParams,
  type BatchImportAccountsRequest
} from "@/api/trade/account";
import { hasAuth } from "@/router/utils";

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
  code: string;
  name_zh: string;
  name_en: string;
}

export function useHook() {
  const tableRef = ref();
  const loading = ref(false);
  const countriesLoading = ref(false);

  // 权限检查
  const hasCreateByPermission = hasAuth("Itunes:Trade:CreateBy");
  const hasBindRoomPermission = hasAuth("Itunes:Trade:BindRoom");

  // 表格列配置
  const columns: TableColumnList = [
    {
      label: "勾选列",
      type: "selection",
      width: 55,
      align: "center" as const
    },
    {
      label: "序号",
      type: "index",
      width: 70,
      align: "center" as const
    },
    {
      label: "账号",
      prop: "account",
      minWidth: 180,
      align: "center" as const,
      showOverflowTooltip: true
    },
    {
      label: "金额",
      prop: "amount",
      minWidth: 120,
      align: "center" as const
    },
    {
      label: "国家/地区",
      prop: "country.name_zh",
      width: 120,
      align: "center" as const
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      align: "center" as const,
      slot: "status"
    },
    {
      label: "登录状态",
      prop: "loginStatus",
      width: 100,
      align: "center" as const,
      slot: "loginStatus"
    },
    {
      label: "绑定计划",
      prop: "planInfo",
      minWidth: 200,
      align: "center" as const,
      slot: "planInfo"
    },
    {
      label: "汇率信息",
      prop: "rateInfo",
      minWidth: 220,
      align: "center" as const,
      slot: "rateInfo",
      showOverflowTooltip: true
    },
    {
      label: "群聊名称",
      prop: "roomName",
      minWidth: 150,
      align: "center" as const,
      slot: "roomName",
      showOverflowTooltip: true
    },
    ...(hasCreateByPermission
      ? [
          {
            label: "创建人",
            prop: "user.nickname",
            width: 100,
            align: "center" as const,
            slot: "uid"
          }
        ]
      : []),
    ...(hasBindRoomPermission
      ? [
          {
            label: "绑定群聊",
            prop: "bindRoom",
            minWidth: 120,
            align: "center" as const,
            slot: "bindRoom",
            showOverflowTooltip: true
          }
        ]
      : []),
    {
      label: "创建人",
      prop: "user.nickname",
      width: 120,
      align: "center" as const,
      slot: "uid"
    },
    {
      label: "创建时间",
      prop: "createdAt",
      minWidth: 160,
      align: "center" as const,
      slot: "createdAt"
    },
    {
      label: "操作",
      fixed: "right",
      minWidth: 200,
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
  const searchFormParams = reactive<AccountQueryParams>({
    pageNum: 1,
    pageSize: 20,
    account: "",
    country: "",
    status: "",
    importedBy: "",
    startTime: "",
    endTime: ""
  });

  // 数据列表
  const dataList = ref<Account[]>([]);

  // 选项数据
  const countriesList = ref<CountryOption[]>([]);

  // 状态选项
  const statusOptions = [
    { label: "全部", value: "" },
    { label: "已完成", value: "completed" },
    { label: "进行中", value: "processing" },
    { label: "等待中", value: "waiting" },
    { label: "锁定", value: "locking" }
  ];

  // 登录状态选项
  const loginStatusOptions = [
    { label: "全部", value: "" },
    { label: "有效", value: "valid" },
    { label: "失效", value: "invalid" }
  ];

  // 获取账号列表
  const getList = async () => {
    try {
      loading.value = true;
      const params = {
        ...searchFormParams,
        pageNum: pagination.currentPage,
        pageSize: pagination.pageSize
      };

      const response = await accountApi.getList(params);

      if (response && response.code === 0) {
        // 处理不同的数据结构
        if (response.data) {
          if (Array.isArray(response.data)) {
            // 如果data直接是数组
            dataList.value = response.data.map(item => ({
              ...item,
              // 确保基本字段存在
              id: item.id || Math.random().toString(),
              account: item.account || "",
              status: item.status || "waiting",
              loginStatus: item.loginStatus || "invalid",
              currentPlanDay: item.currentPlanDay || 0,
              createdAt: item.createdAt || "",
              updatedAt: item.updatedAt || "",
              // 保留完整的关联数据
              plan: item.plan || null,
              rate: item.rate || null,
              room: item.room || null,
              country: item.country || null,
              user: item.user || null,
              completedDays: item.completedDays || []
            }));
            pagination.total = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // 如果是分页结构 {data: [], total: number}
            dataList.value = response.data.data.map(item => ({
              ...item,
              // 确保基本字段存在
              id: item.id || Math.random().toString(),
              account: item.account || "",
              status: item.status || "waiting",
              loginStatus: item.loginStatus || "invalid",
              currentPlanDay: item.currentPlanDay || 0,
              createdAt: item.createdAt || "",
              updatedAt: item.updatedAt || "",
              // 保留完整的关联数据
              plan: item.plan || null,
              rate: item.rate || null,
              room: item.room || null,
              country: item.country || null,
              user: item.user || null,
              completedDays: item.completedDays || []
            }));
            pagination.total = response.data.total || response.data.data.length;
          } else if (
            (response.data as any).list &&
            Array.isArray((response.data as any).list)
          ) {
            // 如果是 {list: [], total: number} 结构
            dataList.value = (response.data as any).list.map(item => ({
              ...item,
              // 确保基本字段存在
              id: item.id || Math.random().toString(),
              account: item.account || "",
              status: item.status || "waiting",
              loginStatus: item.loginStatus || "invalid",
              currentPlanDay: item.currentPlanDay || 0,
              createdAt: item.createdAt || "",
              updatedAt: item.updatedAt || "",
              // 保留完整的关联数据
              plan: item.plan || null,
              rate: item.rate || null,
              room: item.room || null,
              country: item.country || null,
              user: item.user || null,
              completedDays: item.completedDays || []
            }));
            pagination.total =
              (response.data as any).total ||
              (response.data as any).list.length;
          } else {
            console.warn("未知的数据结构:", response.data);
            dataList.value = [];
            pagination.total = 0;
          }
        } else {
          dataList.value = [];
          pagination.total = 0;
        }
      } else {
        console.error("获取账号列表失败:", response);
        message(response?.message || "获取账号列表失败", { type: "error" });
        dataList.value = [];
        pagination.total = 0;
      }

      return Promise.resolve();
    } catch (error) {
      console.error("获取账号列表失败:", error);
      message("获取账号列表失败", { type: "error" });
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
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
      message("获取国家列表失败", { type: "error" });
      // 失败时使用默认数据
      countriesList.value = [
        { code: "CA", name_zh: "加拿大", name_en: "Canada" },
        { code: "US", name_zh: "美国", name_en: "United States" },
        { code: "UK", name_zh: "英国", name_en: "United Kingdom" }
      ];
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
      pageNum: 1,
      pageSize: 20,
      account: "",
      country: "",
      status: "",
      importedBy: "",
      startTime: "",
      endTime: ""
    });
    pagination.currentPage = 1;
    return getList();
  };

  // 删除账号
  const handleDelete = async (row: Account) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除账号 "${row.account}" 吗？`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      if (row.id) {
        await accountApi.delete(row.id);
        message("删除成功", { type: "success" });
        getList();
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除失败:", error);
        message("删除失败", { type: "error" });
      }
    }
  };

  // 批量删除
  const handleBatchDelete = async (rows: Account[]) => {
    if (!rows.length) {
      message("请选择要删除的账号", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${rows.length} 个账号吗？`,
        "批量删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      const ids = rows.map(row => row.id!).filter(Boolean);
      await accountApi.batchDelete(ids);
      message(`成功删除 ${rows.length} 个账号`, { type: "success" });
      getList();
    } catch (error) {
      if (error !== "cancel") {
        console.error("批量删除失败:", error);
        message("批量删除失败", { type: "error" });
      }
    }
  };

  // 更新账号状态
  const handleUpdateStatus = async (row: Account, status: string) => {
    try {
      if (row.id) {
        await accountApi.updateStatus(row.id, status);
        message("状态更新成功", { type: "success" });
        getList();
      }
    } catch (error) {
      console.error("状态更新失败:", error);
      message("状态更新失败", { type: "error" });
    }
  };

  // 批量导入账号
  const handleBatchImport = async (importData: BatchImportAccountsRequest) => {
    try {
      const response = await accountApi.batchImport(importData);

      // 检查响应数据，处理成功和失败情况
      if (response && response.code === 0 && response.data) {
        const data = response.data;
        const {
          successCount = 0,
          failCount = 0,
          duplicateAccounts = [],
          restoredCount = 0,
          createdCount = 0,
          updatedCount = 0
        } = data;

        // 计算总的成功数量（包括恢复、创建、更新的）
        const totalSuccessCount =
          successCount || restoredCount + createdCount + updatedCount;

        if (
          totalSuccessCount > 0 &&
          (failCount === 0 || failCount === undefined)
        ) {
          // 全部成功
          let msg = `成功导入 ${totalSuccessCount} 个账号`;
          if (restoredCount > 0 || createdCount > 0 || updatedCount > 0) {
            const details = [];
            if (restoredCount > 0) details.push(`恢复 ${restoredCount} 个`);
            if (createdCount > 0) details.push(`新建 ${createdCount} 个`);
            if (updatedCount > 0) details.push(`更新 ${updatedCount} 个`);
            msg += `（${details.join("，")}）`;
          }
          message(msg, { type: "success" });
          getList();
          return { success: true, message: msg };
        } else if (totalSuccessCount > 0 && failCount > 0) {
          // 部分成功
          let msg = `成功导入 ${totalSuccessCount} 个账号，失败 ${failCount} 个`;
          if (duplicateAccounts && duplicateAccounts.length > 0) {
            msg += `。重复账号：${duplicateAccounts.join(", ")}`;
          }
          message(msg, { type: "warning" });
          getList();
          return { success: true, message: msg };
        } else if (failCount > 0) {
          // 全部失败
          let msg = `导入失败，共 ${failCount} 个账号`;
          if (duplicateAccounts && duplicateAccounts.length > 0) {
            msg += `。重复账号：${duplicateAccounts.join(", ")}`;
          }
          message(msg, { type: "error" });
          return { success: false, message: msg };
        } else if (totalSuccessCount === 0) {
          // 没有成功导入任何账号
          message("没有可导入的账号", { type: "warning" });
          return { success: false, message: "没有可导入的账号" };
        } else {
          // 其他情况，使用后端返回的消息
          const msg = response.message || "批量导入完成";
          message(msg, { type: "success" });
          getList();
          return { success: true, message: msg };
        }
      } else {
        const msg = response?.message || "导入账号失败";
        message(msg, { type: "error" });
        return { success: false, message: msg };
      }
    } catch (error) {
      console.error("导入账号失败:", error);
      message("导入账号失败", { type: "error" });
      return { success: false, message: "导入账号失败" };
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "processing":
        return "进行中";
      case "waiting":
        return "等待中";
      case "locking":
        return "锁定";
      default:
        return "未知";
    }
  };

  // 获取状态标签类型
  const getStatusTagType = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "primary";
      case "waiting":
        return "info";
      case "locking":
        return "danger";
      default:
        return "info";
    }
  };

  // 获取登录状态文本
  const getLoginStatusText = (status: string) => {
    switch (status) {
      case "valid":
        return "有效";
      case "invalid":
        return "失效";
      default:
        return "未知";
    }
  };

  // 获取登录状态标签类型
  const getLoginStatusTagType = (status: string) => {
    switch (status) {
      case "valid":
        return "success";
      case "invalid":
        return "danger";
      default:
        return "info";
    }
  };

  // 绑定到计划
  const handleBindToPlan = async (row: Account, planId: string) => {
    try {
      if (row.id) {
        await accountApi.bindToPlan(row.id, planId);
        message("绑定计划成功", { type: "success" });
        getList();
      }
    } catch (error) {
      console.error("绑定计划失败:", error);
      message("绑定计划失败", { type: "error" });
    }
  };

  // 从计划解绑
  const handleUnbindFromPlan = async (row: Account) => {
    try {
      await ElMessageBox.confirm(
        `确定要将账号 "${row.account}" 从计划中解绑吗？`,
        "解绑确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      if (row.id) {
        await accountApi.unbindFromPlan(row.id);
        message("解绑计划成功", { type: "success" });
        getList();
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("解绑计划失败:", error);
        message("解绑计划失败", { type: "error" });
      }
    }
  };

  // 更新登录状态
  const handleUpdateLoginStatus = async (row: Account, loginStatus: string) => {
    try {
      if (row.id) {
        await accountApi.updateLoginStatus(row.id, loginStatus);
        message("登录状态更新成功", { type: "success" });
        getList();
      }
    } catch (error) {
      console.error("登录状态更新失败:", error);
      message("登录状态更新失败", { type: "error" });
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
    countriesLoading,
    hasCreateByPermission,
    hasBindRoomPermission,
    columns,
    pagination,
    searchFormParams,
    dataList,
    countriesList,
    statusOptions,
    loginStatusOptions,
    getList,
    getCountriesList,
    onSearch,
    resetForm,
    handleDelete,
    handleBatchDelete,
    handleUpdateStatus,
    handleBatchImport,
    handleBindToPlan,
    handleUnbindFromPlan,
    handleUpdateLoginStatus,
    getStatusText,
    getStatusTagType,
    getLoginStatusText,
    getLoginStatusTagType,
    formatFixedAmounts,
    getAmountConstraintText
  };
}
