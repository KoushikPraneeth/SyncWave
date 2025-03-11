"use client";

import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export function QRCode({
  value,
  size = 200,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
}: QRCodeProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && qrContainerRef.current) {
      const loadQRCode = async () => {
        try {
          const QRCodeStyling = (await import("qr-code-styling")).default;

          const qrCode = new QRCodeStyling({
            width: size,
            height: size,
            type: "svg",
            data: value,
            dotsOptions: {
              color: fgColor,
              type: "rounded",
            },
            backgroundOptions: {
              color: bgColor,
            },
            cornersSquareOptions: {
              type: "extra-rounded",
            },
            cornersDotOptions: {
              type: "dot",
            },
          });

          // Clear previous QR code if any
          if (qrContainerRef.current) {
            qrContainerRef.current.innerHTML = "";
            qrCode.append(qrContainerRef.current);
          }
        } catch (error) {
          console.error("Failed to load QR code library:", error);
          // Fallback to text
          if (qrContainerRef.current) {
            qrContainerRef.current.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background:${bgColor};color:${fgColor};text-align:center;">${value}</div>`;
          }
        }
      };

      loadQRCode();
    }
  }, [value, size, bgColor, fgColor]);

  return <div ref={qrContainerRef} className="qr-code" />;
}
