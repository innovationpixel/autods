import { toast } from "./toast";

/**
 * Open Stripe / PayPal checkout in a new browser tab.
 * Falls back to same-tab navigation if the popup is blocked.
 */
export function openPaymentCheckout(url) {
  if (!url) {
    return false;
  }

  const tab = window.open(url, "_blank", "noopener,noreferrer");

  if (!tab) {
    toast.warn("Your browser blocked the payment window. Allow popups for this site, or try again.");
    return false;
  }

  tab.opener = null;
  toast.info("Complete payment in the new tab. You can return here when finished.");
  return true;
}
