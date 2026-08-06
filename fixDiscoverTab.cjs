const fs = require('fs');
let content = fs.readFileSync('src/components/tabs/DiscoverTab.tsx', 'utf-8');

const newTagsState = `
  const [savedTags, setSavedTags] = useState<{label:string, query:string}[]>(() => {
    try {
      const saved = localStorage.getItem('sunofy_discover_tags');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { label: 'Language', query: 'Telugu Music' },
      { label: 'Genre', query: 'Melody Hits' },
      { label: 'Artist', query: 'Devi Sri Prasad' },
      { label: 'Singer', query: 'Sid Sriram' }
    ];
  });

  const [editingTagLabel, setEditingTagLabel] = useState<string | null>(null);
  const [newTagQuery, setNewTagQuery] = useState('');

  const handleUpdateTag = (label: string, newQuery: string) => {
    if (!newQuery.trim()) return;
    const updated = savedTags.map(t => t.label === label ? { ...t, query: newQuery.trim() } : t);
    setSavedTags(updated);
    localStorage.setItem('sunofy_discover_tags', JSON.stringify(updated));
    setSelectedTag(newQuery.trim());
    setEditingTagLabel(null);
  };
`;

const oldTopTagsRegex = /const topTags = \[\s*\{ label: 'Telugu Melodies'[\s\S]*?\];/;
content = content.replace(oldTopTagsRegex, newTagsState.trim());

const oldTagsRenderRegex = /\{\s*topTags\.map\(\(tag\) => \{[\s\S]*?\}\)\s*\}/;

const newTagsRender = `
        {savedTags.map((tag) => {
          const isActive = selectedTag === tag.query;
          if (editingTagLabel === tag.label) {
            return (
              <form key={tag.label} onSubmit={(e) => { e.preventDefault(); handleUpdateTag(tag.label, newTagQuery); }} className="flex items-center gap-1">
                <input autoFocus type="text" value={newTagQuery} onChange={e => setNewTagQuery(e.target.value)} onBlur={() => handleUpdateTag(tag.label, newTagQuery)} placeholder={\`Enter \${tag.label}...\`} className="bg-[var(--surface-sunofy)] text-xs text-[var(--text-sunofy)] px-3 py-1.5 rounded-full border border-[var(--border-sunofy)] focus:outline-none w-32" />
              </form>
            );
          }
          return (
            <button
              key={tag.label}
              onClick={() => setSelectedTag(tag.query)}
              onDoubleClick={() => { setEditingTagLabel(tag.label); setNewTagQuery(tag.query); }}
              className={\`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 shadow-sm border \${
                isActive
                  ? 'bg-[var(--accent-sunofy)] text-black border-[var(--accent-sunofy)] shadow-[var(--accent-sunofy)]/20'
                  : 'bg-[var(--surface-sunofy)] text-[var(--text-muted-sunofy)] border-[var(--border-sunofy)] hover:border-[var(--text-muted-sunofy)] hover:bg-[var(--border-sunofy)]'
              }\`}
            >
              <span className="font-bold mr-1 opacity-60">{tag.label}:</span> {tag.query}
            </button>
          );
        })}
        <div className="text-[10px] text-[var(--muted-sunofy)] ml-2 whitespace-nowrap opacity-70 flex items-center">(Double-click to edit)</div>
`;

content = content.replace(oldTagsRenderRegex, newTagsRender.trim());

fs.writeFileSync('src/components/tabs/DiscoverTab.tsx', content);
console.log('Updated DiscoverTab tags');
