import {
  ContentRatingFilter,
  Filter,
  Filters,
  GenreFilterMode,
  Library,
  LibraryType,
  Media,
  RatingFilter,
  SortOrder,
} from "/types/moviematch.ts";
import { PlexApi, PlexDeepLinkOptions } from "/internal/app/plex/api.ts";
import {
  MovieMatchProvider,
} from "/internal/app/moviematch/providers/types.ts";
import { FieldType } from "/internal/app/plex/types/library_items.ts";
import { filterToQueryString } from "/internal/app/plex/util.ts";

export interface PlexProviderConfig {
  url: string;
  token: string;
  libraryTitleFilter?: string[];
  libraryTypeFilter?: LibraryType[];
  linkType?: "app" | "webLocal" | "webExternal";
}

export const filtersToPlexQueryString = (
  filters?: Filter[],
): Record<string, string> => {
  const queryString: Record<string, string> = {};

  if (filters) {
    for (const filter of filters) {
      // We're re-using the filters dict to include library,
      // but we want to handle that ourselves.
      if (filter.key === "library") {
        continue;
      }

      // Phase 2.1: Handle watched status filter
      // Special handling for 'watched' filter - maps to viewCount parameter
      if (filter.key === "watched") {
        // If value is ["true"], filter to watched items (viewCount > 0)
        // If value is ["false"], filter to unwatched items (viewCount = 0)
        if (filter.value.includes("true")) {
          queryString["viewCount>>"] = "0"; // Greater than 0
        } else if (filter.value.includes("false")) {
          queryString["viewCount"] = "0"; // Equals 0
        }
        continue;
      }

      const [key, value] = filterToQueryString(filter);
      queryString[key] = value;
    }
  }

  return queryString;
};

/**
 * Helper function to shuffle an array (Fisher-Yates algorithm)
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Apply sort order to media array
 */
const applySortOrder = (media: Media[], sortOrder: SortOrder): Media[] => {
  switch (sortOrder) {
    case "newest":
      return [...media].sort((a, b) => (b.year || 0) - (a.year || 0));
    case "oldest":
      return [...media].sort((a, b) => (a.year || 0) - (b.year || 0));
    case "random":
    default:
      return shuffleArray(media);
  }
};

/**
 * Apply genre filtering with AND/OR logic
 */
const applyGenreFilter = (
  media: Media[],
  filters: Filter[] | undefined,
  genreFilterMode: GenreFilterMode | undefined,
): Media[] => {
  if (!filters) return media;

  // Find genre filters
  const genreFilters = filters.filter((f) => f.key === "genre");
  if (genreFilters.length === 0) return media;

  // Collect all genre values from filters
  const selectedGenres = genreFilters.flatMap((f) => f.value);
  if (selectedGenres.length === 0) return media;

  const mode = genreFilterMode || "or"; // Default to OR

  return media.filter((item) => {
    if (mode === "and") {
      // AND: Media must have ALL selected genres
      return selectedGenres.every((genre) =>
        item.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
      );
    } else {
      // OR: Media must have AT LEAST ONE selected genre
      return selectedGenres.some((genre) =>
        item.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
      );
    }
  });
};

/**
 * Apply rating filters
 */
const applyRatingFilter = (
  media: Media[],
  ratingFilter: RatingFilter | undefined,
): Media[] => {
  if (!ratingFilter) return media;

  return media.filter((item) => {
    const rating = item.rating;

    // Check min rating
    if (ratingFilter.min !== undefined && rating < ratingFilter.min) {
      return false;
    }

    // Check max rating
    if (ratingFilter.max !== undefined && rating > ratingFilter.max) {
      return false;
    }

    return true;
  });
};

/**
 * Apply content rating filters
 */
const applyContentRatingFilter = (
  media: Media[],
  contentRatingFilter: ContentRatingFilter | undefined,
): Media[] => {
  if (!contentRatingFilter || contentRatingFilter.ratings.length === 0) {
    return media;
  }

  return media.filter((item) => {
    if (!item.contentRating) return false;
    return contentRatingFilter.ratings.includes(item.contentRating);
  });
};

