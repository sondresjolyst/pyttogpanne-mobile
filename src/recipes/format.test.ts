import type { Recipe, RecipeIngredient } from '../api/types';
import { detailLine, groupIngredients, ingredientLine, scaleAmount, servingsFactor, summaryLine } from './format';

const ingredient = (overrides: Partial<RecipeIngredient> = {}): RecipeIngredient => ({
    id: 1,
    sortOrder: 0,
    groupName: null,
    amount: null,
    unit: null,
    name: 'havregryn',
    note: null,
    ...overrides,
});

const recipe = (overrides: Partial<Recipe> = {}): Recipe => ({
    id: 1,
    slug: 'turgrot',
    title: 'Turgrøt',
    intro: null,
    servings: 2,
    totalMinutes: 15,
    prepMinutes: 5,
    cookMinutes: 10,
    difficulty: 'Enkel',
    tips: null,
    coverImageId: null,
    isPublished: true,
    publishedAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    categories: [],
    ingredients: [],
    steps: [],
    ...overrides,
});

describe('scaleAmount', () => {
    it('leaves the amount untouched at the original serving count', () => {
        expect(scaleAmount('400', 1)).toBe('400');
    });

    it('scales a whole number', () => {
        expect(scaleAmount('400', 2)).toBe('800');
    });

    it('scales a decimal written with a comma, and writes it back with one', () => {
        expect(scaleAmount('2,5', 2)).toBe('5');
        expect(scaleAmount('0,5', 3)).toBe('1,5');
    });

    it('rounds to two decimals rather than showing floating point noise', () => {
        expect(scaleAmount('1', 1 / 3)).toBe('0,33');
    });

    it('scales both halves of a range', () => {
        expect(scaleAmount('2-3', 2)).toBe('4-6');
    });

    it('leaves an amount with no number in it alone', () => {
        expect(scaleAmount('en klype', 4)).toBe('en klype');
    });

    it('passes through a missing amount', () => {
        expect(scaleAmount(null, 2)).toBeNull();
    });
});

describe('ingredientLine', () => {
    it('joins amount, unit and name', () => {
        expect(ingredientLine(ingredient({ amount: '400', unit: 'g', name: 'torsk' }), 1)).toBe('400 g torsk');
    });

    it('skips the parts that are missing', () => {
        expect(ingredientLine(ingredient({ name: 'salt' }), 1)).toBe('salt');
        expect(ingredientLine(ingredient({ amount: '2', name: 'egg' }), 1)).toBe('2 egg');
    });

    it('scales the amount but never the name', () => {
        expect(ingredientLine(ingredient({ amount: '1', unit: 'dl', name: 'melk 1%' }), 2)).toBe('2 dl melk 1%');
    });
});

describe('groupIngredients', () => {
    it('keeps ungrouped ingredients in one run', () => {
        const groups = groupIngredients([ingredient({ id: 1 }), ingredient({ id: 2 })]);
        expect(groups).toHaveLength(1);
        expect(groups[0].heading).toBeNull();
        expect(groups[0].rows).toHaveLength(2);
    });

    it('starts a new group at each heading, in entry order', () => {
        const groups = groupIngredients([
            ingredient({ id: 1 }),
            ingredient({ id: 2, groupName: 'Til dressingen' }),
            ingredient({ id: 3, groupName: 'Til dressingen' }),
        ]);
        expect(groups.map(group => group.heading)).toEqual([null, 'Til dressingen']);
        expect(groups[1].rows.map(row => row.id)).toEqual([2, 3]);
    });

    it('does not merge two runs that share a heading but are separated', () => {
        const groups = groupIngredients([
            ingredient({ id: 1, groupName: 'Panna' }),
            ingredient({ id: 2, groupName: 'Dressing' }),
            ingredient({ id: 3, groupName: 'Panna' }),
        ]);
        expect(groups).toHaveLength(3);
    });
});

describe('servingsFactor', () => {
    it('is the ratio of wanted servings to the recipe as written', () => {
        expect(servingsFactor(recipe({ servings: 2 }), 4)).toBe(2);
    });

    it('falls back to 1 for a recipe that claims no servings, rather than dividing by zero', () => {
        expect(servingsFactor(recipe({ servings: 0 }), 4)).toBe(1);
    });
});

describe('summary and detail lines', () => {
    it('summarises servings, time and difficulty', () => {
        expect(summaryLine(recipe())).toBe('2 porsjoner · 15 min · enkel');
    });

    it('leaves out a time the recipe does not give', () => {
        expect(summaryLine(recipe({ totalMinutes: null }))).toBe('2 porsjoner · enkel');
    });

    it('spells out both times and lists the categories', () => {
        const withCategory = recipe({ categories: [{ id: 1, key: 'middag', name: 'Middag', sortOrder: 30 }] });
        expect(detailLine(withCategory)).toBe('5 min forberedelse · 10 min steking · enkel · Middag');
    });
});
