<template>
    <div>
        <el-form :model="bpmnFormData" label-width="80px" :rules="rules" size="small">
            <el-form-item :label="bpmnFormData.$type === 'bpmn:Process' ? '流程标识' : '节点ID'" prop="id">
                <el-input v-model="bpmnFormData.id" @change="updateElementTask('id')" />
            </el-form-item>
            <el-form-item :label="bpmnFormData.$type === 'bpmn:Process' ? '流程名称' : '节点名称'" prop="name">
                <el-input v-model="bpmnFormData.name" @change="updateElementTask('name')" />
            </el-form-item>

            <!-- 流程的基础属性 -->
            <template v-if="bpmnFormData.$type === 'bpmn:Process'">
                <el-form-item label="流程分类" prop="processCategory">
                    <el-select v-model="bpmnFormData.processCategory" placeholder="请选择流程分类"
                        @change="updateElementTask('processCategory')">
                        <el-option v-for="(item, index) in flow_type" :key="index" :label="item.label"
                            :value="item.value"></el-option>
                    </el-select>
                </el-form-item>
            </template>
            <el-form-item v-if="bpmnFormData.$type === 'bpmn:SubProcess'" label="状态">
                <el-switch v-model="bpmnFormData.isExpanded" active-text="展开" inactive-text="折叠"
                    @change="updateElementTask('isExpanded')" />
            </el-form-item>
            <el-form-item label="节点描述">
                <el-input :rows="2" type="textarea" v-model="bpmnFormData.documentationValue"
                    @change="updateDocumentation" />
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts" name="CommonPanel">
import { StrUtil } from '/@/utils/StrUtil';
import { useDict } from '/@/hooks/dict';
// 引入 modeler 相关信息
import { useModelerStore } from '/@/stores/modeler';

// 获取设备状态字典
const { flow_type } = useDict('flow_type');


// 定义props
const props = defineProps({
    id: {
        type: String,
        required: true
    }
});

// 定义emit
const emit = defineEmits(['save']);

// 引入 modeler 相关信息
const modelerStore = useModelerStore();

// 定义变量
const bpmnFormData = ref({
    id: props.id,
    name: '',
    documentationValue: '',
    $type: '',
    processCategory: '',
    isExpanded: false
});

// 定义校验规则 
const rules = {
    id: [
        { required: true, message: '节点Id 不能为空', trigger: 'blur' }
    ],
    name: [
        { required: true, message: '节点名称不能为空', trigger: 'blur' }
    ]
};



// 重置任务表单
const resetTaskForm = () => {
    // 假设 modelerStore 已可用
    bpmnFormData.value = { ...modelerStore.element.businessObject }
    // 在 Vue 3 中，使用 ref 确保响应式
    bpmnFormData.value.documentationValue = modelerStore.element.businessObject.documentation?.[0]?.text || '';
}

// 更新任务属性
const updateElementTask = (key: any) => {
    const taskAttr = { [key as string]: (bpmnFormData.value as any)[key as string] ?? null }
    modelerStore.modeling.updateProperties(modelerStore.element, taskAttr)
}

// 更新流程图信息
const updateDocumentation = () => {
    // 确保 modelerStore 是 BPMN.js 的 Modeler 实例
    const modeler = modelerStore.modeler // 获取实际的 modeler 实例
    const moddle = modeler.get('moddle') // 通过 modeler 获取 moddle
    const modeling = modeler.get('modeling') // 通过 modeler 获取 modeling

    // 创建新的文档对象
    const documentation = moddle.create('bpmn:Documentation', {
        text: bpmnFormData.value.documentationValue
    })

    // 获取当前元素的扩展元素
    let extensionElements = modelerStore.element.businessObject.extensionElements

    if (!extensionElements) {
        // 如果没有扩展元素，创建一个新的
        extensionElements = moddle.create('bpmn:ExtensionElements', {
            values: []
        })
    }

    // 更新文档
    modeling.updateProperties(modelerStore.element, {
        documentation: [documentation],
        extensionElements: extensionElements
    })

    // 强制更新模型
    modelerStore.modeler.get('commandStack').execute('element.updateProperties', {
        element: modelerStore.element,
        properties: {
            documentation: [documentation]
        }
    })

    emit('save')
}

// 监听id变化
watch(
    () => props.id,
    (newVal) => {
        if (StrUtil.isNotBlank(newVal)) {
            resetTaskForm()
        }
    },
    { immediate: true }
);
</script>