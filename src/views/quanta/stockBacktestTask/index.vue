<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<div class="mb8" style="display: flex; align-items: center">
				<el-button icon="VideoPlay" type="primary" class="ml10" @click="openCreate">{{ $t('stockBacktestTask.createBtn') }}</el-button>
				<el-button icon="Refresh" @click="getDataList">{{ $t('common.refreshBtn') }}</el-button>
				<span v-if="hasRunning" class="ml10" style="color: #e6a23c; font-size: 12px">{{ $t('stockBacktestTask.runningTip') }}</span>
			</div>

			<el-table :data="state.dataList" v-loading="state.loading" border>
				<el-table-column prop="id" label="ID" width="180" show-overflow-tooltip />
				<el-table-column :label="t('stockBacktestTask.paramsCol')" min-width="240" show-overflow-tooltip>
					<template #default="scope">
						<el-tag v-for="(v, k) in parseParams(scope.row.params)" :key="k" size="small" effect="plain" class="mr4 mb2">{{ k }}: {{ v }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="status" :label="t('stockBacktestTask.status')" width="100" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.status === 'DONE'" type="success">DONE</el-tag>
						<el-tag v-else-if="scope.row.status === 'FAILED'" type="danger">FAILED</el-tag>
						<el-tag v-else-if="scope.row.status === 'RUNNING'" type="warning">RUNNING</el-tag>
						<el-tag v-else type="info">PENDING</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="progress" :label="t('stockBacktestTask.progress')" width="180">
					<template #default="scope">
						<el-progress :percentage="scope.row.progress || 0" :status="scope.row.status === 'FAILED' ? 'exception' : undefined" />
					</template>
				</el-table-column>
				<el-table-column prop="errorMsg" :label="t('stockBacktestTask.errorMsg')" min-width="160" show-overflow-tooltip />
				<el-table-column prop="createTime" :label="t('stockBacktestTask.createTime')" width="170" />
				<el-table-column :label="t('common.action')" width="180" fixed="right">
					<template #default="scope">
						<el-button v-if="scope.row.status === 'DONE'" text type="primary" icon="DataAnalysis" @click="openResult(scope.row)">
							{{ t('stockBacktestTask.resultBtn') }}
						</el-button>
						<el-button text type="primary" icon="RefreshRight" @click="onRerun(scope.row)">{{ t('stockBacktestTask.rerunBtn') }}</el-button>
					</template>
				</el-table-column>
			</el-table>

			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
		</div>

		<!-- 创建回测任务 -->
		<el-dialog :title="$t('stockBacktestTask.createTitle')" v-model="createVisible" width="520px" :close-on-click-modal="false" draggable>
			<el-form :model="form" label-width="140px">
				<el-form-item :label="$t('stockBacktestTask.universe')">
					<el-select v-model="form.universe" style="width: 220px">
						<el-option label="沪深300+中证500" value="hs300_csi500" />
						<el-option label="沪深300" value="hs300" />
						<el-option label="中证500" value="csi500" />
						<el-option label="全A" value="all" />
					</el-select>
				</el-form-item>
				<el-form-item :label="$t('stockBacktestTask.days')">
					<el-input-number v-model="form.days" :min="20" :max="500" />
				</el-form-item>
				<el-form-item :label="$t('stockBacktestTask.minScore')">
					<el-input-number v-model="form.minScore" :min="0" :max="100" />
				</el-form-item>
				<el-form-item :label="$t('stockBacktestTask.topN')">
					<el-input-number v-model="form.topN" :min="1" :max="10" />
				</el-form-item>
				<el-form-item :label="$t('stockBacktestTask.capital')">
					<el-input-number v-model="form.capital" :min="10000" :step="10000" />
				</el-form-item>
				<el-form-item :label="$t('stockBacktestTask.maxPositions')">
					<el-input-number v-model="form.maxPositions" :min="1" :max="10" />
				</el-form-item>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="createVisible = false">{{ $t('common.cancelButtonText') }}</el-button>
					<el-button type="primary" :loading="creating" @click="onCreate">{{ $t('common.confirmButtonText') }}</el-button>
				</span>
			</template>
		</el-dialog>

		<!-- 回测结果 -->
		<el-dialog v-model="resultVisible" :title="$t('stockBacktestTask.resultTitle')" width="86%" top="5vh" draggable>
			<template v-if="stats">
				<!-- 统计卡片 -->
				<el-row :gutter="12" class="mb12">
					<el-col :span="3" v-for="card in statCards" :key="card.label">
						<el-card shadow="never">
							<div style="font-size: 12px; color: #909399">{{ card.label }}</div>
							<div :style="{ fontSize: '18px', fontWeight: 'bold', color: card.color || '#303133' }">{{ card.value }}</div>
						</el-card>
					</el-col>
				</el-row>

				<el-tabs>
					<el-tab-pane :label="t('stockBacktestTask.equityTab')">
						<div ref="chartRef" style="width: 100%; height: 320px" />
					</el-tab-pane>
					<el-tab-pane :label="t('stockBacktestTask.exitTab')">
						<el-table :data="exitRows" border size="small">
							<el-table-column prop="reason" :label="t('stockBacktestTask.exitReason')" width="140">
								<template #default="scope">{{ exitLabel(scope.row.reason) }}</template>
							</el-table-column>
							<el-table-column prop="count" :label="t('stockBacktestTask.tradeCount')" width="90" align="right" />
							<el-table-column prop="avgRet" :label="t('stockBacktestTask.avgRet')" width="110" align="right">
								<template #default="scope">{{ (scope.row.avgRet * 100).toFixed(2) }}%</template>
							</el-table-column>
							<el-table-column prop="pnl" :label="t('stockBacktestTask.pnl')" align="right">
								<template #default="scope">{{ scope.row.pnl?.toFixed(2) }}</template>
							</el-table-column>
						</el-table>
					</el-tab-pane>
					<el-tab-pane :label="t('stockBacktestTask.calibrationTab')">
						<el-alert :title="t('stockBacktestTask.calibrationTip')" type="info" :closable="false" class="mb8" />
						<el-table :data="calibrationRows" border size="small">
							<el-table-column prop="bucket" :label="t('stockBacktestTask.scoreBucket')" width="120" />
							<el-table-column prop="n" :label="t('stockBacktestTask.samples')" width="100" align="right" />
							<el-table-column prop="winRate" :label="t('stockBacktestTask.winRate')" width="110" align="right">
								<template #default="scope">{{ (scope.row.winRate * 100).toFixed(1) }}%</template>
							</el-table-column>
							<el-table-column prop="avgRet" :label="t('stockBacktestTask.avgRet')" align="right">
								<template #default="scope">{{ (scope.row.avgRet * 100).toFixed(2) }}%</template>
							</el-table-column>
						</el-table>
					</el-tab-pane>
					<el-tab-pane :label="t('stockBacktestTask.tradesTab')">
						<el-table :data="trades" v-loading="tradesLoading" border size="small" max-height="420">
							<el-table-column prop="entryDate" :label="t('stockBacktestTask.entryDate')" width="100" align="center" />
							<el-table-column prop="tsCode" :label="t('stockBacktestTask.tsCode')" width="110" />
							<el-table-column prop="name" :label="t('stockBacktestTask.name')" width="90" show-overflow-tooltip />
							<el-table-column prop="pattern" :label="t('stockBacktestTask.pattern')" width="100" />
							<el-table-column prop="entryPrice" :label="t('stockBacktestTask.entryPrice')" width="90" align="right" />
							<el-table-column prop="exitDate" :label="t('stockBacktestTask.exitDate')" width="100" align="center" />
							<el-table-column prop="exitPrice" :label="t('stockBacktestTask.exitPrice')" width="90" align="right" />
							<el-table-column prop="qty" :label="t('stockBacktestTask.qty')" width="80" align="right" />
							<el-table-column prop="reason" :label="t('stockBacktestTask.exitReason')" width="110">
								<template #default="scope">{{ exitLabel(scope.row.reason) }}</template>
							</el-table-column>
							<el-table-column prop="heldDays" :label="t('stockBacktestTask.heldDays')" width="80" align="right" />
							<el-table-column prop="ret" :label="t('stockBacktestTask.ret')" width="90" align="right">
								<template #default="scope">
									<span :style="retStyle(scope.row.ret)">{{ (scope.row.ret * 100).toFixed(2) }}%</span>
								</template>
							</el-table-column>
							<el-table-column prop="signalScore" :label="t('stockBacktestTask.signalScore')" width="90" align="right" />
						</el-table>
					</el-tab-pane>
				</el-tabs>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="stockBacktestTask">
import * as echarts from 'echarts';
import { BasicTableProps, useTable } from '/@/hooks/table';
import { createTask, fetchEquityCurve, fetchList, fetchStats, fetchTrades, rerunTask } from '/@/api/quanta/stockBacktestTask';
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const createVisible = ref(false);
const creating = ref(false);
const resultVisible = ref(false);
const stats = ref<any>(null);
const trades = ref<any[]>([]);
const tradesLoading = ref(false);
const chartRef = ref();
let chart: echarts.ECharts | undefined;

const form = reactive({
	universe: 'hs300_csi500',
	days: 120,
	minScore: 65,
	topN: 3,
	capital: 100000,
	maxPositions: 4,
});

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {},
	pageList: fetchList,
	descs: ['id'],
});

