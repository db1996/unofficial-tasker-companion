<script setup lang="ts">
import AppLayout from '@renderer/layouts/app.layout.vue'
</script>

<template>
    <AppLayout title="About">
        <div class="text">
            This is an unofficial Tasker companion app to manage a task from your PC!
            <br />
            It has a full integration for Home assistant, allowing you to easily create tasks that trigger things in home assistant.
            <br />
            <br />
            Built with ❤️, open source, and free to use.
        </div>
        <div class="actions">
            <div class="action">
                <a href="https://github.com/db1996/unofficial-tasker-companion" target="_blank" rel="noreferrer">
                  Check the code, and releases here</a
                >
            </div>
        </div>
        <br>
        <div class="creator">Created by db1996</div>
        <div>Current release: 2025.06.2</div>
    </AppLayout>
</template>
