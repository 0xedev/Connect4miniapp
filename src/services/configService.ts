// Environment configuration for production deployment

interface EnvironmentConfig {
  serverUrl: string;
  environment: "development" | "staging" | "production";
  dailyApiKey?: string;
  dailyDomain?: string;
  walletConnectProjectId?: string;
  chainId: number;
  rpcUrl: string;
  contractAddress?: string;
  gaTrackingId?: string;
  sentryDsn?: string;
}

class ConfigService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = {
      serverUrl: process.env.REACT_APP_SERVER_URL || "http://localhost:3001",
      environment: (process.env.REACT_APP_ENVIRONMENT as any) || "development",
      dailyApiKey: process.env.REACT_APP_DAILY_API_KEY,
      dailyDomain: process.env.REACT_APP_DAILY_DOMAIN,
      walletConnectProjectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
      chainId: parseInt(process.env.REACT_APP_CHAIN_ID || "11155111"),
      rpcUrl:
        process.env.REACT_APP_RPC_URL ||
        "https://ethereum-sepolia.rpc.thirdweb.com",
      contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
      gaTrackingId: process.env.REACT_APP_GA_TRACKING_ID,
      sentryDsn: process.env.REACT_APP_SENTRY_DSN,
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = ["serverUrl"];
    const missingFields = requiredFields.filter(
      (field) => !this.config[field as keyof EnvironmentConfig]
    );

    if (missingFields.length > 0) {
      console.warn(
        `Missing required environment variables: ${missingFields.join(", ")}`
      );
    }

    if (this.config.environment === "production") {
      const productionRequiredFields = [
        "dailyApiKey",
        "walletConnectProjectId",
      ];
      const missingProdFields = productionRequiredFields.filter(
        (field) => !this.config[field as keyof EnvironmentConfig]
      );

      if (missingProdFields.length > 0) {
        console.error(
          `Missing production environment variables: ${missingProdFields.join(
            ", "
          )}`
        );
      }
    }
  }

  get serverUrl(): string {
    return this.config.serverUrl;
  }

  get environment(): string {
    return this.config.environment;
  }

  get dailyApiKey(): string | undefined {
    return this.config.dailyApiKey;
  }

  get dailyDomain(): string | undefined {
    return this.config.dailyDomain;
  }

  get walletConnectProjectId(): string | undefined {
    return this.config.walletConnectProjectId;
  }

  get chainId(): number {
    return this.config.chainId;
  }

  get rpcUrl(): string {
    return this.config.rpcUrl;
  }

  get contractAddress(): string | undefined {
    return this.config.contractAddress;
  }

  get gaTrackingId(): string | undefined {
    return this.config.gaTrackingId;
  }

  get sentryDsn(): string | undefined {
    return this.config.sentryDsn;
  }

  get isProduction(): boolean {
    return this.config.environment === "production";
  }

  get isDevelopment(): boolean {
    return this.config.environment === "development";
  }
}

export const configService = new ConfigService();
export default configService;
