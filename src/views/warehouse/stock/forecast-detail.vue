<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getCustomerOrderDetailApi } from "@/api/warehouse/stock/index";
import { getWarehouseListApi } from "@/api/warehouse/index";
import type { CustomerOrderDetail } from "@/api/warehouse/stock/types";
import { getCountryColorStyle } from "@/utils/countryColors";

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
const loading = ref(false);

// 修改监听逻辑，获取完整的仓库信息
watch(
  () => props.visible,
  async newVal => {
    if (newVal && props.row?.forecast_id) {
      // 重置前一个数据并立即设置loading状态
      customerOrderDetail.value = null;
      loading.value = true;

      try {
        // 添加延迟以确保loading状态有时间渲染
        await new Promise(resolve => setTimeout(resolve, 100));

        const { code, data } = await getCustomerOrderDetailApi(
          props.row.forecast_id
        );

        if (code === 0 && data) {
          // 获取完整数据后,如果没有国家信息,尝试从仓库列表获取
          if (data.warehouse_id && (!data.country || !data.country_name)) {
            try {
              const warehouseRes = await getWarehouseListApi({
                id: data.warehouse_id
              });

              if (
                warehouseRes.code === 0 &&
                warehouseRes.data?.data &&
                warehouseRes.data.data.length > 0
              ) {
                const warehouse = warehouseRes.data.data[0];
                data.country = warehouse.country || "";
                data.country_name =
                  warehouse.country_name_zh || warehouse.country || "";
              }
            } catch (err) {
              console.error("获取仓库信息失败", err);
            }
          }

          customerOrderDetail.value = data;
        } else {
          ElMessage.error("获取预报详情失败");
          emit("update:visible", false);
        }
      } catch (error) {
        console.error("获取详情失败", error);
        ElMessage.error("获取预报详情失败");
        emit("update:visible", false);
      } finally {
        loading.value = false;
      }
    } else {
      // 重置状态
      customerOrderDetail.value = null;
    }
  },
  { immediate: true }
);

// 用于调试
watch(
  () => customerOrderDetail.value,
  newVal => {
    if (newVal) {
      console.log("客户预报详情:", newVal);
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

// 根据状态码获取正确的文本描述
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

// 获取国家样式
const getCountryStyle = code => {
  return getCountryColorStyle(code);
};
</script>

<template>
  <el-dialog
    :modelValue="visible"
    title="客户预报详情"
    width="700px"
    @update:modelValue="val => emit('update:visible', val)"
  >
    <!-- 将loading指令应用到内容容器，而不是dialog本身 -->
    <div
      v-loading="loading"
      class="dialog-content"
      element-loading-text="正在加载预报详情..."
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
          <div class="warehouse-info">
            <span>{{ customerOrderDetail.warehouse_name }}</span>
            <el-tag
              v-if="customerOrderDetail.country"
              size="small"
              :style="{
                color: getCountryStyle(customerOrderDetail.country).color,
                backgroundColor: getCountryStyle(customerOrderDetail.country)
                  .bg,
                borderColor: getCountryStyle(customerOrderDetail.country)
                  .borderColor,
                marginLeft: '8px'
              }"
            >
              {{
                customerOrderDetail.country_name || customerOrderDetail.country
              }}
            </el-tag>
          </div>
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
      <div v-else-if="!loading" class="empty-data">
        <el-empty description="暂无预报详情数据" />
      </div>
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

.warehouse-info {
  display: flex;
  align-items: center;
}

/* 添加此样式确保loading显示在可见区域 */
.dialog-content {
  min-height: 200px; /* 提供足够的高度显示loading指示器 */
  position: relative; /* 确保loading指示器定位正确 */
}
</style>
