import type { Recipe } from '../api/types';

/** Applies a delta to the cached recipes: changed ones replace, deleted slugs drop out. */
export function merge(cached: Recipe[], changed: Recipe[], deletedSlugs: string[]): Recipe[] {
    const bySlug = new Map(cached.map(recipe => [recipe.slug, recipe]));
    for (const recipe of changed) bySlug.set(recipe.slug, recipe);
    for (const slug of deletedSlugs) bySlug.delete(slug);

    return [...bySlug.values()].sort((a, b) => {
        const left = a.publishedAt ?? a.updatedAt;
        const right = b.publishedAt ?? b.updatedAt;
        return right.localeCompare(left);
    });
}
