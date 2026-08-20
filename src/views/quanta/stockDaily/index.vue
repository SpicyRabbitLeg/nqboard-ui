<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<!-- 工具栏：股票下拉 + 前后翻页 -->
			<div class="mb8" style="display: flex; align-items: center; flex-wrap: wrap">
				<el-select
					v-model="tsCode"
					filterable
					remote
					clearable
					:remote-method="searchStocks"
					:loading="loadingOptions"
					:placeholder="$t('stockDaily.selectStockTip')"
					popper-class="stock-options-popper"
					style="width: 280px"
					@change="onStockChange"
					@visible-change="onOptionsVisibleChange"
				>
					<el-option v-for="s in stockOptions" :key="s.tsCode" :label="`${s.tsCode} ${s.name}`" :value="s.tsCode" />
					<template #empty>
						<el-empty :description="$t('stockDaily.optionEmpty')" :image-size="60" />
					</template>
					<el-option v-if="loadingOptions" :label="$t('stockDaily.optionLoading')" value="__loading__" disabled />
					<el-option v-else-if="!optionFinished && stockOptions.length" :label="$t('stockDaily.optionLoadMore')" value="__loadmore__" disabled />
					<el-option v-else-if="optionFinished && stockOptions.length" :label="$t('stockDaily.optionNoMore')" value="__nomore__" disabled />
				</el-select>

				<el-button-group v-if="allData.length" class="ml10">
					<el-button :disabled="pageIndex >= maxPage - 1" @click="turnPage(1)">{{ $t('stockDaily.prevBtn') }} ◀</el-button>
					<el-button disabled>{{ pageText }}</el-button>
					<el-button :disabled="pageIndex === 0" @click="turnPage(-1)">▶ {{ $t('stockDaily.nextBtn') }}</el-button>
				</el-button-group>
			</div>

			<!-- K线图 -->
			<div ref="chartRef" v-show="allData.length" style="width: 100%; height: 560px" />
			<el-empty
				v-if="!allData.length"
				:description="tsCode ? $t('stockDaily.noDataTip') : $t('stockDaily.emptyTip')"
			/>
		</div>
	</div>
</template>

<script setup lang="ts" name="stockdaily">
import * as echarts from 'echarts';
import { useI18n } from 'vue-i18n';
import { fetchOptions } from '/@/api/quanta/stockBasic';
import { fetchKline } from '/@/api/quanta/stockDaily';
import { useMessage } from '/@/hooks/message';

interface StockOption {
	tsCode: string;
	name: string;
}

interface KlineItem {
	tradeDate: string;
	open: number;
	high: number;
	low: number;
	close: number;
	preClose: number;
	vol: number;
	amount: number;
	pctChg: number;
}

const { t } = useI18n();

// 每屏K线根数
const PAGE_SIZE = 120;

// 下拉选项每页条数
const OPTION_PAGE_SIZE = 50;

// 选股下拉（remote 搜索 + 滚动分页加载）
const tsCode = ref('');
const stockOptions = ref<StockOption[]>([]);
const loadingOptions = ref(false);
const optionKeyword = ref('');
const optionPage = ref(1);
const optionTotal = ref(0);
const optionFinished = ref(false);
// 请求序号：丢弃过期响应，避免快速输入时旧结果覆盖新结果
let optionReqSeq = 0;
// 下拉滚动容器（展开时挂载滚动监听）
let optionsWrapEl: HTMLElement | null = null;
// 是否已自动选中默认股票（仅进入页面时生效一次）
let autoSelected = false;

// 全量日线（正序），一次拉取后本地切片翻页
const allData = ref<KlineItem[]>([]);
// 0 = 最新一屏
const pageIndex = ref(0);

// 图表实例
const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

const maxPage = computed(() => Math.max(1, Math.ceil(allData.value.length / PAGE_SIZE)));

const pageText = computed(() => {
	if (!allData.value.length) return '';
	const start = allData.value.length - (pageIndex.value + 1) * PAGE_SIZE + 1;
	const end = allData.value.length - pageIndex.value * PAGE_SIZE;
	return t('stockDaily.pageText', { start: Math.max(1, start), end, total: allData.value.length });
});

