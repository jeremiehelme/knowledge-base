import { useState, useEffect } from "react";

const COMPANY_STAGES = ["Idea", "Pre-revenue", "Early traction", "Growth", "Established"];
const TEAM_SIZES = ["Solo", "2-5", "6-20", "21-50", "50+"];
const REVENUE_MODELS = ["Subscription", "One-time", "Marketplace", "Services", "Ads", "Not yet"];
const ASSISTANT_FOCUS = ["Strategy", "Marketing", "Sales", "Product", "Fundraising", "Operations", "Hiring", "Finance"];

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function PillSelect({ options, value, onChange, multi = false }) {
  function toggle(option) {
    if (multi) {
      const current = value || [];
      if (current.includes(option)) {
        onChange(current.filter((v) => v !== option));
      } else {
        onChange([...current, option]);
      }
    } else {
      onChange(value === option ? null : option);
    }
  }

  function isActive(option) {
    if (multi) return (value || []).includes(option);
    return value === option;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            isActive(option)
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
      {children}
    </h2>
  );
}

export default function ProfileView({ profile, saveProfile }) {
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    companyStage: null,
    teamSize: null,
    businessDescription: "",
    targetCustomers: "",
    revenueModel: [],
    goals: "",
    challenges: "",
    yourRole: "",
    competitors: "",
    assistantFocus: [],
    anythingElse: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || "",
        industry: profile.industry || "",
        companyStage: profile.companyStage || null,
        teamSize: profile.teamSize || null,
        businessDescription: profile.businessDescription || "",
        targetCustomers: profile.targetCustomers || "",
        revenueModel: profile.revenueModel || [],
        goals: profile.goals || "",
        challenges: profile.challenges || "",
        yourRole: profile.yourRole || "",
        competitors: profile.competitors || "",
        assistantFocus: profile.assistantFocus || [],
        anythingElse: profile.anythingElse || "",
      });
    }
  }, [profile]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const ok = await saveProfile({ ...form, onboardingCompleted: true });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold mb-6">Business Profile</h1>
      <form onSubmit={handleSave} className="max-w-2xl space-y-8">
        {/* Section 1 */}
        <div>
          <SectionHeading>The Basics</SectionHeading>
          <div className="space-y-4">
            <Field label="Company name">
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Acme Inc."
                className={inputClass}
              />
            </Field>
            <Field label="Industry">
              <input
                type="text"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                placeholder="e.g. SaaS"
                className={inputClass}
                list="industry-list"
              />
              <datalist id="industry-list">
                {["SaaS", "E-commerce", "Healthcare", "FinTech", "Education", "Agency", "Consulting", "Manufacturing", "Media", "Other"].map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </Field>
            <Field label="Company stage">
              <PillSelect
                options={COMPANY_STAGES}
                value={form.companyStage}
                onChange={(v) => set("companyStage", v)}
              />
            </Field>
            <Field label="Team size">
              <PillSelect
                options={TEAM_SIZES}
                value={form.teamSize}
                onChange={(v) => set("teamSize", v)}
              />
            </Field>
          </div>
        </div>

        {/* Section 2 */}
        <div>
          <SectionHeading>What You Do</SectionHeading>
          <div className="space-y-4">
            <Field label="Describe your business">
              <textarea
                rows={3}
                value={form.businessDescription}
                onChange={(e) => set("businessDescription", e.target.value)}
                placeholder="What does your company do?"
                className={inputClass}
              />
            </Field>
            <Field label="Target customers">
              <input
                type="text"
                value={form.targetCustomers}
                onChange={(e) => set("targetCustomers", e.target.value)}
                placeholder="Who do you sell to?"
                className={inputClass}
              />
            </Field>
            <Field label="Revenue model">
              <PillSelect
                options={REVENUE_MODELS}
                value={form.revenueModel}
                onChange={(v) => set("revenueModel", v)}
                multi
              />
            </Field>
          </div>
        </div>

        {/* Section 3 */}
        <div>
          <SectionHeading>Goals & Challenges</SectionHeading>
          <div className="space-y-4">
            <Field label="Current goals">
              <textarea
                rows={3}
                value={form.goals}
                onChange={(e) => set("goals", e.target.value)}
                placeholder="What are you trying to achieve in the next 6-12 months?"
                className={inputClass}
              />
            </Field>
            <Field label="Challenges">
              <textarea
                rows={3}
                value={form.challenges}
                onChange={(e) => set("challenges", e.target.value)}
                placeholder="What obstacles are you facing?"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {/* Section 4 */}
        <div>
          <SectionHeading>Context for your Assistant</SectionHeading>
          <div className="space-y-4">
            <Field label="Your role">
              <input
                type="text"
                value={form.yourRole}
                onChange={(e) => set("yourRole", e.target.value)}
                placeholder="e.g. CEO, Head of Marketing"
                className={inputClass}
              />
            </Field>
            <Field label="Competitors">
              <input
                type="text"
                value={form.competitors}
                onChange={(e) => set("competitors", e.target.value)}
                placeholder="Who are your main competitors?"
                className={inputClass}
              />
            </Field>
            <Field label="Assistant focus">
              <PillSelect
                options={ASSISTANT_FOCUS}
                value={form.assistantFocus}
                onChange={(v) => set("assistantFocus", v)}
                multi
              />
            </Field>
            <Field label="Anything else">
              <textarea
                rows={3}
                value={form.anythingElse}
                onChange={(e) => set("anythingElse", e.target.value)}
                placeholder="Anything else your Assistant should know?"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="pb-8">
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saved && (
              <p className="text-sm text-green-600 dark:text-green-400">Changes saved.</p>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Changes will apply to new conversations.
          </p>
        </div>
      </form>
    </div>
  );
}
