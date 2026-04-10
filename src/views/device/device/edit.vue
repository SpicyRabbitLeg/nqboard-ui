<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-row :gutter="24" class="card-container">
                <el-col :span="2"></el-col>
                <el-col :span="20">
                    <el-steps :active="active" finish-status="success">
                        <el-step :title="$t('device.deviceConfig')" />
                        <el-step :title="$t('device.driverConfig')" />
                        <el-step :title="$t('device.pointConfig')" />
                    </el-steps>
                </el-col>
            </el-row>

            <el-divider />

            <!-- 设备基础信息表单 -->
            <el-form v-if="active === 0" ref="dataFormRef" :model="form" :rules="dataRules" label-width="120px"
                v-loading="loading">
                <el-row>
                    <el-col>
                        <el-form-item :label="$t('device.name')" prop="name">
                            <el-input v-model="form.name" disabled :placeholder="$t('device.inputNameTip')" />
                        </el-form-item>
                        <el-form-item :label="$t('product.name')" prop="productId">
                            <el-select v-model="form.productId" disabled
                                :placeholder="$t('product.inputCategoryIdTip')">
                                <el-option v-for="(item, index) in productList" :key="index" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="$t('device.location')" prop="location">
                            <el-input v-model="form.location" :placeholder="$t('device.inputLocationTip')" />
                        </el-form-item>
                        <el-form-item :label="$t('device.status')" prop="status">
                            <el-select v-model="form.status" @change="handleStatusChange"
                                :placeholder="$t('device.selectStatusTip')">
                                <el-option v-for="(item, index) in device_status_temp" :key="index" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="$t('device.remark')" prop="remark">
                            <el-input v-model="form.remark" type="textarea" :placeholder="$t('device.inputRemarkTip')"
                                :autosize="{ minRows: 2, maxRows: 4 }" />
                        </el-form-item>

                        <el-form-item v-show="protocol.protocol !== 'RTSP' && protocol.protocol !== 'MQTT'"
                            :label="$t('device.cron')" prop="cron">
                            <el-select v-model="form.cron" :placeholder="$t('device.inputCornTip')">
                                <el-option v-for="(item, index) in cron" :key="index" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <component :is="driverComponent" v-if="driverComponent" :product-id="form.productId" :device-id="form.id"
                ref="formDialogRef" :driverValue="form.driverValue" v-model:active="active">
                <template #button>
                    <div style="text-align: center; margin-top: 10px;">
                        <div v-if="active === 3">
                            <el-button @click="router.back()">{{ $t('device.down') }}</el-button>
                        </div>

                        <div v-else>
                            <el-button v-show="active !== 0" @click="active--">{{ $t('device.pre') }}</el-button>
                            <el-button v-show="active === 2" @click="formDialogRef?.editPoint()">{{ $t('device.edit')
                            }}</el-button>

                            <el-button v-show="active === 0" @click="next">{{ $t('device.next') }}</el-button>
                            <el-button v-show="active !== 0" @click="formDialogRef?.next(active)">{{ $t('device.next')
                            }}</el-button>
                        </div>
                    </div>
                </template>
            </component>
        </div>
    </div>
</template>

<script setup lang="ts" name="deviceEdit">
import { useDict } from '/@/hooks/dict';
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { getObj, putObj, delObjVideo } from '/@/api/device/device';
import { fetchList } from '/@/api/device/product';
import { ref, reactive, onMounted, computed, defineAsyncComponent, watch } from 'vue';

// 路由
const route = useRoute();
const router = useRouter();

// 国际化
const { t } = useI18n();

// 字典
const { device_status, cron } = useDict('device_status', 'cron');
const device_status_temp = ref(JSON.parse(JSON.stringify(device_status.value)));
device_status_temp.value.splice(3, 2);

// 变量定义
const dataFormRef = ref();
const active = ref(0);
const loading = ref(false);
const productList = ref<{ label: string; value: string; protocol: string }[]>([]);
const formDialogRef = ref();
const protocol = ref<any>({});

// 表单数据
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
    driverValue: ''
});

// 校验规则
const dataRules = ref({
    name: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
    productId: [{ required: true, message: '产品id不能为空', trigger: 'blur' }],
    location: [{ required: true, message: '地理位置不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '设备状态不能为空', trigger: 'blur' }],
});

const driverMap = {
    MODBUS_TCP: defineAsyncComponent(() => import('./driver/modbustcp.vue')),
    MQTT: defineAsyncComponent(() => import('./driver/mqtt.vue')),
    OPC_UA: defineAsyncComponent(() => import('./driver/opcUa.vue')),
    RTSP: defineAsyncComponent(() => import('./driver/rtsp.vue')),
};

// 动态计算当前要渲染的驱动组件
const driverComponent = computed(() => {
    const p = protocol.value?.protocol;
    return p ? driverMap[p as keyof typeof driverMap] : null;
});

/**
 * 状态切换事件（核心：RTSP关闭时调用远程接口）
 */
const handleStatusChange = async (newVal: string) => {
    if (protocol.value?.protocol !== 'RTSP') {
        return;
    }

    if (newVal === '0' || newVal === '2') {
        try {
            loading.value = true;
            await delObjVideo([form.id]);
            useMessage().success('RTSP设备已成功关闭');
        } catch (err: any) {
            useMessage().error(err.msg || 'RTSP设备关闭失败');
            return;
        } finally {
            loading.value = false;
        }
    }
};

/**
 * 下一步
 */
const next = async () => {
    if (active.value < 3) active.value++;

    const valid = await dataFormRef.value?.validate().catch(() => false);
    if (!valid) return;

    try {
        loading.value = true;
        await putObj(form);
        useMessage().success(t('common.editSuccessText'));
    } catch (err: any) {
        useMessage().error(err.msg);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    try {
        // 获取设备详情
        const res = await getObj({ id: route.query?.id });
        Object.assign(form, res.data[0]);

        // 获取产品列表
        const resp = await fetchList({ size: 9999 });
        productList.value = resp.data!.records.map((item: any) => ({
            label: item.name,
            value: item.id,
            protocol: item.protocol,
        }));

        // 匹配协议
        protocol.value = productList.value.find(item => item.value === form.productId) || {};

        // MQTT/RTSP 默认 cron
        if (['MQTT', 'RTSP'].includes(protocol.value.protocol)) {
            form.cron = '0 0/1 * * * ?';
        }
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
});
</script>