import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";

export default function PaymentsTab({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/my-payments`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        } else {
          console.error("Greška pri dohvatanju plaćanja");
        }
      } catch (error) {
        console.error("Greška:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return <div className="text-neutral-400">Učitavanje...</div>;
  }

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString("sr-RS")} RSD`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sr-RS");
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Kurs", "Datum", "Iznos", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center px-4 py-4 text-neutral-500">
                  Nema plaćanja
                </td>
              </tr>
            ) : (
              payments.map((p, idx) => (
                <tr key={idx} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 text-neutral-200 font-medium">{p.kursNaziv}</td>
                  <td className="px-4 py-3 text-neutral-400">{formatDate(p.datumPlacanja)}</td>
                  <td className="px-4 py-3 text-neutral-300">{formatCurrency(p.cenaPlacanja)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-900/20 text-emerald-400 border border-emerald-800/30">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}