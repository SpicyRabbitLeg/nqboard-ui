<template>
  <div class="layout-padding">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
                <span class="Document"><el-icon>
                        <Document/>
                    </el-icon>{{ t('myProcess.todoTask') }}</span>
        <el-tag style="margin-left:10px">发起人:{{ startUser }}</el-tag>
        <el-tag style="margin-left:10px">任务节点:{{ taskName }}</el-tag>
        <router-link to="/workflow/task/todo/index">
          <el-button style="float: right;" size="small"
                     type="danger">{{ t('myProcess.close') }}
          </el-button>
        </router-link>
      </div>
      <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
        <el-tab-pane :label="$t('myProcess.table')" name="table">
          <el-form ref="dataFormRef" :model="fromData" formDialogRef label-width="120px">
            <el-form-item label="部署ID" prop="deployId">
              <el-input v-model="fromData.a" placeholder="请输入部署ID"/>
            </el-form-item>
            <el-form-item label="流程定义ID" prop="procDefId">
              <el-input v-model="fromData.b" placeholder="请输入流程定义ID"/>
            </el-form-item>
            <el-form-item label="变量" prop="variables">
              <el-input v-model="fromData.c" placeholder="请输入变量"/>
            </el-form-item>
            <el-form-item label="测试" prop="test">
              <el-input v-model="fromData.test" placeholder="请输入测试"/>
            </el-form-item>
            <el-form-item label="天数" prop="test">
              <el-input v-model="fromData.day" placeholder="请输入天数"/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleComplete">审批</el-button>
            </el-form-item>
          </el-form>

          <!--  TODO 写成根据流程节点动态加载 -->
          <template #footer>
                        <span class="dialog-footer">
                            <el-button type="primary" @click="handleComplete">审批</el-button>
                        </span>
          </template>
        </el-tab-pane>

        <el-tab-pane :label="$t('myProcess.his')" name="his">
          <el-col :span="16" :offset="4">
            <el-timeline>
              <el-timeline-item v-for="(item, index) in flowRecordList" :key="index"
                                :icon="setIcon(item.finishTime)" :color="setColor(item.finishTime)">
                <p style="font-weight: 700">{{ item.taskName }}</p>
                <el-card :body-style="{ padding: '10px' }">
                  <el-descriptions class="margin-top" :column="1" size="small" border>
                    <el-descriptions-item v-if="item.assigneeName" label-class-name="my-label">
                      <template slot="label"><i class="el-icon-user"></i>办理人</template>
                      {{ item.assigneeName }}
                      <el-tag type="info" size="small">{{ item.deptName }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item v-if="item.candidate" label-class-name="my-label">
                      <template slot="label"><i class="el-icon-user"></i>候选办理</template>
                      {{ item.candidate }}
                    </el-descriptions-item>
                    <el-descriptions-item label-class-name="my-label">
                      <template slot="label"><i class="el-icon-date"></i>接收时间</template>
                      {{ item.createTime }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="item.finishTime" label-class-name="my-label">
                      <template slot="label"><i class="el-icon-date"></i>处理时间</template>
                      {{ item.finishTime }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="item.duration" label-class-name="my-label">
                      <template slot="label"><i class="el-icon-time"></i>耗时</template>
                      {{ item.duration }}
                    </el-descriptions-item>
                    <el-descriptions-item v-if="item.comment" label-class-name="my-label">
                      <template slot="label"><i class="el-icon-tickets"></i>处理意见</template>
                      {{ item.comment.comment }}
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-col>
        </el-tab-pane>

        <el-tab-pane :label="$t('myProcess.flowImg')" name="flowImg">
          <BpmnViewer v-if="flowData && flowData.xmlData" :flowData="flowData"
                      :procInsId="taskForm.procInsId"/>
          <div v-else style="text-align: center; padding: 50px; color: #999;">
            {{ t('myProcess.loadingFlow') || '正在加载流程图...' }}
          </div>
        </el-tab-pane>
      </el-tabs>


      <!-- 审批dialog -->
      <el-dialog title="审批" v-model="completeOpen" :close-on-click-modal="false" draggable>
        <el-form ref="taskFormRef" :model="taskForm">
          <el-form-item prop="targetKey">
            <flow-user v-if="checkSendUser" :checkType="checkType"
                       @handleUserSelect="handleUserSelect"></flow-user>
            <flow-role v-if="checkSendRole" @handleRoleSelect="handleRoleSelect"></flow-role>
          </el-form-item>
          <el-form-item label="处理意见" label-width="80px" prop="comment"
                        :rules="[{ required: true, message: '请输入处理意见', trigger: 'blur' }]">
            <el-input type="textarea" v-model="taskForm.comment" placeholder="请输入处理意见"/>
          </el-form-item>
          <el-form-item>
            <el-button @click="completeOpen = false">取 消</el-button>
            <el-button type="primary" @click="taskComplete">确 定</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
    </el-card>
  </div>
</template>
<script setup lang="ts" name="todoDetail">
import {useI18n} from 'vue-i18n';
import {delObjs, complete, getNextFlowNode, getProcessVariables, getFlowRecord} from '/@/api/workflow/task';
import {useMessage} from "/@/hooks/message";
import {flowXmlAndNode,} from '/@/api/workflow/definition';

// 使用国际化插件
const {t} = useI18n();

// 路由
const route = useRoute();
const router = useRouter();

// 引入组件
const BpmnViewer = defineAsyncComponent(() => import('/@/components/Process/viewer/index.vue'));

// 变量
const checkSendUser = ref(false);
const checkSendRole = ref(false);
const checkType = ref("");
const multiInstanceVars = ref("");
const taskName = ref() as any;
const startUser = ref() as any;
const activeName = ref("table");
const taskForm = reactive({
  returnTaskShow: false, // 是否展示回退表单
  delegateTaskShow: false, // 是否展示回退表单
  defaultTaskShow: true, // 默认处理
  comment: "", // 意见内容
  procInsId: "", // 流程实例编号
  instanceId: "", // 流程实例编号
  deployId: "",  // 流程定义编号
  taskId: "",// 流程任务编号
  procDefId: "",  // 流程编号
  targetKey: "",
  variables: {},
}) as any;
const taskFormRef = ref();
const flowData = ref({}) as any;

// 表单
const fromData = ref({}) as any;

const flowRecordList = ref([]) as any;

// 显示否
const completeOpen = ref(false);

// 加载流程图
const loadImg = async () => {
  try {
    const res = await flowXmlAndNode({deployId: taskForm.deployId, procInsId: taskForm.procInsId});
    flowData.value = res.data;
  } catch (err: any) {
    useMessage().error(err.msg);
  }
}

// 点击切换
const handleClick = (tab: any, event: any) => {
  if (tab.props.name != 'flowImg') {
    return;
  }
  loadImg();
}

// 获取流程变量内容
const processVariables = () => {
  getProcessVariables(taskForm.taskId).then(res => {
    nextTick(() => {
      Object.assign(fromData.value, res.data);
    })
  })
}

// 获取流转记录
const getFlowRecordList = () => {
  const params = {procInsId: taskForm.procInsId, deployId: taskForm.deployId}
  getFlowRecord(params).then(res => {
    flowRecordList.value = res.data.flowList;
  }).catch(err => {
    useMessage().error(err.msg);
  });
}

// 设置icon
const setIcon = (val: string) => {
  if (val) {
    return "el-icon-check";
  } else {
    return "el-icon-time";
  }
}

// ...
const setColor = (val: any) => {
  if (val) {
    return "#2bc418";
  } else {
    return "#b3bdbb";
  }
}


// 审批流程
const handleComplete = () => {
  completeOpen.value = true;
  submitForm();
}

//  用户审批任务
const taskComplete = () => {
  if (!taskForm.variables && checkSendUser.value) {
    useMessage().error("请选择流程接收人员!");
    return;
  }
  if (!taskForm.variables && checkSendRole.value) {
    useMessage().error("请选择流程接收角色组!");
    return;
  }
  if (!taskForm.comment) {
    useMessage().error("请输入审批意见!");
    return;
  }

  // 审批
  complete(taskForm).then(resp => {
    useMessage().success("审批成功");
    router.push({
      path: "/workflow/task/todo/index",
      query: {
        time: Date.now()
      }
    })
  });
}


/** 申请流程表单数据提交 */
const submitForm = () => {
  const params = {taskId: taskForm.taskId};
  getNextFlowNode(params).then(res => {
    const data = res.data;
    if (data) {
      if (data.dataType === 'dynamic') {
        if (data.type === 'assignee') { // 指定人员
          checkSendUser.value = true;
          checkType.value = "single";
        } else if (data.type === 'candidateUsers') {  // 候选人员(多个)
          checkSendUser.value = true;
          checkType.value = "multiple";
        } else if (data.type === 'candidateGroups') { // 指定组(所属角色接收任务)
          checkSendRole.value = true;
        } else { // 会签
          // 流程设计指定的 elementVariable 作为会签人员列表
          multiInstanceVars.value = data.vars;
          checkSendUser.value = true;
          checkType.value = "multiple";
        }
      }
    }
  })
}


// 选择用户
const handleUserSelect = (selection: any) => {
  if (selection) {
    if (selection instanceof Array) {
      const selectVal = selection.map(item => item.userId.toString());
      if (multiInstanceVars.value) {
        taskForm.variablesp[multiInstanceVars.value] = selectVal
      } else {
        taskForm.variables.approval = selectVal.join(',');
      }
    } else {
      taskForm.variables.approval = selection.userId.toString();
    }
  }
}

// 选择角色
const handleRoleSelect = (selection: any) => {
  if (selection) {
    if (selection instanceof Array) {
      const selectVal = selection.map(item => item.roleId.toString());
      taskForm.variables.approval = selectVal.join(',');
    } else {
      taskForm.variables.approval = selection;
    }
  }
}

// 初始化
onMounted(() => {
  taskName.value = route.query.taskName;
  startUser.value = route.query.startUser;

  taskForm.deployId = route.query.deployId;
  taskForm.taskId = route.query.taskId;
  taskForm.procInsId = route.query.procInsId;
  taskForm.executionId = route.query.executionId;
  taskForm.instanceId = route.query.procInsId;

  // 获取表单历史数据
  processVariables();
  getFlowRecordList();
});
</script>