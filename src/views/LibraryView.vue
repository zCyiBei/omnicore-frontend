<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const exercises = ref([])
const routines = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const selectedMuscle = ref('')

const isModalOpen = ref(false)
const selectedExercise = ref(null)
const selectedRoutineId = ref('')

const seriesToSet = ref(3);
const repsToSet = ref(10);

const currentPage = ref(0)
const itemsPerPage = 6

onMounted(() => {
    const savedRoutines = localStorage.getItem('omnicore_routines')
    if (savedRoutines) {
        routines.value = JSON.parse(savedRoutines)
    }

    const jsonUrl = new URL('../data/exercise.json', import.meta.url).href
    fetch(jsonUrl)
    .then(response => {
        if (!response.ok) throw new Error('No se pudo cargar el archivo');
        return response.json();
    })
    .then(data => {
        const allExercises = data.flatMap(item => item.exercises || [])
        exercises.value = allExercises.map((exercise, index) => ({
            id: exercise.id || index,
            name: exercise.name,
            muscle: exercise.mainMuscle || 'General',
            image: exercise.image,
            difficulty: parseInt(exercise.difficulty) || 1,
            equipment: exercise.equipment || 'Ninguno',
            objectives: Array.isArray(exercise.muscles) ? exercise.muscles.join(' | ') : 'Ninguno'
        }))
    })
    .catch(err => {
        console.error(err)
        error.value = 'Error al cargar la base de datos de ejercicios.'
    })
    .finally(() => { loading.value = false })
})

const muscleGroups = computed(() => {
    if (!exercises.value || !Array.isArray(exercises.value)) return []
    const muscles = exercises.value.map(ex => ex.muscle?.trim()).filter(Boolean)
    return [...new Set(muscles)] 
})

const filteredMuscleGroups = computed(() => muscleGroups.value.filter(m => m !== 'Todos'))

const filteredExercisesBase = computed(() => {
    if (!exercises.value || !Array.isArray(exercises.value)) return []
    return exercises.value.filter(exercise => {
        const name = exercise.name ? String(exercise.name).toLowerCase() : ''
        const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : ''
        return name.includes(query) && (selectedMuscle.value === '' || exercise.muscle === selectedMuscle.value)
    })
})

const filteredExercises = computed(() => {
    const start = currentPage.value * itemsPerPage
    const end = start + itemsPerPage
    return filteredExercisesBase.value.slice(start, end)
})

const nextPage = () => {
    if ((currentPage.value + 1) * itemsPerPage < filteredExercisesBase.value.length) {
        currentPage.value++
    }
}

const prevPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--
    }
}

const handleSearch = () => {
    currentPage.value = 0
}

const openAddModal = (exercise) => {
    selectedExercise.value = exercise
    const savedRoutines = localStorage.getItem('omnicore_routines')
    if (savedRoutines) routines.value = JSON.parse(savedRoutines)
    
    selectedRoutineId.value = ''
    seriesToSet.value = 3
    repsToSet.value = 10
    isModalOpen.value = true
}

const addExerciseToSelectedRoutine = () => {
    if (!selectedRoutineId.value || !selectedExercise.value) return
    if (seriesToSet.value <= 0 || repsToSet.value <= 0) return

    const routineIndex = routines.value.findIndex(r => r.id === selectedRoutineId.value)
    
    if (routineIndex !== -1) {
        if (!routines.value[routineIndex].exercises) {
            routines.value[routineIndex].exercises = []
        }

        const exerciseToInject = {
            id: selectedExercise.value.id + '_' + Date.now(),
            name: selectedExercise.value.name,
            series: seriesToSet.value,
            reps: repsToSet.value
        }

        routines.value[routineIndex].exercises.push(exerciseToInject)
        localStorage.setItem('omnicore_routines', JSON.stringify(routines.value))
        
        isModalOpen.value = false
        selectedExercise.value = null
        selectedRoutineId.value = ''
        alert('Movimiento asignado correctamente a tu rutina.');
    }
}
</script>

