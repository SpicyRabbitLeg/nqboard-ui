<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-row v-show="showSearch">
                <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
                    <el-form-item :label="$t('myProcess.name')" prop="name">
                        <el-input v-model="state.queryForm.name" :placeholder="$t('myProcess.inputNameTip')"
                            clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }}
                        </el-button>
                        <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
                    </el-form-item>
                </el-form>
            </el-row>

            <el-row>
                <div class="mb8" style="width: 100%">
                    <el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()"
                        v-auth="'device_iotCategory_add'">
                        {{ $t('common.addBtn') }}
                    </el-button>

                    <el-button plain :disabled="multiple" icon="Delete" type="primary" v-auth="'device_iotCategory_del'"
                        @click="handleDelete(selectObjs)">
                        {{ $t('common.delBtn') }}
                    </el-button>
                </div>
            </el-row>

            <el-table :data="state.dataList" v-loading="state.loading" border :cell-style="tableStyle.cellStyle"
                :header-cell-style="tableStyle.headerCellStyle" @selection-change="selectionChangHandle"
                @sort-change="sortChangeHandle">
                <el-table-column type="selection" width="40" align="center" />
                <el-table-column type="index" label="#" width="40" />
                <el-table-column prop="procDefName" :label="t('myProcess.name')" show-overflow-tooltip />
                <el-table-column prop="category" :label="t('myProcess.category')" show-overflow-tooltip />
                <el-table-column prop="procDefVersion" :label="t('myProcess.version')" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag size="small">v{{ scope.row.procDefVersion }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" :label="t('myProcess.createTime')" show-overflow-tooltip />

                <el-table-column prop="finishTime" :label="t('myProcess.status')" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag v-if="scope.row.finishTime == null" size="small">{{ t("myProcess.progress") }}</el-tag>
                        <el-tag type="success" v-if="scope.row.finishTime != null" size="small">{{
                            t("myProcess.compile")
                            }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="duration" :label="t('myProcess.consuming')" show-overflow-tooltip />
                <el-table-column prop="taskName" :label="t('myProcess.node')" show-overflow-tooltip />
                <el-table-column prop="assigneeName" :label="t('myProcess.assigneeName')" show-overflow-tooltip>
                    <template #default="scope">
                        <label v-if="scope.row.assigneeName">
                            {{ scope.row.assigneeName }}
                            <el-tag type="info" size="small">{{ scope.row.assigneeDeptName }}</el-tag>
                        </label>
                    </template>
                </el-table-column>
                <el-table-column :label="t('common.action')" width="200">
                    <template #default="scope">
                        <el-button text type="primary" @click="handleFlowRecord(scope.row)">{{
                            t('myProcess.detial') }}
                        </el-button>
                        <el-button v-if="scope.row.finishTime == null" text type="primary"
                            v-auth="'workflow_flowTask_stop'" @click="handleStop(scope.row.procInsId)">{{
                                t('myProcess.delBtn') }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle"
                v-bind="state.pagination" />
        </div>


        <!-- 编辑、新增  -->
        <FormDialog ref="formDialogRef" @refresh="getDataList(false)" />
    </div>
</template>
<script setup lang="ts" name="process">
import { useI18n } from 'vue-i18n';
import { useDict } from '/@/hooks/dict';
import { fetchList, delObjs, stopProcess } from '/@/api/workflow/task';
import { BasicTableProps, useTable } from "/@/hooks/table";
import { useMessage, useMessageBox } from "/@/hooks/message";


// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));


// 使用国际化插件
const { t } = useI18n();

// 路由
const router = useRouter();

// 定义变量内容
const formDialogRef = ref();
// 搜索变量
const queryRef = ref();
const showSearch = ref(true);
// 多选变量
const selectObjs = ref([]) as any;
const multiple = ref(true);

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
    currentChangeHandle,
    sizeChangeHandle,
    sortChangeHandle,
    downBlobFile,
    tableStyle
} = useTable(state);

// 清空搜索条件
const resetQuery = () => {
    // 清空搜索条件
    queryRef.value?.resetFields();
    // 清空多选
    selectObjs.value = [];
    getDataList();
};

// 多选事件
const selectionChangHandle = (objs: { procInsId: string }[]) => {
    selectObjs.value = objs.map(({ procInsId }) => procInsId);
    multiple.value = !objs.length;
};

// 取消申请
const handleStop = async (id: any) => {
    try {
        await useMessageBox().confirm(t('common.delConfirmText'));
    } catch {
        return;
    }

    try {
        const stopQuery = {
            instanceId: id
        }
        await stopProcess(stopQuery);
        getDataList();
        useMessage().success(t('common.delSuccessText'));
    } catch (err: any) {
        useMessage().error(err.msg);
    }
}

// 点击查看详情
const handleFlowRecord = async (row: any) => {
    const params = {
        path: "/workflow/task/myProcess/detail",
        query: {
            procInsId: row.procInsId,
            deployId: row.deployId,
            taskId: row.taskId
        }
    }
    router.push(params);
}

// 删除操作
const handleDelete = async (ids: string[]) => {
    try {
        await useMessageBox().confirm(t('common.delConfirmText'));
    } catch {
        return;
    }
    try {
        await delObjs(ids);
        getDataList();
        useMessage().success(t('common.delSuccessText'));
    } catch (err: any) {
        useMessage().error(err.msg);
    }
};
</script>