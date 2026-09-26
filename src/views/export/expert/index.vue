<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('expert.expertName')" prop="expertName">
						<el-input v-model="state.queryForm.expertName" :placeholder="$t('expert.inputExpertNameTip')" clearable />
					</el-form-item>
					<el-form-item :label="$t('expert.subjectCategory')" prop="subjectCategory">
						<el-select v-model="state.queryForm.subjectCategory" class="w100" clearable filterable
							:placeholder="$t('expert.inputSubjectCategoryTip')" @change="handleCategoryChange">
							<el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
						</el-select>
					</el-form-item>
					<el-form-item :label="$t('expert.firstDiscipline')" prop="firstDiscipline">
						<el-select v-model="state.queryForm.firstDiscipline" class="w100" clearable filterable
							:placeholder="$t('expert.inputFirstDisciplineTip')">
							<el-option v-for="item in disciplineOptions" :key="item" :label="item" :value="item" />
						</el-select>
					</el-form-item>
					<el-form-item :label="$t('expert.researchDirection')" prop="researchDirection">
						<el-input v-model="state.queryForm.researchDirection" :placeholder="$t('expert.inputResearchDirectionTip')" clearable />
					</el-form-item>
					<el-form-item>
						<el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }} </el-button>
						<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
					</el-form-item>
				</el-form>
			</el-row>

			<el-row>
				<div class="mb8" style="width: 100%">
					<el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()" v-auth="'export_expert_add'">
						{{ $t('common.addBtn') }}
					</el-button>

					<el-button plain :disabled="multiple" icon="Delete" type="primary" v-auth="'export_expert_del'" @click="handleDelete(selectObjs)">
						{{ $t('common.delBtn') }}
					</el-button>

					<el-button plain @click="excelUploadRef.show()" class="ml10" icon="upload-filled" type="primary" v-auth="'export_expert_add'">
						{{ $t('expert.importBtn') }}
					</el-button>

					<right-toolbar
						v-model:showSearch="showSearch"
						:export="'export_expert_export'"
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
				<el-table-column prop="expertName" :label="t('expert.expertName')" show-overflow-tooltip />
				<el-table-column prop="subjectCategory" :label="t('expert.subjectCategory')" show-overflow-tooltip />
				<el-table-column prop="firstDiscipline" :label="t('expert.firstDiscipline')" show-overflow-tooltip />
				<el-table-column prop="secondDiscipline" :label="t('expert.secondDiscipline')" show-overflow-tooltip />
				<el-table-column prop="researchDirection" :label="t('expert.researchDirection')" show-overflow-tooltip />
				<el-table-column prop="domainName" :label="t('expert.domainName')" show-overflow-tooltip />
				<el-table-column :label="t('common.action')" width="150">
					<template #default="scope">
						<el-button icon="edit-pen" text type="primary" v-auth="'export_expert_edit'" @click="formDialogRef.openDialog(scope.row.id)"
							>{{ t('expert.edit') }}
						</el-button>
						<el-button icon="delete" text type="primary" v-auth="'export_expert_del'" @click="handleDelete([scope.row.id])"
							>{{ t('common.delBtn') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<!-- 分页 -->
			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
		</div>

		<!-- 编辑、新增  -->
		<FormDialog ref="formDialogRef" @refresh="getDataList(false)" />

		<!-- 导入excel -->
		<upload-excel
			ref="excelUploadRef"
			:title="$t('expert.importTitle')"
			url="/export/expert/import"
			temp-url="/export/expert_template.xlsx"
			@refreshDataList="getDataList"
		/>
	</div>
</template>

<script setup lang="ts" name="expert">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, delObjs, fetchCategoryOptions, fetchDisciplineOptions } from '/@/api/export/expert';
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
		expertName: '',
		subjectCategory: '',
		firstDiscipline: '',
		researchDirection: '',
	},
	 pagination: {
        size: 200,
    },
	pageList: fetchList,
});

// 下拉选项
const categoryOptions = ref<string[]>([]);
const disciplineOptions = ref<string[]>([]);

// 学科门类切换：级联重载一级学科选项，并清空已选学科
const handleCategoryChange = async (category: string) => {
	state.queryForm.firstDiscipline = '';
	const res: any = await fetchDisciplineOptions(category || undefined);
	disciplineOptions.value = (res.data as string[]) ?? [];
};

onMounted(async () => {
	const res: any = await fetchCategoryOptions();
	categoryOptions.value = (res.data as string[]) ?? [];
	handleCategoryChange('');
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
	downBlobFile('/export/expert/export', Object.assign(state.queryForm, { ids: selectObjs }), 'expert.xlsx');
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
