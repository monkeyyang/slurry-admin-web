<template>
  <el-dialog
    v-model="visible"
    title="添加天数计划"
    width="600px"
    :before-close="handleClose"
  >
    <div v-if="planData" class="add-days-content">
      <!-- 计划基本信息 -->
      <div class="plan-info">
        <h4>计划信息</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">计划名称：</span>
              <span class="value">{{ planData.name }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">当前天数：</span>
              <span class="value">{{ planData.planDays }}天</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">总金额：</span>
              <span class="value">{{ planData.totalAmount }}元</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 醒目提示 -->
      <div class="warning-notice">
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          title="谨慎添加，添加将重启为完成总额计划的账号兑换计划"
          class="warning-alert"
        />
      </div>

      <!-- 添加天数表单 -->
      <div class="add-days-form">
        <h4>添加天数</h4>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
          <el-form-item label="添加天数" prop="additionalDays">
            <el-input-number
              v-model="form.additionalDays"
              :min="1"
              placeholder="请输入要添加的天数"
              style="width: 200px"
              @change="calculateDistribution"
            />
            <span class="unit">天</span>
          </el-form-item>

          <el-form-item label="余额分配">
            <div class="balance-info">
              <div class="balance-item">
                <span class="label">剩余金额：</span>
                <span class="value amount">{{ remainingAmount }}元</span>
              </div>
              <div class="balance-item">
                <span class="label">每天平均：</span>
                <span class="value">{{ averagePerDay }}元</span>
              </div>
              <div class="balance-item">
                <span class="label">余数：</span>
                <span class="value">{{ remainder }}元（加到最后一天）</span>
              </div>
            </div>
          </el-form-item>

          <!-- 新增天数金额预览 -->
          <el-form-item v-if="form.additionalDays > 0" label="金额分配预览">
            <div class="preview-amounts">
              <div
                v-for="(amount, index) in newDaysAmounts"
                :key="index"
                class="preview-day"
              >
                <span class="day-label"
                  >第{{ planData.planDays + index + 1 }}天：</span
                >
                <span class="amount-value">{{ amount }}元</span>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!form.additionalDays || form.additionalDays <= 0"
          @click="handleSubmit"
        >
          确认添加
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { planApi, type PlanItem } from "@/api/trade/plan";

interface Props {
  modelValue: boolean;
  planData?: PlanItem | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = withDefaults(defineProps<Props>(), {
  planData: null
});

const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);

// 表单数据
const form = ref({
  additionalDays: 0
});

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 剩余金额（总金额减去已分配的每日金额）
const remainingAmount = computed(() => {
  if (!props.planData?.totalAmount || !props.planData?.dailyAmounts) return 0;
  const totalAllocated = props.planData.dailyAmounts.reduce(
    (sum, amount) => sum + amount,
    0
  );
  return props.planData.totalAmount - totalAllocated;
});

// 每天平均金额
const averagePerDay = computed(() => {
  if (!form.value.additionalDays || form.value.additionalDays <= 0) return 0;
  return Math.floor(remainingAmount.value / form.value.additionalDays);
});

// 余数
const remainder = computed(() => {
  if (!form.value.additionalDays || form.value.additionalDays <= 0) return 0;
  return remainingAmount.value % form.value.additionalDays;
});

// 新增天数的金额分配
const newDaysAmounts = computed(() => {
  if (!form.value.additionalDays || form.value.additionalDays <= 0) return [];

  const amounts: number[] = [];
  const baseAmount = averagePerDay.value;
  const remainderAmount = remainder.value;

  for (let i = 0; i < form.value.additionalDays; i++) {
    let dayAmount = baseAmount;
    // 余数加到最后一天
    if (i === form.value.additionalDays - 1) {
      dayAmount += remainderAmount;
    }
    amounts.push(dayAmount);
  }

  return amounts;
});

// 表单验证规则
const rules: FormRules = {
  additionalDays: [
    { required: true, message: "请输入要添加的天数", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 30,
      message: "天数必须在1-30之间",
      trigger: "blur"
    }
  ]
};

// 计算分配
const calculateDistribution = () => {
  // 触发计算属性更新
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value || !props.planData?.id) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    await planApi.addDays(props.planData.id, form.value.additionalDays);
    ElMessage.success("添加天数成功");

    emit("success");
    handleClose();
  } catch (error) {
    console.error("添加天数失败:", error);
    ElMessage.error("添加天数失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  form.value.additionalDays = 0;
  emit("update:modelValue", false);
};
</script>

<style scoped>
.add-days-content {
  padding: 0;
}

.plan-info,
.add-days-form {
  margin-bottom: 24px;
}

.plan-info h4,
.add-days-form h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-height: 32px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: #303133;
  flex: 1;
}

.info-item .value.amount {
  font-weight: 600;
  color: #e6a23c;
}

.warning-notice {
  margin-bottom: 16px;
}

.warning-alert {
  margin-bottom: 12px;
}

.balance-info {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.balance-item:last-child {
  margin-bottom: 0;
}

.balance-item .label {
  font-weight: 500;
  color: #606266;
}

.balance-item .value {
  color: #303133;
}

.balance-item .value.amount {
  font-weight: 600;
  color: #e6a23c;
}

.preview-amounts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.preview-day {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.day-label {
  font-weight: 500;
  color: #606266;
}

.amount-value {
  font-weight: 600;
  color: #e6a23c;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
