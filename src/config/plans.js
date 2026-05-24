export const PLAN_ALIASES = {
  Starter: 'Essencial',
  Pro: 'Profissional',
  Enterprise: 'Premium',
};

export const PLANS = {
  Essencial: {
    label: 'Essencial',
    maxBarbers: 1,
    maxTeamMembers: 1,
    commissions: false,
    fullHistory: false,
    reports: false,
    aiGrowth: false,
    multiUnit: false,
    upgradeFor: {
      commissions: 'Profissional',
      fullHistory: 'Profissional',
      reports: 'Profissional',
      aiGrowth: 'Profissional',
      multiUnit: 'Premium',
      extraBarbers: 'Profissional',
      extraTeam: 'Profissional',
    },
  },
  Profissional: {
    label: 'Profissional',
    maxBarbers: 5,
    maxTeamMembers: 3,
    commissions: true,
    fullHistory: true,
    reports: true,
    aiGrowth: true,
    multiUnit: false,
    upgradeFor: {
      multiUnit: 'Premium',
      extraBarbers: 'Premium',
      extraTeam: 'Premium',
    },
  },
  Premium: {
    label: 'Premium',
    maxBarbers: Infinity,
    maxTeamMembers: Infinity,
    commissions: true,
    fullHistory: true,
    reports: true,
    aiGrowth: true,
    multiUnit: true,
    upgradeFor: {},
  },
};

export function normalizePlanName(raw) {
  if (!raw) return 'Essencial';
  return PLAN_ALIASES[raw] ?? raw;
}

export function getPlan(raw) {
  const name = normalizePlanName(raw);
  return PLANS[name] ?? PLANS.Essencial;
}
