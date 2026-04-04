import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TourStep =
  | "welcome"
  | "explore_filters"
  | "support_lobby"
  | "press_action"
  | "community_channels"
  | "ai_populus"
  | "legislative_tracking"
  | "tour_complete";

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextValue {
  isTourActive: boolean;
  currentStep: TourStep | null;
  startTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTour: () => void;
  hasCompletedTour: boolean;
  currentStepIndex: number;
  // Refs para spotlight
  filterBarRef: React.RefObject<any>;
  supportButtonRef: React.RefObject<any>;
  pressButtonRef: React.RefObject<any>;
  communityChannelsRef: React.RefObject<any>;
  aiToolsRef: React.RefObject<any>;
  legislativeRef: React.RefObject<any>;
  // Layouts medidos
  filterBarLayout: LayoutRect | null;
  supportButtonLayout: LayoutRect | null;
  pressButtonLayout: LayoutRect | null;
  communityChannelsLayout: LayoutRect | null;
  aiToolsLayout: LayoutRect | null;
  legislativeLayout: LayoutRect | null;
  setFilterBarLayout: (layout: LayoutRect) => void;
  setSupportButtonLayout: (layout: LayoutRect) => void;
  setPressButtonLayout: (layout: LayoutRect) => void;
  setCommunityChannelsLayout: (layout: LayoutRect) => void;
  setAiToolsLayout: (layout: LayoutRect) => void;
  setLegislativeLayout: (layout: LayoutRect) => void;
}

export const TOUR_STEPS: TourStep[] = [
  "welcome",
  "explore_filters",
  "support_lobby",
  "press_action",
  "community_channels",
  "ai_populus",
  "legislative_tracking",
  "tour_complete",
];

const TOUR_COMPLETED_KEY = "@populus_tour_completed";

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  const [filterBarLayout, setFilterBarLayout] = useState<LayoutRect | null>(null);
  const [supportButtonLayout, setSupportButtonLayout] = useState<LayoutRect | null>(null);
  const [pressButtonLayout, setPressButtonLayout] = useState<LayoutRect | null>(null);
  const [communityChannelsLayout, setCommunityChannelsLayout] = useState<LayoutRect | null>(null);
  const [aiToolsLayout, setAiToolsLayout] = useState<LayoutRect | null>(null);
  const [legislativeLayout, setLegislativeLayout] = useState<LayoutRect | null>(null);

  const filterBarRef = useRef<any>(null);
  const supportButtonRef = useRef<any>(null);
  const pressButtonRef = useRef<any>(null);
  const communityChannelsRef = useRef<any>(null);
  const aiToolsRef = useRef<any>(null);
  const legislativeRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem(TOUR_COMPLETED_KEY).then((val) => {
      if (val === "true") setHasCompletedTour(true);
    });
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep("welcome");
    setIsTourActive(true);
  }, []);

  const skipTour = useCallback(async () => {
    setIsTourActive(false);
    setCurrentStep(null);
    await AsyncStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setHasCompletedTour(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (!prev) return null;
      const idx = TOUR_STEPS.indexOf(prev);
      if (idx < TOUR_STEPS.length - 1) {
        return TOUR_STEPS[idx + 1];
      }
      return null;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (!prev) return null;
      const idx = TOUR_STEPS.indexOf(prev);
      if (idx > 0) {
        return TOUR_STEPS[idx - 1];
      }
      return prev;
    });
  }, []);

  const completeTour = useCallback(async () => {
    setIsTourActive(false);
    setCurrentStep(null);
    await AsyncStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setHasCompletedTour(true);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        startTour,
        skipTour,
        nextStep,
        prevStep,
        completeTour,
        hasCompletedTour,
        currentStepIndex: currentStep ? TOUR_STEPS.indexOf(currentStep) : 0,
        filterBarRef,
        supportButtonRef,
        pressButtonRef,
        communityChannelsRef,
        aiToolsRef,
        legislativeRef,
        filterBarLayout,
        supportButtonLayout,
        pressButtonLayout,
        communityChannelsLayout,
        aiToolsLayout,
        legislativeLayout,
        setFilterBarLayout,
        setSupportButtonLayout,
        setPressButtonLayout,
        setCommunityChannelsLayout,
        setAiToolsLayout,
        setLegislativeLayout,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}
