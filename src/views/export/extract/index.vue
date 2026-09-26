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

			<!-- 三档统计 -->
			<el-row v-if="record.id" :gutter="8" class="mb8">
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

			<!-- 三档结果 -->
			<el-tabs v-if="record.id" v-model="activeTab" @tab-change="handleTabChange">
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
});

// 执行抽取
const handleRun = async () => {
	if (!queryText.value.trim()) {
		useMessage().warning(t('expertExtract.queryRequired'));
		return;
	}
	running.value = true;
	try {
		const res: any = await runExtraction({ query: queryText.value.trim() });
		applyRecord(res.data);
		useMessage().success(t('expertExtract.runSuccess'));
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		running.value = false;
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
