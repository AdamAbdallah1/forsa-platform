let listeners = [];

export function showToast(message, type = "success") {
  listeners.forEach((listener) =>
    listener({
      message,
      type,
    })
  );
}

export function toastSubscribe(callback) {
  listeners.push(callback);

  return () => {
    listeners = listeners.filter(
      (listener) => listener !== callback
    );
  };
}