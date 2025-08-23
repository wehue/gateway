import instance from '@/utils/request'

// 获取用户列表
export const getUserList = () => {
  return instance.get('/user/list')
}
// 添加用户
export const addUser = (data) => {
  return instance.post('/user/add', data)
}
//修改用户密码
export const updateUser = (data) => {
  return instance.put('/user/update-password', data)
}

// 删除用户
export const deleteUser = (params) => {
  return instance.delete('/user/delete', {
    params,
  })
}
