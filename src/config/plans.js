export const PLAN_ALIASES = {
  Starter: 'Essencial',
  Pro: 'Profissional',
  Enterprise: 'Premium',
};

export const PLANS = {
  Essencial: {
    label: 'Essencial',
    maxBarbers: 1,
    commissions: false,
    fullHistory: false,
    reports: false,
    multiUnit: false,
    upgradeFor: {
      commissions: 'Profissional',
      fullHistory: 'Profissional',
      reports: 'Profissional',
      multiUnit: 'Premium',
      extraBarbers: 'Profissional',
    },
  },
  Profissional: {
    label: 'Profissional',
    maxBarbers: 5,
    commissions: true,
    fullHistory: true,
    reports: true,
    multiUnit: false,
    upgradeFor: {
      multiUnit: 'Premium',
      extraBarbers: 'Premium',
    },
  },
  Premium: {
    label: 'Premium',
    maxBarbers: Infinity,
    commissions: true,
    fullHistory: true,
    reports: true,
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
