<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const diets = ref([]);
const loading = ref(true);
const error = ref(null);

const isCreateModalOpen = ref(false);
const newDietName = ref('');

const editingDietId = ref(null);

const loadDiets = () => {
    loading.value = true;
    error.value = null;
    try {
        const savedDiets = localStorage.getItem('omnicore_diets');
        
        if (savedDiets) {
            diets.value = JSON.parse(savedDiets);
        } else {
            diets.value = [];
            localStorage.setItem('omnicore_diets', JSON.stringify([]));
        }
    } catch (err) {
        console.error(err);
        error.value = 'Error al inicializar la base de datos de dietas.';
    } finally {
        loading.value = false;
    }
};

const createNewDiet = () => {
    if (!newDietName.value.trim()) return;

    const newDiet = {
        id: 'diet_' + Date.now(),
        name: newDietName.value.trim(),
        meals: {
            desayuno: [],
            almuerzo: [],
            merienda: [],
            cena: []
        }
    };

    diets.value.push(newDiet);
    localStorage.setItem('omnicore_diets', JSON.stringify(diets.value));
    
    newDietName.value = '';
    isCreateModalOpen.value = false;
};

const deleteDietPlan = (dietId, dietName) => {
    if (confirm(`⚠️ ¿Estás seguro de eliminar por completo el plan de dieta "${dietName}"?`)) {
        diets.value = diets.value.filter(d => d.id !== dietId);
        localStorage.setItem('omnicore_diets', JSON.stringify(diets.value));
        
        if (editingDietId.value === dietId) {
            editingDietId.value = null;
        }
    }
};

const removeFoodFromMeal = (dietId, mealKey, foodInstanceId) => {
    const diet = diets.value.find(d => d.id === dietId);
    if (diet && diet.meals && diet.meals[mealKey]) {
        diet.meals[mealKey] = diet.meals[mealKey].filter(f => f.instanceId !== foodInstanceId);
        localStorage.setItem('omnicore_diets', JSON.stringify(diets.value));
    }
};

const calculateDietTotals = (meals) => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    Object.values(meals).forEach(mealArray => {
        mealArray.forEach(food => {
            calories += food.calories || 0;
            protein += food.protein || 0;
            carbs += food.carbs || 0;
            fat += food.fat || 0;
        });
    });
    return { calories, protein, carbs, fat };
};

onMounted(() => {
    loadDiets();
});
</script>

