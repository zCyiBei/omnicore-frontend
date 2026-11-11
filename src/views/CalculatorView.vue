<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const name = ref('')
const age = ref(0)
const weight = ref(0)
const height = ref(0)
const gender = ref('')
const activityLevel = ref('')

const tmb = ref(null)
const tdee = ref(null)
const resultType = ref('tdee')

const targetCalories = ref()
const finalCaloriesResult = ref(null)

const router = useRouter()

const validateAge = (age) => age >= 1 && age <= 120
const validateWeight = (weight) => weight >= 30 && weight <= 300
const validateHeight = (height) => height >= 120 && height <= 250

const calculateTMB = () => {
    if (gender.value === 'male') {
        return 88.362 + (13.397 * weight.value) + (4.799 * height.value) - (5.677 * age.value)
    } else {
        return 447.593 + (9.247 * weight.value) + (3.098 * height.value) - (4.330 * age.value)
    }
}

const calculateTDEE = () => {
    const tmbValue = calculateTMB()
    const activityFactor = parseFloat(activityLevel.value) || 1
    return Math.floor(tmbValue * activityFactor)
}

const calculateProteinIntake = () => {
    return Math.round(0.8 * weight.value)
}

const saveToProfile = () => {
    const userData = {
        name: name.value.trim() || 'Atleta Anónimo',
        age: age.value,
        weight: weight.value,
        height: height.value,
        tmb: tmb.value,
        kcal: tdee.value,
        protein: proteinIntake.value,
        goal: resultType.value,
        adjustment: targetCalories.value,
        finalCalories: resultType.value === 'deficit' ? tdee.value - targetCalories.value : tdee.value + targetCalories.value
    }

    localStorage.setItem('omnicore_profile', JSON.stringify(userData));

    router.push({ name: 'Profile' })
}

const calculate = () => {
    if (!name.value.trim() || !age.value || !weight.value || !height.value || !gender.value || !activityLevel.value || !targetCalories.value || targetCalories.value <= 0) {
        alert('Por favor, rellene todos los campos con valores mayores a cero antes de continuar.');
        return;
    }

    if (!name.value.trim() || !age.value || !weight.value || !height.value || !gender.value || !activityLevel.value || !targetCalories.value || targetCalories.value <= 0) {
        alert('Por favor, rellene todos los campos con valores mayores a cero antes de continuar.');
        return;
    }

    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regexLetras.test(name.value.trim())) {
        alert('Por favor, ingrese un nombre válido que contenga únicamente letras.');
        return;
    }

    if (targetCalories.value < 300) {
        alert('Por favor, ingrese un margen calórico de ajuste de al menos 300 kcal para que el plan sea eficiente.');
        return;
    }

    if (validateAge(age.value) && validateWeight(weight.value) && validateHeight(height.value)) {
        tmb.value = Math.floor(calculateTMB())
        tdee.value = calculateTDEE()
        
        if (resultType.value === 'deficit') {
            const total = tdee.value - targetCalories.value
            finalCaloriesResult.value = `Objetivo de Déficit: ${total} kcal/día (-${targetCalories.value} kcal)`
        } else if (resultType.value === 'surplus') {
            const total = tdee.value + targetCalories.value
            finalCaloriesResult.value = `Objetivo de Superávit: ${total} kcal/día (+${targetCalories.value} kcal)`
        }
    } else {
        tmb.value = null
        tdee.value = null
        finalCaloriesResult.value = null
        alert('Por favor, ingrese valores válidos dentro de los rangos (Edad: 1-120, Peso: 1-300, Altura: 50-250).')
    }
}

const proteinIntake = computed(calculateProteinIntake)
</script>

