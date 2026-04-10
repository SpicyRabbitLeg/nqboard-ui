<template>
   <div class="layout-padding">
      <div class="layout-padding-auto layout-padding-view">
         <el-row v-show="showSearch">
            <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
               <el-form-item :label="$t('device.name')" prop="name" style="display: none;">
                  <el-input v-model="state.queryForm.deviceId" />
               </el-form-item>

               <el-form-item :label="$t('device.filterTime')" prop="filterTime">
                  <el-date-picker :end-placeholder="$t('syslog.inputEndPlaceholderTip')"
                     :start-placeholder="$t('syslog.inputStartPlaceholderTip')" range-separator="To"
                     type="datetimerange" v-model="state.queryForm.filterTime" value-format="YYYY-MM-DD HH:mm:ss" />
               </el-form-item>

               <el-form-item>
                  <el-button icon="Search" type="primary" @click="getDataList">
                     {{ $t('common.queryBtn') }}
                  </el-button>
                  <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
               </el-form-item>
            </el-form>
         </el-row>

         <el-table :data="state.dataList" v-loading="state.loading" :cell-style="tableStyle.cellStyle"
            :header-cell-style="tableStyle.headerCellStyle" @sort-change="sortChangeHandle" border>
            <el-table-column v-for="(item, index) in tableFields" :key="index" :prop="item.field" :label="item.label" show-overflow-tooltip>
               <template #default="{ row }">
                  {{ row[item.field] }} {{ item!.unit }}
               </template>
            </el-table-column>
         </el-table>
         <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
      </div>
   </div>
</template>

<script setup lang="ts" name="deviceSource">
import { BasicTableProps, useTable } from "/@/hooks/table";
import { getPointDetailByDeviceId } from "/@/api/device/point";
import { getIotDynamicDevicePage } from "/@/api/device/device";
import { useI18n } from 'vue-i18n';

// 使用国际化插件
const { t } = useI18n();

// 表格
const tableFields = ref([{ field: 'ts', label: '时间', unit:''}]);

// 搜索变量
const queryRef = ref();
const route = useRoute();
const showSearch = ref(true);

// 多选变量
const selectObjs = ref([]) as any;

const state: BasicTableProps = reactive<BasicTableProps>({
   queryForm: {
      deviceId: route.query?.id,
      filterTime: ''
   },
   descs: ['ts'],
   pageList: getIotDynamicDevicePage,
    pagination: {
        size: 20,
        pageSizes: [20, 40, 60, 100],
    },
});

//  table hook
const {
   getDataList,
   currentChangeHandle,
   sizeChangeHandle,
   sortChangeHandle,
   tableStyle
} = useTable(state);


// 清空搜索条件
const resetQuery = () => {
   // 清空搜索条件
   queryRef.value?.resetFields()
   // 清空多选
   selectObjs.value = []
   getDataList()
}


/**
 *  初始化table列表
 */
const initTableColumn = async () => {
   try {
      const { data } = await getPointDetailByDeviceId({ deviceId: route.query!.id });
      tableFields.value.push(
         ...data.map((item: any) => {
            const model = item.model;
            return {
               field: model.identifier,
               label: model.name,
               unit: model.unit
            };
         })
      );
   } catch (error) {
      console.error('获取选项数据失败:', error);
   }
}

// 在页面加载前调用接口
onMounted(() => {
   initTableColumn();
});
</script>