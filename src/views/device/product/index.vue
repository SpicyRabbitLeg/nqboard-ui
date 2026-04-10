<template>
	<div class="layout-padding">
		<div class="layout-padding-auto layout-padding-view">
			<el-row v-show="showSearch">
				<el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
					<el-form-item :label="$t('product.name')" prop="name">
						<el-input v-model="state.queryForm.name" :placeholder="$t('product.inputNameTip')" clearable />
					</el-form-item>

					<el-form-item :label="$t('product.categoryId')" prop="categoryId">
						<el-select v-model="state.queryForm.categoryId" :placeholder="$t('product.inputCategoryIdTip')">
							<el-option v-for="(item, index) in categoryInfo" :key="index" :label="item.label"
								:value="item.value"></el-option>
						</el-select>
					</el-form-item>

					<el-form-item>
						<el-button v-loading.fullscreen.lock="state.loading" icon="Search" type="primary"
							@click="getDataList">
							{{ $t('common.queryBtn') }}
						</el-button>
						<el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
					</el-form-item>
				</el-form>
			</el-row>

			<el-row>
				<div class="mb8" style="width: 100%">
					<el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()"
						v-auth="'device_product_add'">
						{{ $t('common.addBtn') }}
					</el-button>

					<right-toolbar v-model:showSearch="showSearch" :export="'device_iotCategory_export'"
						@exportExcel="exportExcel" class="ml10 mr20" style="float: right"
						@queryTable="getDataList"></right-toolbar>
				</div>
			</el-row>

			<!-- 卡片列表 -->
			<el-row :gutter="24" class="card-container">
				<el-col :span="6" class="card-item" v-for="(item, index) in state.dataList" :key="index">
					<el-card shadow="hover">
						<div slot="header" class="card-header">
							<el-avatar shape="square" :size="50"
								:src="item.img.includes('http') ? item.img : baseURL.replace(/^\/api/, '') + item.img" />
							<div class="card-name">
								<span>{{ item.name }}</span>
							</div>
						</div>

						<div>
							<p>{{ $t('product.subcategory') }}：{{ item.iotCategory?.name }}</p>
							<p>
								{{ $t('product.authSwitch') }}：
								<span v-if="item.authSwitch" style="color: green">{{ $t('product.open') }}</span>
								<span v-else style="color: gray">{{ $t('product.close') }}</span>
							</p>
							<p>{{ $t('product.protocol') }}：{{ item.protocol }}</p>
						</div>

						<div class="card-footer">
							<el-button type="primary" text @click="toProductEdit(item.id)"
								style="flex: 1; text-align: center">{{ $t('product.viewDetail') }}</el-button>
							<el-button type="primary" text @click="toDeviceList(item.id)"
								style="flex: 1; text-align: center">{{ $t('product.viewDevice') }}</el-button>
						</div>
					</el-card>
				</el-col>
			</el-row>

			<!-- 分页列表 -->
			<pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle"
				v-bind="state.pagination" />
		</div>

		<!-- 编辑、新增  -->
		<FormDialog :list="categoryInfo" ref="formDialogRef" @refresh="getDataList(false)" />
	</div>
</template>

<script setup lang="ts" name="product">
import { BasicTableProps, useTable } from '/@/hooks/table';
import { fetchList, delObjs } from '/@/api/device/product';
import { useMessage, useMessageBox } from '/@/hooks/message';
import { getDetails } from '/@/api/device/category';
import { useI18n } from 'vue-i18n';
import '/@/theme/product.scss';

// 使用国际化插件
const { t } = useI18n();

// 引入组件
const FormDialog = defineAsyncComponent(() => import('./form.vue'));

// 定义变量内容
const formDialogRef = ref();
// 搜索变量
const queryRef = ref();
const showSearch = ref(true);

// 多选变量
const selectObjs = ref([]) as any;

// 产品分类
const categoryInfo = ref();

// 路由
const router = useRouter();

const state: BasicTableProps = reactive<BasicTableProps>({
	queryForm: {
		name: '', // 产品名称
		categoryId: '', // 产品分类
	},
	pageList: fetchList,
	pagination: {
		size: 12,
		pageSizes: [12, 24, 36, 60],
	},
});

//  table hook
const { getDataList, currentChangeHandle, sizeChangeHandle, sortChangeHandle, downBlobFile, tableStyle } = useTable(state);

// 清空搜索条件
const resetQuery = () => {
	// 清空搜索条件
	queryRef.value?.resetFields();
	// 清空多选
	selectObjs.value = [];
	getDataList();
};

// 导出excel
const exportExcel = () => {
	downBlobFile('/device/product/export', Object.assign(state.queryForm, { ids: selectObjs }), 'product.xlsx');
};

// 删除操作
const handleDelete = async (ids: string[]) => {
	try {
		await useMessageBox().confirm(t('common.delConfirmText'));
	} catch {
		return;
	}

	try {
		await delObjs(ids);
		getDataList();
		useMessage().success(t('common.delSuccessText'));
	} catch (err: any) {
		useMessage().error(err.msg);
	}
};

/**
 * 获取产品分类列表并且存储成select结构
 */
const getCategoryInfo = async () => {
	try {
		const { data } = await getDetails();
		categoryInfo.value = data.map((item: any) => {
			return { label: item.name, value: item.id };
		});
	} catch (error) {
		console.error('获取选项数据失败:', error);
	}
};


// 跳转编辑页
const toProductEdit = (id: string) => {
	router.push({
		path: '/device/product/edit',
		query: {
			id: id,
		},
	});
};

// 跳转设备列表
const toDeviceList = (id: string) => {
	router.push({
		path: '/device/device/index',
		query: {
			id: id
		}
	})
}

// 在页面加载前调用接口
onMounted(() => {
	getCategoryInfo();
});
</script>
