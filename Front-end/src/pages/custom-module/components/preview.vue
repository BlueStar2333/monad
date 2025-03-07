<template>
  <div class="preview">
    <h4 class="preview-title">{{ previewData.table_name }}</h4>
    <p class="preview-description">{{ previewData.description }}</p>
    <div v-for="(item,index) in previewData.content" :key="index" :class="{ 'preview-form' : true, 'verify' : previewData.state === 3}">
      <h5 class="preview-form-title" :class="{required: item.isNecessary}">{{ index + 1 }}. {{ item.label }}{{ item.checkValue ? '（校验值）' : '' }}</h5>
      <div class="forms">
        <!--单行文本-->
        <el-input v-if="item.type === 0" v-model="item.content" :class="{ 'verify-error': correct[index] === false, 'regular-error': item.regularError }" size="small" placeholder="请输入内容" :maxlength="item.max" show-word-limit :disabled="redactStateC === '查看'" @input="validateInput(item.regularRule, item.content, index)" />
        <!--多行文本-->
        <el-input v-if="item.type === 1" v-model="item.content" :class="{ 'verify-error': correct[index] === false, 'regular-error': item.regularError }" type="textarea" :maxlength="item.max" show-word-limit :rows="2" placeholder="请输入内容" :disabled="redactStateC === '查看'" @input="validateInput(item.regularRule, item.content, index)" />
        <!--单选-->
        <div v-if="item.type === 2" :class="{ 'verify-error': correct[index] === false }">
          <el-radio v-for="(radio,idx) in item.select" :key="idx" v-model="item.content" :label="radio" :disabled="redactStateC === '查看'">{{ radio }}</el-radio>
        </div>
        <!--多选-->
        <el-checkbox-group v-if="item.type === 3" v-model="item.content" :class="{ 'verify-error': correct[index] === false }">
          <el-checkbox v-for="(checkbox,idx) in item.select" :key="idx" :label="checkbox" :disabled="redactStateC === '查看'">{{ checkbox }}</el-checkbox>
        </el-checkbox-group>
        <!--日期选择-->
        <el-date-picker v-if="item.type === 4" v-model="item.content" :class="{ 'verify-error': correct[index] === false }" size="small" :type="item.dateType" placeholder="选择日期" :disabled="redactStateC === '查看'" />
        <!--数量选择-->
        <el-input-number v-if="item.type === 5" v-model="item.content" :class="{ 'verify-error': correct[index] === false }" label="数" :disabled="redactStateC === '查看'" @change="numChange(item.content, index)" />
        <!--滑动条-->
        <el-slider v-if="item.type === 6" v-model="item.content" :class="{ 'verify-error': correct[index] === false }" :min="item.min" :max="item.max" style="padding: 0 20px" :disabled="redactStateC === '查看'" />
        <!--输入建议选择框-->
        <el-autocomplete v-if="item.type === 7" v-model="item.content" :class="{ 'verify-error': correct[index] === false, 'regular-error': item.regularError }" class="inline-input" :fetch-suggestions="querySearch" placeholder="请输入内容" :disabled="redactStateC === '查看'" @focus="sugFocus(index, 'pub')" @select="selectTips($event.value, index)" @blur="selectTips(item.content, index)" clearable/>
        <span v-if="item.regularError" class="regular-tips">{{ item.regularTips }}</span>
        <!--自增表格-->
        <el-table v-if="item.type === 20" :class="{ 'verify-error': correct[index] === false }" :data="item.content" class="body-input-content" style="width: 100%" border :header-cell-style="{backgroundColor: '#efefef'}">
          <el-table-column type="index" width="40" />
          <el-table-column v-for="(column,colIdx) in item.header" :key="colIdx" :label="column">
            <template slot-scope="scope">
              <div class="table-forms">
