<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import {
  addWarehouseApi,
  updateWarehouseApi,
  getWarehouseListApi
} from "@/api/warehouse/index";
import { getGoodsListApi } from "@/api/warehouse/goods";
import { Delete } from "@element-plus/icons-vue";
import { getCountriesListApi } from "@/api/system/countries";
import { getCountryColorStyle } from "@/utils/countryColors";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ""
  },
  row: {
    type: Object,
    default: () => ({})
  },
  isView: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const goodsLoading = ref(false);
const goodsList = ref([]);
const countriesList = ref([]);
const countriesLoading = ref(false);
const countryFilter = ref("");

const getGoodsList = async () => {
  goodsLoading.value = true;
  try {
    console.log("开始请求货品列表API");
    const response = await getGoodsListApi({
      pageSize: 100 // 获取较多数据以供选择
    });

    console.log("货品列表API原始响应:", response);

    // 检查响应结构
    if (response && typeof response === "object") {
      if (response.data && typeof response.data === "object") {
        if (response.data.data && Array.isArray(response.data.data.data)) {
          // 如果是嵌套的data.data.data结构
          goodsList.value = response.data.data.data;
          console.log("解析方式1 - 嵌套data结构:", goodsList.value.length);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 如果是data.data数组结构
          goodsList.value = response.data.data;
          console.log("解析方式2 - data数组结构:", goodsList.value.length);
        } else if (Array.isArray(response.data)) {
          // 如果直接是data数组
          goodsList.value = response.data;
          console.log("解析方式3 - 直接数组结构:", goodsList.value.length);
        } else {
          console.error("无法识别的数据结构:", response.data);
          goodsList.value = [];
        }
      } else {
        console.error("API响应缺少data字段");
        goodsList.value = [];
      }
    } else {
      console.error("API响应缺少data字段");
      goodsList.value = [];
    }
  } catch (error) {
    console.error("获取货品列表失败:", error);
    goodsList.value = [];
  } finally {
    goodsLoading.value = false;
  }
};

const getCountriesList = async () => {
  countriesLoading.value = true;
  try {
    // 添加pageSize参数获取更多国家数据
    const response = await getCountriesListApi({
      pageSize: 100, // 获取最多100条国家数据
      status: "1" // 只获取启用状态的国家
    });

    if (response && response.code === 0 && response.data) {
      // 确保数据结构正确
      countriesList.value = Array.isArray(response.data.data)
        ? response.data.data.map(item => ({
            ...item,
            code: item.code || "",
            name_zh: item.name_zh || item.code || "",
            name_en: item.name_en || ""
          }))
        : [];
      console.log(`成功获取${countriesList.value.length}个国家`);
    } else {
      console.error("获取国家列表失败:", response);
      countriesList.value = [];
    }
  } catch (error) {
    console.error("获取国家列表失败:", error);
    countriesList.value = [];
  } finally {
    countriesLoading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    if (val) {
      console.log("对话框打开，加载货品列表和国家列表");
      getGoodsList();
      getCountriesList();
    }
  }
);

onMounted(() => {
  if (props.visible) {
    console.log("组件挂载且对话框可见，加载货品列表");
    getGoodsList();
  }

  // 添加日志记录当前表单数据
  console.log("表单初始数据:", formData);
});

const formData = reactive({
  id: undefined,
  name: "",
  status: "1",
  remark: "",
  goods_ids: [],
  country: "",
  address: "",
  contact: "",
  phone: ""
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入仓库名称", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
});

watch(
  () => props.row,
  val => {
    console.log("接收到的原始数据:", val);

    if (val && Object.keys(val).length > 0) {
      // 先复制基本字段
      Object.assign(formData, val);

      // 确保状态是字符串类型
      formData.status = String(formData.status);

      // 处理可能的字段名称不匹配
      // 仓库地址 - 可能的字段名：address, warehouse_address
      formData.address = val.address || val.warehouse_address || "";

      // 联系人 - 可能的字段名：contact, contact_name, contact_person
      formData.contact =
        val.contact || val.contact_name || val.contact_person || "";

      // 联系电话 - 可能的字段名：phone, contact_phone, phone_number
      formData.phone = val.phone || val.contact_phone || val.phone_number || "";

      // 处理国家字段
      formData.country = val.country || "";

      console.log("处理后的表单数据:", formData);

      // 正确获取货品ID
      if (val.goods && Array.isArray(val.goods)) {
        // 修正：使用goods_id而不是id
        formData.goods_ids = val.goods.map(item => item.goods_id);
        console.log("设置已关联货品IDs:", formData.goods_ids);
      } else {
        formData.goods_ids = [];
      }
    } else {
      // 重置表单
      formData.id = undefined;
      formData.name = "";
      formData.status = "1";
      formData.remark = "";
      formData.goods_ids = [];
      formData.country = "";
      formData.address = "";
      formData.contact = "";
      formData.phone = "";
    }
  },
  { immediate: true, deep: true }
);

// 在对话框打开时记录数据
watch(
  () => dialogVisible.value,
  val => {
    if (val) {
      console.log("对话框打开，当前表单数据:", formData);
      console.log("当前row数据:", props.row);
    }
  }
);

const handleClose = () => {
  dialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        const submitData = {
          name: formData.name,
          status: formData.status,
          remark: formData.remark,
          goods_ids: formData.goods_ids,
          country: formData.country,
          address: formData.address,
          contact: formData.contact,
          phone: formData.phone
        };

        if (formData.id) {
          // 更新
          await updateWarehouseApi(formData.id, submitData);
          message("更新成功", { type: "success" });
        } else {
          // 新增
          await addWarehouseApi(submitData);
          message("新增成功", { type: "success" });
        }

        dialogVisible.value = false;
        emit("success");
      } catch (error) {
        console.error("提交失败:", error);
        message("操作失败", { type: "error" });
      } finally {
        loading.value = false;
      }
    }
  });
};

