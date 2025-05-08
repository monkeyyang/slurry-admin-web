<template>
  <el-select
    v-model="selectedWarehouse"
    placeholder="请选择仓库"
    :loading="loading"
    @change="handleChange"
  >
    <template #empty>
      <el-empty v-if="!loading" description="暂无数据" :image-size="60" />
      <div v-else class="loading-placeholder">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
    </template>

    <el-option
      v-for="item in warehouseOptions"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
      <div class="warehouse-option">
        <span class="warehouse-name">{{
          item.raw?.name || item.label.split("(")[0].trim()
        }}</span>
        <el-tag
          v-if="item.country"
          :style="applyCountryColor ? getCountryStyleObject(item.country) : {}"
          size="small"
        >
          {{ item.countryName || item.country }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { getWarehouseOptionsWithCountry } from "@/api/warehouse/index";
import { getCountryColorStyle } from "@/utils/countryColors";
import { Loading } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ""
  },
  onlyActive: {
    type: Boolean,
    default: true
  },
  applyCountryColor: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 使用计算属性实现双向绑定
const selectedWarehouse = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 添加加载状态变量
const loading = ref(false);
const warehouseOptions = ref([]);

// 获取国家样式对象
const getCountryStyleObject = code => {
  const style = getCountryColorStyle(code);
  return {
    color: style?.color || "#303133",
    backgroundColor: style?.bg || "#f0f2f5",
    borderColor: style?.borderColor || "#dcdfe6",
    marginLeft: "8px"
  };
};

const handleChange = value => {
  // 找到选中的仓库对象，传递完整数据
  const selectedOption = warehouseOptions.value.find(
    item => item.value === value
  );
  emit("change", selectedOption);
};

const loadOptions = async () => {
  loading.value = true;
  try {
    const params = props.onlyActive ? { status: 1 } : {};
    warehouseOptions.value = await getWarehouseOptionsWithCountry(params);
  } catch (error) {
    console.error("加载仓库选项失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadOptions();
});

// 监听外部modelValue变化，确保组件内部值同步
watch(
  () => props.modelValue,
  newVal => {
    if (newVal && warehouseOptions.value.length > 0) {
      // 确保选项已加载
      const exists = warehouseOptions.value.some(item => item.value == newVal);
      if (!exists) {
        // 如果当前选项中没有这个值，重新加载选项
        loadOptions();
      }
    }
  }
);
</script>

<style scoped>
.warehouse-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.warehouse-name {
  font-weight: 500;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #909399;
}

.loading-placeholder .el-icon {
  margin-right: 6px;
  font-size: 16px;
}
</style>