<template>
<main class="p-6 max-w-7xl mx-auto">
    <div class="flex flex-col sm:flex-row gap-4 mb-8 bg-base-100 p-6 rounded-2xl border border-dashed border-base-content/20 items-center justify-between">
        <div class="flex flex-col gap-0.5 shrink-0 px-2">
            <h2 class="text-2xl font-black tracking-tight bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Planes de Alimentación
            </h2>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
                {{ diets.length }} Planes nutricionales configurados
            </p>
        </div>
        
        <button 
            @click="isCreateModalOpen = true" 
            class="btn bg-transparent border border-base-content/20 hover:bg-base-200/40 btn-sm rounded-xl font-bold text-xs px-5 h-11 min-h-11 w-full sm:w-auto text-base-content transition-all duration-200">
            Nuevo Plan
        </button>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="loading loading-ring loading-lg text-primary"></span>
    </div>
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="text-secondary font-medium alert alert-error max-w-md rounded-xl shadow-sm">{{ error }}</span>
    </div>
    
    <div v-else-if="diets.length > 0" class="grid grid-cols-1 gap-8">
        <div 
            v-for="diet in diets" 
            :key="diet.id" 
            class="bg-base-100 p-6 rounded-2xl border border-base-content/20 shadow-md flex flex-col justify-between hover:border-base-content/30 transition-all duration-200"
        >
            <div>
                <div class="flex justify-between items-center mb-6 border-b border-base-200/60 pb-3">
                    <div class="flex items-center gap-2">
                        <h3 class="text-lg font-black text-base-content flex items-center gap-2">{{ diet.name }}</h3>
                        <button @click="deleteDietPlan(diet.id, diet.name)" class="btn btn-ghost btn-xs btn-circle text-base-content/20 hover:text-error hover:bg-error/10 font-bold ml-1">✕</button>
                    </div>
                    <div class="flex gap-2 text-xs font-mono font-bold">
                        <span class="badge badge-neutral p-3 rounded-xl border border-base-content/5">{{ calculateDietTotals(diet.meals).calories }} kcal</span>
                        <span class="badge badge-neutral text-success p-3 rounded-xl border border-base-content/5">Proteina: {{ calculateDietTotals(diet.meals).protein }}g</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(foodList, mealKey) in diet.meals" :key="mealKey" class="bg-base-200/40 p-4 rounded-xl border border-base-content/10 flex flex-col justify-between">
                        <div>
                            <h4 class="text-xs font-black uppercase text-secondary tracking-widest mb-3 flex justify-between items-center">
                                <span class="capitalize">{{ mealKey }}</span>
                                <span class="text-2xs text-base-content/40 font-mono font-bold">
                                    {{ foodList.reduce((sum, f) => sum + (f.calories || 0), 0) }} kcal
                                </span>
                            </h4>
                            
                            <ul v-if="foodList.length > 0" class="space-y-1.5">
                                <li v-for="food in foodList" :key="food.instanceId" class="flex items-center justify-between text-xs font-medium p-2 bg-base-100 border border-base-content/5 rounded-lg">
                                    <span class="truncate pr-2 text-base-content/90 font-semibold">{{ food.name }}</span>
                                    <div class="flex items-center gap-3 shrink-0 font-mono text-base-content/60">
                                        <span>{{ food.calories }} kcal</span>
                                        <button v-if="editingDietId === diet.id" @click="removeFoodFromMeal(diet.id, mealKey, food.instanceId)" class="btn btn-error btn-circle w-5 h-5 min-h-5 p-0 text-[10px] text-white leading-none hover:scale-105 transition-transform duration-150">x</button>
                                    </div>
                                </li>
                            </ul>
                            <p class="text-2xs text-base-content/30 italic font-medium pl-1 py-1" v-else>Sin alimentos asignados.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 pt-4 border-t border-base-200/60 flex justify-end gap-2">
                <button 
                    @click="editingDietId = editingDietId === diet.id ? null : diet.id" 
                    class="btn btn-sm text-xs font-bold rounded-xl px-6 bg-transparent border transition-all duration-200"
                    :class="editingDietId === diet.id ? 'border-success text-success hover:bg-success/10' : 'border-base-content/20 text-base-content hover:bg-base-200/40'"
                >
                    {{ editingDietId === diet.id ? 'Listo' : 'Editar Alimentos' }}
                </button>
            </div>
        </div>
    </div>

    <div class="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-base-content/20 max-w-xl mx-auto" v-else>
        <p class="text-sm text-base-content/50 font-bold">No tienes ningún plan de dieta configurado.</p>
        <p class="text-xs text-base-content/40 mt-1">Presiona el botón de arriba para estructurar tu pauta alimentaria.</p>
    </div>

    <dialog class="modal" :class="{ 'modal-open': isCreateModalOpen }">
        <div class="modal-box bg-base-100 rounded-2xl shadow-xl max-w-sm border border-base-content/10">
            <h3 class="font-black text-lg text-primary mb-1">Nueva Dieta</h3>
            <p class="text-xs text-base-content/60 mb-4 uppercase tracking-wide font-medium">Asigna un nombre a tu plan de alimentación</p>
            
            <div class="form-control w-full mb-6">
                <input v-model="newDietName" @keyup.enter="createNewDiet" type="text" placeholder="Ej: Volumen Limpio, Definición..." class="input input-bordered w-full rounded-xl focus:outline-none text-sm" required />
            </div>

            <div class="modal-action flex gap-2">
                <button @click="isCreateModalOpen = false" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">
                    Cancelar
                </button>
                <button @click="createNewDiet" :disabled="!newDietName.trim()" class="btn btn-success btn-sm text-xs rounded-xl font-bold text-white flex-1">
                    Guardar Plan
                </button>
            </div>
        </div>
    </dialog>
</main>
</template>