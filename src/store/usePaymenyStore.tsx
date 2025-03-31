import { create } from "zustand";
import { MembershipType } from "../components/membership/FreeTrialModal";

const PAYMENT_PROCESS = ["information", "payment", "complete"] as const;
type PaymentProcessType = (typeof PAYMENT_PROCESS)[number];
type PaymentPlanType = (typeof MembershipType)[number];
interface PaymentStore {
  process: PaymentProcessType;
  selectedPlan: PaymentPlanType | null;
  nextStep: () => void;
  prevStep: () => void;
  reSet: () => void;
  setSelectedPlan: (plan: PaymentPlanType) => void;
}
const usePaymentStore = create<PaymentStore>((set) => ({
  process: "information",
  selectedPlan: null,
  nextStep: () =>
    set((state) => {
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
  reSet: () => set({ process: "information" }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan })
}));

export default usePaymentStore;
