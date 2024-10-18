// File: utils/browserDetection.ts

export function getBrowserName(): string {
    const userAgent = navigator.userAgent;
  
    if (userAgent.includes("Edg")) return "Microsoft Edge";
    if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Google Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Apple Safari";
    if (userAgent.includes("Firefox")) return "Mozilla Firefox";
    if (userAgent.includes("MSIE") || userAgent.includes("Trident")) return "Microsoft Internet Explorer";
  
    return "Unknown Browser";
  }