<!--                争对广东省体外录入做特殊处理-->
                <el-input
                  v-if="item.bodyForm[colIdx].type === 0 && !(viewData.table_name.includes('广东省人民医院体外录入') && item.header[colIdx] === '停跳液量mL' && !item.content[scope.$index][colIdx - 1].includes('(ml)'))"
                  v-model="item.content[scope.$index][colIdx]"
                  :class="{ 'regular-error': item.regularError[scope.$index][colIdx], 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }"
                  placeholder="请输入内容"
                  :maxlength="item.bodyForm[colIdx].max"
                  show-word-limit
                  size="mini"
                  :id="'input' + index + scope.$index + colIdx"
:disabled="redactStateC === '查看'" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)"
                  @input="validateInput(item.bodyForm[colIdx].regularRule, item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })"
                />
                <el-input
                  v-if="item.bodyForm[colIdx].type === 1"
                  v-model="item.content[scope.$index][colIdx]"
                  :class="{ 'regular-error': item.regularError[scope.$index][colIdx], 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }"
                  type="textarea"
                  :maxlength="item.bodyForm[colIdx].max"
                  show-word-limit
                  :rows="2"
                  placeholder="请输入内容"
                  size="mini"
:disabled="redactStateC === '查看'"
                  :id="'input' + index + scope.$index + colIdx"
                  @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)"
                  @input="validateInput(item.bodyForm[colIdx].regularRule, item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })"
                />
                <el-date-picker v-if="item.bodyForm[colIdx].type === 4" v-model="item.content[scope.$index][colIdx]" :class="{ 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" :type="item.bodyForm[colIdx].dateType" placeholder="选择日期" :id="'input' + index + scope.$index + colIdx" style="width: 100%" size="mini" :disabled="redactStateC === '查看'" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" />
                <el-input-number v-if="item.bodyForm[colIdx].type === 5" v-model="item.content[scope.$index][colIdx]" :class="{ 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" :id="'input' + index + scope.$index + colIdx" label="数" style="width: 100%" size="mini" :disabled="redactStateC === '查看'" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" @change="numChange(item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })" />
                <el-slider v-if="item.bodyForm[colIdx].type === 6" v-model="item.content[scope.$index][colIdx]" :class="{ 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }" :min="item.bodyForm[colIdx].min" :max="item.bodyForm[colIdx].max" :id="'input' + index + scope.$index + colIdx" style="padding: 0 20px" size="mini" :disabled="redactStateC === '查看'" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)" />
                <el-autocomplete
                  v-if="item.bodyForm[colIdx].type === 7"
                  v-model="item.content[scope.$index][colIdx]"
                  :class="{ 'regular-error': item.regularError[scope.$index][colIdx], 'verify-error': correct[index] !== false && (correct[index] === false || correct[index][scope.$index][colIdx] === false) }"
                  class="inline-input"
                  :fetch-suggestions="querySearch"
                  placeholder="请输入内容"
                  size="mini"
                  :id="'input' + index + scope.$index + colIdx"
