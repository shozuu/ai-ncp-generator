import { createApp } from 'vue'
import App from './App.vue'
import './assets/index.css'
import PageHead from './components/PageHead.vue'
import router from './router'

const app = createApp(App)
app.component('PageHead', PageHead)
app.use(router)
app.mount('#app')
