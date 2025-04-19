import { reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";

// 定义查询参数接口
interface PurchaseOrderQuery {
  orderNumber?: string;
  supplierId?: string | number;
  status?: string;
  dateRange?: [Date, Date] | null;
  pageNum?: number;
  pageSize?: number;
}

export function useHook() {
  const formRef = ref<FormInstance>();
  const pageLoading = ref(false);
  const tableRef = ref();

  const dataList = ref([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  // 搜索表单参数
  const searchFormParams = reactive<PurchaseOrderQuery>({
    orderNumber: "",
    supplierId: "",
    status: "",
    dateRange: null
  });

  const columns: TableColumnList = [
    {
      label: "订单编号",
      prop: "orderNumber",
      width: 150
    },
    {
      label: "供应商",
      prop: "supplierName",
      minWidth: 120
    },
    {
      label: "采购员",
      prop: "purchaseUserName",
      width: 100
    },
    {
      label: "订单金额",
      prop: "totalAmount",
      width: 120,
      slot: "total_amount"
    },
    {
      label: "优惠金额",
      prop: "discountAmount",
      width: 120
    },
    {
      label: "实付金额",
      prop: "paidAmount",
      width: 120
    },
    {
      label: "订单状态",
      prop: "status",
      width: 100,
      slot: "status" 
    },
    {
      label: "备注",
      prop: "notes",
      minWidth: 150
    },
    {
      label: "创建时间",
      prop: "createTime",
      width: 160,
      slot: "create_time"
    },
    {
      label: "操作",
      fixed: "right",
      width: 160,
      slot: "operation"
    }
  ];

  // 获取采购订单列表
  async function getList() {
    pageLoading.value = true;
    try {
      // 创建一个新对象，包含分页参数
      const params: PurchaseOrderQuery = { ...searchFormParams };
      params.pageNum = pagination.currentPage;
      params.pageSize = pagination.pageSize;

      // 处理日期范围
      if (params.dateRange && params.dateRange.length === 2) {
        // 这里需要根据后端API的需求来格式化日期
        // params.startDate = formatDate(params.dateRange[0]);
        // params.endDate = formatDate(params.dateRange[1]);
      }
      delete params.dateRange;

      console.log("查询参数:", params);

      // 这里应该调用真实的API
      // const response = await getPurchaseOrderListApi(params);
      
      // 模拟API响应数据
      const mockResponse = mockPurchaseOrderList(params);

      if (mockResponse.code === 0) {
        dataList.value = mockResponse.data.records || [];
        pagination.total = mockResponse.data.total || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (error) {
      console.error("获取采购订单列表失败", error);
      dataList.value = [];
      pagination.total = 0;
    } finally {
      pageLoading.value = false;
    }
  }

  // 模拟数据函数
  function mockPurchaseOrderList(params) {
    const total = 43;
    const records = Array.from({ length: params.pageSize }, (_, index) => {
      const id = (pagination.currentPage - 1) * pagination.pageSize + index + 1;
      return {
        id,
        orderNumber: `PO2023${String(10000 + id).substring(1)}`,
        supplierName: `供应商${['A', 'B', 'C'][id % 3]}`,
        purchaseUserName: `采购员${['张三', '李四', '王五'][id % 3]}`,
        totalAmount: Math.round(Math.random() * 10000) / 100,
        discountAmount: Math.round(Math.random() * 500) / 100,
        paidAmount: Math.round(Math.random() * 9000) / 100,
        status: id % 4, // 0=未审核, 1=已审核, 2=部分入库, 3=已完成
        notes: `订单备注信息${id}`,
        createTime: new Date(Date.now() - id * 86400000).toISOString()
      };
    });

    return {
      code: 0,
      data: {
        records,
        total: Math.min(total, records.length + (pagination.currentPage - 1) * pagination.pageSize)
      }
    };
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

  /** 删除订单 */
  const handleDelete = async row => {
    try {
      // 这里应该调用删除API
      // await deletePurchaseOrderApi(row.id);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      message("删除失败", { type: "error" });
    }
  };

  // 获取状态样式
  window.getStatusType = (status) => {
    const statusMap = {
      0: "info",    // 未审核
      1: "success", // 已审核
      2: "warning", // 部分入库
      3: "primary"  // 已完成
    };
    return statusMap[status] || "info";
  };

  // 获取状态文本
  window.getStatusText = (status) => {
    const statusMap = {
      0: "未审核",
      1: "已审核",
      2: "部分入库",
      3: "已完成"
    };
    return statusMap[status] || "未知";
  };

  // 初始化
  getList();

  return {
    formRef,
    columns,
    dataList,
    pagination,
    searchFormParams,
    pageLoading,
    tableRef,
    getList,
    onSearch,
    resetForm,
    handleDelete
  };
} 