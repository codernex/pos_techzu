import { defineConfig, loadEnv } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const currentDir = import.meta.dirname || path.resolve('.');
  const rootDir = path.resolve(currentDir, '../../');
  const envDir =
    fs.existsSync(path.resolve(rootDir, '.env')) ||
    fs.existsSync(path.resolve(rootDir, '.env.example'))
      ? rootDir
      : currentDir;

  const env = loadEnv(mode, envDir, '');
  const port = parseInt(env.ADMIN_PORT || '3004', 10);

  return {
    envDir,
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    server: {
      port,
      host: true,
    },
  };
});
