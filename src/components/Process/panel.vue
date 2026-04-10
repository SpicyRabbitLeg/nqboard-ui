<template>
    <el-collapse v-model="activeName">
        <!--   常规信息     -->
        <el-collapse-item name="common">
            <template #title><el-icon>
                    <InfoFilled />
                </el-icon> 常规信息</template>
            <CommonPanel :id="elementId" />
        </el-collapse-item>

        <!-- 任务信息 -->
        <el-collapse-item name="task" v-if="elementType.indexOf('Task') !== -1">
            <template #title><el-icon><HelpFilled /></el-icon> 任务信息</template>
            <TaskPanel :id="elementId" />
        </el-collapse-item>

        <!--   执行监听器     -->
        <el-collapse-item name="executionListener">
            <template #title><el-icon>
                    <Promotion />
                </el-icon> 执行监听器<el-badge :value="executionListenerCount" class="item" type="primary" /></template>
            <ExecutionListenerPanel :id="elementId" @getExecutionListenerCount="getExecutionListenerCount" />
        </el-collapse-item>

        <!-- 任务监听器 -->
        <el-collapse-item name="taskListener" v-if="elementType === 'UserTask'">
            <template #title><el-icon>
                    <Flag />
                </el-icon> 任务监听器<el-badge :value="taskListenerCount" class="item" type="primary" /></template>
            <TaskListenerPanel :id="elementId" @getTaskListenerCount="getTaskListenerCount" />
        </el-collapse-item>

        <!-- 条件流转 -->
        <el-collapse-item name="condition" v-if="conditionVisible">
            <template #title><el-icon>
                    <Share />
                </el-icon> 条件流转</template>
            <ConditionPanel :id="elementId" />
        </el-collapse-item>

        <!-- 扩展属性 -->
        <el-collapse-item name="properties">
            <template #title><el-icon>
                    <CirclePlusFilled />
                </el-icon> 扩展属性</template>
            <PropertiesPanel :id="elementId" />
        </el-collapse-item>
    </el-collapse>
</template>
<script setup lang="ts" name="Designer">
// 引入 modeler 相关信息
import { useModelerStore } from '/@/stores/modeler';

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 引入常规信息面板组件
const CommonPanel = defineAsyncComponent(() => import('./panel/commonPanel.vue'));
const ExecutionListenerPanel = defineAsyncComponent(() => import('./panel/executionListenerPanel.vue'));
const TaskListenerPanel = defineAsyncComponent(() => import('./panel/taskListenerPanel.vue'));
const ConditionPanel = defineAsyncComponent(() => import('./panel/conditionPanel.vue'));
const PropertiesPanel = defineAsyncComponent(() => import('./panel/propertiesPanel.vue'));
const TaskPanel = defineAsyncComponent(() => import('./panel/taskPanel.vue'));


// 变量
const activeName = ref('common');
const elementId = ref(''); // 初始化为空，避免子组件在 modelerStore.element 未就绪时访问
const executionListenerCount = ref(0);
const taskListenerCount = ref(0);
const elementType = ref("");
const conditionVisible = ref(false); // 流转条件设置
const formVisible = ref(false); // 表单配置

// 传值监听
watch(elementId, () => {
    activeName.value = "common";
})

// 初始化流程设计器
const initModels = () => {
    getActiveElement()
}

// 注册节点事件
const getActiveElement = () => {
    // 初始第一个选中元素 bpmn:Process
    initFormOnChanged(null)
    modelerStore.modeler.on("import.done", (e: any) => {
        initFormOnChanged(null)
    })
    // 监听选择事件，修改当前激活的元素以及表单
    modelerStore.modeler.on("selection.changed", ({ newSelection }: { newSelection: any[] }) => {
        initFormOnChanged(newSelection[0] || null)
    })
    modelerStore.modeler.on("element.changed", ({ element }: { element: any }) => {
        // 保证 修改 "默认流转路径" 类似需要修改多个元素的事件发生的时候，更新表单的元素与原选中元素不一致。
        if (element && element.id === elementId.value) {
            initFormOnChanged(element)
        }
    })
}

// 初始化数据
const initFormOnChanged = (element: any) => {
    let activatedElement = element;
    if (!activatedElement) {
        activatedElement =
            modelerStore.elRegistry.getAll().find((el: any) => el.type === "bpmn:Process") ??
            modelerStore.elRegistry.getAll().find((el: any) => el.type === "bpmn:Collaboration")
    }
    if (!activatedElement) return
    // 防止 Vue 对 BPMN 元素做代理导致只读属性（如 labels）读取异常
    modelerStore.element = markRaw(activatedElement)
    elementId.value = activatedElement.id
    elementType.value = activatedElement.type.split(":")[1] || ""
    conditionVisible.value = !!(
        elementType.value === "SequenceFlow" &&
        activatedElement.source &&
        activatedElement.source.type.indexOf("StartEvent") === -1
    )
    formVisible.value = elementType.value === "UserTask" || elementType.value === "StartEvent"
}

// 获取执行监听器数量
const getExecutionListenerCount = (count: number) => {
    executionListenerCount.value = count;
}

// 获取任务监听器数量
const getTaskListenerCount = (count: number) => {
    taskListenerCount.value = count;
}

// 初始化模型
onMounted(() => {
    initModels()
})
</script>