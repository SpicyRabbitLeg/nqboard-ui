<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<!-- 数据就绪卡片 -->
			<el-alert v-if="readiness" :type="readiness.ready ? 'success' : 'warning'" :closable="false" class="mb8">
				<template #title>
					<span v-if="readiness.ready">
						{{ $t('quantPipeline.readinessOk') }}：{{ readiness.tradeDate }}，
						{{ $t('quantPipeline.coverage') }} {{ (readiness.coverage * 100).toFixed(1) }}%
						（{{ readiness.dailyCount }}/{{ readiness.basicCount }}）
					</span>
					<span v-else>
						{{ $t('quantPipeline.readinessFail') }}：{{ readiness.message || $t('quantPipeline.coverage') + ' ' + (readiness.coverage * 100).toFixed(1) + '%' }}
					</span>
				</template>
			</el-alert>

			<div class="mb8" style="display: flex; align-items: center">
				<el-button icon="VideoPlay" type="primary" :loading="running" @click="onRunPipeline">
					{{ $t('quantPipeline.runBtn') }}
				</el-button>
				<el-button icon="Refresh" @click="loadAll">{{ $t('common.refreshBtn') }}</el-button>
				<span class="ml10" style="color: #909399; font-size: 12px">{{ $t('quantPipeline.autoRefreshTip') }}</span>
			</div>

			<el-table :data="logs" v-loading="loading" border :cell-style="tableStyle.cellStyle" :header-cell-style="tableStyle.headerCellStyle">
				<el-table-column type="index" label="#" width="50" align="center" />
				<el-table-column prop="step" :label="t('quantPipeline.step')" width="160" show-overflow-tooltip />
				<el-table-column prop="stepName" :label="t('quantPipeline.stepName')" width="150" show-overflow-tooltip />
				<el-table-column prop="status" :label="t('quantPipeline.status')" width="110" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.status === 'SUCCESS'" type="success">SUCCESS</el-tag>
						<el-tag v-else-if="scope.row.status === 'FAILED'" type="danger">FAILED</el-tag>
						<el-tag v-else-if="scope.row.status === 'RUNNING'" type="warning">RUNNING</el-tag>
						<el-tag v-else type="info">{{ scope.row.status || t('quantPipeline.notRun') }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="affected" :label="t('quantPipeline.affected')" width="100" align="right" />
				<el-table-column prop="message" :label="t('quantPipeline.message')" show-overflow-tooltip min-width="180" />
				<el-table-column prop="elapsedMs" :label="t('quantPipeline.elapsed')" width="110" align="right">
					<template #default="scope">
						<span v-if="scope.row.elapsedMs != null">{{ (scope.row.elapsedMs / 1000).toFixed(1) }}s</span>
					</template>
				</el-table-column>
				<el-table-column prop="endTime" :label="t('quantPipeline.endTime')" width="170" show-overflow-tooltip />
				<el-table-column prop="exception" :label="t('quantPipeline.exception')" show-overflow-tooltip min-width="150" />
				<el-table-column :label="t('common.action')" width="110" fixed="right">
					<template #default="scope">
						<el-button text type="primary" icon="RefreshRight" @click="onRunStep(scope.row.step)">
							{{ $t('quantPipeline.rerunStep') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</div>
	</div>
</template>

<script setup lang="ts" name="quantPipeline">
import { useI18n } from 'vue-i18n';
import { fetchLogs, fetchReadiness, fetchSteps, runPipeline, runStep } from '/@/api/quanta/quantPipeline';
import { useMessage } from '/@/hooks/message';

// 表格样式（本页无 useTable，本地定义）
const tableStyle = {
	cellStyle: { padding: '4px 0' },
	headerCellStyle: { background: '#f5f7fa', color: '#606266', fontWeight: 'bold' },
};

const { t } = useI18n();

const loading = ref(false);
const running = ref(false);
const logs = ref<any[]>([]);
const readiness = ref<any>(null);
const steps = ref<any[]>([]);
let pollTimer: ReturnType<typeof setInterval> | undefined;

// 步骤定义兜底（无执行记录时也展示全部步骤行）
const loadSteps = async () => {
	try {
		const res: any = await fetchSteps();
		steps.value = res.data || [];
		mergeLogs();
	} catch (err: any) {
		useMessage().error(err.msg || t('quantPipeline.loadFail'));
	}
};

const loadLogs = async () => {
	loading.value = true;
	try {
		const res: any = await fetchLogs();
		logs.value = res.data || [];
		mergeLogs();
	} catch (err: any) {
		useMessage().error(err.msg || t('quantPipeline.loadFail'));
	} finally {
		loading.value = false;
	}
};

// 将未执行的步骤补齐为空行
const mergeLogs = () => {
	if (!steps.value.length) return;
	const existing = new Set(logs.value.map((l: any) => l.step));
	steps.value.forEach((s: any) => {
		if (!existing.has(s.step)) {
			logs.value.push({ step: s.step, stepName: s.stepName, status: null });
		}
	});
};

const loadReadiness = async () => {
	try {
		const res: any = await fetchReadiness();
		readiness.value = res.data;
	} catch {
		readiness.value = null;
	}
};

const loadAll = () => {
	loadLogs();
	loadReadiness();
};

// 触发完整流水线
const onRunPipeline = async () => {
	running.value = true;
	try {
		const res: any = await runPipeline();
		useMessage().success(t('quantPipeline.runSubmitted', { runId: res.data || '' }));
		loadAll();
	} catch (err: any) {
		useMessage().error(err.msg || t('quantPipeline.runFail'));
	} finally {
		running.value = false;
	}
};

// 单步重跑
const onRunStep = async (step: string) => {
	try {
		await runStep(step);
		useMessage().success(t('quantPipeline.stepSubmitted'));
		loadLogs();
	} catch (err: any) {
		useMessage().error(err.msg || t('quantPipeline.runFail'));
	}
};

// 存在 RUNNING 步骤时 10s 轮询
const startPoll = () => {
	stopPoll();
	pollTimer = setInterval(() => {
		if (logs.value.some((l: any) => l.status === 'RUNNING')) {
			loadLogs();
		}
	}, 10000);
};

const stopPoll = () => {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = undefined;
	}
};

onMounted(() => {
	loadSteps();
	loadAll();
	startPoll();
});

onUnmounted(() => {
	stopPoll();
});
</script>
