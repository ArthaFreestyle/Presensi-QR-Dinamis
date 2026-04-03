"use client";

import { useCallback, useState } from "react";

import { api } from "@/lib/api";
import type { RootInfoResponse } from "@/types/api";

type ApiState = {
  loading: boolean;
  data: RootInfoResponse | null;
  error: string | null;
};

export function useApiRootStatus() {
  const [state, setState] = useState<ApiState>({
    loading: false,
    data: null,
    error: null,
  });

  const pingRoot = useCallback(async () => {
    setState({ loading: true, data: null, error: null });

    try {
      const result = await api.getRoot();

      if (result.ok) {
        setState({ loading: false, data: result.data, error: null });
        return;
      }

      setState({ loading: false, data: null, error: result.error });
    } catch (error) {
      setState({
        loading: false,
        data: null,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }, []);

  return { ...state, pingRoot };
}
