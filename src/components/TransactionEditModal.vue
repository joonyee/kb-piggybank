<script setup>
import { defineProps, defineEmits, ref, watch, computed } from "vue";
import axios from "axios";

const props = defineProps({
  isOpen: Boolean,
  transaction: Object,
});

const emits = defineEmits(["close", "update"]);

const editedTransaction = ref({});

watch(
  () => props.transaction,
  (newVal) => {
    if (newVal) {
      editedTransaction.value = { ...newVal };
    }
  },
  { immediate: true }
);

const paymentMethods = ["카드결제", "계좌거래", "현금"];

const expenseCategories = [
  "식사/카페",
  "배달/간식",
  "쇼핑",
  "교통/차량",
  "주거/관리",
  "건강/병원",
  "취미/여가",
  "구독서비스",
  "여행/외출",
  "기타지출",
];
const incomeCategories = ["급여", "용돈", "부수입", "환급/지원금", "기타수입"];

const categories = ref([]);

const categoryList = computed(() =>
  editedTransaction.value?.type === "expense"
    ? expenseCategories
    : incomeCategories
);

const closeModal = () => {
  emits("close");
};

const categoryToId = (name) => {
  const match = categories.value.find((c) => c.name === name);
  return match ? match.id : null;
};

const paymentToId = (method) => {
  const map = { 카드결제: 1, 현금: 2, 계좌거래: 3, 수입: 4 };
  return map[method];
};

const consumptionToId = (feel) => {
  const map = { "계획적 지출": 1, "충동적 지출": 2, 수입: 3 };
  return map[feel];
};

const saveTransaction = async () => {
  try {
    const payload = {
      id: editedTransaction.value.id,
      userid: editedTransaction.value.userid,
      typeid: editedTransaction.value.type === "income" ? 1 : 2,
      categoryid: categoryToId(editedTransaction.value.category),
      date: editedTransaction.value.date,
      amount: editedTransaction.value.amount,
      tendencyid: consumptionToId(editedTransaction.value.consumptionType),
      payment: paymentToId(editedTransaction.value.paymentMethod),
      memo: editedTransaction.value.description,
    };

    await axios.patch(
      `https://kb-piggybank.glitch.me/money/${payload.id}`,
      payload
    );
    emits("update", payload);
    closeModal();
  } catch (err) {
    console.error("거래 수정 실패:", err);
    alert("수정 중 오류가 발생했습니다.");
  }
};

const setPaymentMethod = (method) => {
  editedTransaction.value.paymentMethod = method;
};

const setConsumption = (type) => {
  editedTransaction.value.consumptionType = type;
};

// 카테고리 데이터 불러오기
import { onMounted } from "vue";
onMounted(async () => {
  const res = await axios.get("https://kb-piggybank.glitch.me/category");
  categories.value = res.data;
});
</script>
<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-content">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h3 class="title">거래 수정</h3>
        <i class="fa-solid fa-xmark close-icon" @click="closeModal"></i>
      </div>

      <!-- 지출/수입 타입 표시 -->
      <div class="type-display">
        <button
          class="type-btn"
          :class="{ active: editedTransaction.type === 'expense' }"
        >
          지출
        </button>
        <button
          class="type-btn"
          :class="{ active: editedTransaction.type === 'income' }"
        >
          수입
        </button>
      </div>

      <!-- 수정 폼 -->
      <div class="modal-body">
        <label>날짜</label>
        <input
          type="date"
          v-model="editedTransaction.date"
          class="input-field"
        />

        <label>카테고리</label>
        <select v-model="editedTransaction.category" class="input-field">
          <option v-for="category in categoryList" :key="category">
            {{ category }}
          </option>
        </select>

        <label>금액</label>
        <input
          type="number"
          v-model="editedTransaction.amount"
          class="input-field"
        />

        <label>설명</label>
        <input
          type="text"
          v-model="editedTransaction.description"
          class="input-field"
        />

        <label v-if="editedTransaction.type === 'expense'">지불 방법</label>
        <div class="payment-method" v-if="editedTransaction.type === 'expense'">
          <button
            v-for="method in paymentMethods"
            :key="method"
            @click="setPaymentMethod(method)"
            :class="[
              'method-btn',
              { active: editedTransaction.paymentMethod === method },
            ]"
          >
            {{ method }}
          </button>
        </div>
        <label v-if="editedTransaction.type === 'expense'">지출 성향</label>
        <div
          class="consumption-type"
          v-if="editedTransaction.type === 'expense'"
        >
          <button
            @click="setConsumption('계획적 지출')"
            :class="{
              active: editedTransaction.consumptionType === '계획적 지출',
            }"
          >
            계획적 지출
          </button>
          <button
            @click="setConsumption('충동적 지출')"
            :class="{
              active: editedTransaction.consumptionType === '충동적 지출',
            }"
          >
            충동적 지출
          </button>
        </div>

        <button class="save-btn" @click="saveTransaction">저장하기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: var(--background-color);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dark .modal-content {
  background-color: black;
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
label {
  font: var(--ng-reg-16);
  color: var(--text-subtitle);
  margin-bottom: 4px;
}
.dark label {
  font: var(--ng-reg-16);
  color: white;
  margin-bottom: 4px;
}
.input-field,
select.input-field {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font: var(--ng-reg-16);
  background-color: var(--card-color);
  box-sizing: border-box;
}
.input-field:focus,
select.input-field:focus {
  outline: none;
  border-color: var(--primary-color);
  background-color: var(--background-color);
}
.type-display {
  display: flex;
  gap: 10px;
}
.type-btn {
  flex: 1;
  padding: 12px;
  font: var(--ng-bold-18);
  border-radius: 12px;
  background-color: var(--card-color);
  color: var(--text-color);
  border: none;
  text-align: center;
}
.type-btn.active {
  background-color: var(--primary-color);
  color: var(--text-white);
}
.payment-method,
.consumption-type {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.method-btn,
.consumption-type button {
  flex: 1 1 30%;
  padding: 10px;
  border-radius: 8px;
  background-color: var(--card-color);
  font: var(--ng-reg-15);
  color: var(--text-color);
  border: none;
  text-align: center;
}
.method-btn.active,
.consumption-type button.active {
  background-color: var(--primary-color);
  color: var(--text-white);
}
.save-btn {
  width: 100%;
  padding: 14px;
  margin-top: 12px;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: var(--text-white);
  font: var(--ng-bold-18);
  cursor: pointer;
  border: none;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font: var(--ng-bold-20);
  color: var(--text-color);
}
.dark .title {
  font: var(--ng-bold-20);
  color: white;
}
.close-icon {
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
}
.dark .close-icon {
  font-size: 24px;
  cursor: pointer;
  color: white;
}
</style>
