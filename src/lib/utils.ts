import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BASE_URL } from "@/api/apiClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractCurrencySymbol(currencyString: string | undefined): string {
  if (!currencyString) return "$";
  const match = currencyString.match(/\((.*?)\)/);
  return match ? match[1] : (currencyString || "$");
}

export function printViaIframe(url: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000);
  };
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = BASE_URL.replace(/\/$/, '');
  const imagePath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${imagePath}`;
}
