export default function EmptyState({
  isFiltered,
  searchQuery,
}: {
  isFiltered: boolean;
  searchQuery: string;
}) {
  if (isFiltered || searchQuery) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h2 className="empty-title">No matches found</h2>
        <p className="empty-subtitle">
          Try adjusting your search or clearing the category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-icon">⚡</div>
      <h2 className="empty-title">Your knowledge base is empty</h2>
      <p className="empty-subtitle">
        Paste your first Instagram Reel, YouTube Short, or TikTok link above.
        InstaSum will extract the transcript, summarize the key insights with AI,
        and save everything permanently — ready to search anytime.
      </p>
    </div>
  );
}
