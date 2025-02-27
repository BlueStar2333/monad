<template>
  <div class="preview">
    <div class="preview-drag" @dragenter.prevent="onDragEnter" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop" :class="{'drag-over': isDragging}"></div>
    <h4 class="preview-title">{{ previewData.table_name }}</h4>
    <p class="preview-description">{{ previewData.description }}</p>
    <div v-for="(item,index) in previewData.content" :key="index" :class="{ 'preview-form' : true, 'verify' : previewData.state === 3}">
      <h5 class="preview-form-title" :class="{required: item.isNecessary}">{{ index + 1 }}. {{ item.label }}{{ item.checkValue ? '（校验值）' : '' }}</h5>
      <div class="forms">
        <!--单行文本-->
        <el-input v-if="item.type === 0" v-model="item.content" @input="validateInput(item.regularRule, item.content, index)" :class="{ 'verify-error': correct[index] === false, 'regular-error': item.regularError, 'verify-width': item.checkValue }" size="small" placeholder="请输入内容" :maxlength="item.max" show-word-limit :disabled="redactStateC === '查看'" />
        <!--多行文本-->
        <el-input v-if="item.type === 1" v-model="item.content" @input="validateInput(item.regularRule, item.content, index)" :class="{ 'verify-error': correct[index] === false, 'regular-error': item.regularError }" type="textarea" :maxlength="item.max" show-word-limit :rows="2" placeholder="请输入内容" :disabled="redactStateC === '查看'" />
        <!--单选-->
        <div v-if="item.type === 2" :class="{ 'verify-error': correct[index] === false }">
          <el-radio v-for="(radio,idx) in item.select" :key="idx" v-model="item.content" :label="radio" :disabled="redactStateC === '查看'">{{ radio }}</el-radio>
        </div>
        <!--多选-->
        <el-checkbox-group v-if="item.type === 3" v-model="item.content" :class="{ 'verify-error': correct[index] === false }">
          <el-checkbox v-for="(checkbox,idx) in item.select" :key="idx" :label="checkbox" :disabled="redactStateC === '查看'">{{ checkbox }}</el-checkbox>
        </el-checkbox-group>
        <!--日期选择-->
        <el-date-picker v-if="item.type === 4" v-model="item.content" :class="{ 'verify-error': correct[index] === false }" size="small" :type="item.dateType" placeholder="选择日期" value-format="yyyy-MM-dd HH:mm" format="yyyy-MM-dd HH:mm" :disabled="redactStateC === '查看'" />
        <!--数量选择-->
        <el-input-number v-if="item.type === 5" v-model="item.content" :class="{ 'verify-error': correct[index] === false }" @change="numChange(item.content, index)" label="数" :disabled="redactStateC === '查看'" />
        <!--滑动条-->
        <el-slider v-if="item.type === 6" v-model="item.content" :class="{ 'verify-error': correct[index] === false }" :min="item.min" :max="item.max" style="padding: 0 20px" :disabled="redactStateC === '查看'" />
        <!--输入建议选择框-->
        <el-autocomplete v-if="item.type === 7" v-model="item.content" :class="{ 'verify-error': correct[index] === false, 'regular-error': item.regularError }" class="inline-input" :fetch-suggestions="querySearch" placeholder="请输入内容" :disabled="redactStateC === '查看'" @focus="sugFocus(index, 'pub')" @select="selectTips($event.value, index)" @blur="selectTips(item.content, index)" />
        <span v-if="item.regularError" class="regular-tips">{{ item.regularTips }}</span>
        <!--自增表格-->
        <el-table v-if="item.type === 20" :class="{ 'verify-error': correct[index] === false }" :data="item.content" class="body-input-content" style="width: 100%" border :header-cell-style="{backgroundColor: '#efefef'}">
          <el-table-column type="index" width="40" />
          <el-table-column v-for="(column,colIdx) in item.header" :key="colIdx" :label="column">
            <template slot-scope="scope">
              <div class="table-forms">
                <el-input v-if="item.bodyForm[colIdx].type === 0" v-model="item.content[scope.$index][colIdx]" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" :class="{ 'regular-error': item.regularError[scope.$index][colIdx], 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" @input="validateInput(item.bodyForm[colIdx].regularRule, item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })" placeholder="请输入内容" :maxlength="item.bodyForm[colIdx].max" size="mini" :disabled="redactStateC === '查看'" :id="'input' + index + scope.$index + colIdx"/>
                <el-input v-if="item.bodyForm[colIdx].type === 1" v-model="item.content[scope.$index][colIdx]" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" :class="{ 'regular-error': item.regularError[scope.$index][colIdx], 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" @input="validateInput(item.bodyForm[colIdx].regularRule, item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })" type="textarea" :maxlength="item.bodyForm[colIdx].max" :rows="2" placeholder="请输入内容" size="mini" :disabled="redactStateC === '查看'" :id="'input' + index + scope.$index + colIdx"/>
                <el-date-picker v-if="item.bodyForm[colIdx].type === 4" v-model="item.content[scope.$index][colIdx]" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" :class="{ 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" :type="item.bodyForm[colIdx].dateType" placeholder="选择日期" style="width: 100%" size="mini" format="yyyy-MM-dd HH:mm" value-format="yyyy-MM-dd HH:mm" :disabled="redactStateC === '查看'" :id="'input' + index + scope.$index + colIdx"/>
                <el-input-number v-if="item.bodyForm[colIdx].type === 5" v-model="item.content[scope.$index][colIdx]" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" :class="{ 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" @change="numChange(item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })" label="数" style="width: 100%" size="mini" :disabled="redactStateC === '查看'" :id="'input' + index + scope.$index + colIdx"/>
                <el-slider v-if="item.bodyForm[colIdx].type === 6" v-model="item.content[scope.$index][colIdx]" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" :class="{ 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" :min="item.bodyForm[colIdx].min" :max="item.bodyForm[colIdx].max" style="padding: 0 20px" size="mini" :disabled="redactStateC === '查看'" :id="'input' + index + scope.$index + colIdx"/>
                <el-autocomplete v-if="item.bodyForm[colIdx].type === 7" v-model="item.content[scope.$index][colIdx]" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" :class="{ 'regular-error': item.regularError[scope.$index][colIdx], 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" @select="selectTips($event.value, index, { row: scope.$index, col: colIdx })" @blur="selectTips(item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })" class="tb-inline-input" :fetch-suggestions="querySearch" placeholder="请输入内容" size="mini" :disabled="redactStateC === '查看'" @focus="sugFocus(index, 'table', colIdx)" :id="'input' + index + scope.$index + colIdx"/>
                <span v-if="item.regularError[scope.$index][colIdx]" class="regular-tips">{{ item.bodyForm[colIdx].regularTips }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="redactStateC !== '查看'" fixed="right" label="操作">
            <template slot-scope="scope">
              <div class="operation">
                <el-link v-if="1" type="danger" @click="deleteBodyForm(index, scope.$index)">删除</el-link>
                <el-link style="margin: 0 6px" type="success" @click="addBodyForm(index,scope.$index + 1)">添加</el-link>
                <el-link v-if="item.content.length === (scope.$index + 1)" type="success" @click="addBodyFormCope(index)">复制</el-link>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <div class="submit-btn">
      <el-button v-if="redactStateC === '新增'" type="primary" @click="addForm" :loading="submitLoading">提交</el-button>
      <el-button v-if="redactStateC === '编辑'" type="primary" @click="editForm" :loading="submitLoading">修改</el-button>
      <el-button @click="$emit('close')">取消</el-button>
    </div>

    <el-dialog
      title="错误提示"
      :visible.sync="errorForm.dialogVisible"
      width="30%"
      :modal="false"
      :append-to-body="true">
      <span>{{ errorForm.content }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="errorForm.dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="errorForm.dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { addContentTable, editContentTable } from '@/api/fillout'
import { deepClone } from "@/utils"

export default {
  name: 'Preview',
  props: {
    previewData: {
      type: Object,
      default: null
    },
    diyTable: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      submitLoading: false,
      // inputData: []
      sugData: [],
      redactStateC: '',
      loading: false,
      correct: [],
      diyContent: [],
      errorForm: {
        content: '',
        dialogVisible: false
      },
      isDragging: false
    }
  },
  created() {
    this.init()
    console.log(this.previewData, 78)
  },
  methods: {
    init() {
      console.log(this.previewData, 781)
      this.previewData.content = JSON.parse(this.previewData.content)
      this.diyContent = JSON.parse(this.diyTable.content)
      console.log(this.previewData, 782)
      this.redactStateC = this.previewData.redactState
      this.correct = JSON.parse(this.previewData.verify_correct)
    },
    enterLine(e, idx, rowIdx, colIdx) {
      if (rowIdx === this.previewData.content[idx].content.length - 1) {
        return
      }
      if (e.ctrlKey) {
        this.previewData.content[idx].content[rowIdx + 1][colIdx] = this.previewData.content[idx].content[rowIdx][colIdx]
        const newErrorRow = [...this.previewData.content[idx]['content'][rowIdx + 1]]
        newErrorRow[colIdx] = this.previewData.content[idx].content[rowIdx][colIdx]
        // 使用 Vue.set 替换整个对象,确保数据双向绑定
        this.$set(this.previewData.content[idx]['content'], rowIdx + 1, newErrorRow)
      }
      const oldId = 'input' + idx + rowIdx + colIdx
      const newId = 'input' + idx + (rowIdx + 1) + colIdx
      document.getElementById(oldId).blur()
      document.getElementById(newId).focus()
      // 对于数字输入框
      if (document.getElementById(oldId).querySelector('input')) {
        document.getElementById(oldId).querySelector('input').blur()
        document.getElementById(newId).querySelector('input').focus()
      }
    },
    numChange(num, idxOne, coordinate) {
      if (coordinate) {
        if (num > this.previewData.content[idxOne].bodyForm[coordinate.col].max) {
          this.errorForm.content = '输入的值大于最大值，请重新输入'
          this.errorForm.dialogVisible = true
        }
        if (num < this.previewData.content[idxOne].bodyForm[coordinate.col].min) {
          this.errorForm.content = '输入的值小于最小值，请重新输入'
          this.errorForm.dialogVisible = true
        }
      } else {
        if (num > this.previewData.content[idxOne].max) {
          this.errorForm.content = '输入的值大于最大值，请重新输入'
          this.errorForm.dialogVisible = true
        }
        if (num < this.previewData.content[idxOne].min) {
          this.errorForm.content = '输入的值小于最小值，请重新输入'
          this.errorForm.dialogVisible = true
        }
      }
    },
    selectTips(content, idx, coordinate) {
      let result = ''
      if (coordinate) {
        this.previewData.content[idx].bodyForm[coordinate.col].regularTips = '只能选择建议内容'
        if (content === '' || !this.diyContent[idx].bodyForm[coordinate.col].suggestion.split(',').includes(content)) {
          const newErrorRow = { ...this.previewData.content[idx]['regularError'][coordinate.row] }
          newErrorRow[coordinate.col] = true
          // 使用 Vue.set 替换整个对象,确保数据双向绑定
          this.$set(this.previewData.content[idx]['regularError'], coordinate.row, newErrorRow)
          result = 'error'
        } else {
          const newErrorRow = { ...this.previewData.content[idx]['regularError'][coordinate.row] }
          newErrorRow[coordinate.col] = false
          // 使用 Vue.set 替换整个对象,确保数据双向绑定
          this.$set(this.previewData.content[idx]['regularError'], coordinate.row, newErrorRow)
        }
      } else {
        console.log(this.previewData.content[idx])
        if (content === '' || !this.diyContent[idx].suggestion.split(',').includes(content)) {
          this.previewData.content[idx]['regularError'] = true
          result = 'error'
        } else {
          this.previewData.content[idx]['regularError'] = false
        }
      }
      return result
      // if (content === '' || !this.formData.suggestion.split(',').includes(content)) {
      //   this.formData.regularTips = '只能选择建议内容'
      //   this.formData.regularError = true
      //   console.log(this.formData.regularError)
      // } else {
      //   this.formData.regularTips = ''
      //   this.formData.regularError = false
      //   console.log('正确')
      // }
    },
    validateInput(rule, txt, idx, coordinate) {
      let result = ''
      const regex = new RegExp(rule)
      if (!regex.test(txt)) {
        if (coordinate) {
          // this.previewData.content[idx]['regularError'][coordinate.row][coordinate.col] = true
          console.log(this.previewData.content[idx]['regularError'][coordinate.row][coordinate.col],7789)
          const newErrorRow = { ...this.previewData.content[idx]['regularError'][coordinate.row] }
          newErrorRow[coordinate.col] = true
          // 使用 Vue.set 替换整个对象,确保数据双向绑定
          this.$set(this.previewData.content[idx]['regularError'], coordinate.row, newErrorRow)
        } else {
          this.previewData.content[idx]['regularError'] = true
        }
        result = 'error'
        console.log(11111)
      } else {
        if (coordinate) {
          // this.previewData.content[idx]['regularError'][coordinate.row][coordinate.col] = false
          const newErrorRow = { ...this.previewData.content[idx]['regularError'][coordinate.row] }
          newErrorRow[coordinate.col] = false
          // 使用 Vue.set 替换整个对象,确保数据双向绑定
          this.$set(this.previewData.content[idx]['regularError'], coordinate.row, newErrorRow)
        } else {
          this.previewData.content[idx]['regularError'] = false
        }
        result = ''
        console.log('正确')
      }
      return result
    },
    sugFocus(index, type, twoIndex) {
      if (type === 'pub') {
        this.sugData = this.diyContent[index].suggestion.split(',')
      } else if (type === 'table') {
        this.sugData = this.diyContent[index].bodyForm[twoIndex].suggestion.split(',')
      }
    },
    formatDateTime(isoString) {
      // 创建Date对象
      var date = new Date(isoString);

      // 获取年月日时分秒
      var year = date.getFullYear();
      var month = ('0' + (date.getMonth() + 1)).slice(-2); // 补零
      var day = ('0' + date.getDate()).slice(-2); // 补零
      var hours = ('0' + date.getHours()).slice(-2); // 补零
      var minutes = ('0' + date.getMinutes()).slice(-2); // 补零
      var seconds = ('0' + date.getSeconds()).slice(-2); // 补零

      // 返回格式化后的日期时间字符串
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    // 校验初始值和表单正则校验
    verifyContent(content) {
      let errorTxt = ''
      let errorRegular = ''
      let verify = ''
      const verify_correct = []
      content.forEach((itemOne, indexOne) => {
        console.log(itemOne.content,69)
        if (itemOne.content) {
          if (itemOne['isNecessary'] && !itemOne.content.toString()) {
            errorTxt = '请将必填项填写完整'
          }
        }
        if (itemOne.type === 0 || itemOne.type === 1) {
          errorRegular += this.validateInput(itemOne['regularRule'], itemOne.content, indexOne)
        }
        if (itemOne.type === 7) {
          errorRegular += this.selectTips(itemOne.content, indexOne)
        }
        if (itemOne.type === 5) {
          if (itemOne.content > itemOne.max || itemOne.content < itemOne.min) {
            errorTxt = '第' + (indexOne + 1) + '题输入的值不在有效范围内'
          }
        }
        if (itemOne.checkValue) {
          console.log(itemOne,789)
          if (itemOne.type === 4) {
            if (this.previewData.table_name === '四川大学华西医院体外录入正式模板') {
              verify += '-' + this.formatDateTime(itemOne.content)
            } else {
              verify += '-*' + this.formatDateTime(itemOne.content)
            }
          } else {
            if (this.previewData.table_name === '四川大学华西医院体外录入正式模板') {
              verify += '-' + itemOne.content.toString()
            } else {
              verify += '-*' + itemOne.content.toString()
            }
          }
        }
        if (itemOne.type === 20) {
          verify_correct[indexOne] = []
          itemOne.content.forEach((itemTwo, indexTwo) => {
            verify_correct[indexOne][indexTwo] = new Array(itemTwo.length).fill(false)
            console.log(itemTwo,789)
            itemTwo.forEach((itemThree, indexThree) => {
              if (itemOne.bodyForm[indexThree].type === 5) {
                if (itemThree > itemOne.bodyForm[indexThree].max || itemThree < itemOne.bodyForm[indexThree].min) {
                  errorTxt = '第' + (indexOne + 1) + '题第' + (indexTwo + 1) + '行输入的值不在有效范围内！'
                }
              }
              if (itemOne.bodyForm[indexThree].type === 4 && !itemThree) {
                errorTxt = '第' + (indexOne + 1) + '题第' + (indexTwo + 1) + '行日期的值不能为空！'
              }
              console.log(itemOne.bodyForm,indexOne,itemThree,14,indexTwo,indexThree)
              if (itemOne.bodyForm[indexThree].type === 0 || itemOne.bodyForm[indexThree].type === 1) {
                errorRegular += this.validateInput(itemOne.bodyForm[indexThree]['regularRule'], itemThree, indexOne, { row: indexTwo, col: indexThree })
              }
              if (itemOne.bodyForm[indexThree].type === 7) {
                errorRegular += this.selectTips(itemThree, indexOne, { row: indexTwo, col: indexThree })
              }
            })
          })
        } else {
          verify_correct[indexOne] = false
        }
      })
      return { errorTxt, errorRegular, verify, verify_correct }
    },
    addForm() {
      this.submitLoading = true
      const verifyData = this.verifyContent(this.previewData.content)
      console.log(verifyData, 6635)
      if (verifyData.errorRegular.includes('error')) {
        this.$message({
          type: 'warning',
          message: '表单项有格式填写错误'
        })
        this.submitLoading = false
        return
      }
      if (verifyData.errorTxt) {
        this.$message({
          type: 'warning',
          message: verifyData.errorTxt
        })
        this.submitLoading = false
        return
      }
      const data = {
        form_id: this.previewData.id,
        form_name: this.previewData.table_name,
        written_by: this.$store.state.user.userInfo.name,
        written_account: this.$store.state.user.userInfo.account,
        // content: JSON.stringify(this.previewData.content),
        content: btoa(unescape(encodeURIComponent(JSON.stringify(this.previewData.content).replace(/"suggestion":"[^"]*"/g, '"suggestion":""')))),
        user_id_req: btoa(unescape(encodeURIComponent(this.previewData.content[0].content))),
        verify_req: btoa(unescape(encodeURIComponent(verifyData.verify))),
        verify_correct_req: verifyData.verify_correct
      }
      addContentTable(data).then(res => {
        if (res.code === 1) {
          this.$message({
            type: 'success',
            message: res.msg
          })
          this.$emit('add')
        } else {
          this.$message({
            type: 'info',
            message: res.msg
          })
        }
        this.submitLoading = false
      }).catch(err => {
        this.$message({
          type: 'error',
          message: err
        })
        const self = this
        setTimeout(() => {
          self.submitLoading = false
        }, 50000)
      })
    },
    editForm() {
      this.submitLoading = true
      const verifyData = this.verifyContent(this.previewData.content)
      console.log(verifyData, this.previewData, 886)
      if (verifyData.errorRegular.includes('error')) {
        this.$message({
          type: 'warning',
          message: '表单项有格式填写错误'
        })
        this.submitLoading = false
        return
      }
      if (verifyData.errorTxt) {
        this.$message({
          type: 'warning',
          message: verifyData.errorTxt
        })
        this.submitLoading = false
        return
      }
      const data = {
        id: this.previewData.id,
        // content: JSON.stringify(this.previewData.content),
        content: btoa(unescape(encodeURIComponent(JSON.stringify(this.previewData.content).replace(/"suggestion":"[^"]*"/g, '"suggestion":""')))),
        written_account: this.$store.state.user.userInfo.account,
        user_id_req: btoa(unescape(encodeURIComponent(this.previewData.content[0].content))),
        verify_req: btoa(unescape(encodeURIComponent(verifyData.verify))),
        // user_id: this.previewData.content[0].content,
        // verify: verifyData.verify,
        oldVerify: this.previewData.verify,
        verify_correct_req: verifyData.verify_correct
      }
      editContentTable(data).then(res => {
        if (res.code === 1) {
          this.$message({
            type: 'success',
            message: res.msg
          })
          this.$emit('add')
        } else {
          this.$message({
            type: 'info',
            message: res.msg
          })
        }
        this.submitLoading = false
      }).catch(err => {
        this.$message({
          type: 'error',
          message: err
        })
        this.submitLoading = false
      })
    },
    deleteBodyForm(index, idx) {
      if (this.previewData.content[index].content.length === 1) {
        this.$message({
          type: 'info',
          message: '至少保留一条数据'
        })
      } else {
        this.previewData.content[index].content.splice(idx, 1)
        this.previewData.content[index].regularError.splice(idx, 1)
      }
    },
    addBodyForm(index, addIdx) {
      console.log(this.previewData.content[index],addIdx, 36)
      const data = this.previewData.content[index]
      const len = data.content[0].length
      console.log(data, 78)
      const newArr = new Array(len).fill('')
      data.bodyForm.forEach((item, index) => {
        if (item.type === 5) {
          newArr[index] = item.min
        }
      })
      // data.content.push(newArr)
      // data.regularError.push(new Array(len).fill(false))
      // this.correct[index].push(new Array(len).fill(false))
      data.content.splice(addIdx, 0, newArr)
      data.regularError.splice(addIdx, 0, new Array(len).fill(false))
      this.correct[index].splice(addIdx, 0, new Array(len).fill(false))
    },
    addBodyFormCope(index) {
      const data = this.previewData.content[index]
      const len = data.content[0].length
      const STR_DATA = JSON.stringify(data.content[data.content.length - 1])
      console.log(this.correct[index], data.content[data.content.length - 1], 78)
      // data.content.push(deepClone(data.content[data.content.length - 1]))
      data.content.push(JSON.parse(STR_DATA))
      data.regularError.push(new Array(len).fill(false))
      this.correct[index].push(new Array(len).fill(false))
    },
    querySearch(queryString, cb) {
      const restaurants = []
      this.sugData.forEach(item => {
        restaurants.push({ 'value': item, 'address': item })
      })
      const results = queryString ? restaurants.filter(this.createFilter(queryString)) : restaurants
      // 调用 callback 返回建议列表的数据
      cb(results)
    },
    createFilter(queryString) {
      return (restaurant) => {
        return (restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0)
      }
    },
    onDragEnter() {
      this.isDragging = true;
    },
    onDragOver() {
      // 确保拖动过程中保持拖拽状态
      this.isDragging = true;
    },
    onDragLeave() {
      this.isDragging = false;
    },
    onDrop(event) {
      console.log(this.previewData,4563)
      this.isDragging = false;
      if (this.previewData.table_name === '广东省人民医院血气录入模板' && this.previewData.redactState !== '查看') { // 广东血气录入表

        const files = event.dataTransfer.files;
        if (files.length === 1) {
          // alert(files[0].name)
          // 定义正则表达式来匹配所需的模式
          const regex = /^(\d+)-.*?([^.]{6})\.[^.]+$/
          // 使用正则表达式测试输入字符串
          const match = files[0].name.match(regex)
          // 检查6位字符是否全由数字组成
          const isNumeric = /^\d{6}$/.test(match[2]);

          if (match && isNumeric) {
            // 如果匹配成功，提取所需的部分
            const string1 = match[1] // - 符号前的数据
            const string2 = match[2] // _ 和 . 之间的数据

            this.previewData.content[0].content = string1
            this.previewData.content[1].content = string2
          } else {
            // 如果格式不正确，返回错误提示
            this.$message({
              type: 'info',
              message: '文件名格式不正确'
            })
          }
        }
      } else {
        this.$message({
          type: 'info',
          message: '此表单不支持拖拽识别'
        })
      }
    }
  }
}
</script>

<style scoped lang="scss">
  .preview {
    position: relative;
  }
  .preview-drag {
    position: absolute;
    left: -6px;
    top: -20px;
    right: -6px;
    bottom: 100px;
  }
  .preview-title {
    text-align: center;
    font-size: 18px;
  }
  .preview-description {
    font-style:italic;
    text-indent: 2em;
    padding: 10px 0 6px;
    color: #666;
  }
  .verify {
    .verify-error {
      ::v-deep * {
        border-color: red !important;
      }
    }
  }
  .regular-error {
    ::v-deep * {
      border-color: red !important;
    }
  }
  .verify-width {
    width: 200px !important;
  }
  .inline-input {
    width: 250px;
  }
  .forms {
    position: relative;
    margin-bottom: 8px;
  }
  .table-forms {
    position: relative;
    margin-bottom: 16px;
  }
  .regular-tips {
    color: #ff4949;
    font-size: 12px;
    line-height: 1;
    padding-top: 4px;
    position: absolute;
    top: 100%;
    left: 0;
  }
  .preview-form {
    .required:before {
      content: '*';
      color: red;
      margin: 0 2px;
    }
    .preview-form-title {
      //font-style:italic;
      padding: 16px 0 10px;
      color: #4f4f4f;
    }
    .select-department {
      background-color: #fefefe;
      border: 1px solid #d3d3d3;
      border-radius: 4px;
      text-align: center;
      line-height: 40px;
      height: 40px;
      color: #d2d2d2;
      cursor: not-allowed;
    }
  }
  .submit-btn {
    display: flex;
    justify-content: space-around;
    margin: 30px 160px 0;
  }
  .drag-over {
    opacity: .2;
    background-color: #409eff;
    z-index: 999;
  }
</style>
