import { createRouter, RouteRecordRaw, createWebHashHistory } from 'vue-router'
import HomeView from '@renderer/views/HomeView.vue'
import AboutPage from '@renderer/views/AboutPage.vue'
import SettingsPage from '@renderer/views/SettingsPage.vue'
import EditPage from '../views/EditPage.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'entry',
        redirect: 'home'
    },
    {
        path: '/home',
        name: 'home',
        component: HomeView
    },
    {
        path: '/about',
        name: 'about',
        component: AboutPage
    },
    {
        path: '/settings',
        name: 'settings',
        component: SettingsPage
    },
    {
        path: '/edit/:index',
        name: 'edit',
        component: EditPage
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
