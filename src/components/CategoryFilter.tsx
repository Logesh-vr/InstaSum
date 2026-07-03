'use client';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  active: string; // '' means "All"
  onSelect: (name: string) => void;
  totalCount: number;
}

export default function CategoryFilter({
  categories,
  active,
  onSelect,
  totalCount,
}: CategoryFilterProps) {
  return (
    <div className="filter-scroll" role="tablist" aria-label="Filter by category">
      {/* "All" pill */}
      <button
        id="filter-all"
        role="tab"
        aria-selected={active === ''}
        className={`filter-pill ${active === '' ? 'active' : ''}`}
        onClick={() => onSelect('')}
      >
        All
        <span className="count">{totalCount}</span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          id={`filter-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
          role="tab"
          aria-selected={active === cat.name}
          className={`filter-pill ${active === cat.name ? 'active' : ''}`}
          onClick={() => onSelect(active === cat.name ? '' : cat.name)}
        >
          {cat.name}
          <span className="count">{cat.count}</span>
        </button>
      ))}
    </div>
  );
}
