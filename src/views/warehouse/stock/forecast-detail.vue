<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getCustomerOrderDetailApi } from "@/api/warehouse/stock/index";
import type { CustomerOrderDetail } from "@/api/warehouse/stock/types";

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

const customerOrderDetail = ref<CustomerOrderDetail | null>(null);

// 监听 visible 变化，当打开弹窗时获取数据
watch(
  () => props.visible,
  async newVal => {
    if (newVal && props.row?.forecast_id) {
      try {
        const { code, data } = await getCustomerOrderDetailApi(
          props.row.forecast_id
        );
        if (code === 0 && data) {
          customerOrderDetail.value = data;
        } else {
          ElMessage.error("获取预报详情失败");
          emit("update:visible", false);
        }
      } catch (error) {
        console.error("获取详情失败", error);
        ElMessage.error("获取预报详情失败");
        emit("update:visible", false);
      }
    }
  }
);

// 根据状态获取标签类型
const getStatusType = (status: number): string => {
  switch (status) {
    case 0:
      return "warning"; // 待入库
    case 9:
      return "primary"; // 已入库
    case 10:
      return "success"; // 已结算
    default:
      return "info";
  }
};

// 添加这个新函数 - 根据状态码获取正确的文本描述
const getStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return "待入库";
    case 9:
      return "已入库";
    case 10:
      return "已结算";
    default:
      return "未知状态";
  }
};
</script>

<template>
  <el-dialog
    :modelValue="visible"
    title="客户预报详情"
    width="700px"
    @update:modelValue="val => emit('update:visible', val)"
  >
    <el-descriptions v-if="customerOrderDetail" :column="1" border>
      <el-descriptions-item label="预报编号">
        {{ customerOrderDetail.preorder_no }}
      </el-descriptions-item>
      <el-descriptions-item label="客户名称">
        {{ customerOrderDetail.customer_name }}
      </el-descriptions-item>
      <el-descriptions-item label="货物名称">
        {{ customerOrderDetail.product_name }}
      </el-descriptions-item>
      <el-descriptions-item label="商品链接">
        <el-link
          type="primary"
          :href="customerOrderDetail.goods_url"
          target="_blank"
        >
          {{ customerOrderDetail.goods_url }}
        </el-link>
      </el-descriptions-item>
      <el-descriptions-item label="订单编号">
        {{ customerOrderDetail.order_number }}
      </el-descriptions-item>
      <el-descriptions-item label="快递单号">
        {{ customerOrderDetail.tracking_no }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="customerOrderDetail.quantity > 0"
        label="数量"
      >
        {{ customerOrderDetail.quantity }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="customerOrderDetail.product_code"
        label="商品编码"
      >
        {{ customerOrderDetail.product_code }}
      </el-descriptions-item>
      <el-descriptions-item label="仓库">
        {{ customerOrderDetail.warehouse_name }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(customerOrderDetail.status)">
          {{ getStatusText(customerOrderDetail.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ customerOrderDetail.create_time }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="customerOrderDetail.receive_time"
        label="收货时间"
      >
        {{ customerOrderDetail.receive_time }}
      </el-descriptions-item>
    </el-descriptions>
    <div v-else class="empty-data">
      <el-empty description="暂无预报详情数据" />
    </div>
  </el-dialog>
</template>

<style scoped>
:deep(.el-descriptions__cell) {
  padding: 12px 16px;
}

:deep(.el-tag) {
  margin-right: 8px;
}

.empty-data {
  padding: 20px 0;
}
</style>
