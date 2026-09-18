import type { Recipe } from '../api/types';
import { merge } from './merge';

const recipe = (slug: string, publishedAt: string): Recipe => ({
    id: slug.length,
    slug,
    title: slug,
    intro: null,
    servings: 2,
    totalMinutes: null,
    prepMinutes: null,
    cookMinutes: null,
    difficulty: 'Enkel',
    tips: null,
    coverImageId: null,
    isPublished: true,
    publishedAt,
    updatedAt: publishedAt,
    categories: [],
    ingredients: [],
    steps: [],
});

describe('merge', () => {
    it('keeps what is cached when the delta is empty', () => {
        const cached = [recipe('turgrot', '2026-01-01T00:00:00Z')];
        expect(merge(cached, [], []).map(r => r.slug)).toEqual(['turgrot']);
    });

    it('replaces a cached recipe with the changed one, rather than listing it twice', () => {
        const cached = [recipe('turgrot', '2026-01-01T00:00:00Z')];
        const changed = [{ ...recipe('turgrot', '2026-01-01T00:00:00Z'), title: 'Turgrøt med bær' }];

        const merged = merge(cached, changed, []);
        expect(merged).toHaveLength(1);
        expect(merged[0].title).toBe('Turgrøt med bær');
    });

    it('drops a slug the server reports as gone', () => {
        const cached = [recipe('turgrot', '2026-01-01T00:00:00Z'), recipe('fiskesuppe', '2026-02-01T00:00:00Z')];
        expect(merge(cached, [], ['turgrot']).map(r => r.slug)).toEqual(['fiskesuppe']);
    });

    it('applies deletions after changes, so a recipe deleted in the same delta does not linger', () => {
        const cached = [recipe('turgrot', '2026-01-01T00:00:00Z')];
        const changed = [recipe('fiskesuppe', '2026-02-01T00:00:00Z')];
        expect(merge(cached, changed, ['fiskesuppe']).map(r => r.slug)).toEqual(['turgrot']);
    });

    it('sorts newest first, so the list opens on what was published last', () => {
        const cached = [recipe('eldst', '2026-01-01T00:00:00Z')];
        const changed = [recipe('nyest', '2026-03-01T00:00:00Z'), recipe('midt', '2026-02-01T00:00:00Z')];
        expect(merge(cached, changed, []).map(r => r.slug)).toEqual(['nyest', 'midt', 'eldst']);
    });

    it('falls back to the updated date for a recipe with no published date', () => {
        const undated = { ...recipe('utkast', '2026-05-01T00:00:00Z'), publishedAt: null };
        const merged = merge([recipe('gammel', '2026-01-01T00:00:00Z')], [undated], []);
        expect(merged.map(r => r.slug)).toEqual(['utkast', 'gammel']);
    });
});
