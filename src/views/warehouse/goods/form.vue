<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { addGoodsApi, updateGoodsApi } from "@/api/warehouse/goods";
import { useUserStoreHook } from "@/store/modules/user";
import { Plus, Delete } from "@element-plus/icons-vue";

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

const formRef = ref<FormInstance>();
const loading = ref(false);

// 国家选项
const countryOptions = [
  { label: "美国", value: "US" },
  { label: "加拿大", value: "CA" },
  { label: "英国", value: "UK" },
  { label: "法国", value: "FR" },
  { label: "德国", value: "DE" },
  { label: "日本", value: "JP" },
  { label: "中国", value: "CN" },
  { label: "韩国", value: "KR" }
];

const formData = reactive({
  id: undefined,
  name: "",
  aliases: []
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入货物名称", trigger: "blur" }]
});

watch(
  () => props.visible,
  val => {
    if (val && props.row.id) {
      // 编辑或查看时，使用传入的行数据
      Object.assign(formData, props.row);
      // 确保别名是数组
      if (!formData.aliases) {
        formData.aliases = [];
      }
    }
  }
);

watch(
  () => props.row,
  val => {
    if (val && Object.keys(val).length > 0) {
      Object.assign(formData, val);
      // 确保别名是数组
      if (!formData.aliases) {
        formData.aliases = [];
      }
    }
  },
  { immediate: true, deep: true }
);

// 添加别名
const addAlias = () => {
  formData.aliases.push({ region: "", name: "" });
};

// 删除别名
const removeAlias = (index: number) => {
  formData.aliases.splice(index, 1);
};

const submit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        // 过滤掉空的别名
        const validAliases = formData.aliases.filter(
          alias => alias.region && alias.name
        );

        const dataToSubmit = {
          ...formData,
          aliases: validAliases
        };

        if (formData.id) {
          await updateGoodsApi(formData.id, dataToSubmit);
          message("修改成功", { type: "success" });
        } else {
          await addGoodsApi(dataToSubmit);
          message("新增成功", { type: "success" });
        }
        close();
        emit("success");
      } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.message) {
            message(errorData.message, { type: "error" });
          } else {
            message("操作失败", { type: "error" });
          }
        } else {
          message("操作失败", { type: "error" });
        }
      } finally {
        loading.value = false;
      }
    }
  });
};

const close = () => {
  emit("update:visible", false);
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: undefined,
    name: "",
    aliases: []
  });
};
</script>

<template>
  <el-dialog
    :title="`${title}货物`"
    :model-value="visible"
    :close-on-click-modal="false"
    width="700px"
    @update:model-value="$emit('update:visible', $event)"
    @closed="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="84px"
      :disabled="isView"
    >
      <el-form-item label="货物名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入货物名称"
          :style="{ width: '100%' }"
        />
      </el-form-item>

      <el-form-item label="别名列表">
        <div class="aliases-container">
          <div v-if="formData.aliases.length === 0" class="empty-aliases">
            <el-alert
              title="别名管理说明"
              type="info"
              :closable="false"
              show-icon
            >
              <div class="alias-tips">
                <p>• 每个货物可以设置多个不同国家的别名，用于入库单匹配</p>
                <p>
                  • 例如：iPhone 15 Pro Max 在法国可能显示为 "iPhone 15 Pro Max
                  256 Go"
                </p>
                <p>• 添加别名时请注意：</p>
                <p class="indent">
                  ◦ 国家代码需要准确填写（如：FR代表法国，US代表美国）
                </p>
                <p class="indent">◦ 别名需要与入库单上的商品名称完全匹配</p>
                <p class="indent">◦ 同一个国家可以添加多个不同的别名</p>
                <p>
                  • 当导入入库单时，系统会自动根据国家和商品名称匹配对应的货物
                </p>
              </div>
            </el-alert>
          </div>

          <div
            v-for="(alias, index) in formData.aliases"
            :key="index"
            class="alias-item"
          >
            <el-form-item
              :prop="`aliases.${index}.region`"
              :rules="[
                { required: true, message: '请选择地区', trigger: 'change' }
              ]"
              class="mb-0 alias-region-item"
            >
              <el-select
                v-model="alias.region"
                placeholder="选择国家"
                class="country-select"
              >
                <el-option
                  v-for="option in countryOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              :prop="`aliases.${index}.name`"
              :rules="[
                { required: true, message: '请输入别名', trigger: 'blur' }
              ]"
              class="mb-0 alias-name-item"
            >
              <el-input
                v-model="alias.name"
                placeholder="输入该国家/地区的商品名称"
                class="alias-input"
              />
            </el-form-item>

            <el-button
              type="danger"
              :icon="Delete"
              circle
              class="remove-btn"
              @click="removeAlias(index)"
            />
          </div>

          <el-button
            type="primary"
            :icon="Plus"
            class="add-alias-btn"
            @click="addAlias"
          >
            添加别名
          </el-button>
        </div>
      </el-form-item>

      <el-form-item v-if="false" label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in useUserStoreHook().dictionaryList['common.status']"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="false" label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入内容"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
          :style="{ width: '100%' }"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取 消</el-button>
      <el-button
        v-if="!isView"
        type="primary"
        :loading="loading"
        @click="submit"
      >
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.aliases-container {
  width: 100%;
}

.empty-aliases {
  margin-bottom: 15px;
}

.alias-tips {
  font-size: 13px;
  line-height: 1.5;

  .indent {
    padding-left: 20px;
  }
}

.alias-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.alias-region-item {
  margin-right: 10px;
  width: 120px;
}

.alias-name-item {
  flex: 1;
  margin-right: 10px;
}

.country-select {
  width: 100%;
}

.alias-input {
  width: 100%;
}

.remove-btn {
  flex-shrink: 0;
  margin-top: 4px;
}

.add-alias-btn {
  margin-top: 10px;
}
</style>
