<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('stockBasic.tsCode')" prop="tsCode">
						<el-input v-model="state.queryForm.tsCode" :placeholder="$t('stockBasic.inputTsCodeTip')" clearable />
					</el-form-item>
					<el-form-item :label="$t('stockBasic.name')" prop="name">
						<el-input v-model="state.queryForm.name" :placeholder="$t('stockBasic.inputNameTip')" clearable />
					</el-form-item>
					<el-form-item :label="$t('stockBasic.market')" prop="market">
						<el-select v-model="state.queryForm.market" :placeholder="$t('stockBasic.inputMarketTip')" clearable>
							<el-option :label="$t('stockBasic.mainBoard')" value="主板" />
							<el-option :label="$t('stockBasic.chinext')" value="创业板" />
							<el-option :label="$t('stockBasic.starBoard')" value="科创板" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }} </el-button>
						<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
					</el-form-item>
				</el-form>
			</el-row>

			<el-row>
				<div class="mb8" style="width: 100%">
					<el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()" v-auth="'quanta_stockBasic_add'">
						{{ $t('common.addBtn') }}
					</el-button>

					<el-button plain :disabled="multiple" icon="Delete" type="primary" v-auth="'quanta_stockBasic_del'" @click="handleDelete(selectObjs)">
						{{ $t('common.delBtn') }}
					</el-button>

					<right-toolbar
						v-model:showSearch="showSearch"
						:export="'quanta_stockBasic_export'"
						@exportExcel="exportExcel"
						class="ml10 mr20"
						style="float: right"
						@queryTable="getDataList"
					></right-toolbar>
				</div>
			</el-row>

			<el-table
				:data="state.dataList"
				v-loading="state.loading"
				border
				:cell-style="tableStyle.cellStyle"
				:header-cell-style="tableStyle.headerCellStyle"
				@selection-change="selectionChangHandle"
				@sort-change="sortChangeHandle"
			>
				<el-table-column type="selection" width="40" align="center" />
				<el-table-column type="index" label="#" width="60" />
				<el-table-column prop="tsCode" :label="t('stockBasic.tsCode')" show-overflow-tooltip />
				<el-table-column prop="name" :label="t('stockBasic.name')" show-overflow-tooltip />
				<el-table-column prop="industry" :label="t('stockBasic.industry')" show-overflow-tooltip />
				<el-table-column prop="area" :label="t('stockBasic.area')" show-overflow-tooltip />
				<el-table-column prop="market" :label="t('stockBasic.market')" show-overflow-tooltip width="90" />
				<el-table-column prop="listDate" :label="t('stockBasic.listDate')" show-overflow-tooltip width="110" />
				<el-table-column prop="remark" :label="t('stockBasic.remark')" show-overflow-tooltip />
				<el-table-column :label="t('common.action')" width="150">
					<template #default="scope">
						<el-button icon="edit-pen" text type="primary" v-auth="'quanta_stockBasic_edit'" @click="formDialogRef.openDialog(scope.row.id)"
							>{{ t('common.editBtn') }}
						</el-button>
						<el-button icon="delete" text type="primary" v-auth="'quanta_stockBasic_del'" @click="handleDelete([scope.row.id])"
							>{{ t('common.delBtn') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<!-- 分页 -->
			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
		</div>

		<!-- 编辑、新增 -->
		<FormDialog ref="formDialogRef" @refresh="getDataList(false)" />
	</div>
</template>

<script setup lang="ts" name="stockbasic">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, delObjs } from '/@/api/quanta/stockBasic';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';

// 使用国际化插件
const { t } = useI18n();

// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));

// 定义变量内容
const formDialogRef = ref();
const excelUploadRef = ref();

// 搜索变量
const queryRef = ref();
const showSearch = ref(true);

// 多选变量
const selectObjs = ref([]) as any;
const multiple = ref(true);

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		tsCode: '',
		name: '',
		market: '',
	},
	pageList: fetchList,
	ascs: ['ts_code'],
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
	downBlobFile('/quanta/stockBasic/export', Object.assign(state.queryForm, { ids: selectObjs }), 'stockBasic.xlsx');
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
