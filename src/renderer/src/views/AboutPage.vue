<script setup lang="ts">
import AppLayout from '@renderer/layouts/app.layout.vue'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<template>
    <AppLayout title="About">
        <div class="creator">Powered by electron-vite</div>
        <div class="text">
            ABOUT
            <span class="vue">Vue</span>
            and
            <span class="ts">TypeScript</span>
        </div>
        <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
        <div class="actions">
            <div class="action">
                <a href="https://electron-vite.org/" target="_blank" rel="noreferrer"
                    >Documentation</a
                >
            </div>
            <div class="action">
                <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
            </div>
        </div>
    </AppLayout>
</template>
