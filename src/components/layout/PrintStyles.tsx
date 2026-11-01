"use client";

import React from "react";

export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A5 portrait;
          margin: 10mm;
        }
        body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body * {
          visibility: hidden;
        }
        [data-print-target],
        [data-print-target] * {
          visibility: visible;
        }
        [data-print-target] {
          position: fixed;
          inset: 0 auto auto 0;
          width: 100%;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
        .print-hidden,
        button,
        nav,
        aside,
        header,
        footer {
          display: none !important;
        }
      }
    `}</style>
  );
}
