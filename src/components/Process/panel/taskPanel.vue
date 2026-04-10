<template>
  <div>
    <el-form label-width="80px" size="small">
      <el-form-item label="异步">
        <el-switch v-model="bpmnFormData.async" active-text="是" inactive-text="否"
          @change="updateElementTask('async')" />
      </el-form-item>

      <el-form-item label="用户类型">
        <el-select v-model="bpmnFormData.userType" placeholder="选择人员" @change="updateUserType">
          <el-option v-for="(item, index) in flow_user_type" :key="index" :label="item.label"
            :value="item.value"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="指定人员" v-if="bpmnFormData.userType === 'assignee'">
        <el-input-tag v-model="bpmnFormData.assignee" tag-type="primary" />
        <el-button-group style="margin-top: 4px">
          <!--指定人员-->
          <el-tooltip class="box-item" effect="dark" content="指定人员" placement="bottom">
            <el-button size="small" type="primary" icon="User" @click="singleUserCheck" />
          </el-tooltip>
          <!--选择表达式-->
          <el-tooltip class="box-item" effect="dark" content="选择表达式" placement="bottom">
            <el-button size="small" type="warning" icon="Postcard" @click="singleExpCheck" />
          </el-tooltip>
        </el-button-group>
      </el-form-item>

      <el-form-item label="候选人员" v-else-if="bpmnFormData.userType === 'candidateUsers'">
        <el-input-tag v-model="bpmnFormData.candidateUsers" tag-type="primary" />
        <el-button-group style="margin-top: 4px">
          <!--候选人员-->
          <el-tooltip class="box-item" effect="dark" content="候选人员" placement="bottom">
            <el-button size="small" type="primary" icon="User" @click="multipleUserCheck" />
          </el-tooltip>
          <!--选择表达式-->
          <el-tooltip class="box-item" effect="dark" content="选择表达式" placement="bottom">
            <el-button size="small" type="warning" icon="Postcard" @click="singleExpCheck" />
          </el-tooltip>
        </el-button-group>
      </el-form-item>

      <el-form-item label="候选角色" v-else>
        <el-input-tag v-model="bpmnFormData.candidateGroups" tag-type="primary" />
        <el-button-group style="margin-top: 4px">
          <!--候选角色-->
          <el-tooltip class="box-item" effect="dark" content="候选角色" placement="bottom">
            <el-button size="small" type="primary" icon="User" @click="multipleRoleCheck" />
          </el-tooltip>
          <!--选择表达式-->
          <el-tooltip class="box-item" effect="dark" content="选择表达式" placement="bottom">
            <el-button size="small" type="warning" icon="Postcard" @click="singleExpCheck" />
          </el-tooltip>
        </el-button-group>
      </el-form-item>

      <el-form-item label="优先级">
        <el-input v-model="bpmnFormData.priority" @change="updateElementTask('priority')" />
      </el-form-item>

      <el-form-item label="到期时间">
        <el-input v-model="bpmnFormData.dueDate" @change="updateElementTask('dueDate')" />
      </el-form-item>
    </el-form>

    <!-- 选择人员 -->
    <el-dialog title="选择人员" v-model="userVisible" width="60%" :close-on-click-modal="false" draggable>
      <User v-if="userVisible" :checkType="checkType" :selectValues="selectData.assignee || selectData.candidateUsers"
        @handleUserSelect="userSelect" />
      <div slot="footer" style="text-align: right; margin-top: 20px;">
        <el-button @click="userVisible = false">取 消</el-button>
        <el-button type="primary" @click="checkUserComplete">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 选择候选角色 -->
    <el-dialog title="选择候选角色" v-model="roleVisible" width="60%" :close-on-click-modal="false" draggable>
      <Role v-if="roleVisible" :selectValues="selectData.candidateGroups" @handleRoleSelect="roleSelect" />
      <div slot="footer" style="text-align: right; margin-top: 20px;">
        <el-button size="small" @click="roleVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="roleVisible = false">确 定</el-button>
      </div>
    </el-dialog>

    <!--选择表达式 -->
    <el-dialog title="流程表达式" v-model="expVisible" width="60%" :close-on-click-modal="false" draggable>
      <Expression v-if="expVisible" :selectValues="selectData.exp" @handleSingleExpSelect="expSelect"></Expression>
      <div slot="footer" style="text-align: right; margin-top: 20px;">
        <el-button @click="expVisible = false">取 消</el-button>
        <el-button type="primary" @click="expVisible = false">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="TaskPanel">
