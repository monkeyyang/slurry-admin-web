<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑预报' : '新增预报'"
    width="760px"
    :close-on-click-modal="false"
    :before-close="closeDialog"
  >
    <!-- 添加表单加载状态 -->
    <div v-if="formLoading" class="form-loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <el-form
      v-else
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      style="max-width: 460px"
    >
      <!-- 货物名称 -->
      <el-form-item label="货物名称" prop="productName">
        <el-input
          v-model="form.productName"
          placeholder="请输入货物名称"
          :disabled="isDisabled"
        />
      </el-form-item>

      <!-- 仓库 -->
      <el-form-item label="仓库" prop="warehouseId">
        <select-warehouse
          v-model="form.warehouseId"
          class="w-full"
          @change="handleWarehouseChange"
        />
      </el-form-item>

      <!-- 只读字段展示 -->
      <el-form-item label="预报编号">
        <el-input v-model="form.preorderNo" disabled />
      </el-form-item>

      <el-form-item label="订单编号">
        <el-input v-model="form.orderNumber" disabled />
      </el-form-item>

      <el-form-item label="快递单号">
        <el-input v-model="form.trackingNo" disabled />
      </el-form-item>

      <el-form-item label="IMEI/UPC">
        <el-input v-model="form.productCode" disabled />
      </el-form-item>

      <el-form-item label="数量">
        <el-input v-model="form.quantity" disabled />
      </el-form-item>

      <el-form-item label="状态">
        <el-tag :type="getStatusType(form.status)">
          {{ getStatusText(form.status) }}
        </el-tag>
        <div v-if="isDisabled" class="disabled-tip">
          <el-alert
            title="已入库状态的预报不可修改"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog as any">取 消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="isDisabled"
          @click="submitForm"
        >
          确 定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { updateForecastApi } from "@/api/warehouse/forecast";
import { getWarehouseListApi } from "@/api/warehouse";
import { Loading } from "@element-plus/icons-vue";
import SelectWarehouse from "@/views/warehouse/stock/select-warehouse.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: "修改预报"
  },
  row: {
    type: Object,
    default: () => ({})
  },
  warehouseOptions: {
    type: Array,
    default: () => []
  },
  editData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

const formRef = ref<FormInstance>();
const loading = ref(false);

// 表单数据
const form = reactive({
  id: "",
  preorderNo: "",
  productName: "",
  warehouseId: "" as string | number,
  orderNumber: "",
  trackingNo: "",
  productCode: "",
  quantity: "",
  status: ""
});

// 表单验证规则
const rules = {
  productName: [
    { required: true, message: "请输入货物名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 100 个字符", trigger: "blur" }
  ],
  warehouseId: [{ required: true, message: "请选择仓库", trigger: "change" }]
};

// 是否禁用表单
const isDisabled = computed(() => {
  // 状态为9(已入库)或更高时不允许修改
  return parseInt(form.status) >= 9;
});

// 获取状态类型
const getStatusType = status => {
  const map = {
    "0": "info", // 待预报
    "1": "warning", // 待入库
    "9": "primary", // 已入库
    "10": "success" // 已结算
  };
  return map[status] || "info";
};

// 获取状态文本
const getStatusText = status => {
  const map = {
    "0": "待预报",
    "1": "待入库",
    "9": "已入库",
    "10": "已结算"
  };
  return map[status] || "未知状态";
};

// 添加表单加载状态
const formLoading = ref(true);

// 本地维护仓库列表
const warehouseList = ref([]);
const warehouseLoading = ref(false);

// 类型定义以匹配仓库数据结构
interface WarehouseResponse {
  code: number;
  data: {
    data: Array<{
      id: number | string;
      name: string;
      [key: string]: any;
    }>;
  };
  message?: string;
}

// 仓库变更处理函数
const handleWarehouseChange = option => {
  if (option && option.raw) {
    // 可以处理选择仓库后的额外逻辑
    console.log("选择的仓库详情:", option.raw);
  }
};

// 修改处理下拉框展开事件函数，确保每次点击都加载完整列表
const handleWarehouseDropdownChange = async (visible: boolean) => {
  if (visible) {
    // 设置加载状态
    warehouseLoading.value = true;

    // 保存当前选中的仓库ID
    const currentWarehouseId = form.warehouseId;

    // 每次下拉框打开时都加载完整的仓库列表
    console.log("下拉框打开，开始加载仓库列表");

    // 清空现有列表，强制重新加载
    warehouseList.value = [];
    await fetchWarehouseOptions();

    // 确保当前选中的仓库在列表中
    ensureSelectedWarehouseInList(currentWarehouseId);
  }
};

