<template>
    <div>
        <el-table :data="elementPropertyList" size="small" max-height="240" border fit>
            <el-table-column label="序号" width="50px" type="index" />
            <el-table-column label="属性名" prop="name" width="95px" show-overflow-tooltip />
            <el-table-column label="属性值" prop="value" width="95px" show-overflow-tooltip />
            <el-table-column label="操作">
                <template #default="scope">
                    <el-button size="small" type="primary"
                        @click="openAttributesForm(scope, scope.$index)">编辑</el-button>
                    <el-divider direction="vertical" />
                    <el-button size="small" type="danger" @click="removeAttributes(scope, scope.$index)">移除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="element-drawer__button">
            <el-button size="small" type="primary" @click="openAttributesForm(null, -1)"><el-icon
                    class="el-icon--right">
                    <Plus />
                </el-icon>添加属性</el-button>
        </div>


        <!-- 添加字段 -->
        <el-dialog title="字段配置" v-model="propertyFormModelVisible" :close-on-click-modal="false" draggable>
            <el-form :model="propertyForm" label-width="80px" ref="attributeFormRef" @submit.native.prevent>
                <el-form-item label="属性名：" prop="name" :rules="{ required: true, trigger: ['blur', 'change'] }">
                    <el-input v-model="propertyForm.name" clearable />
                </el-form-item>
                <el-form-item label="属性值：" prop="value" :rules="{ required: true, trigger: ['blur', 'change'] }">
                    <el-input v-model="propertyForm.value" clearable />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button size="small" @click="propertyFormModelVisible = false">取 消</el-button>
                <el-button size="small" type="primary" @click="saveAttribute">确 定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="PropertiesPanel">
import { StrUtil } from '/@/utils/StrUtil.js';
import { useMessage, useMessageBox } from '/@/hooks/message';
// 引入 modeler 相关信息
import { useModelerStore } from '/@/stores/modeler';
import { updateElementExtensions } from "../common/bpmnUtils.js";

// 定义props
const props = defineProps({
    id: {
        type: String,
        required: true
    }
});

// 引入 modeler 相关信息
const modelerStore = useModelerStore();


const elementPropertyList = ref([]) as any;
const otherExtensionList = ref([]) as any;
const propertyFormModelVisible = ref(false);
const editingPropertyIndex = ref(-1);
const attributeFormRef = ref();
const propertyForm = ref({
    name: '',
    value: ''
});

const bpmnElement = ref() as any;
const bpmnElementPropertyList = ref([]) as any;

// 保存属性
const saveAttribute = () => {
    attributeFormRef.value.validate((valid: boolean) => {
        if (valid) {
            const { name, value } = propertyForm.value;
            const moddle = modelerStore.modeler?.get('moddle');

            try {
                // 直接尝试创建对象，如果类型未注册会抛出异常
                const newPropertyObject = moddle.create('flowable:Property', { name, value });

                // 合并现有属性和新属性
                const allProperties = [...bpmnElementPropertyList.value, newPropertyObject];
                const propertiesObject = moddle.create('flowable:Properties', {
                    values: allProperties
                });

                // 更新元素扩展属性
                updateElementExtensions(moddle, modelerStore.modeler.get('modeling'), bpmnElement.value,
                    [...otherExtensionList.value, propertiesObject]);

                // 关闭弹窗
                propertyFormModelVisible.value = false;

                // 清空表单
                propertyForm.value = { name: '', value: '' };

                // 使用 nextTick 确保 DOM 更新后再刷新列表
                nextTick(() => {
                    resetAttributesList();
                    useMessage().success('属性保存成功');
                });

            } catch (error: any) {
                useMessage().error('属性保存失败：' + error.message);
            }
        }
    })
};


const removeAttributes = (scope: any, index: any) => {
    elementPropertyList.value.splice(index, 1);
    bpmnElementPropertyList.value.splice(index, 1);

    const moddle = modelerStore.modeler?.get('moddle');

    // 只有当还有属性时才创建 flowable:Properties 对象
    let extensionsList = [...otherExtensionList.value];
    if (bpmnElementPropertyList.value.length > 0) {
        const propertiesObject = moddle.create(`flowable:Properties`, {
            values: bpmnElementPropertyList.value
        });
        extensionsList.push(propertiesObject);
    }

    // 更新元素扩展属性
    updateElementExtensions(moddle, modelerStore.modeler.get('modeling'), bpmnElement.value, extensionsList);
    resetAttributesList();
}


// 重置属性列表
const resetAttributesList = () => {
    bpmnElement.value = modelerStore.element;
    otherExtensionList.value = [];

    const allExtensions = bpmnElement.value.businessObject?.extensionElements?.values ?? [];
    const properties = allExtensions.filter((ex: any) => {
        if (ex.$type !== "flowable:Properties") {
            otherExtensionList.value.push(ex);
        }
        return ex.$type === "flowable:Properties";
    });

    bpmnElementPropertyList.value = properties.reduce(
        (pre: any, cur: any) => pre.concat(cur.values),
        []
    );

    elementPropertyList.value = JSON.parse(
        JSON.stringify(bpmnElementPropertyList.value ?? [])
    );
}

// 打开属性配置弹窗
const openAttributesForm = (attr: any, index: any) => {
    editingPropertyIndex.value = index;
    propertyForm.value = index === -1 ? {} : JSON.parse(JSON.stringify(attr.row));
    propertyFormModelVisible.value = true;
}

// ====== 监听 id 变化 ======
watch(
    () => props.id,
    (val) => {
        if (StrUtil.isNotBlank(val)) {
            resetAttributesList();
        }
    },
    { immediate: true }
);
</script>