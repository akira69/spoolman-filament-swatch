import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createAppRouter } from "./router";
import App from "./App.vue";
import "./styles.css";
import de from "./locales/de.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import { startHostContext } from "./filaman/context";
import { watch } from "vue";
import "./styles/filaman.css";
import { type HostedConfig, type HostedWindow } from "./composables/useHostedMode";

const fonts=document.createElement('link');
fonts.rel='stylesheet';fonts.href='/plugin-fonts.css';document.head.append(fonts);

const getQueryParam = (name: string) => new URLSearchParams(window.location.search).get(name);

const loadNativeConfig = async () => {
  const url = getQueryParam('filaman_hosted_config') ?? getQueryParam('spoolman_hosted_config');
  if (!url) throw new Error('Missing FilaMan hosted configuration');
  const target = new URL(url, window.location.href);
  if (target.origin !== window.location.origin) throw new Error('Configuration must be same-origin');
  const response = await fetch(target.href, {credentials:'same-origin'});
  if (!response.ok) throw new Error(`FilaMan configuration: ${response.status}`);
  const config = await response.json();
  if (config.contract_version !== 2 || config.mode !== 'hosted' || config.app_key !== 'filaman' ||
      config.api_base_path !== '/api/v1' || config.app_base_path !== '/plugins/filament-swatch') throw new Error('Unsupported FilaMan contract');
  (window as HostedWindow).__FILAMAN_HOSTED__ = config;
  return config;
};

const requestedLocale = getQueryParam("spoolman_locale") || window.parent.document.documentElement.lang || "en";
const i18n = createI18n({
  legacy: false,
  locale: requestedLocale === "de" || requestedLocale === "fr" ? requestedLocale : "en",
  fallbackLocale: "en",
  messages: { de, en, fr },
});

const bootstrap = async () => {
  const hostedConfig = await loadNativeConfig();


  const hostedTheme =
    getQueryParam("filaman_theme") ?? getQueryParam("spoolman_theme");
  if (hostedTheme === "light" || hostedTheme === "dark") {
    const win = window as HostedWindow;
    if (win.__FILAMAN_HOSTED__) {
      win.__FILAMAN_HOSTED_THEME__ = hostedTheme;
    } else {
      win.__SPOOLMAN_HOSTED_THEME__ = hostedTheme;
    }
  }

  const host = startHostContext();
  await host.ready;
  watch(()=>host.context.language, language=>{i18n.global.locale.value=language;document.documentElement.lang=language;},{immediate:true});
  window.addEventListener("pagehide",event=>{if(!event.persisted)host.stop();});
  const router = createAppRouter();

  createApp(App).use(i18n).use(router).mount("#app");
};

void bootstrap().catch((error) => {
  console.error("Could not start Filament Swatch", error);
  const alert = document.createElement("p");
  alert.setAttribute("role", "alert");
  alert.textContent = i18n.global.t("app.hostedConfigError");
  const retry = document.createElement("button");
  retry.textContent = i18n.global.t("app.retry");
  retry.addEventListener("click", () => window.location.reload());
  document.querySelector("#app")?.replaceChildren(alert, retry);
});
