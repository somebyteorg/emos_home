import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'
import signStore from '@/stores/sign.ts'

import view_index from '@/views/index.vue'
import view_sign from '@/views/sign.vue'
import view_not_found from '@/views/404.vue'

export const ROUTE_NAME_INDEX = 'Index',
  ROUTE_NAME_SIGN = 'Sign',
  ROUTE_NAME_HOME = 'Home',
  ROUTE_NAME_LINK = 'Link'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAME_INDEX,
    component: view_index,
  },
  {
    path: '/sign',
    name: ROUTE_NAME_SIGN,
    component: view_sign,
  },
  {
    path: '/home',
    name: ROUTE_NAME_HOME,
    component: () => import('@/views/home.vue'),
  },
  {
    path: '/link/:uuid',
    name: ROUTE_NAME_LINK,
    component: () => import('@/views/link.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: view_not_found,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, from) => {
  document.title = `${to.meta.title || ''} | emos`

  if (!signStore().is_sign && ![ROUTE_NAME_INDEX, ROUTE_NAME_SIGN, ROUTE_NAME_LINK].includes(to.name)) {
    return {
      name: ROUTE_NAME_INDEX,
      replace: true,
    }
  }
})

export default router

// prettier-ignore
export const KEEP_ALIVE_NAME = [
]

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}