import { StrUtil } from '/@/utils/StrUtil.js';
import { useDict } from '/@/hooks/dict';
import { useModelerStore } from '/@/stores/modeler';

const Expression = defineAsyncComponent(() => import('/@/components/Flow/Expression/index.vue'));
const User = defineAsyncComponent(() => import('/@/components/Flow/User/index.vue'));
const Role = defineAsyncComponent(() => import('/@/components/Flow/Role/index.vue'));

// 定义props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

// 定义查询字典
const { flow_user_type } = useDict('flow_user_type');

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 自定义属性
// 任务表单数据
const bpmnFormData = ref({
  async: false,
  userType: "",
  assignee: [],
  candidateUsers: [],
  candidateGroups: [],
  dueDate: "",
  priority: "",
  dataType: "",
  expId: ""
}) as any;
// 选择数据
const selectData = ref({
  assignee: null,
  candidateUsers: null,
  candidateGroups: null,
  exp: null,
}) as any;


// 显示隐藏
const userVisible = ref(false);
const expVisible = ref(false);
const roleVisible = ref(false);

const checkType = ref("");

// 初始化表单
const resetTaskForm = () => {
  // 初始化设为空值
  bpmnFormData.value = {
    async: false,
    userType: "",
    assignee: null,
    candidateUsers: null,
    candidateGroups: null,
    dueDate: "",
    priority: "",
    dataType: "",
    expId: "",
  }
  selectData.value = {
    assignee: null,
    candidateUsers: null,
    candidateGroups: null,
    exp: null,
  }

  // 回显任务数据
  for (let key in bpmnFormData.value) {
    const value = modelerStore.element?.businessObject[key] || bpmnFormData.value[key];
    if (!value) {
      continue;
    }

    if (key === "assignee" || key === "candidateUsers" || key === "candidateGroups") {
      bpmnFormData.value[key] = [value];
    } else {
      bpmnFormData.value[key] = value;
    }
  }
  checkValuesEcho(bpmnFormData.value);
}

// 回显数据
const checkValuesEcho = (formData: any) => {
  if (StrUtil.isNotBlank(formData.expId)) {
    getExpList(formData.expId, formData.userType);
  } else {
    if ("candidateGroups" === formData.userType) {
      getRoleList(formData[formData.userType], formData.userType);
    } else {
      getUserList(formData[formData.userType], formData.userType);
    }
  }
}

// 获取表达式信息
const getExpList = (val: any, key: any) => {
  if (StrUtil.isNotBlank(val)) {
    bpmnFormData.value[key] = [modelerStore.expList?.find(item => item.id.toString() === val).name];
    selectData.value.exp = modelerStore.expList?.find(item => item.id.toString() === val).id;
  }
}

// 获取人员信息
const getUserList = (val: any, key: any) => {
  if (StrUtil.isNotBlank(val)) {
    if ('assignee' === key) {
      const newArr = modelerStore.userList?.filter(i => val.includes(i.userId.toString()));
      bpmnFormData.value[key] = newArr.map(item => item.name);
      selectData.value[key] = newArr.find(item => item.userId.toString() === val.toString()).userId;
    } else {
      val = val[0].split(',');
      const newArr = modelerStore.userList?.filter(i => val.includes(i.userId.toString()));
      bpmnFormData.value[key] = newArr.map(item => item.name);
      selectData.value[key] = newArr.map(item => item.userId);
    }
  }
}

