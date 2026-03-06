import type { StorageProvider } from "./types";

export type { StorageProvider } from "./types";

let instance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (instance) return instance;

  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();

  switch (provider) {
    case "s3": {
      const { S3StorageProvider } = require("./s3");
      instance = new S3StorageProvider();
      break;
    }
    case "azure": {
      const { AzureStorageProvider } = require("./azure");
      instance = new AzureStorageProvider();
      break;
    }
    case "local":
    default: {
      const { LocalStorageProvider } = require("./local");
      instance = new LocalStorageProvider();
      break;
    }
  }

  return instance!;
}
