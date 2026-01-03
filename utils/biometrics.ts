
/**
 * Asynchronously checks if the device supports platform-level biometrics (TouchID, FaceID, Windows Hello).
 */
export const isBiometricsSupported = async (): Promise<{supported: boolean, reason?: string}> => {
    // 1. Check for Secure Context (Critical for Mac/Safari)
    if (!window.isSecureContext) {
        return { supported: false, reason: "Insecure Context. Biometrics require HTTPS or localhost." };
    }

    // 2. Check for WebAuthn API availability
    if (!(window.PublicKeyCredential && 
          window.crypto && 
          window.crypto.subtle)) {
        return { supported: false, reason: "WebAuthn API not available in this browser." };
    }

    // 3. Check for Platform Hardware
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return { 
            supported: available, 
            reason: available ? undefined : "No biometric hardware (Touch ID/Face ID) detected or enabled." 
        };
    } catch {
        return { supported: false, reason: "Hardware check failed." };
    }
};

const CREDENTIAL_ID_KEY = 'mvault_biometric_id';
const ENCRYPTED_PASS_KEY = 'mvault_biometric_blob';

/**
 * Registers the device's biometric hardware
 */
export const registerBiometrics = async (masterPassword: string): Promise<{success: boolean, error?: string}> => {
    const { supported, reason } = await isBiometricsSupported();
    if (!supported) return { success: false, error: reason };

    try {
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));
        const userID = window.crypto.getRandomValues(new Uint8Array(16));
        
        // Strict RP ID logic for Mac/Safari
        // Must be a valid domain name, not an IP.
        const hostname = window.location.hostname;
        const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
        
        if (isIp) {
            return { success: false, error: "Biometrics cannot be used on IP addresses. Use a domain or localhost." };
        }

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: "mVault Security",
                id: hostname || "localhost",
            },
            user: {
                id: userID,
                name: "mvault-user",
                displayName: "mVault User",
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" }, // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
                residentKey: "preferred",
                requireResidentKey: false,
            },
            timeout: 60000,
            attestation: "none",
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
        }) as PublicKeyCredential;

        if (credential) {
            localStorage.setItem(CREDENTIAL_ID_KEY, btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
            localStorage.setItem(ENCRYPTED_PASS_KEY, btoa(masterPassword));
            return { success: true };
        }
        return { success: false, error: "Authentication failed or timed out." };
    } catch (err: any) {
        console.error("Biometric registration error:", err);
        let msg = "Setup failed.";
        if (err.name === 'NotAllowedError') msg = "Access denied. Ensure Touch ID is setup in System Settings.";
        if (err.name === 'SecurityError') msg = "Security error. Are you using HTTPS?";
        if (err.name === 'InvalidStateError') msg = "Authenticator already registered.";
        return { success: false, error: msg };
    }
};

/**
 * Requests biometric verification and returns the saved password
 */
export const authenticateBiometrics = async (): Promise<string | null> => {
    const credIdB64 = localStorage.getItem(CREDENTIAL_ID_KEY);
    const passB64 = localStorage.getItem(ENCRYPTED_PASS_KEY);
    
    if (!credIdB64 || !passB64) return null;

    try {
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));
        const rawId = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));

        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: [{
                id: rawId,
                type: 'public-key',
            }],
            userVerification: "required",
            timeout: 60000,
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
        });

        if (assertion) {
            return atob(passB64);
        }
        return null;
    } catch (err) {
        console.error("Biometric authentication failed", err);
        return null;
    }
};

export const disableBiometrics = () => {
    localStorage.removeItem(CREDENTIAL_ID_KEY);
    localStorage.removeItem(ENCRYPTED_PASS_KEY);
};
