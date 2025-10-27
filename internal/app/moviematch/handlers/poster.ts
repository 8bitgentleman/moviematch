import { log, ServerRequest } from "/deps.ts";
import { urlFromReqUrl } from "/internal/app/moviematch/util/url.ts";
import { RouteContext, RouteHandler } from "/internal/app/moviematch/types.ts";

interface PosterParams {
  providerIndex: string;
  key: string;
}

export const handler: RouteHandler = async (
  req: ServerRequest,
  ctx: RouteContext,
) => {
  log.debug(`poster handler called with params: ${JSON.stringify(ctx.params)}`);
  if (!ctx.params) {
    log.warn(`poster handler called without params`);
    return;
  }
  const { providerIndex, key } = ctx.params as unknown as PosterParams;
  log.debug(`Looking up provider at index: ${providerIndex}, key: ${key}`);
  const provider = ctx.providers[+providerIndex];

  if (!provider) {
    log.warn(`poster handler called with an invalid provider index: ${providerIndex}`);
    return;
  }
  log.debug(`Found provider, fetching artwork...`);


  const search = urlFromReqUrl(req.url).searchParams;

  try {
    const [readableStream, headers] = await provider.getArtwork(
      key,
      search.get("width") ? Number(search.get("width")) : 600,
    );

    log.debug(`Successfully fetched artwork, buffering stream...`);

    // Buffer the stream to a Uint8Array (compatible with old HTTP server)
    const reader = readableStream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Calculate total length and create single buffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    log.debug(`Stream buffered successfully (${totalLength} bytes)`);
    return {
      status: 200,
      headers,
      body: buffer,
    };
  } catch (err) {
    log.error(`Error fetching poster: ${err instanceof Error ? err.message : String(err)}`);
    return {
      status: 500,
      body: JSON.stringify({ error: "Failed to fetch poster" }),
    };
  }
};
