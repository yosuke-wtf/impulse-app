import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
    plugins: [
        electron([
            {
                entry: 'src/main/main.ts',
                vite: {
                    build: {
                        rollupOptions: {
                            external: ['electron'],
                        },
                    }
                }
            },
            {
                entry: 'src/main/preload.ts',
                onstart(options) {
                    options.reload()
                },
                vite: {
                    build: {
                        rollupOptions: {
                            external: ['electron'],
                        },
                    }
                }
            },
        ]),
        renderer(),
    ],
})
