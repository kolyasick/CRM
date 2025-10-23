function useDebouncedRef(value: any, delay: number = 500) {
  let timeout: NodeJS.Timeout;

  return customRef((track, trigger) => {
    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          value = newValue;
          trigger();
        }, delay);
      },
    };
  });
}

export default useDebouncedRef;
