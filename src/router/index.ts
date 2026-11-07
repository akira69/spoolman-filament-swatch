import { createRouter, createWebHistory } from 'vue-router';
import MainApp from '@/views/MainApp.vue';

const hostedRoot = '/app/swatch';
const hostedTitle = 'Filament Swatch';
export const createAppRouter = () => {
  const hostedQuery = Object.fromEntries(
    [...new URLSearchParams(window.location.search)].filter(([key]) =>
      key.startsWith('filaman_') || key.startsWith('spoolman_')
    )
  );
  const titlePrefix = hostedTitle;

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      {path:'/',redirect:hostedRoot},
      {
        path: '/app',
        component: MainApp,
        redirect: hostedRoot,
        children: [
          {
            path: 'swatch',
            name: 'swatch',
            component: () => import('@/views/FilamentsView.vue'),
            meta: {
              title: `${titlePrefix} - Browse Your Collection`
            }
          }
        ]
      },
      // Catch-all redirect for unknown routes
      {
        path: '/:pathMatch(.*)*',
        redirect: hostedRoot
      }
    ],
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition;
      } else {
        return { top: 0 };
      }
    }
  });

  router.beforeEach((to) => {
    if (Object.entries(hostedQuery).some(([key, value]) => to.query[key] !== value)) {
      return { ...to, query: { ...to.query, ...hostedQuery } };
    }
    document.title = (to.meta.title as string) || titlePrefix;
  });

  return router;
};
