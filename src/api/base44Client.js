/**
 * base44Client — drop-in shim that mirrors the base44 SDK surface
 * using Supabase under the hood.
 *
 * All existing components import `base44` from here and call:
 *   base44.entities.X.filter(filters)
 *   base44.entities.X.list(sortField, limit)
 *   base44.entities.X.create(data)
 *   base44.entities.X.update(id, data)
 *   base44.functions.invoke(name, payload)
 *   base44.integrations.Core.InvokeLLM({ prompt, response_json_schema })
 *   base44.auth.logout()
 *   base44.auth.me()
 */
import { supabase } from '@/lib/supabase';

// base44 entity name → Supabase table name
const TABLE_MAP = {
  Company:         'companies',
  Customer:        'customers',
  Appointment:     'appointments',
  Service:         'services',
  Professional:    'professionals',
  BarbeariaUser:   'barbearia_users',
  TeamMember:      'team_members',
  FinancialEntry:  'financial_entries',
  AppConfig:       'app_configs',
  ServiceCategory: 'service_categories',
  Lead:            'leads',
};

// base44 sort field names → Supabase column names
function parseSortField(field = '-created_at') {
  const desc = field.startsWith('-');
  const col  = field
    .replace(/^-/, '')
    .replace('created_date', 'created_at')
    .replace('updated_date', 'updated_at');
  return { col, ascending: !desc };
}

function makeEntity(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`[base44] Unknown entity: ${entityName}`);

  return {
    /** Filter rows by exact-match criteria */
    filter: async (filters = {}) => {
      let q = supabase.from(table).select('*');
      for (const [key, val] of Object.entries(filters)) {
        if (val === undefined || val === null) continue;
        q = q.eq(key, val);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    /** List all rows, with optional sort & limit */
    list: async (sortField = '-created_at', limit = 100) => {
      const { col, ascending } = parseSortField(sortField);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(col, { ascending })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /** Create a row and return it */
    create: async (payload) => {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** Update a row by id and return it */
    update: async (id, payload) => {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** Delete a row by id */
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// Build entities object lazily
const entities = new Proxy({}, {
  get(_, entityName) {
    if (!(entityName in TABLE_MAP)) return undefined;
    return makeEntity(entityName);
  },
});

// Convert camelCase function name to kebab-case Edge Function name
// e.g. barbeariaUserActions → barbearia-user-actions
function toKebab(name) {
  return name.replace(/([A-Z])/g, (_, c) => '-' + c.toLowerCase());
}

export const base44 = {
  entities,

  functions: {
    invoke: async (functionName, payload) => {
      const fnName = toKebab(functionName);
      const { data, error } = await supabase.functions.invoke(fnName, { body: payload });
      if (error) throw error;
      return { data };
    },
  },

  integrations: {
    Core: {
      /** Call Claude LLM via Edge Function */
      InvokeLLM: async ({ prompt, response_json_schema } = {}) => {
        const { data, error } = await supabase.functions.invoke('invoke-llm', {
          body: { prompt, response_json_schema },
        });
        if (error) throw error;
        return data;
      },

      /** Send email via Edge Function */
      SendEmail: async ({ to, subject, body: emailBody, from_name } = {}) => {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: { to, subject, body: emailBody, from_name },
        });
        if (error) throw error;
        return data;
      },
    },
  },

  auth: {
    /** Get current Supabase Auth user (for super admin routes) */
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },

    /** Sign out from Supabase Auth AND clear custom admin session */
    logout: async () => {
      localStorage.removeItem('admin_session');
      await supabase.auth.signOut();
    },
  },
};
