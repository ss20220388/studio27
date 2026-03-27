import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.PUBLIC_API_URL || "http://api.studio27.rs";
export default function ProfileTab() {
  const [user, setUser] = useState({ ime: "", prezime: "", email: "", brojTelefona: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState({ old: "", new: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notif, setNotif] = useState({ email: true, sms: false });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          console.error("Greška pri dohvatanju podataka");
        }
      } catch (error) {
        console.error("Greška:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ime: user.ime,
          prezime: user.prezime,
          brojTelefona: user.brojTelefona,
        }),
      });

      if (response.ok) {
        setMessage("✓ Podaci sačuvani!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await response.json();
        setMessage("✗ " + (error.error || "Greška pri čuvanju"));
      }
    } catch (error) {
      console.error("Greška:", error);
      setMessage("✗ Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-neutral-400">Učitavanje...</div>;
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");

    if (!password.old || !password.new || !password.confirm) {
      setPasswordMessage("✗ Sva polja su obavezna");
      setPasswordSaving(false);
      return;
    }

    if (password.new !== password.confirm) {
      setPasswordMessage("✗ Nove lozinke se ne podudaraju");
      setPasswordSaving(false);
      return;
    }

    if (password.new.length < 6) {
      setPasswordMessage("✗ Lozinka mora imati najmanje 6 karaktera");
      setPasswordSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: password.old,
          newPassword: password.new,
          confirmPassword: password.confirm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage("✓ Lozinka uspešno promenjena");
        setPassword({ old: "", new: "", confirm: "" });
        setTimeout(() => setPasswordMessage(""), 3000);
      } else {
        setPasswordMessage("✗ " + (data.error || "Greška pri promeni lozinke"));
      }
    } catch (error) {
      console.error("Greška:", error);
      setPasswordMessage("✗ Greška pri promeni lozinke");
    } finally {
      setPasswordSaving(false);
    }
  };
  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <form className="space-y-4" onSubmit={handleSave}>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Ime</label>
          <input 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            value={user.ime || ""} 
            onChange={e => setUser(u => ({ ...u, ime: e.target.value }))} 
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Prezime</label>
          <input 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            value={user.prezime || ""} 
            onChange={e => setUser(u => ({ ...u, prezime: e.target.value }))} 
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email</label>
          <input 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            value={user.email || ""} 
            disabled
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Broj telefona</label>
          <input 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            value={user.brojTelefona || ""} 
            onChange={e => setUser(u => ({ ...u, brojTelefona: e.target.value }))} 
            placeholder="+381"
          />
        </div>
        <button 
          type="submit" 
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white text-sm font-medium transition-colors"
        >
          {saving ? "Čuvanje..." : "Sačuvaj promene"}
        </button>
        {message && (
          <div className={`text-xs ${message.startsWith("✓") ? "text-emerald-400 bg-emerald-900/20 border border-emerald-800/30" : "text-red-400 bg-red-900/20 border border-red-800/30"} rounded p-2`}>
            {message}
          </div>
        )}
      </form>
      <div className="border-t border-neutral-800 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Promena lozinke</h3>
        <form className="space-y-3" onSubmit={handleChangePassword}>
          <input 
            type="password" 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            placeholder="Stara lozinka" 
            value={password.old} 
            onChange={e => setPassword(p => ({ ...p, old: e.target.value }))} 
            required 
          />
          <input 
            type="password" 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            placeholder="Nova lozinka" 
            value={password.new} 
            onChange={e => setPassword(p => ({ ...p, new: e.target.value }))} 
            required 
          />
          <input 
            type="password" 
            className="w-full h-10 px-3 text-sm text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-lg outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all placeholder-neutral-600" 
            placeholder="Potvrdi novu lozinku" 
            value={password.confirm} 
            onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} 
            required 
          />
          <button 
            type="submit" 
            disabled={passwordSaving}
            className="w-full px-4 py-2 rounded-lg bg-red-900 hover:bg-red-800 disabled:bg-red-900/50 text-white text-sm font-medium transition-colors"
          >
            {passwordSaving ? "Čuvanje..." : "Promeni lozinku"}
          </button>
          {passwordMessage && (
            <div className={`text-xs ${passwordMessage.startsWith("✓") ? "text-emerald-400 bg-emerald-900/20 border border-emerald-800/30" : "text-red-400 bg-red-900/20 border border-red-800/30"} rounded p-2`}>
              {passwordMessage}
            </div>
          )}
        </form>
      </div>
    
    </div>
  );
}