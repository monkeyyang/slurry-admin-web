<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import {
  importStockApi,
  matchForecastApi,
  checkTrackingNoExistsApi
} from "@/api/warehouse/stock";

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

// 扩展导入数据的类型
interface ImportItem {
  goodsName: string;
  trackingNo: string;
  productCode?: string;
  matchedForecast: boolean;
  forecastDetail?: any;
  status?: number;
  stockInTime?: string;
  settleTime?: string;
  existsInStock?: boolean; // 是否已存在于库存中
}

const importData = ref<ImportItem[]>([]);

// 添加解析状态
const parsing = ref(false);

interface ForecastDetail {
  tracking_no: string;
  matched: boolean;
  forecast_id?: number;
  preorder_no?: string;
  customer_name?: string;
  product_name?: string;
  goods_url?: string;
  order_number?: string;
  product_code?: string;
  quantity?: number;
  create_time?: string;
  status?: number;
  stock_in_time?: string;
  settle_time?: string;
}

// 添加详情弹窗状态和数据
const detailDialogVisible = ref(false);
const currentDetail = ref<{
  preorder_no?: string;
  customer_name?: string;
  product_name?: string;
  order_number?: string;
  tracking_no?: string;
  status?: number;
  stock_in_time?: string;
  settle_time?: string;
  create_time?: string;
  goods_url?: string;
} | null>(null);

// 添加状态映射
const STATUS_MAP = {
  1: { label: "待入库", type: "warning" },
  9: { label: "已入库", type: "primary" },
  10: { label: "已结算", type: "success" }
};

