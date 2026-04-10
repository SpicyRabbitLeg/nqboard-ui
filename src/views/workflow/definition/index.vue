<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-row v-show="showSearch">
                <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
                    <el-form-item :label="$t('definition.name')" prop="name">
                        <el-input v-model="state.queryForm.name" :placeholder="$t('definition.inputNameTip')"
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
                    <el-button icon="folder-add" type="primary" class="ml10" @click="handleLoadXml"
                        v-auth="'workflow_flowListener_add'">
                        {{ $t('common.addBtn') }}
                    </el-button>

                    <el-button plain :disabled="multiple" icon="Delete" type="primary"
                        v-auth="'workflow_flowListener_del'" @click="handleDelete(selectObjs)">
                        {{ $t('common.delBtn') }}
                    </el-button>
                </div>
            </el-row>

            <el-table :data="state.dataList" v-loading="state.loading" border :cell-style="tableStyle.cellStyle"
                :header-cell-style="tableStyle.headerCellStyle" @selection-change="selectionChangHandle"
                @sort-change="sortChangeHandle">
                <el-table-column type="selection" width="40" align="center" />
                <el-table-column type="index" label="#" width="40" />
                <el-table-column :label="t('definition.name')" show-overflow-tooltip>
                    <template #default="scope">
                        <el-button type="text" @click="handleReadImage(scope.row.deploymentId)">
                            <span>{{ scope.row.name }}</span>
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column prop="flowKey" :label="t('definition.flowKey')" show-overflow-tooltip />
                <el-table-column prop="version" :label="t('definition.version')" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag size="small">v{{ scope.row.version }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="category" :label="t('definition.category')" show-overflow-tooltip>
                    <template #default="scope">
                        {{ scope.row.category ? filterWord(scope.row.category, flow_type) : '' }}
                    </template>
                </el-table-column>
                <el-table-column prop="suspensionState" :label="t('definition.suspensionState')" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.suspensionState === 1">{{ t('definition.activate')
                            }}</el-tag>
                        <el-tag type="warning" v-if="scope.row.suspensionState === 2">{{ t('definition.hangUp')
                            }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="deploymentTime" :label="t('definition.deploymentTime')" show-overflow-tooltip />
                <el-table-column :label="t('common.action')" width="300">
                    <template #default="scope">
                        <el-button icon="EditPen" text type="primary" @click="handleLoadXml(scope.row)"
                            v-auth="'workflow_flowDefinition_edit'">{{
                                t('definition.edit') }}
                        </el-button>

                        <el-button icon="CircleClose" @click="handleUpdate(scope.row)" text type="primary"
                            v-auth="'workflow_flowDefinition_edit'" v-if="scope.row.suspensionState === 1">{{
                                t('definition.hangUp') }}
                        </el-button>

                        <el-button icon="CircleCheck" @click="handleUpdate(scope.row)" text type="primary"
                            v-auth="'workflow_flowDefinition_edit'" v-if="scope.row.suspensionState === 2">{{
                                t('definition.activate') }}
                        </el-button>

                        <el-button icon="delete" text type="primary" v-auth="'workflow_flowDefinition_edit'"
                            @click="handleDelete([scope.row.id])">{{ t('common.delBtn') }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle"
                v-bind="state.pagination" />
        </div>

        <!-- 流程图片展示 -->
        <el-dialog :title="readImage.title" v-model="readImage.open" :close-on-click-modal="false" width="1000px"
            draggable>
            <bpmn-viewer :flowData="flowData" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="definition">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { useDict } from '/@/hooks/dict';
import BpmnViewer from '/@/components/Process/viewer/index.vue';
import { fetchList, delObjs, updateObj, flowXmlAndNode } from '/@/api/workflow/definition';

// 获取设备状态字典
const { flow_type } = useDict('flow_type');

// 使用国际化插件
const { t } = useI18n();

// 搜索变量
const queryRef = ref();
const showSearch = ref(true);

// 多选变量
const selectObjs = ref([]) as any;
const multiple = ref(true);

// 路由
const router = useRouter();

// 读取图片
const readImage = ref({
    open: false,
    title: '流程图'
});

// 流程图数据
const flowData = ref({
    nodeData: [],
    xmlData: ''
});

const state: BasicTableProps = reactive<BasicTableProps>({
    queryForm: {
        name: ''
    },
    pageList: fetchList
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

// 修改流程状态（挂起、启动）
const handleUpdate = async (row: any) => {
    const obj = {
        name: row.name,
        deployId: row.deploymentId,
        state: row.suspensionState == '1' ? '2' : '1',
    };
    await updateObj(obj);
    useMessage().success(t('common.optSuccessText'));
    getDataList();
};

// 根据字典value获取label
const filterWord = (word: string, dict: any[]): string => {
    const result = dict.find((item: { value: string; }) => item.value == word);
    return result?.label || "";
};

// 读取流程图片
const handleReadImage = async (deploymentId: any) => {
    const res = await flowXmlAndNode({ deployId: deploymentId });
    readImage.value.open = true;
    flowData.value = res.data;
}

// 跳转model页面
const handleLoadXml = async (row: any) => {
    router.push({ path: '/workflow/definition/model', query: { deployId: row.deploymentId } })
}
</script>