// 当前窗口切片
const windowData = computed(() => {
	const end = allData.value.length - pageIndex.value * PAGE_SIZE;
	const start = Math.max(0, end - PAGE_SIZE);
	return allData.value.slice(start, end);
});

/**
 * 构建K线图配置：蜡烛图 + MA5/10/20 + 成交量副图 + 缩放 + 十字光标
 * 均线基于全量数据计算再切片，翻页后窗口首部均线依然完整
 */
const buildOption = () => {
	const all = allData.value;
	const end = all.length - pageIndex.value * PAGE_SIZE;
	const start = Math.max(0, end - PAGE_SIZE);
	const data = all.slice(start, end);
	const dates = data.map((d) => d.tradeDate);
	// candlestick 数据顺序：[open, close, lowest, highest]
	const values = data.map((d) => [d.open, d.close, d.low, d.high]);
	const volumes = data.map((d) => d.vol);

	const calcMa = (n: number) => {
		const result: (number | null)[] = [];
		for (let i = 0; i < data.length; i++) {
			const idx = start + i;
			if (idx < n - 1) {
				result.push(null);
				continue;
			}
			let sum = 0;
			for (let j = idx - n + 1; j <= idx; j++) {
				sum += all[j].close;
			}
			result.push(+(sum / n).toFixed(2));
		}
		return result;
	};

	return {
		animation: false,
		legend: { data: ['K线', 'MA5', 'MA10', 'MA20'], top: 0, textStyle: { fontSize: 12 } },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'cross' },
			formatter: (params: any) => {
				const d = data[params[0].dataIndex];
				if (!d) return '';
				const up = d.close >= d.open;
				const color = up ? '#ef232a' : '#14b143';
				return [
					`<div style="font-weight: bold">${d.tradeDate}</div>`,
					`${t('stockDaily.open')}：<span style="color:${color}">${d.open}</span>`,
					`${t('stockDaily.high')}：${d.high}`,
					`${t('stockDaily.low')}：${d.low}`,
					`${t('stockDaily.close')}：<span style="color:${color}">${d.close}</span>`,
					`${t('stockDaily.pctChg')}：${d.pctChg ?? '-'}%`,
					`${t('stockDaily.vol')}：${d.vol ?? '-'}`,
					`${t('stockDaily.amount')}：${d.amount ?? '-'}`,
				].join('<br/>');
			},
		},
		axisPointer: { link: [{ xAxisIndex: 'all' }] },
		grid: [
			{ left: 64, right: 20, top: 30, height: '52%' },
			{ left: 64, right: 20, top: '70%', height: '18%' },
		],
		xAxis: [
			{
				type: 'category',
				data: dates,
				boundaryGap: true,
				axisLine: { onZero: false },
				axisLabel: { fontSize: 11 },
			},
			{ type: 'category', gridIndex: 1, data: dates, axisLabel: { show: false }, axisTick: { show: false } },
		],
		yAxis: [
			{ scale: true, splitArea: { show: true } },
			{ gridIndex: 1, name: t('stockDaily.vol'), splitLine: { show: false }, axisLabel: { fontSize: 11 } },
		],
		dataZoom: [
			{ type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
			{ type: 'slider', xAxisIndex: [0, 1], top: '91%', height: 18 },
		],
		series: [
			{
				name: 'K线',
				type: 'candlestick',
				data: values,
				itemStyle: { color: '#ef232a', color0: '#14b143', borderColor: '#ef232a', borderColor0: '#14b143' },
			},
			{ name: 'MA5', type: 'line', data: calcMa(5), smooth: true, showSymbol: false, lineStyle: { width: 1 } },
			{ name: 'MA10', type: 'line', data: calcMa(10), smooth: true, showSymbol: false, lineStyle: { width: 1 } },
			{ name: 'MA20', type: 'line', data: calcMa(20), smooth: true, showSymbol: false, lineStyle: { width: 1 } },
			{
				name: t('stockDaily.vol'),
				type: 'bar',
				xAxisIndex: 1,
				yAxisIndex: 1,
				data: volumes,
				itemStyle: {
					color: (p: any) => (data[p.dataIndex].close >= data[p.dataIndex].open ? '#ef232a' : '#14b143'),
				},
			},
		],
	};
};

