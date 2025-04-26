import { useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// Function to safely read value from localStorage
function readValueSafe<T>(key: string, initialValue: T): T {
  // Prevent build error "window is undefined" but keeps working
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return initialValue;
  }
}


function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value.
  // Initialize with initialValue to prevent hydration mismatch.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // useEffect to update the state with the value from localStorage
  // This runs only on the client, after the initial render, preventing hydration mismatch.
  useEffect(() => {
    const valueFromStorage = readValueSafe(key, initialValue);
    setStoredValue(valueFromStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if key changes


  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      // Prevent build error "window is undefined" but keeps working
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`
        );
        return; // Do nothing on the server
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(newValue));
        // Save state
        setStoredValue(newValue);
        // We dispatch a custom event so every useLocalStorage hook are notified
        window.dispatchEvent(new Event("local-storage"));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue] // Include storedValue in dependencies
  );


  // Effect to listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
       if (event.key === key && event.storageArea === window.localStorage) {
          try {
            setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
          } catch (error) {
            console.warn(`Error parsing storage event value for key “${key}”:`, error);
            setStoredValue(initialValue);
          }
       }
    };

     // Effect to listen for storage changes triggered by setValue within the same tab
     const handleLocalStorageEvent = () => {
       setStoredValue(readValueSafe(key, initialValue));
     };


    // this only works for other documents, not the current one
    window.addEventListener('storage', handleStorageChange);
    // this is for the event dispatched after setting the value...
    // ... Only triggers in current tab
    window.addEventListener('local-storage', handleLocalStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleLocalStorageEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]); // Depend on key and initialValue

  return [storedValue, setValue];
}

export default useLocalStorage;
