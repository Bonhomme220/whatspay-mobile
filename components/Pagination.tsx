"use client";

/**
 * Pagination simple (précédent / page courante / suivant) pour une liste déjà chargée
 * côté client — pas de rechargement réseau, juste un découpage par tranche de `pageSize`.
 */
export default function Pagination({
  page,
  totalItems,
  pageSize = 10,
  onChange,
}: {
  page: number;
  totalItems: number;
  pageSize?: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-50"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-gray-600 text-xs font-semibold">Page {page} / {totalPages}</span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center disabled:opacity-50"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
