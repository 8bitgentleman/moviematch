import { log, readerFromStreamReader, ServerRequest } from "/deps.ts";
import { RouteContext, RouteHandler } from "/internal/app/moviematch/types.ts";
import { PlexApi } from "/internal/app/plex/api.ts";
import type { MovieMatchProvider } from "/internal/app/moviematch/providers/types.ts";

interface TrailerParams {
  providerIndex: string;
  mediaId: string;
}

export const handler: RouteHandler = async (
  req: ServerRequest,
  ctx: RouteContext,
) => {
  if (!ctx.params) {
    log.warn(`trailer handler called without params`);
    return {
      status: 400,
      body: "Missing parameters",
    };
  }

  const { providerIndex, mediaId } = ctx.params as unknown as TrailerParams;
  const provider = ctx.providers[+providerIndex];

  if (!provider) {
    log.warn(`trailer handler called with an invalid provider index`);
    return {
      status: 404,
      body: "Provider not found",
    };
  }

  // Get the Plex API instance from the provider
  // We need to access the internal API, so we'll use a helper method
  const plexUrl = provider.options.url;
  const plexToken = (provider.options as any).token;

  const plexApi = new PlexApi(plexUrl, plexToken, {
    language: (provider.options as any).language,
    libraryTitleFilter: (provider.options as any).libraryTitleFilter,
    libraryTypeFilter: (provider.options as any).libraryTypeFilter,
    linkType: (provider.options as any).linkType,
  });

  try {
    const trailer = await plexApi.getTrailer(mediaId);

    if (!trailer) {
      log.debug(`No trailer found for media ${mediaId}`);
      return {
        status: 404,
        body: "Trailer not found",
      };
    }

    if (!trailer.Media || trailer.Media.length === 0 || !trailer.Media[0].Part || trailer.Media[0].Part.length === 0) {
      log.warn(`Trailer found but no media parts available for ${mediaId}`);
      return {
        status: 404,
        body: "Trailer media not available",
      };
    }

    // Build the video URL from Plex
    const videoPath = trailer.Media[0].Part[0].key;
    const videoUrl = new URL(plexUrl);
    videoUrl.pathname = videoPath;
    videoUrl.searchParams.set("X-Plex-Token", plexToken);

    log.debug(`Proxying trailer from: ${videoUrl.href}`);

    // Proxy the video stream from Plex
    const videoResponse = await fetch(videoUrl.href);

    if (!videoResponse.ok) {
      log.error(`Failed to fetch trailer: ${videoResponse.status} ${videoResponse.statusText}`);
      return {
        status: videoResponse.status,
        body: "Failed to fetch trailer from Plex server",
      };
    }

    if (!videoResponse.body) {
      return {
        status: 500,
        body: "No response body from Plex server",
      };
    }

    const headers = new Headers();

    // Copy relevant headers from Plex response
    const contentType = videoResponse.headers.get("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    } else {
      headers.set("Content-Type", "video/mp4");
    }

    const contentLength = videoResponse.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const acceptRanges = videoResponse.headers.get("Accept-Ranges");
    if (acceptRanges) {
      headers.set("Accept-Ranges", acceptRanges);
    }

    const contentRange = videoResponse.headers.get("Content-Range");
    if (contentRange) {
      headers.set("Content-Range", contentRange);
    }

    return {
      status: videoResponse.status,
      headers,
      body: readerFromStreamReader(videoResponse.body.getReader()),
    };
  } catch (err) {
    log.error(`Error fetching trailer: ${err instanceof Error ? err.message : String(err)}`);
    return {
      status: 500,
      body: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
