<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import ChartCard from "../components/ChartCard.vue";
import SavingsModal from "../components/SavingsModal.vue";

const router = useRouter();

// 헤더 기능: 다크모드
const isDarkMode = ref(false);
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle("dark");
};

// 헤더 기능: 마이페이지 이동
const mypageClick = () => {
  router.push("/myPage");
  alert("mypage page");
};

// 헤더 기능: 로그아웃
const logout = () => {
  alert("안녕히가세요!");
  localStorage.removeItem("loggedInUserId");
  router.push("/");
};

// 헤더 기능: 홈으로 이동
const goToHome = () => {
  router.push("/home");
};

// 헤더 기능: 새 거래 추가 모달
const isTransactionModalOpen = ref(false);
const openModal = () => {
  isTransactionModalOpen.value = true;
};
const closeModal = () => {
  isTransactionModalOpen.value = false;
};

// 현재 월, 연도
const month = new Date().getMonth() + 1;
const year = new Date().getFullYear();

// 상태 변수
const income = ref(0);
const expense = ref(0);
const balance = ref(0);
const savingsRate = ref(0);
const previousExpense = ref(0);
const budget = ref(0);
const goalRate = ref(0);

const savingsModalVisible = ref(false);

const openSavingsModal = () => {
  savingsModalVisible.value = true;
};

const closeSavingsModal = () => {
  savingsModalVisible.value = false;
};

// 모달 토글
const toggleSavingsModal = () => {
  savingsModalVisible.value = !savingsModalVisible.value;
};

const updateSavingsSettings = async ({
  monthlyIncome,
  savingsRate: newRate,
}) => {
  console.log("?");
  const userId = localStorage.getItem("loggedInUserId");
  if (userId) {
    await axios.patch(`https://kb-piggybank.glitch.me/user/${userId}`, {
      goalSavings: newRate,
    });
    goalRate.value = newRate;
  }
  console.log("!");
  // closeSavingsModal();
  savingsModalVisible.value = false;
};

// DB에서 월간 데이터 fetch
const fetchMonthlyData = async () => {
  try {
    const userId = localStorage.getItem("loggedInUserId");

    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 유저 정보에서 goalSavings 가져오기
    const userRes = await axios.get(
      `https://kb-piggybank.glitch.me/user/${userId}`
    );
    goalRate.value = userRes.data.goalSavings ?? 0;

    // 전체 거래 데이터에서 해당 유저의 지출/수입 필터
    const res = await axios.get("https://kb-piggybank.glitch.me/money");
    const allData = res.data;
    const userData = allData.filter((item) => item.userid === userId);

    // 현재 월과 이전 월 계산
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .slice(0, 7);

    const currentMonthData = userData.filter(
      (item) => item.date.slice(0, 7) === currentMonth
    );
    const prevMonthData = userData.filter(
      (item) => item.date.slice(0, 7) === previousMonth
    );

    let totalIncome = 0;
    let totalExpense = 0;
    let prevExpense = 0;

    currentMonthData.forEach((item) => {
      if (item.typeid === 1) totalIncome += item.amount;
      else if (item.typeid === 2) totalExpense += item.amount;
    });

    prevMonthData.forEach((item) => {
      if (item.typeid === 2) prevExpense += item.amount;
    });

    income.value = totalIncome;
    expense.value = totalExpense;
    balance.value = totalIncome - totalExpense;
    previousExpense.value = prevExpense;
    savingsRate.value =
      totalIncome > 0 ? ((balance.value / totalIncome) * 100).toFixed(1) : 0;
    budget.value =
      totalIncome > 0
        ? Math.floor(totalIncome * (1 - goalRate.value / 100))
        : 0;
  } catch (err) {
    console.error("데이터 불러오기 실패:", err);
  }
};

onMounted(fetchMonthlyData);
</script>

