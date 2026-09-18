import type { Recipe, RecipeIngredient } from '../api/types';

/** Scales the numbers in an amount, leaving anything unparseable ("en klype") alone. */
export function scaleAmount(amount: string | null, factor: number): string | null {
    if (!amount) return amount;
    if (factor === 1) return amount;

    return amount.replace(/\d+(?:[.,]\d+)?/g, match => {
        const scaled = Number(match.replace(',', '.')) * factor;
        if (!Number.isFinite(scaled)) return match;
        const rounded = Math.round(scaled * 100) / 100;
        return String(rounded).replace('.', ',');
    });
}

export function ingredientLine(ingredient: RecipeIngredient, factor: number): string {
    return [scaleAmount(ingredient.amount, factor), ingredient.unit, ingredient.name]
        .filter(part => part != null && part !== '')
        .join(' ');
}

/** Consecutive ingredients under the same heading, in the order the admin entered them. */
export function groupIngredients(ingredients: RecipeIngredient[]): { heading: string | null; rows: RecipeIngredient[] }[] {
    const groups: { heading: string | null; rows: RecipeIngredient[] }[] = [];
    for (const ingredient of ingredients) {
        const heading = ingredient.groupName ?? null;
        const last = groups[groups.length - 1];
        if (last && last.heading === heading) last.rows.push(ingredient);
        else groups.push({ heading, rows: [ingredient] });
    }
    return groups;
}

export function servingsFactor(recipe: Recipe, servings: number): number {
    return recipe.servings > 0 ? servings / recipe.servings : 1;
}

export function summaryLine(recipe: Recipe): string {
    const parts = [`${recipe.servings} porsjoner`];
    if (recipe.totalMinutes != null) parts.push(`${recipe.totalMinutes} min`);
    parts.push(recipe.difficulty.toLowerCase());
    return parts.join(' · ');
}

export function detailLine(recipe: Recipe): string {
    const parts: string[] = [];
    if (recipe.prepMinutes != null) parts.push(`${recipe.prepMinutes} min forberedelse`);
    if (recipe.cookMinutes != null) parts.push(`${recipe.cookMinutes} min steking`);
    parts.push(recipe.difficulty.toLowerCase());
    if (recipe.categories.length > 0) parts.push(recipe.categories.map(category => category.name).join(', '));
    return parts.join(' · ');
}
