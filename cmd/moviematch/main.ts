import { log, parseFlags } from "/deps.ts";
import { setLogLevel } from "/internal/app/moviematch/logger.ts";
import { loadConfig } from "/internal/app/moviematch/config/main.ts";
import { getVersion } from "/internal/app/moviematch/version.ts";
import {
  Application,
  ProviderUnavailableError,
} from "/internal/app/moviematch/app.ts";
import { ConfigReloadError } from "/internal/app/moviematch/config/errors.ts";
import { getEnv } from "/internal/app/moviematch/util/env.ts";

const flags = parseFlags(Deno.args, { alias: { v: "version" } });

const CONFIG_PATH = flags.config ?? await getEnv("CONFIG_PATH");

if (flags.version) {
  console.log(`MovieMatch ${await getVersion()}`);
  Deno.exit(0);
}

let exitCode: number | undefined;

while (typeof exitCode === "undefined") {
  const [config, errors] = await loadConfig(CONFIG_PATH);

  if (errors.length === 1 && errors[0].name === "ServersMustNotBeEmpty") {
    log.warning(
      "No default config file found. Starting up with defaults until configured.",
    );
  } else if (errors.length) {
    log.critical(
      `Found configuration errors: ${
        errors.map((err) => `\n - ${err.name} - ${err.message}`)
      }`,
    );
    exitCode = 1;
    break;
  }

  setLogLevel(config.logLevel);

  log.info(`MovieMatch ${await getVersion()}`);
  log.debug(`Config: ${JSON.stringify(config, null, 2)}`);

  const abortController = new AbortController();

  // Modern signal handling for Deno 2.x
  try {
    // Deno 2.x: Use Deno.addSignalListener
    if (Deno.build.os !== "windows") {
      Deno.addSignalListener("SIGINT", () => {
        log.info("Received SIGINT signal, shutting down gracefully...");
        abortController.abort();
      });
    } else {
      // Windows doesn't support POSIX signals
      // The process will terminate normally on Ctrl+C
      log.debug("Windows detected: Using default signal handling");
    }
  } catch (err) {
    log.error(
      `Unable to setup signal handlers: ${err instanceof Error ? err.message : String(err)}. There might be problems stopping MovieMatch gracefully.`,
    );
  }

  try {
    const app = Application(config, abortController.signal);
    exitCode = await app.statusCode;
  } catch (err) {
    if (err instanceof ProviderUnavailableError) {
      exitCode = 1;
      log.critical(String(err));
    }

    if (err instanceof ConfigReloadError) {
      exitCode = undefined;
      log.info(`Reloading configuration`);
    }
  }
}

Deno.exit(exitCode);
