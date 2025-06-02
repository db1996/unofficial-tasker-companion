import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    main: {
        base: './',
        resolve: {
            alias: {
                '@main': resolve('src/main'),
                '@renderer': resolve('src/renderer/src')
            }
        },
        plugins: [externalizeDepsPlugin(), vue()],
    },
    preload: {
        plugins: [externalizeDepsPlugin(), vue()]
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
                '@main': resolve('src/main'),
                '@resources': resolve('resources'),
                '@tasker': resolve('src/renderer/src/tasker'),
                '@components': resolve('src/renderer/src/components')
            }
        },
        plugins: [vue()]
    }
})
