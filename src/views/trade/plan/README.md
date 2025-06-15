# 计划管理功能

## 功能概述

计划管理功能用于创建和管理iTunes卡兑换计划，支持智能金额分配和多种约束条件。

## 主要功能

### 1. 新增计划
- **计划名称**：自动生成格式为"汇率名称_计划天数_计划总额"
- **选择汇率**：从活跃汇率中选择，支持搜索过滤
- **计划完成天数**：设置计划执行的天数（1-365天）
- **浮动金额**：设置浮动金额，默认为0
- **兑换ID总额**：设置总的兑换金额
- **同ID兑换时间间隔**：设置同一ID的兑换时间间隔，默认5分钟
- **同ID兑换天数间隔**：设置同一ID的兑换天数间隔，默认24小时

### 2. 智能金额分配
根据选择的汇率约束条件，系统会自动分配每日计划金额：

#### 全面额约束
- 平均分配总金额到每天
- 余数分配到最后一天

#### 固定面额约束
- 使用贪心算法分配固定面额组合
- 尽量平均分配到每天
- 剩余金额分配到最后一天

#### 倍数要求约束
- 确保每日金额都是倍数的整数倍
- 余数按倍数分配到最后一天

### 3. 每日计划金额编辑
- 显示每天的计划金额
- 支持手动编辑（受约束条件限制）
- 实时显示总计和差额
- 差额提示（超出/不足）

### 4. 计划管理
- **查看详情**：显示计划的完整信息和每日金额分布
- **编辑计划**：修改计划参数和每日金额
- **删除计划**：单个删除或批量删除
- **状态管理**：进行中、已暂停、已完成

### 5. 搜索和筛选
- 按计划名称关键词搜索
- 按汇率筛选
- 按状态筛选
- 支持重置搜索条件

## 文件结构

```
src/views/trade/plan/
├── index.vue                    # 主页面
├── hook.tsx                     # 业务逻辑钩子
├── components/
│   ├── AddPlanDialog.vue       # 新增/编辑对话框
│   └── PreviewDialog.vue       # 详情预览对话框
└── README.md                   # 说明文档
```

## API接口

```
src/api/trade/plan.ts           # 计划管理API
```

### 主要接口
- `GET /trade/plans` - 获取计划列表
- `POST /trade/plans` - 创建计划
- `PUT /trade/plans/:id` - 更新计划
- `DELETE /trade/plans/:id` - 删除计划
- `DELETE /trade/plans/batch` - 批量删除

## 数据结构

### 前端数据结构 (PlanItem)
```typescript
interface PlanItem {
  id?: string;
  name: string;                 // 计划名称
  rateId: string;              // 汇率ID
  rateName: string;            // 汇率名称
  planDays: number;            // 计划天数
  floatAmount: number;         // 浮动金额
  totalAmount: number;         // 总金额
  exchangeInterval: number;    // 兑换时间间隔（分钟）
  dayInterval: number;         // 天数间隔（小时）
  dailyAmounts: number[];      // 每日金额数组
  status: "active" | "inactive" | "completed";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 后端数据结构 (BackendPlanItem)
```typescript
interface BackendPlanItem {
  id: number;
  name: string;
  rate_id: number;             // snake_case
  rate_name: string;
  plan_days: number;
  float_amount: string;
  total_amount: string;
  exchange_interval: number;
  day_interval: number;
  daily_amounts: string;       // JSON字符串
  status: string;
  // ... 其他字段
}
```

## 使用说明

1. **创建计划**：
   - 点击"新增计划"按钮
   - 选择汇率（必填）
   - 设置计划天数和总金额
   - 系统自动分配每日金额
   - 可手动调整每日金额
   - 保存计划

2. **查看计划**：
   - 在列表中点击"查看"按钮
   - 查看计划详情和每日金额分布
   - 查看汇总信息

3. **编辑计划**：
   - 在列表中点击"编辑"按钮
   - 修改计划参数
   - 重新分配每日金额
   - 保存更改

4. **管理计划**：
   - 使用搜索功能快速找到计划
   - 批量选择和删除计划
   - 按状态筛选计划

## 特色功能

1. **智能分配算法**：根据汇率约束自动分配每日金额
2. **实时验证**：实时显示金额差额和约束提示
3. **灵活编辑**：支持手动调整每日金额
4. **美观界面**：现代化UI设计，用户体验友好
5. **完整功能**：增删改查、搜索筛选、批量操作一应俱全 