// 添加清空可入库货品的方法
const clearGoodsSelection = () => {
  formData.goods_ids = [];
  // 可选：添加提示
  message("已清空可入库货品", { type: "info" });
};

// 国家选择器筛选方法
const filterCountries = (query, item) => {
  if (!query) return true;
  if (!item) return false;

  query = query.toLowerCase();
  return (
    (item.name_zh && item.name_zh.toLowerCase().includes(query)) ||
    (item.name_en && item.name_en.toLowerCase().includes(query)) ||
    (item.code && item.code.toLowerCase().includes(query)) ||
    (item.code2 && item.code2.toLowerCase().includes(query))
  );
};

// 保留格式化国家标签显示函数
const formatCountryLabel = item => {
  if (!item) return "";
  return item?.name_zh
    ? `${item.name_zh} (${item?.name_en || ""})`
    : item?.code || "";
};

// 保留但不再需要样式相关的函数
// const getCountryStyle = code => {
//   return getCountryColorStyle(code);
// };

// 保留但不再使用
// const findCountryNameByCode = code => {
//   const country = countriesList.value.find(item => item.code === code);
//   return country?.name_zh || code;
// };
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="700"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :disabled="isView"
    >
      <el-form-item label="仓库名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入仓库名称" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="10">
          <el-form-item
            label="国家"
            prop="country"
            :rules="[
              { required: true, message: '请选择国家', trigger: 'change' }
            ]"
          >
            <el-select
              v-model="formData.country"
              placeholder="请选择或搜索国家"
              filterable
              :loading="countriesLoading"
              :filter-method="filterCountries"
              style="width: 100%"
            >
              <!-- 移除自定义选中标签 -->
              <!-- <template #tag="{ item }">
                <el-tag
                  :style="{...}"
                  disable-transitions
                  class="country-selected-tag"
                >
                  {{ findCountryNameByCode(item.value) }}
                </el-tag>
              </template> -->

              <!-- 简化选项列表 -->
              <el-option
                v-for="item in countriesList"
                :key="item?.code || item?.id || index"
                :value="item?.code || ''"
                :label="formatCountryLabel(item)"
              >
                <div class="country-simple-option">
                  <span>{{ item?.name_zh || item?.code || "" }}</span>
                  <span v-if="item?.name_en" class="country-en-name">
                    {{ item.name_en }} ({{ item?.code || "" }})
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="14">
          <el-form-item
            label="仓库地址"
            prop="address"
            :rules="[
              { required: true, message: '请输入仓库地址', trigger: 'blur' }
            ]"
          >
            <el-input v-model="formData.address" placeholder="请输入仓库地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contact" label-width="100px">
            <el-input
              v-model="formData.contact"
              placeholder="请输入联系人姓名"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone" label-width="100px">
            <el-input v-model="formData.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="可入库货品" prop="goods_ids">
        <div class="goods-selection-container">
          <el-select
            v-model="formData.goods_ids"
            multiple
            filterable
            placeholder="请选择可入库货品"
            style="width: 100%"
            :loading="goodsLoading"
          >
            <el-option
              v-for="item in goodsList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div style="display: flex; align-items: center">
                <span>{{ item.name }}</span>
                <div
                  v-if="item.aliases && item.aliases.length > 0"
                  style="margin-left: 8px"
                >
                  <el-tag
                    v-for="alias in item.aliases.slice(0, 2)"
                    :key="alias.id"
                    size="small"
                    type="info"
                    effect="plain"
                    style="margin-left: 4px"
                  >
                    {{ alias.region }}
                  </el-tag>
                  <el-tag
                    v-if="item.aliases.length > 2"
                    size="small"
                    type="info"
                    effect="plain"
                    style="margin-left: 4px"
                  >
                    +{{ item.aliases.length - 2 }}
                  </el-tag>
                </div>
              </div>
            </el-option>
          </el-select>

          <!-- 添加清除按钮 -->
          <el-tooltip content="清空所有已选货品" placement="top">
            <el-button
              class="clear-goods-btn"
              type="danger"
              :icon="Delete"
              link
              :disabled="!formData.goods_ids.length || isView"
              @click="clearGoodsSelection"
            >
              清空
            </el-button>
          </el-tooltip>
        </div>

        <!-- 修改提示信息的样式 -->
        <div v-if="!formData.goods_ids.length" class="goods-hint">
          <el-alert
            title="提示：不选择货品表示该仓库不限制可入库货品类型"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="'1'">启用</el-radio>
          <el-radio :value="'0'">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="3"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="!isView"
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.goods-selection-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%; /* 确保容器占满宽度 */
}

.goods-hint {
  margin-top: 12px; /* 增加上边距 */
  width: 100%; /* 确保提示占满宽度 */
  display: block; /* 确保是块级元素 */
}

.clear-goods-btn {
  flex-shrink: 0;
}

.country-simple-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.country-en-name {
  color: #8492a6;
  font-size: 13px;
}

/* 更新国家选项样式为简单格式 */
.country-simple-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.country-en-name {
  color: #8492a6;
  font-size: 13px;
}

/* 移除不再需要的样式 */
/* .country-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  display: inline-block;
}

.country-selected-tag {
  margin-right: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
} */
</style>
