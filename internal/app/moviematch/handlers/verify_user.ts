import { log, ServerRequest } from "/deps.ts";
import { RouteContext, RouteHandler } from "/internal/app/moviematch/types.ts";
import { getPlexUsers, getUser } from "/internal/app/plex/plex_tv.ts";

/**
 * Phase 2.1: Plex User Verification Endpoint
 *
 * Verifies that a Plex user has access to the configured server and returns
 * accessible libraries for that user.
 *
 * Query parameters:
 *   - plexToken: The user's Plex authentication token
 *   - plexClientId: The Plex client identifier
 */
export const handler: RouteHandler = async (
  req: ServerRequest,
  ctx: RouteContext,
) => {
  try {
    const url = new URL(req.url, `http://${req.headers.get("host")}`);
    const plexToken = url.searchParams.get("plexToken");
    const plexClientId = url.searchParams.get("plexClientId");

    if (!plexToken || !plexClientId) {
      return {
        status: 400,
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          error: "Missing plexToken or plexClientId parameters",
        }),
      };
    }

    // Get the user's information from plex.tv
    let user;
    try {
      user = await getUser({ clientId: plexClientId, plexToken });
    } catch (err) {
      log.warning(`Failed to get Plex user: ${err.message}`);
      return {
        status: 401,
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          error: "Invalid Plex credentials",
          message: err.message,
        }),
      };
    }

    // Get list of users that have access to servers
    let plexUsers;
    try {
      plexUsers = await getPlexUsers({ clientId: plexClientId, plexToken });
    } catch (err) {
      log.warning(`Failed to get Plex users: ${err.message}`);
      return {
        status: 500,
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          error: "Failed to retrieve server access information",
          message: err.message,
        }),
      };
    }

    // Check if the user has access to any of the configured servers
    const accessibleServers: Array<{
      serverName: string;
      serverId: string;
      isOwner: boolean;
      libraries: Array<{ title: string; key: string; type: string }>;
    }> = [];

    for (let i = 0; i < ctx.providers.length; i++) {
      const provider = ctx.providers[i];

      try {
        // Get the server ID from the provider
        const serverIdentity = await provider.getName();

        // Get the provider's libraries
        const libraries = await provider.getLibraries();

        // Check if user has access to this server
        let hasAccess = false;
        let isOwner = false;

        // Check if this is the owner's token (they have access to all owned servers)
        if (plexUsers.MediaContainer.User) {
          for (const plexUser of plexUsers.MediaContainer.User) {
            if (plexUser.Server) {
              for (const server of plexUser.Server) {
                // Match by server name (since we can't easily get machineIdentifier without additional API calls)
                if (server.name === serverIdentity) {
                  hasAccess = true;
                  isOwner = server.owned;
                  break;
                }
              }
            }
            if (hasAccess) break;
          }
        }

        if (hasAccess) {
          accessibleServers.push({
            serverName: serverIdentity,
            serverId: String(i),
            isOwner,
            libraries: libraries.map(lib => ({
              title: lib.title,
              key: lib.key,
              type: lib.type,
            })),
          });
        }
      } catch (err) {
        log.error(`Error checking access for provider ${i}: ${err.message}`);
        // Continue checking other providers
      }
    }

    if (accessibleServers.length === 0) {
      return {
        status: 403,
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          error: "User does not have access to any configured servers",
          username: user.username,
        }),
      };
    }

    // Return successful verification with accessible servers and libraries
    return {
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        thumb: user.thumb,
        isHomeUser: user.home,
        isHomeAdmin: user.homeAdmin,
        accessibleServers,
      }),
    };
  } catch (err) {
    log.error(`Unexpected error in verify_user handler: ${err.message}`);
    return {
      status: 500,
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        error: "Internal server error",
        message: err.message,
      }),
    };
  }
};
