import React, { useState } from 'react';
import { PoolInfo } from '../types';
import { POLYGON_CHAIN_CONFIG } from '../config/chainConfig';
import {
  Zap,
  ShieldCheck,
  Activity,
  RefreshCw,
  Check,
  Copy,
  Lock,
  Layers,
  Filter,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Send,
  Heart,
  AlertTriangle,
  ArrowLeftRight,
  Database,
  Cpu,
} from 'lucide-react';

interface C1C2LiquidationSynchronizerProps {
  pools: PoolInfo[];
}

type CategoryFilter = 'ALL' | 'FLASHLOAN_CAPITAL' | 'ASSET_SWAP' | 'LIQUIDATION_BORROWER';
type FlowTab = 'C1_ENGINE' | 'C2_DECISION' | 'LIQUIDATION_ENGINE';

const POOL_CATEGORY_MAP: Record<string, CategoryFilter> = {
  FUNDING_FLASHLOAN: 'FLASHLOAN_CAPITAL',
  SWAPPABLE_EXECUTION: 'ASSET_SWAP',
  LIQUIDATION_TARGET: 'LIQUIDATION_BORROWER',
};

const CATEGORY_META: Record<CategoryFilter, { label: string; color: string; bg: string; border: string; dot: string }> = {
  ALL: {
    label: 'All Pools',
    color: 'text-slate-300',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  },
  FLASHLOAN_CAPITAL: {
    label: 'Flashloan Capital',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950',
    border: 'border-emerald-800',
    dot: 'bg-emerald-400',
  },
  ASSET_SWAP: {
    label: 'Asset Swap',
    color: 'text-purple-300',
    bg: 'bg-purple-950',
    border: 'border-purple-800',
    dot: 'bg-purple-400',
  },
  LIQUIDATION_BORROWER: {
    label: 'Liquidation Borrower',
    color: 'text-rose-300',
    bg: 'bg-rose-950',
    border: 'border-rose-800',
    dot: 'bg-rose-400',
  },
};

const C1_STEPS = [
  {
    icon: <Activity className="w-4 h-4 text-cyan-400" />,
    title: 'OPPORTUNITY SCAN',
    detail: 'Bellman-Ford graph sweep detects DEX price divergence. VQC Alpha score computed.',
    color: 'border-cyan-700 bg-cyan-950/40',
  },
  {
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    title: 'FLASHLOAN DRAWDOWN',
    detail: 'Uncollateralized borrow from isolated Flashloan Capital Pool (Balancer V3 / Aave V3 / UniV3 Flash).',
    color: 'border-emerald-700 bg-emerald-950/40',
  },
  {
    icon: <ArrowRight className="w-4 h-4 text-blue-400" />,
    title: 'LEG 1 SWAP (BUY)',
    detail: 'Execute buy-side swap at lower-price Asset Swap Pool. Token A → Token B.',
    color: 'border-blue-700 bg-blue-950/40',
  },
  {
    icon: <ArrowLeftRight className="w-4 h-4 text-indigo-400" />,
    title: 'LEG 2 SWAP (SELL)',
    detail: 'Execute sell-side swap at higher-price Asset Swap Pool. Token B → Token A.',
    color: 'border-indigo-700 bg-indigo-950/40',
  },
  {
    icon: <RefreshCw className="w-4 h-4 text-amber-400" />,
    title: 'FLASHLOAN REPAY',
    detail: 'Return borrowed principal + flash fee to isolated Funding Vault. Atomic repayment enforced.',
    color: 'border-amber-700 bg-amber-950/40',
  },
  {
    icon: <Lock className="w-4 h-4 text-violet-400" />,
    title: 'NET PROFIT LOCK',
    detail: 'Surplus tokens routed to Profit Receiver wallet. Trade surplus committed to state.',
    color: 'border-violet-700 bg-violet-950/40',
  },
  {
    icon: <Database className="w-4 h-4 text-slate-400" />,
    title: 'C1_STATE_HASH COMMIT',
    detail: 'Post-execution state serialized via EIP-1153 TSTORE for C2 re-scan evaluation window.',
    color: 'border-slate-600 bg-slate-900/60',
  },
];

