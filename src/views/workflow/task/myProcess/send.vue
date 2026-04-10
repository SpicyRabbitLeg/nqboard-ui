<template>
    <div class="layout-padding">
        <el-card class="box-card">
            <div slot="header" class="clearfix">
                <span class="Document"><el-icon>
                        <Document />
                    </el-icon>{{ t('myProcess.createTask2') }}</span>
                <router-link to="/workflow/task/myProcess/index"><el-button style="float: right;" size="small"
                        type="danger">{{ t('myProcess.close') }}</el-button></router-link>
            </div>

            <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
                <el-tab-pane :label="$t('myProcess.table')" name="table">
                    <el-form ref="dataFormRef" :model="fromData" formDialogRef label-width="120px" v-loading="loading">
                        <el-form-item label="部署ID" prop="deployId">
                            <el-input v-model="fromData.api" placeholder="请输入部署ID" />
                        </el-form-item>
                        <el-form-item label="流程定义ID" prop="procDefId">
                            <el-input v-model="fromData.b" placeholder="请输入流程定义ID" />
                        </el-form-item>
                        <el-form-item label="变量" prop="variables">
                            <el-input v-model="fromData.c" placeholder="请输入变量" />
                        </el-form-item>
                        <el-form-item label="测试" prop="test">
                            <el-input v-model="fromData.test" placeholder="请输入测试" />
                        </el-form-item>
                        <el-form-item label="天数" prop="test">
                            <el-input v-model="fromData.day" placeholder="请输入天数" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="submitForm">提交</el-button>
                            <el-button @click="dataFormRef.value?.resetFields()">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <el-tab-pane :label="$t('myProcess.flowImg')" name="flowImg">
                    <BpmnViewer v-if="flowData && flowData.xmlData" :flowData="flowData" />
                    <div v-else style="text-align: center; padding: 50px; color: #999;">
                        {{ t('myProcess.loadingFlow') || '正在加载流程图...' }}
                    </div>
                </el-tab-pane>
            </el-tabs>


            <!--选择流程接收人-->
            <el-dialog :title="taskTitle" v-model="taskOpen" :close-on-click-modal="false" draggable>
                <FlowUser v-if="checkSendUser" :checkType="checkType" @handleUserSelect="handleUserSelect" />
                <FlowRole v-if="checkSendRole" @handleRoleSelect="handleRoleSelect" />
                <span slot="footer" class="dialog-footer">
                    <el-button @click="taskOpen = false">取 消</el-button>
                    <el-button type="primary" @click="submitTask">提 交</el-button>
                </span>
            </el-dialog>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="processSend">
import { useI18n } from 'vue-i18n';
import { useMessage } from '/@/hooks/message';
import { flowXmlAndNode, definitionStart } from '/@/api/workflow/definition';
import { getNextFlowNodeByStart } from '/@/api/workflow/task';


// 引入组件
const BpmnViewer = defineAsyncComponent(() => import('/@/components/Process/viewer/index.vue'));
const FlowUser = defineAsyncComponent(() => import('/@/components/Flow/User/index.vue'));
const FlowRole = defineAsyncComponent(() => import('/@/components/Flow/Role/index.vue'));

// 使用国际化插件
const { t } = useI18n();


// 默认项
const activeName = ref('table');
const route = useRoute();
const router = useRouter();

// 属性
const taskOpen = ref(false);
const checkSendUser = ref(false);
const checkSendRole = ref(false);
const checkType = ref("");
const multiInstanceVars = ref("");
const taskTitle = ref("");
const deployId = ref("") as any;
const procDefId = ref("") as any;
const loading = ref(false);
const dataFormRef = ref();
const checkValues = ref(null) as any;
const flowData = ref({
    xmlData: '',
    nodeData: []
}) as any;

// TODO  表单数据 每个都有自己的提交页面
const fromData = ref({
    a: "",
    b: "",
    c: "",
    test: ''
}) as any;


// 点击切换
const handleClick = (tab: any, event: any) => {
    if (tab.props.name != 'flowImg') {
        return;
    }
    loadImg();
}


// 加载流程图
const loadImg = async () => {
    try {
        const res = await flowXmlAndNode({ deployId: deployId.value });;
        flowData.value = res.data;
    } catch (err: any) {
        useMessage().error(err.msg);
    }
}


// 提交表单
const submitForm = () => {
    const saveDate = {
        // 流程环节定义ID
        deploymentId: deployId.value,
        // 请求表单入参 
        variables: fromData.value,
        procDefId: ''
    }
    getNextFlowNodeByStart(saveDate).then((res: any) => {
        if (res.data) {
            const data = res.data;
            if (data.dataType === 'dynamic') {
                if (data.type === 'assignee') {
                    checkSendUser.value = true;
                    checkType.value = "single";
                } else if (data.type === 'candidateUsers') {
                    checkSendUser.value = true;
                    checkType.value = "multiple";
                } else if (data.type === 'candidateGroups') {
                    checkSendRole.value = true;
                } else {
                    // 流程设计指定的 elementVariable 作为会签人员列表
                    multiInstanceVars.value = data.vars;
                    checkSendUser.value = true;
                    checkType.value = "multiple";
                }
                taskOpen.value = true;
                taskTitle.value = "选择任务接收";
            } else {
                if (procDefId.value) {
                    saveDate.procDefId = procDefId.value;
                    definitionStart(saveDate).then((res: any) => {
                        router.push({
                            path: '/workflow/task/myProcess/index',
                            query: {
                                timestamp: Date.now()
                            }
                        });
                        useMessage().success(t('myProcess.sendSuccessText'));
                    });
                }
            }
        } else {
            useMessage().error(t('myProcess.sendFailText'));
        }
    });
}

// 提交流程
const submitTask = () => {
    if (!checkValues.value && checkSendUser.value) {
        useMessage().error("请选择任务接收!");
        return;
    }

    if (!checkValues.value && checkSendRole.value) {
        useMessage().error("请选择流程接收角色组!");
        return;
    }

    // 设置审批人
    fromData.value.approval = checkValues.value;
    const saveDate = {
        // 流程环节定义ID
        deploymentId: deployId.value,
        // 请求表单入参 
        variables: fromData.value,
        procDefId: procDefId.value
    }
    definitionStart(saveDate).then((res: any) => {
        router.push({
            path: '/workflow/task/myProcess/index',
            query: {
                timestamp: Date.now()
            }
        });
        useMessage().success(t('myProcess.sendSuccessText'));
    });
}

// 选择用户
const handleUserSelect = (selection: any) => {
    if (selection) {
        if (selection instanceof Array) {
            const selectVal = selection.map(item => item.userId);
            if (multiInstanceVars.value) {
                checkValues.value = selectVal;
            } else {
                checkValues.value = selectVal.join(',');
            }
        } else {
            checkValues.value = selection.userId;
        }
    }
}

// 选择角色
const handleRoleSelect = (selection: any) => {
    if (selection) {
        if (selection instanceof Array) {
            const selectVal = selection.map(item => item.roleId);
            checkValues.value = selectVal.join(',')
        } else {
            checkValues.value = selection.roleId;
        }
    }
}

// 页面加载时
onMounted(() => {
    deployId.value = route.query.deployId;
    // 初始化表单
    procDefId.value = route.query.procDefId;

    loadImg();
});
</script>