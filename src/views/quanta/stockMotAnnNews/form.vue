<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible" :close-on-click-modal="false" draggable width="720px">
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" label-width="100px" v-loading="loading">
			<el-form-item :label="$t('stockMotAnnNews.tsCode')" prop="tsCode">
				<el-input :placeholder="$t('stockMotAnnNews.inputTsCodeTip')" v-model="form.tsCode" />
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.pubDate')" prop="pubDate">
				<el-input :placeholder="$t('stockMotAnnNews.inputPubDateTip')" v-model="form.pubDate" />
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.pubDatetime')" prop="pubDatetime">
				<el-input v-model="form.pubDatetime" :placeholder="$t('stockMotAnnNews.inputPubDatetimeTip')" />
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.newsType')" prop="newsType">
				<el-select v-model="form.newsType" :placeholder="$t('stockMotAnnNews.inputNewsTypeTip')" clearable>
					<el-option :label="$t('stockMotAnnNews.annType')" value="ann" />
					<el-option :label="$t('stockMotAnnNews.mediaType')" value="media" />
				</el-select>
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.src')" prop="src">
				<el-input :placeholder="$t('stockMotAnnNews.inputSrcTip')" v-model="form.src" />
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.title')" prop="title">
				<el-input
					:placeholder="$t('stockMotAnnNews.inputTitleTip')"
					type="textarea"
					show-word-limit
					maxlength="2000"
					:autosize="{ minRows: 2, maxRows: 4 }"
					v-model="form.title"
				/>
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.summary')" prop="summary">
				<el-input
					:placeholder="$t('stockMotAnnNews.inputSummaryTip')"
					type="textarea"
					show-word-limit
					maxlength="500"
					:autosize="{ minRows: 2, maxRows: 5 }"
					v-model="form.summary"
				/>
			</el-form-item>

			<el-form-item :label="$t('stockMotAnnNews.url')" prop="url">
				<el-input :placeholder="$t('stockMotAnnNews.inputUrlTip')" v-model="form.url" />
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

<script setup lang="ts" name="stockMotAnnNewsDialog">
import { useMessage } from '/@/hooks/message';
import { getObj, addObj, putObj } from '/@/api/quanta/stockMotAnnNews';
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
	pubDate: '',
	pubDatetime: '',
	newsType: '',
	src: '',
	title: '',
	summary: '',
	url: '',
});

// 定义校验规则
const dataRules = ref({
	tsCode: [{ required: true, message: '股票代码不能为空', trigger: 'blur' }],
	pubDate: [{ required: true, message: '发布日期不能为空', trigger: 'blur' }],
	newsType: [{ required: true, message: '类型不能为空', trigger: 'change' }],
	title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
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
		getNewsData(id);
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
const getNewsData = (id: string) => {
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
