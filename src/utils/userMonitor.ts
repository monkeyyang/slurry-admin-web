import mitt from "mitt";
import { getUUID } from "./common";

// 事件总线，用于向应用其他部分分发用户状态事件
const emitter = mitt();

// 用户状态数据类型
export interface UserStatusData {
  username: string;
  balance: string;
  country: string;
  countryCode: string;
  code: number;
  refreshTime: string;
}

// WebSocket消息类型
type WebSocketMessage = {
  type: "init" | "update" | "delete" | "ping" | "pong";
  key?: string;
  value?: UserStatusData[];
};

class UserStatusMonitor {
  private ws: WebSocket | null = null;
  private clientId: string;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private serverUrl: string = "ws://47.76.200.188:8080/api/ws/";
  private pingInterval: number = 30000; // 30秒发送一次ping
  private reconnectInterval: number = 5000; // 5秒重连一次
  private isConnecting: boolean = false;
  private userStatusMap: Map<string, UserStatusData[]> = new Map();

  constructor() {
    // 从localStorage获取或生成clientId
    const savedClientId = localStorage.getItem("user_monitor_client_id");
    if (savedClientId) {
      this.clientId = savedClientId;
    } else {
      this.clientId = getUUID();
      localStorage.setItem("user_monitor_client_id", this.clientId);
    }

    this.serverUrl = this.serverUrl + this.clientId;
  }

  /**
   * 开始监控
   */
  public start(): void {
    this.connect();
  }

  /**
   * 停止监控
   */
  public stop(): void {
    this.disconnect();
  }

  /**
   * 获取所有用户状态
   */
  public getAllUserStatus(): Map<string, UserStatusData[]> {
    return this.userStatusMap;
  }

  /**
   * 获取指定key的用户状态
   */
  public getUserStatus(key: string): UserStatusData[] | undefined {
    return this.userStatusMap.get(key);
  }

  /**
   * 注册事件监听
   */
  public on(event: string, callback: any): void {
    emitter.on(event, callback);
  }

  /**
   * 注销事件监听
   */
  public off(event: string, callback: any): void {
    emitter.off(event, callback);
  }

  // 建立WebSocket连接
  private connect(): void {
    if (this.ws !== null || this.isConnecting) return;

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error("WebSocket连接错误:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // 断开WebSocket连接
  private disconnect(): void {
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
  }

  // 处理WebSocket打开事件
  private handleOpen(): void {
    console.log("用户状态监控连接已建立");
    this.isConnecting = false;

    // 开始定时发送ping
    this.startPing();

    // 发送用户状态变化事件
    emitter.emit("userMonitor:connected", true);
  }

  // 处理WebSocket消息
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // 处理ping消息，回复pong
      if (message.type === "ping") {
        this.sendPong();
        return;
      }

      // 处理业务消息
      if (message.key && message.value) {
        switch (message.type) {
          case "init":
            this.handleInitMessage(message.key, message.value);
            break;
          case "update":
            this.handleUpdateMessage(message.key, message.value);
            break;
          case "delete":
            this.handleDeleteMessage(message.key, message.value);
            break;
        }
      }
    } catch (error) {
      console.error("处理WebSocket消息错误:", error);
    }
  }

  // 处理WebSocket错误
  private handleError(error: Event): void {
    console.error("WebSocket错误:", error);
    this.isConnecting = false;

    // 发送连接错误事件
    emitter.emit("userMonitor:error", error);
  }

  // 处理WebSocket关闭
  private handleClose(event: CloseEvent): void {
    console.log("WebSocket连接已关闭:", event.code, event.reason);
    this.ws = null;
    this.isConnecting = false;

    // 发送连接关闭事件
    emitter.emit("userMonitor:disconnected", {
      code: event.code,
      reason: event.reason
    });

    // 停止ping
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    // 尝试重新连接
    this.scheduleReconnect();
  }

  // 处理初始化消息
  private handleInitMessage(key: string, value: UserStatusData[]): void {
    this.userStatusMap.clear();
    this.userStatusMap.set(key, value);

    // 发送初始化事件
    emitter.emit("userMonitor:init", { key, value });
  }

  // 处理更新消息
  private handleUpdateMessage(key: string, value: UserStatusData[]): void {
    this.userStatusMap.set(key, value);

    // 发送更新事件
    emitter.emit("userMonitor:update", { key, value });
  }

  // 处理删除消息
  private handleDeleteMessage(key: string, value: UserStatusData[]): void {
    this.userStatusMap.delete(key);

    // 发送删除事件
    emitter.emit("userMonitor:delete", { key, value });
  }

  // 定时发送ping
  private startPing(): void {
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
    }

    this.pingTimer = window.setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  // 发送ping消息
  private sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "ping" }));
    }
  }

  // 发送pong消息
  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "pong" }));
    }
  }

  // 安排重新连接
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }
}

// 创建单例实例
const userStatusMonitor = new UserStatusMonitor();

export default userStatusMonitor;
