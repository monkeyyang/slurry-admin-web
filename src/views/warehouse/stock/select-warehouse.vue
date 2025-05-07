<template>
  <el-select
    v-model="selectedWarehouse"
    placeholder="请选择仓库"
    @change="handleChange"
  >
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
          :style="{
            color: getCountryStyle(item.country).color,
            backgroundColor: getCountryStyle(item.country).bg,
            borderColor: getCountryStyle(item.country).borderColor,
            marginLeft: '8px'
          }"
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

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ""
  },
  onlyActive: {
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

const warehouseOptions = ref([]);

const getCountryStyle = code => {
  return getCountryColorStyle(code);
};

const handleChange = value => {
  // 找到选中的仓库对象，传递完整数据
  const selectedOption = warehouseOptions.value.find(
    item => item.value === value
  );
  emit("change", selectedOption);
};

const loadOptions = async () => {
  const params = props.onlyActive ? { status: 1 } : {};
  warehouseOptions.value = await getWarehouseOptionsWithCountry(params);
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
</style>
