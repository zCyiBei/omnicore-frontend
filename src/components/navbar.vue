<template>
    <div class="navbar bg-base-100 shadow-sm fixed top-0 left-0 w-full z-50 px-4">
        <div class="flex-1 flex gap-6 items-center">
            <router-link to="/" class="text-xl font-black tracking-tight select-none focus:outline-none focus:ring-0 active:bg-transparent mr-2">
                Omnicore
            </router-link>
            <router-link to="/calculator" class="btn btn-ghost btn-2xs font-semibold tracking-wide focus:outline-none focus:ring-0 shadow-none bg-transparent border-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent router-link-active:!bg-transparent hover:text-primary transition-colors duration-200">
                Calculadora
            </router-link>
            <router-link to="/fact" class="btn btn-ghost btn-2xs font-semibold tracking-wide focus:outline-none focus:ring-0 shadow-none bg-transparent border-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-primary transition-colors duration-200">
                Nutrición
            </router-link>
            <router-link to="/diet" class="btn btn-ghost btn-2xs font-semibold tracking-wide focus:outline-none focus:ring-0 shadow-none bg-transparent border-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-primary transition-colors duration-200">
                Dieta
            </router-link>
            <router-link to="/routine" class="btn btn-ghost btn-2xs font-semibold tracking-wide focus:outline-none focus:ring-0 shadow-none bg-transparent border-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-primary transition-colors duration-200">
                Rutinas
            </router-link>
        </div>
    
        <div class="flex-none">
            <router-link to="/profile" class="btn btn-ghost btn-2xs font-semibold tracking-wide focus:outline-none focus:ring-0 shadow-none bg-transparent border-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent hover:text-primary transition-colors duration-200">
                Ficha
            </router-link>
        </div>
    </div>
</template>