<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useHook } from "../hook";
// 导入公共仓库选择组件
import SelectWarehouse from "@/views/warehouse/stock/select-warehouse.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "success"]);

const { addForecast } = useHook();

const loading = ref(false);
const urlContent = ref("");
const warehouseId = ref(""); // 仓库ID保持不变

// 处理仓库选择变更
const handleWarehouseChange = option => {
  if (option && option.raw) {
    console.log("选择的仓库详情:", option.raw);
    // 可以在这里做一些额外处理
  }
};

// 提交数据
const handleSubmit = async () => {
  if (!urlContent.value.trim()) {
    ElMessage.warning("请输入URL数据");
    return;
  }

  if (!warehouseId.value) {
    ElMessage.warning("请选择仓库");
    return;
  }

  loading.value = true;
  try {
    const urls = urlContent.value
      .split("\n")
      .map(url => url.trim())
      .filter(url => {
        // 验证是否为有效的Apple订单URL
        return url && url.startsWith("https://www.apple.com/");
      });

    if (urls.length === 0) {
      ElMessage.warning("没有找到有效的URL，请检查输入格式");
      return;
    }

    const success = await addForecast({
      urls,
      warehouseId: warehouseId.value
    });

    if (success) {
      emit("success");
      closeDialog();
    }
  } catch (error: any) {
    // 显示具体的错误信息
    // ElMessage.error(error.message || "添加失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const closeDialog = () => {
  urlContent.value = ""; // 清空内容
  warehouseId.value = ""; // 清空仓库选择
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="批量导入URL"
    width="760px"
    :destroy-on-close="true"
    @update:model-value="val => emit('update:visible', val)"
  >
    <el-form>
      <el-form-item label="选择仓库" required>
        <!-- 替换为公共仓库选择组件 -->
        <select-warehouse
          v-model="warehouseId"
          class="w-full"
          @change="handleWarehouseChange"
        />
      </el-form-item>

      <el-form-item label="URL数据" required>
        <el-input
          v-model="urlContent"
          type="textarea"
          :rows="10"
          placeholder="请输入URL，一行一个。例如：
https://www.apple.com/xc/us/vieworder/W1666025110/axxxxxx@yahoo.com"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>