<template>
  <div class="dashboard">
    <header class="dashboardHeader">
      <h1 class="dashboardTitle">
        <img
          src="/src/assets/icons/logo.png"
          class="iconImage"
          @click="goToHome"
        />Piggy Bank
      </h1>
      <div class="flex items-center gap-2 relative">
        <button @click="toggleDarkMode" class="darkModeButton">
          {{ isDarkMode ? "☀️" : "🌙" }}
        </button>
        <button class="mypageButton" @click="mypageClick">마이페이지</button>
        <button class="inputValue" @click="openModal">새 거래추가</button>
        <button class="logout" @click="logout">로그아웃</button>
      </div>
    </header>
    <div class="monthly-analysis-container">
      <!-- 수입, 지출, 잔액, 저축률  -->
      <div class="summary-cards">
        <div class="summary-card">
          <h3>이번 달 수입</h3>
          <p class="income">{{ income.toLocaleString() }}원</p>
        </div>
        <div class="summary-card">
          <h3>이번 달 지출</h3>
          <p class="expense">{{ expense.toLocaleString() }}원</p>
        </div>
        <div class="summary-card">
          <h3>이번 달 잔액</h3>
          <p class="balance">{{ balance.toLocaleString() }}원</p>
        </div>

        <!-- 저축률  -->
        <div class="summary-card savings-card" @click="toggleSavingsModal">
          <h3>저축률</h3>
          <div class="savings-content">
            <div class="savings-section">
              <p class="savings-rate">{{ savingsRate }}%</p>
              <p class="savings-label">현재 저축률</p>
            </div>
            <div class="divider"></div>
            <div class="savings-section">
              <p class="goal-rate">{{ goalRate }}%</p>
              <p class="goal-label">목표 저축률</p>
            </div>
          </div>
        </div>

        <!-- 저축률 설정 모달  -->
        <SavingsModal
          v-if="savingsModalVisible"
          :show="savingsModalVisible"
          @close="closeSavingsModal"
          @update="updateSavingsSettings"
        />
      </div>

      <div class="month-header">
        <h2>{{ month }}월 {{ year }}년</h2>
      </div>

      <div class="middle-section">
        <!-- 이번달 총 지출 -->
        <div class="part-card total-expense-card">
          <div class="expense-header">
            <i class="fa-solid fa-magnifying-glass"></i>
            <h3>이번달 총 지출</h3>
          </div>
          <p class="total-expense">{{ expense.toLocaleString() }}원</p>
          <p class="comparison">
            지난 달보다
            <span class="comparison-money">
              {{ (expense - previousExpense).toLocaleString() }}원
            </span>
          </p>
        </div>

        <!-- 월별 비교 -->
        <div class="part-card">
          <h2>월별 수입/지출 비교</h2>
          <ChartCard
            chartType="bar"
            :chartData="{
              labels: ['지난 달', '이번 달'],
              datasets: [
                {
                  label: '지출',
                  data: [previousExpense, expense],
                  backgroundColor: '#ffc7ef',
                },
                {
                  label: '수입',
                  data: [1000000, income],
                  backgroundColor: '#ffe8fc',
                },
              ],
            }"
            :options="{
              plugins: {
                legend: { display: true },
              },
              scales: {
                x: { stacked: true },
                y: { stacked: true },
              },
            }"
          />
        </div>

        <!-- 예산 대비 -->
        <div class="part-card">
          <h2>예산 대비 지출</h2>
          <ChartCard
            chartType="doughnut"
            :chartData="{
              labels: ['지출', '남은 예산'],
              datasets: [
                {
                  label: '수입 대비 지출',
                  data: income > 0 ? [expense, income - expense] : [0, 0],
                  backgroundColor: ['#ffc7ef', '#ffe8fc'],
                },
              ],
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
  margin: 0;
  background: linear-gradient(to bottom, #fff9fe, #ffffff);
  font-family: sans-serif;
  box-sizing: border-box;
  color: black;
}

