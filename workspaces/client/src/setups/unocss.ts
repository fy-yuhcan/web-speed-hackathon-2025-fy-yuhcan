import { IconifyJSON } from '@iconify/types';
import presetIcons from '@unocss/preset-icons/browser';
import presetWind3 from '@unocss/preset-wind3';
import initUnocssRuntime, { defineConfig } from '@unocss/runtime';

async function init() {
  await initUnocssRuntime({
    defaults: defineConfig({
      layers: {
        default: 1,
        icons: 0,
        preflights: 0,
        reset: -1,
      },
      preflights: [
        {
          getCSS: () => import('@unocss/reset/tailwind-compat.css?raw').then(({ default: css }) => css),
          layer: 'reset',
        },
        {
          getCSS: () =>
            '@view-transition{navigation:auto}html,:host{font-family:"Noto Sans JP",sans-serif!important}video{max-height:100%;max-width:100%}',
        },
        {
          getCSS: () => '@keyframes fade-in{from{opacity:0}to{opacity:1}}',
        },
      ],
      presets: [
        presetWind3(),
        presetIcons({
          collections: {
            bi: () =>
              import('@wsh-2025/client/src/assets/iconify/bi.json').then((m): IconifyJSON => m.default as IconifyJSON),
            'fa-solid': () =>
              import('@wsh-2025/client/src/assets/iconify/fa-solid.json').then(
                (m): IconifyJSON => m.default as IconifyJSON,
              ),
            fluent: () =>
              import('@wsh-2025/client/src/assets/iconify/fluent.json').then(
                (m): IconifyJSON => m.default as IconifyJSON,
              ),
            'line-md': () =>
              import('@wsh-2025/client/src/assets/iconify/line-md.json').then(
                (m): IconifyJSON => m.default as IconifyJSON,
              ),
            'material-symbols': () =>
              import('@wsh-2025/client/src/assets/iconify/material-symbols.json').then(
                (m): IconifyJSON => m.default as IconifyJSON,
              ),
          },
        }),
      ],
    }),
  });
}

init().catch((err: unknown) => {
  throw err;
});
