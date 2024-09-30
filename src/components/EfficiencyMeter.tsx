import React, { useState, useEffect } from "react";

interface EfficiencyMeterProps {
  efficiency: number;
  size?: number;
  onColorChange: (color: string) => void;
}

export default function EfficiencyMeter({
  efficiency,
  size = 200,
  onColorChange,
}: EfficiencyMeterProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(efficiency), 100);
    return () => clearTimeout(timer);
  }, [efficiency]);

  const radius = size / 2;
  const strokeWidth = size / 20;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const getColor = (value: number) => {
    if (value <= 70) return "red";
    if (value <= 90) return "orange";
    if (value <= 110) return "green";
    return "gold";
  };

  const getText = (value: number) => {
    if (value <= 70) return "Below Goal";
    if (value <= 90) return "Near Goal";
    if (value <= 110) return "At Goal";
    return "Above Goal";
  };

  const color = getColor(efficiency);
  const text = getText(efficiency);

  useEffect(() => {
    onColorChange(color);
  }, [color, onColorChange]);

  const baseProgress = Math.min(progress, 100);
  const overProgress = Math.max(progress - 100, 0);

  const baseStrokeDasharray = `${
    (baseProgress / 100) * circumference
  } ${circumference}`;
  const overStrokeDasharray = `${
    (overProgress / 100) * circumference
  } ${circumference}`;

  onColorChange(color);

  const fontSize = size / 4; // Adjust this value to change the text size relative to the circle
  const smallFontSize = fontSize / 2.5; // Adjust this value for the smaller text

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg height={size} width={size} className="transform -rotate-90">
        <circle
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={baseStrokeDasharray}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {overProgress > 0 && (
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={overStrokeDasharray}
            strokeLinecap="round"
            style={{ filter: "brightness(0.7)" }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        )}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span
          className="font-bold"
          style={{
            color,
            fontSize: `${fontSize}px`,
            lineHeight: 1,
          }}
        >
          {efficiency}%
        </span>
        <span
          style={{
            color,
            fontSize: `${smallFontSize}px`,
            lineHeight: 1,
            marginTop: `${fontSize / 8}px`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
