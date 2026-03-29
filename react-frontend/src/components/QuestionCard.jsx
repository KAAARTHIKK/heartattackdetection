const CATEGORY_ICONS = {
  Demographics: 'person',
  Symptoms: 'symptoms',
  Vitals: 'monitor_heart',
  'Lab Results': 'science',
  Diagnostics: 'ecg',
};

export default function QuestionCard({
  step, total, category, question, helper, children, onNext, onBack, direction,
}) {
  const icon = CATEGORY_ICONS[category] || 'help';
  const pct = Math.round((step / total) * 100);

  return (
    <div
      className={`relative overflow-hidden bg-white shadow-[0_20px_40px_rgba(15,23,42,0.06)] max-w-lg mx-auto ${
        direction === 'forward' ? 'slide-in-left' : 'slide-in-right'
      }`}
      style={{ borderRadius: '2rem', padding: '2.5rem 2rem' }}
    >
      {/* Watermark background icon */}
      <div className="absolute -bottom-6 -right-6 pointer-events-none select-none" aria-hidden>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '9rem',
            color: '#131b2e',
            opacity: 0.04,
            fontVariationSettings: "'FILL' 1",
          }}
        >
          {icon}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7c839b' }}>
            Step {step} of {total}
          </span>
          <span className="text-xs font-bold" style={{ color: '#006c49' }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#eceef0' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: '#006c49' }}
          />
        </div>
      </div>

      {/* Category icon */}
      <div className="flex justify-center mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: '#f7f9fb' }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '1.75rem', color: '#006c49', fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
      </div>

      {/* Category label */}
      <p
        className="text-center text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: '#006c49' }}
      >
        {category}
      </p>

      {/* Question */}
      <h2
        className="text-center text-2xl md:text-3xl font-bold mb-3 leading-tight"
        style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}
      >
        {question}
      </h2>

      {/* Helper */}
      {helper && (
        <p className="text-center text-base mb-6 leading-relaxed" style={{ color: '#7c839b' }}>
          {helper}
        </p>
      )}

      {/* Input area */}
      <div className="mb-6">{children}</div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mb-6">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step - 1 ? '1.5rem' : '0.375rem',
              height: '0.375rem',
              background: i < step ? '#006c49' : '#eceef0',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-full text-sm font-bold transition-all hover:bg-slate-50 active:scale-95"
            style={{ border: '2px solid #eceef0', color: '#45464d', fontFamily: 'Plus Jakarta Sans' }}
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
        >
          {step === total ? 'Review →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
