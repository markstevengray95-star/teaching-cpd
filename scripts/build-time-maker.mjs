import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
await build({root:path.resolve('vendor/time-maker'),base:'/time-maker/',plugins:[react()],build:{outDir:path.resolve('public/time-maker'),emptyOutDir:true}});
