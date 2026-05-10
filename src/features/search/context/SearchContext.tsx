"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FilterDraft, DEFAULT } from "../types";

type SearchState = {
  // Filter panel (draft) state
  draft: FilterDraft;
  setDraft: React.Dispatch<React.SetStateAction<FilterDraft>>;
  
  // Active search (applied) state
  applied: FilterDraft;
  setApplied: React.Dispatch<React.SetStateAction<FilterDraft>>;
  
  // Pagination & Sorting state
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  cursorHistory: (string | null)[];
  setCursorHistory: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  
  sort: "created" | "updated" | "comments" | "stars";
  setSort: React.Dispatch<React.SetStateAction<"created" | "updated" | "comments" | "stars">>;
  
  order: "asc" | "desc";
  setOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  
  hideLinkedPRs: boolean;
  setHideLinkedPRs: React.Dispatch<React.SetStateAction<boolean>>;
  
  // UI State
  isSearching: boolean;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchContext = createContext<SearchState | undefined>(undefined);

export function SearchProvider({ 
  children, 
  initialState 
}: { 
  children: ReactNode; 
  initialState?: Partial<SearchState> 
}) {
  const [draft, setDraft] = useState<FilterDraft>(initialState?.draft || DEFAULT);
  const [applied, setApplied] = useState<FilterDraft>(initialState?.applied || DEFAULT);
  const [currentPage, setCurrentPage] = useState(initialState?.currentPage || 1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>(initialState?.cursorHistory || [null]);
  const [sort, setSort] = useState<"created" | "updated" | "comments" | "stars">(initialState?.sort || "created");
  const [order, setOrder] = useState<"asc" | "desc">(initialState?.order || "desc");
  const [hideLinkedPRs, setHideLinkedPRs] = useState(initialState?.hideLinkedPRs || false);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <SearchContext.Provider
      value={{
        draft, setDraft,
        applied, setApplied,
        currentPage, setCurrentPage,
        cursorHistory, setCursorHistory,
        sort, setSort,
        order, setOrder,
        hideLinkedPRs, setHideLinkedPRs,
        isSearching, setIsSearching
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
