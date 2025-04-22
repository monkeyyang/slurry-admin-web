<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量入库"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-upload
      class="upload-demo"
      drag
      action="#"
      :auto-upload="false"
      :on-change="handleChange"
      accept=".xlsx,.xls"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">
          请上传Excel文件，包含订单链接、快递单号和UPC/IMEI(可选)
        </div>
      </template>
    </el-upload>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleImport">
          开始导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import { batchStorageApi } from "@/api/warehouse/forecast";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = ref(false);
const loading = ref(false);
const fileData = ref<any[]>([]);

// 监听visible变化
watch(
  () => props.visible,
  val => {
    dialogVisible.value = val;
  }
);

// 监听对话框关闭
watch(
  () => dialogVisible.value,
  val => {
    if (!val) {
      emit("update:visible", false);
    }
  }
);

// 处理文件变化
const handleChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // 验证数据格式
      const items = jsonData.map((row: any) => ({
        goods_url: row["订单链接"],
        tracking_no: row["快递单号"],
        product_code: row["UPC/IMEI"] || undefined
      }));

      fileData.value = items;
      ElMessage.success("文件解析成功");
    } catch (error) {
      ElMessage.error("文件解析失败");
      console.error(error);
    }
  };
  reader.readAsArrayBuffer(file.raw);
};

// 处理导入
const handleImport = async () => {
  if (!fileData.value.length) {
    ElMessage.warning("请先上传文件");
    return;
  }

  loading.value = true;
  try {
    const res = await batchStorageApi({ items: fileData.value });
    if (res.code === 0) {
      ElMessage.success("导入成功");
      emit("success");
      closeDialog();
    } else {
      // 添加安全检查，确保res.data和res.data.failed存在
      if (res.data && Array.isArray(res.data.failed) && res.data.failed.length > 0) {
        // 显示详细的错误信息
        let htmlContent = `<div style="text-align: left;">
          <div style="color: #F56C6C; margin-bottom: 10px;">批量入库失败：</div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr style="background-color: #F5F7FA;">
              <th style="padding: 8px; border: 1px solid #EBEEF5;">订单链接</th>
              <th style="padding: 8px; border: 1px solid #EBEEF5;">失败原因</th>
            </tr>`;

        res.data.failed.forEach((item: any) => {
          htmlContent += `
            <tr>
              <td style="padding: 8px; border: 1px solid #EBEEF5;">${item.goods_url || '-'}</td>
              <td style="padding: 8px; border: 1px solid #EBEEF5;">${item.reason || '未知错误'}</td>
            </tr>`;
        });

        htmlContent += `</table></div>`;

        ElMessageBox.alert(htmlContent, "导入失败", {
          dangerouslyUseHTMLString: true,
          confirmButtonText: "确定",
          type: "error"
        });
      } else {
        // 如果没有详细的失败信息，显示一般错误消息
        ElMessage.error(res.message || "导入失败，请检查数据格式");
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || "导入失败");
  } finally {
    loading.value = false;
  }
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  fileData.value = [];
};
</script>

<style scoped>
.upload-demo {
  text-align: center;
}
</style>
