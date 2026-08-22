export default {
	syncLog: {
		// 搜索区
		syncType: '任务类型',
		runDateRange: '运行日期',
		allTypes: '全部',
		// 汇总区
		todayStatus: '当日同步状态',
		noRecord: '当日暂无执行记录',
		// 表格列
		runDate: '运行日期',
		syncName: '任务名称',
		status: '状态',
		running: '执行中',
		notRun: '未执行',
		totalCount: '处理总数',
		successCount: '成功条数',
		failCount: '失败条数',
		syncRange: '同步区间',
		message: '说明',
		elapsed: '耗时',
		beginTime: '开始时间',
		endTime: '结束时间',
		exception: '异常信息',
		autoRefreshTip: '存在执行中任务时每 10 秒自动刷新',
		loadFail: '加载失败',
		// 任务类型名称
		types: {
			stock_basic: '股票基础信息',
			stock_daily: '股票日线',
			adj_factor: '复权因子回补',
			index_daily: '指数日线',
			cons_weight: '指数成分股权重',
			mot_holder: '股东增减持',
			mot_holder_count: '股东户数',
			top_list: '龙虎榜',
			money_flow: '主力资金流',
			industry_daily: '行业板块日线',
			restricted_release: '限售解禁',
			trade_cal: '交易日历',
		},
	},
};
