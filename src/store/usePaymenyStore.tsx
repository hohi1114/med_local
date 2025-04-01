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
  hasCardInfo: boolean;
  nextStep: () => void;
  prevStep: () => void;
  reSet: () => void;
  setSelectedPlan: (plan: PaymentPlanType) => void;
  setHasCardInfo: (hasCardInfo: boolean) => void;
  setProcess: (process: PaymentProcessType) => void;
}
const usePaymentStore = create<PaymentStore>((set) => ({
  process: "information",
  selectedPlan: null,
  hasCardInfo: false,
  setHasCardInfo: (hasCardInfo: boolean) => set({ hasCardInfo }),
  nextStep: () =>
    set((state) => {
      if (state.process === "register_card") {
        return { process: "payment" };
      }
      if (state.process === "payment") {
        return { process: state.hasCardInfo ? "complete" : "register_card" };
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
  setSelectedPlan: (plan) => set({ selectedPlan: plan })
}));

export default usePaymentStore;
