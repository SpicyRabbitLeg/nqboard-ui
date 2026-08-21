<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('stockSimPosition.status')" prop="status">
						<el-select v-model="state.queryForm.status" :placeholder="$t('stockSimPosition.inputStatusTip')" clearable style="width: 150px">
							<el-option :label="$t('stockSimPosition.statusPendingBuy')" value="PENDING_BUY" />
							<el-option :label="$t('stockSimPosition.statusHolding')" value="HOLDING" />
							<el-option :label="$t('stockSimPosition.statusPendingSell')" value="PENDING_SELL" />
							<el-option :label="$t('stockSimPosition.statusExited')" value="EXITED" />
							<el-option :label="$t('stockSimPosition.statusCancelled')" value="CANCELLED" />
						</el-select>
					</el-form-item>
					<el-form-item :label="$t('stockSimPosition.tsCode')" prop="tsCode">
						<el-input v-model="state.queryForm.tsCode" :placeholder="$t('stockSimPosition.inputTsCodeTip')" clearable style="width: 150px" />
					</el-form-item>
					<el-form-item>
						<el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }}</el-button>
						<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
					</el-form-item>
				</el-form>
			</el-row>

			<el-row>
				<div class="mb8" style="width: 100%; display: flex; align-items: center">
					<el-button icon="Aim" type="warning" class="ml10" :loading="tracking" @click="onTrack">
						{{ $t('stockSimPosition.trackBtn') }}
					</el-button>
					<el-tag v-if="overview" class="ml10" effect="plain">
						{{ $t('stockSimPosition.activePositions') }}: {{ overview.activePositions }}
					</el-tag>
					<el-tag v-if="overview" class="ml10" :type="(overview.realizedPnl || 0) >= 0 ? 'danger' : 'success'" effect="plain">
						{{ $t('stockSimPosition.realizedPnl') }}: {{ (overview.realizedPnl || 0).toFixed(2) }}
					</el-tag>
					<right-toolbar v-model:showSearch="showSearch" class="ml10 mr20" style="float: right" @queryTable="loadAll"></right-toolbar>
				</div>
			</el-row>

			<el-table :data="state.dataList" v-loading="state.loading" border>
				<el-table-column type="index" label="#" width="50" align="center" />
				<el-table-column prop="tsCode" :label="t('stockSimPosition.tsCode')" width="110" show-overflow-tooltip />
				<el-table-column prop="buyDate" :label="t('stockSimPosition.buyDate')" width="100" align="center" />
				<el-table-column prop="buyPrice" :label="t('stockSimPosition.buyPrice')" width="90" align="right" />
				<el-table-column prop="qty" :label="t('stockSimPosition.qty')" width="80" align="right" />
				<el-table-column prop="stopPrice" :label="t('stockSimPosition.stopPrice')" width="90" align="right">
					<template #default="scope"><span style="color: #67c23a">{{ scope.row.stopPrice ?? '-' }}</span></template>
				</el-table-column>
				<el-table-column prop="targetPrice" :label="t('stockSimPosition.targetPrice')" width="90" align="right">
					<template #default="scope"><span style="color: #f56c6c">{{ scope.row.targetPrice ?? '-' }}</span></template>
				</el-table-column>
				<el-table-column prop="status" :label="t('stockSimPosition.status')" width="110" align="center">
					<template #default="scope">
						<el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="heldDays" :label="t('stockSimPosition.heldDays')" width="90" align="center">
					<template #default="scope">
						<span v-if="scope.row.heldDays != null">{{ scope.row.heldDays }}/{{ scope.row.maxHoldDays }}</span>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="pnl" :label="t('stockSimPosition.pnl')" width="110" align="right">
					<template #default="scope">
						<span v-if="scope.row.pnl != null" :style="pnlStyle(scope.row.pnl)">{{ scope.row.pnl.toFixed(2) }}</span>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="ret" :label="t('stockSimPosition.ret')" width="90" align="right">
					<template #default="scope">
						<span v-if="scope.row.ret != null" :style="pnlStyle(scope.row.ret)">{{ (scope.row.ret * 100).toFixed(2) }}%</span>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="exitReason" :label="t('stockSimPosition.exitReason')" width="120" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.exitReason" :type="exitReasonTagType(scope.row.exitReason)" size="small">
							{{ exitReasonLabel(scope.row.exitReason) }}
						</el-tag>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="exitDate" :label="t('stockSimPosition.exitDate')" width="100" align="center" />
				<el-table-column :label="t('common.action')" width="130" fixed="right">
					<template #default="scope">
						<el-button text type="primary" icon="DataLine" @click="openDaily(scope.row)">
							{{ t('stockSimPosition.dailyBtn') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
		</div>

		<!-- 逐日盯市抽屉 -->
		<el-drawer v-model="dailyVisible" :title="t('stockSimPosition.dailyTitle') + ' - ' + (currentRow?.tsCode || '')" size="56%">
			<el-table :data="dailyRecords" v-loading="dailyLoading" border size="small">
				<el-table-column prop="tradeDate" :label="t('stockSimPosition.dailyDate')" width="100" align="center" />
				<el-table-column prop="close" :label="t('stockSimPosition.dailyClose')" width="90" align="right" />
				<el-table-column prop="dayPnl" :label="t('stockSimPosition.dailyDayPnl')" width="100" align="right">
					<template #default="scope">
						<span :style="pnlStyle(scope.row.dayPnl)">{{ scope.row.dayPnl?.toFixed(2) ?? '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="cumPnl" :label="t('stockSimPosition.dailyCumPnl')" width="100" align="right">
					<template #default="scope">
						<span :style="pnlStyle(scope.row.cumPnl)">{{ scope.row.cumPnl?.toFixed(2) ?? '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="cumRet" :label="t('stockSimPosition.dailyCumRet')" width="90" align="right">
					<template #default="scope">
						<span v-if="scope.row.cumRet != null" :style="pnlStyle(scope.row.cumRet)">{{ (scope.row.cumRet * 100).toFixed(2) }}%</span>
					</template>
				</el-table-column>
				<el-table-column prop="action" :label="t('stockSimPosition.dailyAction')" width="110" align="center">
					<template #default="scope">
						<el-tag :type="dailyActionTagType(scope.row.action)">{{ dailyActionLabel(scope.row.action) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="actionReason" :label="t('stockSimPosition.dailyReason')" min-width="200" show-overflow-tooltip />
			</el-table>
		</el-drawer>
	</div>
</template>

<script setup lang="ts" name="stockSimPosition">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchDaily, fetchList, fetchOverview, trackPositions } from '/@/api/quanta/stockSimPosition';
import { useMessage } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const queryRef = ref();
const showSearch = ref(true);
const tracking = ref(false);
const overview = ref<any>(null);
const dailyVisible = ref(false);
const dailyLoading = ref(false);
const dailyRecords = ref<any[]>([]);
const currentRow = ref<any>(null);

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		status: '',
		tsCode: '',
	},
	pageList: fetchList,
	descs: ['buy_date'],
});

const { getDataList, currentChangeHandle, sizeChangeHandle } = useTable(state);

const loadOverview = async () => {
	try {
		const res: any = await fetchOverview();
		overview.value = res.data;
	} catch {
		overview.value = null;
	}
};

const loadAll = () => {
	getDataList();
	loadOverview();
};

const resetQuery = () => {
	queryRef.value?.resetFields();
	getDataList();
};

// 手动触发持仓跟踪
const onTrack = async () => {
	tracking.value = true;
	try {
		const res: any = await trackPositions();
		useMessage().success(t('stockSimPosition.trackSuccess', { count: res.data ?? 0 }));
		loadAll();
	} catch (err: any) {
		useMessage().error(err.msg || t('stockSimPosition.trackFail'));
	} finally {
		tracking.value = false;
	}
};

// 逐日盯市记录
const openDaily = async (row: any) => {
	currentRow.value = row;
	dailyVisible.value = true;
	dailyLoading.value = true;
	try {
		const res: any = await fetchDaily(row.id);
		dailyRecords.value = res.data || [];
	} catch (err: any) {
		useMessage().error(err.msg || 'load fail');
		dailyRecords.value = [];
	} finally {
		dailyLoading.value = false;
	}
};

const statusLabel = (status: string) => {
	const map: Record<string, string> = {
		PENDING_BUY: t('stockSimPosition.statusPendingBuy'),
		HOLDING: t('stockSimPosition.statusHolding'),
		PENDING_SELL: t('stockSimPosition.statusPendingSell'),
		EXITED: t('stockSimPosition.statusExited'),
		CANCELLED: t('stockSimPosition.statusCancelled'),
	};
	return map[status] || status;
};
const statusTagType = (status: string) => {
	if (status === 'HOLDING') return 'success';
	if (status === 'PENDING_BUY' || status === 'PENDING_SELL') return 'warning';
	if (status === 'CANCELLED') return 'info';
	return 'primary';
};
const EXIT_LABELS: Record<string, string> = {
	stop_loss: '止损',
	breakeven_stop: '保本止损',
	take_profit: '止盈',
	weak_exit: '弱势离场',
	time_exit: '时间止损',
	gap_stop: '开盘急杀',
	gap_up: '跳高放弃',
	gap_down: '跳低放弃',
	qty_zero: '资金不足',
	open_at_end: '期末平仓',
};
const exitReasonLabel = (reason: string) => EXIT_LABELS[reason] || reason;
const exitReasonTagType = (reason: string) => {
	if (reason === 'take_profit') return 'danger';
	if (reason === 'gap_up' || reason === 'gap_down' || reason === 'qty_zero') return 'info';
	return 'success';
};
const pnlStyle = (v: number | null | undefined) => {
	if (v == null) return {};
	// A股习惯：红涨绿跌
	if (v > 0) return { color: '#f56c6c', fontWeight: 'bold' };
	if (v < 0) return { color: '#67c23a', fontWeight: 'bold' };
	return {};
};
const dailyActionLabel = (action: string) => {
	if (action === 'SELL') return t('stockSimPosition.actionSell');
	if (action === 'PENDING_SELL') return t('stockSimPosition.actionPendingSell');
	return t('stockSimPosition.actionHold');
};
const dailyActionTagType = (action: string) => {
	if (action === 'SELL') return 'danger';
	if (action === 'PENDING_SELL') return 'warning';
	return 'success';
};

onMounted(() => {
	loadAll();
});
</script>
