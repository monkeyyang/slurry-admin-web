import { reactive, ref } from "vue";
import { Delete, Check, Money, InfoFilled } from "@element-plus/icons-vue";
import { matchForecastApi } from "@/api/warehouse/stock";
import { getWarehouseListApi } from "@/api/warehouse";
import {
  getStockListApi,
  confirmStockInApi,
  settleStockApi,
  deleteStockApi,
  batchDeleteStockApi
} from "@/api/warehouse/stock/index";
import type {
  StockItem,
  CustomerOrderDetail
} from "@/api/warehouse/stock/types";
import type { FormInstance } from "element-plus";
import { ElMessageBox, ElMessage } from "element-plus";

export function useHook() {
  // 搜索表单
  const searchForm = reactive({
    warehouseId: "",
    goodsName: "",
    trackingNo: "",
    status: ""
  });

  // 加载状态
  const loading = ref(false);
  const pageLoading = ref(false);

  // 表单ref
  const formRef = ref<FormInstance>();

  // 表格ref
  const tableRef = ref();

  // 数据列表
  const dataList = ref<StockItem[]>([]);
  const multipleSelection = ref<StockItem[]>([]);

  // 分页
  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  // 仓库选项
  const warehouseOptions = ref<Array<{ value: string; label: string }>>([]);

  // 弹窗相关
  const importDialogVisible = ref(false);
  const dialogVisible = ref(false);
  const dialogTitle = ref("");
  const currentRow = ref<StockItem | null>(null);

  // 添加新的状态
  const matchDialogVisible = ref(false);
  const matchedItems = ref<StockItem[]>([]);
  const detailDialogVisible = ref(false);
  const customerOrderDetail = ref<CustomerOrderDetail | null>(null);

  // 入库弹窗
  const storageDialogVisible = ref(false);
  const storageDialogTitle = ref("新增入库");

  const selectedRows = ref([]);

  // 表格列定义
  const columns = [
    {
      type: "selection",
      width: 55,
      align: "left"
    },
    {
      label: "ID",
      prop: "id",
      width: 80
    },
    {
      label: "仓库",
      prop: "warehouse.name",
      width: 120
    },
    {
      label: "货物名称",
      prop: "goods_name",
      minWidth: 200
    },
    {
      label: "快递单号",
      prop: "tracking_no",
      width: 120
    },
    {
      label: "UPC/IMEI",
      prop: "upcOrImei",
      width: 120
    },
    {
      label: "匹配状态",
      width: 120,
      cellRenderer: ({ row }) => (
        <div class="flex items-center gap-2">
          <el-tag type={row.forecast_id ? "success" : "warning"}>
            {row.forecast_id ? "有预报" : "无预报"}
          </el-tag>
          {row.forecast_id && (
            <el-button
              link
              type="primary"
              onClick={() => handleViewDetail(row)}
            >
              <el-icon>
                <InfoFilled />
              </el-icon>
              详情
            </el-button>
          )}
        </div>
      )
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: ({ row }) => (
        <el-tag type={getStatusType(row.status)}>
          {getStatusText(row.status)}
        </el-tag>
      )
    },
    {
      label: "创建时间",
      prop: "createTime",
      width: 160
    },
    {
      label: "操作",
      fixed: "right",
      width: 200,
      cellRenderer: ({ row }) => (
        <div class="flex items-center gap-2">
          {row.status === 1 && (
            <el-button
              link
              type="primary"
              onClick={() => handleConfirmStockIn(row)}
            >
              <el-icon>
                <Check />
              </el-icon>
              确认入库
            </el-button>
          )}
          {row.status === 2 && (
            <el-button link type="success" onClick={() => handleSettle(row)}>
              <el-icon>
                <Money />
              </el-icon>
              结算
            </el-button>
          )}
          <el-button link type="danger" onClick={() => handleDelete(row)}>
            <el-icon>
              <Delete />
            </el-icon>
            删除
          </el-button>
        </div>
      )
    }
  ];

  // 获取仓库列表
  const getWarehouseOptions = async () => {
    try {
      const res = await getWarehouseListApi();
      const { code, data } = res as { code: number; data?: any };
      if (code === 0 && data?.data && Array.isArray(data.data)) {
        warehouseOptions.value = data.data.map(item => ({
          value: item.id,
          label: item.name
        }));
      } else {
        warehouseOptions.value = [];
        console.warn("获取仓库列表数据格式异常:", data);
      }
    } catch (error) {
      console.error("获取仓库列表失败", error);
      warehouseOptions.value = [];
    }
  };

  // 获取数据列表
  const getList = async () => {
    if (pageLoading.value) return; // 防止重复请求

    pageLoading.value = true;

    try {
      // 明确地构建参数对象，确保searchForm中的字段被正确传递
      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,

        // 直接从searchForm获取值，不使用展开操作符
        warehouseId: searchForm.warehouseId,
        goodsName: searchForm.goodsName,
        trackingNo: searchForm.trackingNo,
        status: searchForm.status
      };

      // 调试输出
      console.log("Search form:", searchForm);
      console.log("Request params:", params);

      // 清理undefine/null/空字符串值
      // Object.keys(params).forEach(key => {
      //   if (
      //     params[key] === undefined ||
      //     params[key] === null ||
      //     params[key] === ""
      //   ) {
      //     delete params[key];
      //   }
      // });
      //   undefine/null/空字符串值
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(
          ([_, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      const response = await getStockListApi(filteredParams);

      if (response.data) {
        dataList.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      }
    } catch (error) {
      console.error("获取库存列表失败", error);
      dataList.value = [];
      pagination.total = 0;
    } finally {
      pageLoading.value = false;
    }
  };

  // 搜索
  const onSearch = () => {
    pagination.currentPage = 1;
    getList();
  };

  // 重置
  const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  // 处理表格选择变化
  const handleSelectionChange = rows => {
    selectedRows.value = rows;
  };

  // 处理页码改变
  const handleCurrentChange = (page: number) => {
    pagination.currentPage = page;
    getList();
  };

  // 处理每页条数改变
  const handleSizeChange = (size: number) => {
    pagination.pageSize = size;
    pagination.currentPage = 1;
    getList();
  };

  // 处理导入
  const handleImport = () => {
    importDialogVisible.value = true;
  };

  // 处理编辑
  const handleEdit = (row: StockItem) => {
    currentRow.value = row;
    dialogTitle.value = "编辑库存";
    dialogVisible.value = true;
  };

  // 获取状态类型
  const getStatusType = (status: number) => {
    const map = {
      1: "warning", // 待入库
      2: "primary", // 已入库
      3: "success" // 已结算
    };
    return map[status] || "info";
  };

  // 获取状态文本
  const getStatusText = (status: number) => {
    const map = {
      1: "待入库",
      2: "已入库",
      3: "已结算"
    };
    return map[status] || "未知状态";
  };

  // 确认入库
  const handleConfirmStockIn = async (row: StockItem) => {
    try {
      await ElMessageBox.confirm("确认要入库该商品吗？", "提示", {
        type: "warning"
      });

      await confirmStockInApi(row.id);
      ElMessage.success("入库成功");
      getList();
    } catch (error) {
      console.error("确认入库失败", error);
    }
  };

  // 结算
  const handleSettle = async (row: StockItem) => {
    try {
      await ElMessageBox.confirm("确认要结算该商品吗？", "提示", {
        type: "warning"
      });

      await settleStockApi(row.id);
      ElMessage.success("结算成功");
      getList();
    } catch (error) {
      console.error("结算失败", error);
    }
  };

  // 查看客户预报详情
  const handleViewDetail = async (row: StockItem) => {
    if (!row.forecast_id) return;
    detailDialogVisible.value = true;
    currentRow.value = row;
  };

  // 匹配预报
  const handleMatch = async (items: StockItem[]) => {
    try {
      const res = await matchForecastApi({
        warehouseId: searchForm.warehouseId,
        items: items.map(item => ({ trackingNo: item.trackingNo }))
      });
      const { code, data } = res as { code: number; data?: any };
      if (code === 0) {
        matchedItems.value = data;
        matchDialogVisible.value = true;
      } else {
        ElMessage.error(data?.message || "匹配预报失败");
      }
    } catch (error) {
      console.error("匹配预报失败", error);
    }
  };

  // 入库弹窗
  const handleStorage = () => {
    currentRow.value = {
      id: "",
      forecast_id: "",
      goodsName: "",
      trackingNo: "",
      upcOrImei: "",
      warehouseId: "",
      warehouseName: "",
      matched: false,
      status: "pending",
      createTime: ""
    };
    storageDialogTitle.value = "新增入库";
    storageDialogVisible.value = true;
  };

  // 处理单个删除
  const handleDelete = async row => {
    try {
      await ElMessageBox.confirm("确认删除该记录吗？", "提示", {
        type: "warning"
      });

      const { code, message } = await deleteStockApi(row.id);
      if (code === 0) {
        ElMessage.success("删除成功");
        getList();
      } else {
        ElMessage.error(message || "删除失败");
      }
    } catch (error) {
      console.error("删除失败", error);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (!selectedRows.value.length) {
      ElMessage.warning("请选择要删除的记录");
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedRows.value.length} 条记录吗？`,
        "提示",
        {
          type: "warning"
        }
      );

      const ids = selectedRows.value.map(row => row.id);
      const { code, message } = await batchDeleteStockApi(ids);

      if (code === 0) {
        ElMessage.success("删除成功");
        getList();
      } else {
        ElMessage.error(message || "删除失败");
      }
    } catch (error) {
      console.error("批量删除失败", error);
    }
  };

  // 初始化
  getList();

  return {
    formRef,
    loading,
    pageLoading,
    columns,
    dataList,
    pagination,
    searchForm,
    tableRef,
    multipleSelection,
    warehouseOptions,
    importDialogVisible,
    dialogVisible,
    dialogTitle,
    currentRow,
    getList,
    onSearch,
    resetForm,
    handleSelectionChange,
    handleCurrentChange,
    handleSizeChange,
    handleImport,
    handleEdit,
    getWarehouseOptions,
    matchDialogVisible,
    matchedItems,
    detailDialogVisible,
    customerOrderDetail,
    handleConfirmStockIn,
    handleSettle,
    handleViewDetail,
    handleMatch,
    storageDialogVisible,
    storageDialogTitle,
    handleStorage,
    selectedRows,
    handleDelete,
    handleBatchDelete
  };
}
