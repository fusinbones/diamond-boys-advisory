// Discord integration removed — YourSwami now uses internal community (The Swami Lounge)
// These exports are kept as stubs to prevent import errors from the webhook route

export async function handlePaymentSuccess(_username: string, _tierName: string, _tierId?: string): Promise<void> {
    console.log(`[stub] Payment success: ${_username} → ${_tierName}`);
}

export async function handlePaymentFailure(_username: string): Promise<void> {
    console.log(`[stub] Payment failure: ${_username}`);
}

export async function logToModChannel(message: string): Promise<void> {
    console.log(`[mod-log] ${message}`);
}
