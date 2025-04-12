import { reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import { message } from "@/utils/message";
import {
  getInviteCodeListApi,
  deleteInviteCodeApi,
  disableInviteCodeApi
} from "@/api/system/inviteCode";
import { usePublicHooks } from "@/views/system/hooks";
import type { FormInstance } from "element-plus";
import { ElMessageBox } from "element-plus";

export function useHook() {
  const { tagStyle } = usePublicHooks();
  const searchFormRef = ref<FormInstance>();
  const dataList = ref([]);
  const pageLoading = ref(false);

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const searchFormParams = reactive({
    code: "",
    status: "",
    createdBy: "",
    usedBy: "",
    timeRange: [],
    startTime: "",
    endTime: ""
  });

  async function getList() {
    pageLoading.value = true;
    try {
      // 处理时间范围
      if (
        searchFormParams.timeRange &&
        searchFormParams.timeRange.length === 2
      ) {
        searchFormParams.startTime = searchFormParams.timeRange[0];
        searchFormParams.endTime = searchFormParams.timeRange[1];
      } else {
        searchFormParams.startTime = "";
        searchFormParams.endTime = "";
      }

      const { data } = await getInviteCodeListApi({
        ...searchFormParams,
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      });

      // 适配后端返回的数据结构
      dataList.value = data.data.map(item => ({
        id: item.id,
        code: item.code,
        status:
          item.status === 0 ? "unused" : item.status === 1 ? "used" : "expired",
        createdBy: item.creator_name,
        createdTime: item.created_at,
        usedBy: item.user_name,
        usedTime: item.used_at,
        expireTime: item.expired_at,
        remark: item.remark
      }));

      pagination.total = data.total;
    } catch (error) {
      console.error(error);
    } finally {
      pageLoading.value = false;
    }
  }

  function onSearch() {
    pagination.currentPage = 1;
    getList();
  }

  function resetForm() {
    searchFormRef.value?.resetFields();
    onSearch();
  }

  function handleDelete(id: number | string) {
    ElMessageBox.confirm("确定要删除该邀请码吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        await deleteInviteCodeApi(id);
        message("删除成功", { type: "success" });
        getList();
      })
      .catch(() => {});
  }

  function handleDisable(id: number | string) {
    ElMessageBox.confirm("确定要禁用该邀请码吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        await disableInviteCodeApi(id);
        message("禁用成功", { type: "success" });
        getList();
      })
      .catch(() => {});
  }

  return {
    searchFormRef,
    dataList,
    pagination,
    searchFormParams,
    pageLoading,
    getList,
    onSearch,
    resetForm,
    handleDelete,
    handleDisable
  };
}