const { getDataList, currentChangeHandle, sizeChangeHandle } = useTable(state);

const hasRunning = computed(() => state.dataList.some((r: any) => r.status === 'RUNNING' || r.status === 'PENDING'));

// RUNNING 任务 5s 轮询
let pollTimer: ReturnType<typeof setInterval> | undefined;
const startPoll = () => {
	stopPoll();
	pollTimer = setInterval(() => {
		if (hasRunning.value) {
			getDataList(false);
		}
	}, 5000);
};
const stopPoll = () => {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = undefined;
	}
};

const parseParams = (params: string) => {
	if (!params) return {};
	try {
		return JSON.parse(params);
	} catch {
		return {};
	}
};

const openCreate = () => {
	createVisible.value = true;
};

const onCreate = async () => {
	creating.value = true;
	try {
		await createTask({ ...form });
		useMessage().success(t('stockBacktestTask.createSuccess'));
		createVisible.value = false;
		getDataList();
	} catch (err: any) {
		useMessage().error(err.msg || t('stockBacktestTask.createFail'));
	} finally {
		creating.value = false;
	}
};

const onRerun = async (row: any) => {
	try {
		await rerunTask(row.id);
		useMessage().success(t('stockBacktestTask.rerunSubmitted'));
		getDataList();
	} catch (err: any) {
		useMessage().error(err.msg);
	}
};

