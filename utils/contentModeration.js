
const API_URL = "http://192.168.100.9:8000/moderate-text";

export const validatePostContentAI = async (text) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const result = await response.json();

    const CATEGORY_MAPPING = {
      sexual: 'ngôn từ mang tính tấn công tình dục',
      hate: 'ngôn từ mang tính căm thù',
      violence: 'ngôn từ mang tính bạo lực',
    };

    const translatedCategories = result.categories.map(
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
    console.error("AI moderation failed:", error);
    return {
      isValid: true,
      severity: "none",
      message: "",
      sensitiveWords: [],
    };
  }
};

