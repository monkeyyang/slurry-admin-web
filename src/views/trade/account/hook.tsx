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
      width: 200,
      align: "center" as const
    },
    {
      label: "国家/地区",
      prop: "country",
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
      label: "当前计划天数",
      prop: "currentPlanDay",
      width: 120,
      align: "center" as const,
      slot: "currentPlanDay"
    },
    ...(hasCreateByPermission
      ? [
          {
            label: "创建人",
            prop: "createdBy",
            width: 100,
            align: "center" as const,
            slot: "createdBy"
          }
        ]
      : []),
    ...(hasBindRoomPermission
      ? [
          {
            label: "绑定群聊",
            prop: "bindRoom",
            width: 120,
            align: "center" as const,
            slot: "bindRoom"
          }
        ]
      : []),
    {
      label: "导入者",
      prop: "importedBy",
      width: 120,
      align: "center" as const,
      slot: "importedBy"
    },
    {
      label: "导入时间",
      prop: "importedAt",
      width: 160,
      align: "center" as const,
      slot: "importedAt"
    },
    {
      label: "创建时间",
      prop: "createdAt",
      width: 160,
      align: "center" as const,
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
    { label: "等待中", value: "waiting" }
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
              id: item.id || Math.random().toString(),
              account: item.account || "",
              country: item.country || "",
              status: item.status || "waiting",
              loginStatus: item.loginStatus || "invalid",
              currentPlanDay: item.currentPlanDay || 0,
              createdByName: item.createdByName || "",
              importedByNickname: item.importedByNickname || "",
              importedAt: item.importedAt || "",
              createdAt: item.createdAt || "",
              updatedAt: item.updatedAt || "",
              planId: item.planId || null,
              completedDays: item.completedDays || []
            }));
            pagination.total = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // 如果是分页结构 {data: [], total: number}
            dataList.value = response.data.data.map(item => ({
              ...item,
              id: item.id || Math.random().toString(),
              account: item.account || "",
              country: item.country || "",
              status: item.status || "waiting",
              loginStatus: item.loginStatus || "invalid",
              currentPlanDay: item.currentPlanDay || 0,
              createdByName: item.createdByName || "",
              importedByNickname: item.importedByNickname || "",
              importedAt: item.importedAt || "",
              createdAt: item.createdAt || "",
              updatedAt: item.updatedAt || "",
              planId: item.planId || null,
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
              id: item.id || Math.random().toString(),
              account: item.account || "",
              country: item.country || "",
              status: item.status || "waiting",
              loginStatus: item.loginStatus || "invalid",
              currentPlanDay: item.currentPlanDay || 0,
              createdByName: item.createdByName || "",
              importedByNickname: item.importedByNickname || "",
              importedAt: item.importedAt || "",
              createdAt: item.createdAt || "",
              updatedAt: item.updatedAt || "",
              planId: item.planId || null,
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
        const { successCount, failCount, duplicateAccounts } = data;

        if (successCount > 0 && failCount === 0) {
          // 全部成功
          message(`成功导入 ${successCount} 个账号`, { type: "success" });
          getList();
          return { success: true, message: `成功导入 ${successCount} 个账号` };
        } else if (successCount > 0 && failCount > 0) {
          // 部分成功
          let msg = `成功导入 ${successCount} 个账号，失败 ${failCount} 个`;
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
        } else {
          // 未知情况
          message("导入账号失败", { type: "error" });
          return { success: false, message: "导入账号失败" };
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
    getStatusText,
    getStatusTagType,
    getLoginStatusText,
    getLoginStatusTagType
  };
}
