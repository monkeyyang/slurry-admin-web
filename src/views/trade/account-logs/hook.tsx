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
import * as XLSX from "xlsx-js-style";

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

  // 表格列配置 - 按要求顺序：ID、兑换码、国家、金额、账号余款、账号、错误信息、执行状态、时间、群聊、计划、汇率、操作
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
      width: 100,
      align: "center",
      slot: "country"
    },
    {
      label: "金额",
      prop: "amount",
      minWidth: 120,
      align: "center",
      slot: "amount"
    },
    {
      label: "账号余款",
      prop: "after_amount",
      minWidth: 120,
      align: "center",
      slot: "balance"
    },
    {
      label: "账号",
      prop: "account",
      minWidth: 150,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "错误信息",
      prop: "error_message",
      minWidth: 150,
      align: "center",
      slot: "errorMessage",
      showOverflowTooltip: true
    },
    {
      label: "执行状态",
      prop: "status",
      width: 100,
      align: "center",
      slot: "status"
    },
    {
      label: "时间",
      prop: "updated_at",
      minWidth: 160,
      align: "center",
      slot: "updatedAt"
    },
    {
      label: "群聊",
      prop: "roomName",
      minWidth: 150,
      align: "center",
      slot: "roomName",
      showOverflowTooltip: true
    },
    {
      label: "计划",
      prop: "planInfo",
      minWidth: 200,
      align: "center",
      slot: "planInfo",
      showOverflowTooltip: true
    },
    {
      label: "汇率",
      prop: "rateInfo",
      minWidth: 220,
      align: "center",
      slot: "rateInfo",
      showOverflowTooltip: true
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
  const searchFormParams = reactive<ExecutionLogQueryParams>({
    page: 1,
    pageSize: 200,
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
      pageSize: 200,
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

  // 获取金额约束类型文本
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

  // 获取货币符号
  const getCurrencySymbol = (countryCode?: string): string => {
    const currencyMap: Record<string, string> = {
      US: "$", // 美国
      USA: "$", // 美国
      CA: "CAD$", // 加拿大
      CAN: "CAD$", // 加拿大
      UK: "£", // 英国
      GB: "£", // 英国
      GBR: "£", // 英国
      AU: "AU$", // 澳大利亚
      AUS: "AU$", // 澳大利亚
      JP: "¥", // 日本
      JPN: "¥", // 日本
      KR: "₩", // 韩国
      KOR: "₩", // 韩国
      CN: "¥", // 中国
      CHN: "¥", // 中国
      EUR: "€", // 欧元区
      DE: "€", // 德国
      DEU: "€", // 德国
      FR: "€", // 法国
      FRA: "€", // 法国
      ES: "€", // 西班牙
      ESP: "€", // 西班牙
      IT: "€", // 意大利
      ITA: "€", // 意大利
      NL: "€", // 荷兰
      NLD: "€", // 荷兰
      BE: "€", // 比利时
      BEL: "€", // 比利时
      AT: "€", // 奥地利
      AUT: "€", // 奥地利
      PT: "€", // 葡萄牙
      PRT: "€", // 葡萄牙
      GR: "€", // 希腊
      GRC: "€", // 希腊
      FI: "€", // 芬兰
      FIN: "€", // 芬兰
      IE: "€", // 爱尔兰
      IRL: "€", // 爱尔兰
      LU: "€", // 卢森堡
      LUX: "€", // 卢森堡
      MT: "€", // 马耳他
      MLT: "€", // 马耳他
      CY: "€", // 塞浦路斯
      CYP: "€", // 塞浦路斯
      SK: "€", // 斯洛伐克
      SVK: "€", // 斯洛伐克
      SI: "€", // 斯洛文尼亚
      SVN: "€", // 斯洛文尼亚
      EE: "€", // 爱沙尼亚
      EST: "€", // 爱沙尼亚
      LV: "€", // 拉脱维亚
      LVA: "€", // 拉脱维亚
      LT: "€", // 立陶宛
      LTU: "€", // 立陶宛
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

  // 导出Excel
  const handleExportExcel = async () => {
    try {
      loading.value = true;

      // 获取所有数据进行导出（不分页）
      const exportParams = { ...searchFormParams, pageSize: 10000, page: 1 };
      const response = await executionLogApi.getList(exportParams);

      let exportData: ExecutionLog[] = [];

      // 根据实际后端返回的数据结构调整
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        exportData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        exportData = response.data;
      } else {
        message("获取导出数据失败", { type: "error" });
        return;
      }

      if (exportData.length === 0) {
        message("没有数据可导出", { type: "warning" });
        return;
      }

      // 准备Excel数据
      const excelData = exportData.map((item: ExecutionLog) => {
        // 获取国家代码
        const countryCode = item.country_code || "";

        // 获取货币符号
        const currencySymbol = getCurrencySymbol(countryCode);

        // 格式化计划信息
        const planInfo = item.plan_info;
        const planText = planInfo
          ? `${planInfo.name || "未知计划"} (第${item.day || 0}天/${planInfo.plan_days || 0}天)`
          : "-";

        // 格式化汇率信息
        const rateInfo = item.rate_info;
        let rateText = "-";
        if (rateInfo) {
          rateText = `汇率: ${rateInfo.rate || "-"}`;
          if (rateInfo.amount_constraint === "multiple") {
            rateText += ` | 倍数: ${rateInfo.multiple_base || 0}`;
          } else if (rateInfo.amount_constraint === "fixed") {
            rateText += ` | 固定面额`;
          } else if (rateInfo.amount_constraint === "all") {
            rateText += ` | 全面额`;
          }
        }

        return {
          ID: item.id || "-",
          兑换码: item.code || "-",
          国家: countryCode,
          金额: item.amount
            ? `${currencySymbol}${parseFloat(item.amount.toString()).toFixed(2)}`
            : "-",
          账号余额: item.after_amount
            ? `${currencySymbol}${parseFloat(item.after_amount.toString()).toFixed(2)}`
            : "-",
          账号: item.account || "-",
          错误信息: item.error_message || "-",
          执行状态: item.status_text || item.status || "-",
          执行时间: formatDateTime(item.updated_at),
          群聊名称: item.room_name || "-",
          计划信息: planText,
          汇率信息: rateText
        };
      });

      // 创建工作簿和工作表
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 设置列宽
      const colWidths = [
        { wch: 10 }, // ID
        { wch: 18 }, // 兑换码
        { wch: 10 }, // 国家
        { wch: 15 }, // 金额
        { wch: 15 }, // 账号余额
        { wch: 25 }, // 账号
        { wch: 30 }, // 错误信息
        { wch: 12 }, // 执行状态
        { wch: 20 }, // 执行时间
        { wch: 20 }, // 群聊名称
        { wch: 30 }, // 计划信息
        { wch: 25 } // 汇率信息
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

            // 执行状态列设置颜色
            if (C === 7) {
              // 执行状态列
              const statusValue = worksheet[cellAddress].v;
              if (statusValue === "成功" || statusValue === "success") {
                cellStyle.font.color = { rgb: "67C23A" }; // 绿色
                cellStyle.font.bold = true;
              } else if (statusValue === "失败" || statusValue === "failed") {
                cellStyle.font.color = { rgb: "F56C6C" }; // 红色
                cellStyle.font.bold = true;
              } else if (
                statusValue === "待处理" ||
                statusValue === "pending"
              ) {
                cellStyle.font.color = { rgb: "E6A23C" }; // 黄色
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
        worksheet["!rows"][row] = { hpt: 40 };
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, "执行记录");

      // 生成文件名
      const now = new Date();
      const fileName = `执行记录_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.xlsx`;

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

  // 格式化金额显示
  const formatCurrencyAmount = (item: any): string => {
    if (!item.amount) return "-";

    // 获取国家代码
    let countryCode = "";
    if (typeof item.country === "string") {
      countryCode = item.country;
    } else if (item.country && typeof item.country === "object") {
      countryCode = item.country.code || item.country.country_code || "";
    } else if (item.country_code) {
      countryCode = item.country_code;
    }

    const currencySymbol = getCurrencySymbol(countryCode);
    return `${currencySymbol}${parseFloat(item.amount).toFixed(2)}`;
  };

  // 格式化账号余款显示
  const formatCurrencyBalance = (item: any): string => {
    if (!item.after_amount) return "-";

    // 获取国家代码
    let countryCode = "";
    if (typeof item.country === "string") {
      countryCode = item.country;
    } else if (item.country && typeof item.country === "object") {
      countryCode = item.country.code || item.country.country_code || "";
    } else if (item.country_code) {
      countryCode = item.country_code;
    }

    const currencySymbol = getCurrencySymbol(countryCode);
    return `${currencySymbol}${parseFloat(item.after_amount).toFixed(2)}`;
  };

  // 格式化计划信息
  const formatPlanInfo = (item: any): string => {
    if (!item.plan) return "-";

    const currentDay = item.currentPlanDay || 0;
    const totalDays = item.plan.plan_days || 0;
    const totalAmount = item.plan.total_amount || "0";
    const floatAmount = item.plan.float_amount || "0";

    return `第${currentDay}天/${totalDays}天\n计划: ${totalAmount}\n浮动: ${floatAmount}`;
  };

  // 格式化汇率信息
  const formatRateInfo = (item: any): string => {
    if (!item.rate) return "-";

    const rate = item.rate.rate || "-";
    let rateText = `汇率: ${rate}`;

    if (item.rate.amount_constraint === "multiple") {
      const multipleBase = item.rate.multiple_base || 0;
      const minAmount = item.rate.min_amount || 0;
      const maxAmount = item.rate.max_amount || 0;
      rateText += `\n倍数: ${multipleBase}\n${minAmount}-${maxAmount}`;
    } else if (item.rate.amount_constraint === "fixed") {
      const fixedAmounts = formatFixedAmounts(item.rate.fixed_amounts);
      rateText += `\n固定: ${fixedAmounts}`;
    } else if (item.rate.amount_constraint === "all") {
      rateText += `\n全面额`;
    }

    return rateText;
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
    getAmountConstraintText,
    getCurrencySymbol,
    formatCurrencyAmount,
    formatCurrencyBalance,
    formatPlanInfo,
    formatRateInfo,
    handleExportExcel
  };
}
