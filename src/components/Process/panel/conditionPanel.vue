<template>
    <div>
        <el-form label-width="100px" size="small" @submit.prevent>
            <el-form-item>
                <template #label>
                    <span>
                        流转类型
                        <el-tooltip class="box-item" effect="dark" raw-content content="普通流转路径：流程执行过程中，一个元素被访问后，会沿着其所有出口顺序流继续执行。
                        <br />默认流转路径：只有当没有其他顺序流可以选择时，才会选择默认顺序流作为活动的出口顺序流。流程会忽略默认顺序流上的条件。
                        <br />条件流转路径：是计算其每个出口顺序流上的条件。当条件计算为true时，选择该出口顺序流。如果该方法选择了多条顺序流，则会生成多个执行，流程会以并行方式继续。"
                            placement="top">
                            <el-icon>
                                <QuestionFilled />
                            </el-icon>
                        </el-tooltip>
                    </span>
                </template>
                <el-select v-model="bpmnFormData.type" @change="updateFlowType">
                    <el-option label="普通流转路径" value="normal" />
                    <el-option label="默认流转路径" value="default" />
                    <el-option label="条件流转路径" value="condition" />
                </el-select>
            </el-form-item>
            <el-form-item label="条件格式" v-if="bpmnFormData.type === 'condition'" key="condition">
                <el-select v-model="bpmnFormData.conditionType">
                    <el-option label="表达式" value="expression" />
                    <el-option label="脚本" value="script" />
                </el-select>
            </el-form-item>
            <el-form-item label="表达式" v-if="bpmnFormData.conditionType && bpmnFormData.conditionType === 'expression'"
                key="express">
                <el-input v-model="bpmnFormData.body" clearable @change="updateFlowCondition" />
            </el-form-item>
            <template v-if="bpmnFormData.conditionType && bpmnFormData.conditionType === 'script'">
                <el-form-item label="脚本语言" key="language">
                    <el-input v-model="bpmnFormData.language" clearable @change="updateFlowCondition" />
                </el-form-item>
                <el-form-item label="脚本类型" key="scriptType">
                    <el-select v-model="bpmnFormData.scriptType">
                        <el-option label="内联脚本" value="inlineScript" />
                        <el-option label="外部脚本" value="externalScript" />
                    </el-select>
                </el-form-item>
                <el-form-item label="脚本" v-if="bpmnFormData.scriptType === 'inlineScript'" key="body">
                    <el-input v-model="bpmnFormData.body" type="textarea" clearable @change="updateFlowCondition" />
                </el-form-item>
                <el-form-item label="资源地址" v-if="bpmnFormData.scriptType === 'externalScript'" key="resource">
                    <el-input v-model="bpmnFormData.resource" clearable @change="updateFlowCondition" />
                </el-form-item>
            </template>
        </el-form>
    </div>
</template>
<script setup lang="ts" name="ConditionPanel">
import { StrUtil } from '/@/utils/StrUtil.js';

// 引入 modeler 相关信息
import { useModelerStore } from '/@/stores/modeler';


// 定义props
const props = defineProps({
    id: {
        type: String,
        required: true
    }
});

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 定义变量
const bpmnFormData = ref({}) as any;
const bpmnElementSource = ref({}) as any;
const bpmnElementSourceRef = ref({}) as any;

// 重置流转条件
const resetFlowCondition = () => {
    bpmnFormData.value = { body: null };
    bpmnElementSource.value = modelerStore.element.source;
    bpmnElementSourceRef.value = modelerStore.element.businessObject.sourceRef;
    if (bpmnElementSourceRef.value && bpmnElementSourceRef.value.default && bpmnElementSourceRef.value.default.id === modelerStore.element.id) {
        // 默认
        bpmnFormData.value.type = "default"
    } else if (!modelerStore.element.businessObject.conditionExpression) {
        // 普通
        bpmnFormData.value.type = "normal"
    } else {
        // 带条件
        const conditionExpression = modelerStore.element.businessObject.conditionExpression
        bpmnFormData.value = { ...conditionExpression, type: "condition" }
        // resource 可直接标识 是否是外部资源脚本
        if (bpmnFormData.value.resource) {
            bpmnFormData.value.conditionType = "script"
            bpmnFormData.value.scriptType = "externalScript"
            return
        }
        if (conditionExpression.language) {
            bpmnFormData.value.conditionType = "script"
            bpmnFormData.value.scriptType = "inlineScript"
            return
        }
        bpmnFormData.value.conditionType = "expression"
    };
}

// 更新流转类型
const updateFlowType = (flowType: any) => {
    // 正常条件类
    if (flowType === "condition") {
        const flowConditionRef = modelerStore.moddle.create("bpmn:FormalExpression")
        modelerStore.modeling.updateProperties(modelerStore.element, {
            conditionExpression: flowConditionRef
        })
        return
    }
    // 默认路径
    if (flowType === "default") {
        modelerStore.modeling.updateProperties(modelerStore.element, {
            conditionExpression: null
        })
        modelerStore.modeling.updateProperties(bpmnElementSource.value, {
            default: modelerStore.element
        })
        // 清空条件格式
        bpmnFormData.value.conditionType = null
        return
    }
    // 清空条件格式
    bpmnFormData.value.conditionType = null
    // 正常路径，如果来源节点的默认路径是当前连线时，清除父元素的默认路径配置
    if (bpmnElementSourceRef.value.default && bpmnElementSourceRef.value.default.id === modelerStore.element.id) {
        modelerStore.modeling.updateProperties(bpmnElementSource.value, {
            default: null
        })
    }
    modelerStore.modeling.updateProperties(modelerStore.element, {
        conditionExpression: null
    })
}

// 更新流转条件
const updateFlowCondition = () => {
    const { conditionType, scriptType, body, resource, language } = bpmnFormData.value
    let condition
    if (conditionType === "expression") {
        condition = modelerStore.moddle.create("bpmn:FormalExpression", { body })
    } else {
        if (scriptType === "inlineScript") {
            condition = modelerStore.moddle.create("bpmn:FormalExpression", { body, language })
            bpmnFormData.value.resource = ""
        } else {
            bpmnFormData.value.body = ""
            condition = modelerStore.moddle.create("bpmn:FormalExpression", { resource, language })
        }
    }
    modelerStore.modeling.updateProperties(modelerStore.element, { conditionExpression: condition })
}

// 监听id变化
watch(() => props.id, (newVal) => {
    if (StrUtil.isNotBlank(newVal)) {
        resetFlowCondition();
    }
}, { immediate: true });
</script>