<template>
	<el-dialog :title="form.id ? $t('common.editBtn') : $t('common.addBtn')" v-model="visible" width="640" :close-on-click-modal="false" draggable>
		<el-form ref="dataFormRef" :model="form" :rules="dataRules" label-width="110px" v-loading="loading">
			<el-form-item :label="$t('extractDomain.domainCode')" prop="domainCode">
				<el-input :placeholder="$t('extractDomain.inputDomainCodeTip')" v-model="form.domainCode" maxlength="32" />
			</el-form-item>
			<el-form-item :label="$t('extractDomain.domainName')" prop="domainName">
				<el-input :placeholder="$t('extractDomain.inputDomainNameTip')" v-model="form.domainName" maxlength="100" />
			</el-form-item>
			<el-form-item :label="$t('extractDomain.description')" prop="description">
				<el-input
					:placeholder="$t('extractDomain.inputDescriptionTip')"
					type="textarea"
					show-word-limit
					maxlength="500"
					:autosize="{ minRows: 2, maxRows: 4 }"
					v-model="form.description"
				/>
			</el-form-item>
			<el-form-item :label="$t('extractDomain.keywords')" prop="keywords">
				<el-input :placeholder="$t('extractDomain.inputKeywordsTip')" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" v-model="form.keywords" />
			</el-form-item>
			<el-form-item :label="$t('extractDomain.adjacentCodes')" prop="adjacentList">
				<el-select v-model="form.adjacentList" class="w100" multiple filterable :placeholder="$t('extractDomain.inputAdjacentTip')">
					<el-option v-for="item in domainOptions" :key="item.domainCode" :label="item.domainName" :value="item.domainCode" />
				</el-select>
			</el-form-item>
			<el-form-item :label="$t('extractDomain.status')" prop="status">
				<el-radio-group v-model="form.status">
					<el-radio value="0">{{ $t('extractDomain.enable') }}</el-radio>
					<el-radio value="1">{{ $t('extractDomain.disable') }}</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item :label="$t('extractDomain.seq')" prop="seq">
				<el-input-number :min="1" v-model="form.seq" controls-position="right" />
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

<script setup lang="ts" name="extractDomainDialog">
import { useMessage } from '/@/hooks/message';
import { fetchDomainList, addDomain, updateDomain } from '/@/api/export/extract';
import { useI18n } from 'vue-i18n';

// 使用国际化插件
const { t } = useI18n();

const emit = defineEmits(['refresh']);

// 定义变量内容
const dataFormRef = ref();
const visible = ref(false);
const loading = ref(false);
const domainOptions = ref<any[]>([]);

// 提交表单数据
const form = reactive({
	id: '',
	domainCode: '',
	domainName: '',
	description: '',
	keywords: '',
	adjacentList: [] as string[],
	status: '0',
	seq: 1,
});

// 定义校验规则
const dataRules = ref({
	domainCode: [{ required: true, message: '领域编码不能为空', trigger: 'blur' }],
	domainName: [{ required: true, message: '领域名称不能为空', trigger: 'blur' }],
});

// 打开弹窗
const openDialog = (row: any) => {
	visible.value = true;
	nextTick(() => {
		dataFormRef.value?.resetFields();
	});
	// 加载领域选项供邻接多选（排除自身在提交时处理）
	fetchDomainList()
		.then((res: any) => {
			domainOptions.value = (res.data ?? []).filter((d: any) => !row || d.id !== row.id);
		})
		.catch(() => {});

	if (row) {
		form.id = row.id;
		form.domainCode = row.domainCode;
		form.domainName = row.domainName;
		form.description = row.description ?? '';
		form.keywords = row.keywords ?? '';
		try {
			form.adjacentList = row.adjacentCodes ? JSON.parse(row.adjacentCodes) : [];
		} catch {
			form.adjacentList = [];
		}
		form.status = row.status ?? '0';
		form.seq = row.seq ?? 1;
	} else {
		form.id = '';
		form.domainCode = '';
		form.domainName = '';
		form.description = '';
		form.keywords = '';
		form.adjacentList = [];
		form.status = '0';
		form.seq = 1;
	}
};

// 提交
const onSubmit = async () => {
	const valid = await dataFormRef.value.validate().catch(() => {});
	if (!valid) return false;

	const payload = {
		id: form.id || undefined,
		domainCode: form.domainCode,
		domainName: form.domainName,
		description: form.description,
		keywords: form.keywords,
		adjacentCodes: JSON.stringify(form.adjacentList ?? []),
		status: form.status,
		seq: form.seq,
	};
	try {
		loading.value = true;
		form.id ? await updateDomain(payload) : await addDomain(payload);
		useMessage().success(form.id ? t('common.editSuccessText') : t('common.addSuccessText'));
		visible.value = false;
		emit('refresh');
	} catch (err: any) {
		useMessage().error(err.msg);
	} finally {
		loading.value = false;
	}
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
