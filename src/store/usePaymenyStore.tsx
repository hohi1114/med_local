import { create } from "zustand";
import { MembershipType } from "../components/membership/FreeTrialModal";

const PAYMENT_PROCESS = [
  "information",
  "payment",
  "register_card",
  "complete"
] as const;
type PaymentProcessType = (typeof PAYMENT_PROCESS)[number];
type PaymentPlanType = (typeof MembershipType)[number];
interface PaymentStore {
  process: PaymentProcessType;
  selectedPlan: PaymentPlanType | null;
  cardInfo: { cardNum: string; cardName: string } | null;
  nextStep: () => void;
  prevStep: () => void;
  reSet: () => void;
  setSelectedPlan: (plan: PaymentPlanType) => void;
  setCardInfo: (cardInfo: { cardNum: string; cardName: string } | null) => void;
  setProcess: (process: PaymentProcessType) => void;
}
const usePaymentStore = create<PaymentStore>((set) => ({
  process: "information",
  selectedPlan: null,
  cardInfo: null,
  nextStep: () =>
    set((state) => {
      if (state.process === "register_card") {
        return { process: "payment" };
      }
      if (state.process === "payment") {
        return { process: state.cardInfo ? "complete" : "register_card" };
      }
      const currentIndex = PAYMENT_PROCESS.indexOf(state.process);
      if (currentIndex < PAYMENT_PROCESS.length - 1) {
        return { process: PAYMENT_PROCESS[currentIndex + 1] };
      }
      return state;
    }),
  prevStep: () =>
    set((state) => {
      const currentIndex = PAYMENT_PROCESS.indexOf(state.process);
      if (currentIndex > 0) {
        return { process: PAYMENT_PROCESS[currentIndex - 1] };
      }
      return state;
    }),
  setProcess: (process) => set({ process }),
  reSet: () => set({ process: "information" }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setCardInfo: (cardInfo: { cardNum: string; cardName: string } | null) =>
    set({ cardInfo: cardInfo ? { ...cardInfo } : null })
}));

export default usePaymentStore;
