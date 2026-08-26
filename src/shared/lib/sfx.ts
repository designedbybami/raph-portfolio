"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { createUISFX, type CueName, type UISFXPlayer } from "uisfx";

// "Deep impacts, polished tails, quiet scale": the restrained end of the catalogue, matching the dark editorial art direction rather than a playful UI kit.
const PACK = "cinematic";
const VOLUME = 0.35;
const STORAGE_KEY = "raph:sound";

// Hover fires per pointer-enter, and the About chips sit twelve in a row.
const HOVER_COOLDOWN_MS = 140;

let player: UISFXPlayer | null = null;
let enabled = false;
// Audio can only start from a real gesture. Until one lands, cues raised by animations and timers are dropped rather than queued into a burst later.
let unlocked = false;
let hydrated = false;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function readStoredPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function getPlayer() {
  if (typeof window === "undefined") return null;
  player ??= createUISFX({ pack: PACK, volume: VOLUME, enabled });
  return player;
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
  const current = getPlayer();
  // Order matters: silence what is already running before the flag stops new plays, so muting is immediate rather than waiting out a tail.
  if (!next) current?.stopAll();
  current?.setEnabled(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Private mode and blocked storage both fail here; the toggle still works for this session.
  }
  notify();
}

// Web Audio starts suspended and can only resume from inside a real gesture. Turning sound on is itself one, which is why nothing needs a separate priming tap.
export function unlockAudio() {
  const current = getPlayer();
  if (!current) return;
  unlocked = true;
  void current.unlock();
}

// Call from a real pointer or key handler: this is also what unlocks audio for every ambient cue below.
export function playCue(cue: CueName, options?: { volume?: number; cooldownMs?: number }) {
  if (!enabled) return null;
  const current = getPlayer();
  if (!current) return null;
  unlocked = true;
  return current.play(cue, options);
}

// Call from animation callbacks and timers: silent until a gesture has unlocked audio, so a hard refresh never opens with a sound nobody asked for.
export function playAmbientCue(cue: CueName, options?: { volume?: number }) {
  if (!unlocked) return null;
  return playCue(cue, options);
}

// Pointer-driven hover only. Touch synthesises hover on tap, which would double up with the tap's own cue.
export function playHoverCue(cue: CueName = "hover") {
  if (typeof window === "undefined") return null;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return null;
  return playCue(cue, { volume: 0.5, cooldownMs: HOVER_COOLDOWN_MS });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useSoundPreference() {
  // An external store rather than state: the preference lives outside React so non-component call sites can read it, and the server snapshot keeps the first paint matching the markup.
  const soundOn = useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );

  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    const stored = readStoredPreference();
    if (stored) setSoundEnabled(true);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !enabled;
    setSoundEnabled(next);
    if (next) unlockAudio();
  }, []);

  return { soundOn, toggleSound };
}
