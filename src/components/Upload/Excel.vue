<!-- excel 导入组件 -->
<template>
	<el-dialog :title="prop.title" v-model="state.upload.open" :close-on-click-modal="false" draggable>
		<div v-loading="state.upload.isUploading" :element-loading-text="$t('excel.importing')">
			<el-upload
				ref="uploadRef"
				:limit="1"
				accept=".xlsx, .xls"
				:headers="headers"
				:action="baseURL + other.adaptationUrl(url)"
				:disabled="state.upload.isUploading"
				:on-progress="handleFileUploadProgress"
				:on-success="handleFileSuccess"
				:on-error="handleFileError"
				:on-change="handleFileChange"
				:auto-upload="false"
				drag
			>
				<i class="el-icon-upload"></i>
				<div class="el-upload__text">
					{{ $t('excel.operationNotice') }}
					<em>{{ $t('excel.clickUpload') }}</em>
				</div>
				<template #tip>
					<div class="el-upload__tip text-center">
						<span>{{ $t('excel.fileFormat') }}</span>
						<el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="downExcelTemp" v-if="tempUrl"
							>{{ $t('excel.downloadTemplate') }}
						</el-link>
					</div>
				</template>
			</el-upload>
		</div>
		<template #footer>
			<el-button type="primary" :loading="state.upload.isUploading" @click="submitFileForm">{{ $t('common.confirmButtonText') }}</el-button>
			<el-button :disabled="state.upload.isUploading" @click="state.upload.open = false">{{ $t('common.cancelButtonText') }}</el-button>
		</template>
	</el-dialog>

	<!--校验失败错误数据-->
	<el-dialog :title="$t('excel.validationFailureData')" v-model="state.errorVisible">
		<el-table :data="state.errorData">
			<el-table-column property="lineNum" :label="$t('excel.lineNumbers')" width="100"></el-table-column>
			<el-table-column property="errors" :label="$t('excel.misDescription')" show-overflow-tooltip>
				<template v-slot="scope">
					<el-tag type="danger" v-for="error in scope.row.errors" :key="error">{{ error }}</el-tag>
				</template>
			</el-table-column>
		</el-table>
	</el-dialog>
</template>

<script setup lang="ts" name="upload-excel">
import { useMessage } from '/@/hooks/message';
import other from '/@/utils/other';
import { Session } from '/@/utils/storage';

const emit = defineEmits(['sizeChange', 'refreshDataList']);
const prop = defineProps({
	url: {
		type: String,
	},
	title: {
		type: String,
	},
	tempUrl: {
		type: String,
	},
});

const uploadRef = ref();

const state = reactive({
	errorVisible: false,
	errorData: [],
	dialog: {
		title: '',
		isShowDialog: false,
	},
	upload: {
		open: false,
		isUploading: false,
		hasFile: false,
	},
});

/**
 * 下载模板文件
 */
const downExcelTemp = () => {
	other.downBlobFile(other.adaptationUrl(prop.tempUrl), {}, 'temp.xlsx');
};

/**
 * 上传进度条变化事件
 */
const handleFileUploadProgress = () => {
	state.upload.isUploading = true;
};

/**
 * 文件选择变化：跟踪是否已选文件，避免空提交把 loading 卡住
 */
const handleFileChange = (_file: any, fileList: any[]) => {
	state.upload.hasFile = fileList.length > 0;
};

/**
 * 上传失败事件处理
 */
const handleFileError = () => {
	state.upload.isUploading = false;
	useMessage().error('上传失败,数据格式不合法!');
	state.upload.open = false;
};

/**
 * 上传成功事件处理
 * @param {any} response - 上传成功的响应结果
 */
const handleFileSuccess = (response: any) => {
	state.upload.isUploading = false;
	state.upload.hasFile = false;
	state.upload.open = false;
	uploadRef.value.clearFiles();

	// 校验失败
	if (response.code === 1) {
		useMessage().error('导入失败，以下数据不合法');
		state.errorVisible = true;
		state.errorData = response.data;
		uploadRef.value.clearFiles();
		// 刷新表格
		emit?.('refreshDataList');
	} else {
		// 后端成功返回导入条数时展示具体数量
		const count = typeof response.data === 'number' ? response.data : null;
		useMessage().success(count != null ? `导入成功，共 ${count} 条` : response.msg ? response.msg : '导入成功');
		// 刷新表格
		emit?.('refreshDataList');
	}
};

/**
 * 提交表单，触发上传
 */
const submitFileForm = () => {
	// 导入进行中防重复点击
	if (state.upload.isUploading) {
		return;
	}
	if (!state.upload.hasFile) {
		useMessage().warning('请先选择要导入的文件');
		return;
	}
	// 立即进入加载态：导入接口处理较慢，on-progress 在等待响应期间不足以提供反馈
	state.upload.isUploading = true;
	uploadRef.value.submit();
};

/**
 * 显示上传文件对话框，并清除上传信息
 */
const show = () => {
	state.upload.isUploading = false;
	state.upload.hasFile = false;
	state.upload.open = true;
};

/**
 * 计算请求头部信息
 */
const headers = computed(() => {
	return {
		Authorization: 'Bearer ' + Session.getToken(),
		'TENANT-ID': Session.getTenant(),
	};
});

// 暴露变量
defineExpose({
	show,
});
</script>

<style scoped></style>
