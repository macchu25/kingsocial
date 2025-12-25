// Danh sách từ khóa nhạy cảm
// Được phân loại theo mức độ nghiêm trọng

export const SENSITIVE_WORDS = {
  // Mức độ cao - Không cho phép đăng
  HIGH: [
    // Từ ngữ tục tĩu
    'địt', 'đụ', 'đéo', 'đĩ', 'đỉ', 'đụ má', 'đụ mẹ', 'đụ cha',
    'cặc', 'buồi', 'lồn', 'cave', 'gái điếm',
    
    // Bạo lực cực đoan
    'giết', 'sát hại', 'đánh chết', 'hành hung',
    
    // Kích dục
    'sex', 'tình dục', 'làm tình', 'quan hệ',
    
    // Thù hằn, phân biệt
    'chết tiệt', 'đồ khốn', 'đồ ngu', 'đồ chó',
  ],
  
  // Mức độ trung bình - Cảnh báo nhưng cho phép
  MEDIUM: [
    // Từ ngữ không phù hợp nhẹ
    'chết', 'ngu', 'ngu ngốc', 'đồ ngu',
    'điên', 'điên rồ', 'khùng',
    
    // Bạo lực nhẹ
    'đánh', 'đấm', 'tát', 'đá',
  ],
  
  // Mức độ thấp - Chỉ cảnh báo
  LOW: [
    // Từ ngữ không lịch sự
    'đồ', 'thằng', 'con',
  ],
};

/**
 * Hàm kiểm tra từ khóa trong text
 * @param {string} text - Text cần kiểm tra
 * @param {string} level - Mức độ: 'HIGH' | 'MEDIUM' | 'LOW'
 * @returns {boolean}
 */
export const containsSensitiveWord = (text, level = 'HIGH') => {
  if (!text || typeof text !== 'string') return false;
  
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = SENSITIVE_WORDS[level] || [];
  
  return words.some(word => {
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedText.includes(normalizedWord);
  });
};

/**
 * Hàm tìm tất cả từ khóa nhạy cảm trong text
 * @param {string} text - Text cần kiểm tra
 * @returns {Array<{level: string, words: string[]}>}
 */
export const findSensitiveWords = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = [];
  
  Object.keys(SENSITIVE_WORDS).forEach(level => {
    const words = SENSITIVE_WORDS[level] || [];
    const matched = words.filter(word => {
      const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedText.includes(normalizedWord);
    });
    
    if (matched.length > 0) {
      found.push({ level, words: matched });
    }
  });
  
  return found;
};

