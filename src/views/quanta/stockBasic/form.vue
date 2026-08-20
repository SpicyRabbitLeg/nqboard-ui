<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible" :close-on-click-modal="false" draggable width="680px">
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" label-width="120px" v-loading="loading">
			<el-form-item :label="$t('stockBasic.tsCode')" prop="tsCode">
				<el-input :placeholder="$t('stockBasic.inputTsCodeTip')" v-model="form.tsCode" disabled />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.symbol')" prop="symbol">
				<el-input :placeholder="$t('stockBasic.inputSymbolTip')" v-model="form.symbol" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.name')" prop="name">
				<el-input :placeholder="$t('stockBasic.inputNameTip')" v-model="form.name" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.area')" prop="area">
				<el-input :placeholder="$t('stockBasic.inputAreaTip')" v-model="form.area" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.industry')" prop="industry">
				<el-input :placeholder="$t('stockBasic.inputIndustryTip')" v-model="form.industry" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.cnspell')" prop="cnspell">
				<el-input :placeholder="$t('stockBasic.inputCnspellTip')" v-model="form.cnspell" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.market')" prop="market">
				<el-select v-model="form.market" :placeholder="$t('stockBasic.inputMarketTip')" clearable>
					<el-option :label="$t('stockBasic.mainBoard')" value="主板" />
					<el-option :label="$t('stockBasic.chinext')" value="创业板" />
					<el-option :label="$t('stockBasic.starBoard')" value="科创板" />
				</el-select>
			</el-form-item>

			<el-form-item :label="$t('stockBasic.listDate')" prop="listDate">
				<el-input :placeholder="$t('stockBasic.inputListDateTip')" v-model="form.listDate" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.actName')" prop="actName">
				<el-input :placeholder="$t('stockBasic.inputActNameTip')" v-model="form.actName" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.actEntType')" prop="actEntType">
				<el-input :placeholder="$t('stockBasic.inputActEntTypeTip')" v-model="form.actEntType" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.orderNum')" prop="orderNum">
				<el-input-number :min="0" v-model="form.orderNum" controls-position="right" />
			</el-form-item>

			<el-form-item :label="$t('stockBasic.remark')" prop="remark">
				<el-input
					:placeholder="$t('stockBasic.inputRemarkTip')"
					type="textarea"
					show-word-limit
					maxlength="500"
					:autosize="{ minRows: 2, maxRows: 4 }"
					v-model="form.remark"
				/>
			</el-form-item>
		</el-form>

		<template #footer>
			<span class="dialog-footer">
				<el-button @click="visible = false">{{ $t('common.cancelButtonText') }}</el-button>
				<el-button type="primary" @click="onSubmit" :disabled="loading">{{ $t('common.confirmButtonText') }}</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script setup lang="ts" name="stockbasicDialog">
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj } from '/@/api/quanta/stockBasic';
import { useI18n } from 'vue-i18n';

// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);

// 提交表单数据
const form = reactive({
	id: '',
	tsCode: '',
	symbol: '',
	name: '',
	area: '',
	industry: '',
	cnspell: '',
	market: '',
	listDate: '',
	actName: '',
	actEntType: '',
	orderNum: 0,
	remark: '',
});

// 定义校验规则
const dataRules = ref({
	tsCode: [{ required: true, message: '股票代码不能为空', trigger: 'blur' }],
	name: [{ required: true, message: '股票名称不能为空', trigger: 'blur' }],
});

// 打开弹窗
const openDialog = (id: string) => {
	visible.value = true;
	form.id = '';
	// 重置表单数据
	nextTick(() => {
		dataFormRef.value?.resetFields();
	});

	// 获取信息
	if (id) {
		form.id = id;
		getStockBasicData(id);
	}
};

// 提交
const onSubmit = async () => {
	const valid = await dataFormRef.value.validate().catch(() => {});
	if (!valid) return false;

	try {
		loading.value = true;
		form.id ? await putObj(form) : await addObj(form);
		useMessage().success(form.id ? t('common.editSuccessText') : t('common.addSuccessText'));
		visible.value = false;
		emit('refresh');
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		loading.value = false;
	}
};

// 初始化表单数据
const getStockBasicData = (id: string) => {
	loading.value = true;
	getObj({ id: id })
		.then((res: any) => {
			Object.assign(form, res.data[0]);
		})
		.finally(() => {
			loading.value = false;
		});
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
