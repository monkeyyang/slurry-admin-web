import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { getWarehouseListApi } from "@/api/warehouse";
import { ElMessageBox } from "element-plus";
import {
  addForecastApi,
  importForecastApi,
  getForecastListApi
} from "@/api/warehouse/forecast";

// 定义表格列类型
interface TableColumn {
  label?: string;
  prop?: string;
  minWidth?: number;
  width?: number;
  fixed?: "right" | "left";
  slot?: string;
  showOverflowTooltip?: boolean;
  type?: string;
  align?: string;
}

type TableColumnList = TableColumn[];

export function useHook() {
  const tableRef = ref();
  const pageLoading = ref(false);
  const warehouseOptions = ref([]);

  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "center",
      fixed: "left",
      label: ""
    },
    {
      label: "预报编号",
      prop: "preorderNo",
      minWidth: 120
    },
    {
      label: "客户",
      prop: "customerName",
      minWidth: 100
    },
    {
      label: "仓库名称",
      prop: "warehouseName",
      minWidth: 100
    },
    {
      label: "货物名称",
      prop: "productName",
      minWidth: 120,
      showOverflowTooltip: true
    },
    {
      label: "货物链接",
      prop: "goodsUrl",
      minWidth: 120,
      showOverflowTooltip: true
    },
    {
      label: "订单编号",
      prop: "orderNumber",
      minWidth: 120
    },
    {
      label: "快递单号",
      prop: "trackingNo",
      minWidth: 120
    },
    {
      label: "IMEI/UPC",
      prop: "productCode",
      minWidth: 120
    },
    {
      label: "数量",
      prop: "quantity",
      minWidth: 80
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90,
      slot: "status"
    },
    {
      label: "预报时间",
      prop: "createTime",
      minWidth: 160
    },
    {
      label: "收货时间",
      prop: "receiveTime",
      minWidth: 160
    },
    {
      label: "操作",
      fixed: "right",
      width: 180,
      slot: "operation"
    }
  ];

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const searchFormParams = reactive({
    preorderNo: "",
    trackingNo: "",
    status: "",
    pageNum: 1,
    pageSize: 10
  });

  const dataList = ref([]);

  interface WarehouseResponse {
    code: number;
    data: {
      data: Array<{
        id: number;
        name: string;
      }>;
    };
    message: string;
  }
  // 获取仓库列表
  const getWarehouseOptions = async () => {
    try {
      // 使用类型断言指定响应类型
      const response = (await getWarehouseListApi({
        page: 1,
        pageSize: 100,
        status: "1"
      })) as WarehouseResponse;

      console.log("获取仓库列表响应:", response);

      if (
        response &&
        response.code === 0 &&
        response.data &&
        response.data.data
      ) {
        warehouseOptions.value = response.data.data.map(item => ({
          label: item.name,
          value: item.id
        }));
      } else {
        console.warn("仓库API返回数据格式不符合预期", response);
        warehouseOptions.value = []; // 确保设置为空数组
      }
    } catch (error) {
      console.error("获取仓库列表失败", error);
      warehouseOptions.value = []; // 确保设置为空数组
    }
  };

  // 获取预报列表
  const getList = async () => {
    try {
      pageLoading.value = true;
      const res = await getForecastListApi(searchFormParams);
      if (res.code === 0 && res.data) {
        // 更新数据列表
        dataList.value = res.data.data.map(item => ({
          id: item.id,
          preorderNo: item.preorder_no,
          customerName: item.customer_name,
          warehouseName: item.warehouse_name,
          productName: item.product_name,
          goodsUrl: item.goods_url,
          orderNumber: item.order_number,
          trackingNo: item.tracking_no,
          productCode: item.product_code,
          quantity: item.quantity,
          status: item.status.toString(),
          createTime: item.create_time,
          receiveTime: item.receive_time
        }));
        // 更新分页信息
        pagination.total = res.data.total;
        pagination.currentPage = res.data.current_page;
      }
    } catch (error) {
      console.error("获取预报列表失败", error);
    } finally {
      pageLoading.value = false;
    }
  };

  // 扫码入库
  const scanInbound = async (data: {
    id: number;
    trackingNo: string;
    productCode: string;
  }) => {
    try {
      // TODO: 调用扫码入库API
      // await scanInboundApi(data);
      message("入库成功", { type: "success" });
      getList();
      return true;
    } catch (error) {
      message("入库失败", { type: "error" });
      return false;
    }
  };

  // 修改预报
  const updateForecast = async (data: any) => {
    try {
      // TODO: 调用修改API
      // await updateForecastApi(data);
      message("修改成功", { type: "success" });
      getList();
      return true;
    } catch (error) {
      message("修改失败", { type: "error" });
      return false;
    }
  };

  // 删除预报
  const handleDelete = async (row: any) => {
    await ElMessageBox.confirm(
      `确认要删除预报编号为 ${row.preorderNo} 的数据吗?`,
      "警告",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    try {
      // TODO: 调用删除API
      // await deleteForecastApi(row.id);
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      message("删除失败", { type: "error" });
    }
  };

  const onSearch = () => {
    pagination.currentPage = 1;
    getList();
  };

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  // 添加预报
  const addForecast = async (params: {
    urls: string[];
    warehouseId: string | number;
  }) => {
    console.log("开始添加预报，参数:", params);
    const res = await addForecastApi(params);
    console.log("添加预报响应:", res);

    if (res.code === 0) {
      message("添加成功", { type: "success" });
      getList();
      return true;
    } else {
      // 构建HTML表格展示失败信息
      let htmlContent = `<div style="text-align: left;">
        <div style="color: #F56C6C; margin-bottom: 10px;">所有预报添加失败：</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr style="background-color: #F5F7FA;">
            <th style="padding: 8px; border: 1px solid #EBEEF5; text-align: left;">URL</th>
            <th style="padding: 8px; border: 1px solid #EBEEF5; text-align: left;">失败原因</th>
          </tr>`;

      res.data.failed.forEach(item => {
        htmlContent += `
          <tr>
            <td style="padding: 8px; border: 1px solid #EBEEF5;">${item.url}</td>
            <td style="padding: 8px; border: 1px solid #EBEEF5;">${item.reason}</td>
          </tr>`;
      });

      htmlContent += `</table></div>`;

      ElMessageBox.alert(htmlContent, "添加失败", {
        dangerouslyUseHTMLString: true,
        confirmButtonText: "确定",
        type: "error",
        customClass: "custom-message-box"
      });
      return false;
    }
  };

  // 导入预报
  const importForecast = async (file: File, warehouseId: string | number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("warehouseId", warehouseId.toString());

    const res = await importForecastApi(formData);
    if (res.code === 0) {
      message("导入成功", { type: "success" });
      return true;
    } else {
      message("导入失败", { type: "error" });
      return false;
    }
  };

  // 批量删除
  const handleBatchDelete = async (rows: any[]) => {
    if (!rows.length) {
      message("请选择要删除的数据", { type: "warning" });
      return;
    }

    await ElMessageBox.confirm(
      `确认要删除选中的 ${rows.length} 条数据吗?`,
      "警告",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    try {
      // TODO: 调用批量删除API
      // const ids = rows.map(row => row.id);
      // await batchDeleteForecastApi(ids);
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      message("删除失败", { type: "error" });
    }
  };

  return {
    tableRef,
    pageLoading,
    columns,
    dataList,
    pagination,
    searchFormParams,
    warehouseOptions,
    onSearch,
    resetForm,
    getList,
    getWarehouseOptions,
    handleDelete,
    addForecast,
    importForecast,
    scanInbound,
    updateForecast,
    handleBatchDelete
  };
}
