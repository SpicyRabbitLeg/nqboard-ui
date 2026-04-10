<template>
    <el-dialog :title="t('myProcess.createTask')" v-model="visible" :close-on-click-modal="false" draggable>
        <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
            <el-form-item :label="$t('myProcess.name')" prop="name">
                <el-input v-model="state.queryForm.name" :placeholder="$t('myProcess.inputNameTip')" clearable />
            </el-form-item>
            <el-form-item>
                <el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }}
                </el-button>
                <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
            </el-form-item>
        </el-form>

        <el-table :data="state.dataList" v-loading="state.loading" border :cell-style="tableStyle.cellStyle"
            :header-cell-style="tableStyle.headerCellStyle" @sort-change="sortChangeHandle">
            <el-table-column type="index" label="#" width="40" />
            <el-table-column prop="name" :label="t('myProcess.name')" show-overflow-tooltip />
            <el-table-column prop="version" :label="t('myProcess.version')" show-overflow-tooltip>
                <template #default="scope">
                    <el-tag size="small">v{{ scope.row.version }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="category" :label="t('myProcess.category')" show-overflow-tooltip />
            <el-table-column :label="t('common.action')" width="200">
                <template #default="scope">
                    <el-button icon="edit-pen" text type="primary" @click="handleStartProcess(scope.row)">{{
                        t('myProcess.createTask') }}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<script setup lang="ts" name="myProcessDialog">
import { useI18n } from 'vue-i18n';
import { BasicTableProps, useTable } from "/@/hooks/table";
import { fetchList } from '/@/api/workflow/definition';


// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);

// 定义变量内容
const visible = ref(false);
const queryRef = ref();

// 路由
const router = useRouter();

const state: BasicTableProps = reactive<BasicTableProps>({
    queryForm: {
        name: '',
        // 部署时间
        deployTime: ''
    },
    pageList: fetchList
});

//  table hook
const {
    getDataList,
    sortChangeHandle,
    tableStyle
} = useTable(state);

// 清空搜索条件
const resetQuery = () => {
    // 清空搜索条件
    queryRef.value?.resetFields();
    // 清空多选
    getDataList();
};

// 打开弹窗
const openDialog = (id: string) => {
    visible.value = true;

    // 重置表单数据
    nextTick(() => {
        resetQuery();
    });
};


// 发起流程申请
const handleStartProcess = (row: any) => {
    const params = {
        path: "/workflow/task/myProcess/send",
        query: {
            deployId: row.deploymentId,
            procDefId: row.id
        }
    }
    router.push(params);
}

// 暴露变量
defineExpose({
    openDialog,
});
</script>