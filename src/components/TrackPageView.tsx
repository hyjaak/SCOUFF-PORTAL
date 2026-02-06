"use client";

import React from "react";
import { useTrackPageView } from "@/lib/useTrackPageView";

export default function TrackPageView() {
  useTrackPageView();
  return null;
}
