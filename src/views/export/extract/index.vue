<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<!-- 抽取输入区 -->
			<el-card shadow="never" class="mb8">
				<el-input
					v-model="queryText"
					type="textarea"
					:rows="2"
					maxlength="500"
					show-word-limit
					:placeholder="$t('expertExtract.queryPlaceholder')"
					:disabled="running"
				/>
				<div class="mt8" style="display: flex; justify-content: space-between; align-items: center">
					<div>
						<el-tag v-for="d in parsedDomainNames" :key="d" class="mr8" type="primary">{{ d }}</el-tag>
						<span v-if="!record.id" style="color: #999; font-size: 12px">{{ $t('expertExtract.emptyHint') }}</span>
					</div>
					<div>
						<el-button icon="Clock" @click="openHistory">{{ $t('expertExtract.history') }}</el-button>
						<el-button type="primary" icon="Search" :loading="running" v-auth="'export_extract_run'" @click="handleRun">
							{{ $t('expertExtract.runBtn') }}
						</el-button>
					</div>
				</div>
			</el-card>

			<!-- 任务进度（异步抽取：解析/打分/复核/落库） -->
			<el-card v-if="running" shadow="never" class="mb8">
				<div style="display: flex; align-items: center; gap: 12px">
					<span>{{ stageText }}</span>
					<el-progress v-if="progress.total > 0" :percentage="progressPercent" striped striped-flow style="flex: 1" />
				</div>
				<div v-if="progress.error" style="color: #f56c6c; font-size: 12px">{{ progress.error }}</div>
			</el-card>

			<!-- 三档统计 -->
			<el-row v-if="record.id && !running" :gutter="8" class="mb8">
				<el-col :span="8">
					<el-card shadow="never">
						<el-statistic :title="$t('expertExtract.statSelected')" :value="record.selectedCount ?? 0" />
					</el-card>
				</el-col>
				<el-col :span="8">
					<el-card shadow="never">
						<el-statistic :title="$t('expertExtract.statCandidate')" :value="record.candidateCount ?? 0" />
					</el-card>
				</el-col>
				<el-col :span="8">
					<el-card shadow="never">
						<el-statistic :title="$t('expertExtract.statUnmatched')" :value="record.unmatchedCount ?? 0" />
						<div style="color: #999; font-size: 12px">{{ $t('expertExtract.unmatchedTip') }}</div>
					</el-card>
				</el-col>
			</el-row>
			<div v-if="record.id && !running" style="color: #999; font-size: 12px" class="mb8">
				{{ $t('expertExtract.tierTip') }}
			</div>

			<!-- 三档结果 -->
			<el-tabs v-if="record.id && !running" v-model="activeTab" @tab-change="handleTabChange">
				<el-tab-pane :label="$t('expertExtract.selectedTab')" name="selected">
					<el-table :data="selectedState.records" v-loading="selectedState.loading" border max-height="calc(100vh - 420px)"
						:cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle">
						<el-table-column type="index" label="#" width="60" />
						<el-table-column prop="expertName" :label="$t('expertExtract.expertName')" min-width="110" show-overflow-tooltip />
						<el-table-column prop="subjectCategory" :label="$t('expertExtract.subjectCategory')" width="110" show-overflow-tooltip />
						<el-table-column prop="firstDiscipline" :label="$t('expertExtract.firstDiscipline')" min-width="150" show-overflow-tooltip />
						<el-table-column prop="researchDirection" :label="$t('expertExtract.researchDirection')" min-width="180" show-overflow-tooltip />
						<el-table-column prop="reason" :label="$t('expertExtract.reason')" min-width="130" show-overflow-tooltip />
					</el-table>
					<el-pagination class="mt8" background layout="total, prev, pager, next, sizes" :total="selectedState.total"
						v-model:current-page="selectedState.current" v-model:page-size="selectedState.size"
						@current-change="loadSelected" @size-change="handleSelectedSizeChange" />
				</el-tab-pane>
				<el-tab-pane :label="$t('expertExtract.candidateTab')" name="candidate">
					<el-table :data="candidateState.records" v-loading="candidateState.loading" border max-height="calc(100vh - 420px)"
						:cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle">
						<el-table-column type="index" label="#" width="60" />
						<el-table-column prop="expertName" :label="$t('expertExtract.expertName')" min-width="110" show-overflow-tooltip />
						<el-table-column prop="subjectCategory" :label="$t('expertExtract.subjectCategory')" width="110" show-overflow-tooltip />
						<el-table-column prop="firstDiscipline" :label="$t('expertExtract.firstDiscipline')" min-width="150" show-overflow-tooltip />
						<el-table-column prop="researchDirection" :label="$t('expertExtract.researchDirection')" min-width="180" show-overflow-tooltip />
						<el-table-column prop="score" :label="$t('expertExtract.score')" width="100">
							<template #default="scope">{{ scope.row.score ?? '-' }}</template>
						</el-table-column>
						<el-table-column prop="reason" :label="$t('expertExtract.reason')" min-width="130" show-overflow-tooltip />
					</el-table>
					<el-pagination class="mt8" background layout="total, prev, pager, next, sizes" :total="candidateState.total"
						v-model:current-page="candidateState.current" v-model:page-size="candidateState.size"
						@current-change="loadCandidate" @size-change="handleCandidateSizeChange" />
				</el-tab-pane>
				<el-tab-pane :label="$t('expertExtract.unmatchedTab')" name="unmatched">
					<el-table :data="unmatchedState.records" v-loading="unmatchedState.loading" border max-height="calc(100vh - 420px)"
						:cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle">
						<el-table-column type="index" :label="$t('expertExtract.unmatchedIndex')" width="60"
							:index="(i: number) => (unmatchedState.current - 1) * unmatchedState.size + i + 1" />
						<el-table-column prop="expertName" :label="$t('expertExtract.expertName')" min-width="110" show-overflow-tooltip />
						<el-table-column prop="subjectCategory" :label="$t('expertExtract.subjectCategory')" width="110" show-overflow-tooltip />
						<el-table-column prop="firstDiscipline" :label="$t('expertExtract.firstDiscipline')" min-width="150" show-overflow-tooltip />
						<el-table-column prop="researchDirection" :label="$t('expertExtract.researchDirection')" min-width="220" show-overflow-tooltip />
					</el-table>
					<el-pagination class="mt8" background layout="total, prev, pager, next, sizes" :total="unmatchedState.total"
						v-model:current-page="unmatchedState.current" v-model:page-size="unmatchedState.size"
						@current-change="loadUnmatched" @size-change="handleUnmatchedSizeChange" />
				</el-tab-pane>
			</el-tabs>

			<!-- 历史记录抽屉 -->
			<el-drawer v-model="historyVisible" :title="$t('expertExtract.historyTitle')" size="60%">
				<el-input v-model="historyKeyword" :placeholder="$t('expertExtract.historySearchTip')" clearable class="mb8"
					@keyup.enter="handleHistorySearch">
					<template #append>
						<el-button icon="Search" @click="handleHistorySearch" />
					</template>
				</el-input>
				<el-table :data="historyState.records" v-loading="historyState.loading" border
					:cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle"
					highlight-current-row @row-click="viewHistoryRow" style="cursor: pointer">
					<el-table-column prop="queryText" :label="$t('expertExtract.recordQuery')" min-width="200" show-overflow-tooltip />
					<el-table-column prop="selectedCount" :label="$t('expertExtract.statSelected')" width="80" align="center" />
					<el-table-column prop="candidateCount" :label="$t('expertExtract.statCandidate')" width="80" align="center" />
					<el-table-column prop="unmatchedCount" :label="$t('expertExtract.statUnmatched')" width="90" align="center" />
					<el-table-column prop="createTime" :label="$t('expertExtract.recordTime')" width="170" />
					<el-table-column :label="$t('expertExtract.recordStatus')" width="80" align="center">
						<template #default="scope">
							<el-tag :type="statusTagType(scope.row.status)" size="small">{{ statusText(scope.row.status) }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column :label="$t('common.action')" width="80">
						<template #default="scope">
							<el-button text type="primary" @click.stop="viewHistoryRow(scope.row)">{{ $t('expertExtract.view') }}</el-button>
						</template>
					</el-table-column>
				</el-table>
				<el-pagination class="mt8" background layout="total, prev, pager, next" :total="historyState.total"
					v-model:current-page="historyState.current" v-model:page-size="historyState.size"
					@current-change="loadHistory" />
			</el-drawer>
		</div>
	</div>
</template>

<script setup lang="ts" name="expertExtract">
import { useMessage } from '/@/hooks/message';
import { useTable } from '/@/hooks/table';
import { useI18n } from 'vue-i18n';
import {
	runExtraction,
	fetchRunProgress,
	fetchExtractRecord,
	fetchExtractRecords,
	fetchExtractRecordDetail,
	fetchUnmatchedExperts,
	fetchDomainList,
} from '/@/api/export/extract';

// 使用国际化插件
const { t } = useI18n();

// 表格通用样式
const { tableStyle } = useTable({});

const queryText = ref('');
const running = ref(false);
const record = ref<any>({});
const parsedDomainNames = ref<string[]>([]);
const activeTab = ref('selected');

// 异步任务进度（后端单飞，同一时刻至多一个抽取任务）
const progress = reactive({ stage: '', done: 0, total: 0, error: '' as any, recordId: null as any });
let pollTimer: any = null;

const stageText = computed(() => {
	const map: Record<string, string> = {
		parse: t('expertExtract.stageParse'),
		score: t('expertExtract.stageScore'),
		review: t('expertExtract.stageReview'),
		save: t('expertExtract.stageSave'),
	};
	const base = map[progress.stage] ?? t('expertExtract.stageParse');
	return progress.stage === 'review' && progress.total > 0 ? `${base} ${progress.done}/${progress.total}` : base;
});

const progressPercent = computed(() => (progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0));

const statusText = (s: string) =>
	s === '2' ? t('expertExtract.statusRunning') : s === '1' ? t('expertExtract.statusFailed') : t('expertExtract.statusSuccess');

const statusTagType = (s: string) => (s === '2' ? 'warning' : s === '1' ? 'danger' : 'success');

// 三档各自的分页状态
const selectedState = reactive({ records: [] as any[], total: 0, current: 1, size: 10, loading: false });
const candidateState = reactive({ records: [] as any[], total: 0, current: 1, size: 10, loading: false });
const unmatchedState = reactive({ records: [] as any[], total: 0, current: 1, size: 10, loading: false });

// 历史记录
const historyVisible = ref(false);
const historyKeyword = ref('');
const historyState = reactive({ records: [] as any[], total: 0, current: 1, size: 10, loading: false });

// 领域编码 -> 名称映射（解析领域 chips 展示用）
const domainNameMap = ref<Record<string, string>>({});

onMounted(() => {
	fetchDomainList()
		.then((res: any) => {
			const map: Record<string, string> = {};
			(res.data ?? []).forEach((d: any) => (map[d.domainCode] = d.domainName));
			domainNameMap.value = map;
		})
		.catch(() => {});
	// 页面加载时恢复进行中任务的轮询（重启页面不丢任务）
	fetchRunProgress()
		.then((res: any) => {
			if (res.data?.running) {
				running.value = true;
				progress.stage = res.data.stage ?? '';
				progress.done = res.data.done ?? 0;
				progress.total = res.data.total ?? 0;
				progress.error = '';
				progress.recordId = res.data.recordId ?? null;
				record.value = { id: res.data.recordId };
				startPolling(String(res.data.recordId ?? ''));
			}
		})
		.catch(() => {});
});

onUnmounted(() => stopPolling());

// 执行抽取：后端异步启动（立即返回运行中记录），前端轮询进度至完成后刷新记录
const handleRun = async () => {
	if (!queryText.value.trim()) {
		useMessage().warning(t('expertExtract.queryRequired'));
		return;
	}
	running.value = true;
	try {
		const res: any = await runExtraction({ query: queryText.value.trim() });
		record.value = res.data ?? {};
		startPolling(String(res.data?.id ?? ''));
		useMessage().success(t('expertExtract.runStarted'));
	} catch (err: any) {
		running.value = false;
		useMessage().error(err.msg);
	}
};

const startPolling = (recordId: string) => {
	progress.recordId = recordId;
	progress.error = '';
	stopPolling();
	pollTimer = window.setInterval(pollProgress, 3000);
	pollProgress();
};

const stopPolling = () => {
	if (pollTimer) {
		window.clearInterval(pollTimer);
		pollTimer = null;
	}
};

const pollProgress = async () => {
	try {
		const res: any = await fetchRunProgress();
		const p = res.data ?? {};
		progress.stage = p.stage ?? '';
		progress.done = p.done ?? 0;
		progress.total = p.total ?? 0;
		progress.error = p.error ?? '';
		if (p.error) {
			stopPolling();
			running.value = false;
			useMessage().error(t('expertExtract.runFailed'));
			return;
		}
		if (!p.running) {
			stopPolling();
			const rid = p.recordId ?? record.value.id;
			if (rid) {
				const detail: any = await fetchExtractRecord(rid);
				applyRecord(detail.data);
			}
			running.value = false;
			useMessage().success(t('expertExtract.runSuccess'));
		}
	} catch {
		// 网络瞬断跳过本轮，等待下次轮询
	}
};

// 应用抽取记录：重置三档分页并加载当前 tab
const applyRecord = (data: any) => {
	record.value = data ?? {};
	const codes: string[] = (() => {
		try {
			return record.value.parsedDomains ? JSON.parse(record.value.parsedDomains) : [];
		} catch {
			return [];
		}
	})();
	parsedDomainNames.value = codes.map((c) => domainNameMap.value[c] ?? c).filter(Boolean);
	selectedState.current = 1;
	candidateState.current = 1;
	unmatchedState.current = 1;
	activeTab.value = 'selected';
	loadSelected();
};

// tab 切换时加载对应档位
const handleTabChange = (name: any) => {
	if (name === 'selected') loadSelected();
	else if (name === 'candidate') loadCandidate();
	else loadUnmatched();
};

const loadSelected = async () => {
	if (!record.value.id) return;
	selectedState.loading = true;
	try {
		const res: any = await fetchExtractRecordDetail(record.value.id, {
			current: selectedState.current,
			size: selectedState.size,
			grade: '1',
		});
		selectedState.records = res.data?.records ?? [];
		selectedState.total = res.data?.total ?? 0;
	} finally {
		selectedState.loading = false;
	}
};

const loadCandidate = async () => {
	if (!record.value.id) return;
	candidateState.loading = true;
	try {
		const res: any = await fetchExtractRecordDetail(record.value.id, {
			current: candidateState.current,
			size: candidateState.size,
			grade: '2',
		});
		candidateState.records = res.data?.records ?? [];
		candidateState.total = res.data?.total ?? 0;
	} finally {
		candidateState.loading = false;
	}
};

const loadUnmatched = async () => {
	if (!record.value.id) return;
	unmatchedState.loading = true;
	try {
		const res: any = await fetchUnmatchedExperts(record.value.id, {
			current: unmatchedState.current,
			size: unmatchedState.size,
		});
		unmatchedState.records = res.data?.records ?? [];
		unmatchedState.total = res.data?.total ?? 0;
	} finally {
		unmatchedState.loading = false;
	}
};

const handleSelectedSizeChange = () => {
	selectedState.current = 1;
	loadSelected();
};

const handleCandidateSizeChange = () => {
	candidateState.current = 1;
	loadCandidate();
};

const handleUnmatchedSizeChange = () => {
	unmatchedState.current = 1;
	loadUnmatched();
};

// 历史记录
const openHistory = () => {
	historyVisible.value = true;
	historyState.current = 1;
	loadHistory();
};

const handleHistorySearch = () => {
	historyState.current = 1;
	loadHistory();
};

const loadHistory = async () => {
	historyState.loading = true;
	try {
		const res: any = await fetchExtractRecords({
			current: historyState.current,
			size: historyState.size,
			keyword: historyKeyword.value || undefined,
		});
		historyState.records = res.data?.records ?? [];
		historyState.total = res.data?.total ?? 0;
	} finally {
		historyState.loading = false;
	}
};

const viewHistoryRow = (row: any) => {
	historyVisible.value = false;
	applyRecord(row);
};
</script>

<style scoped lang="scss">
// 框架默认 .layout-padding-view 为 overflow: hidden（固定视口高度）：
// 数据量大时输入区+统计+表格+分页超出视口会被直接裁剪且滚轮失效，这里放开纵向滚动兜底
.layout-padding-view {
	overflow-y: auto !important;
}
</style>
