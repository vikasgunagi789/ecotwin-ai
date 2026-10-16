
import { useEffect, useState } from "react";
import { Bell, Database, Palette, Save, ShieldCheck, Trash2 } from "lucide-react";

const KEY = "ecotwin_preferences";

function loadPreferences() {
  try {
    return {
      workspaceName: "Campus workspace",
      notifications: true,
      theme: "light",
      ...JSON.parse(localStorage.getItem(KEY) || "{}"),
    };
  } catch {
    return {
      workspaceName: "Campus workspace",
      notifications: true,
      theme: "light",
    };
  }
}

export default function WorkspaceSettings({ onClearHistory }) {
  const [prefs, setPrefs] = useState(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs.theme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [prefs.theme]);

  function update(key, value) {
    setPrefs((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1c412d]">
          Workspace Settings
        </h1>
        <p className="mt-2 text-sm text-[#77867a]">
          Manage preferences stored in this browser.
        </p>
      </div>

      <section className="rounded-2xl border border-[#e8eee8] bg-white p-6">
        <div className="flex items-center gap-3">
          <Database className="text-[#278354]" />
          <div>
            <h2 className="font-extrabold">Workspace</h2>
            <p className="text-xs text-[#829084]">Personalize your workspace label.</p>
          </div>
        </div>
        <label className="mt-5 block text-sm font-semibold">
          Workspace name
          <input
            value={prefs.workspaceName}
            onChange={(e) => update("workspaceName", e.target.value)}
            maxLength={60}
            className="mt-2 w-full rounded-xl border border-[#dfe8df] p-3 outline-none focus:border-[#58a77a]"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-[#e8eee8] bg-white p-6">
        <div className="flex items-center gap-3">
          <Bell className="text-[#278354]" />
          <div>
            <h2 className="font-extrabold">Notifications</h2>
            <p className="text-xs text-[#829084]">
              Preference only; browser push notifications are not configured.
            </p>
          </div>
        </div>
        <label className="mt-5 flex items-center justify-between gap-4 text-sm">
          Enable notification reminders
          <input
            type="checkbox"
            checked={prefs.notifications}
            onChange={(e) => update("notifications", e.target.checked)}
            className="h-5 w-5 accent-green-700"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-[#e8eee8] bg-white p-6">
        <div className="flex items-center gap-3">
          <Palette className="text-[#278354]" />
          <div>
            <h2 className="font-extrabold">Appearance</h2>
            <p className="text-xs text-[#829084]">
              Choose a stored theme preference.
            </p>
          </div>
        </div>
        <select
          value={prefs.theme}
          onChange={(e) => update("theme", e.target.value)}
          className="mt-5 rounded-xl border border-[#dfe8df] bg-white p-3 text-sm"
        >
          <option value="light">Light</option>
          <option value="dark">Dark preference</option>
        </select>
        {prefs.theme === "dark" && (
          <p className="mt-2 text-xs text-[#829084]">
            Dark preference is saved, but full dark styling requires dark-mode CSS across the app.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[#f1d9d5] bg-white p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#b95b4b]" />
          <div>
            <h2 className="font-extrabold">Data management</h2>
            <p className="text-xs text-[#829084]">
              Clearing history permanently deletes this browser's saved material records.
            </p>
          </div>
        </div>
        <button
          onClick={onClearHistory}
          className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          <Trash2 size={16} /> Clear scan history
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-xl bg-[#176b48] px-5 py-3 text-sm font-bold text-white"
        >
          <Save size={16} /> Save preferences
        </button>
        {saved && <p role="status" className="text-sm font-semibold text-[#278354]">Preferences saved.</p>}
      </div>
    </div>
  );
}
