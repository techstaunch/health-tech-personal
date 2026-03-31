import { useState } from "react";
import { BASE_URL } from "@/providers/DraftProvider";

export function useValidateToken() {
  const [isValidating, setIsValidating] = useState(false);

  const validate = async (accessToken: string) => {
    try {
      setIsValidating(true);
      const response = await fetch(`${BASE_URL}/auth/validate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: accessToken }),
      });

      if (!response.ok) {
        throw new Error("Validation failed at backend");
      }

      const { data } = await response.json();
      return data; // Expected payload: { nameid, sid, ... }
    } catch (error) {
      console.error("Backend JWT Validation error:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  return { validate, isValidating };
}
