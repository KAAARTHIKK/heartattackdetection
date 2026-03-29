export default function NLPReport({ report, riskLevel }) {
  if (!report) {
    return (
      <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-400 italic">
        AI report not available for this assessment.
      </div>
    );
  }

  const paragraphs = report
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const disclaimer = paragraphs.find(p => p.toLowerCase().startsWith('disclaimer'));
  const body = paragraphs.filter(p => !p.toLowerCase().startsWith('disclaimer'));

  return (
    <div>
      {/* Icon header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#131b2e' }}>
          <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7c839b' }}>AI Clinical Report</p>
          <p className="text-sm font-semibold" style={{ color: '#191c1e' }}>Personalised Analysis</p>
        </div>
      </div>

      {/* 3-column grid for paragraphs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {body.map((para, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: '#f7f9fb' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#45464d' }}>{para}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="flex items-start gap-2 p-4 rounded-xl border" style={{ background: '#fff8f0', borderColor: '#fde68a' }}>
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>{disclaimer}</p>
        </div>
      )}
    </div>
  );
}
