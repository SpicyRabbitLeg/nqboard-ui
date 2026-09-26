<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row>
				<div class="mb8" style="width: 100%">
					<el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()" v-auth="'export_extract_domain_add'">
						{{ $t('extractDomain.addBtn') }}
					</el-button>
					<el-button plain icon="magic-stick" type="primary" class="ml10" @click="handleGenerate"
						v-auth="'export_extract_domain_edit'">
						{{ $t('extractDomain.generateDraft') }}
					</el-button>
					<el-button plain icon="Refresh" type="warning" class="ml10" @click="handleTagging" v-auth="'export_extract_domain_edit'">
						{{ $t('extractDomain.startTagging') }}
					</el-button>
					<el-button plain icon="UploadFilled" type="success" class="ml10" @click="handleKnowledgeSync"
						v-auth="'export_extract_domain_edit'">
						{{ $t('extractDomain.syncKnowledge') }}
					</el-button>
					<right-toolbar @queryTable="getDataList" class="ml10 mr20" style="float: right"></right-toolbar>
				</div>
			</el-row>

			<el-table :data="dataList" v-loading="loading" border :cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle">
				<el-table-column type="index" label="#" width="60" />
				<el-table-column prop="domainCode" :label="t('extractDomain.domainCode')" width="100" show-overflow-tooltip />
				<el-table-column prop="domainName" :label="t('extractDomain.domainName')" min-width="140" show-overflow-tooltip />
				<el-table-column prop="description" :label="t('extractDomain.description')" min-width="200" show-overflow-tooltip />
				<el-table-column prop="keywords" :label="t('extractDomain.keywords')" min-width="180" show-overflow-tooltip />
				<el-table-column prop="adjacentCodes" :label="t('extractDomain.adjacentCodes')" min-width="120" show-overflow-tooltip />
				<el-table-column :label="t('extractDomain.status')" width="90">
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.status === '0'">{{ $t('extractDomain.enable') }}</el-tag>
						<el-tag type="info" v-else>{{ $t('extractDomain.disable') }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="seq" :label="t('extractDomain.seq')" width="70" />
				<el-table-column :label="t('common.action')" width="150">
					<template #default="scope">
						<el-button icon="edit-pen" text type="primary" v-auth="'export_extract_domain_edit'" @click="formDialogRef.openDialog(scope.row)"
							>{{ t('common.editBtn') }}
						</el-button>
						<el-button icon="delete" text type="primary" v-auth="'export_extract_domain_del'" @click="handleDelete([scope.row.id])"
							>{{ t('common.delBtn') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- 新增、编辑 -->
		<FormDialog ref="formDialogRef" @refresh="getDataList()" />

		<!-- AI 归纳草稿 -->
		<el-dialog :title="$t('extractDomain.draftTitle')" v-model="draftVisible" width="900" :close-on-click-modal="false" draggable>
			<el-alert :title="$t('extractDomain.draftTip')" type="info" :closable="false" class="mb8" />
			<div v-if="generating || generateProgress.error" class="mb8">
				<el-progress :percentage="generatePercent" :stroke-width="16" striped striped-flow />
				<div class="mt8" style="text-align: center">
					{{ generateProgress.done }} / {{ generateProgress.total }}
					<span v-if="generateProgress.running">（{{ $t('extractDomain.generateRunning') }}）</span>
					<span v-else-if="!generateProgress.error">{{ $t('extractDomain.generateDoneLoading') }}</span>
				</div>
				<div class="mt8" style="color: #999; font-size: 12px">{{ $t('extractDomain.generateAsyncTip') }}</div>
			</div>
			<el-alert v-if="generateProgress.error" :title="generateProgress.error" type="error" :closable="false" class="mb8" />
			<el-table :data="draftRows" v-loading="draftLoading" border max-height="420">
				<el-table-column type="index" label="#" width="40" />
				<el-table-column prop="domainCode" :label="t('extractDomain.domainCode')" width="90" />
				<el-table-column prop="domainName" :label="t('extractDomain.domainName')" min-width="130" show-overflow-tooltip />
				<el-table-column prop="description" :label="t('extractDomain.description')" min-width="220" show-overflow-tooltip />
				<el-table-column prop="keywords" :label="t('extractDomain.keywords')" min-width="180" show-overflow-tooltip />
			</el-table>
			<template #footer>
				<el-button @click="draftVisible = false">{{ $t('common.cancelButtonText') }}</el-button>
				<el-button type="primary" :loading="draftSaving" :disabled="generating || draftRows.length === 0" @click="handleSaveDraft">{{ $t('extractDomain.saveDraft') }}</el-button>
			</template>
		</el-dialog>

		<!-- 打标进度 -->
		<el-dialog :title="$t('extractDomain.taggingTitle')" v-model="taggingVisible" width="480" :close-on-click-modal="false">
			<el-progress :percentage="taggingPercent" :stroke-width="16" striped striped-flow />
			<div class="mt10" style="text-align: center">
				{{ tagging.done }} / {{ tagging.total }}
				<span v-if="tagging.running">（{{ $t('extractDomain.taggingRunning') }}）</span>
			</div>
		</el-dialog>

		<!-- 知识库同步进度 -->
		<el-dialog :title="$t('extractDomain.knowledgeTitle')" v-model="knowledgeVisible" width="480" :close-on-click-modal="false">
			<el-progress :percentage="knowledgePercent" :stroke-width="16" striped striped-flow />
			<div class="mt10" style="text-align: center">
				<template v-if="knowledge.error">
					<div style="color: var(--el-color-danger)">{{ knowledge.error }}</div>
					<div class="mt8" style="color: #999; font-size: 12px">{{ $t('extractDomain.knowledgeErrorTip') }}</div>
				</template>
				<template v-else-if="knowledgeUploadDone">
					<div>{{ $t('extractDomain.knowledgeUploadDone') }}</div>
					<div class="mt8">
						{{ $t('extractDomain.indexingStatus') }}：{{ indexing.completed }} / {{ indexing.total }}
						<el-tag type="success" size="small" v-if="indexing.ready">{{ $t('extractDomain.indexingReady') }}</el-tag>
						<el-tag type="warning" size="small" v-else-if="indexing.total > 0">{{ $t('extractDomain.indexingPending') }}</el-tag>
					</div>
					<div class="mt8" style="color: #999; font-size: 12px">{{ $t('extractDomain.indexingAsyncTip') }}</div>
				</template>
				<template v-else>{{ knowledge.done }} / {{ knowledge.total }}（{{ $t('extractDomain.knowledgeUploading') }}）</template>
			</div>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="extractDomain">
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useTable } from '/@/hooks/table';
import { useI18n } from 'vue-i18n';
import {
	fetchDomainList,
	delDomains,
	generateDomainDraft,
	fetchGenerateProgress,
	fetchGenerateResult,
	saveDomainBatch,
	startDomainTagging,
	fetchTaggingProgress,
	startKnowledgeSync,
	fetchKnowledgeProgress,
	fetchKnowledgeIndexingStatus,
} from '/@/api/export/extract';

// 使用国际化插件
const { t } = useI18n();

// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));

// 定义变量内容
const { tableStyle } = useTable({});
const formDialogRef = ref();

const dataList = ref([]);
const loading = ref(false);

// AI 归纳（异步任务，进度按 GENERATE_POLL_INTERVAL 轮询）
const GENERATE_POLL_INTERVAL = 5 * 1000;
const generating = ref(false);
const generateProgress = ref({ running: false, done: 0, total: 0, error: '' as string });
let generateTimer: any = null;
const generatePercent = computed(() =>
	generateProgress.value.total > 0 ? Math.round((generateProgress.value.done / generateProgress.value.total) * 100) : 0
);
const draftVisible = ref(false);
const draftLoading = ref(false);
const draftSaving = ref(false);
const draftRows = ref([]);

// 打标进度
const taggingVisible = ref(false);
const tagging = ref({ running: false, done: 0, total: 0 });
let progressTimer: any = null;
const taggingPercent = computed(() => (tagging.value.total > 0 ? Math.round((tagging.value.done / tagging.value.total) * 100) : 0));

// 知识库同步
const knowledgeVisible = ref(false);
const knowledge = ref({ running: false, done: 0, total: 0, error: '' as string });
const indexing = ref({ completed: 0, total: 0, ready: false });
let knowledgeTimer: any = null;
const knowledgePercent = computed(() => (knowledge.value.total > 0 ? Math.round((knowledge.value.done / knowledge.value.total) * 100) : 0));
const knowledgeUploadDone = computed(() => !knowledge.value.running && knowledge.value.total > 0);

// 获取领域列表
const getDataList = async () => {
	loading.value = true;
	try {
		const res: any = await fetchDomainList();
		dataList.value = res.data ?? [];
	} finally {
		loading.value = false;
	}
};

// AI 归纳领域草稿：触发异步任务后轮询进度，完成后自动加载结果
const handleGenerate = async () => {
	// 任务进行中：直接打开进度弹窗，不重复发起
	if (generating.value) {
		draftVisible.value = true;
		return;
	}
	try {
		await useMessageBox().confirm(t('extractDomain.generateConfirm'));
	} catch {
		return;
	}
	try {
		await generateDomainDraft();
		generating.value = true;
		generateProgress.value = { running: true, done: 0, total: 0, error: '' };
		draftRows.value = [];
		draftVisible.value = true;
		pollGenerateProgress();
		startGeneratePolling();
	} catch (err: any) {
		useMessage().error(err.msg);
	}
};

const startGeneratePolling = () => {
	stopGeneratePolling();
	generateTimer = setInterval(pollGenerateProgress, GENERATE_POLL_INTERVAL);
};

const stopGeneratePolling = () => {
	if (generateTimer) {
		clearInterval(generateTimer);
		generateTimer = null;
	}
};

const pollGenerateProgress = async () => {
	let res: any;
	try {
		res = await fetchGenerateProgress();
	} catch {
		// 瞬时网络异常跳过本轮，不打断长任务轮询
		return;
	}
	generateProgress.value = { running: false, done: 0, total: 0, error: '', ...(res.data ?? {}) };
	if (generateProgress.value.error) {
		stopGeneratePolling();
		generating.value = false;
		useMessage().error(generateProgress.value.error);
		return;
	}
	// total 为 0 时任务尚未完成初始化，继续等待下一轮
	if (!generateProgress.value.running && generateProgress.value.total > 0) {
		stopGeneratePolling();
		loadGenerateResult();
	}
};

const loadGenerateResult = async () => {
	draftLoading.value = true;
	try {
		const res: any = await fetchGenerateResult();
		draftRows.value = res.data ?? [];
		generating.value = false;
		useMessage().success(t('extractDomain.generateSuccess'));
	} catch (err: any) {
		generating.value = false;
		useMessage().error(err.msg);
	} finally {
		draftLoading.value = false;
	}
};

// 草稿批量入库
const handleSaveDraft = async () => {
	draftSaving.value = true;
	try {
		await saveDomainBatch(draftRows.value);
		useMessage().success(t('common.addSuccessText'));
		draftVisible.value = false;
		getDataList();
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		draftSaving.value = false;
	}
};

// 触发打标并轮询进度
const handleTagging = async () => {
	try {
		await useMessageBox().confirm(t('extractDomain.taggingConfirm'));
	} catch {
		return;
	}
	try {
		await startDomainTagging();
		taggingVisible.value = true;
		startProgressPolling();
	} catch (err: any) {
		useMessage().error(err.msg);
	}
};

const startProgressPolling = () => {
	stopProgressPolling();
	progressTimer = setInterval(async () => {
		try {
			const res: any = await fetchTaggingProgress();
			tagging.value = res.data ?? tagging.value;
			// total 为 0 说明任务计数尚未初始化，避免把刚启动误判成已完成
			if (!tagging.value.running && tagging.value.total > 0) {
				stopProgressPolling();
				taggingVisible.value = false;
				useMessage().success(t('extractDomain.taggingDone'));
			}
		} catch {
			stopProgressPolling();
		}
	}, 2000);
};

const stopProgressPolling = () => {
	if (progressTimer) {
		clearInterval(progressTimer);
		progressTimer = null;
	}
};

// 触发知识库同步并轮询进度；分片上传完成后转查向量索引状态，失败原因经 error 字段展示
const handleKnowledgeSync = async () => {
	try {
		await useMessageBox().confirm(t('extractDomain.knowledgeConfirm'));
	} catch {
		return;
	}
	try {
		await startKnowledgeSync();
		knowledge.value = { running: true, done: 0, total: 0, error: '' };
		knowledgeVisible.value = true;
		startKnowledgePolling();
	} catch (err: any) {
		useMessage().error(err.msg);
	}
};

const startKnowledgePolling = () => {
	stopKnowledgePolling();
	knowledgeTimer = setInterval(async () => {
		let res: any;
		try {
			res = await fetchKnowledgeProgress();
		} catch {
			// 瞬时网络异常跳过本轮，不打断同步轮询
			return;
		}
		knowledge.value = { running: false, done: 0, total: 0, error: '', ...(res.data ?? {}) };
		if (knowledge.value.error) {
			stopKnowledgePolling();
			return;
		}
		if (!knowledge.value.running && knowledge.value.total > 0) {
			try {
				const idx: any = await fetchKnowledgeIndexingStatus();
				indexing.value = idx.data ?? indexing.value;
			} finally {
				stopKnowledgePolling();
			}
		}
	}, 2000);
};

const stopKnowledgePolling = () => {
	if (knowledgeTimer) {
		clearInterval(knowledgeTimer);
		knowledgeTimer = null;
	}
};

// 删除操作
const handleDelete = async (ids: string[]) => {
	try {
		await useMessageBox().confirm(t('common.delConfirmText'));
	} catch {
		return;
	}
	try {
		await delDomains(ids);
		getDataList();
		useMessage().success(t('common.delSuccessText'));
	} catch (err: any) {
		useMessage().error(err.msg);
	}
};

onMounted(() => {
	getDataList();
	// 页面加载时若 AI 归纳仍在进行，恢复进度轮询
	fetchGenerateProgress()
		.then((res: any) => {
			generateProgress.value = { running: false, done: 0, total: 0, error: '', ...(res.data ?? {}) };
			if (generateProgress.value.running) {
				generating.value = true;
				draftVisible.value = true;
				startGeneratePolling();
			}
		})
		.catch(() => {});
	// 页面加载时若打标仍在进行，恢复进度轮询
	fetchTaggingProgress()
		.then((res: any) => {
			tagging.value = res.data ?? tagging.value;
			if (tagging.value.running) {
				taggingVisible.value = true;
				startProgressPolling();
			}
		})
		.catch(() => {});
	// 页面加载时若知识库同步仍在进行，恢复进度轮询
	fetchKnowledgeProgress()
		.then((res: any) => {
			knowledge.value = { running: false, done: 0, total: 0, error: '', ...(res.data ?? {}) };
			if (knowledge.value.running) {
				knowledgeVisible.value = true;
				startKnowledgePolling();
			}
		})
		.catch(() => {});
});

onUnmounted(() => {
	stopGeneratePolling();
	stopProgressPolling();
	stopKnowledgePolling();
});
</script>
