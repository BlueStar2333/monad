import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'

Vue.use(Vuex)

//context作用:获取一个特定的上下文,主要用来实现自动化导入模块,
// 在前端工程中,如果遇到从一个文件夹引入很多模块的情况,
// 可以使用这个api,它会遍历文件夹中的指定文件,
// 然后自动导入,使得不需要每次显式的调用import导入模块
//require.context函数接受三个参数
//
// 1.directory {String} -读取文件的路径
//
//2.useSubdirectories {Boolean} -是否遍历文件的子目录
//
// 3.regExp {RegExp} -匹配文件的正则
//



const modulesFiles = require.context('./modules', true, /\.js$/)

//固定代码 从指定目录导入模块
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
  const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1')
  const value = modulesFiles(modulePath)
  modules[moduleName] = value.default
  return modules
}, {})

const store = new Vuex.Store({
  modules,
  getters
})

export default store
