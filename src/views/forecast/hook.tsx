import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import { getWarehouseListApi } from "@/api/warehouse";
import { ElMessageBox } from "element-plus";
import {
  addForecastApi,
  importForecastApi,
  getForecastListApi,
  deleteForecastApi,
  batchDeleteForecastApi,
  updateForecastApi,
  batchAddToCrawlerQueueApi
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

// 定义爬取队列API响应类型
interface CrawlerQueueResponse {
  code: number;
  message: string;
  data: {
    total: number;
    added: number;
    skipped: number;
    error: number;
    errors: any[];
  };
}

// Define the response type
interface ApiResponse {
  code: number;
  data?: any;
  message?: string;
}

interface WarehouseOption {
  value: string | number;
  label: string;
}

export function useHook() {
  const tableRef = ref();
  const pageLoading = ref(false);
  const warehouseOptions = ref<WarehouseOption[]>([]);
  const warehouseLoading = ref(false);

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
      label: "数量",
      prop: "quantity",
      minWidth: 80
    },
    {
      label: "状态",
      prop: "status",
      fixed: "right",
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

  // interface WarehouseResponse {
  //   code: number;
  //   data: {
  //     data: Array<{
  //       id: number;
  //       name: string;
  //     }>;
  //   };
  //   message: string;
  // }

  // 获取仓库列表 - 同样为测试保留默认数据
  const getWarehouseOptions = async () => {
    // 设置加载状态
    warehouseLoading.value = true;
    console.log("开始请求仓库列表");

    try {
      const params = {
        page: 1,
        pageSize: 100,
        status: "1"
      };

      // 添加调试日志
      console.log("发送仓库请求:", params);

      const res = await getWarehouseListApi(params);
      const typedRes = res as any;

      // 打印完整响应进行调试
      console.log("仓库API完整响应:", typedRes);

      if (typedRes.code === 0) {
        let warehouseData = [];

        // 处理不同的数据结构可能性
        if (typedRes.data?.data && Array.isArray(typedRes.data.data)) {
          warehouseData = typedRes.data.data;
        } else if (typedRes.data?.list && Array.isArray(typedRes.data.list)) {
          warehouseData = typedRes.data.list;
        } else if (Array.isArray(typedRes.data)) {
          warehouseData = typedRes.data;
        }

        console.log("解析后的仓库数据:", warehouseData);

        // 强制设置为测试数据，确保有数据
        warehouseOptions.value =
          warehouseData.length > 0
            ? warehouseData.map(item => ({
                label: item.name,
                value: item.id
              }))
            : [];

        console.log("最终仓库选项:", warehouseOptions.value);
      } else {
        // API返回错误，清空选项
        console.warn("API返回错误，清空仓库选项");
        warehouseOptions.value = [];
      }
    } catch (error) {
      // 获取仓库列表失败，清空选项
      console.error("获取仓库列表失败:", error);
      warehouseOptions.value = [];
    } finally {
      warehouseLoading.value = false;
    }
  };

  // 添加一个请求锁，防止重复请求
  let requestLock = false;

  // 获取预报列表
  const getList = async () => {
    // 如果已经有请求在进行中，直接返回
    if (requestLock) {
      console.log("上一个请求尚未完成，跳过本次请求");
      return;
    }

    try {
      requestLock = true;
      pageLoading.value = true;

      // 记录请求开始时间用于调试
      const startTime = Date.now();
      console.log("开始获取预报列表");

      const res = await getForecastListApi(searchFormParams);

      // 记录请求完成时间
      const endTime = Date.now();
      console.log(`请求完成，耗时 ${endTime - startTime}ms`);

      // Cast once and reuse
      const response = res as ApiResponse;
      if (response.code === 0 && response.data) {
        const newData = response.data.data.map(item => ({
          id: item.id,
          preorderNo: item.preorder_no,
          customerName: item.customer_name,
          warehouseName: item.warehouse_name,
          warehouseId: item.warehouse_id,
          productName: item.product_name,
          goodsUrl: item.goods_url,
          orderNumber: item.order_number,
          trackingNo: item.tracking_no,
          productCode: item.product_code,
          quantity: item.quantity,
          status: item.status.toString(),
          createTime: item.create_time,
          receiveTime: item.receive_time,
          crawler_error: item.crawler_error // 确保保留失败原因字段
        }));

        // 检查是否有数据变化
        const dataChanged =
          JSON.stringify(newData) !== JSON.stringify(dataList.value);

        if (dataChanged) {
          dataList.value = newData;
          // 更新分页信息
          pagination.total = response.data.total;
          pagination.currentPage = response.data.current_page;
        }
      }
    } catch (error) {
      console.error("获取预报列表失败", error);
    } finally {
      pageLoading.value = false;
      requestLock = false;
    }
  };

  // 扫码入库
  const scanInbound = async (_data: {
    id: number;
    trackingNo: string;
    productCode: string;
  }) => {
    try {
      // TODO: 调用扫码入库API
      // await scanInboundApi(_data);
      message("入库成功", { type: "success" });
      getList();
      return true;
    } catch (error) {
      message("入库失败", { type: "error" });
      return false;
    }
  };

  // 修改预报
  const updateForecast = async (data: {
    id: string | number;
    product_name: string;
    warehouse_id: string | number;
  }) => {
    try {
      await updateForecastApi(data);
      message("修改成功", { type: "success" });
      getList();
      return true;
    } catch (error) {
      console.error("修改预报失败", error);
      message("修改失败", { type: "error" });
      return false;
    }
  };

  // 删除预报
  const handleDelete = async (row: any) => {
    // 检查状态，已入库状态不允许删除
    if (parseInt(row.status) >= 9) {
      message("已入库状态的预报不可删除", { type: "error" });
      return;
    }

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
      await deleteForecastApi(row.id);
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

    const response = res as ApiResponse;
    if (response.code === 0) {
      message(
        "添加成功，数据爬取中，请勿重复提交爬取，稍后点击列表头的刷新按钮查看爬取后的数据",
        { type: "success", duration: 5000 }
      );
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

      response.data.failed.forEach(item => {
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
    const response = res as ApiResponse;
    if (response.code === 0) {
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

    // 检查是否有已入库状态的预报
    const hasStoredItems = rows.some(row => parseInt(row.status) >= 9);
    if (hasStoredItems) {
      message("选中的数据中包含已入库状态的预报，不可删除", { type: "error" });
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

    const res = await batchDeleteForecastApi(rows.map(row => row.id));
    const response = res as ApiResponse;
    if (response.code === 0) {
      message("删除成功", { type: "success" });
      getList();
    } else {
      message(response.message || "删除失败", { type: "error" });
    }
  };

  // 批量添加到爬取队列 - 更新处理逻辑以适配标准响应格式
  const handleBatchAddToCrawlerQueue = async (rows: any[]) => {
    if (!rows.length) {
      message("请选择要爬取的数据", { type: "warning" });
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确认将选中的 ${rows.length} 条数据加入爬取队列吗?`,
        "提示",
        {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "info"
        }
      );

      const ids = rows.map(row => row.id);
      pageLoading.value = true;

      try {
        console.log("发送爬取请求，参数:", { forecast_ids: ids });

        // 使用类型断言处理响应 - 适配标准响应格式
        const response = (await batchAddToCrawlerQueueApi(
          ids
        )) as CrawlerQueueResponse;
        console.log("爬取请求原始响应:", response);

        // 使用code === 0判断成功
        if (response && response.code === 0) {
          let successMsg = "成功加入爬取队列";

          // 直接从响应中获取数据
          const { total, added, skipped, error } = response.data;
          successMsg += `，共${total}条，成功${added}条`;

          if (skipped > 0) {
            successMsg += `，跳过${skipped}条`;
          }

          if (error > 0) {
            successMsg += `，失败${error}条`;
          }

          successMsg += "。请稍后点击列表头部刷新按钮查看数据";
          message(successMsg, { type: "success" });
        } else {
          message(response?.message || "加入爬取队列失败", { type: "error" });
        }
      } catch (error) {
        console.error("加入爬取队列请求失败", error);

        // 提供具体错误信息
        let errorMsg = "加入爬取队列失败";
        if (error.response) {
          errorMsg += `：服务器返回 ${error.response.status} 错误`;
        } else if (error.request) {
          errorMsg += "：未收到服务器响应";
        } else if (error.message) {
          errorMsg += `：${error.message}`;
        }

        message(errorMsg, { type: "error" });
      } finally {
        pageLoading.value = false;
      }
    } catch (error) {
      // 处理用户取消确认的情况
      if (error !== "cancel") {
        console.error("爬取队列操作失败", error);
      }
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
    warehouseLoading,
    onSearch,
    resetForm,
    getList,
    getWarehouseOptions,
    handleDelete,
    addForecast,
    importForecast,
    scanInbound,
    updateForecast,
    handleBatchDelete,
    handleBatchAddToCrawlerQueue
  };
}
