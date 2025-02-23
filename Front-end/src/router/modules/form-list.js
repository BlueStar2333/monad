// 自定义表单模块

import Layout from '@/layout'

const FormListRouter = {
  path: '/formList',
  component: Layout,
  redirect: 'noRedirect',
  name: '表单列表',
  meta: {
    title: '表单列表',
    icon: 'fill-out'
  },
  children: [
    {
      path: 'fill-out',
      component: () => import('@/pages/fill-out'),
      name: '表单填写',
      meta: { title: '表单填写', noCache: true }
    },
    {
      path: 'admin-data',
      component: () => import('@/pages/fill-out/admin-data'),
      name: '清理数据用',
      meta: { title: '清理数据用', noCache: true }
    }
  ]
}

export default FormListRouter

