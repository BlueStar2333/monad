<template>
  <div class="middle">
    <div class="head">
      <el-link class="head-link" :underline="false" type="primary" icon="el-icon-delete" @click="deleteInput(1, formData.length)">清空</el-link>
      <el-link class="head-link" :underline="false" type="primary" icon="el-icon-view" @click="previewTable">预览</el-link>
      <el-link class="head-link" :underline="false" type="primary" icon="el-icon-refresh-right" @click="temporarilySave" :disabled="saveLoading">暂存</el-link>
      <el-link v-if="status === 'edit'" class="head-link" :underline="false" type="primary" icon="el-icon-document-checked" @click="edit" :disabled="saveLoading">确认修改</el-link>
      <el-link v-if="status === 'add'" class="head-link" :underline="false" type="primary" icon="el-icon-document-add" @click="save" :disabled="saveLoading">保存上传</el-link>
    </div>
    <div v-show="formData.length === 0" class="description">
      <p>请从左侧列表中选择一个组件,</p>
      <p>然后用鼠标拖动组件放置于此处.</p>
    </div>
    <div class="body" @drop="drop($event)" @dragover="allowDrop($event)">
      <div v-for="(itemA,index) in formData" :key="index" class="body-input" @click="selectInput(index,formData[index])">
        <h5 :class="{'body-input-label':true,'required':itemA.isNecessary}">{{ index+1 + '.' + itemA.label }} {{ itemA.checkValue ? '（校验值）' : '' }}</h5>
        <!--单行文本-->
        <el-input v-if="itemA.type === 0" v-model="formData[index].content" :maxlength="formData[index].max" show-word-limit class="body-input-content" size="small" placeholder="请输入内容" />
        <!--多行文本-->
        <el-input v-if="itemA.type === 1" v-model="formData[index].content" :maxlength="formData[index].max" show-word-limit class="body-input-content" type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="请输入内容" />
        <!--单选-->
        <div v-if="itemA.type === 2" class="body-input-select">
          <el-radio v-for="(itemB, idx) in itemA.select" :key="idx" v-model="itemA.content" :label="itemB">{{ itemB }}</el-radio>
        </div>
        <!--多选-->
        <el-checkbox-group v-if="itemA.type === 3" v-model="itemA.content" class="body-input-select">
          <el-checkbox v-for="(itemB, idx) in itemA.select" :key="idx" :label="itemB">{{ itemB }}</el-checkbox>
        </el-checkbox-group>
        <!--日期选择-->
        <el-date-picker v-if="itemA.type === 4" v-model="formData[index].content" value-format="yyyy-MM-dd hh:mm:ss" class="body-input-content" :type="formData[index].dateType" size="small" placeholder="选择日期" />
        <!--数量选择-->
        <el-input-number v-if="itemA.type === 5" v-model="formData[index].content" :min="formData[index].min" :max="formData[index].max" label="数"/>
        <!--滑动条-->
        <el-slider v-if="itemA.type === 6" v-model="formData[index].content" :min="formData[index].min" :max="formData[index].max" style="padding: 0 20px"></el-slider>
        <!--输入建议选择框-->
        <el-autocomplete v-if="itemA.type === 7" v-model="formData[index].content" class="inline-input" placeholder="请输入内容"></el-autocomplete>
        <!--自增表格-->
        <el-table v-if="itemA.type === 20" :data="itemA.content" class="body-input-content" style="width: 100%" border :header-cell-style="{backgroundColor: '#efefef'}">
          <el-table-column v-for="(column,colIdx) in itemA.header" :key="colIdx" :label="column">
            <template slot-scope="scope">
              {{ itemA.bodyForm[colIdx].label }}
            </template>
          </el-table-column>
        </el-table>

        <!--    选中框    -->
        <div v-show="selectIndex === index" class="body-input-nav">
<!--          <span class="nav-name"><i class="el-icon-rank" /> {{ typeMap[itemA.type] }}</span>-->
          <div class="nav-menu">
            <a><i class="el-icon-back nav-menu-back" @click.stop="selectIndex = -1" /></a>
            <a v-if="index !== 0"><i class="el-icon-bottom nav-menu-bottom" @click.stop="switchPlaces(index, index+1)" /></a>
            <a v-if="index !== 0"><i class="el-icon-top nav-menu-top" @click.stop="switchPlaces(index, index-1)" /></a>
            <a v-if="index !== 0"><i class="el-icon-delete" @click="deleteInput(index, 1)" /></a>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      :modal-append-to-body="false"
      title="预览"
      :visible.sync="previewShow"
      width="70%"
      center
    >
      <Preview v-if="previewShow" :view-data="diyForm" @close="previewShow = false"/>
    </el-dialog>
  </div>
