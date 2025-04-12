import { reactive, ref } from "vue";
import { h } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import {
  addGoodsApi,
  getGoodsListApi,
  deleteGoodsApi,
  updateGoodsApi,
  deleteGoodsAliasApi,
  getGoodsDetailApi
} from "@/api/warehouse/goods";
import { usePublicHooks } from "@/views/system/hooks";
import type { FormInstance } from "element-plus";
import { ElMessageBox } from "element-plus";

export function useHook() {
  const formRef = ref<FormInstance>();
  const pageLoading = ref(false);
  const detailLoading = ref(false);
  const { switchStyle } = usePublicHooks();
  const editDialogVisible = ref(false);
  const currentId = ref<string | number | null>(null);

  const formData = reactive({
    id: undefined,
    name: "",
    aliases: []
  });

  const dataList = ref([]);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const searchFormParams = reactive({
    name: ""
  });

  const columns: TableColumnList = [
    {
      label: "货品名称",
      prop: "name",
      minWidth: 130
    },
    {
      label: "别名列表",
      prop: "aliases",
      minWidth: 300,
      cellRenderer: ({ row }) => {
        if (!row.aliases || row.aliases.length === 0) {
          return h("span", { class: "text-gray-400" }, "暂无别名");
        }

        // 国家代码对应的颜色映射
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

        return h(
          "div",
          { class: "alias-tags-container" },
          row.aliases.map(alias => {
            // 获取该地区的颜色配置，如果没有则使用默认颜色
            const colorConfig = regionColors[alias.region] || {
              color: "#909399",
              bg: "#f4f4f5"
            };

            return h("div", { class: "alias-tag-item" }, [
              h(
                "el-tag",
                {
                  style: {
                    backgroundColor: colorConfig.bg,
                    color: colorConfig.color,
                    borderColor: colorConfig.bg,
                    fontWeight: "bold"
                  },
                  class: "region-tag",
                  size: "small"
                },
                alias.region
              ),
              h("span", { class: "alias-name" }, alias.name)
            ]);
          })
        );
      }
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

  /** 获取货品列表 */
  const getList = async () => {
    console.log("开始获取货品列表");
    pageLoading.value = true;
    try {
      const response = await getGoodsListApi({
        ...searchFormParams,
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      }).finally(() => {
        pageLoading.value = false;
      });

      console.log("API 原始返回:", response);

      // 检查响应结构
      if (response && response.data) {
        console.log("API 返回 data:", response.data);

        // 直接使用返回的数据，不再嵌套处理
        dataList.value = response.data.data || [];
        pagination.total = response.data.total || 0;
        pagination.currentPage = response.data.current_page || 1;
        pagination.pageSize = response.data.per_page || 10;

        console.log("处理后的数据列表:", dataList.value);
        console.log("处理后的分页信息:", pagination);
      } else {
        console.error("API 返回格式不正确");
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (error) {
      console.error("获取货品列表失败:", error);
      dataList.value = [];
      pagination.total = 0;
    }
  };

  /** 获取货品详情 */
  const getDetail = async (id: string | number) => {
    detailLoading.value = true;
    try {
      const response = await getGoodsDetailApi(id);
      // 处理API返回的数据结构
      return response.data.data || null;
    } catch (error) {
      console.error("获取货品详情失败:", error);
      return null;
    } finally {
      detailLoading.value = false;
    }
  };

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

  /** 打开编辑对话框 */
  const openEditDialog = async (row?: any) => {
    if (row && row.id) {
      currentId.value = row.id;
      // 获取详情
      const detail = await getDetail(row.id);
      if (detail) {
        formData.id = detail.id;
        formData.name = detail.name;
        formData.aliases = detail.aliases || [];
      }
    } else {
      currentId.value = null;
      formData.id = undefined;
      formData.name = "";
      formData.aliases = [];
    }
    editDialogVisible.value = true;
  };

  /** 关闭编辑对话框 */
  const closeEditDialog = () => {
    editDialogVisible.value = false;
    formData.id = undefined;
    formData.name = "";
    formData.aliases = [];
    currentId.value = null;
  };

  /** 提交表单 */
  const submitForm = async (formDataToSubmit = formData) => {
    if (!formRef.value) return;

    await formRef.value.validate(async valid => {
      if (valid) {
        try {
          // 确保别名数据完整
          const validAliases = formDataToSubmit.aliases.filter(
            alias => alias.region && alias.name
          );

          // 创建要提交的数据对象
          const dataToSubmit = {
            ...formDataToSubmit,
            aliases: validAliases
          };

          if (currentId.value) {
            // 更新
            await updateGoodsApi(currentId.value, dataToSubmit);
            message("更新成功", { type: "success" });
          } else {
            // 新增
            await addGoodsApi(dataToSubmit);
            message("新增成功", { type: "success" });
          }
          closeEditDialog();
          getList();
        } catch (error) {
          console.error("提交表单失败:", error);
          if (error.response && error.response.data) {
            const errorData = error.response.data;
            if (errorData.message) {
              message(errorData.message, { type: "error" });
            } else {
              message("操作失败", { type: "error" });
            }
          } else {
            message("操作失败", { type: "error" });
          }
        }
      }
    });
  };

  /** 删除货品 */
  const handleDelete = async row => {
    ElMessageBox.confirm("确定要删除该货品吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteGoodsApi(row.id);
          message("删除成功", { type: "success" });
          getList();
        } catch (error) {
          console.error("删除货品失败:", error);
          message("删除失败", { type: "error" });
        }
      })
      .catch(() => {});
  };

  /** 删除货品别名 */
  const handleDeleteAlias = async aliasId => {
    ElMessageBox.confirm("确定要删除该别名吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          await deleteGoodsAliasApi(aliasId);
          message("删除成功", { type: "success" });
          // 如果当前正在编辑，需要刷新详情
          if (currentId.value && editDialogVisible.value) {
            const detail = await getDetail(currentId.value);
            if (detail) {
              formData.aliases = detail.aliases || [];
            }
          }
          getList();
        } catch (error) {
          console.error("删除别名失败:", error);
          message("删除失败", { type: "error" });
        }
      })
      .catch(() => {});
  };

  /** 添加别名 */
  const addAlias = () => {
    formData.aliases.push({
      id: Date.now(), // 临时ID
      region: "",
      name: ""
    });
  };

  /** 移除别名 */
  const removeAlias = index => {
    formData.aliases.splice(index, 1);
  };

  // 初始加载
  getList();

  return {
    formRef,
    formData,
    columns,
    dataList,
    pagination,
    searchFormParams,
    pageLoading,
    editDialogVisible,
    getList,
    onSearch,
    resetForm,
    openEditDialog,
    closeEditDialog,
    submitForm,
    handleDelete,
    handleDeleteAlias,
    addAlias,
    removeAlias
  };
}
