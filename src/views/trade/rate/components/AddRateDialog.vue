<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑汇率' : '新增汇率'"
    width="95%"
    :style="{ maxWidth: '1300px' }"
    :before-close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="汇率名称" prop="name">
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
          title="格式：国家代码_群组名称_快卡（或慢卡）_卡图（或卡密）_面额约束_汇率"
        />
      </el-form-item>

      <el-form-item label="国家/地区" prop="country">
        <el-select
          v-model="form.country"
          placeholder="选择国家/地区"
          filterable
          :loading="countriesLoading"
          @change="handleCountryChange"
        >
          <el-option
            v-for="item in countries"
            :key="item.code"
            :value="item.code"
            :label="`${item.name_zh} (${item.code})`"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="国家名称" prop="countryName">
        <el-input v-model="form.countryName" placeholder="请输入国家名称" />
      </el-form-item>

      <el-form-item label="群组" prop="roomId">
        <el-select
          v-model="form.roomId"
          placeholder="选择群组（可选）"
          filterable
          clearable
          :loading="roomsLoading"
          @change="handleRoomChange"
        >
          <el-option
            v-for="item in rooms"
            :key="item.id"
            :value="item.id"
            :label="item.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="卡类型" prop="cardType">
        <el-radio-group v-model="form.cardType" @change="handleCardTypeChange">
          <el-radio value="fast">快卡</el-radio>
          <el-radio value="slow">慢卡</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="卡形式" prop="cardForm">
        <el-radio-group v-model="form.cardForm" @change="handleCardFormChange">
          <el-radio value="image">卡图</el-radio>
          <el-radio value="code">卡密</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="面额约束" prop="amountConstraint">
        <el-radio-group
          v-model="form.amountConstraint"
          @change="handleConstraintChange"
        >
          <el-radio value="fixed">固定面额</el-radio>
          <el-radio value="multiple">倍数要求</el-radio>
          <el-radio value="all">全面额</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="form.amountConstraint === 'fixed'"
        label="固定面额"
        prop="fixedAmounts"
      >
        <el-select
          v-model="form.fixedAmounts"
          multiple
          placeholder="请选择固定面额（必填）"
          style="width: 100%"
        >
          <el-option
            v-for="amount in commonAmounts"
            :key="amount"
            :value="amount"
            :label="`$${amount}`"
          />
        </el-select>
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          class="tip-alert"
          title="必须选择至少一个固定面额值（正整数）"
        />
      </el-form-item>

      <!-- 倍数要求时的一行布局 -->
      <div v-if="form.amountConstraint === 'multiple'" class="multiple-row">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="倍数基数" prop="multipleBase">
              <el-input-number
                v-model="form.multipleBase"
                :min="0"
                :max="10000"
                placeholder="0表示不限制"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="最小面额" prop="minAmount">
              <el-input-number
                v-model="form.minAmount"
                :min="0"
                :max="100000"
                placeholder="0表示不限制"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="最大面额" prop="maxAmount">
              <el-input-number
                v-model="form.maxAmount"
                :min="0"
                :max="1000000"
                placeholder="0表示不限制"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="汇率" prop="rate">
              <el-input-number
                v-model="form.rate"
                :precision="2"
                :step="0.01"
                :min="0.01"
                :max="100"
                placeholder="请输入汇率"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 提示条 -->
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          class="multiple-row-alert"
          title="倍数基数：面额必须是此基数的倍数，0 表示不限制；最小 / 最大面额：0 表示不限制；汇率：必填项。"
        />
      </div>

      <!-- 非倍数要求时的汇率字段 -->
      <el-form-item
        v-if="form.amountConstraint !== 'multiple'"
        label="汇率"
        prop="rate"
      >
        <el-input-number
          v-model="form.rate"
          :precision="2"
          :step="0.01"
          :min="0.01"
          :max="100"
          placeholder="请输入汇率"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述（可选）"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="active">启用</el-radio>
          <el-radio value="inactive">禁用</el-radio>
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
import { rateApi, type RateItem } from "@/api/trade/rate";
import { getCountriesListApi } from "@/api/system/countries";
import { getGroupsListApi } from "@/api/system/groups";