.dark .dashboard {
  background: linear-gradient(to bottom, #121212, #121212);
  color: #1a1a2e;
}
.monthly-analysis-container {
  max-width: 1200px;
  background-color: var(--bg-main);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.summary-cards {
  display: flex;
  gap: 10px;
  justify-content: space-around;
  margin-bottom: 10px;
}

.summary-card {
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 12px;
  text-align: center;
  font: var(--ng-reg-20);
  color: var(--text-color);
  min-width: 250px;
  flex: 1;
  margin: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.income {
  font: var(--ng-bold-28);
  color: var(--text-income);
}

.expense {
  font: var(--ng-bold-28);
  color: var(--text-expense);
}

.balance {
  font: var(--ng-bold-28);
  color: var(--text-balance);
}

.savings {
  font: var(--ng-bold-28);
  color: var(--hot-pink);
}

.savings-card {
  padding: 15px;
  background-color: var(--background-color);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.savings-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 5px;
}
.savings-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.savings-rate {
  font: var(--ng-bold-28);
  color: var(--hot-pink);
  margin: 0;
}

.goal-rate {
  font: var(--ng-bold-28);
  color: var(--text-color);
  margin: 0;
}

.savings-label,
.goal-label {
  font: var(--ng-reg-18);
  color: var(--text-secondary);
}

.divider {
  width: 0.1px;
  height: 75px;
  background-color: var(--text-secondary);
}

.month-header {
  text-align: left;
  margin: 10px 10px;
  font: var(--ng-bold-26);
}

.middle-section {
  display: flex;
  gap: 20px;
  justify-content: space-around;
  flex-wrap: wrap;
}

.part-card {
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 12px;
  text-align: center;
  flex: 1;
  min-width: 250px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.total-expense-card {
  text-align: left;
  padding: 20px;
  /* background-color: var(--b-color); */
  border-radius: 12px;
}

.expense-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font: var(--ng-reg-24);
  color: var(--text-color);
}

.expense-header i {
  font-size: 24px;
}

.total-expense {
  font: var(--ng-bold-28);
  color: var(--text-color);
}

.comparison {
  margin-top: 5px;
  font: var(--ng-reg-20);
  color: var(--text-balance);
}

.comparison-money {
  color: var(--text-balance);
  font: var(--ng-bold-24);
}
.chart-container {
  height: 250px;
  width: 100%;
}

/* 헤더  */
.dashboardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--header-bg);
  padding: 1rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.dashboardTitle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 30px;
  font-weight: bold;
  color: black;
}
.iconImage {
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.flex {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 다크모드 버튼 */
.darkModeButton {
  padding: 8px 12px;
  font-size: 1.2rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  cursor: pointer;
}
.mypageButton {
  background-color: rgb(254, 235, 253);
  border: 1px solid rgb(251, 209, 251);
  border-radius: 0.5rem;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font: var(--ng-reg-18);
  color: #333;
}
.logout {
  background-color: rgb(254, 235, 253);
  border: 1px solid rgb(251, 209, 251);
  border-radius: 0.5rem;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font: var(--ng-reg-18);
  color: #333;
  margin-right: 20px;
}

/* 새 거래추가 버튼 */
.inputValue {
  background-color: rgb(254, 235, 253);
  border: 1px solid rgb(251, 209, 251);
  border-radius: 0.5rem;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font: var(--ng-reg-18);
  color: #333;
}
.dark {
  color: black;
}
.dark body {
  background-color: #121212;
  color: #f5f5f5;
}

.dark .monthly-analysis-container,
.dark .total-expense-card {
  background-color: #121212;
  color: white;
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.05);
}
.dark .summary-card,
.dark .part-card,
.dark .savings-card,
.dark .total-expense-card {
  background-color: #e7e5e4;
  color: black;
}
.dark .dashboardHeader {
  background-color: #fbcee8;
}

.dark .divider {
  background-color: #555;
}

.dark .savings-label,
.dark .goal-label,
.dark .comparison {
  color: black;
}

.dark canvas {
  background-color: transparent !important;
}

/* 반응형  */

@media (max-width: 1024px) {
  .summary-cards {
    flex-wrap: wrap;
    justify-content: center;
  }

  .summary-card {
    min-width: 45%;
    margin: 10px 0;
  }

  .middle-section {
    flex-direction: column;
    gap: 20px;
  }

  .part-card {
    min-width: 100%;
  }

  .dashboardHeader {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .mypageButton,
  .inputValue,
  .logout {
    font-size: 14px;
    padding: 10px 18px;
  }

  .dashboardTitle {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .summary-cards {
    flex-direction: column;
    align-items: center;
  }

  .summary-card {
    width: 90%;
  }

  .middle-section {
    flex-direction: column;
    gap: 16px;
  }

  .part-card {
    width: 100%;
  }

  .dashboardHeader {
    padding: 0.8rem;
  }

  .dashboardTitle {
    font-size: 18px;
    gap: 8px;
  }

  .iconImage {
    width: 50px;
    height: 50px;
  }

  .darkModeButton {
    font-size: 1rem;
    padding: 6px 10px;
  }

  .mypageButton,
  .inputValue,
  .logout {
    padding: 10px;
    font-size: 13px;
    margin-bottom: 6px;
  }

  .savings-card {
    flex-direction: column;
    align-items: center;
  }

  .savings-content {
    flex-direction: column;
    gap: 8px;
  }

  .divider {
    width: 80%;
    height: 1px;
  }

  .month-header {
    margin-left: 0;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .summary-card,
  .part-card {
    width: 100%;
    padding: 16px;
  }

  .dashboardTitle {
    font-size: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .iconImage {
    width: 40px;
    height: 40px;
  }

  .mypageButton,
  .inputValue,
  .logout {
    font-size: 12px;
    padding: 8px;
  }

  .darkModeButton {
    font-size: 0.9rem;
    padding: 5px 8px;
  }

  .total-expense {
    font-size: 22px;
  }

  .comparison {
    font-size: 14px;
  }

  .comparison-money {
    font-size: 18px;
  }

  .chart-container {
    height: 200px;
  }
}
</style>
