<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const foodItems = ref([]);
const loading = ref(true);
const error = ref(null);

const searchQuery = ref('');
const currentPage = ref(0);

const router = useRouter();

const imageCache = new Map();


const getMealImage = async (foodName, recipeName = '') => {

    const simplify = (name) => {
        return name
            .toLowerCase()
            .replace(/\([^)]*\)/g, '')
            .replace(/\b\d+\s*(oz|g|kg|ml|lb)\b/gi, '')
            .replace(/\b(puerto rican style|dominican style|mexican style)\b/gi, '')
            .replace(/\b(enriched|long grain|white|brown|organic|rice)\b/gi, '')
            .replace(/[^a-záéíóúñ ]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const searches = [
        recipeName,
        foodName,
        simplify(recipeName),
        simplify(foodName)
    ].filter(Boolean);

    const uniqueSearches = [...new Set(searches)];

    for (const name of uniqueSearches) {

        try {
            const response = await fetch(
                `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`
            );
            if (!response.ok) continue;
            const data = await response.json();
            const meal = data.meals?.[0];
            if (meal?.strMealThumb) {
                return meal.strMealThumb;
            }
        } catch (error) {
            console.error('Error TheMealDB:', error);
        }
    }

    return null;
};

const servingsToEat = ref(1); 

const isInfoModalOpen = ref(false);
const selectedRecipe = ref(null);

const openInfoModal = (food) => {
    selectedRecipe.value = food.recipeDetail;
    isInfoModalOpen.value = true;
};

const getNutritionFacts = async () => {
    loading.value = true;
    error.value = null;

    try {
        const response = await fetch(
            `http://localhost:8000/api/nutrition/?search=${encodeURIComponent(searchQuery.value)}&page=${currentPage.value}`
        );

        if (!response.ok) {
            throw new Error('No se pudo conectar con Django.');
        }

        const data = await response.json();

        if (data.foods && data.foods.food) {

            const rawFoods = Array.isArray(data.foods.food)
                ? data.foods.food
                : [data.foods.food];

            const seenNames = new Set();
            const uniqueFoods = [];

            for (const item of rawFoods) {

                const standardizedName = item.food_name
                    ? item.food_name.trim().toLowerCase()
                    : '';

                if (!standardizedName || seenNames.has(standardizedName)) {
                    continue;
                }

                seenNames.add(standardizedName);

                const recipe = item.recipe_detail || null;

                let rawIngredients = [];

                if (recipe) {
                    rawIngredients =
                        recipe.ingredients?.ingredient ||
                        recipe.recipe_ingredients?.ingredient ||
                        [];
                }

                if (!Array.isArray(rawIngredients)) {
                    rawIngredients = [rawIngredients];
                }

                const seenIngredients = new Set();

                const ingredients = rawIngredients
                    .map(ingredient => {

                        if (typeof ingredient === 'string') {
                            return ingredient.trim();
                        }

                        if (typeof ingredient === 'object' && ingredient !== null) {
                            return (
                                ingredient.ingredient_description ||
                                ingredient.food_name ||
                                ingredient.ingredient_name ||
                                ''
                            ).trim();
                        }

                        return '';

                    })
                    .filter(ingredient => {
                        if (!ingredient) return false;
                        const key = ingredient.toLowerCase();
                        if (seenIngredients.has(key)) {
                            return false;
                        }

                        seenIngredients.add(key);
                        return true;
                    })
                    .map(description => ({
                        description
                    }));

                let rawDirections = recipe?.directions?.direction || [];

                if (!Array.isArray(rawDirections)) {
                    rawDirections = [rawDirections];
                }

                const seenDirections = new Set();
                const directions = rawDirections
                    .map((step, index) => {
                        const description = (
                            typeof step === 'string'
                                ? step
                                : step?.direction_description || ''
                        ).trim();

                        return {
                            number: index + 1,
                            description
                        };
                    })
                    .filter(step => {
                        if (!step.description) return false;
                        const key = step.description.toLowerCase();
                        if (seenDirections.has(key)) {
                            return false;
                        }
                        seenDirections.add(key);
                        return true;
                    });

                const recipeDetail = recipe ? {
                    id: recipe.recipe_id,
                    name: recipe.recipe_name,
                    ingredients,
                    directions,
                    preparationTime: recipe.preparation_time_min || null,
                    cookingTime: recipe.cooking_time_min || null,
                    servings: recipe.number_of_servings || null
                } : null;

                uniqueFoods.push({
                    id: item.food_id,
                    name: item.food_name,
                    description: item.food_description || '',
                    image: item.food_image || null,
                    recipeDetail
                });
            }

            await Promise.all(
                uniqueFoods.map(async (food) => {
                    food.image = await getMealImage(
                        food.name,
                        food.recipeDetail?.name
                    );
                })
            );

            uniqueFoods.sort((a, b) => {
                const score = (food) => {
                    let points = 0;
                    if (food.recipeDetail) points += 2;
                    if (food.image) points += 1;
                    return points;
                };
                return score(b) - score(a);
            });

            foodItems.value = uniqueFoods;
        } else {
            foodItems.value = [];
        }

    } catch (err) {
        console.error('Error obteniendo alimentos:', err);
        error.value = 'Error al sincronizar los datos nutricionales.';
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    currentPage.value = 0;
    getNutritionFacts();
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
    if (!selectedFood.value) {
        return { calories: 0, protein: 0 };
    }

    const desc = selectedFood.value.description || '';

    const caloriesMatch = desc.match(/Calories:\s*([\d.]+)/i);
    const proteinMatch = desc.match(/Protein:\s*([\d.]+)/i);

    const baseCalories = caloriesMatch
        ? parseFloat(caloriesMatch[1])
        : 0;

    const baseProtein = proteinMatch
        ? parseFloat(proteinMatch[1])
        : 0;

    return {
        calories: Math.round(baseCalories * servingsToEat.value),
        protein: Number((baseProtein * servingsToEat.value).toFixed(1))
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
                        class="input border border-base-content/20 join-item w-full h-11 text-sm focus:outline-none focus:border-primary py-0" />
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
                <div v-for="food in foodItems" :key="food.id"class="bg-base-100 p-5 rounded-2xl border border-dashed border-base-content/20 shadow-md flex flex-col justify-between hover:border-primary/30 transition-all duration-200">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-bold text-base-content text-sm leading-tight">
                                {{ food.name }}
                            </h3>
                        </div>
                        <div class="flex items-center gap-4 mt-3">
                            <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-base-200">
                                <img 
                                v-if="food.image"
                                :src="food.image"
                                :alt="food.name"
                                class="w-full h-full object-cover"
                                loading="lazy"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center text-3xl"> 🍛 </div>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-base-content/70 leading-relaxed whitespace-pre-line font-medium">
                                {{ food.description.replaceAll(' | ', '\n') }}
                            </p>
                        </div>
                        <div class="flex justify-end pt-5 mt-2 border-t border-base-content/5">
                            <button
                                v-if="food.recipeDetail"
                                @click="openInfoModal(food)"
                                class="btn btn-outline btn-grey btn-xs rounded-lg font-bold px-3">
                                + Info
                            </button>
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
        <dialog class="modal" :class="{ 'modal-open': isInfoModalOpen }">
            <div class="modal-box bg-base-100 rounded-2xl shadow-xl max-w-2xl">
                <h3 class="font-black text-lg text-primary mb-4">
                    🍽 {{ selectedRecipe?.name }}
                </h3>
                <div v-if="selectedRecipe" class="space-y-5">
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="bg-base-200 rounded-xl p-3">
                            <p class="text-xs text-base-content/50">Preparación</p>
                            <p class="font-bold">
                                {{ selectedRecipe.preparationTime || '--' }} min
                            </p>
                        </div>
                        <div class="bg-base-200 rounded-xl p-3">
                            <p class="text-xs text-base-content/50">Cocción</p>
                            <p class="font-bold">
                                {{ selectedRecipe.cookingTime || '--' }} min
                            </p>
                        </div>
                        <div class="bg-base-200 rounded-xl p-3">
                            <p class="text-xs text-base-content/50">Porciones</p>
                            <p class="font-bold">
                                {{ selectedRecipe.servings || '--' }}
                            </p>
                        </div>
                    </div>
                    <section>
                        <h4 class="font-black text-primary mb-3">
                            🥕 Ingredientes
                        </h4>
                        <ul v-if="selectedRecipe.ingredients?.length"
                            class="space-y-2">
                            <li
                                v-for="(ingredient, index) in selectedRecipe.ingredients"
                                :key="index"
                                class="bg-base-200/50 p-3 rounded-lg text-sm">
                                <span class="font-bold text-primary">
                                    {{ index + 1 }}.
                                </span>                            
                                {{ ingredient.description }}
                            </li>
                        </ul>
                        <p v-else class="text-sm text-base-content/50">
                            No hay ingredientes disponibles.
                        </p>
                    </section>
                    <section>
                        <h4 class="font-black text-secondary mb-3">
                            👨‍🍳 Preparación
                        </h4>
                        <ol v-if="selectedRecipe.directions?.length"
                            class="space-y-3">
                            <li
                                v-for="(step, index) in selectedRecipe.directions"
                                :key="index"
                                class="flex gap-3 text-sm leading-relaxed">
                                <span class="badge badge-secondary badge-sm">
                                    {{ step.number }}
                                </span>
                                <span>{{ step.description }}</span>
                            </li>
                        </ol>
                    
                        <p v-else class="text-sm text-base-content/50">
                            No hay instrucciones disponibles.
                        </p>
                    </section>
                </div>
                <div class="modal-action">
                    <button
                        @click="isInfoModalOpen = false"
                        class="btn btn-primary btn-sm rounded-xl">
                        Cerrar
                    </button>
                </div>
            </div>
            <div class="modal-backdrop"
                @click="isInfoModalOpen = false">
            </div>  
        </dialog>
    </div>
</template>