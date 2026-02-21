'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// ── Constants ──────────────────────────────────────────────────────────────
const TOLA_TO_GRAM = 11.664;           // 1 ভরি = 11.664 গ্রাম
const NISAB_SILVER_GRAMS = 612.36;    // 52.5 তোলা রুপা
const ZAKAT_RATE = 0.025;              // 2.5%

// Karat to purity ratios (relative to 24K = 1.0)
const KARAT_RATIO: Record<string, number> = {
    '24': 1.000, '22': 0.9167, '21': 0.875, '18': 0.750,
};

interface GoldPrice {
    goldPer22KGram: number;
    goldPer24KGram: number;
    goldPer21KGram: number;
    goldPer18KGram: number;
    silverPerGram: number;
    fetchedAt: string | null;
    source: string;
}

interface FormData {
    // Step 1
    cashInHand: string;
    bankBalance: string;
    mobileWallet: string;
    loanedMoney: string;
    // Step 2
    goldAmount: string;
    goldUnit: 'bhari' | 'gram';
    goldKarat: '24' | '22' | '21' | '18';
    goldPricePerGram: string;        // editable by user
    silverAmount: string;
    silverUnit: 'bhari' | 'gram';
    silverPricePerGram: string;      // editable by user
    // Step 3
    stockValue: string;
    investmentValue: string;
    // Step 4
    bankLoan: string;
    familyLoan: string;
    outstandingSalary: string;
    outstandingRent: string;
}

const EMPTY_FORM: FormData = {
    cashInHand: '', bankBalance: '', mobileWallet: '', loanedMoney: '',
    goldAmount: '', goldUnit: 'bhari', goldKarat: '22', goldPricePerGram: '',
    silverAmount: '', silverUnit: 'bhari', silverPricePerGram: '',
    stockValue: '', investmentValue: '',
    bankLoan: '', familyLoan: '', outstandingSalary: '', outstandingRent: '',
};

const n = (v: string) => parseFloat(v || '0') || 0;
const sym = (currency: string) => currency === 'BDT' ? '৳' : currency === 'SAR' ? '﷼' : currency === 'GBP' ? '£' : currency === 'AED' ? 'د.إ' : currency === 'INR' ? '₹' : '$';
const fmt = (v: number, currency = 'BDT') => sym(currency) + Math.round(v).toLocaleString();
const fmtNum = (v: number) => Math.round(v).toLocaleString('bn-BD');

const STEPS_KEYS = ['cash', 'gold', 'business', 'debt'] as const;

// ── Input helper ────────────────────────────────────────────────────────────
function Field({ label, hint, value, onChange, prefix = '৳', suffix = '' }: {
    label: string; hint?: string; value: string;
    onChange: (v: string) => void; prefix?: string; suffix?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary-200">{label}</label>
            {hint && <p className="text-xs text-primary-400">{hint}</p>}
            <div className="flex items-center bg-primary-900/60 border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                {prefix && <span className="px-3 text-primary-400 text-sm border-r border-white/10">{prefix}</span>}
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent px-3 py-3 text-white text-sm outline-none placeholder:text-primary-600"
                />
                {suffix && <span className="px-3 text-primary-400 text-sm border-l border-white/10">{suffix}</span>}
            </div>
        </div>
    );
}

// ── EditablePrice component ─────────────────────────────────────────────────
function EditablePriceRow({ label, value, onChange, note, currency = 'BDT' }: {
    label: string; value: string; onChange: (v: string) => void; note?: string; currency?: string;
}) {
    const [editing, setEditing] = useState(false);
    const currSym = sym(currency);
    return (
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-emerald-300 font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    {editing ? (
                        <input
                            autoFocus
                            type="number" min="0" step="any"
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            onBlur={() => setEditing(false)}
                            className="w-32 bg-primary-900 border border-emerald-500/40 rounded-lg px-2 py-1 text-white text-sm text-right outline-none"
                        />
                    ) : (
                        <span className="text-white font-semibold text-base">{currSym}{parseFloat(value || '0').toLocaleString()}</span>
                    )}
                    <button
                        onClick={() => setEditing(!editing)}
                        title="দাম পরিবর্তন করুন"
                        className="text-emerald-400 hover:text-emerald-300 text-lg transition-colors"
                    >✐</button>
                </div>
            </div>
            {note && <p className="text-xs text-primary-400">💡 {note}</p>}
        </div>
    );
}

