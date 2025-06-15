<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑计划' : '新增计划'"
    width="900px"
    :before-close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="计划名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="自动生成"
          readonly
          style="width: 100%"
        />
        <el-alert
          type="info"
          show-icon
          :closable="false"
          class="tip-alert"
          title="格式：汇率名称_计划天数_计划总额"
        />
      </el-form-item>

      <el-form-item label="选择国家" prop="countryId">
        <el-select
          v-model="form.countryId"
          placeholder="请选择国家"
          filterable
          :loading="countriesLoading"
          @change="handleCountryChange"
          style="width: 100%"
        >
          <el-option
            v-for="item in countries"
            :key="item.id"
            :value="item.id"
            :label="item.name_zh"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择汇率" prop="rateId">
        <el-select
          v-model="form.rateId"
          placeholder="请先选择国家"
          filterable
          :loading="ratesLoading"
          :disabled="!form.countryId"
          @change="handleRateChange"
          style="width: 100%"
        >
          <el-option
            v-for="item in rates"
            :key="item.id"
            :value="item.id"
            :label="item.name"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="计划天数" prop="planDays">
            <el-input-number
              v-model="form.planDays"
              :min="1"
              :max="365"
              placeholder="请输入天数"
              style="width: 100%"
              @change="handlePlanDaysChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="兑换总额" prop="totalAmount">
            <el-input-number
              v-model="form.totalAmount"
              :min="1"
              :precision="0"
              placeholder="请输入总额"
              style="width: 100%"
              @change="handleTotalAmountChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="浮动金额" prop="floatAmount">
            <el-input-number
              v-model="form.floatAmount"
              :min="0"
              :precision="0"
              placeholder="默认0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="兑换时间间隔" prop="exchangeInterval">
            <el-input-number
              v-model="form.exchangeInterval"
              :min="1"
              :max="1440"
              placeholder="默认5分钟"
              style="width: 100%"
            />
            <small class="text-gray-600">单位：分钟</small>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="天数间隔" prop="dayInterval">
            <el-input-number
              v-model="form.dayInterval"
              :min="1"
              :max="168"
              placeholder="默认24小时"
              style="width: 100%"
            />
            <small class="text-gray-600">单位：小时</small>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 每日计划金额 -->
      <el-form-item v-if="form.planDays > 0" label="每日计划金额">
        <div class="daily-amounts-container">
          <div
            v-for="(amount, index) in form.dailyAmounts"
            :key="index"
            class="daily-amount-item"
          >
            <span class="day-label">第{{ index + 1 }}天：</span>
            <el-input-number
              v-model="form.dailyAmounts[index]"
              :min="0"
              :precision="0"
              :disabled="!canEditDailyAmount(index)"
              style="width: 120px"
              @change="handleDailyAmountChange"
            />
            <span class="amount-unit">元</span>
            <el-tag
              v-if="!canEditDailyAmount(index)"
              type="warning"
              size="small"
              class="ml-2"
            >
              受约束限制
            </el-tag>
          </div>
          <div class="daily-amounts-summary">
            <span>总计：{{ dailyAmountsSum }}元</span>
            <span class="ml-4">
              差额：{{ totalAmountDiff }}元
              <el-tag
                v-if="totalAmountDiff !== 0"
                :type="totalAmountDiff > 0 ? 'success' : 'danger'"
                size="small"
              >
                {{ totalAmountDiff > 0 ? "超出" : "不足" }}
              </el-tag>
            </span>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述（可选）"
        />
      </el-form-item>

      <el-form-item label="群聊绑定">
        <el-switch
          v-model="form.enableRoomBinding"
          active-text="开启"
          inactive-text="关闭"
        />
        <small class="text-gray-600 ml-2">开启后账号可绑定到群聊</small>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="enabled">启用</el-radio>
          <el-radio value="disabled">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? "更新" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  planApi,
  type PlanItem,
  type CountryOption,
  getRatesByCountry,
  type RateItem
} from "@/api/trade/plan";
import { getCountriesListApi } from "@/api/system/countries";

// 简化的汇率接口，用于组件内部
interface SimpleRate {
  id: string;
  name: string;
  amountConstraint: string;
  fixedAmounts: number[];
  multipleBase: number;
  minAmount: number;
  maxAmount: number;
  rate: number;
}

interface Props {
  modelValue: boolean;
  editData?: PlanItem | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null
});

const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const countriesLoading = ref(false);
const ratesLoading = ref(false);

// 表单数据
const form = ref<Partial<PlanItem>>({
  name: "",
  countryId: "",
  countryName: "",
  rateId: "",
  rateName: "",
  planDays: 1,
  floatAmount: 0,
  totalAmount: 0,
  exchangeInterval: 5,
  dayInterval: 24,
  dailyAmounts: [],
  status: "enabled",
  description: "",
  enableRoomBinding: false
});

// 选项数据
const countries = ref<CountryOption[]>([]);
const rates = ref<SimpleRate[]>([]);

// 当前选中的汇率信息
const selectedRate = ref<SimpleRate | null>(null);

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const isEdit = computed(() => !!props.editData?.id);

