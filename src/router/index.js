import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '全球热恋'
    }
  }
]

export default new Router({
  mode: 'history',
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { x: 0, y: 0 }
  }
})
