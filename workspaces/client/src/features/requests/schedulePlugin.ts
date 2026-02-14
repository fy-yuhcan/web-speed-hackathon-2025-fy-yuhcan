import type { BetterFetchPlugin } from '@better-fetch/fetch';

export const schedulePlugin = {
  hooks: {
    onRequest: async (request) => {
      return request;
    },
  },
  id: 'schedulePlugin',
  name: 'Schedule Plugin',
} satisfies BetterFetchPlugin;
