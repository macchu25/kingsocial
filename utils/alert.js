import { showAlert } from '../components/CustomAlert';

// Helper function để thay thế Alert.alert với giao diện đẹp hơn
export const alert = (title, message, buttons = [], options = {}) => {
  // Convert buttons format từ Alert.alert sang CustomAlert
  const formattedButtons = buttons.length > 0 
    ? buttons.map(btn => ({
        text: btn.text || 'OK',
        onPress: btn.onPress,
        style: btn.style || 'default',
      }))
    : [{ text: 'OK' }];

  showAlert(title, message, formattedButtons, options);
};

// Helper functions cho các loại alert phổ biến
export const alertError = (title, message, onPress) => {
  alert(
    title || 'Lỗi',
    message,
    [{ text: 'OK', onPress: onPress || (() => {}) }],
    { type: 'error' }
  );
};

export const alertSuccess = (title, message, onPress) => {
  alert(
    title || 'Thành công',
    message,
    [{ text: 'OK', onPress: onPress || (() => {}) }],
    { type: 'success' }
  );
};

export const alertWarning = (title, message, onPress) => {
  alert(
    title || 'Cảnh báo',
    message,
    [{ text: 'OK', onPress: onPress || (() => {}) }],
    { type: 'warning' }
  );
};

export const alertInfo = (title, message, onPress) => {
  alert(
    title || 'Thông tin',
    message,
    [{ text: 'OK', onPress: onPress || (() => {}) }],
    { type: 'info' }
  );
};

export const alertConfirm = (title, message, onConfirm, onCancel) => {
  alert(
    title || 'Xác nhận',
    message,
    [
      { text: 'Hủy', style: 'cancel', onPress: onCancel },
      { text: 'Xác nhận', onPress: onConfirm },
    ],
    { type: 'info' }
  );
};

export const alertDelete = (title, message, onDelete, onCancel) => {
  alert(
    title || 'Xóa',
    message,
    [
      { text: 'Hủy', style: 'cancel', onPress: onCancel },
      { text: 'Xóa', style: 'destructive', onPress: onDelete },
    ],
    { type: 'warning' }
  );
};

