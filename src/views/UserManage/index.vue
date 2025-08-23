<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import { getUserList, addUser, updateUser, deleteUser as deleteUserApi } from '@/api/user'

// 定义抽屉input的显示状态
const table = ref(false)

// 定义抽屉input的值
const drawerModel = ref({
  username: '',
  password: '',
  confirmPassword: '', //二次确认
})

// 监听对话框显示状态，当打开对话框时清空表单数据
watch(table, (newVal) => {
  if (newVal === true) {
    // 打开对话框时清空表单数据
    drawerModel.value = {
      username: '',
      password: '',
      confirmPassword: '', // 清空确认密码
    }
    // 如果表单验证对象存在，则重置表单验证状态
    if (formValidate.value) {
      formValidate.value.resetFields()
    }
  }
})

// 编辑对话框显示状态
const editDialogVisible = ref(false)

// 当前编辑的用户数据
const editingUser = ref({
  id: '',
  username: '',
  password: '',
})

// 新建表单的验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== drawerModel.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 编辑表单的验证规则
const editRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

// 新建表单的表单验证
const formValidate = ref(null)
// 定义编辑表单验证
const editFormValidate = ref(null)

// 新增用户表单
const handleSubmit = async () => {
  try {
    // 验证表单
    await formValidate.value.validate()

    // 创建新的用户数据对象
    const newUser = {
      username: drawerModel.value.username,
      password: drawerModel.value.password,
    }

    // 创建新用户
    const response = await addUser(newUser)
    console.log(response)
    if (response && response.data && response.data.code === 200) {
      ElMessage({
        type: 'success',
        message: '创建用户成功',
      })
      table.value = false
      // 清空表单数据
      drawerModel.value = {
        username: '',
        password: '',
        confirmPassword: '',
      }
      // 重新获取用户列表
      fetchUserList()
    } else {
      throw new Error(response?.message || '创建失败')
    }
  } catch (error) {
    console.error('创建用户失败:', error)
    ElMessage({
      type: 'error',
      message: error.message || '创建用户失败',
    })
  }
}

// 打开编辑对话框
const handleEdit = (row) => {
  console.log('要编辑的行数据:', row)
  // 确保复制所有必要字段
  editingUser.value = {
    id: row.id,
    identity: row.identity,
    username: row.username,
    password: '',
  }
  editDialogVisible.value = true
}

// 修改密码表单
const submitEditForm = async () => {
  try {
    await editFormValidate.value.validate()

    // 打印当前编辑的用户对象，看看有哪些字段可用
    console.log('编辑用户对象:', editingUser.value)

    //修改密码的接口要求
    const updatedUser = {
      username: editingUser.value.username,
      password: editingUser.value.password,
    }

    console.log('准备发送的更新数据:', updatedUser)
    const response = await updateUser(updatedUser)
    console.log('修改密码响应:', response)

    if (response && response.data && response.data.code === 200) {
      ElMessage({
        type: 'success',
        message: '密码修改成功',
      })
      editDialogVisible.value = false
      fetchUserList()
    } else {
      throw new Error(response?.data?.message || '密码修改失败')
    }
  } catch (error) {
    console.error('密码修改失败:', error)
    ElMessage({
      type: 'error',
      message: error.message || '密码修改失败',
    })
  }
}

// 定义表格数据
const tableData = ref([])

