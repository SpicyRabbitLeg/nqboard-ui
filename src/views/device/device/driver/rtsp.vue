<template>
    <!-- 驱动头连接配置 -->
    <el-form v-if="active == 1" ref="driverFormRef" :rules="driverRules" :model="driverForm" v-loading="loading"
        label-width="120px">
        <el-row>
            <el-col>
                <el-form-item :label="$t('device.serverUri')" prop="serverUri">
                    <el-input v-model="driverForm.serverUri" :placeholder="$t('device.inputServerUri2')" />
                </el-form-item>
                <el-form-item :label="$t('device.password')" prop="password">
                    <el-input v-model="driverForm.password" :placeholder="$t('device.inputPassword')" />
                </el-form-item>
                <el-form-item :label="$t('device.username')" prop="username">
                    <el-input v-model="driverForm.username" :placeholder="$t('device.inputUsername')" />
                </el-form-item>
            </el-col>
        </el-row>
    </el-form>

    <!-- 端点配置 -->
    <el-form v-if="active == 2" ref="pointFormRef" :rules="pointRules" :model="pointForm" v-loading="loading">
        <el-row :gutter="24">
            <el-col :span="6">
                <el-form-item :label="$t('device.source')" prop="source">
                    <el-input v-model="pointForm.source" :placeholder="$t('device.inputSourceTip')" />
                </el-form-item>
            </el-col>
        </el-row>
    </el-form>

    <slot name="button"></slot>

    <!-- 卡片列表 -->
    <el-row v-if="active == 2" :gutter="24" class="card-container">
        <el-col :span="6" class="card-item" v-for="item in pointList" :key="item.id">
            <el-card shadow="hover" @click="change(item.id, item)"
                :class="{ 'select-point': selectedIndex === item.id }">
                <div slot="header" class="card-header">
                    <el-avatar shape="square" :size="40" :src="pointIcon" />
                    <div class="card-name">
                        <span style="font-size:16px">{{ item.name }}</span>
                    </div>
                </div>
                <el-divider />
                <div>
                    <p>{{ $t('device.remark') }}：{{ item.remark }}</p>
                    <p>{{ $t('model.dataType') }}：{{ filterWord(item?.dataType, data_type) }}</p>
                    <p>{{ $t('device.source') }}：{{ item.source }}</p>
                </div>
            </el-card>
        </el-col>
    </el-row>
</template>
<script setup lang="ts" name="modebusTcp">
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { getObj, putObj, delObjVideo } from '/@/api/device/device';
import { getModelByProduct } from '/@/api/device/model';
import { addOrPutObj } from '/@/api/device/point';
import pointIcon from '/@/assets/icons/point_icon.png';
import { useDict } from '/@/hooks/dict';

// 使用国际化插件
const { t } = useI18n();

// 获取设备状态字典
const { data_type } = useDict('data_type');

// 定义 props 的接口
interface Props {
    active: number;
    driverValue: string;
    productId: string;
    deviceId: string;
}
const props = defineProps<Props>();
// 定义 emits
const emit = defineEmits<{ (event: 'update:active', value: number): void }>();


// 定义变量内容
const loading = ref(false);
const route = useRoute();
const driverFormRef = ref();
const pointFormRef = ref();
const selectedIndex = ref();
const selectedPointIndex = ref();
const pointList = ref([]) as any;

// 存储原始表单数据用于比较
const originalDriverForm = ref({
    serverUri: '',
    password: '',
    username: ''
});

const originalPointForm = ref({
    source: '',
    deviceId: route.query.id
});


// driver表格
const driverForm = reactive({
    serverUri: '',
    password: '',
    username: ''
});

// point表格
const pointForm = reactive({
    source: '',
    deviceId: route.query.id
});

// 定义校验规则
const driverRules = ref({
    serverUri: [{ required: true, message: '连接地址不能为空', trigger: 'blur' }]
});

// 定义校验规则
const pointRules = ref({
    source: [{ required: true, message: '资源不能为空', trigger: 'blur' }],
})

