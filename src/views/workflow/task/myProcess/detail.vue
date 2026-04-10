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
                    <el-form ref="dataFormRef" :model="fromData" disabled formDialogRef label-width="120px">
                        <el-form-item label="部署ID" prop="deployId">
                            <el-input v-model="fromData.a" placeholder="请输入部署ID" />
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
                    </el-form>
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
                    <BpmnViewer v-if="flowData && flowData.xmlData" :flowData="flowData" :procInsId="procInsId" />
                    <div v-else style="text-align: center; padding: 50px; color: #999;">
                        {{ t('myProcess.loadingFlow') || '正在加载流程图...' }}
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="processDetail">
import { useI18n } from 'vue-i18n';
import { useMessage } from '/@/hooks/message';
import { flowXmlAndNode, definitionStart } from '/@/api/workflow/definition';
import { getProcessVariables, getFlowRecord } from '/@/api/workflow/task';

// 使用国际化插件
const { t } = useI18n();
const route = useRoute();

// 引入组件
const BpmnViewer = defineAsyncComponent(() => import('/@/components/Process/viewer/index.vue'));

// 变量
const deployId = ref("") as any;
const procInsId = ref("") as any;
const taskId = ref("") as any;
const flowData = ref({}) as any;
const activeName = ref("table");


const fromData = ref({}) as any;
const dataFormRef = ref() as any;

const flowRecordList = ref([]) as any;

// 加载流程图
const loadImg = async () => {
    try {
        const res = await flowXmlAndNode({ deployId: deployId.value, procInsId: procInsId.value });;
        flowData.value = res.data;
    } catch (err: any) {
        useMessage().error(err.msg);
    }
}


// 切换
// 点击切换
const handleClick = (tab: any, event: any) => {
    if (tab.props.name != 'flowImg') {
        return;
    }
    loadImg();
}

// 获取流程变量内容
const processVariables = () => {
    getProcessVariables(taskId.value).then(res => {
        nextTick(() => {
            Object.assign(fromData.value, res.data);
        })
    })
}

// 获取流转记录
const getFlowRecordList = () => {
    const params = { procInsId: procInsId.value, deployId: deployId }
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

// 初始化
onMounted(() => {
    deployId.value = route.query?.deployId;
    procInsId.value = route.query?.procInsId;
    taskId.value = route.query?.taskId;

    processVariables();
    getFlowRecordList();
});
</script>