import { reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import {
  getInboundListApi,
  deleteInboundApi,
  batchDeleteInboundApi
} from "@/api/warehouse/inbound";
import { usePublicHooks } from "@/views/system/hooks";
import type { FormInstance } from "element-plus";
import { ElMessageBox } from "element-plus";

// 定义查询参数接口，继承自BasePageQuery
interface InboundQuery {
  warehouseId?: string;
  goodsName?: string;
  trackingNumber?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export function useHook() {
  const formRef = ref<FormInstance>();
  const pageLoading = ref(false);
  const { switchStyle } = usePublicHooks();
  const tableRef = ref();

  const dataList = ref([]);
  const multipleSelection = ref([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  // 使用正确的接口类型
  const searchFormParams = reactive<InboundQuery>({
    warehouseId: "",
    goodsName: "",
    trackingNumber: "",
    status: "",
    startTime: "",
    endTime: ""
  });

  const columns: TableColumnList = [
    {
      type: "selection",
      align: "left",
      width: 55
    },
    {
      label: "ID",
      prop: "id",
      width: 80
    },
    {
      label: "仓库",
      prop: "warehouse_name",
      width: 120
    },
    {
      label: "客户",
      prop: "create_user_name",
      width: 120,
      cellRenderer: ({ row }) => <div>{row.create_user_name || "-"}</div>
    },
    {
      label: "货品名称",
      prop: "goods_name",
      minWidth: 200
    },
    {
      label: "订单编号",
      prop: "order_number",
      minWidth: 150,
      cellRenderer: ({ row }) => <div>{row.order_number || "-"}</div>
    },
    {
      label: "物流链接",
      prop: "tracking_number",
      minWidth: 150,
      cellRenderer: ({ row }) => (
        <div>
          {row.logistics_link ? (
            <el-link
              type="primary"
              href={row.logistics_link}
              target="_blank"
              underline={false}
            >
              查看
            </el-link>
          ) : (
            "-"
          )}
        </div>
      )
    },
    {
      label: "国家",
      prop: "country",
      width: 100
    },
    {
      label: "数量",
      prop: "quantity",
      width: 80
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: ({ row }) => (
        <el-tag type={row.status === 1 ? "success" : "info"} effect="plain">
          {row.status === 1 ? "正常" : "已取消"}
        </el-tag>
      )
    },
    {
      label: "结算状态",
      prop: "is_settled",
      width: 100,
      cellRenderer: ({ row }) => (
        <el-tag type={row.is_settled === 1 ? "success" : "info"} effect="plain">
          {row.is_settled === 1 ? "已结算" : "未结算"}
        </el-tag>
      )
    },
    {
      label: "结算人",
      prop: "settle_user_name",
      width: 120
    },
    {
      label: "结算时间",
      prop: "settle_time",
      width: 160
    },
    {
      label: "创建时间",
      prop: "create_time",
      width: 160
    },
    {
      label: "操作",
      fixed: "right",
      width: 260,
      slot: "operation"
    }
  ];

  async function getList() {
    pageLoading.value = true;
    try {
      // 创建一个新对象，包含分页参数
      const params: InboundQuery = { ...searchFormParams };
      params.pageNum = pagination.currentPage;
      params.pageSize = pagination.pageSize;

      const response = await getInboundListApi(params);

      if (response && response.code === 0 && response.data) {
        dataList.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (error) {
      console.error("获取入库列表失败", error);
      dataList.value = [];
      pagination.total = 0;
    } finally {
      pageLoading.value = false;
    }
  }

  /** 搜索 */
  const onSearch = () => {
    pagination.currentPage = 1;
    getList();
  };

  /** 重置表单 */
  const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /** 删除入库记录 */
  const handleDelete = async row => {
    try {
      await deleteInboundApi(row.id);
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      message("删除失败", { type: "error" });
    }
  };

  /** 处理表格选择变化 */
  const handleSelectionChange = selection => {
    console.log("选择变化:", selection);
    multipleSelection.value = selection;
  };

  /** 批量删除入库记录 */
  const handleBatchDelete = () => {
    console.log(
      "当前选中项:",
      JSON.stringify(multipleSelection.value, null, 2)
    );

    if (multipleSelection.value.length === 0) {
      message("请至少选择一条记录", { type: "warning" });
      return;
    }

    ElMessageBox.confirm(
      `确认删除选中的 ${multipleSelection.value.length} 条记录吗？此操作不可逆`,
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          pageLoading.value = true;
          // 获取所有选中项的ID
          const ids = multipleSelection.value.map(item => item.id);

          // 使用API函数而不是直接调用http.delete
          await batchDeleteInboundApi(ids);

          message("批量删除成功", { type: "success" });
          // 刷新列表
          getList();
          // 清空选择
          if (tableRef.value && tableRef.value.getTableRef) {
            const { clearSelection } = tableRef.value.getTableRef();
            clearSelection();
          }
          multipleSelection.value = [];
        } catch (error) {
          if (error !== "cancel") {
            console.error("批量删除失败", error);
            message("批量删除失败", { type: "error" });
          }
        } finally {
          pageLoading.value = false;
        }
      })
      .catch(() => {
        // 用户取消删除
      });
  };

  getList();

  return {
    formRef,
    columns,
    dataList,
    pagination,
    searchFormParams,
    pageLoading,
    tableRef,
    multipleSelection,
    getList,
    onSearch,
    resetForm,
    handleDelete,
    handleBatchDelete,
    handleSelectionChange
  };
}
