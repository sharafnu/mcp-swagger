/**
 * File system utility functions - Functional approach
 */

import { promises as fs, Stats } from 'fs';
import * as path from 'path';

/**
 * Check if file exists
 */
export const exists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Create directory recursively
 */
export const ensureDir = async (dirPath: string): Promise<void> => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }
};

/**
 * Read file content
 */
export const readFile = async (filePath: string): Promise<string> => {
  return await fs.readFile(filePath, 'utf-8');
};

/**
 * Write file content
 */
export const writeFile = async (filePath: string, content: string): Promise<void> => {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf-8');
};

/**
 * Copy file
 */
export const copyFile = async (source: string, destination: string): Promise<void> => {
  const dir = path.dirname(destination);
  await ensureDir(dir);
  await fs.copyFile(source, destination);
};

/**
 * Read JSON file
 */
export const readJson = async <T = any>(filePath: string): Promise<T> => {
  const content = await readFile(filePath);
  return JSON.parse(content);
};

/**
 * Write JSON file
 */
export const writeJson = async (filePath: string, data: any, indent: number = 2): Promise<void> => {
  const content = JSON.stringify(data, null, indent);
  await writeFile(filePath, content);
};

/**
 * List files in directory
 */
export const listFiles = async (dirPath: string, extension?: string): Promise<string[]> => {
  try {
    const files = await fs.readdir(dirPath);
    if (extension) {
      return files.filter((file: string) => file.endsWith(extension));
    }
    return files;
  } catch {
    return [];
  }
};

/**
 * Get file stats
 */
export const getStats = async (filePath: string): Promise<Stats | null> => {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
};

/**
 * Remove file or directory
 */
export const remove = async (targetPath: string): Promise<void> => {
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      await fs.rmdir(targetPath, { recursive: true });
    } else {
      await fs.unlink(targetPath);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error;
    }
  }
};

/**
 * Join paths safely
 */
export const joinPath = (...segments: string[]): string => {
  return path.join(...segments);
};

/**
 * Get relative path
 */
export const relative = (from: string, to: string): string => {
  return path.relative(from, to);
};

/**
 * Get absolute path
 */
export const resolve = (...segments: string[]): string => {
  return path.resolve(...segments);
};

/**
 * Get file extension
 */
export const getExtension = (filePath: string): string => {
  return path.extname(filePath);
};

/**
 * Get filename without extension
 */
export const getBasename = (filePath: string, withExtension: boolean = true): string => {
  if (withExtension) {
    return path.basename(filePath);
  }
  return path.basename(filePath, getExtension(filePath));
};

/**
 * Get directory name
 */
export const getDirname = (filePath: string): string => {
  return path.dirname(filePath);
};

// Export as a convenient object for compatibility
export const FileUtils = {
  exists,
  ensureDir,
  readFile,
  writeFile,
  copyFile,
  readJson,
  writeJson,
  listFiles,
  getStats,
  remove,
  joinPath,
  relative,
  resolve,
  getExtension,
  getBasename,
  getDirname
};