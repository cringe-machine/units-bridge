import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { join } from 'path';

const OUT_DIR = process.env.OUT_DIR || '.svelte-kit';
const BASE_URL = process.env.BASE_URL || '';
const BUILD_PATH = process.env.BUILD_PATH || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		alias: {
			$lib: './src/lib',
			'$lib/*': './src/lib/*'
		},
		outDir: OUT_DIR,
		paths: {
			base: BASE_URL
		},
		adapter: adapter({
			pages: BUILD_PATH,
			assets: join(BUILD_PATH, BASE_URL)
		})
	}
};

export default config;
