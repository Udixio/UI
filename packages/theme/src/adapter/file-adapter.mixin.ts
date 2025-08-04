import * as fs from 'fs/promises';
import * as path from 'path';
import { AdapterAbstract } from './adapter.abstract';
import { ConfigInterface } from './config.interface';
import { Constructor } from 'type-fest';

export function FileAdapterMixin<
  TBase extends Constructor<AdapterAbstract> &
    Constructor<{
      getConfig: () => Promise<ConfigInterface>;
    }>,
>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args); // Appel du constructeur de la classe Base avec les arguments transmis
    }

    async ensureOutDir(dirPath: string): Promise<void> {
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Répertoire vérifié/créé avec succès : ${dirPath}`);
      } catch (error) {
        console.error(
          `Erreur lors de la création du répertoire : ${dirPath}`,
          error,
        );
        throw error;
      }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
      try {
        const dirPath = path.dirname(filePath); // Extraction du répertoire cible
        await this.ensureOutDir(dirPath); // S'assurer que le répertoire existe
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`Fichier écrit avec succès : ${filePath}`);
      } catch (error) {
        console.error(
          `Erreur lors de l'écriture du fichier : ${filePath}`,
          error,
        );
        throw error;
      }
    }

    async readFile(filePath: string): Promise<string> {
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data;
      } catch (error) {
        console.error(
          `Erreur lors de la lecture du fichier : ${filePath}`,
          error,
        );
        throw error;
      }
    }

    async deleteFile(filePath: string): Promise<void> {
      try {
        await fs.unlink(filePath);
        console.log(`Fichier supprimé avec succès : ${filePath}`);
      } catch (error) {
        console.error(
          `Erreur lors de la suppression du fichier : ${filePath}`,
          error,
        );
        throw error;
      }
    }
  };
}
