"use client";

import { useCallback } from "react";
import styles from "./SplashScreenButton.module.css";

interface SplashScreenButtonProps {
  buttonText: string;
  onClick: () => void;
}

export default function SplashScreenButton({
  buttonText,
  onClick,
}: SplashScreenButtonProps) {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={styles.button}
      aria-label={buttonText}
    >
      <div className={styles.circle}>
        <div className={styles.icon} aria-hidden="true" />
      </div>
      <span className={styles.buttonText}>{buttonText}</span>
    </button>
  );
}
