<script setup lang="ts">
import { ref, watch } from "vue";
import { getForecastDetailApi } from "@/api/warehouse/stock";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  row: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(["update:visible"]);

const dialogVisible = ref(false);
const loading = ref(false);
const forecastDetail = ref({});

// 获取预报详情
const getForecastDetail = async () => {
  if (!props.row.forecastId) return;

  loading.value = true;
  try {
    const res = await getForecastDetailApi(props.row.forecastId);
    if (res.code === 0) {
      forecastDetail.value = res.data;
    }
  } catch (error) {
    console.error("获取预报详情失败", error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
    if (val) {
      getForecastDetail();
    }
  }
);

watch(
  () => dialogVisible.value,
  val => {
    if (!val) {
      emit("update:visible", false);
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="预报详情"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-descriptions v-loading="loading" border :column="1">
      <el-descriptions-item label="预报编号">
        {{ forecastDetail.preorderNo }}
      </el-descriptions-item>
      <el-descriptions-item label="货品名称">
        {{ forecastDetail.goodsName }}
      </el-descriptions-item>
      <el-descriptions-item label="快递单号">
        {{ forecastDetail.trackingNo }}
      </el-descriptions-item>
      <el-descriptions-item label="UPC/IMEI">
        {{ forecastDetail.productCode }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ forecastDetail.createTime }}
      </el-descriptions-item>
      <!-- 其他预报信息字段 -->
    </el-descriptions>
  </el-dialog>
</template>
