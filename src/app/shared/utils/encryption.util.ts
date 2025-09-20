const ENCRYPTION_KEY = 'clave_super_segura_123'; // ¡mejor almacenarla en env o backend!

function encrypt(text: string): string {
    const encrypted = btoa(unescape(encodeURIComponent(text + ENCRYPTION_KEY)));
    return encrypted;
}

function decrypt(text: string): string {
    try {
        const decrypted = decodeURIComponent(escape(atob(text)));
        return decrypted.replace(ENCRYPTION_KEY, '');
    } catch (e) {
        return '';
    }
}
export { encrypt, decrypt };