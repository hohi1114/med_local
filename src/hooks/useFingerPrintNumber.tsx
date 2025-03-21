import { useState } from "react";

const KEY = "FINGERPRINT_NUMBER";
const useFingerPrintNumber = () => {
  const [fingurePrintNumber, setFingurePrintNumber] = useState<string | null>(
    null
  );
  const getSavedFingerPrintNumber = () => {
    let storedFingerprint = localStorage.getItem(KEY);
    return storedFingerprint;
  };
  const getFingerPrint = async () => {
    const hardware = await window.electron.getSystemUUID();
    return hardware;
  };

  const saveFingerPrint = () => {
    if (fingurePrintNumber) {
      localStorage.setItem(KEY, fingurePrintNumber);
    }
  };

  return {
    getSavedFingerPrintNumber,
    getFingerPrint,
    saveFingerPrint,
    setFingurePrintNumber
  };
};

export default useFingerPrintNumber;
