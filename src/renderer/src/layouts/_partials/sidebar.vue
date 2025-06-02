<script lang="ts" setup>
import MdiIcon from '@renderer/components/MdiIcon.vue'
</script>
<template>
    <div class="sidebar border border-right p-0 bg-body-tertiary">
        <div
            id="sidebarMenu"
            class="bg-body-tertiary"
            tabindex="-1"
            aria-labelledby="sidebarMenuLabel"
        >
            <div class="offcanvas-body d-md-flex flex-column p-0 pt-lg-3 overflow-y-auto">
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <RouterLink
                            to="/home"
                            class="nav-link d-flex align-items-center gap-2"
                            :class="{ active: $route.path === '/home' }"
                        >
                            <MdiIcon icon="view-dashboard" /> Home
                        </RouterLink>
                    </li>
                </ul>
                <hr />
                <ul class="nav flex-column mb-auto">
                    <li class="nav-item">
                        <RouterLink
                            to="/settings"
                            class="nav-link d-flex align-items-center gap-2"
                            :class="{ active: $route.path === '/settings' }"
                        >
                            <MdiIcon icon="cog" /> Settings
                        </RouterLink>
                    </li>
                    <li class="nav-item">
                        <RouterLink
                            to="/about"
                            class="nav-link d-flex align-items-center gap-2"
                            :class="{ active: $route.path === '/about' }"
                        >
                            <MdiIcon icon="information-outline" /> About
                        </RouterLink>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
