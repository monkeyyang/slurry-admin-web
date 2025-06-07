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
                  filterable
                  :loading="countriesLoading"
                  :filter-method="filterCountries"
                >
                  <el-option
                    v-for="item in countriesList"
                    :key="item?.code || item?.id"
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
            <el-col :span="12">
              <el-form-item label="国家名称">
                <el-input
                  v-model="form.countryName"
                  placeholder="例如: 加拿大"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分组">
                <el-select
                  v-model="form.group"
                  placeholder="选择分组"
                  filterable
                  :loading="groupsLoading"
                  @change="handleGroupChange"
                >
                  <el-option
                    v-for="item in groupsList"
                    :key="item?.id"
                    :value="item?.id"
                    :label="item?.name"
                  />
                </el-select>
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
import { ref, computed, onMounted } from "vue";
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
import { getCountriesListApi } from "@/api/system/countries";
import { getGroupsListApi } from "@/api/system/groups";

// 国家数据
const countriesList = ref([]);
const countriesLoading = ref(false);

// 分组数据
const groupsList = ref([]);
const groupsLoading = ref(false);

// 获取分组列表
const getGroupsList = async () => {
  groupsLoading.value = true;
  try {
    const response = await getGroupsListApi({
      pageSize: 100,
      status: "1"
    });

    if (response && response.code === 0 && response.data) {
      groupsList.value = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      console.log(`成功获取${groupsList.value.length}个分组`);
    } else {
      console.error("获取分组列表失败:", response);
      groupsList.value = [];
    }
  } catch (error) {
    console.error("获取分组列表失败:", error);
    groupsList.value = [];
  } finally {
    groupsLoading.value = false;
  }
};

// 获取国家列表
const getCountriesList = async () => {
  countriesLoading.value = true;
  try {
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

// 格式化国家标签显示函数
const formatCountryLabel = item => {
  if (!item) return "";
  return item?.name_zh
    ? `${item.name_zh} (${item?.name_en || ""})`
    : item?.code || "";
};

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

// 组件挂载时加载国家列表和分组列表
onMounted(() => {
  getCountriesList();
  getGroupsList();
  loadCountryConfigs();
});

// 计算属性：是否显示编辑表单
const showEditForm = computed(
  () => currentEditingId.value === "" || !!currentEditingId.value
);

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
  form.value = {
    country: "",
    countryName: "",
    group: "",
    groupName: "",
    fastCard: {
      [CardType.IMAGE]: {
        enabled: true,
        rate: 3.95,
        minAmount: 150,
        maxAmount: 500,
        amountConstraint: "multiple",
        multipleBase: 50,
        remarks: ["连卡只要2张", "要清晰完整卡图", "30分钟赎回不结算"]
      },
      [CardType.CODE]: {
        enabled: true,
        rate: 3.9,
        minAmount: 150,
        maxAmount: 500,
        amountConstraint: "multiple",
        multipleBase: 50,
        remarks: ["卡密即时到账", "卡密须为可激活状态"]
      }
    },
    slowCard: {
      [CardType.IMAGE]: {
        enabled: true,
        rate: 4.05,
        minAmount: 200,
        maxAmount: 2000,
        amountConstraint: "all",
        multipleBase: 50,
        remarks: [
          "代码/电子/卡图同价/连卡要",
          "使用时间1-3小时",
          "感染卡/风控/没货=退卡"
        ]
      },
      [CardType.CODE]: {
        enabled: true,
        rate: 4.0,
        minAmount: 200,
        maxAmount: 2000,
        amountConstraint: "all",
        multipleBase: 50,
        remarks: ["卡密24小时内到账", "卡密须为未使用状态"]
      }
    },
    secondaryRateEnabled: true,
    secondaryRate: 4.0,
    secondaryMinAmount: 50,
    secondaryRemark: "有卡先问",
    commonRemarks: [
      "快卡（自用囤号请筛选好质量）",
      "快卡（每月赎回3次停止合作）",
      "慢卡、快卡 请备注清楚 ！！！"
    ]
  };
  currentEditingId.value = "";
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

// 添加分组变更处理函数
const handleGroupChange = (groupId: string) => {
  const selectedGroup = groupsList.value.find(group => group.id === groupId);
  if (selectedGroup) {
    form.value.groupName = selectedGroup.name;
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

.country-simple-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.country-en-name {
  color: #8492a6;
  font-size: 13px;
}
</style>
