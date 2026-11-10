<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const routines = ref([]);
const loading = ref(true);
const error = ref(null);

const isCreateModalOpen = ref(false);
const newRoutineName = ref('');

const loadRoutines = () => {
    loading.value = true;
    const savedRoutines = localStorage.getItem('omnicore_routines');
    
    if (savedRoutines) {
        routines.value = JSON.parse(savedRoutines);
        loading.value = false;
    } else {
        const jsonUrl = new URL('../data/routine.json', import.meta.url).href;
        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) throw new Error('No se pudo cargar el archivo de rutinas');
                return response.json();
            })
            .then(data => {
                routines.value = data;
                localStorage.setItem('omnicore_routines', JSON.stringify(data));
            })
            .catch(err => {
                console.error(err);
                error.value = 'Error al cargar la base de datos de rutinas.';
            })
            .finally(() => loading.value = false);
    }
};

const createNewRoutine = () => {
    if (!newRoutineName.value.trim()) return;

    const newRoutine = {
        id: 'routine_' + Date.now(),
        name: newRoutineName.value.trim(),
        exercises: []
    };

    routines.value.push(newRoutine);
    localStorage.setItem('omnicore_routines', JSON.stringify(routines.value));
    
    newRoutineName.value = '';
    isCreateModalOpen.value = false;
};

onMounted(() => {
    loadRoutines();
});

const editingRoutineId = ref(null);

const toggleEditMode = (routineId) => {
    if (editingRoutineId.value === routineId) {
        editingRoutineId.value = null;
    } else {
        editingRoutineId.value = routineId;
    }
};

const removeExercise = (routineId, exerciseId) => {
    const routine = routines.value.find(r => r.id === routineId);
    if (routine && routine.exercises) {
        routine.exercises = routine.exercises.filter(ex => ex.id !== exerciseId);
        localStorage.setItem('omnicore_routines', JSON.stringify(routines.value));
    }
};

