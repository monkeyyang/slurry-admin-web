// 国家/地区颜色配置
// 颜色选择基于各国国旗的主要颜色
export const countryColors = {
  // 亚洲
  CN: { color: "#ffffff", bg: "#de2910" }, // 中国 - 红色
  JP: { color: "#ffffff", bg: "#bc002d" }, // 日本 - 红色
  KR: { color: "#ffffff", bg: "#003478" }, // 韩国 - 蓝色
  IN: { color: "#000000", bg: "#ff9933" }, // 印度 - 橙色
  SG: { color: "#ffffff", bg: "#ed2939" }, // 新加坡 - 红色

  // 北美
  US: { color: "#ffffff", bg: "#3c3b6e" }, // 美国 - 蓝色
  CA: { color: "#ffffff", bg: "#ff0000" }, // 加拿大 - 红色
  MX: { color: "#ffffff", bg: "#006847" }, // 墨西哥 - 绿色

  // 欧洲
  UK: { color: "#ffffff", bg: "#00247d" }, // 英国 - 蓝色
  DE: { color: "#ffffff", bg: "#dd0000" }, // 德国 - 红色
  FR: { color: "#000000", bg: "#0055a4" }, // 法国 - 蓝色
  IT: { color: "#ffffff", bg: "#009246" }, // 意大利 - 绿色
  ES: { color: "#ffffff", bg: "#aa151b" }, // 西班牙 - 红色

  // 大洋洲
  AU: { color: "#ffffff", bg: "#00008b" }, // 澳大利亚 - 蓝色
  NZ: { color: "#ffffff", bg: "#00247d" }, // 新西兰 - 蓝色

  // 南美
  BR: { color: "#ffffff", bg: "#009c3b" }, // 巴西 - 绿色
  AR: { color: "#ffffff", bg: "#75aadb" }, // 阿根廷 - 蓝色

  // 非洲
  ZA: { color: "#ffffff", bg: "#007a4d" }, // 南非 - 绿色
  EG: { color: "#ffffff", bg: "#c8102e" } // 埃及 - 红色
};

/**
 * 获取国家颜色样式
 * @param code 国家代码
 * @returns 颜色样式对象
 */
export function getCountryColorStyle(code: string | undefined): {
  color: string;
  bg: string;
  borderColor: string;
} {
  if (!code) return { color: "#606266", bg: "#f5f7fa", borderColor: "#dcdfe6" }; // 默认灰色

  const countryCode = String(code).toUpperCase();
  const colors = countryColors[countryCode] || {
    color: "#606266",
    bg: "#f5f7fa"
  };

  // 添加边框颜色
  return {
    ...colors,
    borderColor: `${colors.bg}33` // 添加透明度为20%的边框
  };
}
