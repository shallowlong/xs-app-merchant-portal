import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// Element Plus 组件与样式由 unplugin-vue-components 按需引入（见 vite.config.js）
import "./styles/element.scss";
import "./styles/global.scss";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
