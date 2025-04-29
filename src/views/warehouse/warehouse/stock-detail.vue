<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${warehouseName} - 库存详情`"
    width="80%"
    destroy-on-close
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部库存" name="all">
        <el-table :data="stockList" border style="width: 100%">
          <el-table-column prop="goods_name" label="货品名称" min-width="160" />
          <el-table-column prop="order_no" label="订单编号" min-width="120" />
          <el-table-column prop="inbound_time" label="入库时间" width="180" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_settled ? 'success' : 'warning'">
                {{ row.is_settled ? "已结算" : "未结算" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已结算" name="settled">
        <!-- 已结算库存表格 -->
      </el-tab-pane>

      <el-tab-pane label="未结算" name="unsettled">
        <!-- 未结算库存表格 -->
      </el-tab-pane>
    </el-tabs>

    <!-- 统计信息 -->
    <div class="statistics-container">
      <el-card>
        <template #header>库存统计</template>
        <div class="statistics">
          <div class="stat-item">
            <div class="stat-value primary">{{ totalCount }}</div>
            <div class="stat-label">入库总量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value success">{{ settledCount }}</div>
            <div class="stat-label">已结算</div>
          </div>
          <div class="stat-item">
            <div class="stat-value warning">{{ unsettledCount }}</div>
            <div class="stat-label">未结算</div>
          </div>
        </div>
      </el-card>
    </div>
  </el-dialog>
</template>
