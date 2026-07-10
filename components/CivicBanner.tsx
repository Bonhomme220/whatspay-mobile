export default function CivicBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-green-200 bg-green-50 ${compact ? "p-2.5" : "p-3"}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none">🏛️</span>
        <div>
          <p className="text-sm font-bold text-green-800">Campagne citoyenne · non rémunérée</p>
          <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
            Participation <b>libre</b>. Aucun gain — et <b>aucun impact sur ton compte</b>
            {" "}(ni suspension, ni pénalité) que tu participes ou non.
          </p>
        </div>
      </div>
    </div>
  );
}
