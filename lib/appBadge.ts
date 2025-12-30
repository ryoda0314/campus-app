/**
 * App Badge Utility
 * Wrapper for navigator.setAppBadge() with feature detection
 * Supports iOS 16.4+ PWAs installed to Home Screen
 */

/**
 * Check if the Badging API is supported
 */
export function isAppBadgeSupported(): boolean {
    return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

/**
 * Update the app badge count on the home screen icon
 * @param count - Number to display (0 or undefined to show dot only)
 */
export async function updateAppBadge(count?: number): Promise<void> {
    if (!isAppBadgeSupported()) {
        console.log("App Badge API not supported");
        return;
    }

    try {
        if (count !== undefined && count > 0) {
            await navigator.setAppBadge(count);
        } else {
            await navigator.setAppBadge();
        }
    } catch (error) {
        console.error("Failed to set app badge:", error);
    }
}

/**
 * Clear the app badge from the home screen icon
 */
export async function clearAppBadge(): Promise<void> {
    if (!isAppBadgeSupported()) {
        return;
    }

    try {
        await navigator.clearAppBadge();
    } catch (error) {
        console.error("Failed to clear app badge:", error);
    }
}