// ── Result Section ──────────────────────────────────────────────────────────
function ResultView({ data, onEdit, currency = 'BDT' }: { data: FormData; onEdit: () => void; currency?: string }) {
    const goldGrams = n(data.goldAmount) * (data.goldUnit === 'bhari' ? TOLA_TO_GRAM : 1);
    const goldBDT = goldGrams * n(data.goldPricePerGram);

    const silverGrams = n(data.silverAmount) * (data.silverUnit === 'bhari' ? TOLA_TO_GRAM : 1);
    const silverBDT = silverGrams * n(data.silverPricePerGram);

    const totalAssets =
        n(data.cashInHand) + n(data.bankBalance) + n(data.mobileWallet) + n(data.loanedMoney) +
        goldBDT + silverBDT +
        n(data.stockValue) + n(data.investmentValue);

    const totalLiabilities =
        n(data.bankLoan) + n(data.familyLoan) + n(data.outstandingSalary) + n(data.outstandingRent);

    const zakatableWealth = Math.max(0, totalAssets - totalLiabilities);
    const nisab = NISAB_SILVER_GRAMS * n(data.silverPricePerGram);
    const zakatDue = zakatableWealth >= nisab ? zakatableWealth * ZAKAT_RATE : 0;
    const isZakatWajib = zakatableWealth >= nisab;
    const printDate = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

    const handlePrint = () => window.print();

    // Inline style tokens — these override browser print white-bg defaults
    const S = {
        page: { background: '#030712', color: '#f1f5f9', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", padding: '2rem', borderRadius: '1rem' } as React.CSSProperties,
        header: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(16,185,129,0.3)' } as React.CSSProperties,
        logo: { width: 44, height: 44, background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 } as React.CSSProperties,
        appName: { fontSize: '1.1rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 } as React.CSSProperties,
        sub: { fontSize: '0.7rem', color: '#6ee7b7', letterSpacing: 1 } as React.CSSProperties,
        badge: (ok: boolean): React.CSSProperties => ({ background: ok ? 'rgba(6,95,70,0.5)' : 'rgba(127,29,29,0.4)', border: `1.5px solid ${ok ? '#10b981' : '#ef4444'}`, borderRadius: 14, padding: '0.9rem 1.1rem', marginBottom: '1rem' }),
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' } as React.CSSProperties,
        card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.85rem', textAlign: 'center' as const },
        cardVal: (c: string): React.CSSProperties => ({ fontSize: '1.05rem', fontWeight: 700, color: c === 'emerald' ? '#34d399' : c === 'red' ? '#f87171' : '#fff' }),
        cardLbl: { fontSize: '0.7rem', color: '#94a3b8', marginTop: 3 } as React.CSSProperties,
        breakdown: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem' } as React.CSSProperties,
        row: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.25rem 0', color: '#94a3b8' } as React.CSSProperties,
        rowVal: { color: '#fff' } as React.CSSProperties,
        rowRed: { color: '#f87171' } as React.CSSProperties,
        totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 700, padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', color: '#fff' } as React.CSSProperties,
        totalVal: { color: '#34d399', fontSize: '1.1rem' } as React.CSSProperties,
        footer: { marginTop: '1.2rem', fontSize: '0.65rem', color: '#475569', textAlign: 'center' as const, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' } as React.CSSProperties,
    };

    const breakdown = [
        ['নগদ টাকা', n(data.cashInHand)],
        ['ব্যাংক ব্যালেন্স', n(data.bankBalance)],
        ['মোবাইল ওয়ালেট', n(data.mobileWallet)],
        ['ধার দেওয়া টাকা', n(data.loanedMoney)],
        [`সোনা (${data.goldKarat}K, ${data.goldUnit === 'bhari' ? fmtNum(n(data.goldAmount)) + ' ভরি' : fmtNum(n(data.goldAmount)) + 'g'})`, goldBDT],
        [`রূপা (${data.silverUnit === 'bhari' ? fmtNum(n(data.silverAmount)) + ' ভরি' : fmtNum(n(data.silverAmount)) + 'g'})`, silverBDT],
        ['স্টক মূল্য', n(data.stockValue)],
        ['বিনিয়োগ', n(data.investmentValue)],
    ].filter(([, v]) => (v as number) > 0);

    return (
        <div className="space-y-6">
            {/* ── Screen render (Tailwind classes) ── */}
            <div className="screen-only space-y-4">
                {/* Nisab Badge */}
                <div className={`rounded-2xl p-5 border-2 ${isZakatWajib ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-red-900/20 border-red-500/30'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{isZakatWajib ? '✅' : '⚠️'}</span>
                        <h2 className="text-lg font-bold text-white">
                            {isZakatWajib ? 'আপনার উপর যাকাত ফরজ' : 'আপনার উপর যাকাত ফরজ নয়'}
                        </h2>
                    </div>
                    <p className="text-sm text-primary-300">
                        আজকের নিসাব (৫২.৫ তোলা রুপা) = <strong className="text-white">{fmt(nisab)}</strong>
                        {isZakatWajib ? ' — আপনার সম্পদ এর চেয়ে বেশি।' : ' — আপনার সম্পদ এখনও নিসাবের নিচে।'}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'মোট সম্পদ', value: totalAssets, icon: '📦', color: 'blue' },
                        { label: 'মোট ঋণ', value: totalLiabilities, icon: '📉', color: 'red' },
                        { label: 'যাকাতযোগ্য সম্পদ', value: zakatableWealth, icon: '⚖️', color: 'yellow' },
                        { label: 'প্রদেয় যাকাত (২.৫%)', value: zakatDue, icon: '🤲', color: 'emerald' },
                    ].map(c => (
                        <div key={c.label} className="bg-primary-900/60 border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">{c.icon}</div>
                            <div className={`text-xl font-bold ${c.color === 'emerald' ? 'text-emerald-400' : c.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                                {fmt(c.value)}
                            </div>
                            <div className="text-xs text-primary-400 mt-1">{c.label}</div>
                        </div>
                    ))}
                </div>

                {/* Breakdown */}
                <div className="bg-primary-900/40 border border-white/10 rounded-2xl p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-white mb-3">📋 বিস্তারিত হিসাব</h3>
                    {breakdown.map(([label, val]) => (
                        <div key={label as string} className="flex justify-between text-primary-300">
                            <span>{label as string}</span>
                            <span className="text-white">{fmt(val as number)}</span>
                        </div>
                    ))}
                    {totalLiabilities > 0 && (
                        <div className="flex justify-between text-red-400 border-t border-white/10 pt-2 mt-1">
                            <span>মোট দায় (বাদ)</span>
                            <span>{fmt(totalLiabilities)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2 mt-2">
                        <span>প্রদেয় যাকাত</span>
                        <span className="text-emerald-400 text-lg">{fmt(zakatDue)}</span>
                    </div>
                </div>
            </div>

            {/* ── Print-only branded section (inline styles force dark theme) ── */}
            <div className="print-only" style={S.page}>
                {/* Branded header */}
                <div style={S.header}>
                    <div style={S.logo}>🌙</div>
                    <div>
                        <div style={S.appName}>Nuzul Zakat Calculator</div>
                        <div style={S.sub}>নুযুল যাকাত ক্যালকুলেটর</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#64748b', textAlign: 'right' }}>
                        <div>{printDate}</div>
                        <div style={{ color: '#34d399', fontWeight: 600 }}>nuzul.xyz</div>
                    </div>
                </div>

                {/* Nisab status */}
                <div style={S.badge(isZakatWajib)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span>{isZakatWajib ? '✅' : '⚠️'}</span>
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                            {isZakatWajib ? 'যাকাত ফরজ' : 'যাকাত ফরজ নয়'}
                        </strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        নিসাব = <span style={{ color: '#fff' }}>{fmt(nisab)}</span>
                        {isZakatWajib ? ' | আপনার সম্পদ নিসাবের উপরে।' : ' | আপনার সম্পদ নিসাবের নিচে।'}
                    </div>
                </div>

                {/* Summary cards */}
                <div style={S.grid}>
                    {[
                        { label: 'মোট সম্পদ', value: totalAssets, color: 'white' },
                        { label: 'মোট ঋণ', value: totalLiabilities, color: 'red' },
                        { label: 'যাকাতযোগ্য সম্পদ', value: zakatableWealth, color: 'white' },
                        { label: 'প্রদেয় যাকাত (২.৫%)', value: zakatDue, color: 'emerald' },
                    ].map(c => (
                        <div key={c.label} style={S.card}>
                            <div style={S.cardVal(c.color)}>{fmt(c.value)}</div>
                            <div style={S.cardLbl}>{c.label}</div>
                        </div>
                    ))}
                </div>

                {/* Breakdown */}
                <div style={S.breakdown}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.6rem' }}>📋 বিস্তারিত হিসাব</div>
                    {breakdown.map(([label, val]) => (
                        <div key={label as string} style={S.row}>
                            <span>{label as string}</span>
                            <span style={S.rowVal}>{fmt(val as number)}</span>
                        </div>
                    ))}
                    {totalLiabilities > 0 && (
                        <div style={{ ...S.row, ...S.rowRed, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                            <span>মোট ঋণ (বাদ)</span>
                            <span>{fmt(totalLiabilities)}</span>
                        </div>
                    )}
                    <div style={S.totalRow}>
                        <span>প্রদেয় যাকাত</span>
                        <span style={S.totalVal}>{fmt(zakatDue)}</span>
                    </div>
                </div>

                <div style={S.footer}>
                    এই হিসাব Nuzul অ্যাপের মাধ্যমে তৈরি। যাকাত বিতরণের আগে একজন আলেমের পরামর্শ নিন।
                </div>
            </div>

            {/* Actions (hidden in print) */}
            <div className="flex gap-3 screen-only">
                <button
                    onClick={onEdit}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors"
                >← পুনরায় হিসাব করুন</button>
                <button
                    onClick={handlePrint}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >🖨️ PDF সংরক্ষণ / প্রিন্ট</button>
            </div>
        </div>
    );
}

// ── Main Wizard ─────────────────────────────────────────────────────────────
export default function ZakatCalculatorClient() {
    const t = useTranslations('ZakatPage');
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [prices, setPrices] = useState<GoldPrice | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [region, setRegion] = useState<'BD' | 'GLOBAL'>('BD');
    const [currency, setCurrency] = useState('BDT');

    const set = (key: keyof FormData) => (v: string) => setForm(f => ({ ...f, [key]: v }));
    const setAny = (key: keyof FormData, v: any) => setForm(f => ({ ...f, [key]: v }));

    // Fetch gold price on mount — region detected server-side from real IP
    useEffect(() => {
        fetch('/api/gold-price')
            .then(res => res.json())
            .then(d => {
                if (d.success && d.data) {
                    const p: GoldPrice = d.data;
                    setPrices(p);
                    // Use currency from server response
                    if (d.currency) setCurrency(d.currency);
                    if (d.region) setRegion(d.region);
                    setForm(f => ({
                        ...f,
                        goldPricePerGram: String(parseFloat(String(p[`goldPer${f.goldKarat}KGram` as keyof GoldPrice])).toFixed(2)),
                        silverPricePerGram: String(parseFloat(String(p.silverPerGram)).toFixed(2)),
                    }));
                }
            }).catch(() => { });
    }, []);

    // Update gold price when karat changes
    const handleKaratChange = useCallback((karat: string) => {
        setAny('goldKarat', karat as FormData['goldKarat']);
        if (prices) {
            const goldKey = `goldPer${karat}KGram` as keyof GoldPrice;
            setAny('goldPricePerGram', String(parseFloat(String(prices[goldKey])).toFixed(2)));
        }
    }, [prices]);

    const steps = [
        // ── Step 1 ────────────────────────────────────────────────────────
        <div key="s1" className="space-y-4">
            <div className="text-center mb-6">
                <span className="text-4xl">💵</span>
                <h2 className="text-xl font-bold text-white mt-2">নগদ ও সঞ্চয়</h2>
                <p className="text-sm text-primary-400">আপনার হাতে ও ব্যাংকে থাকা অর্থের পরিমাণ লিখুন</p>
            </div>
            <Field label="হাতে নগদ টাকা" value={form.cashInHand} onChange={set('cashInHand')} />
            <Field label="ব্যাংক ব্যালেন্স (সেভিংস/ডিপোজিট)" value={form.bankBalance} onChange={set('bankBalance')} />
            <Field label="মোবাইল ওয়ালেট" hint="বিকাশ, নগদ, রকেট" value={form.mobileWallet} onChange={set('mobileWallet')} />
            <Field label="অন্যকে ধার দেওয়া টাকা" hint="যা ফেরত পাওয়ার আশা আছে" value={form.loanedMoney} onChange={set('loanedMoney')} />
        </div>,

        // ── Step 2 ────────────────────────────────────────────────────────
        <div key="s2" className="space-y-4">
            <div className="text-center mb-6">
                <span className="text-4xl">🪙</span>
                <h2 className="text-xl font-bold text-white mt-2">সোনা ও রূপা</h2>
                <p className="text-sm text-primary-400">সোনা ও রূপার পরিমাণ এবং দাম লিখুন</p>
            </div>

            {/* Gold price editable */}
            {prices && (
                <div className="space-y-2">
                    <EditablePriceRow
                        label={`আজকের সোনার দাম (${form.goldKarat}K) — প্রতি গ্রাম`}
                        value={form.goldPricePerGram}
                        onChange={set('goldPricePerGram')}
                        note="আপনার স্থানীয় বাজারের সাথে মিল না থাকলে সঠিক দামটি বসিয়ে নিন।"
                        currency={currency}
                    />
                    <p className="text-xs text-primary-500 text-right">
                        উৎস: {prices.source} {prices.fetchedAt ? `• ${new Date(prices.fetchedAt).toLocaleDateString('bn-BD')}` : '• ডিফল্ট মান'}
                    </p>
                </div>
            )}

            {/* Karat selector */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-primary-200">সোনার ক্যারেট</label>
                <div className="grid grid-cols-4 gap-2">
                    {(['24', '22', '21', '18'] as const).map(k => (
                        <button key={k}
                            onClick={() => handleKaratChange(k)}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors border ${form.goldKarat === k ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-primary-900/60 border-white/10 text-primary-300 hover:border-emerald-500/30'}`}
                        >{k}K</button>
                    ))}
                </div>
            </div>

            {/* Gold amount */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-primary-200">সোনার পরিমাণ</label>
                <div className="flex gap-2">
                    {(['bhari', 'gram'] as const).map(u => (
                        <button key={u}
                            onClick={() => setAny('goldUnit', u)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.goldUnit === u ? 'bg-emerald-700 border-emerald-500 text-white' : 'bg-primary-900/60 border-white/10 text-primary-400'}`}
                        >{u === 'bhari' ? 'ভরি' : 'গ্রাম'}</button>
                    ))}
                </div>
                <Field label="" value={form.goldAmount} onChange={set('goldAmount')} prefix="" suffix={form.goldUnit === 'bhari' ? 'ভরি' : 'g'} />
                {n(form.goldAmount) > 0 && n(form.goldPricePerGram) > 0 && (
                    <p className="text-xs text-emerald-400 text-right">
                        ≈ {fmt(n(form.goldAmount) * (form.goldUnit === 'bhari' ? TOLA_TO_GRAM : 1) * n(form.goldPricePerGram), currency)}
                    </p>
                )}
            </div>

            {/* Silver price editable */}
            {prices && (
                <EditablePriceRow
                    label="আজকের রূপার দাম — প্রতি গ্রাম"
                    value={form.silverPricePerGram}
                    onChange={set('silverPricePerGram')}
                    note="নিসাব হিসাবে রূপার দর ব্যবহার করা হবে।"
                    currency={currency}
                />
            )}

            {/* Silver amount */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-primary-200">রূপার পরিমাণ</label>
                <div className="flex gap-2">
                    {(['bhari', 'gram'] as const).map(u => (
                        <button key={u}
                            onClick={() => setAny('silverUnit', u)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.silverUnit === u ? 'bg-emerald-700 border-emerald-500 text-white' : 'bg-primary-900/60 border-white/10 text-primary-400'}`}
                        >{u === 'bhari' ? 'ভরি' : 'গ্রাম'}</button>
                    ))}
                </div>
                <Field label="" value={form.silverAmount} onChange={set('silverAmount')} prefix="" suffix={form.silverUnit === 'bhari' ? 'ভরি' : 'g'} />
            </div>
        </div>,

        // ── Step 3 ────────────────────────────────────────────────────────
        <div key="s3" className="space-y-4">
            <div className="text-center mb-6">
                <span className="text-4xl">📊</span>
                <h2 className="text-xl font-bold text-white mt-2">ব্যবসা ও বিনিয়োগ</h2>
                <p className="text-sm text-primary-400">ব্যবসায়িক পণ্য ও শেয়ার বাজারে বিনিয়োগ</p>
            </div>

            {/* Tooltip */}
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 flex gap-2 text-sm text-blue-300">
                <span>ℹ️</span>
                <span>ব্যক্তিগত ব্যবহারের গাড়ি, বাড়ি বা জমির উপর যাকাত আসে না — শুধু বিক্রয়যোগ্য পণ্য ও ব্যবসায়িক সম্পদে আসে।</span>
            </div>

            <Field label="গোডাউন বা দোকানের পণ্যের বর্তমান মূল্য" hint="Stock value of sellable goods" value={form.stockValue} onChange={set('stockValue')} />
            <Field label="শেয়ার বাজার ও বন্ডে বিনিয়োগ" hint="Current market value" value={form.investmentValue} onChange={set('investmentValue')} />
        </div>,

        // ── Step 4 ────────────────────────────────────────────────────────
        <div key="s4" className="space-y-4">
            <div className="text-center mb-6">
                <span className="text-4xl">📉</span>
                <h2 className="text-xl font-bold text-white mt-2">ঋণ ও দায়</h2>
                <p className="text-sm text-primary-400">যাকাত হিসাবের আগে ঋণ বাদ দিতে হয়</p>
            </div>
            <Field label="ব্যাংক ঋণ (তাৎক্ষণিক কিস্তি)" hint="শুধু এই মাসে পরিশোধযোগ্য পরিমাণ" value={form.bankLoan} onChange={set('bankLoan')} />
            <Field label="পারিবারিক / ব্যক্তিগত ঋণ" value={form.familyLoan} onChange={set('familyLoan')} />
            <Field label="কর্মচারীদের বকেয়া বেতন" value={form.outstandingSalary} onChange={set('outstandingSalary')} />
            <Field label="দোকান ভাড়া বা অন্যান্য বকেয়া" value={form.outstandingRent} onChange={set('outstandingRent')} />
        </div>,
    ];

    if (showResult) {
        return (
            <ResultView data={form} currency={currency} onEdit={() => { setShowResult(false); setStep(0); }} />
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto space-y-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between">
                {STEPS_KEYS.map((key, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${i < step ? 'bg-emerald-600 border-emerald-500 text-white' : i === step ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300' : 'bg-primary-900/40 border-white/10 text-primary-500'}`}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] text-center leading-tight hidden sm:block ${i === step ? 'text-emerald-300' : 'text-primary-500'}`}>{t(`steps.${key}`)}</span>
                        {i < STEPS_KEYS.length - 1 && (
                            <div className={`hidden sm:block absolute h-0.5 w-8 mt-4 ${i < step ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="bg-primary-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-glass min-h-[400px]">
                {steps[step]}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                {step > 0 && (
                    <button
                        onClick={() => setStep((s: number) => s - 1)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
                    >{t('back')}</button>
                )}
                {step < STEPS_KEYS.length - 1 ? (
                    <button
                        onClick={() => setStep((s: number) => s + 1)}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-all"
                    >{t('next')}</button>
                ) : (
                    <button
                        onClick={() => setShowResult(true)}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-bold transition-all shadow-lg"
                    >{t('calculate')}</button>
                )}
            </div>

            {/* Step counter */}
            <p className="text-center text-xs text-primary-500">{t('step')} {step + 1} {t('of')} {STEPS_KEYS.length}</p>
        </div>
    );
}
