<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-row v-show="showSearch">
                <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
                    <el-form-item :label="$t('device.name')" prop="name">
                        <el-input v-model="state.queryForm.name" :placeholder="$t('device.inputNameTip')" clearable />
                    </el-form-item>

                    <el-form-item :label="$t('device.status')" prop="status">
                        <el-select v-model="state.queryForm.status" :placeholder="$t('device.selectStatusTip')">
                            <el-option v-for="(item, index) in device_status" :key="index" :label="item.label"
                                :value="item.value"></el-option>
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-button v-loading.fullscreen.lock="state.loading" icon="Search" type="primary"
                            @click="getDataList">
                            {{ $t('common.queryBtn') }}
                        </el-button>
                        <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
                    </el-form-item>
                </el-form>
            </el-row>

            <el-row>
                <div class="mb8" style="width: 100%">
                    <el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()"
                        v-auth="'device_iotDevice_add'">
                        {{ $t('common.addBtn') }}
                    </el-button>
                    <el-button icon="folder-delete" type="danger" class="ml10" @click="handleDelete(selectObjs)"
                        v-auth="'device_iotDevice_del'">
                        {{ $t('common.delBtn') }}
                    </el-button>
                </div>
            </el-row>

            <!-- 卡片列表 -->
            <el-row :gutter="24" class="card-container">
                <el-col :span="6" class="card-item" v-for="(item, index) in state.dataList" :key="index">
                    <el-card shadow="hover">
                        <div slot="header">
                            <el-row :gutter="24">
                                <el-col :span="4">
                                    <el-avatar shape="square" :size="50"
                                        :src="item.product?.img.includes('http') ? item.product?.img : baseURL.replace(/^\/api/, '') + item.product?.img" />
                                </el-col>
                                <el-col :span="14">
                                    <span style="font-size: 22px;">{{ item.name }}</span>
                                </el-col>
                                <el-col :span="4">
                                    <span v-if="item.online" style="color: green;">在线</span>
                                    <span v-else>离线</span>
                                </el-col>
                                <el-col :span="2" v-if="deleteShow">
                                    <el-checkbox :model-value="selectObjs.includes(item.id)"
                                        @change="(checked: boolean) => toggleSelect(item.id, checked)" />
                                </el-col>
                            </el-row>
                        </div>

                        <div>
                            <p>{{ $t('product.name') }}：{{ item.product?.name }}</p>
                            <p>
                                {{ $t('device.status') }}：{{ filterWord(item.status, device_status) }}
                            </p>
                            <p>{{ $t('device.createTime') }}：{{ item.createTime }}</p>
                        </div>

                        <div class="card-footer">
                            <el-button type="primary" @click="toDeviceEdit(item.id)" text
                                style="flex: 1; text-align: center">{{ $t('device.edit') }}</el-button>
                            <el-button type="primary" @click="toSource(item.id)" text
                                style="flex: 1; text-align: center">{{ $t('device.deviceSource') }}</el-button>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle"
                v-bind="state.pagination" />
        </div>

        <!-- 编辑、新增  -->
        <FormDialog ref="formDialogRef" @refresh="getDataList(false)" />
    </div>
</template>

<script setup lang="ts" name="device">
import { BasicTableProps, useTable } from "/@/hooks/table";
import { fetchList, delObjs, putObj } from "/@/api/device/device";
import { useMessage, useMessageBox } from "/@/hooks/message";
import { useDict } from '/@/hooks/dict';
import { useI18n } from 'vue-i18n';
import '/@/theme/product.scss';

// 使用国际化插件
const { t } = useI18n();

// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));

// 定义查询字典
// 定义字典
const { device_status } = useDict('device_status');


// 定义变量内容
const route = useRoute();
const formDialogRef = ref();
// 搜索变量
const queryRef = ref();
const showSearch = ref(true);
// 多选变量
const selectObjs = ref([]) as any;
// 显示删除
const deleteShow = ref(false);

// 路由
const router = useRouter();

const state: BasicTableProps = reactive<BasicTableProps>({
    queryForm: {
        name: '',
        status: '',
        productId: route.query?.id
    },
    pagination: {
        size: 12,
        pageSizes: [12, 24, 36, 60],
    },
    pageList: fetchList
});

//  table hook
const {
    getDataList,
    currentChangeHandle,
    sizeChangeHandle,
    sortChangeHandle,
    downBlobFile,
    tableStyle
} = useTable(state);


// 清空搜索条件
const resetQuery = () => {
    // 清空搜索条件
    queryRef.value?.resetFields()
    // 清空多选
    selectObjs.value = []
    getDataList()
}

// 根据字典value获取label
const filterWord = (word: string, dict: any[]): string => {
    const result = dict.find((item: { value: string; }) => item.value == word);
    return result?.label || "";
};
// 删除操作
const handleDelete = async (ids: string[]) => {
    if (deleteShow.value) {
        try {
            deleteShow.value = false;
            selectObjs.value = [];
            if (!ids || ids.length === 0) {
                useMessage().warning(t('device.noSelection'));
                return;
            }
            await useMessageBox().confirm(t('device.deleteConfirm'));
        } catch {
            return;
        }

        try {
            await delObjs(ids);
            getDataList();
            useMessage().success(t('device.deleteSuccess'));
        } catch (err: any) {
            useMessage().error(err.msg);
        }
    } else {
        deleteShow.value = true;
    }
};

/**
 * 切换选中状态
 * 
 * @param id id
 * @param checked  checked
 */
const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
        if (!selectObjs.value.includes(id)) {
            selectObjs.value.push(id);
        }
    } else {
        selectObjs.value = selectObjs.value.filter((i: any) => i !== id);
    }
};


/**
 * 设备编辑页面
 * 
 * @param id 设备id
 */
const toDeviceEdit = async (id: string) => {
    router.push({
        path: '/device/device/edit',
        query: {
            id: id,
        },
    });
}

/**
 * 设备数据页面
 * 
 * @param id 设备id
 */
const toSource = async (id: string) => {
    router.push({
        path: '/device/device/source',
        query: {
            id: id,
        },
    });

}
</script>