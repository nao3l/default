import type { Citation } from '../../domain/expression';

export function CitationText({ citation }: { citation: Citation | undefined }) {
  if (!citation) return <span className="muted">出典未詳</span>;
  const label = citation.publisher ? `${citation.title}（${citation.publisher}）` : citation.title;
  if (!citation.url) return <>{label}</>;
  return (
    <a href={citation.url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}
