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
import * as XLSX from "xlsx-js-style";

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
    pageSize: 200,
    currentPage: 1,
    background: true,
    pageSizes: [50, 100, 200]
  });

  // 搜索表单参数
  const searchFormParams = reactive<AccountQueryParams>({
    pageNum: 1,
    pageSize: 200,
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

  // 格式化计划信息
  const formatPlanInfo = (account: Account): string => {
    if (!account.plan) return "-";

    const currentDay = account.currentPlanDay || 0;
    const totalDays = account.plan.plan_days || 0;
    const totalAmount = account.plan.total_amount || "0";
    const floatAmount = account.plan.float_amount || "0";

    return `第${currentDay}天/${totalDays}天\n计划: ${totalAmount}\n浮动: ${floatAmount}`;
  };

  // 格式化汇率信息
  const formatRateInfo = (account: Account): string => {
    if (!account.rate) return "-";

    const rate = account.rate.rate || "-";
    let rateText = `汇率: ${rate}`;

    if (account.rate.amount_constraint === "multiple") {
      const multipleBase = account.rate.multiple_base || 0;
      const minAmount = account.rate.min_amount || 0;
      const maxAmount = account.rate.max_amount || 0;
      rateText += `\n倍数: ${multipleBase}\n${minAmount}-${maxAmount}`;
    } else if (account.rate.amount_constraint === "fixed") {
      const fixedAmounts = formatFixedAmounts(account.rate.fixed_amounts);
      rateText += `\n固定: ${fixedAmounts}`;
    } else if (account.rate.amount_constraint === "all") {
      rateText += `\n全面额`;
    }

    return rateText;
  };

  // 格式化日期时间
  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  // 根据国家代码获取货币符号
  const getCurrencySymbol = (countryCode: string): string => {
    const currencyMap: Record<string, string> = {
      US: "$", // 美国
      USA: "$", // 美国
      CN: "¥", // 中国
      CHN: "¥", // 中国
      GB: "£", // 英国
      UK: "£", // 英国
      EU: "€", // 欧盟
      EUR: "€", // 欧盟
      DE: "€", // 德国
      FR: "€", // 法国
      IT: "€", // 意大利
      ES: "€", // 西班牙
      JP: "¥", // 日本
      JPN: "¥", // 日本
      KR: "₩", // 韩国
      KOR: "₩", // 韩国
      IN: "₹", // 印度
      IND: "₹", // 印度
      AU: "A$", // 澳大利亚
      AUS: "A$", // 澳大利亚
      CA: "C$", // 加拿大
      CAN: "C$", // 加拿大
      RU: "₽", // 俄罗斯
      RUS: "₽", // 俄罗斯
      BR: "R$", // 巴西
      BRA: "R$", // 巴西
      MX: "$", // 墨西哥
      MEX: "$", // 墨西哥
      SG: "S$", // 新加坡
      SGP: "S$", // 新加坡
      HK: "HK$", // 香港
      HKG: "HK$", // 香港
      TW: "NT$", // 台湾
      TWN: "NT$", // 台湾
      TH: "฿", // 泰国
      THA: "฿", // 泰国
      ID: "Rp", // 印尼
      IDN: "Rp", // 印尼
      MY: "RM", // 马来西亚
      MYS: "RM", // 马来西亚
      PH: "₱", // 菲律宾
      PHL: "₱", // 菲律宾
      VN: "₫", // 越南
      VNM: "₫", // 越南
      TR: "₺", // 土耳其
      TUR: "₺", // 土耳其
      ZA: "R", // 南非
      ZAF: "R", // 南非
      CH: "CHF", // 瑞士
      CHE: "CHF", // 瑞士
      NO: "kr", // 挪威
      NOR: "kr", // 挪威
      SE: "kr", // 瑞典
      SWE: "kr", // 瑞典
      DK: "kr", // 丹麦
      DNK: "kr", // 丹麦
      PL: "zł", // 波兰
      POL: "zł", // 波兰
      CZ: "Kč", // 捷克
      CZE: "Kč", // 捷克
      HU: "Ft", // 匈牙利
      HUN: "Ft", // 匈牙利
      IL: "₪", // 以色列
      ISR: "₪", // 以色列
      SA: "SR", // 沙特阿拉伯
      SAU: "SR", // 沙特阿拉伯
      AE: "AED", // 阿联酋
      ARE: "AED", // 阿联酋
      EG: "E£", // 埃及
      EGY: "E£", // 埃及
      NG: "₦", // 尼日利亚
      NGA: "₦", // 尼日利亚
      AR: "$", // 阿根廷
      ARG: "$", // 阿根廷
      CL: "$", // 智利
      CHL: "$", // 智利
      CO: "$", // 哥伦比亚
      COL: "$", // 哥伦比亚
      PE: "S/", // 秘鲁
      PER: "S/", // 秘鲁
      NZ: "NZ$", // 新西兰
      NZL: "NZ$" // 新西兰
    };
    return currencyMap[countryCode?.toUpperCase()] || "$"; // 默认美元符号
  };

  // 格式化金额显示
  const formatCurrencyAmount = (account: Account): string => {
    if (!(account as any).amount) return "-";

    // 获取国家代码
    let countryCode = "";
    if (typeof account.country === "string") {
      countryCode = account.country;
    } else if (account.country && typeof account.country === "object") {
      countryCode =
        (account.country as any).code ||
        (account.country as any).country_code ||
        "";
    }

    const currencySymbol = getCurrencySymbol(countryCode);
    return `${currencySymbol}${parseFloat((account as any).amount).toFixed(2)}`;
  };

  // 格式化账号余款显示
  const formatCurrencyBalance = (account: Account): string => {
    if (!(account as any).balance) return "-";

    // 获取国家代码
    let countryCode = "";
    if (typeof account.country === "string") {
      countryCode = account.country;
    } else if (account.country && typeof account.country === "object") {
      countryCode =
        (account.country as any).code ||
        (account.country as any).country_code ||
        "";
    }

    const currencySymbol = getCurrencySymbol(countryCode);
    return `${currencySymbol}${parseFloat((account as any).balance).toFixed(2)}`;
  };

  // 导出Excel
  const handleExportExcel = async () => {
    try {
      loading.value = true;

      // 获取所有数据进行导出（不分页）
      const exportParams = { ...searchFormParams, pageSize: 10000, pageNum: 1 };
      const response = await accountApi.getList(exportParams);

      if (!response || !response.data || !response.data.data) {
        message("获取导出数据失败", { type: "error" });
        return;
      }

      const exportData = response.data.data;

      if (exportData.length === 0) {
        message("没有数据可导出", { type: "warning" });
        return;
      }

      // 准备Excel数据
      const excelData = exportData.map((item: Account) => {
        // 处理国家信息
        let countryName = "-";
        if (typeof item.country === "string") {
          countryName = item.country;
        } else if (
          item.country &&
          typeof item.country === "object" &&
          "name_zh" in item.country
        ) {
          countryName = (item.country as any).name_zh;
        }

        // 获取国家代码
        let countryCode = "";
        if (typeof item.country === "string") {
          countryCode = item.country;
        } else if (item.country && typeof item.country === "object") {
          countryCode =
            (item.country as any).code ||
            (item.country as any).country_code ||
            "";
        }

        // 获取货币符号
        const currencySymbol = getCurrencySymbol(countryCode);

        return {
          账号: item.account || "-",
          金额: (item as any).amount
            ? `${currencySymbol}${parseFloat((item as any).amount).toFixed(2)}`
            : "-",
          国家: countryName,
          状态: getStatusText(item.status),
          登录状态: getLoginStatusText(item.loginStatus),
          计划: formatPlanInfo(item),
          汇率: formatRateInfo(item),
          群聊名称: item.room?.room_name || "-",
          创建人: item.user?.nickname || "-",
          更新时间: formatDateTime((item as any).updated_at || item.updatedAt),
          创建时间: formatDateTime(item.createdAt)
        };
      });

      // 创建工作簿和工作表
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 设置列宽
      const colWidths = [
        { wch: 20 }, // 账号
        { wch: 12 }, // 金额
        { wch: 15 }, // 国家
        { wch: 10 }, // 状态
        { wch: 12 }, // 登录状态
        { wch: 25 }, // 计划
        { wch: 25 }, // 汇率
        { wch: 20 }, // 群聊名称
        { wch: 15 }, // 创建人
        { wch: 20 }, // 更新时间
        { wch: 20 } // 创建时间
      ];
      worksheet["!cols"] = colWidths;

      // 获取数据范围
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

      // 定义样式
      const headerStyle = {
        font: {
          name: "微软雅黑",
          sz: 12,
          bold: true,
          color: { rgb: "FFFFFF" }
        },
        fill: {
          fgColor: { rgb: "4472C4" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      const baseDataStyle = {
        font: {
          name: "微软雅黑",
          sz: 10,
          color: { rgb: "000000" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      // 应用样式到所有单元格
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;

          if (R === 0) {
            // 表头行
            worksheet[cellAddress].s = headerStyle;
          } else {
            // 数据行
            let cellStyle = JSON.parse(JSON.stringify(baseDataStyle)); // 深拷贝

            // 状态列（D列，索引3）设置颜色
            if (C === 3) {
              const statusValue = worksheet[cellAddress].v;
              if (statusValue === "已完成") {
                cellStyle.font.color = { rgb: "67C23A" }; // 绿色
                cellStyle.font.bold = true;
              } else if (statusValue === "进行中") {
                cellStyle.font.color = { rgb: "409EFF" }; // 蓝色
                cellStyle.font.bold = true;
              } else if (statusValue === "等待中") {
                cellStyle.font.color = { rgb: "909399" }; // 灰色
                cellStyle.font.bold = true;
              } else if (statusValue === "锁定") {
                cellStyle.font.color = { rgb: "F56C6C" }; // 红色
                cellStyle.font.bold = true;
              }
            }

            // 登录状态列（E列，索引4）设置颜色
            if (C === 4) {
              const loginStatusValue = worksheet[cellAddress].v;
              if (loginStatusValue === "有效") {
                cellStyle.font.color = { rgb: "67C23A" }; // 绿色
                cellStyle.font.bold = true;
              } else if (loginStatusValue === "失效") {
                cellStyle.font.color = { rgb: "F56C6C" }; // 红色
                cellStyle.font.bold = true;
              }
            }

            worksheet[cellAddress].s = cellStyle;
          }
        }
      }

      // 设置行高
      if (!worksheet["!rows"]) worksheet["!rows"] = [];

      // 表头行高
      worksheet["!rows"][0] = { hpt: 30 };

      // 数据行高
      for (let row = 1; row <= range.e.r; row++) {
        worksheet["!rows"][row] = { hpt: 60 };
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, "账号管理");

      // 生成文件名
      const now = new Date();
      const fileName = `账号管理_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.xlsx`;

      // 导出文件
      XLSX.writeFile(workbook, fileName);

      message(`成功导出 ${exportData.length} 条数据`, { type: "success" });
    } catch (error) {
      console.error("导出失败:", error);
      message("导出失败", { type: "error" });
    } finally {
      loading.value = false;
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
    getAmountConstraintText,
    formatPlanInfo,
    formatRateInfo,
    formatCurrencyAmount,
    formatCurrencyBalance,
    formatDateTime,
    handleExportExcel
  };
}
