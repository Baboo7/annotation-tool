import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import AnnotationEditor from './components/AnnotationEditor'
import Annotator from './components/Annotator'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.component('app-annotation-editor', AnnotationEditor)
Vue.component('app-annotator', Annotator)

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
