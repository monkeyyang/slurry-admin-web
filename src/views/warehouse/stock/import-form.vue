<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
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
const importData = ref<
  Array<{
    goodsName: string;
    trackingNo: string;
    productCode?: string;
    matchedForecast?: boolean;
  }>
>([]);

// 处理Excel文件变化
const handleFileChange = async file => {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // 确保所有字段都转换为字符串
      const parsedData = jsonData.map(row => ({
        goodsName: String(row["货物名称"] || ""),
        trackingNo: String(row["快递单号"] || ""),
        productCode: row["UPC/IMEI"] ? String(row["UPC/IMEI"]) : undefined,
        matchedForecast: false
      }));

      // 如果选择了仓库，立即检查预报匹配
      if (warehouseId.value) {
        try {
          const matchRes = await matchForecastApi({
            warehouseId: warehouseId.value,
            items: parsedData.map(item => ({
              trackingNo: String(item.trackingNo)
            }))
          });

          if (matchRes.code === 0 && matchRes.data) {
            // 假设 matchRes.data 返回匹配到的快递单号数组
            parsedData.forEach(item => {
              item.matchedForecast = matchRes.data.includes(item.trackingNo);
            });
          }
        } catch (error) {
          console.error("预报匹配检查失败", error);
        }
      }

      importData.value = parsedData;
      ElMessage.success("文件解析成功");
    } catch (error) {
      ElMessage.error("文件解析失败");
      console.error(error);
    }
  };
  reader.readAsArrayBuffer(file.raw);
};

// 提交导入
const handleSubmit = async () => {
  if (!warehouseId.value) {
    ElMessage.warning("请选择仓库");
    return;
  }

  if (!importData.value.length) {
    ElMessage.warning("请先上传文件");
    return;
  }

  loading.value = true;
  try {
    // 导入数据时确保所有字段为字符串
    const importRes = await importStockApi({
      warehouseId: String(warehouseId.value),
      items: importData.value.map(item => ({
        goodsName: String(item.goodsName),
        trackingNo: String(item.trackingNo),
        productCode: item.productCode ? String(item.productCode) : undefined
      }))
    });

    if (importRes.code === 0) {
      // 匹配预报时确保所有字段为字符串
      const matchRes = await matchForecastApi({
        warehouseId: String(warehouseId.value),
        items: importData.value.map(item => ({
          trackingNo: String(item.trackingNo)
        }))
      });

      if (matchRes.code === 0) {
        ElMessage.success("导入成功");
        emit("success");
        closeDialog();
      } else {
        ElMessage.error(matchRes.message || "匹配预报失败");
      }
    } else {
      ElMessage.error(importRes.message || "导入失败");
    }
  } catch (error) {
    console.error("导入失败", error);
    ElMessage.error("导入失败");
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const closeDialog = () => {
  dialogVisible.value = false;
  warehouseId.value = "";
  importData.value = [];
};

// 下载模板
const downloadTemplate = () => {
  const header = [["货物名称", "快递单号", "UPC/IMEI"]];
  const example = [
    ["示例商品1", "SF1234567890", "123456789012"],
    ["示例商品2", "YT1234567890", ""]
  ];

  const ws = XLSX.utils.aoa_to_sheet([...header, ...example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "入库模板");

  XLSX.writeFile(wb, "入库导入模板.xlsx");
};

// 添加仓库选择变化时的处理
watch(warehouseId, async newVal => {
  if (newVal && importData.value.length > 0) {
    // 仓库变化时重新检查预报匹配
    try {
      const matchRes = await matchForecastApi({
        warehouseId: newVal,
        items: importData.value.map(item => ({
          trackingNo: item.trackingNo
        }))
      });

      if (matchRes.code === 0 && matchRes.data) {
        importData.value = importData.value.map(item => ({
          ...item,
          matchedForecast: matchRes.data.includes(item.trackingNo)
        }));
      }
    } catch (error) {
      console.error("预报匹配检查失败", error);
    }
  }
});

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
    title="导入Excel"
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

      <el-form-item label="上传文件">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              请上传Excel文件，包含货物名称、快递单号和UPC/IMEI(可选)
              <el-button link type="primary" @click.stop="downloadTemplate">
                下载模板
              </el-button>
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item v-if="importData.length" label="导入数据">
        <el-table :data="importData" border style="width: 100%">
          <el-table-column prop="goodsName" label="货物名称" />
          <el-table-column prop="trackingNo" label="快递单号" />
          <el-table-column prop="productCode" label="UPC/IMEI" />
          <el-table-column label="预报状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.matchedForecast ? 'success' : 'warning'">
                {{ row.matchedForecast ? "已匹配" : "未匹配" }}
              </el-tag>
            </template>
          </el-table-column>
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

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.el-upload__tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 7px;
}
</style>
