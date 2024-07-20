import svg from '@poppanator/sveltekit-svg';
import { sveltekit } from '@sveltejs/kit/vite';
import * as childProcess from 'child_process';
import { defineConfig } from 'vite';

const commitHash = childProcess.execSync('git rev-parse HEAD').toString();

export default defineConfig({
	plugins: [
		sveltekit(),
		svg({
			svgoOptions: {
				plugins: [
					{
						name: 'preset-default',
						params: { overrides: { removeViewBox: false } }
					},
					{
						name: 'prefixIds'
					}
				]
			}
		})
	],
	define: {
		'import.meta.env.__COMMIT_HASH__': JSON.stringify(`0x${commitHash}`)
	}
});