const exportRoutineToMarkdown = (routine) => {
    if (!routine) return;

    let mdContent = `# RUTINA DE ENTRENAMIENTO - ${routine.name.toUpperCase()}\n`;
    mdContent += `Exportado desde Omnicore · ${new Date().toLocaleDateString()}\n\n`;
    mdContent += `| Ejercicio | Volúmen de Trabajo | Estado |\n`;
    mdContent += `| :--- | :--- | :---: |\n`;

    if (routine.exercises && routine.exercises.length > 0) {
        routine.exercises.forEach(ex => {
            mdContent += `| **${ex.name}** | ${ex.series || 4} series x ${ex.reps || 12} reps | [ ] Completado |\n`;
        });
    } else {
        mdContent += `| *No hay ejercicios asignados* | - | - |\n`;
    }

    mdContent += `\n\n🎯 *Tip: Puedes importar este archivo en Obsidian o Notion para entrenar hoy.*`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rutina_${routine.name.toLowerCase().replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const deleteRoutinePlan = (routineId, routineName) => {
    const confirmDelete = confirm(`⚠️ ¿Estás seguro de que deseas eliminar por completo la rutina "${routineName}"?`);
    
    if (confirmDelete) {
        routines.value = routines.value.filter(r => r.id !== routineId);
        localStorage.setItem('omnicore_routines', JSON.stringify(routines.value));
        
        if (editingRoutineId.value === routineId) {
            editingRoutineId.value = null;
        }
    }
};
</script>

<template>
<main class="p-6 max-w-7xl mx-auto">
    <div class="flex flex-col sm:flex-row gap-4 mb-8 bg-base-100 p-6 rounded-2xl border border-dashed border-base-content/20 items-center justify-between">
        <div class="flex flex-col gap-0.5 shrink-0 px-2">
            <h2 class="text-2xl font-black tracking-tight bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Planes de Entrenamiento
            </h2>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
                {{ routines.length }} Planes de entrenamientos configurados
            </p>
        </div>
        <button @click="isCreateModalOpen = true" class="btn bg-transparent border border-base-content/20 hover:bg-base-200/40 shadow-xs btn-sm rounded-xl font-bold text-xs px-5 h-11 min-h-11 w-full sm:w-auto text-base-content transition-all duration-200">
            Nuevo Plan
        </button>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="loading loading-ring loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="text-secondary font-medium alert alert-error max-w-md rounded-xl shadow-sm">⚠️ {{ error }}</span>
    </div>
    
    <div v-else-if="routines.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
            v-for="routine in routines" 
            :key="routine.id" 
            class="bg-base-100 p-6 rounded-2xl border border-dashed border-base-content/20 flex flex-col justify-between hover:border-base-content/40 transition-all duration-200">
            <div>
                <div class="flex justify-between items-center mb-4 border-b border-base-200/60 pb-3">
                    <div class="flex items-center gap-2">
                        <h3 class="text-lg font-black text-base-content flex items-center gap-2">
                            {{ routine.name }}
                        </h3>
                        
                        <button 
                            @click="deleteRoutinePlan(routine.id, routine.name)"
                            class="btn btn-ghost btn-xs btn-circle text-base-content/20 hover:text-error hover:bg-error/10 transition-all duration-150 font-bold ml-1"
                            title="Eliminar rutina completa">
                            ✕
                        </button>
                    </div>

                    <span class="badge badge-ghost font-mono text-xs font-bold px-2.5 py-3">
                        {{ routine.exercises ? routine.exercises.length : 0 }} EJERCICIOS
                    </span>
                </div>
                
                <ul v-if="routine.exercises && routine.exercises.length > 0" class="space-y-2">
                    <li 
                        v-for="ex in routine.exercises" 
                        :key="ex.id" 
                        class="flex items-center justify-between p-3 bg-base-200/50 rounded-xl text-sm font-medium border border-base-300/30">
                        <span class="text-base-content font-semibold">{{ ex.name }}</span>
                        <div class="flex items-center gap-4">
                            <div class="flex gap-3 text-xs font-bold text-base-content/60 font-mono">
                                <span>{{ ex.series || 3 }}s</span>
                                <span>x</span>
                                <span>{{ ex.reps || 10 }}r</span>
                            </div>
                            
                            <button 
                                v-if="editingRoutineId === routine.id"
                                @click="removeExercise(routine.id, ex.id)"
                                class="btn btn-error btn-xs btn-square text-white rounded-lg hover:scale-105 transition-transform duration-150"
                                title="Eliminar ejercicio">
                                🗑️
                            </button>
                        </div>
                    </li>
                </ul>
                <p v-else class="text-xs text-base-content/40 font-medium italic py-2 pl-1">
                    No has añadido movimientos a este entrenamiento todavía.
                </p>
            </div>
            
            <div class="mt-6 pt-4 border-t border-base-200/60 flex gap-2">
                <button 
                    @click="toggleEditMode(routine.id)" 
                    class="btn btn-sm text-xs font-bold rounded-xl flex-1 bg-transparent border transition-all duration-200"
                    :class="editingRoutineId === routine.id ? 'border-success text-success hover:bg-success/10' : 'border-base-300 text-base-content hover:bg-base-200/40'"
                >
                    {{ editingRoutineId === routine.id ? 'Listo' : 'Editar' }}
                </button>
                
                <button 
                    @click="exportRoutineToMarkdown(routine)"
                    :disabled="!routine.exercises || routine.exercises.length === 0"
                    class="btn btn-ghost btn-sm border border-base-300/60 text-xs font-bold rounded-xl flex-1">
                    Exportar (.md)
                </button>
            </div>
        </div>
    </div>

    <div v-else class="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-base-content/20 max-w-xl mx-auto">
        <p class="text-sm text-base-content/50 font-bold">No tienes ningun plan de rutina creada.</p>
        <p class="text-xs text-base-content/40 mt-1">Crea tu primer plan arriba para comenzar a estructurar tus entrenamientos.</p>
    </div>

    <dialog class="modal" :class="{ 'modal-open': isCreateModalOpen }">
        <div class="modal-box bg-base-100 rounded-2xl shadow-xl max-w-sm border border-base-300/50">
            <h3 class="font-black text-lg text-primary mb-1">Nueva Rutina</h3>
            <p class="text-xs text-base-content/60 mb-4 uppercase tracking-wide font-medium">Asigna un nombre a tu plan de entrenamiento</p>
        
            <div class="form-control w-full mb-6">
                <input 
                    v-model="newRoutineName"
                    @keyup.enter="createNewRoutine"
                    type="text" 
                    placeholder="Ej: Pecho y Tríceps, Piernas..." 
                    class="input input-bordered w-full rounded-xl focus:outline-none text-sm"
                    required
                />
            </div>

            <div class="modal-action flex gap-2">
                <button @click="isCreateModalOpen = false" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">Cancelar</button>
                <button @click="createNewRoutine" :disabled="!newRoutineName.trim()" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold text-white flex-1">
                    Guardar Plan
                </button>
            </div>
        </div>
    </dialog>
</main>
</template>