import { LocalStorage } from "./local";

// Swap the implementation here (S3, Cloudinary...) and nothing else in the app changes.
export interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export const storage: StorageProvider = new LocalStorage();
