<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { importStockApi, matchForecastApi } from "@/api/warehouse/stock";

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

// 处理输入内容
const handleInput = () => {
  const lines = inputContent.value.trim().split("\n");
  importData.value = lines
    .filter(line => line.trim())
    .map(line => {
      const [goodsName, trackingNo, productCode] = line.split(/[,，\s]+/);
      return {
        goodsName,
        trackingNo,
        productCode
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
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-width="80px">
      <el-form-item label="选择仓库">
        <el-select
          v-model="warehouseId"
          placeholder="请选择仓库"
          class="w-full"
        >
          <el-option
            v-for="item in warehouseOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="输入数据">
        <el-input
          v-model="inputContent"
          type="textarea"
          :rows="5"
          placeholder="请输入数据，每行一条记录：货物名称 快递单号 UPC/IMEI(可选)"
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
