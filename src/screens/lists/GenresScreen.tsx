import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FlatList, TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Genre } from '../../types';
import { bookService } from '../../services/bookService';
import Icon, { IconName } from '../../components/Icon';
import { SkeletonGenreList, ListHeader, s, FLATLIST_PERF_PROPS, contentPadBottom } from './shared';
import { colors, interaction } from '../../theme/designTokens';

type HomeNav = StackNavigationProp<HomeStackParamList>;

const GENRE_COLORS: [string, string][] = [
  [colors.primarySoft,      colors.primary      ],
  [colors.accentBlueSoft,   colors.accentBlue   ],
  [colors.accentPurpleSoft, colors.accentPurple ],
  [colors.accentRedSoft,    colors.accentRed    ],
  [colors.accentGreenSoft,  colors.accentGreen  ],
  [colors.accentAmberSoft,  colors.accentAmber  ],
  [colors.accentFuchsiaSoft,colors.accentFuchsia],
  [colors.accentCyanSoft,   colors.accentCyan   ],
  [colors.accentRoseSoft,   colors.accentRose   ],
  [colors.accentLimeSoft,   colors.accentLime   ],
];

const GENRE_ICONS: IconName[] = [
  'book-outline', 'headset-outline', 'sparkles-outline', 'flame-outline',
  'leaf-outline', 'planet-outline', 'heart-outline', 'skull-outline',
  'trophy-outline', 'school-outline',
];

export function GenresScreen() {
  const nav = useNavigation<HomeNav>();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService.getGenres().then(d => { setGenres(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Genre; index: number }) => {
    const [bg, accent] = GENRE_COLORS[index % GENRE_COLORS.length];
    const iconName = GENRE_ICONS[index % GENRE_ICONS.length];
    return (
      <TouchableOpacity
        style={[s.genreCard, { backgroundColor: bg }]}
        onPress={() => nav.navigate('GenreBooks', { genre: item })}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Жанр ${item.name}`}
        accessibilityHint="Дважды нажмите для просмотра книг"
        activeOpacity={interaction.activeOpacity}
      >
        <View style={[s.genreIconWrap, { backgroundColor: `${accent}22` }]} accessible={false}>
          <Icon name={iconName} size={28} color={accent} />
        </View>
        <Text style={[s.genreName, { color: accent }]} accessible={false}>{item.name}</Text>
      </TouchableOpacity>
    );
  }, [nav]);

  const header = useMemo(() => (
    <ListHeader label={`Жанры, ${genres.length}`} title="Жанрлар" count={genres.length} />
  ), [genres.length]);

  if (loading) return <SkeletonGenreList />;
  return (
    <FlatList
      style={s.list}
      data={genres}
      keyExtractor={i => i.id}
      numColumns={2}
      columnWrapperStyle={s.genreRow}
      ListHeaderComponent={header}
      renderItem={renderItem}
      contentContainerStyle={contentPadBottom}
      showsVerticalScrollIndicator={false}
      {...FLATLIST_PERF_PROPS}
    />
  );
}