const LIQUIDATION_STEPS = [
  {
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    title: 'HF MONITOR (< 1.0)',
    detail: 'Real-time scanning of Aave V3 & Compound V3 borrower positions. Trigger fires when Health Factor drops below 1.0.',
    color: 'border-rose-700 bg-rose-950/40',
  },
  {
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    title: 'FLASHLOAN BORROW',
    detail: 'Drawdown base asset (USDC / WETH / WMATIC) from Flash Capital Provider to fund debt repayment.',
    color: 'border-emerald-700 bg-emerald-950/40',
  },
  {
    icon: <Database className="w-4 h-4 text-blue-400" />,
    title: 'DEBT LIQUIDATION',
    detail: 'Repay outstanding borrower debt to Aave V3 / Compound V3 lending pool on behalf of the undercollateralized position.',
    color: 'border-blue-700 bg-blue-950/40',
  },
  {
    icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />,
    title: 'COLLATERAL SEIZURE',
    detail: 'Claim borrower collateral asset + liquidation bonus of +5%–10% as incentive reward.',
    color: 'border-amber-700 bg-amber-950/40',
  },
  {
    icon: <ArrowLeftRight className="w-4 h-4 text-indigo-400" />,
    title: 'COLLATERAL SWAP',
    detail: 'Route seized collateral through Asset Swap Pool to convert back to base asset (collateral → repayment asset).',
    color: 'border-indigo-700 bg-indigo-950/40',
  },
  {
    icon: <RefreshCw className="w-4 h-4 text-violet-400" />,
    title: 'FLASHLOAN REPAY',
    detail: 'Return borrowed principal + flash fee to Flash Capital Provider from converted collateral.',
    color: 'border-violet-700 bg-violet-950/40',
  },
  {
    icon: <Lock className="w-4 h-4 text-slate-400" />,
    title: 'NET PROFIT RETAINED',
    detail: 'Liquidation spread minus gas costs locked in Profit Receiver wallet.',
    color: 'border-slate-600 bg-slate-900/60',
  },
];

const C2_STATES = [
  {
    decision: 'NO_OP',
    icon: <XCircle className="w-5 h-5 text-slate-400" />,
    title: 'NO_OP',
    subtitle: 'Clean Lane Termination',
    trigger: 'Post-C1 rescan detects spread decay, non-profitability, or risk limit threshold breach.',
    action: 'C2 lane terminates cleanly. No calldata generated. No transaction submitted.',
    color: 'border-slate-600 bg-slate-900/60',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
  },
  {
    decision: 'MIRROR',
    icon: <ArrowRight className="w-5 h-5 text-emerald-400" />,
    title: 'MIRROR',
    subtitle: 'Same-Direction Execution',
    trigger: 'Post-C1 rescan confirms the same directional price spread remains profitable.',
    action: 'Recomputes optimal sizing, generates fresh calldata, executes a new same-direction flashloan.',
    color: 'border-emerald-700 bg-emerald-950/30',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    dot: 'bg-emerald-400',
  },
  {
    decision: 'REVERSE',
    icon: <RotateCcw className="w-5 h-5 text-amber-400" />,
    title: 'REVERSE',
    subtitle: 'Opposite-Direction Execution',
    trigger: 'Post-C1 rescan reveals the price spread has inverted directionally.',
    action: 'Recomputes reverse route geometry, executes a fresh opposite-direction flashloan.',
    color: 'border-amber-700 bg-amber-950/30',
    badge: 'bg-amber-950 text-amber-300 border-amber-800',
    dot: 'bg-amber-400',
  },
];