interface Props {
  modelValue: boolean;
  editData?: RateItem | null;
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
const roomsLoading = ref(false);

// 表单数据
const form = ref<Partial<RateItem>>({
  country: "",
  countryName: "",
  roomId: "", // 用于群组选择框的绑定
  roomName: "", // 群聊名称
  groupId: "", // 实际提交的群组ID
  groupName: "", // 群组名称
  cardType: "fast",
  cardForm: "image",
  amountConstraint: "all",
  fixedAmounts: [],
  multipleBase: 0,
  minAmount: 0,
  maxAmount: 0,
  rate: 1.0,
  name: "",
  description: "",
  status: "active"
});

// 选项数据
const countries = ref<
  { id: string; code: string; name_zh: string; name_en: string }[]
>([]);
const rooms = ref<{ id: string; name: string }[]>([]);

// 常用面额
const commonAmounts = [10, 15, 20, 25, 50, 100, 200, 500, 1000];

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const isEdit = computed(() => !!props.editData?.id);

// 表单验证规则
const rules: FormRules = {
  country: [{ required: true, message: "请选择国家/地区", trigger: "change" }],
  countryName: [{ required: true, message: "请输入国家名称", trigger: "blur" }],
  cardType: [{ required: true, message: "请选择卡类型", trigger: "change" }],
  cardForm: [{ required: true, message: "请选择卡形式", trigger: "change" }],
  amountConstraint: [
    { required: true, message: "请选择面额约束", trigger: "change" }
  ],
  fixedAmounts: [
    {
      validator: (rule, value, callback) => {
        if (
          form.value.amountConstraint === "fixed" &&
          (!value || value.length === 0)
        ) {
          callback(new Error("请选择至少一个固定面额"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ],
  multipleBase: [
    {
      validator: (rule, value, callback) => {
        if (
          form.value.amountConstraint === "multiple" &&
          value !== undefined &&
          value < 0
        ) {
          callback(new Error("倍数基数不能为负数"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  minAmount: [
    {
      validator: (rule, value, callback) => {
        if (
          form.value.amountConstraint === "multiple" &&
          value !== undefined &&
          value < 0
        ) {
          callback(new Error("最小面额不能为负数"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  maxAmount: [
    {
      validator: (rule, value, callback) => {
        if (
          form.value.amountConstraint === "multiple" &&
          value !== undefined &&
          value < 0
        ) {
          callback(new Error("最大面额不能为负数"));
        } else if (
          form.value.minAmount &&
          value &&
          value > 0 &&
          form.value.minAmount > 0 &&
          value < form.value.minAmount
        ) {
          callback(new Error("最大面额不能小于最小面额"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  rate: [{ required: true, message: "请输入汇率", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  name: [{ required: true, message: "汇率名称不能为空", trigger: "blur" }]
};

// 生成汇率名称
const generateRateName = () => {
  const country = form.value.country || "";
  const groupName = form.value.groupName || "NIL";
  const cardType = form.value.cardType === "fast" ? "快卡" : "慢卡";
  const cardForm = form.value.cardForm === "image" ? "卡图" : "卡密";
  const constraint = form.value.amountConstraint || "";
  const rate = form.value.rate || 0;

  let constraintText = "";
  switch (constraint) {
    case "fixed":
      constraintText = "固定面额";
      break;
    case "multiple":
      constraintText = "倍数要求";
      break;
    case "all":
      constraintText = "全面额";
      break;
  }

  form.value.name = `${country}_${groupName}_${cardType}_${cardForm}_${constraintText}_${rate}`;
};

// 监听表单变化，自动生成名称
watch(
  [
    () => form.value.country,
    () => form.value.groupName,
    () => form.value.cardType,
    () => form.value.cardForm,
    () => form.value.amountConstraint,
    () => form.value.rate
  ],
  () => {
    generateRateName();
  },
  { deep: true }
);

// 处理国家变化
const handleCountryChange = (countryCode: string) => {
  const country = countries.value.find(c => c.code === countryCode);
  if (country) {
    form.value.countryName = country.name_zh;
  }
  generateRateName();
};

// 处理群组变化
const handleRoomChange = (selectedGroupId: string) => {
  const selectedGroup = rooms.value.find(r => r.id === selectedGroupId);
  if (selectedGroup) {
    form.value.groupName = selectedGroup.name; // 群组名称
    form.value.groupId = selectedGroup.id; // 提交用的群组ID
    // 注意：这里选择的是群组，不是群聊，所以不设置roomName
  } else {
    form.value.groupName = "";
    form.value.groupId = "";
  }
  generateRateName();
};

// 处理卡类型变化
const handleCardTypeChange = () => {
  generateRateName();
};

// 处理卡形式变化
const handleCardFormChange = () => {
  generateRateName();
};

// 处理约束类型变化
const handleConstraintChange = () => {
  // 清空相关字段
  if (form.value.amountConstraint !== "fixed") {
    form.value.fixedAmounts = [];
  }
  if (form.value.amountConstraint !== "multiple") {
    form.value.multipleBase = 0;
    form.value.minAmount = 0;
    form.value.maxAmount = 0;
  }
  generateRateName();
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

// 获取群组列表
const getRooms = async () => {
  try {
    roomsLoading.value = true;
    const response = await getGroupsListApi({
      pageNum: 1,
      pageSize: 1000,
      status: "1"
    });

    if (response.code === 0 && response.data?.data) {
      rooms.value = response.data.data;
    }
  } catch (error) {
    console.error("获取群组列表失败:", error);
    ElMessage.error("获取群组列表失败");
  } finally {
    roomsLoading.value = false;
  }
};

// 初始化表单数据
const initForm = () => {
  if (props.editData) {
    form.value = { ...props.editData };
    // 编辑时，如果有groupId，需要设置表单中的群组选择框值
    // 群组选择框绑定的是roomId字段，但实际选择的是群组
    if (form.value.groupId) {
      form.value.roomId = form.value.groupId; // 设置选择框的值
    }
  } else {
    form.value = {
      country: "",
      countryName: "",
      roomId: "", // 用于群组选择框的绑定
      roomName: "", // 群聊名称
      groupId: "", // 实际提交的群组ID
      groupName: "", // 群组名称
      cardType: "fast",
      cardForm: "image",
      amountConstraint: "all",
      fixedAmounts: [],
      multipleBase: 0,
      minAmount: 0,
      maxAmount: 0,
      rate: 1.0,
      name: "",
      description: "",
      status: "active"
    };
  }
  generateRateName();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value && props.editData?.id) {
      await rateApi.update(props.editData.id, form.value);
      ElMessage.success("更新汇率成功");
    } else {
      await rateApi.create(
        form.value as Omit<RateItem, "id" | "createdAt" | "updatedAt">
      );
      ElMessage.success("创建汇率成功");
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
  getRooms();
});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.multiple-row-help :deep(.el-form-item__help) {
  color: #faad14;
  font-size: 13px;
  margin-top: -8px;
}

.multiple-row-alert {
  /* 左侧对齐并限制宽度不超出弹层 */
  margin: 4px 0 12px 120px;
  width: calc(100% - 120px);

  @media (max-width: 768px) {
    margin: 4px 0 12px 100px;
    width: calc(100% - 100px);
  }

  @media (max-width: 480px) {
    margin: 4px 0 12px 80px;
    width: calc(100% - 80px);
  }
}

/* 通用提示条：保证与输入框左对齐 */
.tip-alert {
  margin-top: 4px;
  margin-bottom: 12px;
  /* 在 form-item 内部自动占满；在独立位置可继承宽度 */
  width: 100%;
}

/* 响应式弹层优化 */
:deep(.el-dialog) {
  @media (max-width: 768px) {
    margin: 5vh auto;
    width: 95% !important;
    max-width: none !important;
  }

  @media (max-width: 480px) {
    margin: 2vh auto;
    width: 98% !important;
  }
}

:deep(.el-form-item__label) {
  @media (max-width: 768px) {
    width: 100px !important;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    width: 80px !important;
    font-size: 13px;
  }
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__input) {
  @media (max-width: 768px) {
    font-size: 14px;
  }
}

/* 栅格系统响应式 */
:deep(.el-row) {
  @media (max-width: 768px) {
    .el-col {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
