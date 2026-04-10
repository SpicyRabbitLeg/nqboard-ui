<template>
    <el-dialog v-model="visible" width="1400">
        <el-row v-show="showSearch">
            <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
                <el-form-item :label="$t('modelTemplate.name')" prop="name">
                    <el-input v-model="state.queryForm.name" :placeholder="$t('modelTemplate.inputNameTip')"
                        clearable />
                </el-form-item>
                <el-form-item>
                    <el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn')
                    }}</el-button>
                    <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
                </el-form-item>
            </el-form>
        </el-row>


        <el-table :data="state.dataList" v-loading="state.loading" :cell-style="tableStyle.cellStyle"
            :header-cell-style="tableStyle.headerCellStyle" @selection-change="selectionChangHandle"
            @sort-change="sortChangeHandle" border>
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column type="index" label="#" width="40" />
            <el-table-column prop="name" :label="$t('modelTemplate.name')" show-overflow-tooltip />
            <el-table-column prop="identifier" :label="$t('modelTemplate.identifier')" show-overflow-tooltip />
            <el-table-column prop="type" :label="$t('modelTemplate.type')" show-overflow-tooltip>
                <template #default="{ row }">
                    {{ filterWord(row.type, read_write_type) }}
                </template>
            </el-table-column>
            <el-table-column prop="dataType" :label="$t('modelTemplate.dataType')" show-overflow-tooltip>
                <template #default="{ row }">
                    <span>
                        {{ filterWord(row.dataType, data_type) }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="baseValue" :label="$t('modelTemplate.baseValue')" show-overflow-tooltip />
            <el-table-column prop="proportionalCoefficient" :label="$t('modelTemplate.proportionalCoefficient')"
                show-overflow-tooltip />
            <el-table-column prop="specs" :label="$t('modelTemplate.specs')" show-overflow-tooltip />
            <el-table-column prop="remark" :label="$t('modelTemplate.remark')" show-overflow-tooltip />
            <el-table-column prop="orderNum" :label="$t('modelTemplate.orderNum')" show-overflow-tooltip />
        </el-table>
        <!-- 分页列表 -->
        <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />


        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">{{ $t('common.cancelButtonText') }}</el-button>
                <el-button type="primary" @click="onSubmit" :disabled="loading">{{
                    $t('common.confirmButtonText') }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts" name="IotModelImportDialog">
import { useDict } from '/@/hooks/dict';
import { useI18n } from 'vue-i18n';
import { useMessage } from '/@/hooks/message';
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, delObjs } from '/@/api/device/modelTemplate';
import { importModelByTemplate } from '/@/api/device/model'


// 定义字典
const { data_type, read_write_type } = useDict('data_type', 'read_write_type');

const visible = ref(false);
const loading = ref(false);
// 搜索变量
const queryRef = ref();
const showSearch = ref(true);
// 多选变量
const selectObjs = ref([]) as any;
const multiple = ref(true);


// 使用国际化插件
const { t } = useI18n();
const emit = defineEmits(['refresh']);

// 产品id
const { productId } = defineProps({
    productId: {
        type: String,
        required: true
    }
});

// 打开弹窗
const openDialog = (id: string) => {
    visible.value = true;
};


const state: BasicTableProps = reactive<BasicTableProps>({
    queryForm: {},
    pageList: fetchList,
    ascs: ['order_num']
});
//  table hook
const { getDataList, currentChangeHandle, sizeChangeHandle, sortChangeHandle, downBlobFile, tableStyle } = useTable(state);
// 清空搜索条件
const resetQuery = () => {
    // 清空搜索条件
    queryRef.value?.resetFields();
    // 清空多选
    selectObjs.value = [];
    getDataList();
};

// 多选事件
const selectionChangHandle = (objs: { id: string }[]) => {
    selectObjs.value = objs.map(({ id }) => id);
    multiple.value = !objs.length;
};

// 根据字典value获取label
const filterWord = (word: string, dict: any[]): string => {
    const result = dict.find((item: { value: string; }) => item.value == word);
    return result?.label || "";
};


// 提交
const onSubmit = async () => {
    try {
        loading.value = true;

        const query = {
            templateIds: selectObjs.value,
            productId: productId
        }
        await importModelByTemplate(query);
        useMessage().success(t('model.importMessage'));
        visible.value = false;
        emit('refresh');
    } catch (err: any) {
        useMessage().error(err.msg);
    } finally {
        loading.value = false;
    }
}

// 暴露变量
defineExpose({
    openDialog,
});
</script>