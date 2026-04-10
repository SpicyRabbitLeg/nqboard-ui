<template>
  <div class="layout-padding">
    <div class="layout-padding-auto layout-padding-view">

      <el-row v-show="showSearch">
        <el-form ref="queryRef" :inline="true" :model="state.queryForm" @keyup.enter="getDataList">
          <el-form-item :label="$t('alarm.device')" prop="deviceId">
            <el-input v-model="state.queryForm.deviceId" :placeholder="$t('alarm.inputDevice')" clearable />
          </el-form-item>

          <el-form-item :label="$t('alarm.status')" prop="handleStatus">
            <el-select v-model="state.queryForm.handleStatus" :placeholder="$t('alarm.selectStatus')">
              <el-option v-for="(item, index) in alarm_status" :key="index" :label="item.label"
                :value="item.value"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button v-loading.fullscreen.lock="state.loading" icon="Search" type="primary" @click="getDataList">
              {{ $t('common.queryBtn') }}
            </el-button>
            <el-button icon="Refresh" @click="resetQuery">{{ $t('common.resetBtn') }}</el-button>
          </el-form-item>
        </el-form>
      </el-row>

      <el-row>
        <div class="mb8" style="width: 100%">
          <el-button icon="folder-add" type="primary" class="ml10" @click="formDialogRef.openDialog()"
            v-auth="'device_iotAlarmRecord_add'">
            {{ t('common.addBtn') }}
          </el-button>
          <el-button plain :disabled="multiple" icon="Delete" type="primary" v-auth="'device_iotAlarmRecord_del'"
            @click="handleDelete(selectObjs)">
            {{ t('common.delBtn') }}
          </el-button>

        </div>
      </el-row>

      <el-table :data="state.dataList" v-loading="state.loading" border :cell-style="tableStyle.cellStyle"
        :header-cell-style="tableStyle.headerCellStyle" @selection-change="selectionChangHandle"
        @sort-change="sortChangeHandle">
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column type="index" label="#" width="45" />
        <el-table-column prop="deviceId" :label="$t('alarm.device')" show-overflow-tooltip />
        <el-table-column prop="message" :label="$t('alarm.remark')" show-overflow-tooltip />
        <el-table-column prop="handleStatus" :label="$t('alarm.status')" show-overflow-tooltip>
          <template #default="scope">
            <el-tag type="warning" v-if="scope.row.handleStatus == '0'">{{ t('alarm.status1') }}</el-tag>
            <el-tag type="success" v-if="scope.row.handleStatus == '1'">{{ t('alarm.status2') }}</el-tag>
            <el-tag v-if="scope.row.handleStatus == '2'">{{ t('alarm.status3') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" :label="$t('alarm.order')" show-overflow-tooltip />
        
        <!-- ====================== 表格只显示 1 张图片 ====================== -->
        <el-table-column prop="imgStr" :label="$t('alarm.img')" width="100" align="center">
          <template #default="scope">
            <div class="img-one-container" @click="openImagePreview(scope.row.id)">
              <img 
                v-if="getFirstImage(scope.row.imgStr)" 
                :src="getFirstImage(scope.row.imgStr)" 
                class="img-thumbnail" 
              />
              <span v-else class="no-img">{{ t('common.noData') }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('common.action')" width="150">
          <template #default="scope">
            <el-button icon="edit-pen" text type="primary" v-auth="'device_iotAlarmRecord_edit'"
              @click="formDialogRef.openDialog(scope.row.id)">{{ t('common.editBtn') }}</el-button>
            <el-button icon="delete" text type="primary" v-auth="'device_iotAlarmRecord_del'"
              @click="handleDelete([scope.row.id])">{{ t('common.delBtn') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle" v-bind="state.pagination" />
    </div>

    <!-- ====================== 弹窗轮播查看所有图片（左右滑动） ====================== -->
    <el-dialog v-model="imagePreviewVisible" :title="t('alarm.img')" append-to-body destroy-on-close width="800px">
      <el-carousel 
        v-if="previewImageList.length > 0" 
        height="500px" 
        v-model="currentPreviewIndex" 
        arrow="always" 
        indicator-position="outside"
      >
        <el-carousel-item v-for="(img, idx) in previewImageList" :key="idx">
          <img :src="img" class="preview-img" />
        </el-carousel-item>
      </el-carousel>
    </el-dialog>

    <form-dialog ref="formDialogRef" @refresh="getDataList(false)" />
    <upload-excel ref="excelUploadRef" title="导入" url="/device/iotAlarmRecord/import"
      temp-url="/admin/sys-file/local/file/iotAlarmRecord.xlsx" @refreshDataList="getDataList" />
  </div>
</template>

<script setup lang="ts" name="AlarmRecord">
import { BasicTableProps, useTable } from "/@/hooks/table";
import { fetchList, delObjs, getObj } from "/@/api/device/alarmRecord";
import { useMessage, useMessageBox } from "/@/hooks/message";
import { useDict } from '/@/hooks/dict';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const FormDialog = defineAsyncComponent(() => import('./form.vue'));
const { alarm_status } = useDict('alarm_status');

const formDialogRef = ref()
const excelUploadRef = ref();
const queryRef = ref()
const showSearch = ref(true)
const selectObjs = ref([]) as any
const multiple = ref(true)

// 图片预览
const imagePreviewVisible = ref(false)
const previewImageList = ref<string[]>([])
const currentPreviewIndex = ref(0)

const state: BasicTableProps = reactive<BasicTableProps>({
  queryForm: { deviceId: '', message: '', handleStatus: '' },
  pageList: fetchList
})

const {
  getDataList, currentChangeHandle, sizeChangeHandle, sortChangeHandle,
  downBlobFile, tableStyle
} = useTable(state)

// 重置
const resetQuery = () => {
  queryRef.value?.resetFields()
  selectObjs.value = []
  getDataList()
}

// 多选
const selectionChangHandle = (objs: { id: string }[]) => {
  selectObjs.value = objs.map(({ id }) => id);
  multiple.value = !objs.length;
};

// 删除
const handleDelete = async (ids: string[]) => {
  try { await useMessageBox().confirm(t('common.delConfirmText')); } catch { return; }
  try {
    await delObjs(ids);
    getDataList();
    useMessage().success(t('common.delSuccessText'));
  } catch (err: any) {
    useMessage().error(err.msg);
  }
};

// ====================== 核心工具方法：自动加 /api 前缀 ======================
const getImageList = (imgStr: string) => {
  if (!imgStr) return []
  return imgStr.split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(url => '/api' + url)
}

// 获取第一张图片（表格只显示这张）
const getFirstImage = (imgStr: string) => {
  const list = getImageList(imgStr)
  return list.length > 0 ? list[0] : ''
}

// 打开预览（轮播所有图）
const openImagePreview = async (id: string) => {
  try {
    const resp = await getObj({ id })
    const imgStr = resp?.data[0]?.imgStr || ''
    previewImageList.value = getImageList(imgStr)
    currentPreviewIndex.value = 0
    imagePreviewVisible.value = true
  } catch (err: any) {
    useMessage().error(err.msg || '加载图片失败')
  }
}
</script>

<style scoped>
/* 表格单张图片 */
.img-one-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}
.img-thumbnail:hover {
  border-color: #409eff;
}
.no-img {
  color: #c0c4cc;
  font-size: 12px;
}

/* 弹窗大图 */
.preview-img {
  width: 100%;
  height: 500px;
  object-fit: contain;
}
</style>