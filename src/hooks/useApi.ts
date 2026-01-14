import { useCallback } from "react";
import axios from "axios";
import { useToast } from "../components/common/Toast";

export const useApi = () => {
  const { showToast } = useToast();

  const run = useCallback(
    async <T,>(callback: () => Promise<T>) => {
      try {
        return await callback();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.message ||
            error.response?.statusText ||
            error.message ||
            "알 수 없는 오류가 발생했습니다.";
          showToast(message);
        } else {
          showToast("알 수 없는 오류가 발생했습니다.");
        }
        throw error;
      }
    },
    [showToast]
  );

  return { run };
};
