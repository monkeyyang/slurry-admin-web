<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import { formRules } from "./utils/rule";
import { usePublicHooks } from "../hooks";
import { MenuRequest } from "@/api/system/menu";
import IconSelect from "@/components/ReIcon/src/Select.vue";

interface FormProps {
  formInline: MenuRequest;
  higherMenuOptions: any[];
}

// TODO 为什么这里设置的rank: 1是不生效的,而hook那边定义的才能生效   到底需不需要 这个withDefaults
const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: 0,
    parent_id: 0,
    name: "",
    router_name: "",
    path: "",
    status: 1,
    is_button: undefined,
    permission: "",
    type: undefined,
    meta: {}
  }),
  higherMenuOptions: () => []
});

const ruleFormRef = ref();
const { switchStyle } = usePublicHooks();
const newFormInline = ref(props.formInline);
const deptOptions = ref(props.higherMenuOptions);

const typeName = computed(() => {
  return newFormInline.value.is_button ? "按钮" : "菜单";
});

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item label="父菜单">
          <el-cascader
            class="w-full"
            v-model="newFormInline.parent_id"
            :options="deptOptions"
            :props="{
              value: 'id',
              label: 'name',
              emitPath: false,
              checkStrictly: true
            }"
            clearable
            placeholder="请选择父菜单（不选则为根目录菜单）"
          />
          <!-- 这种写法可以自定义选项的内容 比如括号后面加上子节点的数字 -->
          <!-- <template #default="{ node, data }">
              <span>{{ data.deptName }}</span>
              <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
            </template> -->
          <!-- </el-cascader> -->
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="类型">
          <el-radio-group
            v-model="newFormInline.is_button"
            :disabled="newFormInline.id !== 0"
          >
            <el-radio :label="0">菜单</el-radio>
            <el-radio :label="1">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
      </re-col>
      <template v-if="!newFormInline.is_button">
        <re-col :value="24">
          <el-form-item label="菜单类型">
            <el-radio-group
              v-model="newFormInline.type"
              :disabled="newFormInline.id !== 0"
            >
              <el-radio :label="'PAGE'">页面</el-radio>
              <el-radio :label="'CATALOG'">目录</el-radio>
              <el-radio :label="'IFRAME'">内嵌Iframe</el-radio>
              <el-radio :label="'REDIRECT'">外链跳转</el-radio>
            </el-radio-group>
          </el-form-item>
        </re-col>
      </template>
    </el-row>
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item :label="`${typeName}图标`" prop="meta.icon">
          <IconSelect v-model="newFormInline.meta.icon" />
        </el-form-item>
      </re-col>
    </el-row>
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item :label="`${typeName}名称`" prop="name">
          <el-input
            v-model="newFormInline.name"
            clearable
            :placeholder="`请输入${typeName}名称`"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="权限标识" prop="permission">
          <template v-slot:label>
            <el-tooltip content="这是权限标识" placement="top">
              <span>权限标识</span>
            </el-tooltip>
          </template>
          <el-input
            v-model="newFormInline.permission"
            clearable
            placeholder="请输入权限标识"
          />
        </el-form-item>
      </re-col>
    </el-row>

    <el-row v-if="!newFormInline.is_button" :gutter="30">
      <template v-if="newFormInline.type === 'PAGE'">
        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="页面路径" prop="path">
            <el-input
              v-model="newFormInline.path"
              clearable
              placeholder="请输入前端项目views文件内的页面路径"
            />
          </el-form-item>
        </re-col>
        <re-col :value="12">
          <el-form-item label="组件名">
            <el-input
              v-model="newFormInline.router_name"
              clearable
              placeholder="请输入组件定义的name，defineOptions中的name"
            />
          </el-form-item>
        </re-col>
      </template>
      <template v-else-if="newFormInline.type === 'CATALOG'">
        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="路由地址" prop="path">
            <el-input
              v-model="newFormInline.path"
              clearable
              placeholder="请输入目录的路由地址以/开头"
            />
          </el-form-item>
        </re-col>
      </template>
      <template v-else-if="newFormInline.type === 'IFRAME'">
        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="网站地址" prop="meta.frameSrc">
            <el-input
              v-model="newFormInline.meta.frameSrc"
              clearable
              placeholder="请输入外部网站地址或者内部网站相对地址"
            />
          </el-form-item>
        </re-col>
      </template>

      <template v-else-if="newFormInline.type === 'REDIRECT'">
        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="网站地址" prop="router_name">
            <!-- 这里需要做拦截处理 -->
            <el-input
              v-model="newFormInline.router_name"
              clearable
              placeholder="请输入外部网站地址，必须以https://或者http://开头"
            />
          </el-form-item>
        </re-col>
      </template>
    </el-row>

    <el-row>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="显示">
          <el-switch
            v-model="newFormInline.meta.showLink"
            inline-prompt
            :active-value="true"
            :inactive-value="false"
            active-text="显示"
            inactive-text="隐藏"
            :style="switchStyle"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="状态">
          <el-switch
            v-model="newFormInline.status"
            inline-prompt
            :active-value="'ENABLED'"
            :inactive-value="'DISABLED'"
            active-text="启用"
            inactive-text="停用"
            :style="switchStyle"
          />
        </el-form-item>
      </re-col>
    </el-row>
    <el-row>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="排序">
          <el-input-number
            v-model="newFormInline.meta.rank"
            :min="0"
            :max="999"
            controls-position="right"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
