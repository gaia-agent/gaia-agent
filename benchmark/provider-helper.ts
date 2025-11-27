import { DEFAULT_PROVIDERS } from "../src/config/defaults.js";
import type { ProviderConfig } from "../src/types.js";


/**
 * Get provider configuration from environment variables
 */
export function getProviderConfigFromEnv(): ProviderConfig | undefined {
    const config: ProviderConfig = {};

    if (process.env.GAIA_AGENT_SEARCH_PROVIDER) {
        const provider = process.env.GAIA_AGENT_SEARCH_PROVIDER.toLowerCase();
        if (provider === "tavily" || provider === "exa") {
            config.search = provider;
        }
    }

    if (process.env.GAIA_AGENT_SANDBOX_PROVIDER) {
        const provider = process.env.GAIA_AGENT_SANDBOX_PROVIDER.toLowerCase();
        if (provider === "e2b" || provider === "sandock") {
            config.sandbox = provider;
        }
    }

    if (process.env.GAIA_AGENT_BROWSER_PROVIDER) {
        const provider = process.env.GAIA_AGENT_BROWSER_PROVIDER.toLowerCase();
        if (provider === "browseruse" || provider === "aws-bedrock-agentcore") {
            config.browser = provider;
        }
    }

    if (process.env.GAIA_AGENT_MEMORY_PROVIDER) {
        const provider = process.env.GAIA_AGENT_MEMORY_PROVIDER.toLowerCase();
        if (provider === "mem0" || provider === "agentcore") {
            config.memory = provider;
        }
    }

    return Object.keys(config).length > 0 ? config : undefined;
}

/**
 * Get complete provider configuration, combining env vars with defaults
 */
export function getCompleteProviderConfig(): Required<ProviderConfig> {
    const envConfig = getProviderConfigFromEnv();
    return {
        browser: envConfig?.browser || DEFAULT_PROVIDERS.browser,
        sandbox: envConfig?.sandbox || DEFAULT_PROVIDERS.sandbox,
        search: envConfig?.search || DEFAULT_PROVIDERS.search,
        memory: envConfig?.memory || DEFAULT_PROVIDERS.memory,
    };
}