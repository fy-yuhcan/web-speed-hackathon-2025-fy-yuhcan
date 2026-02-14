import { createFetch, createSchema } from '@better-fetch/fetch';
import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';

import { schedulePlugin } from '@wsh-2025/client/src/features/requests/schedulePlugin';

type ApiSchema = typeof import('@wsh-2025/schema/src/api/schema');

const $fetch = createFetch({
  baseURL: process.env['API_BASE_URL'] ?? '/api',
  plugins: [schedulePlugin],
  schema: createSchema({
    '/programs': {
      output: schema.getProgramsResponse,
      query: schema.getProgramsRequestQuery,
    },
    '/programs/:programId': {
      output: schema.getProgramByIdResponse,
      params: schema.getProgramByIdRequestParams,
    },
  }),
  throw: true,
});

interface ProgramService {
  fetchProgramById: (query: {
    programId: string;
  }) => Promise<StandardSchemaV1.InferOutput<ApiSchema['getProgramByIdResponse']>>;
  fetchPrograms: () => Promise<StandardSchemaV1.InferOutput<ApiSchema['getProgramsResponse']>>;
}

export const programService: ProgramService = {
  async fetchProgramById({ programId }) {
    const data = await $fetch('/programs/:programId', {
      params: { programId },
    });
    return data;
  },
  async fetchPrograms() {
    const data = await $fetch('/programs', { query: {} });
    return data;
  },
};
