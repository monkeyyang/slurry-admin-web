<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { addInboundApi } from "@/api/warehouse/inbound";
import { getGoodsListApi } from "@/api/warehouse/goods";
import { getWarehouseListApi } from "@/api/warehouse/index";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ""
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

// 使用计算属性处理对话框的可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const goodsOptions = ref([]);
const goodsLoading = ref(false);
const warehouseOptions = ref(props.warehouseOptions || []);

// 如果没有传入仓库选项，则自动获取
const fetchWarehouseOptions = async () => {
  try {
    const response = await getWarehouseListApi({
      pageNum: 1,
      pageSize: 100,
      status: "1"
    });

    console.log("仓库API返回数据:", response);

    // 根据实际API响应结构调整数据获取方式
    if (
      response &&
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      // 直接使用data数组
      warehouseOptions.value = response.data.data.map(item => ({
        label: item.name,
        value: item.id
      }));
      console.log("处理后的仓库选项:", warehouseOptions.value);
    } else if (
      response &&
      response.data &&
      response.data.data &&
      response.data.data.data
    ) {
      // 嵌套的data.data.data数组
      warehouseOptions.value = response.data.data.data.map(item => ({
        label: item.name,
        value: item.id
      }));
      console.log("处理后的仓库选项(从嵌套data中):", warehouseOptions.value);
    } else {
      console.warn("仓库API返回数据为空或格式不符合预期:", response);
    }
  } catch (error) {
    console.error("获取仓库列表失败", error);
  }
};

// 组件挂载时获取仓库列表
onMounted(() => {
  console.log("组件挂载，开始获取仓库列表");
  fetchWarehouseOptions();
});

const formData = reactive({
  id: undefined,
  warehouseId: "",
  goodsId: "",
  orderNumber: "",
  trackingNumber: "",
  country: "",
  quantity: 1,
  remark: ""
});

const rules = reactive<FormRules>({
  warehouseId: [{ required: true, message: "请选择仓库", trigger: "change" }],
  goodsId: [{ required: true, message: "请选择货物", trigger: "change" }],
  quantity: [
    { required: true, message: "请输入数量", trigger: "blur" },
    { type: "number", min: 1, message: "数量必须大于0", trigger: "blur" }
  ]
});

// 获取货物列表
const getGoodsOptions = async (query = "") => {
  if (!formData.warehouseId) {
    goodsOptions.value = [];
    return;
  }

  goodsLoading.value = true;
  try {
    const response = await getGoodsListApi({
      name: query,
      status: "1",
      pageSize: 50
    });

    console.log("货物API返回数据:", response);

    if (
      response &&
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      goodsOptions.value = response.data.data.map(item => ({
        label: item.name,
        value: item.id
      }));
      console.log("处理后的货物选项:", goodsOptions.value);
    } else {
      console.warn("货物API返回数据为空或格式不符合预期:", response);
      goodsOptions.value = [];
    }
  } catch (error) {
    console.error("获取货物列表失败", error);
    goodsOptions.value = [];
  } finally {
    goodsLoading.value = false;
  }
};

// 远程搜索方法
const remoteMethod = (query: string) => {
  if (query) {
    getGoodsOptions(query);
  } else {
    getGoodsOptions();
  }
};

// 监听仓库变化，重新加载货物列表
watch(
  () => formData.warehouseId,
  newVal => {
    if (newVal) {
      formData.goodsId = "";
      getGoodsOptions();
    } else {
      goodsOptions.value = [];
    }
  }
);

watch(
  () => props.visible,
  val => {
    if (val) {
      // 编辑时，使用传入的行数据
      if (props.row.id) {
        Object.assign(formData, props.row);
      } else {
        // 新增时重置表单
        formData.id = undefined;
        formData.warehouseId = "";
        formData.goodsId = "";
        formData.orderNumber = "";
        formData.trackingNumber = "";
        formData.country = "";
        formData.quantity = 1;
        formData.remark = "";
      }
    }
  }
);

const close = () => {
  emit("update:visible", false);
};

const submit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        await addInboundApi(formData);
        message("操作成功", { type: "success" });
        close();
        emit("success");
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    destroy-on-close
    @closed="close"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="选择仓库" prop="warehouseId">
        <el-select
          v-model="formData.warehouseId"
          placeholder="请选择仓库"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="item in warehouseOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择货物" prop="goodsId">
        <el-select
          v-model="formData.goodsId"
          placeholder="请选择货物"
          clearable
          filterable
          remote
          :remote-method="remoteMethod"
          :loading="goodsLoading"
          style="width: 100%"
        >
          <el-option
            v-for="item in goodsOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="订单编号" prop="orderNumber">
        <el-input
          v-model="formData.orderNumber"
          placeholder="请输入订单编号"
          clearable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="物流链接" prop="trackingNumber">
        <el-input
          v-model="formData.trackingNumber"
          placeholder="请输入物流链接或跟踪号"
          clearable
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="国家" prop="country">
        <el-select
          v-model="formData.country"
          placeholder="请选择国家"
          clearable
          style="width: 100%"
        >
          <el-option label="美国" value="US" />
          <el-option label="法国" value="FR" />
          <el-option label="加拿大" value="CA" />
          <el-option label="英国" value="UK" />
          <el-option label="德国" value="DE" />
          <el-option label="日本" value="JP" />
          <el-option label="中国" value="CN" />
        </el-select>
      </el-form-item>

      <el-form-item label="数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :min="1"
          :precision="0"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>