// 获取用户列表数据
const fetchUserList = async () => {
  try {
    // 调用后端API获取用户列表
    const response = await getUserList()
    console.log('用户数据响应:', response)

    // 如果请求成功，更新表格数据
    if (response && response.data && response.data.data && response.data.data.records) {
      // 从正确的位置提取用户数组
      tableData.value = response.data.data.records
      console.log('设置的表格数据:', tableData.value)
    } else {
      tableData.value = []
      console.warn('用户数据结构不符合预期')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    tableData.value = []
    ElMessage({
      type: 'error',
      message: '获取用户数据失败',
    })
  }
}

// 组件挂载时获取用户列表
onMounted(() => {
  fetchUserList()
})

// 删除用户
const deleteUser = async (username) => {
  try {
    //  query 传参
    const response = await deleteUserApi({ username })

    if (response && response.data && response.data.code === 200) {
      ElMessage({
        type: 'success',
        message: '删除用户成功',
      })
      // 重新获取用户列表以刷新数据
      fetchUserList()
      return true
    } else {
      throw new Error(response?.data?.message || '删除失败')
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    ElMessage({
      type: 'error',
      message: error.message || '删除用户失败',
    })
    return false
  }
}

// 删除按钮的点击事件
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该用户信息吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    // 按接口要求仅传用户名
    await deleteUser(row.username)
  })
}

// 分页相关数据
// 当前页码
const currentPage = ref(1)
//和每页显示的条数
const pageSize = ref(6)

// 修改分页计算属性，使用原始数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 空行填充函数，确保表格始终有固定行数
const tableRows = computed(() => {
  const dataRows = paginatedTableData.value
  const rowCount = dataRows.length

  // 如果数据不足6条，添加空行占位
  if (rowCount < 6) {
    const emptyRows = Array(6 - rowCount).fill(null)
    return [...dataRows, ...emptyRows]
  }
  return dataRows
})

// 处理页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 修改序号列的计算逻辑
const getTableIndex = (index) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

// 获取行类名，用于空行填充
const getRowClassName = ({ row, rowIndex }) => {
  if (row === null) {
    return 'empty-row'
  }
  return ''
}
</script>