</template>

<script>
import inputData from '@/config/input-data'
import { deepClone } from '@/utils'
import { addCustomTable, editCustomTable } from '@/api/custom-module'
import Preview from './preview'

// 必填内容未填提示映射表
const warningMap = {
  'table_name': '请填写表名',
  'description': '请填写表说明'
}
export default {
  name: 'PopupMiddle',
  components: {
    Preview
  },
  inheritAttrs: false,
  props: {
    editForm: {
      type: Object,
      default: null
    },
    pageStatus: {
      type: String,
      default: 'add'
    }
  },
  data() {
    return {
      previewShow: false,
      selectIndex: -1,
      formData: [],
      typeMap: {
        0: '单行文本',
        1: '多行文本',
        2: '单选框',
        3: '多选框',
        4: '日期选择',
        5: '数量选择',
        6: '滑动条',
        7: '带建议输入',
        20: '自增表格'
      },
      status: 'add',
      id: '',
      saveLoading: false,
      diyForm: null,
      bodyDom: null
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      this.status = this.pageStatus
      this.bodyDom = document.querySelector('.body')
      if (this.editForm) {
        this.formData = JSON.parse(this.editForm.content)
      } else {
        this.formData.push({
          type: 7,
          uniqueName: '',
          label: '人员ID',
          suggestion: '',
          content: '',
          regularError: false, // 验证正确与否
          regularTips: '只能选择建议内容', // 校验提示
          isNecessary: true,
          checkValue: true
        })
      }
    },
    drop(e) {
      const inputType = e.dataTransfer.getData('type')
      const newInputData = deepClone(inputData[inputType])
      this.formData.push(newInputData)
      this.$nextTick(() => {
        this.bodyDom.scrollTop = this.bodyDom.scrollHeight + 100
      })
      // console.log(inputType)
    },
    allowDrop(e) {
      e.preventDefault()
      // console.log(inputData, e, e.offsetX, e.offsetY, 10)
    },
    selectInput(index, input) {
      this.selectIndex = index
      // console.log(input, 456)
      this.$eventBus.$emit('selectInput', input)
    },
    // 两表单交换位置
    switchPlaces(oldIndex, newIndex) {
      if (newIndex === -1) {
        this.$message('已经移动到最上面')
        return
      }
      if (newIndex === this.formData.length) {
        this.$message('已经移动到最下面')
        return
      }
      const oldValue = this.formData[oldIndex]
      const newValue = this.formData[newIndex]
      this.formData.splice(oldIndex, 1, newValue)
      this.formData.splice(newIndex, 1, oldValue)
      this.selectIndex = newIndex
      // console.log(oldValue.type,this.formData[oldIndex].type)
      // this.formData[oldIndex] = newValue
      // this.formData[newIndex] = oldValue
      // console.log(oldValue.type,this.formData[oldIndex].type)
    },
    deleteInput(index, num) {
      console.log(this.formData)
      this.$eventBus.$emit('selectInput', null)
      this.formData.splice(index, num)
    },
    previewTable() {
      const self = this
      this.$eventBus.$emit('getDiyData', function(form) {
        self.diyForm = form
      })
      this.diyForm['verify_correct'] = JSON.stringify(this.addVerifyContent(this.formData))
      this.diyForm.content = JSON.stringify(this.formData)
      this.previewShow = true
    },
    checkForm() {
      let ret = false
      if (this.diyForm['check_number'] < 3) {
        this.$message({
          message: '请设置至少3个校验项',
          type: 'warning'
        })
        return true
      }
      const LEN = this.formData.length
      for (let i = 0; i < LEN; i++) {
        if (this.formData[i].type === 7 && this.formData[i].suggestion === '') {
          this.$message({
            message: '第' + (i + 1) + '题建议框必须输入建议内容',
            type: 'warning'
          })
          return true
        }
      }
      this.formData.forEach((item, index) => {

      })
      for (const key in warningMap) {
        if (this.diyForm[key] === '') {
          this.$eventBus.$emit('changeTab', 'second')
          this.$message({
            message: warningMap[key],
            type: 'warning'
          })
          ret = true
          break
        }
        ret = false
      }
      return ret
    },
    addVerifyContent(content) {
      const verify_correct = []
      console.log(content)
      content.forEach((itemOne, indexOne) => {
        if (itemOne.type === 20) {
          verify_correct[indexOne] = []
          itemOne.content.forEach((itemTwo, indexTwo) => {
            verify_correct[indexOne][indexTwo] = new Array(itemTwo.length).fill(false)
          })
        } else {
          verify_correct[indexOne] = false
        }
      })
      return verify_correct
    },
    checkNum(content) {
      let checkNum = 0
      console.log(content)
      content.forEach((itemOne, indexOne) => {
        if (itemOne.checkValue) {
          checkNum++
        }
      })
      return checkNum
    },
    temporarilySave() {
      // 添加或保存
      if (this.status === 'add') {
        this.save(false)
      } else if (this.status === 'edit') {
        this.edit(false)
      }
    },
    save(close = true) {
      console.log(this.diyForm, 635)
      const self = this
      this.$eventBus.$emit('getDiyData', function(form) {
        self.diyForm = form
      })
      this.diyForm.check_number = this.checkNum(this.formData)
      if (this.checkForm()) {
        return
      }
      this.saveLoading = true
      this.diyForm['verify_correct'] = JSON.stringify(this.addVerifyContent(this.formData))
      this.diyForm.content = btoa(unescape(encodeURIComponent(JSON.stringify(this.formData))))
      this.diyForm.creator = this.$store.state.user.userInfo.name
      addCustomTable(this.diyForm).then(res => {
        if (res.code === 1) {
          this.$message({
            message: '添加成功',
            type: 'success'
          })
          if (close) {
            this.$emit('getData', '')
            this.$emit('onClose')
          } else {
            this.status = 'edit'
            this.id = res.data.result.id
          }
          this.saveLoading = false
          this.$eventBus.$emit('refresh')
        }
      }).catch(err => {
        this.$message({
          message: 'submission failed,network error!',
          type: 'error'
        })
        this.saveLoading = false
      })
    },
    edit(close = true) {
      const self = this
      this.$eventBus.$emit('getDiyData', function(form) {
        self.diyForm = form
      })
      this.diyForm.check_number = this.checkNum(this.formData)
      if (this.checkForm()) {
        return
      }
      this.saveLoading = true
      this.diyForm['verify_correct'] = JSON.stringify(this.addVerifyContent(this.formData))
      this.diyForm.content = btoa(unescape(encodeURIComponent(JSON.stringify(this.formData))))
      this.diyForm.creator = this.$store.state.user.userInfo.name
      this.diyForm.id = this.id || this.editForm.id
      editCustomTable(this.diyForm).then(res => {
        if (res.code === 1) {
          this.$message({
            message: '修改成功',
            type: 'success'
          })
          if (close) {
            this.$emit('onClose')
          }
          this.saveLoading = false
          this.$eventBus.$emit('refresh')
        }
      }).catch(err => {
        this.$message({
          message: 'submission failed,network error!',
          type: 'error'
        })
        this.saveLoading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.middle {
  position: relative;
  flex: 1;
  min-width: 430px;
  background-color: #f1f2f3;
  overflow: auto;
}
::v-deep .el-dialog__header {
  background-color: #f1f2f3;
  .el-dialog__title {
    color: #999;
  }
}
.head {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: right;
  padding: 0 30px;
  background-color: #FEFEFE;
  .head-link {
    margin: 0 6px;
  }
}
.description {
  position: absolute;
  top: 360px;
  width: 100%;
  text-align: center;
  color: #999;
}
.body {
  width: 96%;
  min-width: 400px;
  height: 88%;
  overflow-y: auto;
  background-color: #fff;
  margin: 16px auto 0;
  padding: 10px 12px 22px;
  border: 10px solid #4A4F5F;
  border-radius: 20px;
  position: relative;
}
.body-input {
  position: relative;
  .required:before {
    content: '*';
    color: red;
    margin: 0 2px;
  }
  .body-input-label {
    font-weight: 500;
    margin: 14px 0 8px;
    color: #868686;
  }
  ::v-deep {
    .el-textarea__inner,.el-input__inner,.el-checkbox__label,.el-radio__label {
      color: #666;
    }
  }
  .body-input-select {
    padding: 6px;
    background-color: #fdfdfd;
    border-radius: 4px;
  }
}

.body-input-nav {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #409eff;
  z-index: 9;
  .nav-name {
    position: absolute;
    top: 0;
    font-size: 14px;
    color: #fff;
    padding: 4px 10px 4px 4px;
    background-color: rgba(64,158,255,.8);
    cursor: move;
  }
  .nav-menu {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #409eff;
    padding: 6px 0 4px 6px;
    color: #fff;
    a {
      margin-right: 6px;
    }
    .nav-menu-back {
      font-size: 14px;
    }
    .nav-menu-bottom {
      font-size: 14px;
    }
    .nav-menu-top {
      position: relative;
      top: 2px;
    }
  }
}
</style>
