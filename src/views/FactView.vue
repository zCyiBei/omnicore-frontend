<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const foodItems = ref([]);
const loading = ref(true);
const error = ref(null);

const searchQuery = ref('');
const currentPage = ref(0);

const router = useRouter();

const servingsToEat = ref(1); 

const getNutritionFacts = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await fetch(`http://localhost:8000/api/nutrition/?search=${searchQuery.value}&page=${currentPage.value}`);
        
        if (!response.ok) {
            throw new Error('No se pudo conectar con el servidor local de Django.');
        }
        
        const data = await response.json();
        
        if (data.foods && data.foods.food) {
            const rawFoods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
            
            const seenNames = new Set();
            const uniqueFoods = [];

            for (const item of rawFoods) {
                const standardizedName = item.food_name ? item.food_name.trim().toLowerCase() : '';
                
                if (standardizedName && !seenNames.has(standardizedName)) {
                    seenNames.add(standardizedName);
                    uniqueFoods.push({
                        id: item.food_id,
                        name: item.food_name,
                        description: item.food_description || 'Sin información de macros disponible.',
                        recipeIntro: item.recipe_intro || 'Entrada verificada desde la base de datos oficial.'
                    });
                }
            }

            foodItems.value = uniqueFoods;
        } else {
            foodItems.value = [];
        }

    } catch (err) {
        console.error(err);
        error.value = 'Error al sincronizar los datos nutricionales.';
    } finally {
        loading.value = false;
    }
};

const nextPage = () => {
    currentPage.value++;
    getNutritionFacts();
};

const prevPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--;
        getNutritionFacts();
    }
};

const handleSearch = () => {
    currentPage.value = 0;
    getNutritionFacts();
};

const isModalOpen = ref(false);
const diets = ref([]);
const selectedFood = ref(null);
const selectedDietId = ref('');
const selectedMealKey = ref('');

const openAddDietModal = (food) => {
    selectedFood.value = food;
    
    const savedDiets = localStorage.getItem('omnicore_diets');
    diets.value = savedDiets ? JSON.parse(savedDiets) : [];
    
    selectedDietId.value = '';
    selectedMealKey.value = '';
    servingsToEat.value = 1;
    isModalOpen.value = true;
};

const getCalculatedMacros = () => {
    if (!selectedFood.value) return { calories: 0, protein: 0 };
    
    const desc = selectedFood.value.description || '';
    let baseCalories = 0;
    let baseProtein = 0;

    const caloriesMatch = desc.match(/Calories:\s*([\d.]+)/i);
    const proteinMatch = desc.match(/Protein:\s*([\d.]+)/i);

    if (caloriesMatch) baseCalories = parseFloat(caloriesMatch[1]);
    if (proteinMatch) baseProtein = parseFloat(proteinMatch[1]);

    return {
        calories: Math.floor(baseCalories * servingsToEat.value),
        protein: Math.round(baseProtein * servingsToEat.value)
    };
};

const addFoodToSelectedDiet = () => {
    if (!selectedDietId.value || !selectedMealKey.value || !selectedFood.value) return;
    if (servingsToEat.value <= 0) return;

    const dietIndex = diets.value.findIndex(d => d.id === selectedDietId.value);
    
    if (dietIndex !== -1) {
        if (!diets.value[dietIndex].meals) {
            diets.value[dietIndex].meals = { desayuno: [], almuerzo: [], merienda: [], cena: [] };
        }

        const calculated = getCalculatedMacros();

        const foodToInject = {
            instanceId: 'food_' + Date.now(),
            id: selectedFood.value.id,
            name: `${selectedFood.value.name} (${servingsToEat.value} porc.)`,
            calories: calculated.calories,
            protein: calculated.protein   
        };

        diets.value[dietIndex].meals[selectedMealKey.value].push(foodToInject);
        
        localStorage.setItem('omnicore_diets', JSON.stringify(diets.value));
        
        isModalOpen.value = false;
        selectedFood.value = null;
        selectedDietId.value = '';
        selectedMealKey.value = '';
        alert('🍛 Alimento añadido correctamente con sus macronutrientes.');
    }
};

onMounted(() => {
    getNutritionFacts();
});
</script>

<template>
<div class="p-6 max-w-4xl mx-auto">
    <div class="flex flex-col md:flex-row gap-4 mb-8 bg-base-100 p-5 rounded-2xl border border-dashed border-base-content/20 items-center justify-between">
        <div class="flex flex-col px-1">
            <h2 class="text-2xl font-black bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Nutricional Global
            </h2>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
                Datos nutricional de alimentos
            </p>
        </div>
        
        <div class="form-control w-full max-w-xs">
            <div class="join w-full items-center">
                <input 
                    v-model="searchQuery" 
                    @keyup.enter="handleSearch"
                    type="text" 
                    placeholder="Buscar alimento (ej: Arroz, Huevo)..." 
                    class="input border border-base-content/20 join-item w-full h-11 text-sm focus:outline-none focus:border-primary py-0" 
                />
                <button 
                    @click="handleSearch" 
                    class="btn btn-ghost bg-transparent border border-base-content/20 join-item h-11 min-h-11 text-xs font-bold px-5 py-0 box-border hover:bg-base-200/40">
                    Buscar
                </button>
            </div>
        </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <p class="text-xs text-base-content/60 font-medium animate-pulse">Consultando servidores de FatSecret...</p>
    </div>

    <div v-else-if="error" class="alert alert-error shadow-sm text-sm rounded-xl">
        <span>⚠️ {{ error }}</span>
    </div>

    <div v-else-if="foodItems.length > 0" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
                v-for="food in foodItems" 
                :key="food.id"
                class="bg-base-100 p-5 rounded-2xl border border-dashed border-base-content/20 shadow-md flex flex-col justify-between hover:border-primary/30 transition-all duration-200">