:disabled="redactStateC === '查看'" @keyup.enter.native="enterLine($event, index, scope.$index, colIdx)"
                  @select="selectTips($event.value, index, { row: scope.$index, col: colIdx })"
                  @blur="selectTips(item.content[scope.$index][colIdx], index, { row: scope.$index, col: colIdx })"
                  @focus="sugFocus(index, 'table', colIdx)"
                  clearable
                />
                <span v-if="item.regularError[scope.$index][colIdx]" class="regular-tips">{{ item.bodyForm[colIdx].regularTips }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="redactStateC !== '查看'" fixed="right" label="操作">
            <template slot-scope="scope">
              <div class="operation">
                <el-link v-if="1" type="danger" @click="deleteBodyForm(index, scope.$index)">删除</el-link>
                <el-link v-if="item.content.length === (scope.$index + 1)" style="margin: 0 6px" type="success" @click="addBodyForm(index)">添加</el-link>
                <el-link v-if="item.content.length === (scope.$index + 1)" type="success" @click="addBodyFormCope(index)">复制</el-link>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <div class="submit-btn">
      <el-button v-if="redactStateC === '新增'" type="primary" @click="addForm">测试提交</el-button>
      <el-button @click="$emit('close')">取消</el-button>
    </div>

    <el-dialog
      title="错误提示"
      :visible.sync="errorForm.dialogVisible"
      width="30%"
      :modal="false"
      :append-to-body="true"
    >
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
import { deepClone } from '@/utils'

export default {
  name: 'Preview',
  props: {
    viewData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // inputData: []
      sugData: [],
      redactStateC: '新增',
      loading: false,
      correct: [],
      errorForm: {
        content: '',
        dialogVisible: false
      },
      previewData: {
        content: [],
        correct: ''
      }
    }
  },
  created() {
    this.init()
    console.log(this.previewData, 78)
  },
  methods: {
    init() {
      this.previewData.content = JSON.parse(this.viewData.content)
      this.previewData.correct = JSON.parse(this.viewData.verify_correct)
      this.correct = JSON.parse(this.viewData.verify_correct)
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
        if (content === '' || !this.previewData.content[idx].bodyForm[coordinate.col].suggestion.split(',').includes(content)) {
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
        if (content === '' || !this.previewData.content[idx].suggestion.split(',').includes(content)) {
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
          console.log(this.previewData.content[idx]['regularError'][coordinate.row][coordinate.col], 7789)
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
        this.sugData = this.previewData.content[index].suggestion.split(',')
      } else if (type === 'table') {
        this.sugData = this.previewData.content[index].bodyForm[twoIndex].suggestion.split(',')
      }
    },
    // 校验初始值和表单正则校验
    verifyContent(content) {
      let errorTxt = ''
      let errorRegular = ''
      let verify = ''
      const verify_correct = []
      content.forEach((itemOne, indexOne) => {
        console.log(itemOne['regularError'], itemOne['regularRule'], 69)
        if (itemOne['isNecessary'] && !itemOne.content.toString()) {
          errorTxt = '请将必填项填写完整'
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
          verify += '-' + itemOne.content.toString()
        }
        if (itemOne.type === 20) {
          verify_correct[indexOne] = []
          itemOne.content.forEach((itemTwo, indexTwo) => {
            verify_correct[indexOne][indexTwo] = new Array(itemTwo.length).fill(false)
            console.log(itemTwo, 789)
            itemTwo.forEach((itemThree, indexThree) => {
              if (itemOne.bodyForm[indexThree].type === 5) {
                if (itemThree > itemOne.bodyForm[indexThree].max || itemThree < itemOne.bodyForm[indexThree].min) {
                  errorTxt = '第' + (indexOne + 1) + '题第' + (indexTwo + 1) + '行输入的值不在有效范围内'
                }
              }
              console.log(itemOne.bodyForm, indexOne, itemThree, 14, indexTwo, indexThree)
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
      this.loading = true
      const verifyData = this.verifyContent(this.previewData.content)
      console.log(verifyData.errorRegular, 6635)
      if (verifyData.errorRegular.includes('error')) {
        this.$message({
          type: 'warning',
          message: '表单项有格式填写错误'
        })
        this.loading = false
        return
      }
      if (verifyData.errorTxt) {
        this.$message({
          type: 'warning',
          message: verifyData.errorTxt
        })
        this.loading = false
        return
      }
      this.$message({
        type: 'success',
        message: '验证成功'
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
    addBodyForm(index) {
      console.log(this.previewData.content[index], 36)
      const data = this.previewData.content[index]
      const len = data.content[0].length
      console.log(this.correct[index], 78)
      data.content.push(new Array(len).fill(''))
      data.regularError.push(new Array(len).fill(false))
      this.correct[index].push(new Array(len).fill(false))
    },
    addBodyFormCope(index) {
      console.log(this.previewData.content[index], 36)
      const data = this.previewData.content[index]
      const len = data.content[0].length
      console.log(this.correct[index], data.content[data.content.length - 1], 78)
      data.content.push(deepClone(data.content[data.content.length - 1]))
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
    }
  }
}
</script>

<style scoped lang="scss">
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
    margin: 20px 120px 0;
  }
</style>
