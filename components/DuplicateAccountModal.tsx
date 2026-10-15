"use client";

export interface DuplicateAccount {
  match: "phone" | "identity";
  message: string;
  account: { firstname: string | null; email_masked: string | null; created: string | null; active: boolean };
}

/**
 * Compte déjà existant détecté pendant l'inscription. Indices masqués seulement (prénom, email
 * masqué, mois de création). Même téléphone → on propose uniquement de se connecter ;
 * même nom + date de naissance → la personne peut continuer (homonyme).
 */
export default function DuplicateAccountModal({
  dup, onLogin, onForgot, onContinue, onClose,
}: {
  dup: DuplicateAccount;
  onLogin: () => void;
  onForgot: () => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const a = dup.account;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-gray-900 font-bold text-base">Tu as peut-être déjà un compte</h2>
          <p className="text-gray-600 text-sm mt-1">{dup.message}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5 text-sm">
          {a.firstname && <Row label="Prénom" value={a.firstname} />}
          {a.email_masked && <Row label="Email" value={a.email_masked} />}
          {a.created && <Row label="Créé en" value={a.created} />}
          {!a.active && <p className="text-amber-700 text-xs pt-1">Ce compte est actuellement désactivé.</p>}
        </div>

        <div className="space-y-2">
          <button type="button" onClick={onLogin}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: "#1ba24b" }}>
            Me connecter à ce compte
          </button>
          <button type="button" onClick={onForgot}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">
            J'ai oublié mon mot de passe
          </button>
          {dup.match === "identity" ? (
            <button type="button" onClick={onContinue} className="w-full py-2 text-gray-500 text-xs underline">
              Ce n'est pas mon compte, continuer l'inscription
            </button>
          ) : (
            <p className="text-gray-400 text-[11px] text-center">
              Un seul compte par personne : un numéro ne peut pas être utilisé pour un second compte.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right break-all">{value}</span>
    </div>
  );
}
