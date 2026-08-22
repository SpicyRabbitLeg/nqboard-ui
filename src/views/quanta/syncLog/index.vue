<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<!-- 当日各任务最新状态（点击可快速过滤该任务） -->
			<el-row class="mb8">
				<span style="font-weight: bold; margin-right: 12px">{{ $t('syncLog.todayStatus') }}</span>
				<template v-if="latest.length">
					<el-tooltip v-for="item in latest" :key="item.syncType" :content="statusTip(item)" placement="top">
						<el-tag
							:type="statusTagType(item.status)"
							class="mr10"
							style="cursor: pointer"
							@click="onFilterType(item.syncType)"
						>
							{{ typeName(item.syncType) }}
							<span v-if="item.status === 'RUNNING'">{{ $t('syncLog.running') }}</span>
							<span v-else-if="item.failCount > 0" style="margin-left: 4px">✗{{ item.failCount }}</span>
						</el-tag>
					</el-tooltip>
				</template>
				<span v-else style="color: #909399; font-size: 12px">{{ $t('syncLog.noRecord') }}</span>
			</el-row>

			<!-- 搜索区：任务类型 + 运行日期区间 -->
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('syncLog.syncType')" prop="syncType">
						<el-select v-model="state.queryForm.syncType" :placeholder="$t('syncLog.syncType')" clearable style="width: 180px">
							<el-option v-for="code in typeCodes" :key="code" :label="typeName(code)" :value="code" />
						</el-select>
					</el-form-item>
					<el-form-item :label="$t('syncLog.runDateRange')">
						<el-date-picker
							v-model="dateRange"
							type="daterange"
							value-format="YYYYMMDD"
							:start-placeholder="$t('syncLog.runDateRange')"
							:end-placeholder="$t('syncLog.runDateRange')"
							clearable
						/>
					</el-form-item>
					<el-form-item>
						<el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }}</el-button>
						<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
					</el-form-item>
				</el-form>
			</el-row>

			<el-row>
				<div class="mb8" style="width: 100%">
					<span style="color: #909399; font-size: 12px">{{ $t('syncLog.autoRefreshTip') }}</span>
					<right-toolbar v-model:showSearch="showSearch" class="ml10 mr20" style="float: right" @queryTable="loadAll"></right-toolbar>
				</div>
			</el-row>

			<!-- 同步日志明细 -->
			<el-table
				:data="state.dataList"
				v-loading="state.loading"
				border
				:cell-style="tableStyle.cellStyle"
				:header-cell-style="tableStyle.headerCellStyle"
			>
				<el-table-column type="index" label="#" width="50" align="center" />
				<el-table-column prop="runDate" :label="t('syncLog.runDate')" width="110" align="center" />
				<el-table-column prop="syncType" :label="t('syncLog.syncType')" width="150">
					<template #default="scope">{{ typeName(scope.row.syncType) }}</template>
				</el-table-column>
				<el-table-column prop="status" :label="t('syncLog.status')" width="100" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.status === 'SUCCESS'" type="success">SUCCESS</el-tag>
						<el-tag v-else-if="scope.row.status === 'FAILED'" type="danger">FAILED</el-tag>
						<el-tag v-else-if="scope.row.status === 'RUNNING'" type="warning">RUNNING</el-tag>
						<el-tag v-else type="info">{{ scope.row.status || t('syncLog.notRun') }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="totalCount" :label="t('syncLog.totalCount')" width="100" align="right" />
				<el-table-column prop="successCount" :label="t('syncLog.successCount')" width="100" align="right" />
				<el-table-column prop="failCount" :label="t('syncLog.failCount')" width="100" align="right">
					<template #default="scope">
						<span :style="scope.row.failCount > 0 ? 'color: #f56c6c; font-weight: bold' : ''">{{ scope.row.failCount }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="syncRange" :label="t('syncLog.syncRange')" width="180" show-overflow-tooltip />
				<el-table-column prop="message" :label="t('syncLog.message')" min-width="200" show-overflow-tooltip />
				<el-table-column prop="elapsedMs" :label="t('syncLog.elapsed')" width="110" align="right">
					<template #default="scope">
						<span v-if="scope.row.elapsedMs != null">{{ formatElapsed(scope.row.elapsedMs) }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="beginTime" :label="t('syncLog.beginTime')" width="170" show-overflow-tooltip />
				<el-table-column prop="exception" :label="t('syncLog.exception')" min-width="150" show-overflow-tooltip />
			</el-table>

			<!-- 分页 -->
			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
		</div>
	</div>
</template>

<script setup lang="ts" name="syncLog">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchLatest, fetchList } from '/@/api/quanta/syncLog';
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 全部任务类型编码（与后端 @QuantSyncLog(type=...) 对齐）
const typeCodes = [
	'stock_basic',
	'stock_daily',
	'adj_factor',
	'index_daily',
	'cons_weight',
	'mot_holder',
	'mot_holder_count',
	'top_list',
	'money_flow',
	'industry_daily',
	'restricted_release',
	'trade_cal',
];

// 搜索变量
const queryRef = ref();
const showSearch = ref(true);
const dateRange = ref<string[]>([]);

// 当日各任务最新状态
const latest = ref<any[]>([]);
let pollTimer: ReturnType<typeof setInterval> | undefined;

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		syncType: '',
	},
	pageList: fetchList,
});

