<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('stockCandidate.tradeDate')" prop="tradeDate">
						<el-input v-model="state.queryForm.tradeDate" :placeholder="$t('stockCandidate.inputTradeDateTip')" clearable style="width: 150px" />
					</el-form-item>
					<el-form-item :label="$t('stockCandidate.status')" prop="status">
						<el-select v-model="state.queryForm.status" :placeholder="$t('stockCandidate.inputStatusTip')" clearable style="width: 130px">
							<el-option :label="$t('stockCandidate.statusActive')" value="ACTIVE" />
							<el-option :label="$t('stockCandidate.statusExpired')" value="EXPIRED" />
						</el-select>
					</el-form-item>
					<el-form-item :label="$t('stockCandidate.action')" prop="action">
						<el-select v-model="state.queryForm.action" :placeholder="$t('stockCandidate.inputActionTip')" clearable style="width: 130px">
							<el-option :label="$t('stockCandidate.actionEntryOk')" value="entry_ok" />
							<el-option :label="$t('stockCandidate.actionWatch')" value="watch" />
							<el-option :label="$t('stockCandidate.actionAvoid')" value="avoid" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button icon="Search" type="primary" @click="getDataList">{{ $t('common.queryBtn') }}</el-button>
						<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
					</el-form-item>
				</el-form>
			</el-row>

			<el-row>
				<div class="mb8" style="width: 100%">
					<el-button icon="Refresh" type="warning" class="ml10" :loading="refreshing" @click="onRefresh">
						{{ $t('stockCandidate.refreshBtn') }}
					</el-button>
					<right-toolbar v-model:showSearch="showSearch" class="ml10 mr20" style="float: right" @queryTable="getDataList"></right-toolbar>
				</div>
			</el-row>

			<el-table :data="state.dataList" v-loading="state.loading" border>
				<el-table-column type="index" label="#" width="50" align="center" />
				<el-table-column prop="tradeDate" :label="t('stockCandidate.tradeDate')" width="100" align="center" />
				<el-table-column prop="tsCode" :label="t('stockCandidate.tsCode')" width="110" show-overflow-tooltip />
				<el-table-column prop="name" :label="t('stockCandidate.name')" width="90" show-overflow-tooltip />
				<el-table-column prop="pattern" :label="t('stockCandidate.pattern')" width="110" align="center">
					<template #default="scope">
						<el-tag :type="patternTagType(scope.row.pattern)">{{ patternLabel(scope.row.pattern) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="screenScore" :label="t('stockCandidate.screenScore')" width="90" align="center" sortable>
					<template #default="scope">
						<span style="font-weight: bold">{{ scope.row.screenScore ?? '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="llmScore" :label="t('stockCandidate.llmScore')" width="90" align="center">
					<template #default="scope">
						<span :style="llmScoreStyle(scope.row.llmScore)">{{ scope.row.llmScore ?? '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="confidence" :label="t('stockCandidate.confidence')" width="90" align="center">
					<template #default="scope">
						<el-progress :percentage="scope.row.confidence || 0" :stroke-width="14" :text-inside="true" />
					</template>
				</el-table-column>
				<el-table-column prop="reasons" :label="t('stockCandidate.reasons')" min-width="200">
					<template #default="scope">
						<el-tag v-for="r in parseReasons(scope.row.reasons)" :key="r" size="small" type="success" effect="plain" class="mr4 mb2">{{ r }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="decisionMode" :label="t('stockCandidate.decisionMode')" width="110" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.decisionMode === 'agent'" type="primary">LLM</el-tag>
						<el-tag v-else type="info">{{ t('stockCandidate.rulesMode') }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="status" :label="t('stockCandidate.status')" width="90" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.status === 'ACTIVE'" type="success">{{ t('stockCandidate.statusActive') }}</el-tag>
						<el-tag v-else type="info">{{ scope.row.status }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column :label="t('common.action')" width="180" fixed="right">
					<template #default="scope">
						<el-button
							v-if="scope.row.action === 'entry_ok' && scope.row.status === 'ACTIVE'"
							text
							type="primary"
							icon="ShoppingCart"
							@click="onBuy(scope.row)"
						>
							{{ t('stockCandidate.buyBtn') }}
						</el-button>
						<el-button text type="primary" icon="View" @click="openDetail(scope.row)">{{ t('stockCandidate.detailBtn') }}</el-button>
					</template>
				</el-table-column>
			</el-table>

			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
		</div>

		<!-- 候选详情抽屉 -->
		<el-drawer v-model="detailVisible" :title="t('stockCandidate.detailTitle')" size="46%">
			<template v-if="detail">
				<el-descriptions :column="2" border size="small" class="mb12">
					<el-descriptions-item :label="t('stockCandidate.tsCode')">{{ detail.tsCode }}</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.name')">{{ detail.name }}</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.action')">
						<el-tag :type="actionTagType(detail.action)">{{ actionLabel(detail.action) }}</el-tag>
					</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.confidence')">{{ detail.confidence }}</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.marketRet5d')">
						{{ ((detail.marketRet5d || 0) * 100).toFixed(2) }}%
					</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.expireDate')">{{ detail.expireDate }}</el-descriptions-item>
				</el-descriptions>

				<h4 class="mb8">{{ t('stockCandidate.agentSummary') }}</h4>
				<el-empty v-if="!agentSummary.length" :description="t('stockCandidate.noAgentData')" :image-size="60" />
				<el-card v-for="agent in agentSummary" :key="agent.key" shadow="never" class="mb8">
					<div style="display: flex; align-items: center; gap: 8px">
						<el-tag>{{ agent.key }}</el-tag>
						<el-tag :type="signalTagType(agent.signal)" size="small">{{ agent.signal }}</el-tag>
						<span style="color: #909399">conf: {{ agent.confidence ?? '-' }}</span>
					</div>
					<div style="margin-top: 6px; color: #606266; font-size: 13px">{{ agent.reasoning || '-' }}</div>
				</el-card>

				<h4 class="mb8 mt12">{{ t('stockCandidate.exitPlan') }}</h4>
				<el-descriptions v-if="exitPlan" :column="3" border size="small">
					<el-descriptions-item :label="t('stockCandidate.maxHoldDays')">{{ exitPlan.maxHoldDays }}</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.stopLoss')">{{ ((exitPlan.stopLossPct || 0) * 100).toFixed(0) }}%</el-descriptions-item>
					<el-descriptions-item :label="t('stockCandidate.takeProfit')">{{ ((exitPlan.takeProfitPct || 0) * 100).toFixed(0) }}%</el-descriptions-item>
				</el-descriptions>
				<div v-if="exitPlan" style="color: #909399; font-size: 12px; margin-top: 6px">{{ exitPlan.rules }}</div>
			</template>
		</el-drawer>
	</div>
</template>

<script setup lang="ts" name="stockCandidate">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, refreshCandidates } from '/@/api/quanta/stockCandidate';
import { buyPosition } from '/@/api/quanta/stockSimPosition';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const queryRef = ref();
const showSearch = ref(true);
const refreshing = ref(false);
const detailVisible = ref(false);
const detail = ref<any>(null);

const PATTERN_LABELS: Record<string, string> = {
	breakout: '突破启动',
	pullback: '强势回踩',
	trend_accel: '趋势加速',
	oversold: '超跌反转',
	none: '-',
};

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		tradeDate: '',
		status: 'ACTIVE',
		action: '',
	},
	pageList: fetchList,
	descs: ['screen_score'],
});

const { getDataList, currentChangeHandle, sizeChangeHandle, tableStyle } = useTable(state);

const resetQuery = () => {
	queryRef.value?.resetFields();
	state.queryForm.status = 'ACTIVE';
	getDataList();
};

// 手动刷新候选池
const onRefresh = async () => {
	refreshing.value = true;
	try {
		const res: any = await refreshCandidates();
		useMessage().success(t('stockCandidate.refreshSuccess', { count: res.data ?? 0 }));
		getDataList();
	} catch (err: any) {
		useMessage().error(err.msg || t('common.refreshBtn'));
	} finally {
		refreshing.value = false;
	}
};

// 模拟买入（计划委托，次日开盘成交）
const onBuy = async (row: any) => {
	try {
		await useMessageBox().confirm(t('stockCandidate.buyConfirm', { tsCode: row.tsCode }));
	} catch {
		return;
	}
	try {
		await buyPosition(row.id);
		useMessage().success(t('stockCandidate.buySuccess'));
	} catch (err: any) {
		useMessage().error(err.msg || t('stockCandidate.buyFail'));
	}
};

// 详情
const openDetail = (row: any) => {
	detail.value = row;
	detailVisible.value = true;
};

const agentSummary = computed(() => {
	if (!detail.value?.agentSummary) return [];
	try {
		return JSON.parse(detail.value.agentSummary) || [];
	} catch {
		return [];
	}
});

const exitPlan = computed(() => {
	if (!detail.value?.exitPlan) return null;
	try {
		return JSON.parse(detail.value.exitPlan);
	} catch {
		return null;
	}
});

const parseReasons = (reasons: string): string[] => {
	if (!reasons) return [];
	try {
		return JSON.parse(reasons) || [];
	} catch {
		return [];
	}
};

const patternLabel = (pattern: string) => PATTERN_LABELS[pattern] || pattern || '-';
const patternTagType = (pattern: string) => {
	if (pattern === 'breakout') return 'danger';
	if (pattern === 'pullback') return 'warning';
	if (pattern === 'trend_accel') return 'primary';
	return 'info';
};
const actionLabel = (action: string) => {
	if (action === 'entry_ok') return t('stockCandidate.actionEntryOk');
	if (action === 'avoid') return t('stockCandidate.actionAvoid');
	return t('stockCandidate.actionWatch');
};
const actionTagType = (action: string) => {
	if (action === 'entry_ok') return 'success';
	if (action === 'avoid') return 'danger';
	return 'warning';
};
const signalTagType = (signal: string) => {
	if (signal === 'bullish') return 'success';
	if (signal === 'bearish') return 'danger';
	return 'info';
};
const llmScoreStyle = (score: number | null) => {
	if (score == null) return {};
	if (score > 0) return { color: '#f56c6c', fontWeight: 'bold' };
	if (score < 0) return { color: '#67c23a', fontWeight: 'bold' };
	return {};
};
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
.mt12 {
	margin-top: 12px;
}
</style>
