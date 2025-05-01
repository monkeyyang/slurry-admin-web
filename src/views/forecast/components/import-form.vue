<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import { UploadFilled, Delete } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import { checkOrderNoExistsApi } from "@/api/warehouse/forecast";
import { addForecastApi } from "@/api/warehouse/forecast";

const emit = defineEmits(["update:visible", "success", "load-warehouses"]);

const dialogVisible = ref(false);
const loading = ref(false);
const warehouseId = ref<string | number>("");

// 导入数据类型
interface ImportItem {
  orderLink: string;
  orderNo?: string;
  trackingNo?: string;
  UPC?: string;
  IMEI?: string;
  isValid: boolean;
  invalidReason?: string;
}

const importData = ref<ImportItem[]>([]);
const parsing = ref(false);

interface WarehouseOption {
  value: string | number;
  label: string;
}

const props = defineProps<{
  visible: boolean;
  warehouseOptions: WarehouseOption[];
  warehouseLoading?: boolean;
}>();

// 监听父组件传入的visible
watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
    if (val) {
      // 打开弹窗时重置数据
      if (props.warehouseOptions && props.warehouseOptions.length > 0) {
        warehouseId.value = props.warehouseOptions[0].value;
      }
    } else {
      // 关闭弹窗时重置表单
      warehouseId.value = "";
      importData.value = [];
    }
  }
);

// 监听本地弹窗关闭，通知父组件
watch(
  () => dialogVisible.value,
  val => {
    if (!val) {
      emit("update:visible", false);
    }
  }
);

// 解析订单号
const parseOrderNo = (orderLink: string): string | undefined => {
  try {
    const match = orderLink.match(/vieworder\/([^\/]+)/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
};

// 文件处理
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
        if (e.target.result instanceof ArrayBuffer) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          // 先解析出所有订单号
          const parsedData: ImportItem[] = jsonData.map(row => {
            const orderLink = String(row["订单链接"] || "");
            const orderNo = parseOrderNo(orderLink);
            return {
              orderLink,
              orderNo,
              trackingNo: String(row["快递单号"] || ""),
              UPC: row["UPC"] ? String(row["UPC"]) : undefined,
              IMEI: row["IMEI"] ? String(row["IMEI"]) : undefined,
              isValid: false, // 先默认无效，后续再判断
              invalidReason: orderNo ? undefined : "订单链接错误"
            };
          });

          // 只查有效orderNo
          const orderNos = parsedData
            .filter(item => item.orderNo)
            .map(item => item.orderNo!);

          let existsOrderNos = new Set<string>();
          if (orderNos.length > 0) {
            const checkRes = await checkOrderNoExistsApi({ orderNos });
            const result = checkRes as {
              code: number;
              data?: { exists: { orderNo: string }[] };
            };
            if (result.code === 0 && result.data?.exists) {
              existsOrderNos = new Set(
                result.data.exists.map(item => item.orderNo)
              );
            }
          }

          // 标记每一项的有效性
          parsedData.forEach(item => {
            if (!item.orderNo) {
              item.isValid = false;
              item.invalidReason = "订单链接错误";
            } else if (existsOrderNos.has(item.orderNo)) {
              item.isValid = false;
              item.invalidReason = "订单已存在";
            } else {
              item.isValid = true;
              item.invalidReason = undefined;
            }
          });

          importData.value = parsedData;
          ElMessage.success("文件解析成功");
          await nextTick();
          document
            .querySelector(".import-table")
            ?.scrollIntoView({ behavior: "smooth" });
        } else {
          ElMessage.error("文件读取失败，格式不正确");
        }
      } catch (error) {
        console.error("文件处理失败", error);
        ElMessage.error("文件处理失败");
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
    console.error("文件处理失败", error);
    ElMessage.error("文件处理失败");
    loading.close();
    parsing.value = false;
  }
};

const submitDisabled = computed(() => {
  return (
    !warehouseId.value ||
    !importData.value.length ||
    loading.value ||
    parsing.value
  );
});