// 添加一个辅助函数确保选中的仓库在列表中
const ensureSelectedWarehouseInList = warehouseId => {
  if (!warehouseId) return;

  const exists = warehouseList.value.some(w => w.value === warehouseId);
  if (!exists && props.row.warehouseName) {
    warehouseList.value.push({
      label: props.row.warehouseName,
      value: warehouseId
    });
    console.log("确保当前仓库在列表中:", props.row.warehouseName);
  }
};

// 修改获取仓库列表函数，移除条件限制
const fetchWarehouseOptions = async () => {
  // 移除这个条件限制，确保每次调用都执行
  // if (warehouseLoading.value && warehouseList.value.length > 1) return;

  warehouseLoading.value = true;

  // 保存当前选中的仓库
  const currentSelectedId = form.warehouseId;
  const currentSelectedName = props.row?.warehouseName;

  console.log("开始获取仓库列表...");

  try {
    // 请求参数确保获取全部数据
    const response = await getWarehouseListApi({
      page: 1,
      pageSize: 500, // 增大页面大小以确保获取所有数据
      status: "1"
    });

    console.log("获取仓库列表响应:", response);
    const typedResponse = response as WarehouseResponse;

    if (
      typedResponse &&
      typedResponse.code === 0 &&
      typedResponse.data &&
      typedResponse.data.data
    ) {
      // 将API返回的数据映射为选项格式
      const options = typedResponse.data.data.map(item => ({
        label: item.name,
        value: item.id
      }));

      // 重置列表并设置新数据
      warehouseList.value = options;

      console.log(`仓库选项加载完成: ${options.length}个选项`);

      // 确保当前选中的仓库在列表中
      if (currentSelectedId && currentSelectedName) {
        ensureSelectedWarehouseInList(currentSelectedId);
      }
    } else {
      console.warn("仓库API返回数据格式不符合预期");
    }
  } catch (error) {
    console.error("获取仓库列表失败", error);
  } finally {
    warehouseLoading.value = false;
  }
};

// 监听props.row变化，初始化表单数据
watch(
  () => props.row,
  newVal => {
    if (newVal && Object.keys(newVal).length > 0) {
      formLoading.value = true;

      // 短暂延迟以确保DOM更新
      setTimeout(() => {
        // 初始化表单数据
        form.id = newVal.id || "";
        form.preorderNo = newVal.preorderNo || "";
        form.productName = newVal.productName || "";
        form.warehouseId = newVal.warehouseId || ""; // 确保使用ID而不是名称
        form.orderNumber = newVal.orderNumber || "";
        form.trackingNo = newVal.trackingNo || "";
        form.productCode = newVal.productCode || "";
        form.quantity = newVal.quantity || "";
        form.status = newVal.status || "";

        formLoading.value = false;

        // 调试输出
        console.log("表单初始化完成:", {
          formWarehouseId: form.warehouseId,
          rowWarehouseId: newVal.warehouseId,
          rowWarehouseName: newVal.warehouseName
        });
      }, 100);
    }
  },
  { immediate: true, deep: true }
);

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  if (isDisabled.value) {
    ElMessage.warning("已入库状态的预报不可修改");
    return;
  }

  await formRef.value.validate(async valid => {
    if (!valid) return;

    loading.value = true;
    try {
      await updateForecastApi({
        id: form.id,
        product_name: form.productName,
        warehouse_id: form.warehouseId
      });

      ElMessage.success("修改成功");

      // 乐观更新 - 在父组件中通知单条数据更新而不是刷新整个列表
      closeDialog(true, {
        id: form.id,
        productName: form.productName,
        warehouseId: form.warehouseId
      });
    } catch (error) {
      console.error("修改预报失败", error);
      ElMessage.error("修改失败");
    } finally {
      loading.value = false;
    }
  });
};

// 修改关闭对话框函数
const closeDialog = (isSuccess = false, updatedData = null) => {
  dialogVisible.value = false;
  if (isSuccess) {
    emit("success", updatedData);
  }
};
</script>

<style scoped>
.edit-form {
  margin: 10px 0;
}
.disabled-tip {
  margin-top: 10px;
}
.form-loading-container {
  padding: 20px;
}
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  color: #909399;
}

.loading-placeholder .el-icon {
  margin-right: 6px;
  font-size: 16px;
}
</style>
