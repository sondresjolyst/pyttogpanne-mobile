import { Fragment } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { bulletsOf, isTable, linkTarget, parseTable, tokenize } from './markdownSyntax';
import { colors, radius, space, type } from '../theme/theme';

/**
 * The markdown written in the admin console, as it actually appears: paragraphs, headings,
 * bullets, tables, links and bold. Rather than pull in a renderer for that, the marks that
 * show up are handled here and anything else is shown as written.
 */
export default function Markdown({ body }: { body: string }) {
    return (
        <View style={styles.wrap}>
            {body.split(/\n{2,}/).map((block, index) => (
                <Block key={index} text={block.trim()} />
            ))}
        </View>
    );
}

function Block({ text }: { text: string }) {
    if (text === '') return null;

    if (text.startsWith('## ')) {
        return <Text style={styles.heading}>{text.replace(/^##\s+/, '')}</Text>;
    }
    if (text.startsWith('# ')) {
        return <Text style={styles.headingLarge}>{text.replace(/^#\s+/, '')}</Text>;
    }
    if (isTable(text)) {
        return <TableBlock text={text} />;
    }
    if (/^[-*]\s+/m.test(text)) {
        return (
            <View style={styles.bullets}>
                {bulletsOf(text).map((item, index) => (
                    <View key={index} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.paragraph}><Inline text={item} /></Text>
                    </View>
                ))}
            </View>
        );
    }
    return <Text style={styles.paragraph}><Inline text={text} /></Text>;
}

/**
 * A table as stacked rows rather than columns: a phone cannot give three columns of prose the
 * width they need, and the cookie table is read one entry at a time anyway.
 */
function TableBlock({ text }: { text: string }) {
    const { headers, rows } = parseTable(text);

    return (
        <View style={styles.table}>
            {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                    {row.map((cell, cellIndex) => (
                        <View key={cellIndex} style={styles.tableCell}>
                            <Text style={styles.tableLabel}>{headers[cellIndex] ?? ''}</Text>
                            <Text style={styles.paragraph}><Inline text={cell} /></Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

/** Links, bold and code inside a line. Links open rather than being flattened away. */
function Inline({ text }: { text: string }) {
    const router = useRouter();

    return (
        <>
            {tokenize(text).map((token, index) => {
                if (token.kind === 'link') {
                    const target = linkTarget(token.href);
                    return (
                        <Text
                            key={index}
                            style={styles.link}
                            accessibilityRole="link"
                            onPress={() => {
                                if (target.kind === 'legal') router.push(`/juridisk/${target.key}`);
                                // A link that cannot be opened is better ignored than a crash.
                                else Linking.openURL(target.href).catch(() => {});
                            }}
                        >
                            {token.text}
                        </Text>
                    );
                }
                if (token.kind === 'bold') return <Text key={index} style={styles.bold}>{token.text}</Text>;
                if (token.kind === 'code') return <Text key={index} style={styles.code}>{token.text}</Text>;
                return <Fragment key={index}>{token.text}</Fragment>;
            })}
        </>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: space.md },
    headingLarge: { ...type.title, color: colors.ink, marginTop: space.md },
    heading: { ...type.heading, color: colors.brown, marginTop: space.md },
    paragraph: { ...type.body, color: colors.ink, flex: 1 },
    bold: { fontWeight: '700' },
    code: { ...type.meta, color: colors.brown },
    link: { color: colors.ember, textDecorationLine: 'underline' },
    bullets: { gap: space.xs },
    bulletRow: { flexDirection: 'row', gap: space.sm },
    bulletDot: { ...type.body, color: colors.ember },
    table: { gap: space.sm },
    tableRow: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: space.lg,
        gap: space.sm,
    },
    tableCell: { gap: 2 },
    tableLabel: { ...type.meta, color: colors.moss },
});