// 获取角色信息
const getRoleList = (val: any, key: any) => {
  if (StrUtil.isNotBlank(val)) {
    val = val[0].split(',');
    const newArr = modelerStore.roleList?.filter(i => val.includes(i.roleId.toString()))
    bpmnFormData.value[key] = newArr.map(item => item.roleName);
    selectData.value[key] = newArr.map(item => item.roleId);
  }
}

// 更新人员类型
const updateUserType = (val: string) => {
  // 删除xml中已选择数据类型节点
  deleteFlowAttar();
  delete modelerStore.element.businessObject[`userType`];
  // 清除已选人员数据
  bpmnFormData.value[val] = null;
  selectData.value = {
    assignee: null,
    candidateUsers: null,
    candidateGroups: null,
    exp: null,
  }
  // 写入userType节点信息到xml
  updateCustomElement('userType', val);
}


// 更新任务节点属性
const updateElementTask = (key: string) => {
  const taskAttr = Object.create(null);
  taskAttr[key] = bpmnFormData.value[key] || "";
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr);
}

// 更新自定义流程节点/参数信息
const updateCustomElement = (key: any, value: any) => {
  const taskAttr = Object.create(null);
  taskAttr[key] = value;
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr);
}


// 删除节点
const deleteFlowAttar = () => {
  delete modelerStore.element.businessObject[`dataType`]
  delete modelerStore.element.businessObject[`expId`]
  delete modelerStore.element.businessObject[`assignee`]
  delete modelerStore.element.businessObject[`candidateUsers`]
  delete modelerStore.element.businessObject[`candidateGroups`]
}

// 表达式选中数据
const expSelect = (selection: any) => {
  if (selection) {
    deleteFlowAttar();
    bpmnFormData.value[bpmnFormData.value.userType] = [selection.name];
    updateCustomElement('dataType', selection.dataType);
    updateCustomElement('expId', selection.id.toString());
    updateCustomElement(bpmnFormData.value.userType, selection.expression);
    handleSelectData("exp", selection.id);
  }
}
// 用户选中数据 
const userSelect = (selection: Array<any>) => {
  if (selection) {
    deleteFlowAttar();
    updateCustomElement('dataType', 'fixed');
    const userIds = selection.map(item => item.userId);
    const nickName = selection.map(item => item.name);
    bpmnFormData.value[bpmnFormData.value.userType] = nickName;
    updateCustomElement(bpmnFormData.value.userType, userIds.join(','));
    handleSelectData(bpmnFormData.value.userType, userIds);
  }
}

// 角色选中数据
const roleSelect = (selection: Array<any>) => {
  if (selection) {
    deleteFlowAttar();
    const roleIds = selection.map(item => item.roleId);
    const roleNames = selection.map(item => item.roleName);
    bpmnFormData.value[bpmnFormData.value.userType] = roleNames;
    updateCustomElement(bpmnFormData.value.userType, roleIds.join(','));
    handleSelectData(bpmnFormData.value.userType, roleIds);
  }
}

// 处理人员回显
const handleSelectData = (key: any, value: any) => {
  for (let oldKey in selectData.value) {
    if (key !== oldKey) {
      selectData.value[oldKey] = null;
    } else {
      selectData.value[oldKey] = value;
    }
  }
}

// 多选人员
const multipleUserCheck = () => {
  userVisible.value = true;
  checkType.value = "multiple";
}

// 单选人员
const singleUserCheck = () => {
  userVisible.value = true;
  checkType.value = "single";
}

// 单选表达式
const singleExpCheck = () => {
  expVisible.value = true;
}

// 多选角色
const multipleRoleCheck = () => {
  roleVisible.value = true;
}

// 用户选中赋值
const checkUserComplete = () => {
  userVisible.value = false;
  checkType.value = "";
}

// 监听
watch(() => props.id, (newVal) => {
  if (StrUtil.isNotBlank(newVal)) {
    resetTaskForm();
  }
}, { immediate: true });
</script>