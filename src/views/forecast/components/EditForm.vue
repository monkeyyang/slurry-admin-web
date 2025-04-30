<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    destroy-on-close
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
      label-width="100px"
      class="edit-form"
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
        <el-select
          v-model="form.warehouseId"
          placeholder="请选择仓库"
          style="width: 100%"
          :disabled="isDisabled"
          filterable
          remote
          :loading="warehouseLoading"
          @visible-change="handleWarehouseDropdownChange"
        >
          <template #empty>
            <el-empty
              v-if="!warehouseLoading"
              description="暂无数据"
              :image-size="60"
            />
            <div v-else class="loading-placeholder">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
          </template>

          <el-option
            v-for="item in warehouseList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
        <el-button @click="closeDialog">取 消</el-button>
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
  warehouseId: "",
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

    if (
      response &&
      response.code === 0 &&
      response.data &&
      response.data.data
    ) {
      // 将API返回的数据映射为选项格式
      const options = response.data.data.map(item => ({
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

// 修改初始化逻辑，确保仓库下拉框初始化时就有当前仓库选项
watch(
  () => props.visible,
  async val => {
    if (val && props.row) {
      formLoading.value = true;
      try {
        console.log("编辑表单数据:", props.row);

        // 初始化表单数据
        form.id = props.row.id;
        form.preorderNo = props.row.preorderNo;
        form.productName = props.row.productName;

        // 设置仓库ID (确保类型匹配)
        form.warehouseId =
          typeof props.row.warehouseId === "number"
            ? props.row.warehouseId
            : Number(props.row.warehouseId);

        // 重要：立即添加当前仓库到选项列表，确保显示名称而不是ID
        if (form.warehouseId && props.row.warehouseName) {
          // 检查列表中是否已存在该仓库
          const exists = warehouseList.value.some(
            w => w.value === form.warehouseId
          );
          if (!exists) {
            // 添加当前仓库到选项中
            warehouseList.value.push({
              label: props.row.warehouseName,
              value: form.warehouseId
            });
            console.log("已添加当前仓库到选项列表:", props.row.warehouseName);
          }
        }

        // 继续设置其他字段
        form.orderNumber = props.row.orderNumber;
        form.trackingNo = props.row.trackingNo;
        form.productCode = props.row.productCode;
        form.quantity = props.row.quantity;
        form.status = props.row.status;

        if (isDisabled.value) {
          ElMessage.warning("已入库状态的预报不可修改");
        }

        // 延迟验证
        await nextTick();
        if (formRef.value) {
          formRef.value.clearValidate();
        }
      } catch (error) {
        console.error("表单初始化失败", error);
      } finally {
        formLoading.value = false;
      }
    } else {
      formLoading.value = false;
    }
  },
  { immediate: true }
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
