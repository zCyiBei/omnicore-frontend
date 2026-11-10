<script setup>
import { ref, onMounted } from 'vue'
import profileIconGif from '../assets/profileicon.gif'

const profileData = ref(null)

onMounted(() => {
    const savedData = localStorage.getItem('omnicore_profile')
    if (savedData) {
        profileData.value = JSON.parse(savedData)
    }
})

const exportToMarkdown = () => {
    const savedProfile = localStorage.getItem('omnicore_profile');
    const savedRoutines = localStorage.getItem('omnicore_routines');

    const profile = savedProfile ? JSON.parse(savedProfile) : null;
    const routines = savedRoutines ? JSON.parse(savedRoutines) : [];

    if (!profile) {
        alert('Por favor, realiza primero el análisis en la calculadora para poder exportar.');
        return;
    }

    let mdContent = `# REPORTE DE RENDIMIENTO - OMNICORE\n`;
    mdContent += `Generado el: ${new Date().toLocaleDateString()}\n\n`;

    mdContent += `## Ficha de informacion\n`;
    mdContent += `| Parámetro | Detalle |\n`;
    mdContent += `| :--- | :--- |\n`;
    mdContent += `| **Nombre** | ${profile.name} |\n`;
    mdContent += `| **Edad** | ${profile.age} años |\n`;
    mdContent += `| **Peso** | ${profile.weight} kg |\n`;
    mdContent += `| **Altura** | ${profile.height} cm |\n\n`;

    mdContent += `## ANÁLISIS ENERGÉTICO Y MACROS\n`;
    mdContent += `| Métrica | Valor |\n`;
    mdContent += `| :--- | :--- |\n`;
    mdContent += `| Metabolismo Basal (TMB) | ${profile.tmb} kcal/día |\n`;
    mdContent += `| Mantenimiento (TDEE) | ${profile.kcal} kcal/día |\n`;
    mdContent += `| **Objetivo Final** | **${profile.finalCalories} kcal/día** (${profile.goal === 'deficit' ? 'Déficit' : 'Superávit'}) |\n`;
    mdContent += `| **Proteína Requerida** | **${profile.protein} g/día** |\n\n`;

    mdContent += `## PLAN DE ENTRENAMIENTO\n`;
    if (routines.length > 0) {
        routines.forEach(routine => {
            mdContent += `### 🔸 Rutina: ${routine.name} (${routine.exercises ? routine.exercises.length : 0} ejercicios)\n`;
            if (routine.exercises && routine.exercises.length > 0) {
                routine.exercises.forEach((ex, idx) => {
                    mdContent += `${idx + 1}. **${ex.name}** — ${ex.series || 4} series x ${ex.reps || 12} repeticiones\n`;
                });
            } else {
                mdContent += `*No se han añadido ejercicios a esta rutina todavía.*\n`;
            }
            mdContent += `\n`;
        });
    } else {
        mdContent += `*No hay rutinas creadas en este perfil.*\n\n`;
    }

    const backupData = { profile, routines };
    mdContent += `\n<!-- OMNICORE_DATA_BACKUP:${btoa(JSON.stringify(backupData))} -->\n`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `omnicore_reporte_${profile.name.toLowerCase().replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
</script>

<template>
<div class="min-h-screen bg-base-200 p-6">
    <main class="max-w-xl mx-auto bg-base-100 p-6 rounded-2xl border border-dashed border-base-content/20 shadow-md">
        <div class="border-b border-base-200 pb-4 mb-6">
            <h2 class="text-2xl font-black bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Perfil
            </h2>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
                Ficha de informacion
            </p>
        </div>

        <div v-if="profileData" class="space-y-6">
            <div class="flex items-center gap-3 bg-base-200/50 p-4 rounded-xl border border-base-300/30">
                <div class="w-12 h-12 shrink-0 select-none overflow-hidden rounded-full border-2 border-primary/30 bg-base-200">
                    <img 
                        :src="profileIconGif" 
                        alt="Icono de Energía"
                        class="w-full h-full object-contain"
                        loading="lazy"
                    />
                </div>
                <div>
                    <h3 class="font-black text-lg text-base-content leading-tight">{{ profileData.name }}</h3>
                    <p class="text-xs text-base-content/60 font-semibold uppercase tracking-wide mt-0.5">
                        {{ profileData.age }} años · {{ profileData.weight }} kg · {{ profileData.height }} cm
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="p-4 bg-base-200 rounded-xl border border-base-300/30">
                    <p class="text-2xs font-extrabold uppercase text-base-content/50 tracking-wider">Metabolismo (TMB)</p>
                    <p class="text-lg font-black font-mono text-base-content mt-1">{{ profileData.tmb }} <span class="text-xs">kcal</span></p>
                </div>
                <div class="p-4 bg-base-200 rounded-xl border border-base-300/30">
                    <p class="text-2xs font-extrabold uppercase text-base-content/50 tracking-wider">Mantenimiento (TDEE)</p>
                    <p class="text-lg font-black font-mono text-base-content mt-1">{{ profileData.kcal }} <span class="text-xs">kcal</span></p>
                </div>
            </div>

            <div class="p-5 rounded-2xl border border-base-300/50 space-y-3 bg-base-200/20">
                <h4 class="text-xs font-black uppercase text-secondary tracking-widest mb-1">Objetivo Nutricional de Rendimiento:</h4>
                <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-base-content/70">Calorías Objetivo:</span>
                    <span 
                        class="badge badge-lg font-mono font-black rounded-xl p-3 border-none bg-neutral text-neutral-content"
                    >
                        {{ profileData.finalCalories }} kcal / día
                    </span>
                </div>
                <div class="flex justify-between items-center text-sm font-bold pt-2 border-t border-base-300/40">
                    <span class="text-base-content/70">Proteínas Requeridas:</span>
                    <span class="badge badge-lg badge-neutral font-mono font-black rounded-xl p-3">
                        {{ profileData.protein }} g / día
                    </span>
                </div>
            </div>

            <div class="pt-4 flex justify-end">
                <button 
                    @click="exportToMarkdown" 
                    class="btn btn-ghost bg-transparent border border-base-300/60 hover:bg-base-200/40 btn-sm rounded-xl font-bold text-xs px-4 transition-all duration-200">
                    Descargar (.md)
                </button>
            </div>
        </div>

        <div v-else class="text-center py-12 space-y-3">
            <p class="text-sm text-base-content/50 font-bold">No has registrado tu análisis corporal todavía.</p>
            <router-link to="/calculator" class="btn btn-primary btn-sm rounded-xl text-xs font-bold px-4">
                Ir a la Calculadora
            </router-link>
        </div>
    </main>
</div>
</template>