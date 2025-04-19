<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Upload from "@iconify-icons/ep/upload";

defineOptions({
  name: "PurchaseOrderForm"
});

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: "新增"
  },
  row: {
    type: Object,
    default: () => ({})
  },
  supplierOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["update:visible", "success"]);

// 表单数据
const formRef = ref();
const loading = ref(false);
const orderNumber = ref(""); // 自动生成的订单编号

// 初始化表单数据
const formData = reactive({
  orderNumber: "",
  orderDate: new Date(),
  supplierId: "",
  purchaseUserId: "",
  notes: "",
  attachment: "",
  products: [
    {
      id: 1,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      amount: 0,
      taxAmount: 0,
      totalAmount: 0
    }
  ],
  discountRate: 0,
  discountAmount: 0,
  afterDiscountAmount: 0,
  accountId: "",
  paidAmount: 0
});

// 销售人员选项
const purchaseUserOptions = ref([
  { label: "张三", value: 1 },
  { label: "李四", value: 2 },
  { label: "王五", value: 3 }
]);

// 结算账户选项
const accountOptions = ref([
  { label: "现金账户", value: 1 },
  { label: "银行账户", value: 2 },
  { label: "支付宝", value: 3 },
  { label: "微信支付", value: 4 }
]);

// 表单验证规则
const rules = {
  supplierId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  orderDate: [{ required: true, message: "请选择订单日期", trigger: "change" }],
  purchaseUserId: [
    { required: true, message: "请选择采购员", trigger: "change" }
  ]
};

// 选择产品时的产品选项
const productOptions = ref([
  { label: "产品A", value: "产品A", price: 100 },
  { label: "产品B", value: "产品B", price: 200 },
  { label: "产品C", value: "产品C", price: 300 }
]);

// 自动生成订单号
const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `PO${year}${month}${day}${random}`;
};

// 添加商品行
const addProductRow = () => {
  const newId =
    formData.products.length > 0
      ? Math.max(...formData.products.map(p => p.id)) + 1
      : 1;

  formData.products.push({
    id: newId,
    productName: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
    amount: 0,
    taxAmount: 0,
    totalAmount: 0
  });
};

// 删除商品行
const removeProductRow = index => {
  if (formData.products.length <= 1) {
    ElMessage.warning("至少保留一个商品项");
    return;
  }
  formData.products.splice(index, 1);
  calculateTotals();
};

// 选择产品时自动填充单价
const handleProductChange = (productName, index) => {
  const product = productOptions.value.find(p => p.value === productName);
  if (product) {
    formData.products[index].unitPrice = product.price;
    calculateRowAmounts(index);
  }
};

// 计算行金额
const calculateRowAmounts = index => {
  const row = formData.products[index];
  // 金额 = 数量 * 单价
  row.amount = row.quantity * row.unitPrice;
  // 税额 = 金额 * 税率
  row.taxAmount = row.amount * (row.taxRate / 100);
  // 含税合计 = 金额 + 税额
  row.totalAmount = row.amount + row.taxAmount;

  // 重新计算总计
  calculateTotals();
};

// 计算总计金额
const calculateTotals = () => {
  // 计算所有产品的总金额
  const totalAmount = formData.products.reduce(
    (sum, product) => sum + product.totalAmount,
    0
  );

  // 优惠金额 = 总金额 * 优惠率
  formData.discountAmount = totalAmount * (formData.discountRate / 100);

  // 优惠后金额 = 总金额 - 优惠金额
  formData.afterDiscountAmount = totalAmount - formData.discountAmount;
};

// 监听折扣率变化
watch(
  () => formData.discountRate,
  () => {
    calculateTotals();
  }
);

// 处理优惠金额直接输入
watch(
  () => formData.discountAmount,
  () => {
    const totalAmount = formData.products.reduce(
      (sum, product) => sum + product.totalAmount,
      0
    );
    if (totalAmount > 0) {
      // 重新计算优惠率
      formData.discountRate = (formData.discountAmount / totalAmount) * 100;
      // 计算优惠后金额
      formData.afterDiscountAmount = totalAmount - formData.discountAmount;
    }
  }
);

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        // 这里应该调用API保存订单
        console.log("提交的表单数据:", formData);

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));

        ElMessage.success("保存成功");
        closeDialog(true);
      } catch (error) {
        console.error("保存失败", error);
        ElMessage.error("保存失败，请重试");
      } finally {
        loading.value = false;
      }
    }
  });
};

// 关闭对话框
const closeDialog = (isSuccess = false) => {
  emit("update:visible", false);
  if (isSuccess) {
    emit("success");
  }
};

// 上传文件变化
const handleFileChange = file => {
  console.log("上传文件:", file);
};

// 组件挂载时生成订单号
onMounted(() => {
  formData.orderNumber = generateOrderNumber();
});