export const createProvider = (
  id: string,
  providerOptions: PlexProviderConfig,
): MovieMatchProvider => {
  const api = new PlexApi(
    providerOptions.url,
    providerOptions.token,
    providerOptions,
  );

  let libraries: Library[];

  const getLibraries = async () => {
    if (libraries) {
      return libraries;
    }

    const plexLibraries = await api.getLibraries();

    libraries = plexLibraries
      .map((library) =>
        ({
          title: library.title,
          key: library.key,
          type: library.type,
        }) as Library
      )
      .filter((library) =>
        (providerOptions.libraryTypeFilter ?? ["movie"]).includes(library.type)
      );

    return libraries;
  };

  return {
    options: providerOptions,
    isAvailable: () => api.isAvaliable(),
    isUserAuthorized: () => Promise.resolve(true),
    getName: () => api.getServerName(),
    getLibraries,
    getFilters: async () => {
      const meta = await api.getAllFilters();
      const availableTypes: LibraryType[] = ["movie", "show"];

      const filters = new Map<string, {
        title: string;
        key: string;
        type: string;
        libraryTypes: LibraryType[];
      }>();

      for (const type of meta.Type) {
        if (availableTypes.includes(type.type as LibraryType) && type.Filter) {
          for (const filter of type.Filter) {
            if (filters.has(filter.filter)) {
              const existing = filters.get(filter.filter);
              if (existing) {
                existing.libraryTypes.push(type.type as LibraryType);
              }
            } else {
              const filterType = type.Field!.find((_) =>
                _.key === filter.filter
              )?.type ?? filter.filterType;
              filters.set(filter.filter, {
                title: filter.title,
                key: filter.filter,
                type: filterType!,
                libraryTypes: [type.type as LibraryType],
              });
            }
          }
        }
      }

      const filterTypes = meta.FieldType.reduce(
        (acc, _: FieldType) => ({
          ...acc,
          [_.type]: _.Operator,
        }),
        {} as Filters["filterTypes"],
      );

      return {
        filters: [...filters.values()],
        filterTypes,
      };
    },
    getFilterValues: async (key: string) => {
      const filterValues = await api.getFilterValues(key);

      if (filterValues.size) {
        const deduplicatedFilterValues = new Map<string, string>();

        for (const filterValue of filterValues.Directory) {
          deduplicatedFilterValues.set(filterValue.key, filterValue.title);
        }

        return [...deduplicatedFilterValues.entries()].map((
          [value, title],
        ) => ({
          value,
          title,
        }));
      }

      return [];
    },
    getArtwork: (
      key: string,
      width: number,
    ): Promise<[ReadableStream<Uint8Array>, Headers]> =>
      api.transcodePhoto(key, { width }),
    getCanonicalUrl: (key: string, options) => {
      let linkType: PlexDeepLinkOptions["type"];

      switch (providerOptions.linkType) {
        case "app":
          linkType = "app";
          break;
        case "webExternal":
          linkType = "plexTv";
          break;
        case "webLocal":
          linkType = "plexLocal";
          break;
        default: {
          if (options?.userAgent?.includes("iPhone")) {
            linkType = "app";
          } else {
            linkType = "plexTv";
          }
        }
      }

      return api.getDeepLink(key, { type: linkType });
    },
    getMedia: async ({
      filters,
      sortOrder = "random",
      genreFilterMode,
      ratingFilter,
      contentRatingFilter,
    }) => {
      const filterParams: Record<string, string> = filtersToPlexQueryString(
        filters,
      );

      const libraries: Library[] = await getLibraries();

      let media: Media[] = [];

      for (const library of libraries) {
        const libraryItems = await api.getLibraryItems(
          library.key,
          { filters: filterParams },
        );
        if (libraryItems.size) {
          for (const libraryItem of libraryItems.Metadata) {
            let posterUrl;
            if (libraryItem.thumb) {
              const [, , , metadataId, , thumbId] = libraryItem.thumb.split(
                "/",
              );
              posterUrl = `/api/poster/${id}/${metadataId}/${thumbId}`;
            }
            media.push({
              id: libraryItem.guid,
              type: libraryItem.type as LibraryType,
              title: libraryItem.title,
              description: libraryItem.summary,
              tagline: libraryItem.tagline,
              year: libraryItem.year,
              posterUrl,
              linkUrl: `/api/link/${id}/${libraryItem.key}`,
              genres: libraryItem.Genre?.map((_) => _.tag) ?? [],
              duration: Number(libraryItem.duration),
              rating: Number(libraryItem.rating),
              contentRating: libraryItem.contentRating,
              // Phase 2.1: Enhanced metadata
              directors: libraryItem.Director?.map((_) => _.tag) ?? [],
              writers: libraryItem.Writer?.map((_) => _.tag) ?? [],
              actors: libraryItem.Role?.map((_) => _.tag) ?? [],
              collections: libraryItem.Collection?.map((_) => _.tag) ?? [],
              lastViewedAt: libraryItem.lastViewedAt,
              viewCount: libraryItem.viewCount,
            });
          }
        }
      }

      // Apply Phase 2.3 enhanced filters
      media = applyGenreFilter(media, filters, genreFilterMode);
      media = applyRatingFilter(media, ratingFilter);
      media = applyContentRatingFilter(media, contentRatingFilter);

      // Apply sorting
      media = applySortOrder(media, sortOrder);

      return media;
    },
  };
};