// 每日金额总和
const dailyAmountsSum = computed(() => {
  return (
    form.value.dailyAmounts?.reduce((sum, amount) => sum + (amount || 0), 0) ||
    0
  );
});

// 总额差异
const totalAmountDiff = computed(() => {
  return dailyAmountsSum.value - (form.value.totalAmount || 0);
});

// 表单验证规则
const rules: FormRules = {
  countryId: [{ required: true, message: "请选择国家", trigger: "change" }],
  rateId: [{ required: true, message: "请选择汇率", trigger: "change" }],
  planDays: [{ required: true, message: "请输入计划天数", trigger: "blur" }],
  totalAmount: [{ required: true, message: "请输入兑换总额", trigger: "blur" }],
  exchangeInterval: [
    { required: true, message: "请输入兑换时间间隔", trigger: "blur" }
  ],
  dayInterval: [{ required: true, message: "请输入天数间隔", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 生成计划名称（去掉"元"）
const generatePlanName = () => {
  const rateName = form.value.rateName || "";
  const planDays = form.value.planDays || 0;
  const totalAmount = form.value.totalAmount || 0;

  if (rateName && planDays && totalAmount) {
    form.value.name = `${rateName}_${planDays}天_${totalAmount}`;
  } else {
    form.value.name = "";
  }
};

// 判断是否可以编辑每日金额
const canEditDailyAmount = (dayIndex: number) => {
  if (!selectedRate.value) return true;

  const constraint = selectedRate.value.amountConstraint;
  if (constraint === "all") return true;

  // 固定面额和倍数要求的情况下，可能受到约束
  return true; // 暂时都允许编辑，具体约束在分配时处理
};

// 智能分配每日金额
const distributeDailyAmounts = () => {
  const totalAmount = form.value.totalAmount || 0;
  const planDays = form.value.planDays || 1;

  if (!totalAmount || !planDays) {
    form.value.dailyAmounts = [];
    return;
  }

  const dailyAmounts: number[] = new Array(planDays).fill(0);

  if (!selectedRate.value) {
    // 没有选择汇率时，平均分配
    const baseAmount = Math.floor(totalAmount / planDays);
    const remainder = totalAmount % planDays;

    for (let i = 0; i < planDays; i++) {
      dailyAmounts[i] = baseAmount;
    }
    // 余数加到最后一天
    if (remainder > 0) {
      dailyAmounts[planDays - 1] += remainder;
    }
  } else {
    const constraint = selectedRate.value.amountConstraint;

    switch (constraint) {
      case "all":
        // 全面额：平均分配
        const baseAmount = Math.floor(totalAmount / planDays);
        const remainder = totalAmount % planDays;

        for (let i = 0; i < planDays; i++) {
          dailyAmounts[i] = baseAmount;
        }
        if (remainder > 0) {
          dailyAmounts[planDays - 1] += remainder;
        }
        break;

      case "fixed":
        // 固定面额：使用固定面额组合分配
        distributeDailyAmountsForFixed(dailyAmounts, totalAmount, planDays);
        break;

      case "multiple":
        // 倍数要求：按倍数分配
        distributeDailyAmountsForMultiple(dailyAmounts, totalAmount, planDays);
        break;
    }
  }

  form.value.dailyAmounts = dailyAmounts;
};

// 固定面额分配逻辑
const distributeDailyAmountsForFixed = (
  dailyAmounts: number[],
  totalAmount: number,
  planDays: number
) => {
  const fixedAmounts = selectedRate.value?.fixedAmounts || [];
  if (!fixedAmounts.length) return;

  // 按固定面额从大到小排序
  const sortedAmounts = [...fixedAmounts].sort((a, b) => b - a);

  let remainingAmount = totalAmount;
  let currentDay = 0;

  // 尽量平均分配到每天
  const targetPerDay = Math.floor(totalAmount / planDays);

  for (let day = 0; day < planDays - 1; day++) {
    let dayAmount = 0;
    let tempRemaining = Math.min(targetPerDay, remainingAmount);

    // 使用贪心算法分配固定面额
    for (const amount of sortedAmounts) {
      while (tempRemaining >= amount && dayAmount + amount <= targetPerDay) {
        dayAmount += amount;
        tempRemaining -= amount;
        remainingAmount -= amount;
      }
    }

    dailyAmounts[day] = dayAmount;
  }

  // 最后一天分配剩余金额
  if (remainingAmount > 0) {
    dailyAmounts[planDays - 1] = remainingAmount;
  }
};

// 倍数要求分配逻辑
const distributeDailyAmountsForMultiple = (
  dailyAmounts: number[],
  totalAmount: number,
  planDays: number
) => {
  const multipleBase = selectedRate.value?.multipleBase || 1;

  // 确保总额是倍数的整数倍
  const adjustedTotal = Math.floor(totalAmount / multipleBase) * multipleBase;
  const basePerDay =
    Math.floor(adjustedTotal / planDays / multipleBase) * multipleBase;
  const remainder = adjustedTotal - basePerDay * planDays;

  for (let i = 0; i < planDays; i++) {
    dailyAmounts[i] = basePerDay;
  }

  // 余数按倍数分配到最后一天
  if (remainder > 0) {
    dailyAmounts[planDays - 1] += remainder;
  }
};

// 处理国家变化
const handleCountryChange = (countryId: string) => {
  const country = countries.value.find(c => c.id === countryId);
  if (country) {
    form.value.countryName = country.name_zh;
  } else {
    form.value.countryName = "";
  }

  // 清空汇率选择
  form.value.rateId = "";
  form.value.rateName = "";
  selectedRate.value = null;
  rates.value = [];

  // 获取该国家的汇率列表
  if (countryId) {
    getRatesByCountryId(countryId);
  }

  generatePlanName();
  distributeDailyAmounts();
};

// 处理汇率变化
const handleRateChange = (rateId: string) => {
  const rate = rates.value.find(r => r.id === rateId);
  if (rate) {
    form.value.rateName = rate.name;
    selectedRate.value = rate;
  } else {
    form.value.rateName = "";
    selectedRate.value = null;
  }
  generatePlanName();
  distributeDailyAmounts();
};

// 处理计划天数变化
const handlePlanDaysChange = () => {
  generatePlanName();
  distributeDailyAmounts();
};

// 处理总额变化
const handleTotalAmountChange = () => {
  generatePlanName();
  distributeDailyAmounts();
};

// 处理每日金额变化
const handleDailyAmountChange = () => {
  // 可以在这里添加验证逻辑
};

// 获取国家列表
const getCountries = async () => {
  try {
    countriesLoading.value = true;
    const response = await getCountriesListApi({
      page_index: 1,
      page_size: 1000,
      status: "1"
    });

    if (response.code === 0 && response.data?.data) {
      // 适配数据结构，添加id字段
      countries.value = response.data.data.map(item => ({
        ...item,
        id: item.code // 使用code作为id
      }));
    }
  } catch (error) {
    console.error("获取国家列表失败:", error);
    ElMessage.error("获取国家列表失败");
  } finally {
    countriesLoading.value = false;
  }
};

// 根据国家获取汇率列表
const getRatesByCountryId = async (countryId: string) => {
  try {
    ratesLoading.value = true;
    const country = countries.value.find(c => c.id === countryId);
    if (!country) return;

    const response = await getRatesByCountry(country.code);

    if (response.code === 0 && response.data && Array.isArray(response.data)) {
      rates.value = response.data.map(item => ({
        id: item.id?.toString(),
        name: item.name,
        amountConstraint: item.amount_constraint,
        fixedAmounts: item.fixed_amounts ? JSON.parse(item.fixed_amounts) : [],
        multipleBase: item.multiple_base || 0,
        minAmount: parseFloat(item.min_amount || "0"),
        maxAmount: parseFloat(item.max_amount || "0"),
        rate: parseFloat(item.rate || "0")
      }));
    }
  } catch (error) {
    console.error("获取汇率列表失败:", error);
    ElMessage.error("获取汇率列表失败");
  } finally {
    ratesLoading.value = false;
  }
};

// 初始化表单数据
const initForm = () => {
  if (props.editData) {
    form.value = { ...props.editData };
    // 设置选中的汇率
    if (form.value.countryId) {
      getRatesByCountryId(form.value.countryId).then(() => {
        const rate = rates.value.find(r => r.id === props.editData?.rateId);
        if (rate) {
          selectedRate.value = rate;
        }
      });
    }
  } else {
    form.value = {
      name: "",
      countryId: "",
      countryName: "",
      rateId: "",
      rateName: "",
      planDays: 1,
      floatAmount: 0,
      totalAmount: 0,
      exchangeInterval: 5,
      dayInterval: 24,
      dailyAmounts: [],
      status: "enabled",
      description: "",
      enableRoomBinding: false
    };
    selectedRate.value = null;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value && props.editData?.id) {
      await planApi.update(props.editData.id, form.value);
      ElMessage.success("更新计划成功");
    } else {
      await planApi.create(
        form.value as Omit<PlanItem, "id" | "createdAt" | "updatedAt">
      );
      ElMessage.success("创建计划成功");
    }

    emit("success");
    handleClose();
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  formRef.value?.resetFields();
  emit("update:modelValue", false);
};

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      initForm();
    }
  }
);

onMounted(() => {
  getCountries();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.tip-alert {
  margin-top: 4px;
  margin-bottom: 12px;
  width: 100%;
}

.daily-amounts-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background-color: #fafafa;
}

.daily-amount-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.daily-amount-item:last-of-type {
  margin-bottom: 16px;
}

.day-label {
  width: 80px;
  font-weight: 500;
  color: #606266;
}

.amount-unit {
  margin-left: 8px;
  color: #909399;
}

.daily-amounts-summary {
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
  font-weight: 500;
  color: #303133;
}

.add-days-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.add-days-info {
  width: 100%;
  margin-top: 8px;
}

.text-gray-600 {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.ml-2 {
  margin-left: 8px;
}

.ml-4 {
  margin-left: 16px;
}
</style>
