import { reactive, ref, h, defineComponent } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import {
  addWarehouseApi,
  getWarehouseListApi,
  deleteWarehouseApi,
  updateWarehouseApi,
  updateWarehouseStatusApi,
  type WarehouseQuery,
  type WarehouseDTO
} from "@/api/warehouse/index";
import { getGoodsListApi } from "@/api/warehouse/goods";
import { usePublicHooks } from "@/views/system/hooks";
import type { FormInstance } from "element-plus";
import { ElMessageBox } from "element-plus";
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";

// 定义一个展开/收起组件
const ExpandableGoodsList = defineComponent({
  props: {
    goods: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const expanded = ref(false);

    const toggleExpand = () => {
      expanded.value = !expanded.value;
    };

    return () => {
      if (!props.goods || props.goods.length === 0) {
        return h("span", { class: "text-gray-400" }, "暂无关联货品");
      }

      // 默认显示的货品数量
      const defaultDisplayCount = 2;
      // 是否需要展开/收起按钮
      const needsExpand = props.goods.length > defaultDisplayCount;
      // 要显示的货品
      const displayGoods = expanded.value
        ? props.goods
        : props.goods.slice(0, defaultDisplayCount);

      return h(
        "div",
        {
          class: "goods-tags-container",
          style: {
            backgroundColor: "#f5f7fa",
            borderRadius: "4px",
            padding: "10px",
            maxHeight: expanded.value ? "200px" : "120px",
            overflow: "auto"
          }
        },
        [
          // 显示总数提示
          h(
            "div",
            {
              class: "goods-count",
              style: {
                marginBottom: "8px",
                fontSize: "13px",
                color: "#606266",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }
            },
            [
              h("span", null, `共关联 ${props.goods.length} 个货品`),
              needsExpand
                ? h(
                    "div",
                    {
                      style: {
                        color: "#409EFF",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        userSelect: "none",
                        whiteSpace: "nowrap"
                      },
                      onClick: toggleExpand
                    },
                    [
                      // 使用 Element Plus 图标
                      h(expanded.value ? ArrowUp : ArrowDown, {
                        style: {
                          marginRight: "4px",
                          fontSize: "12px"
                        }
                      }),
                      expanded.value ? "收起" : "展开全部"
                    ]
                  )
                : null
            ]
          ),
          // 显示货品标签容器
          h(
            "div",
            {
              class: "goods-tags-wrapper",
              style: {
                display: "flex",
                flexWrap: "wrap",
                gap: "5px"
              }
            },
            displayGoods.map(item => {
              return h(
                "el-tag",
                {
                  type: "success",
                  effect: "light",
                  class: "goods-tag",
                  size: "small"
                },
                item.goods_name || item.name
              );
            })
          )
        ]
      );
    };
  }
});

// 定义API响应类型
interface WarehouseApiResponse {
  code: number;
  data: {
    data: any[];
    total: number;
    current_page: number;
    per_page: number;
  };
  message: string;
}

