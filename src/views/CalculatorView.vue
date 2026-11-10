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