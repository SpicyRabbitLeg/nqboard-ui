<template>
    <div>
        <el-row shadow="hover" class="ml10">
            <el-form :model="state.queryForm" ref="queryRef" :inline="true" @keyup.enter="getDataList">
                <el-form-item :label="$t('sysrole.roleName')" prop="roleName">
                    <el-input :placeholder="$t('sysrole.inputRoleNameTip')" v-model="state.queryForm.roleName" />
                </el-form-item>
                <el-form-item>
                    <el-button icon="search" type="primary" @click="getDataList">
                        {{ $t('common.queryBtn') }}
                    </el-button>
                    <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="state.dataList" v-loading="state.loading" style="width: 100%"
                @selection-change="handleSelectionChange" border :cell-style="tableStyle.cellStyle"
                :header-cell-style="tableStyle.headerCellStyle">
                <el-table-column type="selection" :selectable="handleSelectable" width="50" align="center" />
                <el-table-column type="index" :label="$t('sysrole.index')" width="80" />
                <el-table-column prop="roleName" :label="$t('sysrole.roleName')"
                    show-overflow-tooltip></el-table-column>
                <el-table-column prop="roleCode" :label="$t('sysrole.roleCode')"
                    show-overflow-tooltip></el-table-column>
                <el-table-column prop="roleDesc" :label="$t('sysrole.roleDesc')"
                    show-overflow-tooltip></el-table-column>
                <el-table-column prop="createTime" :label="$t('sysrole.createTime')"
                    show-overflow-tooltip></el-table-column>
            </el-table>
            <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle"
                v-bind="state.pagination" />
        </el-row>
    </div>
</template>

<script setup lang="ts" name="Role">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { pageList, delObj } from '/@/api/admin/role';

const queryRef = ref();
// 多选rows
const selectObjs = ref([]) as any;

// Emits
const emit = defineEmits(['handleRoleSelect']);

const state: BasicTableProps = reactive<BasicTableProps>({
    queryForm: {
        roleName: '',
    },
    pageList: pageList,
    descs: ['create_time'],
});

//  table hook
const { getDataList, currentChangeHandle, sizeChangeHandle, downBlobFile, tableStyle } = useTable(state);



// 是否可以多选
const handleSelectable = (row: any) => {
    return row.roleId !== '1';
};

// 清空搜索条件
const resetQuery = () => {
    queryRef.value.resetFields();
    getDataList();
};

// 多选事件
const handleSelectionChange = (objs: { roleId: string }[]) => {
    selectObjs.value = objs.map(({ roleId }) => roleId);
    emit('handleRoleSelect', objs);
};
</script>