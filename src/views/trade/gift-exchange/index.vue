<template>
  <div class="gift-exchange-container">
    <!-- 导入和规则设置卡片 -->
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>礼品卡充值计划设置</span>
          <div class="header-actions">
            <el-button type="success" @click="loadTemplateDialogVisible = true">
              <el-icon><Document /></el-icon> 选择模板
            </el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" label-width="120px">
        <!-- 基础信息 -->
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="section-header">
              <el-icon :size="20" color="#409EFF"><InfoFilled /></el-icon>
              <span class="section-title">基础信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="国家/地区" prop="country">
                <el-select v-model="form.country" placeholder="选择国家/地区">
                  <el-option
                    v-for="item in countries"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="总充值金额" prop="totalAmount">
                <el-input-number
                  v-model="form.totalAmount"
                  :min="0"
                  :step="50"
                  style="width: 100%"
                  @change="calculatePlan"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="账号导入方式" prop="importType">
                <el-radio-group v-model="form.importType">
                  <el-radio value="manual">手动输入</el-radio>
                  <el-radio value="file">文件导入</el-radio>
                  <el-radio value="batch">批量添加</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <template v-if="form.importType === 'manual'">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="账号" prop="account">
                  <el-input v-model="form.account" placeholder="请输入账号" />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-if="form.importType === 'file'">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="选择文件">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :limit="1"
                  >
                    <el-button type="primary">
                      <el-icon><Upload /></el-icon> 选择文件
                    </el-button>
                    <template #tip>
                      <div class="el-upload__tip">
                        支持 .txt, .csv 文件，每行一个账号
                      </div>
                    </template>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-if="form.importType === 'batch'">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="批量账号" prop="batchAccounts">
                  <el-input
                    v-model="form.batchAccounts"
                    type="textarea"
                    :rows="5"
                    placeholder="请输入账号，每行一个"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>
        </el-card>

        <!-- 充值规则 -->
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="section-header">
              <el-icon :size="20" color="#67C23A"><SetUp /></el-icon>
              <span class="section-title">充值规则</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="充值天数" prop="days">
                <el-input-number
                  v-model="form.days"
                  :min="1"
                  :max="10"
                  style="width: 100%"
                  @change="calculatePlan"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="面值倍数" prop="multipleBase">
                <el-input-number
                  v-model="form.multipleBase"
                  :min="1"
                  :step="10"
                  style="width: 100%"
                  @change="calculatePlan"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="浮动金额" prop="floatAmount">
                <el-input-number
                  v-model="form.floatAmount"
                  :min="0"
                  :step="10"
                  style="width: 100%"
                  @change="calculatePlan"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="间隔时间(小时)" prop="intervalHours">
                <el-input-number
                  v-model="form.intervalHours"
                  :min="1"
                  :max="48"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开始时间" prop="startTime">
                <el-date-picker
                  v-model="form.startTime"
                  type="datetime"
                  placeholder="选择开始时间"
                  style="width: 100%"
                  @change="calculatePlan"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
      </el-form>

      <div class="form-actions">
        <el-button type="primary" @click="calculatePlan">生成计划</el-button>
        <el-button type="success" @click="handleSavePlan">保存计划</el-button>
        <el-button type="info" @click="handleSaveAsTemplate"
          >保存为模板</el-button
        >
      </div>
    </el-card>

    <!-- 充值计划预览 -->
    <el-card v-if="chargePlan.length > 0" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>充值计划预览</span>
          <div class="header-actions">
            <el-button type="primary" @click="exportPlan">
              <el-icon><Download /></el-icon> 导出计划
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="chargePlan" style="width: 100%" border>
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="day" label="天数" width="100" />
        <el-table-column prop="time" label="充值时间" width="180" />
        <el-table-column prop="amount" label="充值金额" width="120" />
        <el-table-column label="浮动范围" width="150">
          <template #default="scope">
            {{ scope.row.minAmount }}-{{ scope.row.maxAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
      </el-table>
    </el-card>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="saveTemplateDialogVisible"
      title="保存为模板"
      width="30%"
    >
      <el-form>
        <el-form-item label="模板名称" required>
          <el-input v-model="templateName" placeholder="请输入模板名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAsTemplate">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 加载模板对话框 -->
    <el-dialog v-model="loadTemplateDialogVisible" title="选择模板" width="50%">
      <el-table :data="templateList" style="width: 100%" border>
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="country" label="国家/地区" width="120" />
        <el-table-column prop="totalAmount" label="总金额" width="120" />
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="loadTemplate(scope.row)"
              >使用</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="loadTemplateDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  InfoFilled,
  SetUp,
  Document,
  Download,
  Upload
} from "@element-plus/icons-vue";
import { formatDate } from "@/utils/date";
import {
  saveChargePlanApi,
  batchCreatePlansApi,
  getPlanTemplatesApi,
  savePlanAsTemplateApi,
  exportPlanApi
} from "@/api/trade/gift-exchange";
import type { ChargePlanItem, ChargePlan } from "@/api/trade/types";

// 国家选项
const countries = [
  { value: "CAD", label: "加拿大" },
  { value: "USD", label: "美国" },
  { value: "GBP", label: "英国" },
  { value: "AUD", label: "澳大利亚" },
  { value: "EUR", label: "欧洲" },
  { value: "JPY", label: "日本" }
];

// 表单引用
const formRef = ref();

// 表单数据
const form = reactive({
  country: "CAD",
  account: "",
  totalAmount: 1850,
  days: 3,
  multipleBase: 50,
  floatAmount: 100,
  intervalHours: 24,
  startTime: new Date(),
  importType: "manual",
  batchAccounts: "",
  fileList: [] as any[]
});

// 充值计划
const chargePlan = ref<ChargePlanItem[]>([]);

// 模板相关
const saveTemplateDialogVisible = ref(false);
const loadTemplateDialogVisible = ref(false);
const templateName = ref("");
const templateList = ref<any[]>([]);

// 文件上传处理
const handleFileChange = (file: any) => {
  form.fileList = [file];
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target?.result as string;
    if (content) {
      // 将文件内容按行分割，过滤空行
      const accounts = content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      form.batchAccounts = accounts.join("\n");
      ElMessage.success(`成功读取 ${accounts.length} 个账号`);
    }
  };
  reader.readAsText(file.raw);
};

