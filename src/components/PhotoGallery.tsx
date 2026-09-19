import { useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { imageUrl } from '../api/client';
import type { GalleryImage } from '../api/types';
import { colors, space, type } from '../theme/theme';

/**
 * Photos for a recipe or a gear item, one per screen width, with a caption and dots when
 * there are several. Renders nothing without images: whether a screen wants a placeholder
 * is the screen's decision.
 */
export default function PhotoGallery({ images }: { images: GalleryImage[] }) {
    const { width } = useWindowDimensions();
    const [index, setIndex] = useState(0);
    if (images.length === 0) return null;

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const next = Math.round(event.nativeEvent.contentOffset.x / width);
        if (next !== index) setIndex(next);
    };

    const caption = images[index]?.caption;

    return (
        <View>
            <FlatList
                data={images}
                keyExtractor={image => String(image.id)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScroll}
                renderItem={({ item }) => (
                    <Image
                        source={{ uri: imageUrl(item.contentImageId, Math.round(width)) }}
                        style={[styles.frame, { width, height: width * 0.75 }]}
                        contentFit="cover"
                        transition={150}
                    />
                )}
            />

            {images.length > 1 && (
                <View style={styles.dots} pointerEvents="none">
                    {images.map((image, dotIndex) => (
                        <View key={image.id} style={[styles.dot, dotIndex === index && styles.dotActive]} />
                    ))}
                </View>
            )}

            {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { backgroundColor: colors.paperSunk },
    dots: {
        position: 'absolute',
        bottom: space.md,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: space.sm,
        backgroundColor: 'rgba(36, 28, 20, 0.35)',
        borderRadius: 999,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
    },
    dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: 'rgba(245, 241, 230, 0.55)' },
    dotActive: { backgroundColor: colors.paper },
    caption: { ...type.meta, color: colors.inkSoft, paddingHorizontal: space.lg, paddingTop: space.sm },
});