<template>
<main class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex flex-col md:flex-row gap-4 mb-8 bg-base-100 p-5 rounded-2xl border border-dashed border-base-content/20 items-center justify-between">
        <div class="flex flex-col gap-0.5 shrink-0 px-2">
            <h2 class="text-2xl font-black tracking-tight bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Explorar Biblioteca
            </h2>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
                {{ filteredExercises.length }} Movimientos disponibles
            </p>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                Enfoque: {{ selectedMuscle || 'Anatomía General' }}
            </p>
        </div>

        <div class="flex flex-col gap-2 ml-auto items-end w-full max-w-xs">
            <input v-model="searchQuery" type="text" placeholder="Buscar ejercicio..." class="input border border-base-content/20 w-full h-11 text-sm rounded-xl focus:outline-none focus:border-primary" />
            <select v-model="selectedMuscle" class="select border border-base-content/20 w-full h-11 min-h-11 text-sm rounded-xl focus:outline-none focus:border-primary">
                <option value="">Todos los músculos</option>
                <option v-for="muscle in filteredMuscleGroups" :key="muscle" :value="muscle">{{ muscle }}</option>
            </select>
        </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="loading loading-ring loading-lg text-primary"></span>
    </div>
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="text-secondary font-medium alert alert-error max-w-md rounded-xl shadow-sm">⚠️ {{ error }}</span>
    </div>
    <div v-else-if="filteredExercises.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        <div v-for="exercise in filteredExercises" :key="exercise.id" class="card bg-base-100 w-full max-w-sm shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col rounded-2xl border border-dashed border-base-content/20 overflow-hidden">
            <figure class="px-4 pt-4 h-44 bg-base-300/10 shrink-0">
                <img :src="exercise.image" :alt="exercise.name" class="rounded-xl h-full w-full object-cover" loading="lazy" />
            </figure>

            <div class="card-body p-5 flex flex-col flex-1 gap-4">
                <div class="grow space-y-3">
                    <div class="flex justify-between items-start gap-2">
                        <h2 class="card-title text-base font-black leading-tight text-base-content line-clamp-2">{{ exercise.name }}</h2>
                        <span class="badge badge-secondary badge-md shrink-0 uppercase text-2xs font-extrabold tracking-wider rounded-lg">{{ exercise.muscle }}</span>
                    </div>

                    <div class="text-xs text-base-content/70 space-y-1.5 pt-1">
                        <p class="leading-relaxed">
                            <strong class="text-base-content/90 font-bold">Equipamiento:</strong> {{ exercise.equipment }}
                        </p>
                        <p class="leading-relaxed">
                            <strong class="text-base-content/90 font-bold">Objetivos:</strong> {{ exercise.objectives }}
                        </p>
                    </div>
                </div>
            
                <div class="pt-3 border-t border-base-200/60 space-y-3 shrink-0">
                    <p class="text-xs font-bold uppercase tracking-wide" :class="{'text-error': exercise.difficulty > 2, 'text-warning': exercise.difficulty === 2, 'text-success': exercise.difficulty < 2}">
                        ⚡ Dificultad: {{ exercise.difficulty }} / 3
                    </p>
                    <div class="card-actions justify-end">
                        <button @click="openAddModal(exercise)" class="btn btn-ghost border border-base-300/60 btn-sm gap-1 w-full sm:w-auto text-xs font-bold rounded-xl">
                            Añadir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-base-content/20" v-else>
        <p class="text-sm text-base-content/50 font-bold">No se encontraron movimientos para "{{ searchQuery }}".</p>
    </div>

    <div v-if="filteredExercises.length > 0" class="flex items-center justify-center gap-4 pt-4 mt-6 border-t border-base-300/40">
        <button @click="prevPage" :disabled="currentPage === 0" class="btn btn-outline btn-sm rounded-xl text-xs font-bold px-4">
            Anterior
        </button>
        <span class="text-xs font-bold text-base-content/60">Página {{ currentPage + 1 }}</span>
        <button @click="nextPage" :disabled="(currentPage + 1) * itemsPerPage >= filteredExercisesBase.length" class="btn btn-outline btn-sm rounded-xl text-xs font-bold px-4">
            Siguiente
        </button>
    </div>

    <dialog class="modal" :class="{ 'modal-open': isModalOpen }">
        <div class="modal-box bg-base-100 rounded-2xl shadow-xl max-w-sm border border-base-content/10">
            <h3 class="font-black text-lg text-primary mb-1">Añadir a Plan Entrenamiento</h3>
            <p class="text-xs text-base-content/60 mb-4 uppercase tracking-wide font-medium">
                Agregar: "{{ selectedExercise?.name }}"
            </p>

            <div v-if="routines.length > 0" class="space-y-4">
                <div class="form-control w-full">
                    <label class="label pb-1"><span class="label-text font-bold text-xs text-base-content/60 uppercase">Elige la Rutina</span></label>
                    <select v-model="selectedRoutineId" class="select select-bordered border-base-content/20 w-full rounded-xl text-sm h-12 min-h-12 focus:outline-none">
                        <option value="" disabled>Selecciona una rutina...</option>
                        <option v-for="routine in routines" :key="routine.id" :value="routine.id">
                            🏋️‍♂️ {{ routine.name }}
                        </option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control w-full">
                        <label class="label pb-1">
                            <span class="label-text font-bold text-xs text-base-content/60 uppercase whitespace-nowrap">
                                Series
                            </span>
                        </label>
                        <input 
                            v-model.number="seriesToSet" 
                            type="number" 
                            min="1" 
                            class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm font-bold text-center font-mono rounded-xl focus:outline-none focus:border-primary py-0" 
                        />
                    </div>

                    <div class="form-control w-full">
                        <label class="label pb-1">
                            <span class="label-text font-bold text-xs text-base-content/60 uppercase whitespace-nowrap">
                                Repeticiones
                            </span>
                        </label>
                        <input 
                            v-model.number="repsToSet" 
                            type="number" 
                            min="1" 
                            class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm font-bold text-center font-mono rounded-xl focus:outline-none focus:border-primary py-0" 
                        />
                    </div>
                </div>

                <div class="p-3 bg-neutral text-center rounded-xl border border-base-content/5 font-mono text-xs font-bold text-white flex items-center justify-center gap-2 mt-2">
                    <span>Volumen total:</span>
                    <span class="text-primary font-black">{{ seriesToSet || 0 }}</span>
                    <span class="text-base-content/40">×</span>
                    <span class="text-secondary font-black">{{ repsToSet || 0 }}</span>
                    <span class="text-base-content/60 font-normal">reps</span>
                </div>

                <div class="modal-action flex gap-2 pt-2">
                    <button @click="isModalOpen = false" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">Cancelar</button>
                    <button @click="addExerciseToSelectedRoutine" :disabled="!selectedRoutineId || seriesToSet <= 0 || repsToSet <= 0" class="btn btn-success btn-sm text-xs rounded-xl font-bold text-white flex-1">
                        Confirmar
                    </button>
                </div>
            </div>

            <div class="text-center py-4 space-y-4" v-else>
                <div class="p-4 rounded-xl border border-dashed border-base-content/20 bg-base-200/30">
                    <p class="text-sm font-bold text-base-content/70">No tienes rutinas creadas en tu ficha.</p>
                </div>
                <div class="modal-action flex gap-2">
                    <button @click="isModalOpen = false" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">Cerrar</button>
                    <button @click="router.push({ name: 'Routine' })" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">
                        Crear mi primer Plan
                    </button>
                </div>
            </div>
        </div>
    </dialog>
</main>
</template>