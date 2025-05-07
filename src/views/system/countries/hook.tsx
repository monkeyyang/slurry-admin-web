import { reactive, ref, onMounted, type Ref } from "vue";
import { type FormInstance, ElMessage, ElMessageBox } from "element-plus";
import {
  getCountriesListApi,
  enableCountryApi,
  disableCountryApi
} from "@/api/system/countries";
import { addCountryApi, updateCountryApi } from "@/api/system/countries";

// 定义表格列
const columns = [
  {
    label: "ID",
    prop: "id",
    minWidth: 60
  },
  {
    label: "中文名称",
    prop: "name_zh",
    minWidth: 120
  },
  {
    label: "英文名称",
    prop: "name_en",
    minWidth: 120
  },
  {
    label: "国家代码",
    prop: "code",
    minWidth: 100
  },
  {
    label: "两位代码",
    prop: "code2",
    minWidth: 80
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 80,
    slot: "status"
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation"
  }
];

export function useHook(
  dialogVisible: Ref<boolean>,
  dialogTitle: Ref<string>,
  submitLoading: Ref<boolean>,
  countryFormRef: Ref<FormInstance | undefined>
) {
  // 搜索表单参数
  const searchFormParams = reactive({
    keyword: "",
    status: ""
  });

  // 搜索表单规则
  const searchFormRules = reactive({});

  // 国家表单
  const countryForm = reactive({
    id: "",
    name_zh: "",
    name_en: "",
    code: "",
    code2: "",
    status: "1"
  });

  // 国家表单规则
  const countryFormRules = {
    name_zh: [{ required: true, message: "请输入中文名称", trigger: "blur" }],
    name_en: [{ required: true, message: "请输入英文名称", trigger: "blur" }],
    code: [
      { required: true, message: "请输入国家代码", trigger: "blur" },
      { min: 2, max: 3, message: "国家代码长度为2-3个字符", trigger: "blur" }
    ],
    code2: [
      { required: true, message: "请输入两位代码", trigger: "blur" },
      { min: 2, max: 2, message: "两位代码长度必须为2个字符", trigger: "blur" }
    ],
    status: [{ required: true, message: "请选择状态", trigger: "change" }]
  };

  // 表格数据
  const tableData = ref([]);
  const tableLoading = ref(false);
  const searchFormLoading = ref(false);
  const isEdit = ref(false);

  // 分页
  const pagination = reactive({
    pageSize: 10,
    currentPage: 1,
    total: 0
  });

  // 获取国家列表
  const getCountriesList = async () => {
    tableLoading.value = true;
    try {
      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        keyword: searchFormParams.keyword,
        status: searchFormParams.status
      };

      const res = await getCountriesListApi(params);
      if (res.code === 0 && res.data) {
        // 处理返回的数据，确保类型正确
        const responseData = res.data;
        if (Array.isArray(responseData.data)) {
          // 处理数据，确保status字段是字符串类型
          tableData.value = responseData.data.map(item => ({
            ...item,
            status: item.status?.toString() // 确保status是字符串
          }));
          pagination.total = responseData.total || 0;
        } else {
          tableData.value = [];
          pagination.total = 0;
        }
      } else {
        ElMessage.error(res.message || "获取国家列表失败");
      }
    } catch (error) {
      console.error("获取国家列表失败:", error);
      ElMessage.error("获取国家列表失败");
    } finally {
      tableLoading.value = false;
      searchFormLoading.value = false;
    }
  };

  // 搜索
  const onSearch = () => {
    searchFormLoading.value = true;
    pagination.currentPage = 1;
    getCountriesList();
  };

  // 重置
  const onReset = (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  // 添加国家
  const onAdd = () => {
    isEdit.value = false;
    dialogTitle.value = "新增国家";
    resetCountryForm();
    dialogVisible.value = true;
  };

  // 编辑国家
  const onEdit = row => {
    isEdit.value = true;
    dialogTitle.value = "编辑国家";
    Object.keys(countryForm).forEach(key => {
      countryForm[key] = row[key];
    });
    dialogVisible.value = true;
  };

  // 重置国家表单
  const resetCountryForm = () => {
    countryForm.id = "";
    countryForm.name_zh = "";
    countryForm.name_en = "";
    countryForm.code = "";
    countryForm.code2 = "";
    countryForm.status = "1";
  };

  // 提交表单
  const submitForm = async () => {
    if (!countryFormRef.value) return;

    await countryFormRef.value.validate(async valid => {
      if (valid) {
        submitLoading.value = true;
        try {
          if (isEdit.value) {
            const res = await updateCountryApi(countryForm.id, countryForm);
            if (res.code === 0) {
              ElMessage.success("更新成功");
              dialogVisible.value = false;
              getCountriesList();
            } else {
              ElMessage.error(res.message || "更新失败");
            }
          } else {
            const res = await addCountryApi(countryForm);
            if (res.code === 0) {
              ElMessage.success("添加成功");
              dialogVisible.value = false;
              getCountriesList();
            } else {
              ElMessage.error(res.message || "添加失败");
            }
          }
        } catch (error) {
          console.error(
            isEdit.value ? "更新国家失败:" : "添加国家失败:",
            error
          );
          ElMessage.error(isEdit.value ? "更新失败" : "添加失败");
        } finally {
          submitLoading.value = false;
        }
      }
    });
  };

  // 启用国家
  const onEnable = async row => {
    try {
      await ElMessageBox.confirm(`确定要启用 ${row.name_zh} 吗?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      const res = await enableCountryApi(row.id);
      if (res.code === 0) {
        ElMessage.success("启用成功");
        getCountriesList();
      } else {
        ElMessage.error(res.message || "启用失败");
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("启用国家失败:", error);
        ElMessage.error("启用失败");
      }
    }
  };

  // 禁用国家
  const onDisable = async row => {
    try {
      await ElMessageBox.confirm(`确定要禁用 ${row.name_zh} 吗?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      const res = await disableCountryApi(row.id);
      if (res.code === 0) {
        ElMessage.success("禁用成功");
        getCountriesList();
      } else {
        ElMessage.error(res.message || "禁用失败");
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("禁用国家失败:", error);
        ElMessage.error("禁用失败");
      }
    }
  };

  // 页码改变
  const onPageChange = (page: number) => {
    pagination.currentPage = page;
    getCountriesList();
  };

  // 每页条数改变
  const onPageSizeChange = (size: number) => {
    pagination.pageSize = size;
    pagination.currentPage = 1;
    getCountriesList();
  };

  // 初始化
  onMounted(() => {
    getCountriesList();
  });

  return {
    searchFormParams,
    searchFormRules,
    searchFormLoading,
    tableLoading,
    tableData,
    pagination,
    countryForm,
    countryFormRules,
    columns,
    isEdit,
    onSearch,
    onReset,
    onAdd,
    onEdit,
    onEnable,
    onDisable,
    onPageChange,
    onPageSizeChange,
    submitForm
  };
}
