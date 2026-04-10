<template>
    <!-- 驱动头连接配置 -->
    <el-form v-if="active == 1" ref="driverFormRef" :rules="driverRules" :model="driverForm" v-loading="loading"
        label-width="120px">
        <el-row>
            <el-col>
                <el-form-item :label="$t('device.ip')" prop="ip">
                    <el-input v-model="driverForm.ip" :placeholder="$t('device.inputIpTip')" />
                </el-form-item>

                <el-form-item :label="$t('device.port')" prop="port">
                    <el-input v-model="driverForm.port" :placeholder="$t('device.inputPortTip')" />
                </el-form-item>

                <el-form-item :label="$t('device.path')" prop="path">
                    <el-input v-model="driverForm.path" :placeholder="$t('device.inputPathTip')" />
                </el-form-item>
            </el-col>
        </el-row>
    </el-form>

    <!-- 端点配置 -->
    <el-form v-if="active == 2" ref="pointFormRef" :rules="pointRules" :model="pointForm" v-loading="loading">
        <el-row :gutter="24">
             <el-col :span="6">
                <el-form-item :label="$t('device.tag')" prop="tag">
                    <el-input v-model="pointForm.tag" :placeholder="$t('device.inputTagTip')" />
                </el-form-item>
            </el-col>

            <el-col :span="6">
                <el-form-item :label="$t('device.namespace')" prop="namespace">
                    <el-input v-model="pointForm.namespace" :placeholder="$t('device.inputNamespaceTip')" />
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
                    <p>{{ $t('device.identifier') }}：{{ item.identifier }}</p>
                    <p>{{ $t('device.tag') }}：{{ item.point?.pointInfo.tag }}</p>
                    <p>{{ $t('device.namespace') }}：{{ item.point?.pointInfo.namespace }}</p>
                </div>
            </el-card>
        </el-col>
    </el-row>
</template>
<script setup lang="ts" name="opcUa">
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { getObj, putObj } from '/@/api/device/device';
import { getModelByProduct } from '/@/api/device/model';
import { addOrPutObj } from '/@/api/device/point';
import pointIcon from '/@/assets/icons/point_icon.png';
// 使用国际化插件
const { t } = useI18n();

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

// driver表格
const driverForm = reactive({
    ip: '',
    port: '',
    path: ''
});

// point表格
const pointForm = reactive({
    tag: '',
    namespace: ''
});

// 定义校验规则
const driverRules = ref({
    ip: [{ required: true, message: '连接地址不能为空', trigger: 'blur' }],
    port: [{ required: true, message: '连接端口不能为空', trigger: 'blur' }]
});

// 定义校验规则
const pointRules = ref({
    tag: [{ required: true, message: '标签不能为空', trigger: 'blur' }],
    namespace: [{ required: true, message: '命名空间不能为空', trigger: 'blur' }]
});

// 点击下一步操作
const next = async () => {
    // 保存驱动信息
    if (props.active == 1) {
        const valid = await driverFormRef.value.validate().catch(() => { });
        if (!valid) return false;
        try {
            loading.value = true;
            const deviceFrom = {
                id: route.query.id,
                driverValue: JSON.stringify(driverForm)
            }
            await putObj(deviceFrom);
            useMessage().success(t('common.editSuccessText'));
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
        const savrFrom = {
            modelId: selectedIndex.value,
            deviceId: route.query.id,
            protocolValue: JSON.stringify(pointForm),
            id: selectedPointIndex.value
        }
        await addOrPutObj(savrFrom);
        useMessage().success(t('common.editSuccessText'));
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
        const { data } = await getModelByProduct(props.productId,props.deviceId);
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
        tag: '',
        namespace: ''
    });

    // 修改选择框中的值
    if (item.point) {
        Object.assign(pointForm, JSON.parse(item.point.protocolValue));
    }
}

// 回显数据
onMounted(() => {
    getObj({ id: route.query.id })
        .then((res: any) => {
            if (res.data[0].driverValue) {
                Object.assign(driverForm, JSON.parse(res.data[0].driverValue));
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