<template>
    <div>
        <el-row :gutter="20">
            <el-col :span="6" :xs="24">
                <el-scrollbar>
                    <el-input v-model="deptName" placeholder="请输入部门名称" clearable size="small" prefix-icon="Search"
                        style="margin-bottom: 20px" />

                    <el-tree :data="deptOptions" :props="defaultProps" :expand-on-click-node="false"
                        :filter-node-method="filterNode" ref="tree" node-key="id" default-expand-all highlight-current
                        @node-click="handleNodeClick" />
                </el-scrollbar>
            </el-col>

            <el-col :span="18" :xs="24">
                <el-row>
                    <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
                        <el-form-item :label="$t('sysuser.username')" prop="username">
                            <el-input v-model="state.queryForm.username" :placeholder="$t('sysuser.inputUsernameTip')"
                                clearable />
                        </el-form-item>
                        <el-form-item :label="$t('sysuser.phone')" prop="phone">
                            <el-input v-model="state.queryForm.phone" :placeholder="$t('sysuser.inputPhoneTip')"
                                clearable />
                        </el-form-item>
                        <el-form-item>
                            <el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn')
                                }}</el-button>
                            <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
                        </el-form-item>
                    </el-form>

                    <el-table ref="tableRef" v-loading="state.loading" :data="state.dataList" border
                        :cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle"
                        @selection-change="handleSelectionChange">
                        <el-table-column type="selection" width="40" />
                        <el-table-column :label="$t('sysuser.index')" type="index" width="60" fixed="left" />
                        <el-table-column :label="$t('sysuser.username')" prop="username" fixed="left"
                            show-overflow-tooltip></el-table-column>
                        <el-table-column :label="$t('sysuser.name')" prop="name"
                            show-overflow-tooltip></el-table-column>
                        <el-table-column :label="$t('sysuser.phone')" prop="phone"
                            show-overflow-tooltip></el-table-column>
                        <el-table-column :label="$t('sysuser.post')" show-overflow-tooltip>
                            <template #default="scope">
                                <el-tag v-for="(item, index) in scope.row.postList" :key="index">{{ item.postName
                                }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('sysuser.role')" show-overflow-tooltip>
                            <template #default="scope">
                                <el-tag v-for="(item, index) in scope.row.roleList" :key="index">{{ item.roleName
                                }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('sysuser.lockFlag')" show-overflow-tooltip>
                            <template #default="scope">
                                <el-switch v-model="scope.row.lockFlag" active-value="0" inactive-value="9"></el-switch>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('sysuser.createTime')" prop="createTime" show-overflow-tooltip
                            width="180"></el-table-column>
                    </el-table>
                </el-row>
                <pagination v-bind="state.pagination" @current-change="currentChangeHandle"
                    @size-change="sizeChangeHandle">
                </pagination>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts" name="User">
import { StrUtil } from '/@/utils/StrUtil.js';
import { deptTree } from '/@/api/admin/dept';
import { pageList } from '/@/api/admin/user';
import { BasicTableProps, useTable } from '/@/hooks/table';

// Props
const props = defineProps({
    // 回显数据传值
    selectValues: {
        default: null,
        required: false
    },
    // 表格类型
    checkType: {
        type: String,
        default: 'multiple',
        required: true
    }
});

// Emits
const emit = defineEmits(['handleUserSelect']);

// 部门名称
const deptName = ref('');
const deptOptions = ref();
const defaultProps = ref({
    children: "children",
    label: "name"
});
const queryRef = ref();

// 定义表格查询、后台调用的API
const state: BasicTableProps = reactive<BasicTableProps>({
    queryForm: {
        deptId: '',
        username: '',
        phone: '',
    },
    pageList: pageList,
});

const { getDataList, currentChangeHandle, sizeChangeHandle, downBlobFile, tableStyle } = useTable(state);

// 查询部门下拉树结构
const getDeptTree = () => {
    deptTree().then(response => {
        deptOptions.value = response.data;
    });
}


// 筛选节点
const filterNode = (value: string, data: any) => {
    if (!value) return true;
    return data.label.indexOf(value) !== -1;
};


// 节点单击事件
const handleNodeClick = (data: any) => {
    state.queryForm.deptId = data.id;
    handleQuery();
}

const resetQuery = () => {
    queryRef.value?.resetFields();
    state.queryForm.deptId = '';
    getDataList();
}

// 搜索按钮操作
const handleQuery = () => {
    state.queryForm.curent = 1;
    getDataList();
}

// 获取表格引用
const tableRef = ref();

// 处理选择变化
const handleSelectionChange = (selection: any) => {
    if (props.checkType === 'single') {
        // 单选模式：如果选择了多个，只保留最后一个
        if (selection.length > 1) {
            const lastSelected = selection[selection.length - 1];
            // 清除所有选择
            tableRef.value?.clearSelection();
            // 只选择最后一个
            nextTick(() => {
                tableRef.value?.toggleRowSelection(lastSelected, true);
            });
            emit('handleUserSelect', [lastSelected]);
        } else {
            emit('handleUserSelect', selection);
        }
    } else {
        // 多选模式：正常处理
        emit('handleUserSelect', selection);
    }
}
// 监听
watch(() => props.selectValues, (newVal: any) => {
    if (StrUtil.isNotBlank(newVal)) {
       // TODO 处理回显数据
    }
}, { immediate: true })

// 获取用户、部门
onMounted(() => {
    getDeptTree();
});
</script>