const handleSubmit = async () => {
  const validItems = importData.value.filter(item => item.isValid);
  if (!validItems.length) {
    ElMessage.warning("没有可导入的有效数据");
    return;
  }

  loading.value = true;
  try {
    const submitData = {
      warehouseId: warehouseId.value,
      urls: validItems.map(item => item.orderLink)
    };

    console.log("提交数据:", submitData);
    const res = await addForecastApi(submitData);
    const result = res as { code: number; message?: string; data?: any };

    if (result.code === 0) {
      ElMessage.success("导入成功");
      emit("success");
      closeDialog();
    } else {
      ElMessage.error(result.message || "导入失败");
      if (result.data && result.data.failed) {
        console.error("失败详情:", result.data.failed);
      }
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("导入失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
  warehouseId.value = "";
  importData.value = [];
  parsing.value = false;
};

const downloadTemplate = () => {
  const header = [["订单链接", "快递单号", "UPC", "IMEI"]];
  const example = [
    [
      "https://www.apple.com/xc/ca/vieworder/W1680487911/xxx@gmail.com",
      "SF1234567890",
      "123456789012",
      "123456789012"
    ]
  ];
  const ws = XLSX.utils.aoa_to_sheet([...header, ...example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "预报导入模板");
  XLSX.writeFile(wb, "预报导入模板.xlsx");
};

// 组件挂载时不再主动获取仓库列表
onMounted(() => {
  // 移除 getWarehouseOptions() 调用
  // 依赖父组件传入的 warehouseOptions
});

// 处理仓库选择框点击 - 改为立即加载仓库数据
const handleWarehouseClick = () => {
  console.log("触发仓库数据加载");
  emit("load-warehouses");
};

// 处理仓库选择框点击
const onWarehouseClick = () => {
  console.log("点击仓库选择框，当前选项:", props.warehouseOptions);

  // 无论有没有数据，都发送请求
  emit("load-warehouses");

  // 打印组件内数据进行调试
  console.log("warehouseId:", warehouseId.value);
  console.log("props.warehouseOptions:", props.warehouseOptions);
  console.log("props.warehouseLoading:", props.warehouseLoading);
};

// 修改自动选择逻辑，确保正确设置
// watch(
//   () => props.warehouseOptions,
//   newOptions => {
//     console.log("仓库选项变化:", newOptions);
//     if (newOptions && newOptions.length > 0) {
//       // 强制设置为第一个仓库
//       warehouseId.value = newOptions[0].value;
//       console.log("自动选择仓库:", warehouseId.value);
//     }
//   },
//   { immediate: true, deep: true }
// );
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="导入预报"
    width="760px"
    :close-on-click-modal="false"
    :before-close="closeDialog"
  >
    <el-form label-width="100px">
      <el-form-item label="选择仓库:" prop="warehouseId">
        <div class="form-content-width">
          <el-select
            v-model="warehouseId"
            placeholder="请选择仓库"
            class="w-full"
            :loading="props.warehouseLoading"
            @click="onWarehouseClick"
          >
            <el-option
              v-for="item in props.warehouseOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div
            v-if="props.warehouseOptions.length === 0"
            class="mt-2 text-sm text-red-500"
          >
            无可用仓库，请点击仓库选择框加载
          </div>
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
                请上传Excel文件，包含订单链接、快递单号和UPC/IMEI(可选)
                <el-button link type="primary" @click.stop="downloadTemplate">
                  下载模板
                </el-button>
              </div>
            </template>
          </el-upload>
        </div>
      </el-form-item>

      <el-form-item v-if="importData.length" label="导入数据：">
        <div class="form-content-width import-table import-table-scroll">
          <el-table
            v-loading="parsing"
            :data="importData"
            border
            style="width: 100%"
            element-loading-text="正在解析数据..."
          >
            <el-table-column prop="orderLink" label="订单链接" min-width="200">
              <template #default="{ row }">
                <span :class="{ 'invalid-text': !row.isValid }">
                  {{ row.orderLink }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="trackingNo" label="快递单号" width="150">
              <template #default="{ row }">
                <span :class="{ 'invalid-text': !row.isValid }">
                  {{ row.trackingNo }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="UPC" label="UPC/IMEI" width="150">
              <template #default="{ row }">
                <span :class="{ 'invalid-text': !row.isValid }">
                  {{ row.UPC }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.isValid ? 'success' : 'danger'"
                  :effect="row.isValid ? 'light' : 'plain'"
                >
                  {{ row.isValid ? "有效" : row.invalidReason }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="90">
              <template #default="{ $index }">
                <el-button
                  link
                  type="danger"
                  @click="importData.splice($index, 1)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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

.mr-1 {
  margin-right: 4px;
}

:deep(.el-button .el-icon) {
  margin-right: 4px;
  vertical-align: middle;
}

:deep(.el-tag .el-icon) {
  margin-right: 2px;
  font-size: 14px;
  vertical-align: middle;
}

.invalid-text {
  color: #9ca3af; /* 灰色文本 */
}

/* 为无效行添加背景色 */
:deep(.el-table__row) {
  &:has(.invalid-text) {
    background-color: #f5f5f5;
  }
}

/* 确保鼠标悬停时保持背景色 */
:deep(.el-table__row):has(.invalid-text):hover > td {
  background-color: #f0f0f0 !important;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #909399;
}

.import-table-scroll {
  max-height: 300px; /* 你可以根据实际情况调整高度 */
  overflow-y: auto;
}
</style>
