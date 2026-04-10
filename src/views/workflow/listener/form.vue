<template>
    <el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible"
        :close-on-click-modal="false" draggable>
        <el-form ref="dataFormRef" :model="form" :rules="dataRules" formDialogRef label-width="120px"
            v-loading="loading">
            <el-form-item :label="$t('listener.name')" prop="name">
                <el-input :placeholder="$t('listener.inputNameTip')" v-model="form.name" />
            </el-form-item>

            <el-form-item :label="$t('listener.type')" prop="type">
                <el-select v-model="form.type" :placeholder="$t('listener.inputTypeTip')" style="width: 100%">
                    <el-option v-for="(item, index) in tempListenerType" :key="index" :label="item.label"
                        :value="item.value"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item :label="$t('listener.eventType')" prop="eventType">
                <el-select v-model="form.eventType" :placeholder="$t('listener.inputEventTypeTip')" style="width: 100%">
                    <el-option v-for="(item, index) in currentEventTypeOptions" :key="index" :label="item.label"
                        :value="item.value"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item :label="$t('listener.valueType')" prop="valueType">
                <el-select v-model="form.valueType" :placeholder="$t('listener.inputValueTypeTip')" style="width: 100%">
                    <el-option v-for="(item, index) in tempValueType" :key="index" :label="item.label"
                        :value="item.value"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item :label="$t('listener.value')" prop="value">
                <el-input :placeholder="$t('listener.inputValueTip')" v-model="form.value" />
            </el-form-item>

            <el-form-item :label="$t('listener.remark')" prop="remark">
                <el-input :placeholder="$t('listener.inputRemarkTip')" type="textarea" show-word-limit maxlength="500"
                    :autosize="{ minRows: 2, maxRows: 4 }" v-model="form.remark" />
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">{{ $t('common.cancelButtonText') }}</el-button>
                <el-button type="primary" @click="onSubmit" :disabled="loading">{{ $t('common.confirmButtonText')
                }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts" name="listenerDialog">
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj, validateExist } from '/@/api/workflow/listener';
import { useI18n } from 'vue-i18n';
import { useDict } from '/@/hooks/dict';

// 使用国际化插件
const { t } = useI18n();

// 定义字典
const dictData = useDict('listener_type', 'listener_value_type', 'listener_event_task_type', 'listener_event_exec_type');
const { listener_type, listener_value_type, listener_event_task_type, listener_event_exec_type } = dictData;

// 使用字典数据
const tempListenerType = computed(() => listener_type.value || []);
const tempValueType = computed(() => listener_value_type.value || []);
const tempEventTaskType = computed(() => listener_event_task_type.value || []);
const tempEventExecType = computed(() => listener_event_exec_type.value || []);

const emit = defineEmits(['refresh']);

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);

// 提交表单数据
const form = reactive({
    id: '',
    name: '',
    type: '',
    eventType: '',
    valueType: '',
    value: '',
    remark: '',
});

// 计算当前事件类型选项
const currentEventTypeOptions = computed(() => {
    if (form.type === '1') {
        return tempEventTaskType.value;
    } else if (form.type === '2') {
        return tempEventExecType.value;
    }
    return [];
});

// 监听 type 变化，清空 eventType
watch(() => form.type, (newType, oldType) => {
    if (newType !== oldType) {
        form.eventType = '';
    }
});

// 定义校验规则
const dataRules = ref({
    name: [{ required: true, message: '监听器名称不能为空', trigger: 'blur' }],
    type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
    eventType: [{ required: true, message: '事件类型不能为空', trigger: 'change' }],
    valueType: [{ required: true, message: '值类型不能为空', trigger: 'change' }],
    value: [{ required: true, message: '值不能为空', trigger: 'blur' }],
});

// 打开弹窗
const openDialog = (id: string) => {
    visible.value = true;
    form.id = '';

    // 重置表单数据
    nextTick(() => {
        dataFormRef.value?.resetFields();
    });

    // 获取listener信息
    if (id) {
        form.id = id;
        getListenerData(id);
    } else {
        // 新增时清空所有字段
        form.name = '';
        form.type = '';
        form.eventType = '';
        form.valueType = '';
        form.value = '';
        form.remark = '';
    }
};

// 提交
const onSubmit = async () => {
    const valid = await dataFormRef.value.validate().catch(() => { });
    if (!valid) return false;

    try {
        loading.value = true;
        form.id ? await putObj(form) : await addObj(form);
        useMessage().success(form.id ? t('common.editSuccessText') : t('common.addSuccessText'));
        visible.value = false;
        emit('refresh');
    } catch (err: any) {
        useMessage().error(err.msg);
    } finally {
        loading.value = false;
    }
};

// 初始化表单数据
const getListenerData = (id: string) => {
    loading.value = true;
    getObj({ id: id })
        .then((res: any) => {
            const data = res.data[0];
            
            // 等待字典数据加载完成
            const waitForDictData = () => {
                return new Promise<void>((resolve) => {
                    const checkDict = () => {
                        const hasTypeDict = tempListenerType.value.length > 0;
                        const hasValueTypeDict = tempValueType.value.length > 0;
                        const hasEventTypeDict = (tempEventTaskType.value.length > 0 || tempEventExecType.value.length > 0);
                        
                        if (hasTypeDict && hasValueTypeDict && hasEventTypeDict) {
                            resolve();
                        } else {
                            // 如果字典数据还没加载完成，等待一段时间后重试
                            setTimeout(checkDict, 100);
                        }
                    };
                    checkDict();
                });
            };
            
            waitForDictData().then(() => {
                // 先设置 type，确保计算属性能正确更新
                form.type = data.type;
                // 使用 nextTick 确保计算属性更新后再设置 eventType
                nextTick(() => {
                    form.eventType = data.eventType;
                    form.name = data.name;
                    form.valueType = data.valueType;
                    form.value = data.value;
                    form.remark = data.remark;
                });
            });
        })
        .finally(() => {
            loading.value = false;
        });
};

// 暴露变量
defineExpose({
    openDialog,
});
</script>