// 获取账号列表
const getAccounts = (): string[] => {
  if (form.importType === "manual") {
    return form.account ? [form.account] : [];
  } else {
    // 批量账号和文件导入都通过batchAccounts字段处理
    return form.batchAccounts
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
};

// 计算充值计划
const calculatePlan = () => {
  if (!form.totalAmount || form.totalAmount <= 0) {
    ElMessage.warning("请输入有效的总充值金额");
    return;
  }

  if (!form.days || form.days <= 0) {
    ElMessage.warning("请输入有效的充值天数");
    return;
  }

  // 清空当前计划
  chargePlan.value = [];

  // 计算每天的基础充值金额
  const baseAmountPerDay = Math.floor(form.totalAmount / form.days);
  let remainingAmount = form.totalAmount;

  // 生成每天的充值计划
  for (let i = 0; i < form.days; i++) {
    const isLastDay = i === form.days - 1;
    let dayAmount;

    if (isLastDay) {
      // 最后一天充值剩余所有金额
      dayAmount = remainingAmount;
    } else {
      // 将金额调整为倍数基数的整数倍
      dayAmount =
        Math.floor(baseAmountPerDay / form.multipleBase) * form.multipleBase;

      // 确保金额不为0
      if (dayAmount === 0) {
        dayAmount = form.multipleBase;
      }
    }

    // 计算浮动范围
    const minAmount = Math.max(0, dayAmount - form.floatAmount);
    const maxAmount = dayAmount + form.floatAmount;

    // 计算充值时间
    const chargeTime = new Date(form.startTime);
    chargeTime.setHours(chargeTime.getHours() + i * form.intervalHours);

    // 添加到计划中
    chargePlan.value.push({
      day: i + 1,
      time: formatDate(chargeTime, "YYYY-MM-DD HH:mm:ss"),
      amount: dayAmount,
      minAmount: minAmount,
      maxAmount: maxAmount,
      description: isLastDay ? "最后一天充值剩余金额" : `第${i + 1}天充值`
    });

    // 更新剩余金额
    remainingAmount -= dayAmount;
  }

  ElMessage.success("充值计划生成成功");
};

// 保存计划
const handleSavePlan = async () => {
  const accounts = getAccounts();

  if (accounts.length === 0) {
    ElMessage.warning("请至少输入一个账号");
    return;
  }

  if (chargePlan.value.length === 0) {
    ElMessage.warning("请先生成充值计划");
    return;
  }

  try {
    if (accounts.length === 1) {
      // 单个账号保存
      const planData: ChargePlan = {
        account: accounts[0],
        country: form.country,
        totalAmount: form.totalAmount,
        days: form.days,
        multipleBase: form.multipleBase,
        floatAmount: form.floatAmount,
        intervalHours: form.intervalHours,
        startTime: formatDate(form.startTime, "YYYY-MM-DD HH:mm:ss"),
        items: chargePlan.value,
        status: "draft"
      };

      await saveChargePlanApi(planData);
      ElMessage.success("充值计划保存成功");
    } else {
      // 批量账号保存
      const batchData = {
        country: form.country,
        totalAmount: form.totalAmount,
        days: form.days,
        multipleBase: form.multipleBase,
        floatAmount: form.floatAmount,
        intervalHours: form.intervalHours,
        startTime: formatDate(form.startTime, "YYYY-MM-DD HH:mm:ss"),
        accounts
      };

      const res = await batchCreatePlansApi(batchData);
      ElMessage.success(`成功创建 ${res.data.successCount} 个账号的充值计划`);

      if (res.data.failCount > 0) {
        ElMessage.warning(`${res.data.failCount} 个账号创建失败`);
      }
    }
  } catch (error) {
    console.error("保存计划失败", error);
    ElMessage.error("保存计划失败，请稍后重试");
  }
};

// 保存为模板对话框
const handleSaveAsTemplate = () => {
  if (chargePlan.value.length === 0) {
    ElMessage.warning("请先生成充值计划");
    return;
  }

  saveTemplateDialogVisible.value = true;
};

// 保存为模板
const saveAsTemplate = async () => {
  if (!templateName.value) {
    ElMessage.warning("请输入模板名称");
    return;
  }

  try {
    // 创建一个临时计划ID
    const tempPlanId = "temp_" + new Date().getTime();

    // 保存计划为模板
    await savePlanAsTemplateApi(tempPlanId, templateName.value);

    ElMessage.success("模板保存成功");
    saveTemplateDialogVisible.value = false;
    templateName.value = "";
    loadTemplates();
  } catch (error) {
    console.error("保存模板失败", error);
    ElMessage.error("保存模板失败，请稍后重试");
  }
};

// 加载模板列表
const loadTemplates = async () => {
  try {
    const res = await getPlanTemplatesApi();
    templateList.value = res.data.list || [];
  } catch (error) {
    console.error("加载模板列表失败", error);
  }
};

// 使用模板
const loadTemplate = (template: any) => {
  form.country = template.country;
  form.totalAmount = template.totalAmount;
  form.days = template.days;
  form.multipleBase = template.multipleBase;
  form.floatAmount = template.floatAmount;
  form.intervalHours = template.intervalHours;

  loadTemplateDialogVisible.value = false;
  calculatePlan();

  ElMessage.success("模板加载成功");
};

// 导出计划
const exportPlan = async () => {
  if (chargePlan.value.length === 0) {
    ElMessage.warning("请先生成充值计划");
    return;
  }

  try {
    // 创建一个临时计划ID用于导出
    const tempPlanId = "temp_" + new Date().getTime();

    // 调用导出API
    const res = await exportPlanApi(tempPlanId);

    // 创建下载链接
    const blob = new Blob([res], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `充值计划_${form.country}_${formatDate(new Date(), "YYYYMMDD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElMessage.success("充值计划导出成功");
  } catch (error) {
    console.error("导出计划失败", error);
    ElMessage.error("导出计划失败，请稍后重试");
  }
};

// 页面加载时初始化
onMounted(() => {
  calculatePlan();
  loadTemplates();
});
</script>

<style scoped>
.gift-exchange-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
}

.mb-4 {
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
