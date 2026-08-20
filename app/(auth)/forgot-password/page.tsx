"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

type Country = { id: string; name: string; phone_code?: string | null };

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState("");
  const [local, setLocal]         = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Chargement des pays (avec indicatif) + sélection Bénin par défaut.
  useEffect(() => {
    api.get<Country[]>("/countries")
      .then((list) => {
        setCountries(list);
        const benin = list.find((c) => onlyDigits(c.phone_code ?? "") === "229");
        setCountryId(benin?.id ?? list[0]?.id ?? "");
      })
      .catch(() => {});
  }, []);

  const country = useMemo(() => countries.find((c) => c.id === countryId), [countries, countryId]);
  const code    = onlyDigits(country?.phone_code ?? "");
  const isBenin = code === "229";
  // Bénin : indicatif + « 01 » (nouveau format). Autres pays : indicatif seul.
  const prefix  = code ? `+${code}${isBenin ? " 01" : ""}` : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // On reconstruit le numéro complet : indicatif + (01 pour le Bénin) + saisie.
      const phone = `${code}${isBenin ? "01" : ""}${onlyDigits(local)}`;
      const res = await api.post<{ token: string; firstname?: string }>(
        "/auth/reset-verify-identity",
        { phone, birthdate }
      );
      const params = new URLSearchParams({ token: res.token });
      if (res.firstname) params.set("name", res.firstname);
      router.push(`/reset-password?${params.toString()}`);
    } catch (err: any) {
      setError(err?.message ?? "Les informations fournies ne correspondent à aucun compte.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "url('/login-bg.jpg') center/cover no-repeat fixed" }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white px-7 py-8 shadow-[0_0_37px_rgba(8,21,66,0.05)]">
        <div className="flex justify-center mb-7">
          <Image src="/logo.png" alt="WhatsPAY" width={160} height={50} className="object-contain" />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <h3 className="text-gray-800 text-lg font-semibold mb-1">Mot de passe oublié</h3>
        <p className="text-gray-500 text-sm mb-5">
          Confirmez votre identité pour réinitialiser votre mot de passe. Renseignez votre numéro de
          téléphone et votre date de naissance, exactement comme lors de votre inscription.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Pays</label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Numéro de téléphone</label>
            <div
              className="flex items-stretch rounded-lg border border-gray-200 overflow-hidden"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            >
              <span className="flex items-center px-3 text-sm font-semibold text-gray-600 border-r border-gray-200 whitespace-nowrap">
                {prefix || "+—"}
              </span>
              <input
                type="tel"
                required
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={isBenin ? "96 17 13 00" : "numéro"}
                className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>
            {isBenin && (
              <p className="text-xs text-gray-400 mt-1">Complétez les 8 chiffres après « 01 ».</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1.5">Date de naissance</label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              style={{ backgroundColor: "rgba(43,94,94,0.1)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-60"
            style={{ backgroundColor: "#1ba24b" }}
          >
            {loading ? "Vérification…" : "Vérifier mon identité"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-gray-500">
          <button onClick={() => router.push("/login")} className="font-medium" style={{ color: "#1ba24b" }}>
            ← Retour à la connexion
          </button>
        </p>
      </div>
    </div>
  );
}
