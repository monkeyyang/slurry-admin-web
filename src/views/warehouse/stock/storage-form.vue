<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { importStockApi, matchForecastApi } from "@/api/warehouse/stock";
// 导入公共仓库选择组件
import SelectWarehouse from "@/views/warehouse/stock/select-warehouse.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  warehouseOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = ref(false);
const loading = ref(false);
const warehouseId = ref("");
const inputContent = ref("");
const importData = ref([]);

// 处理仓库选择变更
const handleWarehouseChange = option => {
  if (option && option.raw) {
    console.log("选择的仓库:", option.raw);
  }
};

// 处理输入内容 - 改进版本，处理货物名称中的空格
const handleInput = () => {
  const lines = inputContent.value.trim().split("\n");
  importData.value = lines
    .filter(line => line.trim())
    .map(line => {
      // 方法1: 使用正则表达式匹配，更智能地处理空格
      const parts = line.match(
        /^(.*?)(?:\s{2,}|\t|[,，])(.*?)(?:\s{2,}|\t|[,，])?(.*)?$/
      );

      if (parts && parts.length >= 3) {
        return {
          goodsName: parts[1].trim(),
          trackingNo: parts[2].trim(),
          productCode: parts[3] ? parts[3].trim() : ""
        };
      }

      // 方法2: 备用方案，按照传统方式拆分
      const traditionalParts = line.split(/[,，\t]+/);
      if (traditionalParts.length >= 2) {
        return {
          goodsName: traditionalParts[0].trim(),
          trackingNo: traditionalParts[1].trim(),
          productCode: traditionalParts[2] ? traditionalParts[2].trim() : ""
        };
      }

      // 最后尝试使用最后一个单词作为跟踪号
      const lastSpaceIndex = line.lastIndexOf(" ");
      if (lastSpaceIndex > 0) {
        return {
          goodsName: line.substring(0, lastSpaceIndex).trim(),
          trackingNo: line.substring(lastSpaceIndex + 1).trim(),
          productCode: ""
        };
      }

      // 返回无效数据
      return {
        goodsName: line,
        trackingNo: "",
        productCode: ""
      };
    })
    .filter(item => item.goodsName && item.trackingNo);
};

// 提交入库
const handleSubmit = async () => {
  if (!warehouseId.value) {
    ElMessage.warning("请选择仓库");
    return;
  }

  if (!importData.value.length) {
    ElMessage.warning("请输入数据");
    return;
  }

  loading.value = true;
  try {
    // 导入数据
    const importRes = await importStockApi({
      warehouseId: warehouseId.value,
      items: importData.value
    });

    if (importRes.code === 0) {
      // 匹配预报
      const matchRes = await matchForecastApi({
        warehouseId: warehouseId.value,
        items: importData.value.map(item => ({
          trackingNo: item.trackingNo
        }))
      });

      if (matchRes.code === 0) {
        ElMessage.success("入库成功");
        emit("success");
        closeDialog();
      } else {
        ElMessage.error(matchRes.message || "匹配预报失败");
      }
    } else {
      ElMessage.error(importRes.message || "入库失败");
    }
  } catch (error) {
    console.error("入库失败", error);
    ElMessage.error("入库失败");
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
  warehouseId.value = "";
  inputContent.value = "";
  importData.value = [];
};

watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
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
    title="入库"
    width="760px"
    :close-on-click-modal="false"
  >
    <el-form label-width="80px">
      <el-form-item label="选择仓库">
        <!-- 替换为公共仓库选择组件 -->
        <select-warehouse
          v-model="warehouseId"
          class="w-full"
          :apply-country-color="false"
          @change="handleWarehouseChange"
        />
      </el-form-item>

      <el-form-item label="输入数据">
        <el-input
          v-model="inputContent"
          type="textarea"
          :rows="5"
          placeholder="请输入数据，每行一条记录：货物名称 快递单号 UPC/IMEI(可选)
提示：货物名称中如有空格，请用2个以上空格、制表符或逗号分隔字段"
          @input="handleInput"
        />
      </el-form-item>

      <el-form-item v-if="importData.length" label="导入数据">
        <el-table :data="importData" border style="width: 100%">
          <el-table-column prop="goodsName" label="货物名称" />
          <el-table-column prop="trackingNo" label="快递单号" />
          <el-table-column prop="productCode" label="UPC/IMEI" />
          <el-table-column fixed="right" label="操作" width="70">
            <template #default="{ $index }">
              <el-button
                link
                type="primary"
                @click="importData.splice($index, 1)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
