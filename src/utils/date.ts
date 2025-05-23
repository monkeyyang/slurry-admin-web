/**
 * 日期格式化工具函数
 * @param date 日期对象
 * @param format 格式化字符串，支持：
 *   - YYYY: 四位年份
 *   - MM: 两位月份
 *   - DD: 两位日期
 *   - HH: 两位小时（24小时制）
 *   - mm: 两位分钟
 *   - ss: 两位秒数
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date, format: string = "YYYY-MM-DD"): string {
  if (!date) return "";
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // 补零函数
  const padZero = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };
  
  // 替换格式字符串
  return format
    .replace(/YYYY/g, `${year}`)
    .replace(/MM/g, padZero(month))
    .replace(/DD/g, padZero(day))
    .replace(/HH/g, padZero(hours))
    .replace(/mm/g, padZero(minutes))
    .replace(/ss/g, padZero(seconds));
}

/**
 * 获取相对时间（例如：几分钟前，几小时前等）
 * @param date 日期对象或时间戳
 * @returns 相对时间字符串
 */
export function getRelativeTime(date: Date | number): string {
  const now = new Date().getTime();
  const targetTime = date instanceof Date ? date.getTime() : date;
  const diff = now - targetTime;
  
  // 不同时间段的毫秒数
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  
  if (diff < minute) {
    return "刚刚";
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`;
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`;
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`;
  } else {
    return `${Math.floor(diff / year)}年前`;
  }
} 