//  table hook
const { getDataList, currentChangeHandle, sizeChangeHandle, tableStyle } = useTable(state);

// 查询前把日期区间拆为 startDate / endDate（YYYYMMDD）
watch(
	dateRange,
	(val: string[] | null) => {
		state.queryForm.startDate = val && val.length === 2 ? val[0] : '';
		state.queryForm.endDate = val && val.length === 2 ? val[1] : '';
	},
	{ immediate: true }
);

// 清空搜索条件
const resetQuery = () => {
	queryRef.value?.resetFields();
	dateRange.value = [];
	state.queryForm.startDate = '';
	state.queryForm.endDate = '';
	getDataList();
};

// 点击汇总标签快速过滤该任务
const onFilterType = (syncType: string) => {
	state.queryForm.syncType = syncType;
	getDataList();
};

// 任务类型中文名（未知编码回退显示原值）
const typeName = (code: string) => {
	const name = t(`syncLog.types.${code}`);
	return name !== `syncLog.types.${code}` ? name : code;
};

// 汇总标签状态色
const statusTagType = (status: string) => {
	if (status === 'SUCCESS') return 'success';
	if (status === 'FAILED') return 'danger';
	if (status === 'RUNNING') return 'warning';
	return 'info';
};

// 汇总标签悬浮提示：成功/失败条数 + 耗时
const statusTip = (item: any) => {
	if (item.status === 'RUNNING') return `${typeName(item.syncType)} ${t('syncLog.running')}`;
	return `${item.message || ''}${item.elapsedMs != null ? ` (${formatElapsed(item.elapsedMs)})` : ''}`;
};

// 耗时格式化：ms -> s / min
const formatElapsed = (ms: number) => {
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	return `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1000)}s`;
};

// 当日各任务最新状态
const loadLatest = async () => {
	try {
		const res: any = await fetchLatest();
		// 按固定类型顺序展示
		const byType = new Map((res.data || []).map((l: any) => [l.syncType, l]));
		latest.value = typeCodes.filter((c) => byType.has(c)).map((c) => byType.get(c));
	} catch {
		latest.value = [];
	}
};

const loadAll = () => {
	getDataList();
	loadLatest();
};

// 存在执行中任务时 10s 轮询
const startPoll = () => {
	stopPoll();
	pollTimer = setInterval(() => {
		if (latest.value.some((l) => l.status === 'RUNNING')) {
			loadLatest();
			getDataList(false);
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
	loadAll();
	startPoll();
});

onUnmounted(() => {
	stopPoll();
});
</script>