export function useHook() {
  const formRef = ref<FormInstance>();
  const pageLoading = ref(false);
  const goodsLoading = ref(false);
  const { switchStyle } = usePublicHooks();

  const formData = reactive<Partial<WarehouseDTO> & { goods_ids: number[] }>({
    id: undefined,
    name: "",
    status: "1",
    remark: "",
    goods_ids: []
  });

  const dataList = ref<WarehouseDTO[]>([]);
  const goodsList = ref([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const searchFormParams = reactive<WarehouseQuery>({
    name: "",
    status: "",
    page: 1,
    pageSize: 10
  });

  // 国家/地区代码颜色映射
  const regionColors = {
    US: { color: "#409EFF", bg: "#ecf5ff" }, // 美国 - 蓝色
    CA: { color: "#67C23A", bg: "#f0f9eb" }, // 加拿大 - 绿色
    UK: { color: "#E6A23C", bg: "#fdf6ec" }, // 英国 - 橙色
    FR: { color: "#F56C6C", bg: "#fef0f0" }, // 法国 - 红色
    DE: { color: "#909399", bg: "#f4f4f5" }, // 德国 - 灰色
    JP: { color: "#9C27B0", bg: "#f9ecff" }, // 日本 - 紫色
    CN: { color: "#FF5722", bg: "#fff5f0" }, // 中国 - 橙红色
    AU: { color: "#00BCD4", bg: "#e8f7fa" } // 澳大利亚 - 青色
  };

  const columns: TableColumnList = [
    {
      label: "仓库名称",
      prop: "name",
      minWidth: 130
    },
    {
      label: "可入库货品",
      prop: "goods",
      minWidth: 300,
      cellRenderer: ({ row }) => h(ExpandableGoodsList, { goods: row.goods })
    },
    {
      label: "状态",
      prop: "status",
      width: 80,
      cellRenderer: ({ row }) => (
        <el-switch
          model-value={row.status === 1 || row.status === "1"}
          active-value={true}
          inactive-value={false}
          loading={row.statusLoading}
          style={switchStyle.value}
          onChange={() => handleStatusChange(row)}
        />
      )
    },
    {
      label: "入库总量",
      prop: "total_inbound_count",
      width: 100,
      cellRenderer: ({ row }) => <div>{row.total_inbound_count || 0}</div>
    },
    {
      label: "已结算数量",
      prop: "settled_count",
      width: 100,
      cellRenderer: ({ row }) => <div>{row.settled_count || 0}</div>
    },
    {
      label: "未结算数量",
      prop: "unsettled_count",
      width: 100,
      cellRenderer: ({ row }) => <div>{row.unsettled_count || 0}</div>
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 150
    },
    {
      label: "创建时间",
      prop: "create_time",
      minWidth: 180
    },

    {
      label: "操作",
      fixed: "right",
      width: 180,
      slot: "operation"
    }
  ];

  const getList = async () => {
    console.log("开始获取仓库列表");
    pageLoading.value = true;
    try {
      const response = (await getWarehouseListApi({
        ...searchFormParams,
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      })) as WarehouseApiResponse;

      console.log("API 原始返回:", response);

      if (response && response.code === 0 && response.data) {
        console.log("API 返回 data:", response.data);

        dataList.value = response.data.data || [];
        pagination.total = response.data.total || 0;
        pagination.currentPage = response.data.current_page || 1;
        pagination.pageSize = response.data.per_page || 10;

        console.log("处理后的数据列表:", dataList.value);
        console.log("处理后的分页信息:", pagination);

        // 打印数据，检查是否包含入库总量和已结算数量字段
        if (dataList.value.length > 0) {
          console.log("仓库数据示例:", dataList.value[0]);
        }
      } else {
        console.warn("仓库列表API返回数据格式不符合预期:", response);
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (error) {
      console.error("获取仓库列表失败:", error);
      dataList.value = [];
      pagination.total = 0;
    } finally {
      pageLoading.value = false;
    }
  };

  const getGoodsList = async () => {
    goodsLoading.value = true;
    try {
      const response = await getGoodsListApi({
        pageSize: 100
      }).finally(() => {
        goodsLoading.value = false;
      });

      console.log("货品列表API原始响应:", response);

      if (response && response.data) {
        console.log("货品列表API返回data:", response.data);

        goodsList.value = response.data.data || [];
        console.log("处理后的货品列表:", goodsList.value);
      } else {
        console.error("货品列表API返回格式不正确");
        goodsList.value = [];
      }
    } catch (error) {
      console.error("获取货品列表失败:", error);
      goodsList.value = [];
    }
  };

  const onSearch = () => {
    pagination.currentPage = 1;
    getList();
  };

  const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  const handleStatusChange = async row => {
    row.statusLoading = true;
    try {
      const newStatus = row.status === 1 || row.status === "1" ? "0" : "1";
      await updateWarehouseStatusApi({ id: row.id, status: newStatus });
      message("修改成功", { type: "success" });
      row.status = newStatus;
    } catch (error) {
      message("修改失败", { type: "error" });
    } finally {
      row.statusLoading = false;
    }
  };

  const handleDelete = async row => {
    try {
      await ElMessageBox.confirm(
        `确定要删除仓库 "${row.name}" 吗？`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      await deleteWarehouseApi(row.id);
      message("删除成功", { type: "success" });
      getList();
    } catch (error) {
      if (error !== "cancel") {
        message("删除失败", { type: "error" });
      }
    }
  };

  // 添加仓库
  const handleAdd = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(async valid => {
      if (valid) {
        try {
          await addWarehouseApi(formData);
          message("添加成功", { type: "success" });
          getList();
          return true;
        } catch (error) {
          message("添加失败", { type: "error" });
          return false;
        }
      } else {
        return false;
      }
    });
  };

  // 更新仓库
  const handleUpdate = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(async valid => {
      if (valid) {
        try {
          await updateWarehouseApi(formData.id, formData);
          message("更新成功", { type: "success" });
          getList();
          return true;
        } catch (error) {
          message("更新失败", { type: "error" });
          return false;
        }
      } else {
        return false;
      }
    });
  };

  // 重置表单
  const resetFormData = () => {
    formData.id = undefined;
    formData.name = "";
    formData.status = "1";
    formData.remark = "";
    formData.goods_ids = [];
  };

  // 编辑仓库
  const handleEdit = row => {
    formData.id = row.id;
    formData.name = row.name;
    formData.status = row.status.toString();
    formData.remark = row.remark || "";
    formData.goods_ids = row.goods ? row.goods.map(item => item.goods_id) : [];
  };

  getList();
  getGoodsList();

  return {
    formRef,
    formData,
    columns,
    dataList,
    goodsList,
    goodsLoading,
    pagination,
    searchFormParams,
    pageLoading,
    getList,
    getGoodsList,
    onSearch,
    resetForm,
    handleDelete,
    handleStatusChange,
    handleAdd,
    handleUpdate,
    resetFormData,
    handleEdit
  };
}
