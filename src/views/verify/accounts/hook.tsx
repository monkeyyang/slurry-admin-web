import { ref, reactive } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { ElMessageBox } from "element-plus";
import {
  verifyAccountApi,
  operationLogApi,
  type VerifyAccount,
  type VerifyAccountQueryParams,
  type BatchImportVerifyAccountsRequest,
  type ImportVerifyAccountInfo,
  type CreateOperationLogRequest
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

export function useVerifyAccountHook() {
  const _tableRef = ref();
  const loading = ref(false);

  // 表格列配置
  const columns: TableColumnList = [
    {
      label: "勾选列",
      type: "selection",
      width: 55,
      align: "center"
    },
    {
      label: "序号",
      type: "index",
      width: 70,
      align: "center"
    },
    {
      label: "账号",
      prop: "account",
      minWidth: 200,
      align: "center",
      showOverflowTooltip: true
    },
    {
      label: "创建人",
      prop: "user.nickname",
      width: 120,
      align: "center",
      slot: "uid"
    },
    {
      label: "创建时间",
      prop: "created_at",
      minWidth: 160,
      align: "center",
      slot: "createdAt"
    },
    {
      label: "操作",
      fixed: "right",
      minWidth: 280,
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
  const searchFormParams = reactive<VerifyAccountQueryParams>({
    pageNum: 1,
    pageSize: 200,
    account: "",
    uid: undefined
  });

  // 数据列表
  const dataList = ref<VerifyAccount[]>([]);

  // 选中的行
  const selectedRows = ref<VerifyAccount[]>([]);

  // 批量导入相关
  const importDialogVisible = ref(false);
  const importText = ref("");
  const importLoading = ref(false);

  // 编辑对话框相关
  const editDialogVisible = ref(false);
  const editForm = reactive<Partial<VerifyAccount>>({
    id: undefined,
    account: "",
    verify_url: ""
  });
  const editFormRules = {
    account: [{ required: true, message: "请输入账号", trigger: "blur" }]
  };
  const editLoading = ref(false);

  // 验证码对话框相关
  const verifyCodeDialogVisible = ref(false);
  const verifyCodeForm = reactive({
    commands: ""
  });
  const verifyCodeResult = ref("");
  const verifyCodeLoading = ref(false);
  const currentAccount = ref<VerifyAccount | null>(null);

  // 密码验证弹层相关
  const passwordVerifyDialogVisible = ref(false);
  const passwordVerifyForm = reactive({
    password: ""
  });
  const passwordVerifyLoading = ref(false);
  const pendingOperation = ref<{
    type: string;
    data: any;
    callback?: () => void;
  } | null>(null);

  // 获取列表数据
  const getList = async () => {
    try {
      loading.value = true;
      const params = {
        ...searchFormParams,
        pageNum: pagination.currentPage,
        pageSize: pagination.pageSize
      };
      const response = await verifyAccountApi.getList(params);
      console.log("API响应数据:", response);

      // 根据实际响应结构处理数据
      if (response.code === 0) {
        dataList.value = response.data?.data || [];
        pagination.total = response.data?.total || 0;

        // 记录成功获取数据的日志
        await recordOperationLog(
          "page_view",
          `加载页面: 第${pagination.currentPage}页`,
          "success",
          `成功加载${dataList.value.length}条数据`
        );
      } else {
        message(response.message || "获取数据失败", { type: "error" });
        await recordOperationLog(
          "page_view",
          `加载页面: 第${pagination.currentPage}页`,
          "failed",
          `获取数据失败: ${response.message}`
        );
      }
    } catch (error) {
      console.error("获取列表失败:", error);
      message("获取列表失败", { type: "error" });
      await recordOperationLog(
        "page_view",
        `加载页面: 第${pagination.currentPage}页`,
        "failed",
        `获取列表失败: ${error}`
      );
    } finally {
      loading.value = false;
    }
  };

  // 搜索
  const onSearch = async () => {
    pagination.currentPage = 1;
    // 记录搜索操作埋点
    await recordOperationLog(
      "search",
      `搜索条件: ${JSON.stringify(searchFormParams)}`,
      "success",
      `执行搜索操作: 账号=${searchFormParams.account || "全部"}, 用户ID=${searchFormParams.uid || "全部"}`
    );
    getList();
  };

  // 重置表单
  const resetForm = async (formRef?: any) => {
    if (formRef) {
      formRef.resetFields();
    } else {
      searchFormParams.account = "";
      searchFormParams.uid = undefined;
    }
    pagination.currentPage = 1;

    // 记录重置表单操作埋点
    await recordOperationLog(
      "reset_form",
      "重置搜索表单",
      "success",
      "重置搜索条件并刷新数据"
    );

    getList();
  };

  // 处理选择变化
  const handleSelectionChange = async (selection: VerifyAccount[]) => {
    selectedRows.value = selection;

    // 记录选择变化埋点
    await recordOperationLog(
      "selection_change",
      `选择了${selection.length}个账号`,
      "success",
      `用户选择了${selection.length}个账号: ${selection.map(s => s.account).join(", ")}`
    );
  };

  // 处理页面大小变化
  const handleSizeChange = async (val: number) => {
    pagination.pageSize = val;

    // 记录页面大小变化埋点
    await recordOperationLog(
      "page_size_change",
      `改变页面大小为: ${val}`,
      "success",
      `用户改变每页显示数量为: ${val}`
    );

    getList();
  };

  // 处理当前页变化
  const handleCurrentChange = async (val: number) => {
    pagination.currentPage = val;

    // 记录当前页变化埋点
    await recordOperationLog(
      "page_change",
      `切换到第${val}页`,
      "success",
      `用户切换到第${val}页`
    );

    getList();
  };

  // 实际执行删除操作（密码验证后）
  const executeDelete = async (row: VerifyAccount) => {
    try {
      await verifyAccountApi.delete(row.id!);
      await recordOperationLog(
        "delete",
        row.account,
        "success",
        `删除账号: ${row.account}`
      );
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      console.error("删除失败:", error);
      await recordOperationLog(
        "delete",
        row.account,
        "failed",
        `删除失败: ${error}`
      );
      message("删除失败", { type: "error" });
    }
  };

  // 实际执行批量删除操作（密码验证后）
  const executeBatchDelete = async (rows: VerifyAccount[]) => {
    try {
      const ids = rows.map(row => row.id!).filter(id => id);
      const accounts = rows.map(row => row.account).join(", ");
      await verifyAccountApi.batchDelete(ids);
      await recordOperationLog(
        "batchDelete",
        accounts,
        "success",
        `批量删除 ${rows.length} 个账号`
      );
      message("批量删除成功", { type: "success" });
      selectedRows.value = [];
      getList();
    } catch (error) {
      console.error("批量删除失败:", error);
      const accounts = rows.map(row => row.account).join(", ");
      await recordOperationLog(
        "batchDelete",
        accounts,
        "failed",
        `批量删除失败: ${error}`
      );
      message("批量删除失败", { type: "error" });
    }
  };

  // 实际执行复制账号操作（密码验证后）
  const executeCopyAccount = async (row: VerifyAccount) => {
    try {
      const response = await verifyAccountApi.copyAccount(row.id!);
      if (response.code === 0) {
        const accountInfo = `账号: ${response.data.account}\n密码: ${response.data.password}`;
        await navigator.clipboard.writeText(accountInfo);
        await recordOperationLog(
          "copy",
          row.account,
          "success",
          `复制账号密码: ${row.account}`
        );
        message("账号密码已复制到剪贴板", { type: "success" });
      } else {
        await recordOperationLog(
          "copy",
          row.account,
          "failed",
          `复制失败: ${response.message}`
        );
        message(response.message || "复制账号失败", { type: "error" });
      }
    } catch (error) {
      console.error("复制账号失败:", error);
      await recordOperationLog(
        "copy",
        row.account,
        "failed",
        `复制账号失败: ${error}`
      );
      message("复制账号失败", { type: "error" });
    }
  };

  // 实际执行获取验证码操作（密码验证后）
  const executeGetVerifyCode = (row: VerifyAccount) => {
    currentAccount.value = row;
    verifyCodeForm.commands = "";
    verifyCodeResult.value = "";
    verifyCodeDialogVisible.value = true;
    // 记录获取验证码操作开始
    recordOperationLog(
      "getVerifyCode",
      row.account,
      "success",
      `开始获取验证码: ${row.account}`
    );
  };

  // 实际执行编辑操作（密码验证后）
  const executeEdit = (row: VerifyAccount) => {
    editForm.id = row.id;
    editForm.account = row.account;
    editForm.verify_url = row.verify_url || "";
    editDialogVisible.value = true;
    // 记录编辑操作开始
    recordOperationLog(
      "edit",
      row.account,
      "success",
      `开始编辑账号: ${row.account}`
    );
  };

  // 删除账号（修改为先验证密码）
  const handleDelete = async (row: VerifyAccount) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除账号 "${row.account}" 吗？`,
        "提示",
        {
          type: "warning"
        }
      );

      // 显示密码验证弹层
      showPasswordVerify("delete", row);
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除失败:", error);
      }
    }
  };

  // 批量删除（修改为先验证密码）
  const handleBatchDelete = async (rows: VerifyAccount[]) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${rows.length} 个账号吗？`,
        "提示",
        {
          type: "warning"
        }
      );

      // 显示密码验证弹层
      showPasswordVerify("batchDelete", rows);
    } catch (error) {
      if (error !== "cancel") {
        console.error("批量删除失败:", error);
      }
    }
  };

  // 复制账号密码（修改为先验证密码）
  const handleCopyAccount = async (row: VerifyAccount) => {
    showPasswordVerify("copy", row);
  };

  // 获取验证码（修改为先验证密码）
  const handleGetVerifyCode = (row: VerifyAccount) => {
    showPasswordVerify("getVerifyCode", row);
  };

  // 编辑账号（修改为先验证密码）
  const handleEdit = (row: VerifyAccount) => {
    showPasswordVerify("edit", row);
  };

  // 重置验证码对话框
  const resetVerifyCodeDialog = () => {
    currentAccount.value = null;
    verifyCodeForm.commands = "";
    verifyCodeResult.value = "";
    verifyCodeLoading.value = false;
  };

  // 提交获取验证码
  const handleGetVerifyCodeSubmit = async () => {
    if (!currentAccount.value) return;

    try {
      verifyCodeLoading.value = true;
      const response = await verifyAccountApi.getVerifyCode(
        currentAccount.value.id!,
        verifyCodeForm.commands
      );
      if (response.code === 0) {
        verifyCodeResult.value = response.data.verify_code;
        await recordOperationLog(
          "getVerifyCode",
          currentAccount.value.account,
          "success",
          `成功获取验证码: ${currentAccount.value.account}, 验证码: ${response.data.verify_code}`
        );
        message("验证码获取成功", { type: "success" });
      } else {
        await recordOperationLog(
          "getVerifyCode",
          currentAccount.value.account,
          "failed",
          `获取验证码失败: ${response.message}`
        );
        message(response.message || "获取验证码失败", { type: "error" });
      }
    } catch (error) {
      console.error("获取验证码失败:", error);
      if (currentAccount.value) {
        await recordOperationLog(
          "getVerifyCode",
          currentAccount.value.account,
          "failed",
          `获取验证码失败: ${error}`
        );
      }
      message("获取验证码失败", { type: "error" });
    } finally {
      verifyCodeLoading.value = false;
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      editLoading.value = true;
      const accountName = editForm.account || "";

      if (editForm.id) {
        // 更新
        await verifyAccountApi.update(editForm.id, editForm);
        await recordOperationLog(
          "edit",
          accountName,
          "success",
          `成功更新账号: ${accountName}`
        );
        message("更新成功", { type: "success" });
      } else {
        // 创建
        await verifyAccountApi.create(editForm);
        await recordOperationLog(
          "create",
          accountName,
          "success",
          `成功创建账号: ${accountName}`
        );
        message("创建成功", { type: "success" });
      }

      editDialogVisible.value = false;
      getList();
    } catch (error) {
      console.error("保存失败:", error);
      const accountName = editForm.account || "";
      const operation = editForm.id ? "edit" : "create";
      await recordOperationLog(
        operation,
        accountName,
        "failed",
        `保存失败: ${error}`
      );
      message("保存失败", { type: "error" });
    } finally {
      editLoading.value = false;
    }
  };

  // 复制验证码
  const copyVerifyCode = async () => {
    try {
      await navigator.clipboard.writeText(verifyCodeResult.value);
      message("验证码已复制到剪贴板", { type: "success" });

      // 记录复制验证码成功埋点
      await recordOperationLog(
        "copy_verify_code",
        currentAccount.value?.account || "未知账号",
        "success",
        `复制验证码: ${verifyCodeResult.value}`
      );
    } catch (error) {
      console.error("复制验证码失败:", error);
      message("复制验证码失败", { type: "error" });

      // 记录复制验证码失败埋点
      await recordOperationLog(
        "copy_verify_code",
        currentAccount.value?.account || "未知账号",
        "failed",
        `复制验证码失败: ${error}`
      );
    }
  };

  // 打开导入对话框
  const openImportDialog = async () => {
    importDialogVisible.value = true;

    // 记录打开导入对话框埋点
    await recordOperationLog(
      "open_import_dialog",
      "打开批量导入对话框",
      "success",
      "用户打开批量导入功能"
    );
  };

  // 重置导入对话框
  const resetImportDialog = () => {
    importText.value = "";
    importLoading.value = false;
  };

  // 执行导入
  const handleImport = async () => {
    if (!importText.value.trim()) {
      message("请输入要导入的账号信息", { type: "warning" });
      return;
    }

    try {
      importLoading.value = true;

      // 解析文本数据
      const lines = importText.value.trim().split("\n");
      const accounts: ImportVerifyAccountInfo[] = [];

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const parts = trimmedLine.split(/\s+/); // 使用空格分割
        if (parts.length >= 1) {
          accounts.push({
            account: parts[0] || "",
            password: "", // 不需要密码
            verify_url: parts[1] || ""
          });
        }
      });

      if (accounts.length === 0) {
        message("没有解析到有效的账号信息", { type: "warning" });
        return;
      }

      const importData: BatchImportVerifyAccountsRequest = {
        accounts: accounts
      };

      const response = await verifyAccountApi.batchImport(importData);
      if (response.code === 0) {
        const result = response.data;
        let msg = `导入完成！成功: ${result.successCount}`;
        if (result.failCount) {
          msg += `，失败: ${result.failCount}`;
        }
        if (result.duplicateAccounts && result.duplicateAccounts.length > 0) {
          msg += `，重复: ${result.duplicateAccounts.length}`;
        }

        const accountList = accounts.map(acc => acc.account).join(", ");
        await recordOperationLog(
          "import",
          accountList,
          "success",
          `批量导入完成: 成功${result.successCount}个, 失败${result.failCount || 0}个`
        );
        message(msg, { type: "success" });

        importDialogVisible.value = false;
        getList();
      } else {
        const accountList = accounts.map(acc => acc.account).join(", ");
        await recordOperationLog(
          "import",
          accountList,
          "failed",
          `导入失败: ${response.message}`
        );
        message(response.message || "导入失败", { type: "error" });
      }
    } catch (error) {
      console.error("导入失败:", error);
      await recordOperationLog(
        "import",
        "批量导入",
        "failed",
        `导入失败: ${error}`
      );
      message("导入失败", { type: "error" });
    } finally {
      importLoading.value = false;
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      loading.value = true;

      // 获取当前筛选条件下的所有数据
      const params = {
        ...searchFormParams,
        pageNum: 1,
        pageSize: 9999 // 导出所有数据
      };

      const response = await verifyAccountApi.getList(params);
      if (response.code === 0) {
        const data = response.data?.data || [];

        if (data.length === 0) {
          message("没有可导出的数据", { type: "warning" });
          return;
        }

        // 构建CSV内容
        const csvHeaders = ["序号", "账号", "创建人", "创建时间"];
        const csvData = data.map((item: VerifyAccount, index: number) => [
          index + 1,
          item.account || "",
          item.user?.nickname || "-",
          formatDateTime(item.created_at)
        ]);

        // 创建CSV字符串
        const csvContent = [
          csvHeaders.join(","),
          ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        // 添加BOM以支持中文
        const bom = "\uFEFF";
        const blob = new Blob([bom + csvContent], {
          type: "text/csv;charset=utf-8;"
        });

        // 创建下载链接
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `账号查码数据_${new Date().toISOString().slice(0, 10)}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await recordOperationLog(
          "export",
          "数据导出",
          "success",
          `成功导出 ${data.length} 条数据`
        );
        message(`成功导出 ${data.length} 条数据`, { type: "success" });
      } else {
        await recordOperationLog(
          "export",
          "数据导出",
          "failed",
          `导出失败: ${response.message}`
        );
        message(response.message || "导出失败", { type: "error" });
      }
    } catch (error) {
      console.error("导出失败:", error);
      await recordOperationLog(
        "export",
        "数据导出",
        "failed",
        `导出失败: ${error}`
      );
      message("导出失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  // 记录操作日志
  const recordOperationLog = async (
    operationType: string,
    targetAccount: string,
    result: "success" | "failed" | "password_error",
    details?: string
  ) => {
    try {
      const logData: CreateOperationLogRequest = {
        operation_type: operationType,
        target_account: targetAccount,
        result: result,
        details: details || "",
        user_agent: navigator.userAgent,
        ip_address: undefined // 服务器端获取IP
      };

      // 调用日志记录API
      await operationLogApi.create(logData);
      console.log("操作日志记录成功:", logData);
    } catch (error) {
      console.error("记录操作日志失败:", error);
    }
  };

  // 密码验证
  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      passwordVerifyLoading.value = true;

      // 记录密码验证尝试埋点
      const operationType = pendingOperation.value?.type || "unknown";
      const targetAccount = pendingOperation.value
        ? getTargetAccountFromOperation(pendingOperation.value)
        : "未知账号";

      await recordOperationLog(
        "password_verify_attempt",
        targetAccount,
        "success",
        `尝试密码验证，操作类型: ${operationType}`
      );

      // 这里应该调用后端API验证密码，暂时模拟
      // const response = await userApi.verifyPassword(password);
      // return response.code === 0;

      // 临时验证逻辑（实际应该调用后端API）
      if (password === "admin123") {
        // 记录密码验证成功埋点
        await recordOperationLog(
          "password_verify_success",
          targetAccount,
          "success",
          `密码验证成功，操作类型: ${operationType}`
        );
        return true;
      }

      // 记录密码验证失败日志
      if (pendingOperation.value) {
        await recordOperationLog(
          "password_verify_failed",
          targetAccount,
          "password_error",
          `密码验证失败，操作类型: ${operationType}`
        );
      }

      message("密码错误", { type: "error" });
      return false;
    } catch (error) {
      console.error("密码验证失败:", error);
      message("密码验证失败", { type: "error" });

      // 记录密码验证异常埋点
      const errorOperationType = pendingOperation.value?.type || "unknown";
      const errorTargetAccount = pendingOperation.value
        ? getTargetAccountFromOperation(pendingOperation.value)
        : "未知账号";
      await recordOperationLog(
        "password_verify_error",
        errorTargetAccount,
        "failed",
        `密码验证异常: ${error}, 操作类型: ${errorOperationType}`
      );

      return false;
    } finally {
      passwordVerifyLoading.value = false;
    }
  };

  // 从操作中获取目标账号
  const getTargetAccountFromOperation = (operation: {
    type: string;
    data: any;
  }): string => {
    if (operation.type === "batchDelete") {
      const accounts = operation.data as VerifyAccount[];
      return accounts.map(acc => acc.account).join(", ");
    } else {
      const account = operation.data as VerifyAccount;
      return account.account || "";
    }
  };

  // 显示密码验证弹层
  const showPasswordVerify = (
    operationType: string,
    data: any,
    callback?: () => void
  ) => {
    pendingOperation.value = {
      type: operationType,
      data,
      callback
    };
    passwordVerifyForm.password = "";
    passwordVerifyDialogVisible.value = true;
  };

  // 确认密码验证
  const confirmPasswordVerify = async () => {
    if (!passwordVerifyForm.password.trim()) {
      message("请输入密码", { type: "warning" });
      return;
    }

    const isValid = await verifyPassword(passwordVerifyForm.password);
    if (isValid && pendingOperation.value) {
      passwordVerifyDialogVisible.value = false;

      // 执行待处理的操作
      const { type, data, callback } = pendingOperation.value;

      switch (type) {
        case "delete":
          await executeDelete(data);
          break;
        case "batchDelete":
          await executeBatchDelete(data);
          break;
        case "copy":
          await executeCopyAccount(data);
          break;
        case "getVerifyCode":
          executeGetVerifyCode(data);
          break;
        case "edit":
          executeEdit(data);
          break;
        default:
          if (callback) {
            callback();
          }
          break;
      }

      pendingOperation.value = null;
    }
  };

  // 取消密码验证
  const cancelPasswordVerify = () => {
    passwordVerifyDialogVisible.value = false;
    pendingOperation.value = null;
    passwordVerifyForm.password = "";
  };

  // 重置编辑表单
  const resetEditForm = () => {
    editForm.id = undefined;
    editForm.account = "";
    editForm.verify_url = "";
    editLoading.value = false;
  };

  return {
    loading,
    dataList,
    columns,
    pagination,
    searchFormParams,
    selectedRows,
    importDialogVisible,
    importText,
    importLoading,
    editDialogVisible,
    editForm,
    editFormRules,
    editLoading,
    verifyCodeDialogVisible,
    verifyCodeForm,
    verifyCodeResult,
    verifyCodeLoading,
    currentAccount,
    getList,
    onSearch,
    resetForm,
    handleSelectionChange,
    handleSizeChange,
    handleCurrentChange,
    handleBatchDelete,
    handleDelete,
    handleEdit,
    handleCopyAccount,
    handleGetVerifyCode,
    openImportDialog,
    resetImportDialog,
    handleImport,
    resetEditForm,
    handleSaveEdit,
    resetVerifyCodeDialog,
    handleGetVerifyCodeSubmit,
    copyVerifyCode,
    formatDateTime,
    passwordVerifyDialogVisible,
    passwordVerifyForm,
    passwordVerifyLoading,
    pendingOperation,
    showPasswordVerify,
    confirmPasswordVerify,
    cancelPasswordVerify,
    handleExport,
    recordOperationLog
  };
}