const renderChart = () => {
	if (!chartRef.value) return;
	// 懒初始化：容器可见后再创建实例，避免隐藏容器（0×0）导致画布尺寸错误、图表不铺满
	if (!chart) {
		chart = markRaw(echarts.init(chartRef.value));
		window.addEventListener('resize', onResize);
	}
	if (!windowData.value.length) {
		chart.clear();
		return;
	}
	chart.setOption(buildOption(), true);
	chart.resize();
};

// 下拉选项：分页拉取，reset=true 重置为第一页，否则追加下一页
const loadOptions = (reset = false) => {
	if (!reset && (loadingOptions.value || optionFinished.value)) return;
	const seq = ++optionReqSeq;
	loadingOptions.value = true;
	fetchOptions({ keyword: optionKeyword.value, current: reset ? 1 : optionPage.value, size: OPTION_PAGE_SIZE })
		.then((res: any) => {
			// 丢弃过期响应（期间关键字已变化）
			if (seq !== optionReqSeq) return;
			const pageData = res.data || {};
			const list = pageData.records || [];
			stockOptions.value = reset ? list : [...stockOptions.value, ...list];
			optionTotal.value = pageData.total || 0;
			optionFinished.value = stockOptions.value.length >= optionTotal.value;
			optionPage.value = (reset ? 1 : optionPage.value) + 1;
			// 进入页面首次加载下拉数据后，自动选中第一只股票（ts_code 升序首条）
			if (!autoSelected && !tsCode.value && !optionKeyword.value && stockOptions.value.length) {
				autoSelected = true;
				tsCode.value = stockOptions.value[0].tsCode;
				onStockChange(tsCode.value);
			}
		})
		.catch((err: any) => {
			useMessage().error(err.msg);
		})
		.finally(() => {
			if (seq === optionReqSeq) loadingOptions.value = false;
		});
};

// 下拉输入关键字：重置到第一页重新搜索
const searchStocks = (keyword: string) => {
	optionKeyword.value = keyword || '';
	loadOptions(true);
};

// 下拉展开时挂载滚动监听，收起时卸载；滚动到底部自动加载下一页
const onOptionsVisibleChange = (visible: boolean) => {
	nextTick(() => {
		optionsWrapEl = document.querySelector<HTMLElement>('.stock-options-popper .el-select-dropdown__wrap');
		if (!optionsWrapEl) return;
		if (visible) {
			optionsWrapEl.addEventListener('scroll', onOptionsScroll);
		} else {
			optionsWrapEl.removeEventListener('scroll', onOptionsScroll);
		}
	});
};

const onOptionsScroll = (e: Event) => {
	const el = e.target as HTMLElement;
	if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
		loadOptions(false);
	}
};

// 选股：拉取该股票全量日线，默认展示最新一屏
const onStockChange = (code: string) => {
	if (!code) {
		allData.value = [];
		pageIndex.value = 0;
		return;
	}
	fetchKline({ tsCode: code, limit: 2000 })
		.then((res: any) => {
			allData.value = (res.data || []).filter(
				(d: KlineItem) => d.open != null && d.close != null && d.high != null && d.low != null,
			);
			pageIndex.value = 0;
		})
		.catch((err: any) => {
			useMessage().error(err.msg);
		});
};

// 翻页：1 = 往更早历史翻，-1 = 回到较新
const turnPage = (delta: number) => {
	const next = pageIndex.value + delta;
	if (next >= 0 && next < maxPage.value) {
		pageIndex.value = next;
	}
};

const onResize = () => {
	chart?.resize();
};

onMounted(() => {
	// 进入页面先加载下拉数据（加载完成后自动选中第一只股票并渲染K线）
	searchStocks('');
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', onResize);
	optionsWrapEl?.removeEventListener('scroll', onOptionsScroll);
	chart?.dispose();
	chart = null;
});

// 窗口数据变化（选股/翻页）后重新渲染，nextTick 确保容器已可见、尺寸就绪
watch(windowData, () => {
	nextTick(renderChart);
});
</script>
