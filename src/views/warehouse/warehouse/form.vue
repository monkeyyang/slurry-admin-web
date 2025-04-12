<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import {
  addWarehouseApi,
  updateWarehouseApi,
  getWarehouseListApi
} from "@/api/warehouse/index";
import { getGoodsListApi } from "@/api/warehouse/goods";

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
  isView: {
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
const goodsLoading = ref(false);
const goodsList = ref([]);

const getGoodsList = async () => {
  goodsLoading.value = true;
  try {
    console.log("开始请求货品列表API");
    const response = await getGoodsListApi({
      pageSize: 100 // 获取较多数据以供选择
    });

    console.log("货品列表API原始响应:", response);

    // 检查响应结构
    if (response && response.data) {
      console.log("API响应data字段:", response.data);

      // 尝试不同的数据结构解析方式
      if (response.data.data && Array.isArray(response.data.data.data)) {
        // 如果是嵌套的data.data.data结构
        goodsList.value = response.data.data.data;
        console.log("解析方式1 - 嵌套data结构:", goodsList.value.length);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // 如果是data.data数组结构
        goodsList.value = response.data.data;
        console.log("解析方式2 - data数组结构:", goodsList.value.length);
      } else if (Array.isArray(response.data)) {
        // 如果直接是data数组
        goodsList.value = response.data;
        console.log("解析方式3 - 直接数组结构:", goodsList.value.length);
      } else {
        console.error("无法识别的数据结构:", response.data);
        goodsList.value = [];
      }
    } else {
      console.error("API响应缺少data字段");
      goodsList.value = [];
    }
  } catch (error) {
    console.error("获取货品列表失败:", error);
    goodsList.value = [];
  } finally {
    goodsLoading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    if (val) {
      console.log("对话框打开，加载货品列表");
      getGoodsList();
    }
  }
);

onMounted(() => {
  if (props.visible) {
    console.log("组件挂载且对话框可见，加载货品列表");
    getGoodsList();
  }
});

const formData = reactive({
  id: undefined,
  name: "",
  status: "1",
  remark: "",
  goods_ids: []
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入仓库名称", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
});

watch(
  () => props.row,
  val => {
    if (val && Object.keys(val).length > 0) {
      Object.assign(formData, val);
      // 如果有关联货品，设置已选择的货品ID
      if (val.goods && Array.isArray(val.goods)) {
        formData.goods_ids = val.goods.map(item => item.id);
      } else {
        formData.goods_ids = [];
      }
    } else {
      // 重置表单
      formData.id = undefined;
      formData.name = "";
      formData.status = "1";
      formData.remark = "";
      formData.goods_ids = [];
    }
  },
  { immediate: true, deep: true }
);

const handleClose = () => {
  dialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        const submitData = {
          name: formData.name,
          status: formData.status,
          remark: formData.remark,
          goods_ids: formData.goods_ids
        };

        if (formData.id) {
          // 更新
          await updateWarehouseApi(formData.id, submitData);
          message("更新成功", { type: "success" });
        } else {
          // 新增
          await addWarehouseApi(submitData);
          message("新增成功", { type: "success" });
        }

        dialogVisible.value = false;
        emit("success");
      } catch (error) {
        console.error("提交失败:", error);
        message("操作失败", { type: "error" });
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
    :width="700"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :disabled="isView"
    >
      <el-form-item label="仓库名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入仓库名称" />
      </el-form-item>

      <el-form-item label="可入库货品" prop="goods_ids">
        <el-select
          v-model="formData.goods_ids"
          multiple
          filterable
          placeholder="请选择可入库货品"
          style="width: 100%"
          :loading="goodsLoading"
        >
          <el-option
            v-for="item in goodsList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <div style="display: flex; align-items: center">
              <span>{{ item.name }}</span>
              <div
                v-if="item.aliases && item.aliases.length > 0"
                style="margin-left: 8px"
              >
                <el-tag
                  v-for="alias in item.aliases.slice(0, 2)"
                  :key="alias.id"
                  size="small"
                  type="info"
                  effect="plain"
                  style="margin-left: 4px"
                >
                  {{ alias.region }}
                </el-tag>
                <el-tag
                  v-if="item.aliases.length > 2"
                  size="small"
                  type="info"
                  effect="plain"
                  style="margin-left: 4px"
                >
                  +{{ item.aliases.length - 2 }}
                </el-tag>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="'1'">启用</el-radio>
          <el-radio :value="'0'">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="3"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="!isView"
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