<div>
    <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">🍛</span>
        <h3 class="font-bold text-base-content text-sm leading-tight line-clamp-1">{{ food.name }}</h3>
    </div>
    
    <p class="text-xs text-base-content/70 leading-relaxed pl-7 whitespace-pre-line font-medium">
        {{ food.description.replaceAll(' | ', '\n') }}
    </p>

    <p v-if="food.recipeIntro" class="mt-3 pl-7 text-xs text-secondary font-semibold leading-relaxed border-t border-base-content/5 pt-2">
        <strong class="text-base-content/80">Descripcion</strong> 
        <span class="block mt-0.5 text-base-content/70 font-normal">{{ food.recipeIntro }}</span>
    </p>

    <div class="flex justify-end pt-5 mt-2 border-t border-base-content/5">
        <button @click="openAddDietModal(food)" class="btn btn-ghost btn-xs rounded-lg font-bold px-3">
            Añadir
        </button>
    </div>
</div>
            </div>
        </div>

        <div class="flex items-center justify-center gap-4 pt-4 border-t border-base-300/40">
            <button @click="prevPage" :disabled="currentPage === 0" class="btn btn-outline btn-sm rounded-xl text-xs font-bold px-4">
                Anterior
            </button>
            <span class="text-xs font-bold text-base-content/60">Página {{ currentPage + 1 }}</span>
            <button @click="nextPage" class="btn btn-outline btn-sm rounded-xl text-xs font-bold px-4">
                Siguiente
            </button>
        </div>
    </div>

    <div v-else class="text-center py-16 bg-base-100 rounded-2xl border border-dashed border-base-content/20">
        <p class="text-sm text-base-content/50 font-bold">No se encontraron registros para "{{ searchQuery }}".</p>
        <p class="text-xs text-base-content/40 mt-1">Prueba refinando el término de búsqueda.</p>
    </div>

    <dialog class="modal" :class="{ 'modal-open': isModalOpen }">
        <div class="modal-box bg-base-100 rounded-2xl shadow-xl max-w-sm border border-base-content/10">
            <h3 class="font-black text-lg text-primary mb-1">Añadir a Plan Nutricional</h3>
            <p class="text-xs text-base-content/60 mb-4 uppercase tracking-wide font-medium">
                Alimento: "{{ selectedFood?.name }}"
            </p>

            <div v-if="diets.length > 0" class="space-y-4">
                <div class="form-control w-full">
                    <label class="label pb-1"><span class="label-text font-bold text-xs text-base-content/60 uppercase">Selecciona el Plan:</span></label>
                    <select v-model="selectedDietId" class="select select-bordered border-base-content/20 w-full rounded-xl text-sm h-12 min-h-12 focus:outline-none">
                        <option value="" disabled>Elige un plan de dieta...</option>
                        <option v-for="diet in diets" :key="diet.id" :value="diet.id">
                            {{ diet.name }}
                        </option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control w-full">
                        <label class="label pb-1"><span class="label-text font-bold text-xs text-base-content/60 uppercase">Momento del Día:</span></label>
                        <select v-model="selectedMealKey" :disabled="!selectedDietId" class="select select-bordered border-base-content/20 w-full rounded-xl text-sm h-12 min-h-12 focus:outline-none">
                            <option value="" disabled>Selecciona...</option>
                            <option value="desayuno">🍳 Desayuno</option>
                            <option value="almuerzo">🍗 Almuerzo</option>
                            <option value="merienda">☕ Merienda</option>
                            <option value="cena">🥗 Cena</option>
                        </select>
                    </div>

                    <div class="form-control w-full">
                        <label class="label pb-1">
                            <span class="label-text font-bold text-xs text-base-content/60 uppercase whitespace-nowrap">
                                Porciones:
                            </span>
                        </label>
                        <input 
                            v-model.number="servingsToEat" 
                            type="number" 
                            step="0.25"
                            min="0.25" 
                            class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm font-bold text-center font-mono rounded-xl focus:outline-none focus:border-primary py-0" 
                        />
                    </div>
                </div>

                <div v-if="selectedFood" class="p-3 bg-neutral text-center rounded-xl border border-base-content/5 font-mono text-xs font-bold text-white flex items-center justify-center gap-2">
                    <span>⚡ Añadirás:</span>
                    <span class="text-primary font-black">{{ getCalculatedMacros().calories }} kcal</span>
                    <span class="text-base-content/40">|</span>
                    <span class="text-secondary font-black">{{ getCalculatedMacros().protein }}g Prot</span>
                </div>

                <div class="modal-action flex gap-2 pt-2">
                    <button @click="isModalOpen = false" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">Cancelar</button>
                    <button @click="addFoodToSelectedDiet" :disabled="!selectedDietId || !selectedMealKey || servingsToEat <= 0" class="btn btn-success btn-sm text-xs rounded-xl font-bold text-white flex-1">
                        Confirmar
                    </button>
                </div>
            </div>

            <div v-else class="text-center py-4 space-y-4">
                <div class="p-4 rounded-xl border border-dashed border-base-content/20 bg-base-200/30">
                    <p class="text-sm font-bold text-base-content/70">No tienes pautas de dieta creadas.</p>
                </div>
                <div class="modal-action flex gap-2">
                    <button @click="isModalOpen = false" class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">Cerrar</button>

                    <button 
                        @click="router.push('/diet')"
                        class="btn btn-ghost btn-sm text-xs rounded-xl font-bold flex-1">
                        Crear mi primer Plan
                    </button>
                </div>
            </div>
        </div>
    </dialog>
</div>


</template>