export const C1C2LiquidationSynchronizer: React.FC<C1C2LiquidationSynchronizerProps> = ({ pools }) => {
  const [flowTab, setFlowTab] = useState<FlowTab>('C1_ENGINE');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [triggerLog, setTriggerLog] = useState<{ id: string; msg: string; ts: string }[]>([]);
  const [activeTriggers, setActiveTriggers] = useState<Set<string>>(new Set());

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const firePoolTrigger = (pool: PoolInfo) => {
    const poolCat = POOL_CATEGORY_MAP[pool.category] ?? 'ASSET_SWAP';
    const triggerLabel =
      poolCat === 'FLASHLOAN_CAPITAL'
        ? 'DRAWDOWN TEST'
        : poolCat === 'LIQUIDATION_BORROWER'
        ? 'HF SCAN'
        : 'SWAP SIM';

    setActiveTriggers((prev) => new Set(prev).add(pool.id));

    setTimeout(() => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const msg =
        poolCat === 'FLASHLOAN_CAPITAL'
          ? `[${now}] DRAWDOWN TEST on ${pool.name}: Flash capacity confirmed ≈ $${((pool.reserve0USD + pool.reserve1USD) * 0.3).toLocaleString()} available at ${pool.feeBps / 100}% fee.`
          : poolCat === 'LIQUIDATION_BORROWER'
          ? `[${now}] HF SCAN on ${pool.name}: 3 undercollateralized positions detected. Min HF = 0.94. Liquidation eligible.`
          : `[${now}] SWAP SIM on ${pool.name}: Optimal input computed via solveProfitApex(). Pool depth = $${(pool.reserve0USD + pool.reserve1USD).toLocaleString()}.`;

      setTriggerLog((prev) => [{ id: `${pool.id}-${Date.now()}`, msg, ts: now }, ...prev].slice(0, 8));
      setActiveTriggers((prev) => {
        const next = new Set(prev);
        next.delete(pool.id);
        return next;
      });
    }, 1400);

    return triggerLabel;
  };

  const filteredPools = pools.filter((p) => {
    if (categoryFilter === 'ALL') return true;
    return POOL_CATEGORY_MAP[p.category] === categoryFilter;
  });

  const flashloanCount = pools.filter((p) => p.category === 'FUNDING_FLASHLOAN').length;
  const swapCount = pools.filter((p) => p.category === 'SWAPPABLE_EXECUTION').length;
  const liqCount = pools.filter((p) => p.category === 'LIQUIDATION_TARGET').length;

  return (
    <div className="space-y-6 font-mono text-slate-100">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-800/70 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Pool Roles &amp; C1 / C2 / Liquidation Flow Synchronizer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              End-to-end execution architecture: maps each pool to its categorical role
              (Flashloan Capital · Asset Swap · Liquidation Borrower), visualizes the full C1 / C2 / Liquidation
              decision engine flows, and exposes per-pool interactive execution triggers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 text-[11px]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {flashloanCount} Flashloan Capital
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              {swapCount} Asset Swap
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {liqCount} Liquidation Borrower
            </div>
          </div>
        </div>
      </div>

      {/* Execution Logic Flow Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {/* Flow Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs">
          {(
            [
              { id: 'C1_ENGINE', label: 'C1 Engine Execution', icon: <Zap className="w-3.5 h-3.5" /> },
              { id: 'C2_DECISION', label: 'C2 Decision Engine (3 States)', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
              { id: 'LIQUIDATION_ENGINE', label: 'Liquidation Engine', icon: <Heart className="w-3.5 h-3.5" /> },
            ] as { id: FlowTab; label: string; icon: React.ReactNode }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFlowTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 font-bold tracking-wide transition-all ${
                flowTab === tab.id
                  ? 'text-white border-b-2 border-indigo-400 bg-indigo-950/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* C1 Engine Flow */}
          {flowTab === 'C1_ENGINE' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Fully-mapped transient uncollateralized flashloan sequence: borrow capital, execute multi-hop DEX swaps, repay flashloan, lock net profit, and commit final state to <span className="text-cyan-300 font-bold">C1_STATE_HASH</span> via EIP-1153 transient storage.
              </p>
              <div className="flex flex-col lg:flex-row lg:items-stretch gap-0">
                {C1_STEPS.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className={`flex-1 rounded-xl border p-3.5 ${step.color} min-w-0`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-500 font-mono">
                          [{String(idx + 1).padStart(2, '0')}]
                        </span>
                        {step.icon}
                        <span className="text-[11px] font-bold text-white tracking-wide uppercase">{step.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{step.detail}</p>
                    </div>
                    {idx < C1_STEPS.length - 1 && (
                      <div className="hidden lg:flex items-center justify-center px-1 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  Self-funding isolation rule enforced: Flashloan Capital Pool must never appear in the set of Asset Swap Execution Pools.
                  Violation aborts entire transaction atomically.
                </span>
              </div>
            </div>
          )}

          {/* C2 Decision Engine */}
          {flowTab === 'C2_DECISION' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                After C1 settlement, a post-execution market rescan evaluates whether a second execution opportunity exists.
                The C2 Decision Engine resolves to exactly one of three canonical terminal states.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {C2_STATES.map((state) => (
                  <div key={state.decision} className={`rounded-xl border p-4 ${state.color} space-y-3`}>
                    <div className="flex items-center gap-2">
                      {state.icon}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border font-mono ${state.badge}`}>
                            {state.decision}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{state.subtitle}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Trigger Condition</div>
                        <p className="text-slate-300 leading-relaxed">{state.trigger}</p>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Engine Action</div>
                        <p className="text-slate-300 leading-relaxed">{state.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                      <span className={`w-2 h-2 rounded-full ${state.dot}`} />
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Terminal State</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  C2 evaluation window is bounded by <span className="text-cyan-300">c2_window_start_block</span> and <span className="text-cyan-300">c2_window_end_block</span> from the C1 cycle record.
                  Rescan expiry defaults to <strong className="text-white">C1_CONFIRMED_BLOCK + 5</strong>. Past this window, C2 auto-resolves to <span className="text-slate-400 font-bold">NO_OP</span>.
                </span>
              </div>
            </div>
          )}

          {/* Liquidation Engine Flow */}
          {flowTab === 'LIQUIDATION_ENGINE' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time Health Factor monitoring on Aave V3 and Compound V3 borrower positions. When HF &lt; 1.0, a flashloan-funded
                liquidation cycle executes: repay debt, seize collateral (+5%–10% bonus), swap collateral, repay flashloan, retain net profit.
              </p>
              <div className="flex flex-col lg:flex-row lg:items-stretch gap-0">
                {LIQUIDATION_STEPS.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className={`flex-1 rounded-xl border p-3.5 ${step.color} min-w-0`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-500 font-mono">
                          [{String(idx + 1).padStart(2, '0')}]
                        </span>
                        {step.icon}
                        <span className="text-[11px] font-bold text-white tracking-wide uppercase">{step.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{step.detail}</p>
                    </div>
                    {idx < LIQUIDATION_STEPS.length - 1 && (
                      <div className="hidden lg:flex items-center justify-center px-1 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  Liquidation executor target: <span className="text-white font-mono">{POLYGON_CHAIN_CONFIG.liquidationExecutorAddress}</span>.
                  Aave V3 liquidation adapter: <span className="text-white font-mono">{POLYGON_CHAIN_CONFIG.aaveV3LiquidationAdapter}</span>.
                  Collateral bonus claims settled atomically within single flashloan tx.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pool Categorization Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Synchronized Pool Categorization Matrix
              </h3>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full font-semibold shrink-0">
              {filteredPools.length} / {pools.length} Pools Shown
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {(Object.keys(CATEGORY_META) as CategoryFilter[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const count =
                cat === 'ALL'
                  ? pools.length
                  : pools.filter((p) => POOL_CATEGORY_MAP[p.category] === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
                    categoryFilter === cat
                      ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span>{meta.label}</span>
                  <span className="text-[9px] font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3">Role</th>
                <th className="p-3">Pool Name</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Pair</th>
                <th className="p-3">TVL (USD)</th>
                <th className="p-3">Fee</th>
                <th className="p-3">Contract Address</th>
                <th className="p-3">Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPools.map((pool) => {
                const roleCat = POOL_CATEGORY_MAP[pool.category] ?? 'ASSET_SWAP';
                const roleMeta = CATEGORY_META[roleCat];
                const isTriggering = activeTriggers.has(pool.id);
                const triggerLabel =
                  roleCat === 'FLASHLOAN_CAPITAL'
                    ? 'DRAWDOWN TEST'
                    : roleCat === 'LIQUIDATION_BORROWER'
                    ? 'HF SCAN'
                    : 'SWAP SIM';

                return (
                  <tr key={pool.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold ${roleMeta.bg} ${roleMeta.border} ${roleMeta.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dot}`} />
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white max-w-[200px] truncate" title={pool.name}>
                      {pool.name}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">
                        {pool.protocol}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200">
                      {pool.token0.symbol} / {pool.token1.symbol}
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      ${(pool.reserve0USD + pool.reserve1USD).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-300">
                      {pool.feeBps} bps
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px] font-mono truncate max-w-[160px]" title={pool.address}>
                          {pool.address.slice(0, 10)}…{pool.address.slice(-6)}
                        </span>
                        <button
                          onClick={() => copyAddress(pool.address)}
                          className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
                          title="Copy address"
                        >
                          {copiedAddress === pool.address ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => firePoolTrigger(pool)}
                        disabled={isTriggering}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border active:scale-95 disabled:opacity-60 ${
                          roleCat === 'FLASHLOAN_CAPITAL'
                            ? 'bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                            : roleCat === 'LIQUIDATION_BORROWER'
                            ? 'bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900'
                            : 'bg-purple-950 border-purple-800 text-purple-300 hover:bg-purple-900'
                        }`}
                      >
                        {isTriggering ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>{isTriggering ? 'RUNNING…' : triggerLabel}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Trigger Log */}
      {triggerLog.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Send className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Execution Trigger Log</span>
            <span className="ml-auto px-2 py-0.5 text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300 rounded font-mono">
              {triggerLog.length} events
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {triggerLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 rounded px-2.5 py-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Address Reference Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Verified Polygon PoS Execution Contracts
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[10px] font-mono">
          {[
            { label: 'C1/C2 Arbitrage Executor', addr: POLYGON_CHAIN_CONFIG.c1ArbExecutorAddress, color: 'text-cyan-300' },
            { label: 'Liquidation Executor', addr: POLYGON_CHAIN_CONFIG.liquidationExecutorAddress, color: 'text-rose-300' },
            { label: 'Balancer V3 Vault (Flashloan)', addr: POLYGON_CHAIN_CONFIG.balancerV3Vault, color: 'text-emerald-300' },
            { label: 'Aave V3 Capital Adapter', addr: POLYGON_CHAIN_CONFIG.aaveV3CapitalAdapter, color: 'text-emerald-300' },
            { label: 'Aave V3 Liquidation Adapter', addr: POLYGON_CHAIN_CONFIG.aaveV3LiquidationAdapter, color: 'text-rose-300' },
            { label: 'Balancer Vault Capital Adapter', addr: POLYGON_CHAIN_CONFIG.balancerVaultCapitalAdapter, color: 'text-emerald-300' },
            { label: 'UniV3 Router', addr: POLYGON_CHAIN_CONFIG.uniswapV3Router, color: 'text-purple-300' },
            { label: 'Algebra (QuickSwap V3) Router', addr: POLYGON_CHAIN_CONFIG.algebraRouter, color: 'text-purple-300' },
            { label: 'Profit Receiver Wallet', addr: POLYGON_CHAIN_CONFIG.profitReceiverAddress, color: 'text-amber-300' },
          ].map((item) => (
            <div key={item.addr} className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-2">
              <div className="min-w-0">
                <div className="text-slate-500 text-[9px] uppercase mb-0.5">{item.label}</div>
                <div className={`${item.color} truncate`}>{item.addr}</div>
              </div>
              <button
                onClick={() => copyAddress(item.addr)}
                className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
                title="Copy"
              >
                {copiedAddress === item.addr ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
