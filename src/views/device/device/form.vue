<template>
    <el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible"
        :close-on-click-modal="false" draggable>
        <el-form ref="dataFormRef" :model="form" :rules="dataRules" formDialogRef label-width="120px"
            v-loading="loading">
            <el-row>
                <el-col class="mb20">
                    <el-form-item :label="$t('device.name')" prop="name">
                        <el-input v-model="form.name" :placeholder="$t('device.inputNameTip')" />
                    </el-form-item>
                    <el-form-item :label="$t('product.name')" prop="productId">
                        <el-select v-model="form.productId" :placeholder="$t('product.inputCategoryIdTip')">
                            <el-option v-for="(item, index) in productList" :key="index" :label="item.label"
                                :value="item.value"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('device.location')" prop="location">
                        <el-input v-model="form.location" :placeholder="$t('device.inputLocationTip')" />
                    </el-form-item>
                    <el-form-item :label="$t('device.status')" prop="status">
                        <el-select v-model="form.status" :placeholder="$t('device.selectStatusTip')">
                            <el-option v-for="(item, index) in device_status_temp" :key="index" :label="item.label"
                                :value="item.value"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('device.remark')" prop="remark">
                        <el-input v-model="form.remark" type="textarea" :placeholder="$t('device.inputRemarkTip')"
                            :autosize="{ minRows: 2, maxRows: 4 }" />
                    </el-form-item>
                </el-col>
            </el-row>
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

<script setup lang="ts" name="deviceDialog">
import { useDict } from '/@/hooks/dict';
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj, validateExist } from '/@/api/device/device';
import { fetchList } from '/@/api/device/product';
import { useI18n } from 'vue-i18n';

// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);


// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);
const productList = ref([{ label: '', value: '' }]);

// 获取设备状态字典
const { device_status } = useDict('device_status');
const device_status_temp = ref(
    JSON.parse(JSON.stringify(device_status.value))
);
// 去除在线、离线状态
device_status_temp.value.splice(3, 2);


// 提交表单数据
const form = reactive({
    id: '',
    name: '',
    orderNum: 0,
    longitude: '',
    latitude: '',
    location: '',
    cron: '',
    remark: '',
    status: '0',
    productId: '',
    identifier: ''
});

/**
 * 校验设备名称唯一
 */
const checkIdentifierUnique = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback();
        return;
    }

    getObj({ name: form.name })
        .then((res: any) => {
            if (res.data && res.data.length >= 1) {
                callback(new Error('设备名称已存在，请输入其他值'));
            } else {
                callback();
            }
        })
        .catch(() => {
            callback(new Error('校验失败,请稍后重试'))
        })
}

// 定义校验规则
const dataRules = ref({
    name: [{ required: true, message: '设备不能为空', trigger: 'blur' }, { validator: checkIdentifierUnique, trigger: 'blur' }],
    productId: [{ required: true, message: '产品id不能为空', trigger: 'blur' }],
    location: [{ required: true, message: '地理位置不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '设备状态不能为空', trigger: 'blur' }],
});


// 打开弹窗
const openDialog = (id: string) => {
    visible.value = true;
    form.id = '';

    // 重置表单数据
    nextTick(() => {
        dataFormRef.value?.resetFields();
    });

    // 获取iotProduct信息
    if (id) {
        form.id = id;
        getIotDeviceData(id);
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

// 在页面加载前调用接口
onMounted(() => {
    const parars = {
        current: 1,
        size: 9999
    }

    // 获取产品下拉框
    fetchList(parars).then(resp => {
        productList.value = resp.data!.records.map((item: { name: string; id: string; }) => ({ label: item.name, value: item.id }));
    })
});

// 初始化表单数据
const getIotDeviceData = (id: string) => {
    // 获取数据
    loading.value = true;
    getObj({ id: id })
        .then((res: any) => {
            Object.assign(form, res.data[0]);
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