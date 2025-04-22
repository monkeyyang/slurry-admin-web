<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { batchInboundApi } from "@/api/warehouse/inbound";
import { ElMessage, ElUpload } from "element-plus";
import { UploadFilled, Warning } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";

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

// 使用计算属性处理对话框的可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const fileList = ref([]);
const uploadRef = ref();
const previewData = ref([]); // 存储所有解析数据用于预览
const parsedData = ref([]); // 存储解析后的完整数据
const parseLoading = ref(false); // 解析加载状态
const previewColumns = ref([]); // 预览表格的列

const formData = reactive({
  warehouseId: "",
  file: null
});

const rules = reactive<FormRules>({
  warehouseId: [{ required: true, message: "请选择仓库", trigger: "change" }]
});

const close = () => {
  emit("update:visible", false);
  fileList.value = [];
  previewData.value = [];
  parsedData.value = [];
  previewColumns.value = [];
  formData.warehouseId = "";
  formData.file = null;
};

const handleExcelUpload = (file, fileList) => {
  // 支持更多Excel文件类型
  const isExcel =
    file.raw.type === "application/vnd.ms-excel" ||
    file.raw.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    /\.(xlsx|xls|csv)$/i.test(file.name);

  if (!isExcel) {
    ElMessage.error("只能上传Excel文件!");
    return false;
  }

  // 确保我们使用的是原始文件对象
  const rawFile = file.raw;
  if (!rawFile) {
    ElMessage.error("获取文件失败!");
    return false;
  }

  // 设置解析加载状态
  parseLoading.value = true;
  ElMessage.info("正在解析Excel文件，请稍候...");

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        ElMessage.warning("Excel文件中没有数据");
        parseLoading.value = false;
        return;
      }

      // 合并新解析的数据到现有数据中（允许连续导入）
      parsedData.value = [...parsedData.value, ...jsonData];

      // 更新预览数据（显示所有数据）
      previewData.value = parsedData.value;

      // 获取所有列
      if (previewData.value.length > 0) {
        const firstRow = previewData.value[0];
        previewColumns.value = Object.keys(firstRow).map(key => ({
          prop: key,
          label: key,
          minWidth: 120
        }));
      }

      formData.file = rawFile;

      ElMessage.success(
        `Excel解析成功，共解析数据 ${jsonData.length} 条，当前共有 ${parsedData.value.length} 条数据`
      );
      console.log(
        "Excel解析成功，共解析数据",
        jsonData.length,
        "条，当前共有",
        parsedData.value.length,
        "条数据"
      );
    } catch (error) {
      ElMessage.error("Excel解析失败，请检查文件格式");
      console.error("Excel解析失败", error);
    } finally {
      parseLoading.value = false;
    }
  };
  reader.readAsArrayBuffer(rawFile);

  // 阻止自动上传
  return false;
};

// 清空已解析的数据
const clearParsedData = () => {
  parsedData.value = [];
  previewData.value = [];
  previewColumns.value = [];
  ElMessage.info("已清空所有解析数据");
};

// 删除预览数据中的一行
const deletePreviewRow = (index: number) => {
  // 从预览数据中删除
  previewData.value.splice(index, 1);
  // 从实际要提交的数据中也删除
  parsedData.value.splice(index, 1);

  ElMessage.success("已删除该条数据");
};

const submit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      if (parsedData.value.length === 0) {
        ElMessage.error("请上传并解析Excel文件");
        return;
      }

      loading.value = false;
      try {
        // 确保所有必要字段都存在，修正字段名映射
        const params = parsedData.value.map(item => ({
          warehouseId: formData.warehouseId,
          orderNo: item["订单编号"] || "",
          goodsName: item["货品名称"] || item["货物名称"] || "",
          orderLink: item["订单链接"] || "",
          logisticsLink: item["物流链接"] || "",
          country: item["国家"] || "",
          orderStatus: item["订单状态"] || "",
          createTime: item["创建时间"] || ""
          // // 其他可能的字段
          // ...item
        }));

        // 检查必要字段 - 打印调试信息
        console.log("提交数据:", params);

        // 修改检查逻辑，更精确地定位问题
        const missingGoodsNameItems = params.filter(item => !item.goodsName);
        if (missingGoodsNameItems.length > 0) {
          console.error("缺少货物名称的数据:", missingGoodsNameItems);
          ElMessage.error(
            `存在${missingGoodsNameItems.length}条缺少货物名称的数据，请检查Excel文件`
          );
          return;
        }

        loading.value = true;
        const { code } = await batchInboundApi({
          warehouseId: formData.warehouseId,
          items: params
        });
        if (code === 0) {
          ElMessage.success("批量入库成功");
          emit("success");
          close(); // 成功后关闭对话框
        }
      } catch (error) {
        console.error("提交错误:", error);
        ElMessage.error("批量入库失败，请检查数据格式");
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量入库"
    width="800px"
    destroy-on-close
    @closed="close"
  >
    <div class="warning-box">
      <div class="warning-title">
        <el-icon class="warning-icon"><Warning /></el-icon>
        重要提示：
      </div>
      <ul class="warning-list">
        <li>导入入库前，请确保相关货物已在系统中创建</li>
        <li>系统将根据货物名称和国家代码自动匹配对应的货物别名</li>
        <li>如果导入失败，请检查货物名称是否已添加对应国家的别名</li>
        <li>支持连续导入多个Excel文件，后导入的数据会追加到已有数据中</li>
      </ul>
    </div>

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="选择仓库" prop="warehouseId">
        <el-select
          v-model="formData.warehouseId"
          placeholder="请选择仓库"
          clearable
          style="width: 100%"
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
          ref="uploadRef"
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :file-list="fileList"
          :on-change="handleExcelUpload"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :disabled="parseLoading"
        >
          <el-icon v-if="parseLoading" class="el-icon--loading"
            ><i class="el-icon-loading"
          /></el-icon>
          <el-icon v-else class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            <span v-if="parseLoading">正在解析Excel文件，请稍候...</span>
            <span v-else>拖拽文件到此处或 <em>点击上传</em></span>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传Excel文件(.xlsx, .xls, .csv)，且不超过10MB
              <el-button
                v-if="parsedData.length > 0"
                link
                type="primary"
                @click="clearParsedData"
                >清空已解析数据</el-button
              >
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item v-if="previewData.length > 0" label="数据预览">
        <div class="preview-table-container">
          <el-table
            :data="previewData"
            border
            style="width: 100%"
            height="300"
            :header-cell-style="{ background: '#f5f7fa' }"
          >
            <el-table-column
              v-for="column in previewColumns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :min-width="column.minWidth"
            />
            <el-table-column fixed="right" label="操作" width="80">
              <template #default="{ $index }">
                <el-button link type="danger" @click="deletePreviewRow($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="preview-note">共解析 {{ parsedData.length }} 条数据</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button v-if="!loading" type="primary" @click="submit">
        提 交
      </el-button>
      <el-button v-else loading type="primary">提交中...</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.warning-box {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 4px;

  .warning-title {
    color: #e6a23c;
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    align-items: center;

    .warning-icon {
      margin-right: 8px;
    }
  }

  .warning-list {
    margin: 0;
    padding-left: 24px;

    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  }
}

.preview-table-container {
  width: 100%;
  overflow-x: auto;
}

.preview-note {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: right;
}

.upload-demo {
  width: 100%;
}
</style>