<template>
  <!-- 整体框架 -->
  <bg-image1>
    <!-- 头部页头 -->
    <Header />
    <!-- 主体内容 -->
    <div class="containers">
      <!-- 标题区域 -->
      <div class="page-title-container">
        <div class="title-left-line"></div>
        <h1 class="page-title">用户管理中心</h1>
        <div class="title-right-line"></div>
      </div>

      <!-- 新建按钮 -->
      <div class="Button-group1">
        <el-button type="primary" @click="table = true" class="add-button">+ 新建</el-button>
      </div>

      <!-- 新建用户对话框 -->
      <el-dialog
        v-model="table"
        :show-close="false"
        :close-on-click-modal="false"
        custom-class="cyber-dialog"
        width="550px"
      >
        <div class="cyber-dialog-wrapper">
          <div class="cyber-dialog-header">
            <div class="cyber-title">新增用户</div>
            <div class="cyber-close" @click="table = false">
              <el-icon><el-icon-close /></el-icon>
            </div>
          </div>

          <div class="cyber-dialog-body">
            <div class="cyber-form-container">
              <el-form class="cyber-form" :model="drawerModel" :rules="rules" ref="formValidate">
                <div class="form-row">
                  <div class="form-label">
                    <span class="cyber-required">*</span>
                    <span class="label-text">用户名</span>
                  </div>
                  <div class="form-input">
                    <el-form-item prop="username">
                      <el-input
                        v-model="drawerModel.username"
                        placeholder="请输入用户名"
                        class="cyber-input"
                      />
                    </el-form-item>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-label">
                    <span class="cyber-required">*</span>
                    <span class="label-text">密码</span>
                  </div>
                  <div class="form-input">
                    <el-form-item prop="password">
                      <el-input
                        v-model="drawerModel.password"
                        placeholder="请输入密码"
                        type="password"
                        show-password
                        class="cyber-input"
                      />
                    </el-form-item>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-label">
                    <span class="cyber-required">*</span>
                    <span class="label-text">确认密码</span>
                  </div>
                  <div class="form-input">
                    <el-form-item prop="confirmPassword">
                      <el-input
                        v-model="drawerModel.confirmPassword"
                        placeholder="请再次输入密码"
                        type="password"
                        show-password
                        class="cyber-input"
                      />
                    </el-form-item>
                  </div>
                </div>
              </el-form>
            </div>
          </div>

          <div class="cyber-dialog-footer">
            <el-button class="cyber-cancel-btn" @click="table = false">取消</el-button>
            <el-button class="cyber-confirm-btn" @click="handleSubmit">确认</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 编辑对话框 -->
      <el-dialog
        v-model="editDialogVisible"
        :show-close="false"
        :close-on-click-modal="false"
        custom-class="cyber-dialog"
        width="550px"
      >
        <div class="cyber-dialog-wrapper">
          <div class="cyber-dialog-header">
            <div class="cyber-title">编辑用户</div>
            <div class="cyber-close" @click="editDialogVisible = false">
              <el-icon><el-icon-close /></el-icon>
            </div>
          </div>

          <div class="cyber-dialog-body">
            <div class="cyber-form-container">
              <el-form
                :model="editingUser"
                :rules="editRules"
                ref="editFormValidate"
                class="cyber-form"
              >
                <div class="form-row">
                  <div class="form-label">
                    <span class="label-text">用户名</span>
                  </div>
                  <div class="form-input">
                    <el-form-item prop="username">
                      <el-input
                        v-model="editingUser.username"
                        placeholder="请输入用户名"
                        class="cyber-input"
                        disabled
                      />
                    </el-form-item>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-label">
                    <span class="cyber-required">*</span>
                    <span class="label-text">新密码</span>
                  </div>
                  <div class="form-input">
                    <el-form-item prop="password">
                      <el-input
                        v-model="editingUser.password"
                        placeholder="请输入新密码"
                        type="password"
                        show-password
                        class="cyber-input"
                      />
                    </el-form-item>
                  </div>
                </div>
              </el-form>
            </div>
          </div>

          <div class="cyber-dialog-footer">
            <el-button class="cyber-cancel-btn" @click="editDialogVisible = false">取消</el-button>
            <el-button class="cyber-confirm-btn" @click="submitEditForm">确认</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 表格列表数据 -->
      <div class="table-container">
        <div class="table-wrapper">
          <el-table
            :data="tableRows"
            style="width: 100%"
            class="cyber-table"
            stripe
            :highlight-current-row="false"
            :cell-style="{ backgroundColor: 'transparent' }"
            :row-style="{ backgroundColor: 'transparent' }"
            :row-class-name="getRowClassName"
          >
            <el-table-column label="序号" width="200" align="center">
              <template #default="scope">
                <span v-if="scope.row !== null">{{ getTableIndex(scope.$index) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" min-width="200" align="center">
              <template #default="scope">
                <span v-if="scope.row !== null">{{ scope.row.username }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="password" label="密码" min-width="200" align="center">
              <template #default="scope">
                <span v-if="scope.row !== null">{{ scope.row.password }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="scope">
                <div v-if="scope.row !== null" class="action-buttons">
                  <button class="detail-btn edit-btn" @click="handleEdit(scope.row)" title="编辑">
                    <el-icon><Edit /></el-icon>
                  </button>
                  <button
                    class="detail-btn delete-btn"
                    @click="handleDelete(scope.row)"
                    title="删除"
                  >
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页器 -->
        <div class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="tableData.length"
            @current-change="handleCurrentChange"
            class="custom-pagination"
          />
        </div>
      </div>
    </div>
  </bg-image1>
</template>

<style scoped>
/* 整体框架 */
.containers {
  width: 94%;
  margin: 0.7vw auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 15vw);
}

/* 页面标题样式 */
.page-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  margin-top: 0.5vw;
}

.page-title {
  color: #00e0db;
  font-size: 2vw;
  text-align: center;
  text-shadow: 0 0 1vw rgba(0, 224, 219, 0.6);
  margin: 0 1.3vw;
  font-weight: bold;
  letter-spacing: 0.13vw;
  position: relative;
}

.page-title:before,
.page-title:after {
  content: '';
  position: absolute;
  top: 50%;
  width: 0.4vw;
  height: 0.4vw;
  background-color: #00e0db;
  border-radius: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 0.7vw #00e0db;
}

.page-title:before {
  left: -1vw;
}

.page-title:after {
  right: -1vw;
}

.title-left-line,
.title-right-line {
  height: 0.13vw;
  background: linear-gradient(90deg, transparent, #00e0db);
  flex: 1;
  max-width: 20vw;
  position: relative;
}

.title-right-line {
  background: linear-gradient(90deg, #00e0db, transparent);
}

/* 新建按钮 */
.Button-group1 {
  padding: 0.7vw 0;
  position: relative;
  z-index: 1;
}

.add-button {
  width: 8vw;
  height: 2.8vw;
  font-size: 1.4vw;
  font-weight: 600;
  border-radius: 0.27vw;
  background: rgba(0, 224, 219, 0.3);
  color: #1affff;
  border: 1px solid rgba(0, 224, 219, 0.6);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-button:hover {
  background: rgba(0, 224, 219, 0.5);
  box-shadow: 0 0 12px rgba(0, 224, 219, 0.8);
  transform: translateY(-2px);
}

/* 表格容器样式 */
.table-container {
  width: 100%;
  height: calc(100% - 1.5vw);
  background: rgba(0, 40, 80, 0.7);
  border: 1px solid rgba(0, 224, 219, 0.4);
  border-radius: 0.55vw;
  padding: 0.7vw;
  box-shadow: 0 0 1vw rgba(0, 224, 219, 0.3);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.table-wrapper {
  flex: 1;
  width: 100%;
  overflow: hidden;
}

/* Element Plus 表格样式 */
:deep(.cyber-table) {
  background-color: transparent;
  color: #fff;
  border-spacing: 0;
}

:deep(.cyber-table th) {
  background-color: rgba(0, 40, 70, 0.8);
  color: #00e0db;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5);
  border-right: 1px solid rgba(0, 224, 219, 0.5);
}

:deep(.cyber-table th:last-child) {
  border-right: none;
}

:deep(.cyber-table tr) {
  background-color: rgba(0, 30, 60, 0.3);
  font-size: 1.1vw;
  height: 4.5vw;
}

:deep(.cyber-table tr:nth-child(2n)) {
  background-color: rgba(0, 40, 70, 0.3);
}

/* 空白行样式 */
:deep(.cyber-table tr.empty-row) {
  background-color: rgba(0, 20, 40, 0.1) !important;
}

:deep(.cyber-table tr.empty-row:hover) {
  background-color: rgba(0, 20, 40, 0.1) !important;
}

:deep(.cyber-table td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.5vw;
  padding-bottom: 0.5vw;
}

:deep(.cyber-table td:last-child) {
  border-right: none;
}

/* 移除表格点击和悬停时的白色背景 */
:deep(.cyber-table .el-table__row.current-row) {
  background-color: rgba(0, 60, 100, 0.5) !important;
}

:deep(.cyber-table .el-table__row:hover > td.el-table__cell) {
  background-color: rgba(0, 60, 100, 0.5) !important;
}

:deep(.cyber-table .el-table__row.current-row:hover > td.el-table__cell) {
  background-color: rgba(0, 60, 100, 0.5) !important;
}

/* 表格背景保持暗色调 */
:deep(.cyber-table .el-table__inner-wrapper::before) {
  background-color: transparent;
}

:deep(.cyber-table .el-table__header-wrapper) {
  background-color: transparent;
}

:deep(.el-table__header th.el-table__cell) {
  background-color: rgba(0, 40, 70, 0.8) !important;
  color: #00e0db !important;
  border-bottom: 2px solid rgba(0, 224, 219, 0.5) !important;
  font-size: 21px !important;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 0.7vw;
  justify-content: center;
}

.detail-btn {
  background: rgba(0, 224, 219, 0.2);
  color: #1affff;
  border: 1px solid rgba(0, 224, 219, 0.5);
  border-radius: 0.27vw;
  width: 2.5vw;
  height: 2.5vw;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9vw;
}

.detail-btn:hover {
  background: rgba(0, 224, 219, 0.4);
  box-shadow: 0 0 8px rgba(0, 224, 219, 0.6);
  transform: translateY(-2px);
}

.edit-btn {
  background: rgba(0, 224, 219, 0.2);
}

.delete-btn {
  background: rgba(255, 76, 76, 0.2);
  color: #ff4d4d;
  border: 1px solid rgba(255, 76, 76, 0.5);
}

.delete-btn:hover {
  background: rgba(255, 76, 76, 0.4);
  box-shadow: 0 0 8px rgba(255, 76, 76, 0.6);
}

.detail-btn .el-icon {
  font-size: 18px;
}

/* 分页组件自定义样式 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.4vw;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) {
  background-color: rgba(0, 30, 60, 0.5);
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: rgba(0, 224, 219, 0.5);
}

:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background-color: rgba(0, 30, 60, 0.5);
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #00e0db;
}

.cyber-dialog-wrapper {
  position: relative;
  background: rgba(1, 19, 38, 0.95);
  border-radius: 4px;
  border: 1px solid rgba(0, 224, 219, 0.5);
  box-shadow:
    0 0 20px rgba(0, 224, 219, 0.3),
    inset 0 0 15px rgba(0, 224, 219, 0.1);
  overflow: hidden;
  margin-top: 70px;
}

.cyber-dialog-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 224, 219, 0.8), transparent);
  z-index: 10;
}

.cyber-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(to bottom, rgba(0, 40, 80, 0.9), rgba(0, 20, 40, 0.8));
  border-bottom: 1px solid rgba(0, 224, 219, 0.3);
  position: relative;
}

.cyber-title {
  color: #1affff;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(26, 255, 255, 0.5);
  position: relative;
}

.cyber-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 80px;
  height: 2px;
  background: #1affff;
  box-shadow: 0 0 8px rgba(26, 255, 255, 0.8);
}

.cyber-close {
  color: #1affff;
  font-size: 20px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.cyber-close:hover {
  background: rgba(26, 255, 255, 0.2);
  box-shadow: 0 0 8px rgba(26, 255, 255, 0.4);
}

.cyber-dialog-body {
  padding: 25px 20px;
  background-image: url(@/assets/images/53bg.png);
  background-size: cover;
  background-position: center;
  position: relative;
}

.cyber-dialog-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(1, 19, 38, 0.85);
  z-index: 0;
}

.cyber-form-container {
  position: relative;
  z-index: 1;
  background: rgba(0, 40, 80, 0.4);
  border-radius: 4px;
  padding: 20px;
  border: 1px solid rgba(0, 224, 219, 0.2);
  box-shadow: inset 0 0 15px rgba(0, 20, 40, 0.5);
  width: 90%;
  margin: 0 auto;
}

.cyber-form {
  width: 100%;
}

.cyber-form :deep(.el-form-item) {
  margin-bottom: 25px;
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.cyber-form :deep(.el-form-item__label) {
  width: auto;
  padding-right: 0;
}

.cyber-form :deep(.el-form-item__content) {
  margin-left: 0 !important;
  flex: 1;
}

.cyber-label {
  display: flex;
  align-items: center;
  width: 150px; /* 增加宽度确保足够放下"确认密码"四个字 */
  justify-content: flex-end;
  padding-right: 20px;
  box-sizing: border-box;
}

.cyber-required {
  color: #ff4949;
  margin-right: 4px;
  font-size: 16px;
  display: inline-block;
  width: 10px; /* 固定宽度 */
  text-align: center;
}

.cyber-label span:last-child {
  color: #1affff;
  font-size: 16px;
  min-width: 80px; /* 确保文字有最小宽度 */
  text-align: right; /* 文字右对齐 */
}

/* 自定义表单验证错误信息样式 */
.cyber-form :deep(.el-form-item__error) {
  color: #ff4949;
  font-size: 14px;
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 4px;
}

.cyber-form :deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #ff4949 !important;
  box-shadow: 0 0 8px rgba(255, 73, 73, 0.4) !important;
}

.cyber-form :deep(.el-input__wrapper) {
  background: rgba(0, 20, 40, 0.5) !important;
  border: 1px solid rgba(0, 224, 219, 0.3) !important;
  box-shadow: none !important;
  border-radius: 4px;
  height: 40px;
  transition: all 0.3s;
  width: 100%;
  max-width: 460px; /* 设置输入框最大宽度 */
}

.cyber-form :deep(.el-input__wrapper:hover),
.cyber-form :deep(.el-input__wrapper.is-focus) {
  border: 1px solid rgba(0, 224, 219, 0.8) !important;
  box-shadow: 0 0 10px rgba(0, 224, 219, 0.3) !important;
}

.cyber-form :deep(.el-input__inner) {
  background: transparent;
  border: none;
  color: #ffffff;
  height: 40px;
}

.cyber-dialog-footer {
  display: flex;
  justify-content: center;
  padding: 20px;
  gap: 20px;
  background: linear-gradient(to top, rgba(0, 40, 80, 0.9), rgba(0, 20, 40, 0.8));
  border-top: 1px solid rgba(0, 224, 219, 0.3);
}

.cyber-cancel-btn {
  width: 120px;
  height: 40px;
  background: rgba(0, 40, 80, 0.8);
  border: 1px solid rgba(0, 224, 219, 0.3);
  color: #1affff;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.cyber-cancel-btn:hover {
  background: rgba(0, 40, 80, 0.9);
  box-shadow: 0 0 10px rgba(0, 224, 219, 0.4);
}

.cyber-confirm-btn {
  width: 120px;
  height: 40px;
  background: linear-gradient(135deg, rgba(0, 160, 233, 0.2), rgba(26, 255, 255, 0.2));
  border: 1px solid rgba(0, 224, 219, 0.5);
  color: #1affff;
  font-size: 16px;
  font-weight: bold;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.cyber-confirm-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(26, 255, 255, 0.3), transparent);
  transition: all 0.6s;
}

.cyber-confirm-btn:hover {
  background: linear-gradient(135deg, rgba(0, 160, 233, 0.4), rgba(26, 255, 255, 0.4));
  box-shadow: 0 0 15px rgba(0, 224, 219, 0.6);
}

.cyber-confirm-btn:hover::before {
  left: 100%;
}

/* 抽屉表单样式 */
:deep(.el-drawer) {
  background: rgba(0, 40, 80, 0.9);
}

:deep(.el-drawer__header) {
  background: rgba(0, 20, 40, 0.8);
  color: #1affff;
  padding: 16px 20px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(0, 224, 219, 0.3);
}

/* 表单网格布局 每个小框 */
.form-section {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 224, 219, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

/* 信息标题 */
.section-title {
  color: #1affff;
  border-bottom: 2px solid rgba(0, 224, 219, 0.3);
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.form-grid {
  padding: 0 20px;
}

:deep(.el-input__inner) {
  background: rgba(0, 20, 40, 0.5);
  border: 1px solid rgba(0, 224, 219, 0.3);
  color: #ffffff;
}

.Button-group2 {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  gap: 40px;
}

.Button-group2 :deep(.el-button--default) {
  background: rgba(0, 40, 80, 0.8);
  border: 1px solid rgba(0, 224, 219, 0.3);
  color: #1affff;
}

.Button-group2 :deep(.el-button--primary) {
  background: rgba(0, 224, 219, 0.2);
  border: 1px solid rgba(0, 224, 219, 0.5);
  color: #1affff;
}

.Button-group2 :deep(.el-button--primary:hover) {
  background: rgba(0, 224, 219, 0.4);
  box-shadow: 0 0 8px rgba(0, 224, 219, 0.6);
}

/* 科技感对话框样式 */
:deep(.cyber-dialog) {
  border-radius: 0;
  overflow: visible;
}

:deep(.cyber-dialog .el-dialog) {
  background: transparent;
  margin-top: 15vh !important;
  box-shadow: none;
  border: none;
  overflow: visible;
  padding: 0;
}

:deep(.cyber-dialog .el-dialog__body) {
  padding: 0;
  margin: 0;
}

:deep(.cyber-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.cyber-dialog .el-dialog__footer) {
  padding: 0;
  margin: 0;
}

/* 覆盖Element Plus默认的白色背景 */
:deep(.el-overlay) {
  --el-dialog-bg-color: transparent !important;
}

:deep(.el-overlay-dialog) {
  --el-bg-color: transparent !important;
}

:deep(.el-dialog) {
  --el-dialog-bg-color: transparent !important;
  --el-bg-color: transparent !important;
  background-color: transparent !important;
}

/* 自定义密码眼睛图标样式 */
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
}

:deep(.el-input__suffix-inner) {
  display: flex;
  align-items: center;
}

:deep(.el-input__icon) {
  color: rgba(26, 255, 255, 0.7);
  font-size: 16px;
  transition: all 0.3s;
}

:deep(.el-input__icon:hover) {
  color: #1affff;
  transform: scale(1.1);
}

/* 自定义表单布局样式 */
.form-row {
  display: flex;
  margin-bottom: 25px;
  width: 100%;
  align-items: flex-start;
}

.form-label {
  width: 100px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 10px;
  padding-top: 10px; /* 垂直对齐调整 */
}

.form-input {
  flex: 1;
}

.cyber-required {
  color: #ff4949;
  margin-right: 4px;
  font-size: 16px;
}

.label-text {
  color: #1affff;
  font-size: 16px;
}

/* 表单项样式调整 */
.cyber-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.cyber-form :deep(.el-form-item__content) {
  width: 100%;
}

.cyber-form :deep(.el-form-item__error) {
  color: #ff4949;
  font-size: 14px;
  padding-top: 4px;
}

.cyber-form :deep(.el-input__wrapper) {
  background: rgba(0, 20, 40, 0.5) !important;
  border: 1px solid rgba(0, 224, 219, 0.3) !important;
  box-shadow: none !important;
  border-radius: 4px;
  height: 40px;
  transition: all 0.3s;
  width: 100%;
}
@media (max-width: 900px) {
  .containers {
    width: 99vw !important;
    margin: 0 !important;
    padding: 0 !important;
    min-width: 0 !important;
    height: auto !important;
  }
  .Button-group1 {
    padding: 2vw 0 !important;
  }
  .add-button {
    width: 20vw !important;
    height: 6vw !important;
    font-size: 2.5vw !important;
  }
  .table-container {
    padding: 2vw 1vw !important;
    border-radius: 2vw !important;
  }
  .table-wrapper {
    min-width: 0 !important;
  }
  :deep(.cyber-table tr) {
    font-size: 2vw !important;
    height: 8vw !important;
  }
  :deep(.cyber-table th) {
    font-size: 2.5vw !important;
    padding: 1vw 0.5vw !important;
  }
  :deep(.cyber-table td) {
    font-size: 2vw !important;
    padding: 1vw 0.5vw !important;
  }
  .action-buttons {
    gap: 2vw !important;
  }
  .detail-btn {
    width: 6vw !important;
    height: 6vw !important;
    font-size: 2vw !important;
  }
  .pagination-container {
    margin-top: 2vw !important;
    justify-content: center !important;
  }
}
</style>
