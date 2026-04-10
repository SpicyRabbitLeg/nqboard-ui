<template>
	<el-row v-show="showSearch">
		<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
			<el-form-item :label="$t('model.name')" prop="name">
				<el-input v-model="state.queryForm.name" :placeholder="$t('modelTemplate.inputNameTip')" clearable />
			</el-form-item>
			<el-form-item :label="$t('model.identifier')" prop="identifier">
				<el-input v-model="state.queryForm.identifier" :placeholder="$t('modelTemplate.inputIdentifierTip')"
					clearable />
			</el-form-item>
			<el-form-item :label="$t('model.dataType')" type="dataType">
				<el-input v-model="state.queryForm.type" :placeholder="$t('modelTemplate.inputDataTypeTip')"
					clearable />
			</el-form-item>
			<el-form-item>
				<el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }}</el-button>
				<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
			</el-form-item>
		</el-form>
	</el-row>

	<el-row>
		<div class="mb8" style="width: 100%">
			<el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()"
				v-auth="'device_model_add'">
				{{ $t('common.addBtn') }}
			</el-button>

			<el-button icon="upload-filled" plain type="primary" class="ml10" @click="importDialogRef.openDialog()"
				v-auth="'device_model_export'">
				{{ $t('common.importBtn') }}
			</el-button>

			<el-button plain :disabled="multiple" icon="Delete" type="primary" v-auth="'device_model_del'"
				@click="handleDelete(selectObjs)">
				{{ $t('common.delBtn') }}
			</el-button>

			<right-toolbar v-model:showSearch="showSearch" :export="'device_model_export'" @exportExcel="exportExcel"
				class="ml10 mr20" style="float: right" @queryTable="getDataList"></right-toolbar>
		</div>
	</el-row>

	<el-table :data="state.dataList" v-loading="state.loading" :cell-style="tableStyle.cellStyle"
		:header-cell-style="tableStyle.headerCellStyle" @selection-change="selectionChangHandle"
		@sort-change="sortChangeHandle" border>
		<el-table-column type="selection" width="40" align="center" />
		<el-table-column type="index" label="#" width="40" />
		<el-table-column prop="name" :label="$t('model.name')" show-overflow-tooltip />
		<el-table-column prop="identifier" :label="$t('model.identifier')" show-overflow-tooltip />
		<el-table-column prop="type" :label="$t('model.type')" show-overflow-tooltip>
			<template #default="{ row }">
				{{ filterWord(row.type, read_write_type) }}
			</template>
		</el-table-column>
		<el-table-column prop="dataType" :label="$t('model.dataType')" show-overflow-tooltip>
			<template #default="{ row }">
				<span>
					{{ filterWord(row.dataType, data_type) }}
				</span>
			</template>
		</el-table-column>
		<el-table-column prop="baseValue" :label="$t('model.baseValue')" show-overflow-tooltip />
		<el-table-column prop="proportionalCoefficient" :label="$t('model.proportionalCoefficient')"
			show-overflow-tooltip />
		<el-table-column prop="specs" :label="$t('model.specs')" show-overflow-tooltip />
		<el-table-column prop="remark" :label="$t('model.remark')" show-overflow-tooltip />
		<el-table-column prop="orderNum" :label="$t('model.orderNum')" show-overflow-tooltip />

		<el-table-column :label="t('common.action')" width="150">
			<template #default="scope">
				<el-button icon="edit-pen" text type="primary" v-auth="'device_ModelTemplate_edit'"
					@click="formDialogRef.openDialog(scope.row.id)">{{ t('category.edit') }}
				</el-button>
				<el-button icon="delete" text type="primary" v-auth="'device_ModelTemplate_del'"
					@click="handleDelete([scope.row.id])">{{ t('common.delBtn') }}
				</el-button>
			</template>
		</el-table-column>
	</el-table>

	<!-- 编辑、新增  -->
	<FormDialog :product-id="productId" ref="formDialogRef" @refresh="getDataList(false)" />
	<ImportDialog :product-id="productId" ref="importDialogRef" @refresh="getDataList(false)" />
</template>


<script setup lang="ts" name="model">
import { fetchList, delObjs } from '/@/api/device/model';
import { BasicTableProps, useTable } from '/@/hooks/table';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';
import { useDict } from '/@/hooks/dict';

// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));
const ImportDialog = defineAsyncComponent(() => import('./import.vue'));

// 使用国际化插件
const { t } = useI18n();

// 定义变量内容
const route = useRoute();


// 组件
const formDialogRef = ref();
const importDialogRef = ref();


// 搜索变量
const queryRef = ref();
const showSearch = ref(true);
// 多选变量
const selectObjs = ref([]) as any;
const multiple = ref(true);
const productId = (typeof route.query.id === 'string' ? route.query.id : '') as string;




// 定义字典
const { data_type, read_write_type } = useDict('data_type', 'read_write_type');



const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		name: "",
		identifier: "",
		type: "",
		productId: productId
	},
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

// 导出excel
const exportExcel = () => {
	downBlobFile('/device/model/export', Object.assign(state.queryForm, { ids: selectObjs }), 'Model.xlsx');
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