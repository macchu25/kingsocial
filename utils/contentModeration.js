
const API_URL = "http://192.168.1.8:8000/moderate-text";
const TIMEOUT_MS = 5000; // 5 second timeout

export const validatePostContentAI = async (text) => {
  // If text is empty, skip moderation
  if (!text || !text.trim()) {
    return {
      isValid: true,
      severity: "none",
      message: "",
      sensitiveWords: [],
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Validate response structure
    if (typeof result !== "object" || result === null) {
      throw new Error("Invalid response format from moderation API");
    }

    const CATEGORY_MAPPING = {
      sexual: "ngôn từ mang tính tấn công tình dục",
      hate: "ngôn từ mang tính căm thù",
      violence: "ngôn từ mang tính bạo lực",
    };

    const translatedCategories = (result.categories || []).map(
      (cat) => CATEGORY_MAPPING[cat] || cat
    );

    return {
      isValid: !result.isSensitive,
      severity: result.isSensitive ? "high" : "none",
      message: result.isSensitive
        ? `Nội dung chứa từ ngữ không phù hợp (${translatedCategories.join(", ")})`
        : "",
      sensitiveWords: translatedCategories,
    };
  } catch (error) {
    // Handle different types of errors
    if (error.name === "AbortError" || error.message === "Request timeout") {
      console.warn(
        "AI moderation timeout: Server took too long to respond. Allowing post."
      );
    } else if (error.message.includes("Network request failed")) {
      console.warn(
        "AI moderation server unavailable: Network request failed. Allowing post."
      );
    } else {
      console.error("AI moderation error:", error.message || error);
    }

    // Return safe default - allow the post if moderation fails
    // This ensures the app continues to work even if the moderation service is down
    return {
      isValid: true,
      severity: "none",
      message: "",
      sensitiveWords: [],
    };
  }
};