<template>
	<div class="w-full space-y-6">
		<div class="bg-base-100 p-6 rounded-2xl border border-dashed border-base-content/20 shadow-md">
			
			<div class="border-b border-base-content/10 pb-4 mb-6">
				<h2 class="text-2xl font-black bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
					Calculadora de TMB / TDEE
				</h2>
				<p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
					Ingresa tus parámetros metabólicos
				</p>
			</div>

			<form @submit.prevent="calculate" class="space-y-4">
				
				<div class="form-control w-full">
					<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Nombre</span></label>
					<input v-model="name" type="text" placeholder="Tu nombre o apodo..." class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm rounded-xl focus:outline-none focus:border-primary" />
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control w-full">
						<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Edad (años)</span></label>
						<input v-model="age" type="number" class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm font-bold text-center font-mono rounded-xl focus:outline-none" />
					</div>

					<div class="form-control w-full">
						<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Peso (kg)</span></label>
						<input v-model="weight" type="number" class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm text-center font-bold font-mono rounded-xl focus:outline-none" />
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control w-full">
						<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Altura (cm)</span></label>
						<input v-model="height" type="number" class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm text-center font-bold font-mono rounded-xl focus:outline-none" />
					</div>

					<div class="form-control w-full">
						<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Género</span></label>
						<select v-model="gender" class="select select-bordered border-base-content/20 w-full h-12 min-h-12 text-sm rounded-xl focus:outline-none">
							<option disabled value="">Selecciona tu género...</option>
							<option value="male">Masculino</option>
							<option value="female">Femenino</option>
						</select>
					</div>
				</div>

				<div class="form-control w-full">
					<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Nivel de Actividad Física</span></label>
					<select v-model="activityLevel" class="select select-bordered border-base-content/20 w-full h-12 min-h-12 text-sm rounded-xl focus:outline-none">
						<option value="1.2">Poco o ninguna actividad</option>
						<option value="1.375">Ligera actividad (ejercicio 1-3 veces/semana)</option>
						<option value="1.55">Moderada actividad (ejercicio 3-5 veces/semana)</option>
						<option value="1.725">Fuerte actividad (ejercicio 6-7 veces/semana)</option>
						<option value="1.9">Extrema actividad (entrenamiento diario, trabajo pesado)</option>
					</select>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control w-full">
						<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Meta de Composición Corporal</span></label>
						<select v-model="resultType" class="select select-bordered border-base-content/20 w-full h-12 min-h-12 text-sm rounded-xl focus:outline-none">
							<option value="deficit">Déficit (Perder Peso)</option>
							<option value="surplus">Superávit (Ganar Masa Músculo)</option>
						</select>
					</div>

					<div class="form-control w-full">
						<label class="label pb-1"><span class="text-xs font-bold text-base-content/60 uppercase">Margen Calórico (kcal de ajuste)</span></label>
						<input v-model="targetCalories" type="number" placeholder="Ej: 300 o 500" class="input input-bordered border-base-content/20 w-full h-12 min-h-12 text-sm font-mono text-center rounded-xl focus:outline-none" />
					</div>
				</div>
				
				<div class="form-control pt-4 flex flex-row justify-end">
					<button type="submit" class="btn btn-ghost bg-transparent border border-base-300/60 hover:bg-base-200/40 text-xs font-bold rounded-xl px-6 h-12 min-h-12 transition-all duration-200">
						Calcular Rendimiento
					</button>
				</div>
			</form>
		
			<div v-if="tmb" class="mt-6 p-5 bg-base-200/60 rounded-2xl space-y-4 border border-dashed border-base-content/20 shadow-sm animate-fadeIn">
				<h3 class="text-sm font-black uppercase text-secondary tracking-wider mb-1">Análisis Energético Resumido:</h3>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div class="p-3 bg-base-100 rounded-xl border border-base-content/5 flex flex-col justify-between">
						<span class="text-2xs font-extrabold uppercase text-base-content/50 tracking-wider">Metabolismo Basal (TMB)</span>
						<span class="text-md font-mono font-black text-base-content mt-1">{{ tmb }} <span class="text-2xs">kcal/día</span></span>
					</div>
					<div class="p-3 bg-base-100 rounded-xl border border-base-content/5 flex flex-col justify-between">
						<span class="text-2xs font-extrabold uppercase text-base-content/50 tracking-wider">Gasto Diario Estimado (TDEE)</span>
						<span class="text-md font-mono font-black text-base-content mt-1">{{ tdee }} <span class="text-2xs">kcal/día</span></span>
					</div>
					<div class="p-3 bg-base-100 rounded-xl border border-base-content/5 flex flex-col justify-between">
						<span class="text-2xs font-extrabold uppercase text-base-content/50 tracking-wider">Proteína Recomendada</span>
						<span class="text-md font-mono font-black text-base-content mt-1">{{ proteinIntake }} <span class="text-2xs">g/día</span></span>
					</div>
				</div>

				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 mt-2 border-t border-base-content/10">
					<div class="text-sm font-black tracking-wide" :class="{'text-warning': resultType === 'deficit', 'text-success': resultType === 'surplus'}">
						{{ finalCaloriesResult }}
					</div>
					<button @click="saveToProfile" class="btn btn-neutral btn-sm font-bold text-white rounded-xl px-4">
						Archivar Perfil
					</button>
				</div>
			</div>
		</div>
	</div>
</template>