// 根据字典value获取label
const filterWord = (word: string, dict: any[]): string => {
    const result = dict.find((item: { value: string; }) => item.value == word);
    return result?.label || "";
};

// 检查驱动表单是否有修改
const isDriverFormChanged = (): boolean => {
    return driverForm.serverUri !== originalDriverForm.value.serverUri ||
           driverForm.password !== originalDriverForm.value.password ||
           driverForm.username !== originalDriverForm.value.username;
};

// 检查端点表单是否有修改
const isPointFormChanged = (): boolean => {
    return pointForm.source !== originalPointForm.value.source;
};

// 删除视频设备信息
const deleteVideoIfFormChanged = async () => {
    if (isDriverFormChanged() || isPointFormChanged()) {
        try {
            await delObjVideo([route.query.id]);
            console.log('视频设备信息已删除');
        } catch (err: any) {
            console.error('删除视频设备信息失败:', err);
            // 这里不抛出错误，因为主要操作是保存表单
        }
    }
};


// 点击下一步操作
const next = async () => {
    // 保存驱动信息
    if (props.active == 1) {
        const valid = await driverFormRef.value.validate().catch(() => { });
        if (!valid) return false;
        try {
            loading.value = true;
            
            // 如果表单有修改，先删除视频设备信息
            if (isDriverFormChanged()) {
                await deleteVideoIfFormChanged();
            }
            
            const deviceFrom = {
                id: route.query.id,
                driverValue: JSON.stringify(driverForm)
            }
            await putObj(deviceFrom);
            useMessage().success(t('common.editSuccessText'));
            
            // 更新原始表单数据
            originalDriverForm.value = { ...driverForm };
        } catch (err: any) {
            useMessage().error(err.msg);
        } finally {
            loading.value = false;
        }

        // 查询端点设备
        getModelList();
    }

    if (props.active < 3) {
        const newActive = props.active + 1;
        emit('update:active', newActive);
    }
}

/**
 * 修改端点信息
 */
const editPoint = async () => {
    const valid = await pointFormRef.value.validate().catch(() => { });
    if (!valid) return false;

    try {
        // 如果表单有修改，先删除视频设备信息
        if (isPointFormChanged()) {
            await deleteVideoIfFormChanged();
        }
        
        const savrFrom = {
            modelId: selectedIndex.value,
            deviceId: route.query.id,
            protocolValue: JSON.stringify(pointForm),
            id: selectedPointIndex.value
        }
        await addOrPutObj(savrFrom);
        useMessage().success(t('common.editSuccessText'));
        
        // 更新原始表单数据
        originalPointForm.value = { ...pointForm };
    } catch (err: any) {
        useMessage().error(err.msg);
    } finally {
        getModelList();
    }
}

/**
 * 查询当前设备的模型列表
 */
const getModelList = async () => {
    try {
        const { data } = await getModelByProduct(props.productId, props.deviceId);
        Object.assign(pointList.value, data);
    } catch (err: any) {
        useMessage().error(err.msg);
    }
}

/**
 * 修改点位数据
 */
const change = (index: any, item: any) => {
    selectedIndex.value = index;
    selectedPointIndex.value = item.point?.id;

    // 先把数据置空
    Object.assign(pointForm, {
        source: ''
    });

    // 修改选择框中的值
    if (item.point) {
        const pointData = JSON.parse(item.point.protocolValue);
        Object.assign(pointForm, pointData);
        // 更新原始端点表单数据
        originalPointForm.value = { ...pointForm, deviceId: route.query.id };
    } else {
        // 重置原始端点表单数据
        originalPointForm.value = { source: '', deviceId: route.query.id };
    }
}

// 回显数据
onMounted(() => {
    getObj({ id: route.query.id })
        .then((res: any) => {
            if (res.data[0].driverValue) {
                const driverData = JSON.parse(res.data[0].driverValue);
                Object.assign(driverForm, driverData);
                // 保存原始驱动表单数据
                originalDriverForm.value = { ...driverData };
            }
        });
});

// 暴露变量
defineExpose({
    next,
    editPoint
});
</script>

<style scoped>
.select-point {
    border: 2px solid gray;
}
</style>