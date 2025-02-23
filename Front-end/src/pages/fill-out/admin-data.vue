<template>
  <div class="app-container">

    <el-dropdown class="dropdown" placement="bottom" @command="handleCommand">
      <span class="el-dropdown-link">
        表名：{{ tableName || '请选择表单' }}<i v-if="!tableName" class="el-icon-arrow-down el-icon--right" />{{ diyTable.state === 0 ? '（关闭填写）' : '' }}
      </span>
      <el-dropdown-menu slot="dropdown" style="min-width: 300px">
        <el-dropdown-item v-for="(item,index) in formList" :key="index" :command="item">
          <span :class="{'c99': !item.state}">{{ item.table_name }}</span>
          <span class="c99" style="float: right">{{ item.state === 0 ? '（已关闭）' : '' }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>

    <el-form class="search" label-width="100px" size="small">
      <el-date-picker v-model="searchDate" type="datetimerange" format="yyyy-MM-dd HH:mm" style="margin-top: 2px;margin-right: 20px" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      <el-select v-model="searchState" placeholder="请选择校验状态" style="margin-right: 20px;width: 150px" clearable>
        <el-option label="待校验" value="1" />
        <el-option label="校验正确" value="2" />
        <el-option label="校验错误" value="3" />
        <el-option label="未校验" value="4" />
      </el-select>
      <el-select v-model="searchId" placeholder="请选择人员id" style="margin-top: 2px;margin-right: 20px;width: 150px" filterable clearable>
        <el-option v-for="(item,index) in searchIds" :key="index" :label="item.user_id" :value="item.user_id" />
      </el-select>
      <el-select v-if="this.$store.state.user.userInfo.power === 1" v-model="searchUsers" multiple collapse-tags style="margin-top: 2px;margin-right: 20px;width: 180px" placeholder="请选择录入人员" clearable>
        <el-option v-for="item in searchUserOption" :key="item.written_by" :label="item.written_by" :value="item.written_account" />
      </el-select>
      <el-button
        style="margin-top: 2px;"
        icon="el-icon-search"
        type="primary"
        @click="searchByDate(1), haveData = false"
      >查询</el-button>
      <el-button v-if="this.$store.state.user.userInfo.power === 0" size="small" type="primary" class="right-btn" icon="el-icon-document" plain @click="editFillIn(diyTable, '新增')">添加</el-button>
    </el-form>
    <div class="table-row">
      <span class="table-row-num">总计：{{ tableLength }}</span>
      <el-tooltip v-if="this.$store.state.user.userInfo.power === 1" class="item" effect="dark" :content="deriveLoading? '加载数据中' + (exportProgress ? `(${exportProgress})` : '') : '导出'" placement="top">
        <el-button class="add-button" size="mini" type="primary" icon="el-icon-folder-opened" plain :disabled="deriveLoading" @click="exportExcel" />
      </el-tooltip>
      <el-tooltip v-if="this.$store.state.user.userInfo.power === 1" class="item" effect="dark" content="统计" placement="top">
        <el-button class="add-button statistics-button" size="mini" type="primary" icon="el-icon-coin" plain @click="openStatistics" />
      </el-tooltip>
    </div>

    <el-table
      v-loading="tableLoading"
      :header-cell-style="{ 'background-color': '#fefefe', color: '#959595' }"
      border
      class="tableData"
      :data="tableData"
      fit
      highlight-current-row
      style="width: 100%"
    >
      <el-table-column min-width="120px" fiexd align="center" prop="written_by" label="填报人" />
      <el-table-column min-width="60px" fiexd align="center" prop="user_id" label="人员ID" />
      <el-table-column min-width="120px" align="center" label="填报时间">
        <template slot-scope="scope">
          {{ formatDate(scope.row.date) }}
        </template>
      </el-table-column>
      <el-table-column min-width="120px" align="center" label="填写详情">
        <template slot-scope="scope">
          <svg-icon
            icon-class="person"
            class="person-icon"
            @click="editFillIn(scope.row, '查看')"
          />
        </template>
      </el-table-column>
      <el-table-column min-width="120px" align="center" label="校验状态">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.state === 2" type="success">正确</el-tag>
          <el-tag v-if="scope.row.state === 1" type="warning">待校验</el-tag>
          <el-tag v-if="scope.row.state === 3" type="danger">错误</el-tag>
          <el-tag v-if="scope.row.state === 4" type="danger">表关闭未校验</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="$store.state.user.userInfo.power !== 1" fixed="right" label="操作">
        <template slot-scope="scope">
          <el-link
            type="primary"
            :disabled="!diyTable.state"
            @click="editFillIn(scope.row, '编辑')"
          >编辑</el-link>
          <el-link
            type="danger"
            style="margin-left: 10px"
            :disabled="!diyTable.state"
            @click="deleteFillIn(scope.row)"
          >删除
          </el-link>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page.sync="listQuery.page"
      :page-sizes="[10, 20]"
      :page-size="listQuery.limit"
      layout="sizes, prev, pager, next, jumper"
      :total="tableLength"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <el-dialog
      :modal-append-to-body="false"
      :title="'☆' + fillInForm.redactState"
      :visible.sync="fillInShow"
      :close-on-click-modal="false"
      width="94%"
    >
      <Preview v-if="fillInShow" :preview-data="fillInForm" @add="searchByDate(listQuery.page)" @close="fillInShow = false" />
    </el-dialog>

    <el-drawer
      title="填报数量统计"
      :visible.sync="drawer"
      direction="rtl"
      size="80%"
      @opened="drawerOpened"
    >
      <Statistics ref="statistics" :table-name="tableName" :fields-option="checkLabel" :table-length="tableLength"></Statistics>
    </el-drawer>
  </div>
</template>

<script>
import { deepClone, parseTime } from '@/utils'
import Pagination from '@/components/Pagination'
import FileSaver from 'file-saver'
import XLSX from 'xlsx'
import { getStaffContentTable, deleteContentTable, getDrawerNumData, sysTest } from '@/api/fillout'
import Preview from './components/preview'
import Statistics from './components/statistics'
import { getCustomTable } from '@/api/custom-module'
import { getUserinfoByName } from '@/api/employee'

export default {
  name: 'HealthEducation',
  components: {
    Preview, Pagination, Statistics
  },
  data() {
    return {
      tableName: '',
      tableLoading: false,
      deriveLoading: false,
      drawer: false,
      formList: [],
      searchDate: '',
      searchState: '',
      searchId: '',
      searchIds: [],
      searchUsers: [],
      searchUserOption: [],
      tableData: [],
      tableDeriveData: [],
      fillInShow: false,
      fillInForm: '',
      diyTable: '',
      total: 60,
      tableLength: 0,
      listQuery: {
        page: 1,
        limit: 10,
        sort: '+id'
      },
      exportProgress: 0,
      checkLabel: [],
      reqCancel: null,
      haveData: false // 是否已经下载数据到前端
    }
  },
  created() {
    if (Object.keys(this.$route.params).length > 0) {
      this.tableName = this.$route.params.table_name
      this.diyTable = this.$route.params
    } else {
      console.log('没有 params 参数')
    }
    this.getData()
    this.searchByDate(1)
  },
  beforeDestroy() {
    // 用户离开页面时取消请求
    this.reqCancel && this.reqCancel()
  },
  methods: {
    sysTestt() {
      sysTest().then(res => {
        console.log(res,456)
      })
    },
    getData() {
      // this.sysTestt()

      this.tableData = []
      this.tableDeriveData = []
      this.tableLoading = true
      const account = this.$store.state.user.userInfo.power ? '' : this.$store.state.user.userInfo.account
      getCustomTable({ account }).then(res => {
        if (res.code) {
          this.formList = res.data.resultD
          console.log(this.formList, 789)
        }
        setTimeout(() => {
          self.tableLoading = false
        }, 600)
      })
      if (this.$store.state.user.userInfo.power === 1) {
        getUserinfoByName({
          name: '',
          getPower: 0
        }).then((res) => {
          if (res.code === 1) {
            this.searchUserOption = res.data.list
          }
        })
      }
    },
    checkValueArr(data) {
      const result = []
      data.forEach(item => {
        if (item.checkValue) {
          result.push(item.label)
        }
      })
      return result
    },
    openStatistics() {
      if (!this.diyTable.id) {
        this.$message({
          type: 'info',
          message: '请先选择表单'
        })
        return
      }
      this.checkLabel = this.checkValueArr(JSON.parse(this.diyTable.content))
      this.drawer = true
    },
    drawerOpened() {
      const data = {
        form_id: this.diyTable.id
      }
      this.$refs.statistics.getData(data)
    },
    searchByDate(page, derive) { // 查询第n页
      const self = this
      self.fillInShow = false
      self.tableLoading = true
      const data = {
        form_id: self.diyTable.id || '',
        written_account: self.$store.state.user.userInfo.account,
        startDate: '',
        endDate: '',
        state: self.searchState,
        user_id: self.searchId,
        power: self.$store.state.user.userInfo.power,
        n: page,
        limit: this.listQuery.limit,
        searchUsers: this.searchUsers
      }
      if (self.searchDate) {
        data.startDate = new Date(self.searchDate[0])
        data.endDate = new Date(self.searchDate[1])
      }
      getStaffContentTable(data).then(res => {
        console.log(res, 56)
        if (res.code === 1) {
          self.tableData = res.data.result
          self.searchIds = res.data.resultIds
          self.tableLength = res.data.resultLen.length
        }
        setTimeout(() => {
          self.tableLoading = false
        }, 600)
      })
    },
    deleteFillIn(row) {
      this.$confirm('删除后不可恢复，是否确认删除？').then((_) => {
        const data = {
          id: row.id,
          verify: row.verify
        }
        deleteContentTable(data).then(res => {
          if (res.code === 1) {
            this.$message({
              type: 'success',
              message: '已删除'
            })
            this.searchByDate(1)
          } else {
            this.$message({
              type: 'warning',
              message: '删除失败'
            })
          }
        })
      }).catch((_) => {})
    },
    editFillIn(row, redactState) {
      console.log(this.diyTable, 89)
      if (this.diyTable) {
        if (!this.diyTable.state) {
          this.$message({
            type: 'info',
            message: '该表已关闭填写'
          })
          return
        }
        this.fillInForm = {
          id: row.id,
          content: row.content,
          verify: row.verify,
          verify_correct: row.verify_correct,
          state: row.state,
          table_name: this.diyTable.table_name,
          description: this.diyTable.description,
          redactState: redactState
        }
        this.fillInShow = true
      } else {
        this.$message({
          type: 'info',
          message: '请先选择表单'
        })
      }
    },


    handleCurrentChange(page) {
      this.searchByDate(page, '1') // 第二个参数等于1时不请求导出数据只翻页
      this.listQuery.page = page
    },
    handleSizeChange(val) {
      this.listQuery.limit = val
      this.listQuery.page = 1
      this.searchByDate(1, '1')
    },

    handleCommand(command) {
      this.tableName = command.table_name
      this.diyTable = command
      this.searchByDate(1)
      if (this.$store.state.user.userInfo.power === 1) {
        this.getSearchUserOption(this.diyTable.id)
      }
    },
    getSearchUserOption(id) {
      getUserinfoByName({
        name: '',
        getPower: 0,
        form_id: id
      }).then((res) => {
        if (res.code === 1) {
          this.searchUserOption = res.data.list
        }
      })
    },
    formatDate(date) {
      date = new Date(date)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0') // 月份是从0开始的
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}`
    },

    exportExcel() {
      const self = this
      const data = {
        form_id: self.diyTable.id || '',
        written_account: self.$store.state.user.userInfo.account,
        startDate: '',
        endDate: '',
        state: self.searchState,
        user_id: self.searchId,
        power: self.$store.state.user.userInfo.power,
        n: 0,
        limit: this.listQuery.limit,
        searchUsers: this.searchUsers
      }
      self.deriveLoading = true
      if (self.haveData) {
        self.exportExcelT()
        self.deriveLoading = false
      } else {
        getStaffContentTable(data, (progress, cancel) => {
          this.exportProgress = (progress.loaded / progress.total * 100).toFixed(2) + '%'
          this.reqCancel = cancel
        }).then(res => {
          console.log(777777777777777777)// 格式化成百分数
          if (res.code === 1) {
            self.haveData = true
            self.tableDeriveData = res.data.result
            setTimeout(function() {
              self.exportExcelT()
              this.exportProgress = 0
              self.deriveLoading = false
            }, 1000)
          }
        }).catch(err => {
          self.deriveLoading = false
        })
      }
    },

    exportExcelT() {
      if (!this.tableName) {
        this.$message({
          type: 'info',
          message: '请先选择表单'
        })
        return
      }
      const headers = ['表名', '填写时间', '填报人', '填报人账号', '校验值', '校验状态(1：待校验  2：校验正确  3：错误  4: 未校验)', '每项校验结果（false为未匹配上）', '填写内容']
      const fields = ['form_name', 'date', 'written_by', 'written_account', 'verify', 'state', 'verify_correct', 'content']
      let data = new Array()
      data = this.tableDeriveData.map((obj) => {
        return fields.map((field) => {
          let result = obj[field]
          if (field === 'content') {
            result = obj[field].replace(/"suggestion":"[^"]*"/g, '"suggestion":""')
          }
          return result
        })
      })

      this.excelAa(data)
      this.excelAb(data)
      this.excelAc(data)
      this.excelAd(data)
      return;



      if (headers.length > 0) {
        data.splice(0, 0, headers)
      } else {
        // 将headers设置为英文字段表头
        data.splice(0, 0, fields)
      }
      const ws = XLSX.utils.aoa_to_sheet(data) // 创建工作表
      const wb = XLSX.utils.book_new() // 创建工作簿

      // 隐藏表头
      // let wsrows = [{ hidden: true }]
      // ws['!rows'] = wsrows // ws - worksheet

      XLSX.utils.book_append_sheet(wb, ws) // 将工作表添加到工作簿中
      XLSX.writeFile(wb, this.tableName + '填写情况.xlsx') // 导出文件
    },


    // 四川大学华西医院体外录入正式模板 数据处理（CPB总结）
    excelAa(dataArr) {
      const headers = ['校验值', '病案号', '登记号', '手术编号', '预充液_乳酸林格液（mL）', '预充液_万汶（mL）', '预充液_佳乐施（mL）',
        '预充液_甘露醇（mL）', '预充液_氯化钠（ml）', '预充液_白蛋白（g）', '预冲液_血浆（mL）', '预冲液_红悬（U）', '预冲液_肝素（mg）',
        '预冲液_碳酸氢钠（mL）', '预冲液_其他', '术中超滤使用（无0，普通超滤1，改良超滤2）', '超滤量（ml）', '术中小结_CPB红细胞（U）',
        '术中小结_CPB血浆（mL）', '术中小结_CPB血小板（U）', '术中小结_CPB白蛋白（g)', '术中小结_肝素总量（mg）', '术中小结_鱼精蛋白总量（mg）',
        '术中小结_机血（mL）', '术中小结_机血鱼精蛋白用量（mg）', '术中小结_体外循环开始尿量（mL）', '术中小结_体外循环结束尿量（mL）']
      const data = []
      data.push(headers)

      dataArr.forEach(item => {
        console.log(item)
        const content = JSON.parse(item[7])
        console.log(content, 7896)
        data.push([item[4], content[0].content, content[1].content, content[2].content, content[3].content[0][0], content[3].content[0][1], content[3].content[0][2],
          content[3].content[0][3], content[3].content[0][4], content[3].content[0][5], content[3].content[0][6], content[3].content[0][7], content[3].content[0][8],
          content[3].content[0][9], '', content[4].content.slice(2).toString(), content[5].content, content[6].content[0][0],
          content[6].content[0][1], content[6].content[0][2], content[6].content[0][3], content[6].content[0][4], content[6].content[0][5],
          content[6].content[0][6], content[6].content[0][7], content[7].content[0][0], content[7].content[0][1]])
      })
      const ws = XLSX.utils.aoa_to_sheet(data) // 创建工作表
      const wb = XLSX.utils.book_new() // 创建工作簿
      XLSX.utils.book_append_sheet(wb, ws) // 将工作表添加到工作簿中
      XLSX.writeFile(wb, 'CPB总结.xlsx') // 导出文件
    },
    // 四川大学华西医院体外录入正式模板 数据处理（CPB事件记录）
    excelAb(dataArr) {
      const headers = ['校验值', '病案号', '登记号', '手术编号', '体外循环开始时间', '开机次数', '阻断次数', '主动脉阻断时间（开机后-min)', '主动脉开放（开机后-min)', '体外循环总时间（min）']
      const data = []
      data.push(headers)

      dataArr.forEach(item => {
        console.log(item)
        const content = JSON.parse(item[7])
        content[8].content.forEach((cItem, Idx) => {
          data.push([item[4] + Idx, content[0].content, content[1].content, content[2].content, cItem[0], cItem[1], cItem[2], cItem[3], cItem[4], cItem[5]])
        })
      })
      const ws = XLSX.utils.aoa_to_sheet(data) // 创建工作表
      const wb = XLSX.utils.book_new() // 创建工作簿
      XLSX.utils.book_append_sheet(wb, ws) // 将工作表添加到工作簿中
      XLSX.writeFile(wb, 'CPB事件记录.xlsx') // 导出文件
    },
    // 四川大学华西医院体外录入正式模板 数据处理（CPB灌注）
    excelAc(dataArr) {
      const headers = ['校验值', '病案号', '登记号', '手术编号', '开机次数', '开机后时间（min）', '术中灌注_灌注次数', '术中灌注_灌注方式（无0、根部1、左右冠2、逆灌3、桥灌4）', '术中灌注_灌注量（ml)']
      const data = []
      data.push(headers)

      dataArr.forEach(item => {
        console.log(item)
        const content = JSON.parse(item[7])
        content[9].content.forEach((cItem, Idx) => {
          data.push([item[4] + Idx, content[0].content, content[1].content, content[2].content, cItem[0], cItem[1], cItem[2], cItem[3], cItem[4]])
        })
      })
      const ws = XLSX.utils.aoa_to_sheet(data) // 创建工作表
      const wb = XLSX.utils.book_new() // 创建工作簿
      XLSX.utils.book_append_sheet(wb, ws) // 将工作表添加到工作簿中
      XLSX.writeFile(wb, 'CPB灌注.xlsx') // 导出文件
    },
    // 四川大学华西医院体外录入正式模板 数据处理（CPB时间变量）
    excelAd(dataArr) {
      const headers = ['校验值', '病案号', '登记号', '手术编号', '开机次数', '开机后时间（min）', '转机流量（L/min）', '通气_FIO2', '通气_O2流量']
      const data = []
      data.push(headers)

      dataArr.forEach(item => {
        console.log(item)
        const content = JSON.parse(item[7])
        console.log(content, 7896)
        content[10].content.forEach((cItem, Idx) => {
          data.push([item[4] + Idx, content[0].content, content[1].content, content[2].content, cItem[0], cItem[1], cItem[2], cItem[3], cItem[4]])
        })
      })
      console.log(data, 7896)
      const ws = XLSX.utils.aoa_to_sheet(data) // 创建工作表
      const wb = XLSX.utils.book_new() // 创建工作簿
      XLSX.utils.book_append_sheet(wb, ws) // 将工作表添加到工作簿中
      XLSX.writeFile(wb, 'CPB时间变量.xlsx') // 导出文件
    }
  }
}
</script>

<style lang="scss" scoped>
  .dropdown {
    display: flex;
    justify-content: center;
    margin: 16px 0 20px;
    padding-bottom: 16px;
    border-bottom: solid 1px #f5f5f5;
  }
  .el-dropdown-link {
    cursor: pointer;
    color: #409EFF;
    font-size: 22px;
    font-weight: 600;
    opacity: .6;
  }
  .el-icon-arrow-down {
    font-size: 18px;
  }

  ::v-deep .el-dialog__header {
    background-color: #f1f2f3;
    .el-dialog__title {
      color: #999;
    }
  }

.app-container {
  background-color: #fff;
  ::v-deep .el-dialog__header {
    background-image: repeating-linear-gradient(135deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(45deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(67.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(135deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(45deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(112.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(112.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(45deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(22.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(45deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(22.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(135deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(157.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(67.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),repeating-linear-gradient(67.5deg, hsla(264,0%,88%,0.03) 0px, hsla(264,0%,88%,0.03) 1px,transparent 1px, transparent 12px),linear-gradient(90deg, rgba(151,26,210, 0),rgba(57,199,205, 0));
    .el-dialog__title {
      color: #c6c6c6;
    }
  }
  ::v-deep .el-dialog__body {
    margin-bottom: 50px;
  }
}

.search {
  padding: 20px 0;

  .date-component {
    margin: 10px;
  }
}

.add-button {
  position: absolute;
  right: 15px;
  top: 6px;
  border: 1px solid #bebebe;
  font-size: 12px;
  color: #969696;
}
.statistics-button {
  right: 76px;
}

.person-icon {
  font-size: 22px;
  cursor: pointer;
  fill: #99cd80;
}

  .c99 {
    color: #c9c9c9;
  }

  .table-row {
    background: #ceeaf3;
    height: 40px;
    line-height: 40px;
    margin-top: 10px;
    position: relative;
    .table-row-num {
      font-size: 14px;
      margin-left: 20px;
      font-weight: 600;
      color: #999;
      opacity: .4;
      font-style: oblique;
    }
  }

  .right-btn {
    float: right;
    margin: 2px 0 10px 10px;
  }
</style>