// 打开结果（统计+权益曲线+成交明细）
const openResult = async (row: any) => {
	resultVisible.value = true;
	stats.value = null;
	trades.value = [];
	try {
		const [statsRes, curveRes, tradesRes]: any[] = await Promise.all([
			fetchStats(row.id),
			fetchEquityCurve(row.id),
			fetchTrades({ taskId: row.id, current: 1, size: 500 }),
		]);
		stats.value = statsRes.data;
		trades.value = tradesRes.data?.records || [];
		nextTick(() => renderChart(curveRes.data || []));
	} catch (err: any) {
		useMessage().error(err.msg || 'load fail');
	}
};

const renderChart = (curve: any[]) => {
	if (!chartRef.value) return;
	if (!chart) {
		chart = echarts.init(chartRef.value);
	}
	chart.setOption({
		tooltip: { trigger: 'axis' },
		grid: { left: 70, right: 20, top: 20, bottom: 30 },
		xAxis: { type: 'category', data: curve.map((p: any) => p.date) },
		yAxis: { type: 'value', scale: true },
		series: [
			{
				type: 'line',
				data: curve.map((p: any) => p.equity),
				showSymbol: false,
				lineStyle: { width: 2, color: '#409eff' },
				areaStyle: { opacity: 0.08 },
			},
		],
	});
};

// 统计卡片
const statCards = computed(() => {
	const s = stats.value || {};
	return [
		{ label: t('stockBacktestTask.nTrades'), value: s.nTrades ?? '-' },
		{ label: t('stockBacktestTask.winRate'), value: s.winRate != null ? (s.winRate * 100).toFixed(1) + '%' : '-', color: '#409eff' },
		{ label: t('stockBacktestTask.avgRet'), value: s.avgRet != null ? (s.avgRet * 100).toFixed(2) + '%' : '-' },
		{ label: t('stockBacktestTask.profitFactor'), value: s.profitFactor ?? '-' },
		{
			label: t('stockBacktestTask.totalReturn'),
			value: s.totalReturn != null ? (s.totalReturn * 100).toFixed(2) + '%' : '-',
			color: (s.totalReturn || 0) >= 0 ? '#f56c6c' : '#67c23a',
		},
		{ label: t('stockBacktestTask.maxDrawdown'), value: s.maxDrawdown != null ? (s.maxDrawdown * 100).toFixed(1) + '%' : '-', color: '#67c23a' },
		{ label: t('stockBacktestTask.avgHoldingDays'), value: s.avgHoldingDays ?? '-' },
		{ label: t('stockBacktestTask.nDays'), value: s.nDays ?? '-' },
	];
});

const exitRows = computed(() => {
	const breakdown = stats.value?.exitBreakdown || {};
	return Object.entries(breakdown).map(([reason, v]: any) => ({ reason, ...v }));
});

const calibrationRows = computed(() => {
	const buckets = stats.value?.calibration?.buckets || {};
	return Object.entries(buckets)
		.filter(([, v]: any) => v.n)
		.map(([bucket, v]: any) => ({ bucket, ...v }));
});

const EXIT_LABELS: Record<string, string> = {
	stop_loss: '止损',
	breakeven_stop: '保本止损',
	take_profit: '止盈',
	weak_exit: '弱势离场',
	time_exit: '时间止损',
	gap_stop: '开盘急杀',
	open_at_end: '期末平仓',
};
const exitLabel = (reason: string) => EXIT_LABELS[reason] || reason || '-';

const retStyle = (v: number) => {
	if (v == null) return {};
	if (v > 0) return { color: '#f56c6c', fontWeight: 'bold' };
	if (v < 0) return { color: '#67c23a', fontWeight: 'bold' };
	return {};
};

onMounted(() => {
	getDataList();
	startPoll();
});

onUnmounted(() => {
	stopPoll();
	chart?.dispose();
});
</script>
<style scoped>
.mr4 {
	margin-right: 4px;
}
.mb2 {
	margin-bottom: 2px;
}
.mb12 {
	margin-bottom: 12px;
}
</style>
