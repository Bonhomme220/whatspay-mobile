"use client";

// Formulaire du diffuseur, une question par écran : inscription (avant le compte) et confirmation
// des comptes existants (prérempli). Choix unique : passage automatique à la question suivante.
import { useMemo, useState } from "react";
import { Answers, ProfileQuestion, QUESTION_TEXT } from "@/lib/targeting";

const ACTIVE = ["A4", "A5", "A6", "A7", "A8"];
const LEVELS: [string, string][] = [["few", "Peu"], ["some", "Moyen"], ["many", "Beaucoup"]];

function applies(q: ProfileQuestion, a: Answers): boolean {
  if (q.when === "active") return ACTIVE.includes(String(a.status ?? ""));
  if (q.when === "parent") return ["1_2", "3_plus"].includes(String(a.children ?? ""));
  return true;
}

function Choice({ label, emoji, on, rank, onClick }: { label: string; emoji?: string | null; on: boolean; rank?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium ${on ? "border-green-600 bg-green-50" : "border-gray-200 bg-white"}`}>
      {emoji ? <span className="text-xl">{emoji}</span> : null}
      <span className="flex-1">{label}</span>
      {rank ? <span className="font-bold text-green-700">{rank}</span> : on ? <span className="text-green-700">✓</span> : null}
    </button>
  );
}

export default function ProfileWizard({ questions, onDone, onLater, saving, doneLabel }: {
  questions: ProfileQuestion[];
  onDone: (a: Answers) => void;
  onLater?: () => void;
  saving?: boolean;
  doneLabel: string;
}) {
  const [a, setA] = useState<Answers>(() => {
    const init: Answers = {};
    questions.forEach((q) => { if (q.value !== undefined && q.value !== null) init[q.key] = q.value; });
    return init;
  });
  const [i, setI] = useState(0);
  const [error, setError] = useState("");

  const steps = useMemo(() => questions.filter((q) => applies(q, a)), [questions, a]);
  const q = steps[Math.min(i, steps.length - 1)];
  const families = questions.find((x) => x.key === "interests")?.options ?? [];
  const options = q.key === "top3" ? families.filter((o) => ((a.interests as string[]) ?? []).includes(o.code)) : q.options;
  const value = a[q.key];
  const list = (value as string[]) ?? [];
  const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)
    || (q.type === "scale" && !Object.keys((value as object) ?? {}).length);
  const [title, help] = QUESTION_TEXT[q.key] ?? [q.key, ""];
  const prefilled = q.source && q.source !== "declared" && !q.confirmed;

  const advance = (next: Answers = a) => {
    setError("");
    const visible = questions.filter((x) => applies(x, next));
    if (i >= visible.length - 1) onDone(next);
    else setI(i + 1);
  };
  const pick = (code: string | boolean) => { const n = { ...a, [q.key]: code }; setA(n); advance(n); };
  const toggle = (code: string) => {
    if (list.includes(code)) { setA({ ...a, [q.key]: list.filter((x) => x !== code) }); return; }
    if (q.max && list.length >= q.max) return;
    setA({ ...a, [q.key]: [...list, code] });
  };
  const go = () => {
    if (q.required && empty) { setError("Choisis une réponse pour continuer."); return; }
    advance();
  };

  return (
    <div className="space-y-4">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-600" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="text-xs text-gray-500">Question {i + 1} sur {steps.length}</p>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{prefilled ? "Nous avons prérempli cette réponse. Confirme ou corrige." : help}</p>
      </div>

      <div className="space-y-2">
        {q.type === "single" && options.map((o) => <Choice key={o.code} label={o.label} emoji={o.emoji} on={value === o.code} onClick={() => pick(o.code)} />)}
        {q.type === "multi" && options.map((o) => <Choice key={o.code} label={o.label} emoji={o.emoji} on={list.includes(o.code)} onClick={() => toggle(o.code)} />)}
        {q.type === "ordered" && options.map((o) => {
          const rank = list.indexOf(o.code);
          return <Choice key={o.code} label={o.label} emoji={o.emoji} on={rank >= 0} rank={rank >= 0 ? rank + 1 : undefined} onClick={() => toggle(o.code)} />;
        })}
        {q.type === "boolean" && (
          <>
            <Choice label="Oui" on={value === true} onClick={() => pick(true)} />
            <Choice label="Non" on={value === false} onClick={() => pick(false)} />
          </>
        )}
        {q.type === "scale" && options.map((o) => (
          <div key={o.code} className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-sm font-medium">{o.label}</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {LEVELS.map(([l, label]) => (
                <Choice key={l} label={label} on={((value as Record<string, string>) ?? {})[o.code] === l}
                  onClick={() => setA({ ...a, [q.key]: { ...((value as object) ?? {}), [o.code]: l } })} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {q.max ? <p className="text-xs text-gray-500">{list.length}/{q.max}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-3">
        {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Retour</button>}
        {!q.required && empty
          ? <button type="button" onClick={() => advance()} className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Passer</button>
          : <button type="button" onClick={go} disabled={saving} className="flex-1 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60" style={{ backgroundColor: "#1ba24b" }}>
              {i >= steps.length - 1 ? doneLabel : "Continuer"}
            </button>}
      </div>
      {onLater && <button type="button" onClick={onLater} className="w-full text-sm text-gray-500 py-2">Plus tard</button>}
    </div>
  );
}
