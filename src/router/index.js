import { createRouter, createWebHistory } from 'vue-router'
import LibraryView from '../views/LibraryView.vue'
import CalculatorView from '../views/CalculatorView.vue'
import FactView from '../views/FactView.vue'
import ProfileView from '../views/ProfileView.vue'
import RoutineView from '../views/RoutineView.vue'
import DietView from '../views/DietView.vue'

const routes = [
    { path: '/', name: 'Library', component: LibraryView },
    { path: '/calculator', name: 'Calculator', component: CalculatorView },
    { path: '/fact', name: 'Fact', component: FactView },
    { path: '/profile', name: 'Profile', component: ProfileView },
    { path: '/routine', name: 'Routine', component: RoutineView },
    { path: '/diet', name: 'Dieta', component: DietView },
];

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router