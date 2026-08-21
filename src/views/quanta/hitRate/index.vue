<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<div class="mb8" style="display: flex; align-items: center">
				<el-select v-model="days" style="width: 140px" @change="loadSummary">
					<el-option label="近 15 个信号日" :value="15" />
					<el-option label="近 30 个信号日" :value="30" />
					<el-option label="近 60 个信号日" :value="60" />
					<el-option label="近 90 个信号日" :value="90" />
				</el-select>
				<el-button icon="Refresh" type="warning" class="ml10" :loading="refreshing" @click="onRefresh">
					{{ $t('hitRate.refreshBtn') }}
				</el-button>
				<right-toolbar class="ml10 mr20" style="float: right" @queryTable="loadAll"></right-toolbar>
			</div>

			<template v-if="summary">
				<!-- 整体统计卡片 -->
				<el-row :gutter="12" class="mb12">
					<el-col :span="3" v-for="card in overallCards" :key="card.label">
						<el-card shadow="never">
							<div style="font-size: 12px; color: #909399">{{ card.label }}</div>
							<div :style="{ fontSize: '18px', fontWeight: 'bold', color: card.color || '#303133' }">{{ card.value }}</div>
						</el-card>
					</el-col>
				</el-row>

				<el-row :gutter="12">
					<!-- LLM vs 规则 A/B -->
					<el-col :span="12">
						<h4 class="mb8">{{ $t('hitRate.byDecisionMode') }}</h4>
						<el-table :data="summary.byDecisionMode" border size="small">
							<el-table-column prop="key" :label="$t('hitRate.mode')" width="130">
								<template #default="scope">
									<el-tag :type="scope.row.key === 'agent' ? 'primary' : 'info'">
										{{ scope.row.key === 'agent' ? 'LLM' : $t('hitRate.rulesMode') }}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column prop="n" :label="$t('hitRate.samples')" width="70" align="right" />
							<el-table-column prop="hitRate3d" :label="$t('hitRate.hitRate3d')" width="90" align="right">
								<template #default="scope">{{ pct(scope.row.hitRate3d) }}</template>
							</el-table-column>
							<el-table-column prop="avgFwd3d" :label="$t('hitRate.avgFwd3d')" align="right">
								<template #default="scope">
									<span :style="retStyle(scope.row.avgFwd3d)">{{ pct(scope.row.avgFwd3d) }}</span>
								</template>
							</el-table-column>
						</el-table>
					</el-col>

					<!-- 按模板 -->
					<el-col :span="12">
						<h4 class="mb8">{{ $t('hitRate.byPattern') }}</h4>
						<el-table :data="summary.byPattern" border size="small">
							<el-table-column prop="key" :label="$t('hitRate.pattern')" width="130">
								<template #default="scope">{{ patternLabel(scope.row.key) }}</template>
							</el-table-column>
							<el-table-column prop="n" :label="$t('hitRate.samples')" width="70" align="right" />
							<el-table-column prop="hitRate3d" :label="$t('hitRate.hitRate3d')" width="90" align="right">
								<template #default="scope">{{ pct(scope.row.hitRate3d) }}</template>
							</el-table-column>
							<el-table-column prop="avgFwd3d" :label="$t('hitRate.avgFwd3d')" align="right">
								<template #default="scope">
									<span :style="retStyle(scope.row.avgFwd3d)">{{ pct(scope.row.avgFwd3d) }}</span>
								</template>
							</el-table-column>
						</el-table>
					</el-col>
				</el-row>

				<!-- 按分数区间 -->
				<h4 class="mb8 mt12">{{ $t('hitRate.byScoreBucket') }}</h4>
				<el-table :data="summary.byScoreBucket" border size="small" class="mb12">
					<el-table-column prop="key" :label="$t('hitRate.scoreBucket')" width="130" />
					<el-table-column prop="n" :label="$t('hitRate.samples')" width="80" align="right" />
					<el-table-column prop="hitRate1d" :label="$t('hitRate.hitRate1d')" width="100" align="right">
						<template #default="scope">{{ pct(scope.row.hitRate1d) }}</template>
					</el-table-column>
					<el-table-column prop="hitRate3d" :label="$t('hitRate.hitRate3d')" width="100" align="right">
						<template #default="scope">{{ pct(scope.row.hitRate3d) }}</template>
					</el-table-column>
					<el-table-column prop="hitRate5d" :label="$t('hitRate.hitRate5d')" width="100" align="right">
						<template #default="scope">{{ pct(scope.row.hitRate5d) }}</template>
					</el-table-column>
					<el-table-column prop="avgFwd3d" :label="$t('hitRate.avgFwd3d')" width="110" align="right">
						<template #default="scope">
							<span :style="retStyle(scope.row.avgFwd3d)">{{ pct(scope.row.avgFwd3d) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="avgFwd5d" :label="$t('hitRate.avgFwd5d')" align="right">
						<template #default="scope">
							<span :style="retStyle(scope.row.avgFwd5d)">{{ pct(scope.row.avgFwd5d) }}</span>
						</template>
					</el-table-column>
				</el-table>

				<!-- 信号日明细 -->
				<h4 class="mb8">{{ $t('hitRate.dailyDetail') }}</h4>
				<el-date-picker
					v-model="dailyDate"
					type="date"
					:value-format="YYYYMMDD"
					:placeholder="$t('hitRate.selectDate')"
					style="width: 160px; margin-bottom: 8px"
					@change="loadDaily"
				/>
				<el-table :data="dailyRecords" v-loading="dailyLoading" border size="small">
					<el-table-column prop="tradeDate" :label="$t('hitRate.tradeDate')" width="100" align="center" />
					<el-table-column prop="tsCode" :label="$t('hitRate.tsCode')" width="110" />
					<el-table-column prop="name" :label="$t('hitRate.name')" width="90" show-overflow-tooltip />
					<el-table-column prop="pattern" :label="$t('hitRate.pattern')" width="110">
						<template #default="scope">{{ patternLabel(scope.row.pattern) }}</template>
					</el-table-column>
					<el-table-column prop="screenScore" :label="$t('hitRate.screenScore')" width="80" align="right" />
					<el-table-column prop="decisionMode" :label="$t('hitRate.mode')" width="80" align="center">
						<template #default="scope">
							<el-tag :type="scope.row.decisionMode === 'agent' ? 'primary' : 'info'" size="small">
								{{ scope.row.decisionMode === 'agent' ? 'LLM' : $t('hitRate.rulesMode') }}
							</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="entryPrice" :label="$t('hitRate.entryPrice')" width="90" align="right">
						<template #default="scope">
							<span v-if="scope.row.entryPrice">{{ scope.row.entryPrice }}</span>
							<el-tag v-else size="small" type="info">{{ skipLabel(scope.row.entrySkipped) }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="fwd1d" :label="$t('hitRate.fwd1d')" width="90" align="right">
						<template #default="scope">
							<span :style="retStyle(scope.row.fwd1d)">{{ pct(scope.row.fwd1d) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="fwd3d" :label="$t('hitRate.fwd3d')" width="90" align="right">
						<template #default="scope">
							<span :style="retStyle(scope.row.fwd3d)">{{ pct(scope.row.fwd3d) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="fwd5d" :label="$t('hitRate.fwd5d')" width="90" align="right">
						<template #default="scope">
							<span :style="retStyle(scope.row.fwd5d)">{{ pct(scope.row.fwd5d) }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="bestRet" :label="$t('hitRate.bestRet')" align="right">
						<template #default="scope">
							<span :style="retStyle(scope.row.bestRet)">{{ pct(scope.row.bestRet) }}</span>
						</template>
					</el-table-column>
				</el-table>
			</template>
			<el-empty v-else :description="$t('hitRate.noData')" />
		</div>
	</div>
</template>

<script setup lang="ts" name="hitRate">
import { fetchDaily, fetchSummary, refreshHits } from '/@/api/quanta/stockCandidateHit';
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const days = ref(30);
const refreshing = ref(false);
const summary = ref<any>(null);
const dailyDate = ref('');
const dailyLoading = ref(false);
const dailyRecords = ref<any[]>([]);

const PATTERN_LABELS: Record<string, string> = {
	breakout: '突破启动',
	pullback: '强势回踩',
	trend_accel: '趋势加速',
	oversold: '超跌反转',
	none: '-',
};

const overallCards = computed(() => {
	const s = summary.value || {};
	const o = s.overall || {};
	return [
		{ label: t('hitRate.signalDates'), value: s.signalDates ?? '-' },
		{ label: t('hitRate.totalCandidates'), value: s.totalCandidates ?? 0 },
		{ label: t('hitRate.evaluated'), value: s.evaluated ?? 0 },
		{ label: t('hitRate.skipped'), value: s.skipped ?? 0 },
		{ label: t('hitRate.hitRate3d'), value: pct(o.hitRate3d), color: '#409eff' },
		{ label: t('hitRate.avgFwd3d'), value: pct(o.avgFwd3d), color: (o.avgFwd3d || 0) >= 0 ? '#f56c6c' : '#67c23a' },
		{ label: t('hitRate.hitRate5d'), value: pct(o.hitRate5d) },
		{ label: t('hitRate.avgFwd5d'), value: pct(o.avgFwd5d) },
	];
});

const loadSummary = async () => {
	try {
		const res: any = await fetchSummary(days.value);
		summary.value = res.data;
	} catch (err: any) {
		useMessage().error(err.msg || 'load fail');
	}
};

const loadDaily = async () => {
	if (!dailyDate.value) return;
	dailyLoading.value = true;
	try {
		const res: any = await fetchDaily(dailyDate.value);
		dailyRecords.value = res.data || [];
	} catch (err: any) {
		useMessage().error(err.msg || 'load fail');
	} finally {
		dailyLoading.value = false;
	}
};

const onRefresh = async () => {
	refreshing.value = true;
	try {
		const res: any = await refreshHits();
		useMessage().success(t('hitRate.refreshSuccess', { count: res.data ?? 0 }));
		loadAll();
	} catch (err: any) {
		useMessage().error(err.msg || t('hitRate.refreshFail'));
	} finally {
		refreshing.value = false;
	}
};

const loadAll = () => {
	loadSummary();
	if (dailyDate.value) {
		loadDaily();
	}
};

const pct = (v: number | null | undefined) => {
	if (v == null) return '-';
	return (v * 100).toFixed(2) + '%';
};
const retStyle = (v: number | null | undefined) => {
	if (v == null) return {};
	if (v > 0) return { color: '#f56c6c', fontWeight: 'bold' };
	if (v < 0) return { color: '#67c23a', fontWeight: 'bold' };
	return {};
};
const patternLabel = (pattern: string) => PATTERN_LABELS[pattern] || pattern || '-';
const skipLabel = (reason: string | null) => {
	if (reason === 'gap_up') return t('hitRate.skipGapUp');
	if (reason === 'gap_down') return t('hitRate.skipGapDown');
	if (reason === 'suspended') return t('hitRate.skipSuspended');
	return reason || '-';
};

onMounted(() => {
	loadSummary();
});
</script>
<style scoped>
.mb8 {
	margin-bottom: 8px;
}
.mb12 {
	margin-bottom: 12px;
}
.mt12 {
	margin-top: 12px;
}
</style>
