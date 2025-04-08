import { createRouter, createWebHistory } from 'vue-router';
import PigIntro from '@/views/PigIntro.vue';
import Login from '@/views/Login.vue';
import SignUp from '@/views/SignUp.vue';
import AgeExpenseAnalysis from '@/views/AgeExpenseAnalysis.vue';
import ExpenseList from '@/views/ExpenseList.vue';
import Home from "@/views/Home.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'PigIntro',
      component: PigIntro,
    },

    { path: '/login', component: Login },
    { path: '/signup', component: SignUp },
    {
      path: '/ageExpenseAnalysis',
      name: 'AgeExpenseAnalysis',
      component: AgeExpenseAnalysis,
    },
    { path: '/home', component: Home },
    { path: '/expenseList', name: 'ExpenseList', component: ExpenseList },
  ],
});

export default router;
