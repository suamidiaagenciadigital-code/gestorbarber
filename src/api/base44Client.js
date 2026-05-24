/**
 * base44Client — uses plain fetch() against the Supabase PostgREST API.
 *
 * We intentionally bypass the Supabase JS SDK for all data operations because
 * SDK v2.49.x calls getSession() internally before every request, and that
 * call hangs indefinitely in production (deadlock with onAuthStateChange).
 *
 * Auth calls (me, logout) still use the Supabase SDK because they're
 * triggered outside of the deadlock window.
 */
import { supabase } from '@/lib/supabase';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Build PostgREST headers, including user JWT when available */
function headers(extra = {}) {
  const tokenKey = Object.keys(localStorage).find(
    k => k.startsWith('sb-') && k.endsWith('-auth-token')
  );
  let accessToken = SUPABASE_ANON_KEY;
  if (tokenKey) {
    try {
      const parsed = JSON.parse(localStorage.getItem(tokenKey) || '{}');
      if (parsed?.access_token) accessToken = parsed.access_token;
    } catch { /* ignore */ }
  }
  return {
    apikey:        SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept:        'application/json',
    ...extra,
  };
}

/** base44 sort field → PostgREST order param */
function parseSortField(field = '-created_at') {
  const desc = field.startsWith('-');
  const col  = field
    .replace(/^-/, '')
    .replace('created_date', 'created_at')
    .replace('updated_date', 'updated_at');
  return `${col}.${desc ? 'desc' : 'asc'}`;
}

/** Throw a readable error from a failed PostgREST response */
async function throwIfError(resp) {
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try { const j = await resp.json(); msg = j.message || j.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
}

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

function makeEntity(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`[base44] Unknown entity: ${entityName}`);

  const base = `${SUPABASE_URL}/rest/v1/${table}`;

  return {
    /** Filter rows by exact-match criteria, with optional sort and limit */
    filter: async (filters = {}, sortField = '-created_at', limit = 200) => {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(filters)) {
        if (val === undefined || val === null) continue;
        params.append(key, `eq.${val}`);
      }
      params.append('order', parseSortField(sortField));
      params.append('limit', String(limit));
      const resp = await fetch(`${base}?${params}`, { headers: headers() });
      await throwIfError(resp);
      return resp.json();
    },

    /** List all rows, with optional sort & limit */
    list: async (sortField = '-created_at', limit = 100) => {
      const params = new URLSearchParams({
        order: parseSortField(sortField),
        limit: String(limit),
      });
      const resp = await fetch(`${base}?${params}`, { headers: headers() });
      await throwIfError(resp);
      return resp.json();
    },

    /** Create a row and return it */
    create: async (payload) => {
      const resp = await fetch(base, {
        method:  'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body:    JSON.stringify(payload),
      });
      await throwIfError(resp);
      const rows = await resp.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },

    /** Update a row by id and return it */
    update: async (id, payload) => {
      const resp = await fetch(`${base}?id=eq.${id}`, {
        method:  'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body:    JSON.stringify(payload),
      });
      await throwIfError(resp);
      const rows = await resp.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },

    /** Delete a row by id */
    delete: async (id) => {
      const resp = await fetch(`${base}?id=eq.${id}`, {
        method:  'DELETE',
        headers: headers(),
      });
      await throwIfError(resp);
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