// 单行合计，仅用于展示
const rowTotal = index => {
  const product = formData.products[index];
  return product ? `${product.totalAmount.toFixed(2)}` : "0.00";
};

// 商品总合计
const productTotalAmount = computed(() => {
  return formData.products
    .reduce((sum, product) => {
      return sum + product.totalAmount;
    }, 0)
    .toFixed(2);
});

// 设置表单初始数据
const setFormData = () => {
  if (props.row && Object.keys(props.row).length > 0) {
    // 编辑模式，使用传入的行数据
    Object.assign(formData, props.row);
  } else {
    // 新增模式，重置表单并生成新订单号
    formData.orderNumber = generateOrderNumber();
    formData.orderDate = new Date();
    formData.supplierId = "";
    formData.purchaseUserId = "";
    formData.notes = "";
    formData.attachment = "";
    formData.products = [
      {
        id: 1,
        productName: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        amount: 0,
        taxAmount: 0,
        totalAmount: 0
      }
    ];
    formData.discountRate = 0;
    formData.discountAmount = 0;
    formData.afterDiscountAmount = 0;
    formData.accountId = "";
    formData.paidAmount = 0;
  }
};

// 监听弹窗显示状态
watch(
  () => props.visible,
  val => {
    if (val) {
      setFormData();
    }
  },
  { immediate: true }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    width="80%"
    @update:model-value="val => emit('update:visible', val)"
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      class="purchase-form"
    >
      <!-- 基本信息部分 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="订单编号" prop="orderNumber">
            <el-input
              v-model="formData.orderNumber"
              disabled
              placeholder="保存时自动生成"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="订单日期" prop="orderDate">
            <el-date-picker
              v-model="formData.orderDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="supplierId">
            <el-select
              v-model="formData.supplierId"
              placeholder="请选择供应商"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="item in supplierOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="采购员" prop="purchaseUserId">
            <el-select
              v-model="formData.purchaseUserId"
              placeholder="请选择采购员"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="item in purchaseUserOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注" prop="notes">
            <el-input
              v-model="formData.notes"
              type="textarea"
              :rows="1"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="附件" prop="attachment">
            <el-upload
              action="#"
              :auto-upload="false"
              :limit="1"
              @change="handleFileChange"
            >
              <el-button :icon="useRenderIcon(Upload)">选取文件</el-button>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 商品明细表格 -->
      <div class="product-list-container">
        <div class="product-list-header">
          <span>订单产品清单</span>
          <el-button type="primary" size="small" @click="addProductRow"
            >+ 添加产品行</el-button
          >
        </div>

        <el-table :data="formData.products" border stripe class="product-table">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">
              <span>{{ $index + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="产品名称" min-width="180">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.productName"
                placeholder="请选择产品"
                style="width: 100%"
                @change="val => handleProductChange(val, $index)"
              >
                <el-option
                  v-for="item in productOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="数量" width="100">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                controls-position="right"
                style="width: 100%"
                @change="() => calculateRowAmounts($index)"
              />
            </template>
          </el-table-column>

          <el-table-column label="单价" width="120">
            <template #default="{ row, $index }">
              <el-input
                v-model.number="row.unitPrice"
                type="number"
                placeholder="0.00"
                @input="() => calculateRowAmounts($index)"
              />
            </template>
          </el-table-column>

          <el-table-column label="金额" width="120">
            <template #default="{ row }">
              <span>{{ row.amount.toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="税率 (%)" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.taxRate"
                :min="0"
                :max="100"
                controls-position="right"
                @change="() => calculateRowAmounts($index)"
              />
            </template>
          </el-table-column>

          <el-table-column label="税额" width="120">
            <template #default="{ row }">
              <span>{{ row.taxAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="税额合计" width="120">
            <template #default="{ row }">
              <span>{{ row.totalAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removeProductRow($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 底部合计部分 -->
      <div class="order-footer">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优惠率 (%)" prop="discountRate">
              <el-input-number
                v-model="formData.discountRate"
                :min="0"
                :max="100"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优惠金额" prop="discountAmount">
              <el-input
                v-model.number="formData.discountAmount"
                type="number"
                placeholder="0.00"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优惠后金额" prop="afterDiscountAmount">
              <el-input
                v-model="formData.afterDiscountAmount"
                disabled
                placeholder="0.00"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="结算账户" prop="accountId">
              <el-select
                v-model="formData.accountId"
                placeholder="请选择结算账户"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="item in accountOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收取订金" prop="paidAmount">
              <el-input
                v-model.number="formData.paidAmount"
                type="number"
                placeholder="0.00"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" :loading="loading" @click="submitForm">
          确 定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.purchase-form {
  margin: 10px 0;
}

.product-list-container {
  margin: 20px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.product-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
}

.product-table {
  width: 100%;
}

.order-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ebeef5;
}

.dialog-footer {
  text-align: right;
}
</style>
