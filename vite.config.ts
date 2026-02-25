import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
    plugins: [
        electron({
            main: {
                entry: 'src/main.ts',
            },
            preload: {
                input: path.join(__dirname, 'src/preload.ts'),
            },
            renderer: {},
        }),
    ],
})
