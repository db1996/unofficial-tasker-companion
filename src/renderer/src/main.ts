import '@renderer/assets/scss/app.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.router'
import 'bootstrap'
import { tooltipDirective } from './stores/useTooltip'
import { useTaskerStore } from './stores/tasker.store'
import { useHomeassistantStore } from './stores/homeassistant.store'
import { useSettingsStore } from './stores/settings.store'

const app = createApp(App)
app.use(createPinia())

const settingsStore = useSettingsStore()
settingsStore.getSettings()
useTaskerStore()
useHomeassistantStore()

app.use(router)
app.directive('tooltip', tooltipDirective)
app.mount('#app')
