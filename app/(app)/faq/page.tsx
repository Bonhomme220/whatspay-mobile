"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface FaqItem { id: string; question: string; answer: string; }

export default function FaqPage() {
  const [faqs, setFaqs]     = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]     = useState<string | null>(null);

  useEffect(() => {
    api.get<FaqItem[]>("/faq")
      .then(setFaqs)
      .catch(() => {}) // 401 géré globalement par wp:unauthorized dans le layout
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-green-600 px-5 pt-5 pb-14">
        <h1 className="text-white text-2xl font-bold">FAQ</h1>
        <p className="text-white/70 text-sm mt-0.5">Questions fréquentes</p>
      </div>

      <div className="mx-4 -mt-6 pb-10 space-y-3">

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Aucune question disponible pour l'instant.</p>
          </div>
        ) : faqs.map((faq) => (
          <div key={faq.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between px-4 py-4 text-left gap-3"
            >
              <span className="text-gray-800 text-sm font-semibold leading-snug flex-1">{faq.question}</span>
              <svg
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open === faq.id ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open === faq.id && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <p className="text-gray-500 text-sm leading-relaxed pt-3">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
