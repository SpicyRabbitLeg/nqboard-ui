<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('listener.name')" prop="name">
						<el-input v-model="state.queryForm.name" :placeholder="$t('listener.inputNameTip')" clearable />
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
						v-auth="'workflow_flowListener_add'">
						{{ $t('common.addBtn') }}
					</el-button>

					<el-button plain :disabled="multiple" icon="Delete" type="primary"
						v-auth="'workflow_flowListener_del'" @click="handleDelete(selectObjs)">
						{{ $t('common.delBtn') }}
					</el-button>

					<right-toolbar v-model:showSearch="showSearch" :export="'workflow_flowListener_export'"
						@exportExcel="exportExcel" class="ml10 mr20" style="float: right"
						@queryTable="getDataList"></right-toolbar>
				</div>
			</el-row>

			<el-table :data="state.dataList" v-loading="state.loading" border :cell-style="tableStyle.cellStyle"
				:header-cell-style="tableStyle.headerCellStyle" @selection-change="selectionChangHandle"
				@sort-change="sortChangeHandle">
				<el-table-column type="selection" width="40" align="center" />
				<el-table-column type="index" label="#" width="40" />
				<el-table-column prop="name" :label="t('listener.name')" show-overflow-tooltip />
				<el-table-column :label="t('listener.type')" show-overflow-tooltip>
					<template #default="scope">
						{{ getTypeLabel(scope.row.type) }}
					</template>
				</el-table-column>
				<el-table-column :label="t('listener.eventType')" show-overflow-tooltip>
					<template #default="scope">
						{{ getEventTypeLabel(scope.row.type, scope.row.eventType) }}
					</template>
				</el-table-column>
				<el-table-column :label="t('listener.valueType')" show-overflow-tooltip>
					<template #default="scope">
						{{ getValueTypeLabel(scope.row.valueType) }}
					</template>
				</el-table-column>
				<el-table-column prop="remark" :label="t('listener.remark')" show-overflow-tooltip />
				<el-table-column :label="t('common.action')" width="150">
					<template #default="scope">
						<el-button icon="edit-pen" text type="primary" v-auth="'workflow_flowListener_edit'"
							@click="formDialogRef.openDialog(scope.row.id)">{{ t('listener.edit') }}
						</el-button>
						<el-button icon="delete" text type="primary" v-auth="'workflow_flowListener_del'"
							@click="handleDelete([scope.row.id])">{{ t('common.delBtn') }}
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

<script setup lang="ts" name="listener">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, delObjs } from '/@/api/workflow/listener';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { useDict } from '/@/hooks/dict';

// 使用国际化插件
const { t } = useI18n();

// 定义字典
const dictData = useDict('listener_type', 'listener_value_type', 'listener_event_task_type', 'listener_event_exec_type');
const { listener_type, listener_value_type, listener_event_task_type, listener_event_exec_type } = dictData;

// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));

// 定义变量内容
const formDialogRef = ref();
const excelUploadRef = ref();

// 获取类型标签
const getTypeLabel = (value: string) => {
	if (!value) return '';
	
	// 从字典中查找
	const dictList = listener_type.value || [];
	const item = dictList.find((item: any) => item && item.value === value);
	if (item) return item.label;
	
	// 如果字典中没有，使用默认映射
	const typeMapping: Record<string, string> = {
		'1': '任务监听器',
		'2': '执行监听器'
	};
	return typeMapping[value] || value;
};

// 获取值类型标签
const getValueTypeLabel = (value: string) => {
	if (!value) return '';
	
	// 从字典中查找
	const dictList = listener_value_type.value || [];
	const item = dictList.find((item: any) => item && item.value === value);
	if (item) return item.label;
	
	// 如果字典中没有，使用默认映射
	const valueTypeMapping: Record<string, string> = {
		'class': 'class',
		'expression': 'expression',
		'delegateExpression': 'delegateExpression'
	};
	return valueTypeMapping[value] || value;
};

// 获取事件类型标签
const getEventTypeLabel = (type: string, eventType: string) => {
	if (!type || !eventType) return '';
	
	let dictList: any[] = [];
	
	// 根据类型选择对应的字典
	if (type === '1') {
		dictList = listener_event_task_type.value || [];
	} else if (type === '2') {
		dictList = listener_event_exec_type.value || [];
	}
	
	// 从字典中查找
	const item = dictList.find((item: any) => item && item.value === eventType);
	if (item) return item.label;
	
	// 如果字典中没有，使用默认映射
	const eventTypeMapping: Record<string, string> = {
		'start': 'start',
		'end': 'end',
		'take': 'take',
		'complete': 'complete',
		'assignment': 'assignment',
		'create': 'create',
		'update': 'update',
		'delete': 'delete'
	};
	return eventTypeMapping[eventType] || eventType;
};

// 搜索变量
const queryRef = ref();
const showSearch = ref(true);

// 多选变量
const selectObjs = ref([]) as any;
const multiple = ref(true);

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		name: '',
	},
	pageList: fetchList,
	descs: ['create_time']
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

// 导出excel
const exportExcel = () => {
	downBlobFile('/workflow/flowListener/export', Object.assign(state.queryForm, { ids: selectObjs }), 'listener.xlsx');
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
</script>
