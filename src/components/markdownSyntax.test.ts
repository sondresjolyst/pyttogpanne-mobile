import { bulletsOf, cellsOf, isTable, linkTarget, parseTable, tokenize } from './markdownSyntax';

describe('tokenize', () => {
    it('leaves a plain line as one run', () => {
        expect(tokenize('Kok opp vatn.')).toEqual([{ kind: 'text', text: 'Kok opp vatn.' }]);
    });

    it('pulls a link out with its text and target', () => {
        expect(tokenize('Se [personvern](/no/privacy) for detaljer.')).toEqual([
            { kind: 'text', text: 'Se ' },
            { kind: 'link', text: 'personvern', href: '/no/privacy' },
            { kind: 'text', text: ' for detaljer.' },
        ]);
    });

    it('handles several marks in one line', () => {
        expect(tokenize('**Sletting:** ta kontakt via [Instagram](https://example.test).')).toEqual([
            { kind: 'bold', text: 'Sletting:' },
            { kind: 'text', text: ' ta kontakt via ' },
            { kind: 'link', text: 'Instagram', href: 'https://example.test' },
            { kind: 'text', text: '.' },
        ]);
    });

    it('reads code spans, which the cookie table uses for cookie names', () => {
        expect(tokenize('`next-auth.csrf-token`')).toEqual([{ kind: 'code', text: 'next-auth.csrf-token' }]);
    });

    it('is reusable: a shared regex must not carry its position between calls', () => {
        const line = 'Se [vilkår](/no/terms).';
        expect(tokenize(line)).toEqual(tokenize(line));
    });

    it('leaves an unclosed mark as written rather than swallowing the rest', () => {
        expect(tokenize('Se [personvern(/no/privacy')).toEqual([{ kind: 'text', text: 'Se [personvern(/no/privacy' }]);
    });
});

describe('isTable', () => {
    it('recognises a markdown table by its alignment row', () => {
        expect(isTable('| Navn | Formål |\n| --- | --- |\n| `a` | Holder deg innlogget |')).toBe(true);
    });

    it('does not mistake a paragraph with a pipe in it for a table', () => {
        expect(isTable('Bruk gassbrenner | eller bål.')).toBe(false);
    });
});

describe('parseTable', () => {
    it('reads the headers and every row', () => {
        const table = parseTable('| Navn | Formål | Varighet |\n| --- | --- | --- |\n| `a` | Innlogging | Økt |');
        expect(table.headers).toEqual(['Navn', 'Formål', 'Varighet']);
        expect(table.rows).toEqual([['`a`', 'Innlogging', 'Økt']]);
    });

    it('trims the outer pipes and the padding', () => {
        expect(cellsOf('|  a  |  b  |')).toEqual(['a', 'b']);
    });
});

describe('bulletsOf', () => {
    it('reads one item per line', () => {
        expect(bulletsOf('- Innsyn\n- Sletting')).toEqual(['Innsyn', 'Sletting']);
    });

    it('keeps a wrapped item as one bullet', () => {
        const list = [
            '- **Favoritter og handleliste:** lagres på telefonen din. De sendes ikke til oss, og vi har ingen',
            '  tilgang til dem.',
            '- **Bruksdata:** enkle tjenerlogger.',
        ].join('\n');

        expect(bulletsOf(list)).toEqual([
            '**Favoritter og handleliste:** lagres på telefonen din. De sendes ikke til oss, og vi har ingen tilgang til dem.',
            '**Bruksdata:** enkle tjenerlogger.',
        ]);
    });
});

describe('linkTarget', () => {
    it('keeps a link to another legal page inside the app', () => {
        expect(linkTarget('/no/privacy')).toEqual({ kind: 'legal', key: 'privacy' });
        expect(linkTarget('/no/cookies')).toEqual({ kind: 'legal', key: 'cookies' });
    });

    it('sends anything else out to the browser', () => {
        expect(linkTarget('https://www.instagram.com/pyttogpanne/'))
            .toEqual({ kind: 'external', href: 'https://www.instagram.com/pyttogpanne/' });
    });
});
