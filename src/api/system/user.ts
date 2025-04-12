import { http } from "@/utils/http";

export interface UserQuery extends BasePageQuery {
  //deptId?: number;
  phone_number?: string;
  status?: string;
  id?: number;
  username?: string;
}

/**
 * UserDTO
 */
export interface UserDTO {
  avatar?: string;
  createTime?: Date;
  creatorId?: number;
  creatorName?: string;
  deptId?: number;
  deptName?: string;
  email?: string;
  loginDate?: Date;
  loginIp?: string;
  nickname?: string;
  phone_number?: string;
  postId?: number;
  remark?: string;
  roleId?: number;
  roleName?: string;
  gender?: string;
  status?: string;
  updaterId?: number;
  updaterName?: string;
  updateTime?: Date;
  userId?: number;
  username?: string;
  userType?: number;
}

/**
 * AddUserCommand
 */
export interface UserRequest {
  id: number;
  avatar?: string;
  //deptId?: number;
  email?: string;
  nickname?: string;
  phone_number?: string;
  password: string;
  //postId?: number;
  remark?: string;
  //role_id?: number;
  role_ids?: number[];
  gender?: string;
  status?: string;
  username?: string;
}

/**
 * UpdateProfileCommand
 */
export interface UserProfileRequest {
  email?: string;
  nickname?: string;
  phone_number?: string;
  gender?: string;
  user_id?: number;
}

/**
 * ResetPasswordCommand
 */
export interface ResetPasswordRequest {
  new_password?: string;
  old_password?: string;
  user_id?: number;
}

/**
 * 修改密码
 */
export interface PasswordRequest {
  id: number;
  password: string;
}

/** 获取用户列表 */
export const getUserListApi = (params?: UserQuery) => {
  return http.request<ResponseData<PageDTO<UserDTO>>>(
    "get",
    "/admin/user/list",
    {
      params
    }
  );
};

/** 获取当前用户信息 */
export const getUserProfileApi = () => {
  return http.request<ResponseData<UserDTO>>("get", `/admin/user/profile/info`);
};

/** 新增用户 */
export const addUserApi = (data?: UserRequest) => {
  return http.request<ResponseData<void>>("post", "/admin/user/create", {
    data
  });
};

/** 编辑用户 */
export const updateUserApi = (userId: number, data?: UserRequest) => {
  return http.request<ResponseData<void>>("post", "/admin/user/update", {
    data
  });
};

/** 更改用户密码 */
export const updateUserPasswordApi = (data?: PasswordRequest) => {
  return http.request<ResponseData<void>>("post", `/admin/user/resetPassword`, {
    data
  });
};

/** 删除用户 */
export const deleteUserApi = (userId: number) => {
  return http.request<ResponseData<void>>("post", "/admin/user/delete", {
    data: { id: userId }
  });
};

/** 修改用户状态 */
export const updateUserStatusApi = (userId: number, status: number) => {
  return http.request<ResponseData<void>>("post", `/admin/user/updateStatus`, {
    data: {
      id: userId,
      status: status
    }
  });
};

/** 批量导出用户 */
export const exportUserExcelApi = (params: UserQuery, fileName: string) => {
  return http.download("/system/users/excel", fileName, {
    params
  });
};

/** 用户头像上传 */
export const uploadUserAvatarApi = data => {
  return http.request<ResponseData<void>>(
    "post",
    "/system/user/profile/avatar",
    {
      data
    },
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
};

/** 更改用户资料 */
export const updateUserProfileApi = (data?: UserProfileRequest) => {
  return http.request<ResponseData<void>>("put", "/system/user/profile", {
    data
  });
};

/** 更改当前用户密码 */
export const updateCurrentUserPasswordApi = (data?: ResetPasswordRequest) => {
  return http.request<ResponseData<void>>(
    "post",
    "/admin/user/profile/password",
    {
      data
    }
  );
};