// 修改文件处理函数
const handleFileChange = async file => {
  if (!file) return;

  if (!warehouseId.value) {
    ElMessage.warning("请先选择仓库");
    return false;
  }

  const loading = ElLoading.service({
    lock: true,
    text: "正在解析Excel文件...",
    background: "rgba(0, 0, 0, 0.7)"
  });

  parsing.value = true;

  try {
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

        // 检查快递单号是否已存在于库存中
        const checkExistRes = await checkTrackingNoExistsApi({
          warehouseId: warehouseId.value,
          trackingNos: parsedData.map(item => item.trackingNo)
        });

        if (checkExistRes.code === 0) {
          // 确保 data 是数组
          const existingTrackingNos = new Set(
            Array.isArray(checkExistRes.data) ? checkExistRes.data : []
          );

          parsedData.forEach(item => {
            item.existsInStock = existingTrackingNos.has(item.trackingNo);
          });
        }

        // 如果选择了仓库，立即检查预报匹配
        if (warehouseId.value) {
          try {
            const matchRes = await matchForecastApi({
              warehouseId: warehouseId.value,
              items: parsedData.map(item => ({
                trackingNo: item.trackingNo
              }))
            });

            if (matchRes.code === 0 && matchRes.data?.items) {
              // 更新匹配状态和详情
              parsedData.forEach(item => {
                const matchItem = matchRes.data.items.find(
                  match => match.tracking_no === item.trackingNo
                );
                if (matchItem) {
                  item.matchedForecast = matchItem.matched;
                  item.forecastDetail = matchItem;
                  // 添加状态相关信息
                  item.status = matchItem.status;
                  item.stockInTime = matchItem.stock_in_time;
                  item.settleTime = matchItem.settle_time;
                }
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
      } finally {
        loading.close();
        parsing.value = false;
      }
    };

    reader.onerror = () => {
      ElMessage.error("文件读取失败");
      loading.close();
      parsing.value = false;
    };

    reader.readAsArrayBuffer(file.raw);
  } catch (error) {
    ElMessage.error("文件处理失败");
    loading.close();
    parsing.value = false;
  }
};

// 判断记录是否有效（可导入）
const isValidRecord = (row: ImportItem) => {
  if (row.existsInStock) return false;
  if (row.matchedForecast && row.status && row.status > 1) return false;
  return true;
};

// 修改提交按钮状态
const submitDisabled = computed(() => {
  return (
    !warehouseId.value ||
    !importData.value.length ||
    loading.value ||
    parsing.value
  );
});

// 修改提交函数
const handleSubmit = async () => {
  if (!warehouseId.value) {
    ElMessage.warning("请选择仓库");
    return;
  }

  if (!importData.value.length) {
    ElMessage.warning("请先上传文件");
    return;
  }

  // 过滤出有效的记录
  const validItems = importData.value.filter(isValidRecord);

  if (!validItems.length) {
    ElMessage.warning("没有可导入的有效数据");
    return;
  }

  loading.value = true;
  try {
    const submitData = {
      warehouseId: warehouseId.value,
      items: validItems.map(item => ({
        goodsName: item.goodsName,
        trackingNo: item.trackingNo,
        productCode: item.productCode,
        forecastId:
          item.matchedForecast && item.forecastDetail?.forecast_id
            ? item.forecastDetail.forecast_id
            : undefined
      }))
    };

    const res = await importStockApi(submitData);

    if (res.code === 0) {
      ElMessage.success("导入成功");
      emit("success");
      closeDialog();
    } else {
      ElMessage.error(res.message || "导入失败");
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

// 查看详情
const handleViewDetail = row => {
  if (row.forecastDetail) {
    currentDetail.value = row.forecastDetail;
    detailDialogVisible.value = true;
  }
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
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item label="选择仓库：" required>
        <div class="form-content-width">
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
        </div>
      </el-form-item>

      <el-form-item label="上传文件：">
        <div class="form-content-width">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :disabled="!warehouseId"
            accept=".xlsx,.xls"
          >
            <el-icon class="el-icon--upload">
              <upload-filled />
            </el-icon>
            <div class="el-upload__text">
              {{ warehouseId ? "将文件拖到此处，或点击上传" : "请先选择仓库" }}
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传Excel文件，包含货物名称、快递单号和UPC/IMEI(可选)
                <el-button link type="primary" @click.stop="downloadTemplate">
                  下载模板
                </el-button>
              </div>
            </template>
          </el-upload>
        </div>
      </el-form-item>

      <el-form-item v-if="importData.length" label="导入数据：">
        <div class="form-content-width">
          <el-table
            v-loading="parsing"
            :data="importData"
            border
            style="width: 100%"
            element-loading-text="正在解析数据..."
          >
            <el-table-column prop="goodsName" label="货物名称" min-width="200">
              <template #default="{ row }">
                <span :class="{ 'text-gray-400': !isValidRecord(row) }">
                  {{ row.goodsName }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="trackingNo" label="快递单号" width="150">
              <template #default="{ row }">
                <span :class="{ 'text-gray-400': !isValidRecord(row) }">
                  {{ row.trackingNo }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="productCode" label="UPC/IMEI" width="150">
              <template #default="{ row }">
                <span :class="{ 'text-gray-400': !isValidRecord(row) }">
                  {{ row.productCode }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="220">
              <template #default="{ row }">
                <div class="flex items-center gap-2">
                  <template v-if="row.existsInStock">
                    <el-tag type="danger">已存在</el-tag>
                  </template>
                  <template v-else-if="row.matchedForecast">
                    <el-tag type="success">已匹配</el-tag>
                    <el-tag :type="STATUS_MAP[row.status]?.type">
                      {{ STATUS_MAP[row.status]?.label }}
                    </el-tag>
                    <el-button
                      link
                      type="primary"
                      @click="handleViewDetail(row)"
                    >
                      详情
                    </el-button>
                  </template>
                  <template v-else>
                    <el-tag type="warning">未匹配</el-tag>
                  </template>
                </div>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="80">
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
        </div>
      </el-form-item>

      <el-form-item v-if="importData.length">
        <div class="form-content-width">
          <el-alert title="导入说明" type="warning" :closable="false" show-icon>
            <template #default>
              <div class="notice-content">
                <div class="notice-item">
                  <span class="text-gray-400">灰色</span>
                  显示的记录为无效数据，包括：
                </div>
                <div class="notice-list">
                  <div class="notice-list-item">
                    • 快递单号已存在于当前库存中的记录
                  </div>
                  <div class="notice-list-item">
                    • 已匹配但状态为已入库或已结算的记录
                  </div>
                </div>
                <div class="notice-item">以上无效数据将不会被导入系统</div>
              </div>
            </template>
          </el-alert>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="submitDisabled"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </span>
    </template>

    <!-- 添加详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="预报详情"
      width="600px"
      append-to-body
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="预报单号">
          {{ currentDetail?.preorder_no }}
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">
          {{ currentDetail?.customer_name }}
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">
          {{ currentDetail?.product_name }}
        </el-descriptions-item>
        <el-descriptions-item label="订单号">
          {{ currentDetail?.order_number }}
        </el-descriptions-item>
        <el-descriptions-item label="快递单号">
          {{ currentDetail?.tracking_no }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="STATUS_MAP[currentDetail?.status]?.type">
            {{ STATUS_MAP[currentDetail?.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentDetail?.stock_in_time"
          label="入库时间"
        >
          {{ currentDetail.stock_in_time }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentDetail?.settle_time"
          label="结算时间"
        >
          {{ currentDetail.settle_time }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentDetail?.create_time }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail?.goods_url" label="商品链接">
          <el-link
            type="primary"
            :href="currentDetail.goods_url"
            target="_blank"
          >
            查看商品
          </el-link>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.form-content-width {
  width: 660px; /* 或其他合适的固定宽度 */
}

.form-select {
  width: 100%;
  max-width: 660px;
}

.upload-container {
  width: 100%;
  max-width: 660px;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100% !important;
}

/* 修正拖拽区域的鼠标样式 */
:deep(.el-upload-dragger) {
  cursor: not-allowed;
}

:deep(.el-upload:not(.is-disabled) .el-upload-dragger) {
  cursor: pointer;
}

:deep(.el-upload:not(.is-disabled) .el-upload-dragger.is-dragover) {
  cursor: move;
}

/* 确保上传区域内的文本提示居中 */
:deep(.el-upload-dragger .el-icon--upload) {
  margin: 20px 0 16px;
}

:deep(.el-upload__text) {
  margin-bottom: 20px;
}

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

:deep(.el-form-item__label) {
  font-weight: normal;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 14px;
}

.mt-2 {
  margin-top: 8px;
}

:deep(.el-table .invalid-row) {
  background-color: #f5f5f5;
}

.import-notice {
  margin-top: 16px;
}

.notice-content {
  line-height: 1.6;
  font-size: 14px;
}

.notice-item {
  margin: 4px 0;
}

.notice-list {
  margin: 8px 0;
  padding-left: 8px;
}

.notice-list-item {
  color: var(--el-color-warning-dark);
  margin: 4px 0;
}

.text-gray-400 {
  color: #9ca3af;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 2px;
}

:deep(.el-alert) {
  margin-top: 0;
}

:deep(.el-alert__title) {
  font-size: 15px;
  font-weight: bold;
}

:deep(.el-alert) {
  padding: 16px 20px;
}

:deep(.el-alert__icon) {
  font-size: 18px;
}
</style>
