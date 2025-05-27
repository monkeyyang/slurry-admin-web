import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { CountryTradeConfig } from "@/api/trade/types";
import { CardType } from "@/api/trade/types";
import {
  getCountryConfigsApi,
  saveCountryConfigApi,
  updateCountryConfigApi,
  deleteCountryConfigApi,
  getTemplatesApi,
  saveTemplateApi
} from "@/api/trade/itunes";

export function useTradeForm() {
  // 多国家配置列表
  const countryConfigs = ref<CountryTradeConfig[]>([]);

  // 当前编辑的配置ID
  const currentEditingId = ref<string>("");

  // 加载状态
  const loading = ref(false);

  // 创建空配置
  const createEmptyConfig = (
    country: string,
    countryName: string
  ): CountryTradeConfig => {
    return {
      country,
      countryName,

      // 快卡设置
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

      // 慢卡设置
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

      // 次要汇率设置
      secondaryRateEnabled: true,
      secondaryRate: 4.0,
      secondaryMinAmount: 50,
      secondaryRemark: "有卡先问",

      // 通用备注
      commonRemarks: [
        "快卡（自用囤号请筛选好质量）",
        "快卡（每月赎回3次停止合作）",
        "慢卡、快卡 请备注清楚 ！！！"
      ]
    };
  };

  // 表单引用
  const formRef = ref();

  // 当前编辑的表单数据
  const form = ref<CountryTradeConfig>(createEmptyConfig("", ""));

  // 预设模板列表
  const templates = ref<any[]>([]);
  const currentTemplate = ref("");

  // 预览文本
  const previewText = ref("");

  // 加载所有国家配置
  const loadCountryConfigs = async () => {
    loading.value = true;
    try {
      const res = await getCountryConfigsApi();
      countryConfigs.value = res.data || [];
    } catch (error) {
      console.error("加载配置失败", error);
    } finally {
      loading.value = false;
    }
  };

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      const res = await getTemplatesApi();
      templates.value = res.data || [];
    } catch (error) {
      console.error("加载模板失败", error);
    }
  };

  // 添加备注
  const addRemark = (
    cardType: string,
    tradeType: "fast" | "slow" | "common",
    type: CardType
  ) => {
    if (tradeType === "fast") {
      form.value.fastCard[type].remarks.push("");
    } else if (tradeType === "slow") {
      form.value.slowCard[type].remarks.push("");
    } else {
      form.value.commonRemarks.push("");
    }
  };

  // 删除备注
  const removeRemark = (
    cardType: string,
    tradeType: "fast" | "slow" | "common",
    type: CardType,
    index: number
  ) => {
    if (tradeType === "fast") {
      form.value.fastCard[type].remarks.splice(index, 1);
    } else if (tradeType === "slow") {
      form.value.slowCard[type].remarks.splice(index, 1);
    } else {
      form.value.commonRemarks.splice(index, 1);
    }
  };

  // 添加新国家配置
  const addCountryConfig = () => {
    form.value = createEmptyConfig("", "");
    currentEditingId.value = "";
  };

  // 编辑国家配置
  const editCountryConfig = (config: CountryTradeConfig) => {
    form.value = JSON.parse(JSON.stringify(config)); // 深拷贝
    currentEditingId.value = config.id || "";
  };

  // 删除国家配置
  const deleteCountryConfig = async (id: string) => {
    try {
      await deleteCountryConfigApi(id);
      ElMessage.success("删除成功");
      loadCountryConfigs();
    } catch (error) {
      console.error("删除失败", error);
    }
  };

  // 保存当前配置
  const saveCurrentConfig = async () => {
    try {
      let _res;
      if (currentEditingId.value) {
        _res = await updateCountryConfigApi(currentEditingId.value, form.value);
      } else {
        _res = await saveCountryConfigApi(form.value);
      }

      ElMessage.success("保存成功");
      loadCountryConfigs();
      return true;
    } catch (error) {
      console.error("保存失败", error);
      return false;
    }
  };

  // 生成交易文本
  const generatePost = (config: CountryTradeConfig = form.value) => {
    let text = "";

    // 添加标题
    text += `${config.country} ${config.countryName} ！！！\n`;
    text += "————————————\n";

    // 快卡信息 - 卡图
    if (config.fastCard[CardType.IMAGE].enabled) {
      text += `【${config.country} ${config.countryName}】快加 卡图\n`;
      text += `【${config.fastCard[CardType.IMAGE].rate.toFixed(2)}】${config.fastCard[CardType.IMAGE].minAmount}-${config.fastCard[CardType.IMAGE].maxAmount}`;

      if (config.fastCard[CardType.IMAGE].amountConstraint === "multiple") {
        text += `（${config.fastCard[CardType.IMAGE].multipleBase}倍数）`;
      } else if (config.fastCard[CardType.IMAGE].amountConstraint === "all") {
        text += "（全面值）";
      }

      text += "\n";

      // 快卡卡图备注
      if (config.fastCard[CardType.IMAGE].remarks.length > 0) {
        text += config.fastCard[CardType.IMAGE].remarks
          .filter(r => r.trim())
          .join("\n");
        text += "\n";
      }

      text += "————————————\n";
    }

    // 快卡信息 - 卡密
    if (config.fastCard[CardType.CODE].enabled) {
      text += `【${config.country} ${config.countryName}】快加 卡密\n`;
      text += `【${config.fastCard[CardType.CODE].rate.toFixed(2)}】${config.fastCard[CardType.CODE].minAmount}-${config.fastCard[CardType.CODE].maxAmount}`;

      if (config.fastCard[CardType.CODE].amountConstraint === "multiple") {
        text += `（${config.fastCard[CardType.CODE].multipleBase}倍数）`;
      } else if (config.fastCard[CardType.CODE].amountConstraint === "all") {
        text += "（全面值）";
      }

      text += "\n";

      // 快卡卡密备注
      if (config.fastCard[CardType.CODE].remarks.length > 0) {
        text += config.fastCard[CardType.CODE].remarks
          .filter(r => r.trim())
          .join("\n");
        text += "\n";
      }

      text += "————————————\n";
    }

    // 慢卡信息 - 卡图
    if (config.slowCard[CardType.IMAGE].enabled) {
      text += `【${config.country} ${config.countryName}】慢加 卡图\n`;
      text += `【${config.slowCard[CardType.IMAGE].rate.toFixed(2)}】${config.slowCard[CardType.IMAGE].minAmount}-${config.slowCard[CardType.IMAGE].maxAmount}`;

      if (config.slowCard[CardType.IMAGE].amountConstraint === "multiple") {
        text += `（${config.slowCard[CardType.IMAGE].multipleBase}倍数）`;
      } else if (config.slowCard[CardType.IMAGE].amountConstraint === "all") {
        text += "（全面值）";
      }

      text += "\n";

      // 次要汇率信息
      if (config.secondaryRateEnabled) {
        text += `【${config.secondaryRate.toFixed(2)}】${config.secondaryMinAmount}+ ${config.secondaryRemark}\n`;
      }

      // 慢卡卡图备注
      if (config.slowCard[CardType.IMAGE].remarks.length > 0) {
        text += config.slowCard[CardType.IMAGE].remarks
          .filter(r => r.trim())
          .join("\n");
        text += "\n";
      }

      text += "————————————\n";
    }

    // 慢卡信息 - 卡密
    if (config.slowCard[CardType.CODE].enabled) {
      text += `【${config.country} ${config.countryName}】慢加 卡密\n`;
      text += `【${config.slowCard[CardType.CODE].rate.toFixed(2)}】${config.slowCard[CardType.CODE].minAmount}-${config.slowCard[CardType.CODE].maxAmount}`;

      if (config.slowCard[CardType.CODE].amountConstraint === "multiple") {
        text += `（${config.slowCard[CardType.CODE].multipleBase}倍数）`;
      } else if (config.slowCard[CardType.CODE].amountConstraint === "all") {
        text += "（全面值）";
      }

      text += "\n";

      // 慢卡卡密备注
      if (config.slowCard[CardType.CODE].remarks.length > 0) {
        text += config.slowCard[CardType.CODE].remarks
          .filter(r => r.trim())
          .join("\n");
        text += "\n";
      }

      text += "————————————\n";
    }

    // 通用备注
    if (config.commonRemarks.length > 0) {
      text += config.commonRemarks.filter(r => r.trim()).join("\n");
      text += "\n";
    }

    previewText.value = text;
    return text;
  };

  // 复制文本
  const copyText = () => {
    if (!previewText.value) {
      ElMessage.warning("请先生成预览内容");
      return;
    }

    try {
      navigator.clipboard.writeText(previewText.value);
      ElMessage.success("复制成功");
    } catch (error) {
      ElMessage.error("复制失败，请手动复制");
      console.error("复制失败", error);
    }
  };

  // 保存为模板
  const saveAsTemplate = async (name: string) => {
    try {
      await saveTemplateApi({
        name,
        config: JSON.stringify(form.value)
      });
      ElMessage.success("模板保存成功");
      loadTemplates();
      return true;
    } catch (error) {
      console.error("保存模板失败", error);
      ElMessage.error("保存模板失败");
      return false;
    }
  };

  // 初始化
  const init = () => {
    loadCountryConfigs();
    loadTemplates();
  };

  // 初始化加载
  init();

  return {
    countries: [], // 为了兼容性保留此字段，但不再使用
    formRef,
    form,
    previewText,
    addRemark,
    removeRemark,
    generatePost,
    copyText,
    saveAsTemplate,
    loadCountryConfigs,
    addCountryConfig,
    editCountryConfig,
    deleteCountryConfig,
    saveCurrentConfig,
    CardType,
    countryConfigs,
    currentEditingId,
    loading
  };
}
