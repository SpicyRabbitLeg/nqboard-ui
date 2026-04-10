<template>
    <div>
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
            label-width="68px">
            <el-form-item label="名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入表达式名称" clearable
                    @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>


        <el-table v-loading="loading" :data="expressionList" @current-change="handleSingleExpSelect">
            <el-table-column width="55" align="center">
                <template #default="scope">
                    <el-radio v-model="radioSelected" :label="scope.row.id">{{ '' }}</el-radio>
                </template>
            </el-table-column>
            <el-table-column label="名称" align="center" prop="name" />
            <el-table-column label="表达式内容" align="center" prop="expression" />
            <el-table-column label="表达式类型" align="center" prop="dataType">
                <template #default="scope">
                    {{ scope.row.dataType === 'fixed' ? '系统指定' : '动态选择' }}
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page-sizes="[5, 10]" layout="prev, pager, next"
            :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />
    </div>
</template>

<script setup lang="ts" name="Expression">
import { fetchList } from '/@/api/workflow/flwExpression';
import { StrUtil } from '/@/utils/StrUtil.js';
import { useMessage } from "/@/hooks/message";

// Props
const props = defineProps({
    // 回显数据传值
    selectValues: {
        type: [Number, String],
        default: null
    }
});

// Emits
const emit = defineEmits(['handleSingleExpSelect']);


// 变量
const queryParams = ref({
    curent: 1,
    size: 10,
    name: null,
    expression: null,
    status: null,
}) as any;
const showSearch = ref(true);
const loading = ref(false);
const expressionList = ref([]) as any;
const total = ref(0);
const radioSelected = ref(null);



// 搜索
const handleQuery = () => {
    queryParams.value.pageNum = 1;
    getList();
}

// 获取列表
const getList = () => {
    loading.value = true;
    fetchList(queryParams.value).then(({ data }) => {
        expressionList.value = data.records;
        total.value = data.total;
        loading.value = false;
    })
}

// 重置查询
const resetQuery = () => {
    queryParams.value = {};
    handleQuery();
}

// 选择后处理
const handleSingleExpSelect = (selection: any) => {
    if (selection) {
        radioSelected.value = selection.id
        emit('handleSingleExpSelect', selection);
    }
}

// 初始化查询
onMounted(() => {
    handleQuery();
});


// 监听
watch(() => props.selectValues, (newVal: any) => {
    if (StrUtil.isNotBlank(newVal)) {
        radioSelected.value = newVal
    }
}, { immediate: true })
</script>