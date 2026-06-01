/**
 * Eventology Mobile — Global Store
 * Pure-React state for cross-screen concerns that don't belong in a
 * server cache: favorites, recent searches, and view history.
 *
 * Design notes:
 * - No Zustand or external dep — Context + `useReducer` is enough
 *   for the small slice we need.
 * - Persisted to AsyncStorage under `STORE_KEY`. The render never
 *   blocks on hydration: the store starts with defaults, then the
 *   stored snapshot is applied on mount. Screens should treat the
 *   state as "best-effort" and avoid showing skeletons purely based
 *   on emptiness.
 * - Persistence is fire-and-forget after every reducer commit.
 *   The store is small (< 1 KB), so we don't bother debouncing.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import { STORE_KEY, STORE_LIMITS } from "../lib/constants";

export interface StoreState {
  favorites: string[];
  recentSearches: string[];
  viewHistory: string[];
}

type StoreAction =
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "ADD_RECENT_SEARCH"; query: string; max: number }
  | { type: "ADD_VIEW"; id: string; max: number }
  | { type: "HYDRATE"; state: StoreState }
  | { type: "RESET" };

export interface StoreApi {
  state: StoreState;
  toggleFavorite: (id: string) => void;
  addRecentSearch: (query: string, max?: number) => void;
  addView: (id: string, max?: number) => void;
  /** True until the persisted snapshot has been applied. */
  isHydrated: boolean;
}

const INITIAL_STATE: StoreState = {
  favorites: [],
  recentSearches: [],
  viewHistory: [],
};

const StoreContext = createContext<StoreApi | null>(null);

function pushBounded(list: string[], item: string, max: number): string[] {
  const filtered = list.filter((existing) => existing !== item);
  return [item, ...filtered].slice(0, max);
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "TOGGLE_FAVORITE": {
      const exists = state.favorites.includes(action.id);
      return {
        ...state,
        favorites: exists
          ? state.favorites.filter((id) => id !== action.id)
          : [action.id, ...state.favorites],
      };
    }
    case "ADD_RECENT_SEARCH": {
      const trimmed = action.query.trim();
      if (trimmed.length === 0) {
        return state;
      }
      return {
        ...state,
        recentSearches: pushBounded(state.recentSearches, trimmed, action.max),
      };
    }
    case "ADD_VIEW": {
      return {
        ...state,
        viewHistory: pushBounded(state.viewHistory, action.id, action.max),
      };
    }
    case "HYDRATE": {
      return action.state;
    }
    case "RESET": {
      return INITIAL_STATE;
    }
  }
}

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.favorites) &&
    candidate.favorites.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.recentSearches) &&
    candidate.recentSearches.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.viewHistory) &&
    candidate.viewHistory.every((entry) => typeof entry === "string")
  );
}

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate once on mount. Failures (corrupt JSON, schema mismatch)
  // are swallowed — we'd rather start fresh than crash the app.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (cancelled || raw === null) {
          return;
        }
        const parsed: unknown = JSON.parse(raw);
        if (isStoreState(parsed)) {
          dispatch({ type: "HYDRATE", state: parsed });
        }
      } catch {
        // Intentionally ignore — see comment above.
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every state change. Cheap because the payload is tiny.
  useEffect(() => {
    if (!isHydrated) {
      // Don't overwrite a stored snapshot with defaults before we've
      // had a chance to read it.
      return;
    }
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(() => {
      // Storage failure is non-fatal — the in-memory state is the
      // source of truth for the current session.
    });
  }, [state, isHydrated]);

  const toggleFavorite = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_FAVORITE", id });
  }, []);

  const addRecentSearch = useCallback(
    (query: string, max: number = STORE_LIMITS.recentSearches) => {
      dispatch({ type: "ADD_RECENT_SEARCH", query, max });
    },
    []
  );

  const addView = useCallback(
    (id: string, max: number = STORE_LIMITS.viewHistory) => {
      dispatch({ type: "ADD_VIEW", id, max });
    },
    []
  );

  const value = useMemo<StoreApi>(
    () => ({ state, toggleFavorite, addRecentSearch, addView, isHydrated }),
    [state, toggleFavorite, addRecentSearch, addView, isHydrated]
  );

  return React.createElement(
    StoreContext.Provider,
    { value },
    children
  );
}

export function useStore(): StoreApi {
  const context = useContext(StoreContext);
  if (context === null) {
    throw new Error("useStore must be used within a <StoreProvider>");
  }
  return context;
}
