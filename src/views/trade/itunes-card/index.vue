<template>
  <div class="card-trade-container">
    <!-- 国家列表卡片 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>iTunes礼品卡交易配置管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="addCountryConfig">
              <el-icon><Plus /></el-icon> 添加国家配置
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="countryConfigs"
        style="width: 100%"
        border
      >
        <el-table-column prop="country" label="国家代码" width="100" />
        <el-table-column prop="countryName" label="国家名称" width="150" />
        <el-table-column label="快卡卡图汇率" width="120">
          <template #default="scope">
            <span>{{ scope.row.fastCard.image.rate.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="快卡卡图面额约束" width="180">
          <template #default="scope">
            <span
              v-if="scope.row.fastCard.image.amountConstraint === 'multiple'"
              >倍数({{ scope.row.fastCard.image.multipleBase }})</span
            >
            <span
              v-else-if="scope.row.fastCard.image.amountConstraint === 'all'"
              >全面值</span
            >
            <span v-else>无约束</span>
          </template>
        </el-table-column>
        <el-table-column label="快卡卡密汇率" width="120">
          <template #default="scope">
            <span>{{ scope.row.fastCard.code.rate.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="快卡卡密面额约束" width="180">
          <template #default="scope">
            <span v-if="scope.row.fastCard.code.amountConstraint === 'multiple'"
              >倍数({{ scope.row.fastCard.code.multipleBase }})</span
            >
            <span v-else-if="scope.row.fastCard.code.amountConstraint === 'all'"
              >全面值</span
            >
            <span v-else>无约束</span>
          </template>
        </el-table-column>
        <el-table-column label="慢卡卡图汇率" width="120">
          <template #default="scope">
            <span>{{ scope.row.slowCard.image.rate.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="慢卡卡图面额约束" width="180">
          <template #default="scope">
            <span
              v-if="scope.row.slowCard.image.amountConstraint === 'multiple'"
              >倍数({{ scope.row.slowCard.image.multipleBase }})</span
            >
            <span
              v-else-if="scope.row.slowCard.image.amountConstraint === 'all'"
              >全面值</span
            >
            <span v-else>无约束</span>
          </template>
        </el-table-column>
        <el-table-column label="慢卡卡密汇率" width="120">
          <template #default="scope">
            <span>{{ scope.row.slowCard.code.rate.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="慢卡卡密面额约束" width="180">
          <template #default="scope">
            <span v-if="scope.row.slowCard.code.amountConstraint === 'multiple'"
              >倍数({{ scope.row.slowCard.code.multipleBase }})</span
            >
            <span v-else-if="scope.row.slowCard.code.amountConstraint === 'all'"
              >全面值</span
            >
            <span v-else>无约束</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="240">
          <template #default="scope">
            <el-button type="primary" @click="editCountryConfig(scope.row)"
              >编辑</el-button
            >
            <el-button type="success" @click="previewCountryConfig(scope.row)"
              >预览</el-button
            >
            <el-button type="danger" @click="handleDeleteConfig(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑表单卡片 -->
    <el-card v-if="showEditForm">
      <template #header>
        <div class="card-header">
          <span
            >{{ currentEditingId ? "编辑" : "新增" }}国家配置:
            {{ form.countryName }}</span
          >
          <div class="header-actions">
            <el-button type="success" @click="saveTemplateDialogVisible = true">
              <el-icon><Document /></el-icon> 保存为模板
            </el-button>
            <el-button type="primary" @click="handleSave">
              <el-icon><Check /></el-icon> 保存配置
            </el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" label-width="120px">
        <!-- 卡片信息设置 -->
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="section-header">
              <el-icon :size="20" color="#409EFF"><InfoFilled /></el-icon>
              <span class="section-title">基础信息</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="国家/地区">
                <el-select
                  v-model="form.country"
                  placeholder="选择国家/地区"
                  :disabled="!!currentEditingId"
                >
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
              <el-form-item label="国家名称">
                <el-input
                  v-model="form.countryName"
                  placeholder="例如: 加拿大"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 快卡设置 -->
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="section-header">
              <el-icon :size="20" color="#67C23A"><Timer /></el-icon>
              <span class="section-title">快卡设置</span>
            </div>
          </template>

          <!-- 快卡-卡图设置 -->
          <el-collapse>
            <el-collapse-item title="卡图设置" name="fastCardImage">
              <el-form-item label="启用快卡卡图">
                <el-switch v-model="form.fastCard.image.enabled" />
              </el-form-item>

              <template v-if="form.fastCard.image.enabled">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="卡图汇率">
                      <el-input-number
                        v-model="form.fastCard.image.rate"
                        :precision="2"
                        :step="0.01"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最小面额">
                      <el-input-number
                        v-model="form.fastCard.image.minAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最大面额">
                      <el-input-number
                        v-model="form.fastCard.image.maxAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="面额约束">
                  <el-radio-group
                    v-model="form.fastCard.image.amountConstraint"
                  >
                    <el-radio value="none">无约束</el-radio>
                    <el-radio value="multiple">倍数要求</el-radio>
                    <el-radio value="all">全面值</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item
                  v-if="form.fastCard.image.amountConstraint === 'multiple'"
                  label="倍数基数"
                >
                  <el-input-number
                    v-model="form.fastCard.image.multipleBase"
                    :min="1"
                  />
                </el-form-item>

                <el-divider>卡图备注</el-divider>
                <el-form-item>
                  <div class="remarks-container">
                    <div
                      v-for="(remark, index) in form.fastCard.image.remarks"
                      :key="index"
                      class="remark-item"
                    >
                      <el-input
                        v-model="form.fastCard.image.remarks[index]"
                        placeholder="添加备注"
                      />
                      <el-button
                        type="danger"
                        circle
                        @click="removeRemark('', 'fast', CardType.IMAGE, index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <el-button
                      type="primary"
                      @click="addRemark('', 'fast', CardType.IMAGE)"
                      >添加备注</el-button
                    >
                  </div>
                </el-form-item>
              </template>
            </el-collapse-item>

            <!-- 快卡-卡密设置 -->
            <el-collapse-item title="卡密设置" name="fastCardCode">
              <el-form-item label="启用快卡卡密">
                <el-switch v-model="form.fastCard.code.enabled" />
              </el-form-item>

              <template v-if="form.fastCard.code.enabled">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="卡密汇率">
                      <el-input-number
                        v-model="form.fastCard.code.rate"
                        :precision="2"
                        :step="0.01"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最小面额">
                      <el-input-number
                        v-model="form.fastCard.code.minAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最大面额">
                      <el-input-number
                        v-model="form.fastCard.code.maxAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="面额约束">
                  <el-radio-group v-model="form.fastCard.code.amountConstraint">
                    <el-radio value="none">无约束</el-radio>
                    <el-radio value="multiple">倍数要求</el-radio>
                    <el-radio value="all">全面值</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item
                  v-if="form.fastCard.code.amountConstraint === 'multiple'"
                  label="倍数基数"
                >
                  <el-input-number
                    v-model="form.fastCard.code.multipleBase"
                    :min="1"
                  />
                </el-form-item>

                <el-divider>卡密备注</el-divider>
                <el-form-item>
                  <div class="remarks-container">
                    <div
                      v-for="(remark, index) in form.fastCard.code.remarks"
                      :key="index"
                      class="remark-item"
                    >
                      <el-input
                        v-model="form.fastCard.code.remarks[index]"
                        placeholder="添加备注"
                      />
                      <el-button
                        type="danger"
                        circle
                        @click="removeRemark('', 'fast', CardType.CODE, index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <el-button
                      type="primary"
                      @click="addRemark('', 'fast', CardType.CODE)"
                      >添加备注</el-button
                    >
                  </div>
                </el-form-item>
              </template>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 慢卡设置 -->
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="section-header">
              <el-icon :size="20" color="#E6A23C"><AlarmClock /></el-icon>
              <span class="section-title">慢卡设置</span>
            </div>
          </template>

          <!-- 慢卡-卡图设置 -->
          <el-collapse>
            <el-collapse-item title="卡图设置" name="slowCardImage">
              <el-form-item label="启用慢卡卡图">
                <el-switch v-model="form.slowCard.image.enabled" />
              </el-form-item>

              <template v-if="form.slowCard.image.enabled">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="卡图汇率">
                      <el-input-number
                        v-model="form.slowCard.image.rate"
                        :precision="2"
                        :step="0.01"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最小面额">
                      <el-input-number
                        v-model="form.slowCard.image.minAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最大面额">
                      <el-input-number
                        v-model="form.slowCard.image.maxAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="面额约束">
                  <el-radio-group
                    v-model="form.slowCard.image.amountConstraint"
                  >
                    <el-radio value="none">无约束</el-radio>
                    <el-radio value="multiple">倍数要求</el-radio>
                    <el-radio value="all">全面值</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item
                  v-if="form.slowCard.image.amountConstraint === 'multiple'"
                  label="倍数基数"
                >
                  <el-input-number
                    v-model="form.slowCard.image.multipleBase"
                    :min="1"
                  />
                </el-form-item>

                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="次要汇率">
                      <el-switch v-model="form.secondaryRateEnabled" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <template v-if="form.secondaryRateEnabled">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="次要汇率值">
                        <el-input-number
                          v-model="form.secondaryRate"
                          :precision="2"
                          :step="0.01"
                          :min="0"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="次要最小面额">
                        <el-input-number
                          v-model="form.secondaryMinAmount"
                          :step="10"
                          :min="0"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="次要备注">
                        <el-input
                          v-model="form.secondaryRemark"
                          placeholder="例如: 有卡先问"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </template>

                <el-divider>卡图备注</el-divider>
                <el-form-item>
                  <div class="remarks-container">
                    <div
                      v-for="(remark, index) in form.slowCard.image.remarks"
                      :key="index"
                      class="remark-item"
                    >
                      <el-input
                        v-model="form.slowCard.image.remarks[index]"
                        placeholder="添加备注"
                      />
                      <el-button
                        type="danger"
                        circle
                        @click="removeRemark('', 'slow', CardType.IMAGE, index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <el-button
                      type="primary"
                      @click="addRemark('', 'slow', CardType.IMAGE)"
                      >添加备注</el-button
                    >
                  </div>
                </el-form-item>
              </template>
            </el-collapse-item>

            <!-- 慢卡-卡密设置 -->
            <el-collapse-item title="卡密设置" name="slowCardCode">
              <el-form-item label="启用慢卡卡密">
                <el-switch v-model="form.slowCard.code.enabled" />
              </el-form-item>

              <template v-if="form.slowCard.code.enabled">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="卡密汇率">
                      <el-input-number
                        v-model="form.slowCard.code.rate"
                        :precision="2"
                        :step="0.01"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最小面额">
                      <el-input-number
                        v-model="form.slowCard.code.minAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="最大面额">
                      <el-input-number
                        v-model="form.slowCard.code.maxAmount"
                        :step="10"
                        :min="0"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="面额约束">
                  <el-radio-group v-model="form.slowCard.code.amountConstraint">
                    <el-radio value="none">无约束</el-radio>
                    <el-radio value="multiple">倍数要求</el-radio>
                    <el-radio value="all">全面值</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item
                  v-if="form.slowCard.code.amountConstraint === 'multiple'"
                  label="倍数基数"
                >
                  <el-input-number
                    v-model="form.slowCard.code.multipleBase"
                    :min="1"
                  />
                </el-form-item>

                <el-divider>卡密备注</el-divider>
                <el-form-item>
                  <div class="remarks-container">
                    <div
                      v-for="(remark, index) in form.slowCard.code.remarks"
                      :key="index"
                      class="remark-item"
                    >
                      <el-input
                        v-model="form.slowCard.code.remarks[index]"
                        placeholder="添加备注"
                      />
                      <el-button
                        type="danger"
                        circle
                        @click="removeRemark('', 'slow', CardType.CODE, index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <el-button
                      type="primary"
                      @click="addRemark('', 'slow', CardType.CODE)"
                      >添加备注</el-button
                    >
                  </div>
                </el-form-item>
              </template>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 通用备注 -->
        <el-card shadow="hover" class="mb-4">
          <template #header>
            <div class="section-header">
              <el-icon :size="20" color="#909399"><ChatDotRound /></el-icon>
              <span class="section-title">通用备注</span>
            </div>
          </template>
          <el-form-item>
            <div class="remarks-container">
              <div
                v-for="(remark, index) in form.commonRemarks"
                :key="index"
                class="remark-item"
              >
                <el-input
                  v-model="form.commonRemarks[index]"
                  placeholder="添加备注"
                />
                <el-button
                  type="danger"
                  circle
                  @click="removeRemark('', 'common', CardType.IMAGE, index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button
                type="primary"
                @click="addRemark('', 'common', CardType.IMAGE)"
                >添加备注</el-button
              >
            </div>
          </el-form-item>
        </el-card>
      </el-form>
    </el-card>

    <!-- 预览区域 -->
    <el-card v-if="previewText" class="mt-4">
      <template #header>
        <div class="card-header">
          <span>预览</span>
          <el-button type="primary" class="copy-btn" @click="copyText">
            <el-icon><CopyDocument /></el-icon> 复制文本
          </el-button>
        </div>
      </template>
      <div class="preview-container">
        <el-input
          v-model="previewText"
          type="textarea"
          :rows="10"
          readonly
          placeholder="生成的交易文本将显示在这里"
        />
      </div>
    </el-card>

    <!-- 保存模板对话框 -->
    <el-dialog v-model="saveTemplateDialogVisible" title="保存模板" width="30%">
      <el-form>
        <el-form-item label="模板名称">
          <el-input v-model="templateName" placeholder="请输入模板名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="删除确认" width="30%">
      <p>
        确定要删除
        {{ deleteConfig?.countryName || "" }} 的配置吗？此操作不可恢复。
      </p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Delete,
  Plus,
  Document,
  Check,
  CopyDocument,
  InfoFilled,
  Timer,
  AlarmClock,
  ChatDotRound
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useTradeForm } from "./hook";
import type { CountryTradeConfig } from "@/api/trade/types";

// 使用自定义hook
const {
  countries,
  formRef,
  form,
  previewText,
  addRemark,
  removeRemark,
  generatePost,
  copyText,
  saveAsTemplate,
  loadCountryConfigs,
  addCountryConfig: initAddCountryConfig,
  editCountryConfig: initEditCountryConfig,
  deleteCountryConfig,
  saveCurrentConfig,
  CardType,
  countryConfigs,
  currentEditingId,
  loading
} = useTradeForm();

// 计算属性：是否显示编辑表单
const showEditForm = computed(() => form.value.country);

// 模板相关
const saveTemplateDialogVisible = ref(false);
const templateName = ref("");

// 删除相关
const deleteDialogVisible = ref(false);
const deleteConfig = ref<CountryTradeConfig | null>(null);

// 编辑国家配置
const editCountryConfig = (config: CountryTradeConfig) => {
  initEditCountryConfig(config);
  previewText.value = "";
};

// 添加国家配置
const addCountryConfig = () => {
  initAddCountryConfig();
  previewText.value = "";
};

// 预览国家配置
const previewCountryConfig = (config: CountryTradeConfig) => {
  generatePost(config);
};

// 处理删除配置
const handleDeleteConfig = (config: CountryTradeConfig) => {
  deleteConfig.value = config;
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  if (deleteConfig.value?.id) {
    await deleteCountryConfig(deleteConfig.value.id);
    deleteDialogVisible.value = false;
    deleteConfig.value = null;
  }
};

// 保存当前配置
const handleSave = async () => {
  const success = await saveCurrentConfig();
  if (success) {
    previewText.value = generatePost(form.value);
  }
};

// 保存模板
const handleSaveTemplate = async () => {
  if (!templateName.value) {
    ElMessage.warning("请输入模板名称");
    return;
  }

  const success = await saveAsTemplate(templateName.value);
  if (success) {
    saveTemplateDialogVisible.value = false;
    templateName.value = "";
  }
};
</script>

<style scoped>
.card-trade-container {
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

.remarks-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.remark-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-container {
  margin-top: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
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

/* 移除原有分隔线 */
.el-divider {
  display: none;
}
</style>
