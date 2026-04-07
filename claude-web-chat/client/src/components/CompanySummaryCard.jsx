export default function CompanySummaryCard({ profile }) {
  if (!profile || !profile.companyName) return null;

  const items = [
    profile.companyName,
    profile.industry,
    profile.companyStage,
    profile.teamSize ? `Team: ${profile.teamSize}` : null,
  ].filter(Boolean);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Company</h2>
      </div>
      <p className="text-sm font-medium">{items.join(" · ")}</p>
      {profile.businessDescription && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.businessDescription}</p>
      )}
    </div>
  );
}
