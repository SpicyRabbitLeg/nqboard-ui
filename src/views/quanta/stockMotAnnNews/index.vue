<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('stockMotAnnNews.tsCode')" prop="tsCode">
						<el-input v-model="state.queryForm.tsCode" :placeholder="$t('stockMotAnnNews.inputTsCodeTip')" clearable />
					</el-form-item>
					<el-form-item :label="$t('stockMotAnnNews.pubDate')" prop="pubDate">
						<el-input v-model="state.queryForm.pubDate" :placeholder="$t('stockMotAnnNews.inputPubDateTip')" clearable />
					</el-form-item>
					<el-form-item :label="$t('stockMotAnnNews.newsType')" prop="newsType">
						<el-select v-model="state.queryForm.newsType" :placeholder="$t('stockMotAnnNews.inputNewsTypeTip')" clearable>
							<el-option :label="$t('stockMotAnnNews.annType')" value="ann" />
							<el-option :label="$t('stockMotAnnNews.mediaType')" value="media" />
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
					<el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()" v-auth="'quanta_stockMotAnnNews_add'">
						{{ $t('common.addBtn') }}
					</el-button>

					<el-button plain :disabled="multiple" icon="Delete" type="primary" v-auth="'quanta_stockMotAnnNews_del'" @click="handleDelete(selectObjs)">
						{{ $t('common.delBtn') }}
					</el-button>

					<!-- 手动刷新新闻：输入股票代码持久化 -->
					<el-button icon="refresh" type="warning" class="ml10" @click="openSyncDialog">
						{{ $t('stockMotAnnNews.syncBtn') }}
					</el-button>

					<right-toolbar
						v-model:showSearch="showSearch"
						:export="'quanta_stockMotAnnNews_export'"
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
				<el-table-column prop="tsCode" :label="t('stockMotAnnNews.tsCode')" show-overflow-tooltip width="120" />
				<el-table-column prop="pubDate" :label="t('stockMotAnnNews.pubDate')" show-overflow-tooltip width="110" />
				<el-table-column prop="pubDatetime" :label="t('stockMotAnnNews.pubDatetime')" show-overflow-tooltip width="170" />
				<el-table-column prop="newsType" :label="t('stockMotAnnNews.newsType')" width="100" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.newsType === 'ann'" type="primary">{{ t('stockMotAnnNews.annType') }}</el-tag>
						<el-tag v-else-if="scope.row.newsType === 'media'" type="warning">{{ t('stockMotAnnNews.mediaType') }}</el-tag>
						<el-tag v-else>{{ scope.row.newsType }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="src" :label="t('stockMotAnnNews.src')" show-overflow-tooltip width="110" />
				<el-table-column prop="title" :label="t('stockMotAnnNews.title')" show-overflow-tooltip min-width="220" />
				<el-table-column prop="summary" :label="t('stockMotAnnNews.summary')" show-overflow-tooltip min-width="200" />
				<el-table-column prop="url" :label="t('stockMotAnnNews.url')" show-overflow-tooltip min-width="160">
					<template #default="scope">
						<el-link v-if="scope.row.url" type="primary" :href="scope.row.url" target="_blank" :underline="false">链接</el-link>
					</template>
				</el-table-column>
				<el-table-column :label="t('common.action')" width="150">
					<template #default="scope">
						<el-button icon="edit-pen" text type="primary" v-auth="'quanta_stockMotAnnNews_edit'" @click="formDialogRef.openDialog(scope.row.id)"
							>{{ t('common.editBtn') }}
						</el-button>
						<el-button icon="delete" text type="primary" v-auth="'quanta_stockMotAnnNews_del'" @click="handleDelete([scope.row.id])"
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

		<!-- 手动刷新新闻弹窗 -->
		<el-dialog :title="$t('stockMotAnnNews.syncDialogTitle')" v-model="syncVisible" width="480px" :close-on-click-modal="false" draggable>
			<el-form :model="syncForm" label-width="100px">
				<el-form-item :label="$t('stockMotAnnNews.tsCode')" prop="tsCode">
					<el-input v-model="syncForm.tsCode" :placeholder="$t('stockMotAnnNews.syncTsCodeTip')" clearable />
				</el-form-item>
				<el-form-item :label="$t('stockMotAnnNews.syncFullLabel')" prop="full">
					<el-switch v-model="syncForm.full" />
					<span class="ml10" style="color: #909399">{{ $t('stockMotAnnNews.syncFullTip') }}</span>
				</el-form-item>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="syncVisible = false">{{ $t('common.cancelButtonText') }}</el-button>
					<el-button type="primary" :loading="syncing" @click="onSync">{{ $t('common.confirmButtonText') }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="stockMotAnnNews">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, delObjs, syncNews } from '/@/api/quanta/stockMotAnnNews';
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

// 手动刷新新闻弹窗
const syncVisible = ref(false);
const syncing = ref(false);
const syncForm = reactive({ tsCode: '', full: false });

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		tsCode: '',
		pubDate: '',
		newsType: '',
	},
	pageList: fetchList,
	descs: ['pub_date'],
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
	downBlobFile('/quanta/stockMotAnnNews/export', Object.assign(state.queryForm, { ids: selectObjs }), 'stockMotAnnNews.xlsx');
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

// 打开手动刷新弹窗
const openSyncDialog = () => {
	syncForm.tsCode = '';
	syncForm.full = false;
	syncVisible.value = true;
};

// 手动刷新：按股票代码同步公告&新闻并持久化
const onSync = async () => {
	if (!syncForm.tsCode.trim()) {
		useMessage().warning(t('stockMotAnnNews.syncTsCodeTip'));
		return;
	}
	syncing.value = true;
	try {
		const res: any = await syncNews({ tsCode: syncForm.tsCode.trim(), full: syncForm.full });
		useMessage().success(t('stockMotAnnNews.syncSuccessMsg', { count: res.data ?? 0 }));
		syncVisible.value = false;
		getDataList();
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		syncing.value = false;
	}
};
</script>
