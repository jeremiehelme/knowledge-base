import { useState } from "react";

const STEPS = [
  {
    title: "The Basics",
    subtitle: "Tell us about your company so your Assistant can give you relevant advice.",
  },
  {
    title: "What You Do",
    subtitle: "Help your Assistant understand your business model and customers.",
  },
  {
    title: "Goals & Challenges",
    subtitle: "What are you working towards, and what's standing in your way?",
  },
  {
    title: "Context for your Assistant",
    subtitle: "Fine-tune how your Assistant helps you day to day.",
  },
];

const COMPANY_STAGES = ["Idea", "Pre-revenue", "Early traction", "Growth", "Established"];
const TEAM_SIZES = ["Solo", "2-5", "6-20", "21-50", "50+"];
const REVENUE_MODELS = ["Subscription", "One-time", "Marketplace", "Services", "Ads", "Not yet"];
const ASSISTANT_FOCUS = ["Strategy", "Marketing", "Sales", "Product", "Fundraising", "Operations", "Hiring", "Finance"];

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

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

export default function OnboardingWizard({ onComplete, onSkip, saveProfile }) {
  const [step, setStep] = useState(0);
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
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!form.companyName.trim()) errs.companyName = "Required";
      if (!form.companyStage) errs.companyStage = "Required";
      if (!form.teamSize) errs.teamSize = "Required";
    }
    if (s === 1) {
      if (!form.businessDescription.trim()) errs.businessDescription = "Required";
      if (!form.targetCustomers.trim()) errs.targetCustomers = "Required";
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    await saveProfile({ ...form, onboardingCompleted: true });
    onComplete();
  }

  async function handleSkip() {
    await saveProfile({ onboardingCompleted: false, onboardingSkipped: true });
    onSkip();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {step + 1} of {STEPS.length}
            </span>
            {step === 0 && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Skip for now
              </button>
            )}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {STEPS[step].title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {STEPS[step].subtitle}
            </p>
          </div>

          <div className="space-y-5">
            {step === 0 && (
              <>
                <Field label="Company name" required>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    placeholder="Acme Inc."
                    className={inputClass}
                    list="industry-suggestions"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>
                  )}
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
                <Field label="Company stage" required>
                  <PillSelect
                    options={COMPANY_STAGES}
                    value={form.companyStage}
                    onChange={(v) => set("companyStage", v)}
                  />
                  {errors.companyStage && (
                    <p className="mt-1 text-xs text-red-500">{errors.companyStage}</p>
                  )}
                </Field>
                <Field label="Team size" required>
                  <PillSelect
                    options={TEAM_SIZES}
                    value={form.teamSize}
                    onChange={(v) => set("teamSize", v)}
                  />
                  {errors.teamSize && (
                    <p className="mt-1 text-xs text-red-500">{errors.teamSize}</p>
                  )}
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Describe your business" required>
                  <textarea
                    rows={3}
                    value={form.businessDescription}
                    onChange={(e) => set("businessDescription", e.target.value)}
                    placeholder="What does your company do?"
                    className={inputClass}
                  />
                  {errors.businessDescription && (
                    <p className="mt-1 text-xs text-red-500">{errors.businessDescription}</p>
                  )}
                </Field>
                <Field label="Target customers" required>
                  <input
                    type="text"
                    value={form.targetCustomers}
                    onChange={(e) => set("targetCustomers", e.target.value)}
                    placeholder="Who do you sell to?"
                    className={inputClass}
                  />
                  {errors.targetCustomers && (
                    <p className="mt-1 text-xs text-red-500">{errors.targetCustomers}</p>
                  )}
                </Field>
                <Field label="Revenue model">
                  <PillSelect
                    options={REVENUE_MODELS}
                    value={form.revenueModel}
                    onChange={(v) => set("revenueModel", v)}
                    multi
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
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
              </>
            )}

            {step === 3 && (
              <>
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
              </>
            )}
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
