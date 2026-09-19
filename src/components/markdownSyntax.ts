/** The pieces of a line of markdown: plain runs, links, bold and code. */
export type InlineToken =
    | { kind: 'text'; text: string }
    | { kind: 'link'; text: string; href: string }
    | { kind: 'bold'; text: string }
    | { kind: 'code'; text: string };

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

export function tokenize(text: string): InlineToken[] {
    const tokens: InlineToken[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    INLINE.lastIndex = 0;
    while ((match = INLINE.exec(text)) != null) {
        if (match.index > lastIndex) tokens.push({ kind: 'text', text: text.slice(lastIndex, match.index) });

        const [, linkText, href, bold, code] = match;
        if (linkText != null && href != null) tokens.push({ kind: 'link', text: linkText, href });
        else if (bold != null) tokens.push({ kind: 'bold', text: bold });
        else if (code != null) tokens.push({ kind: 'code', text: code });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) tokens.push({ kind: 'text', text: text.slice(lastIndex) });
    return tokens;
}

/** A markdown table: a header row, an alignment row, then the rows themselves. */
export function isTable(text: string): boolean {
    const lines = text.split('\n');
    return lines.length >= 2 && lines[0].trim().startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[1].trim());
}

export function cellsOf(line: string): string[] {
    return line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

export interface Table {
    headers: string[];
    rows: string[][];
}

export function parseTable(text: string): Table {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return { headers: cellsOf(lines[0]), rows: lines.slice(2).map(cellsOf) };
}

/**
 * The items of a bullet list. A long item is wrapped across several lines in the source, and the
 * continuation lines belong to the item above rather than being items of their own.
 */
export function bulletsOf(text: string): string[] {
    const items: string[] = [];

    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed === '') continue;

        if (/^[-*]\s+/.test(trimmed)) items.push(trimmed.replace(/^[-*]\s+/, ''));
        else if (items.length > 0) items[items.length - 1] += ` ${trimmed}`;
        else items.push(trimmed);
    }

    return items;
}

/**
 * Where a link should go. Another legal page stays inside the app; anything else is external.
 */
export function linkTarget(href: string): { kind: 'legal'; key: string } | { kind: 'external'; href: string } {
    const legal = href.match(/^\/[a-z]{2}\/(terms|privacy|cookies)$/);
    return legal ? { kind: 'legal', key: legal[1] } : { kind: 'external', href };
}
