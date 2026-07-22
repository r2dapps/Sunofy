// Pure JavaScript DES Cipher Implementation (Zero OpenSSL native dependencies)
// Decrypts JioSaavn encrypted_media_url in Node 18, Node 20, Vercel, and browser!

const pc1 = [
    57, 49, 41, 33, 25, 17,  9,  1, 58, 50, 42, 34, 26, 18,
    10,  2, 59, 51, 43, 35, 27, 19, 11,  3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,  7, 62, 54, 46, 38, 30, 22,
    14,  6, 61, 53, 45, 37, 29, 21, 13,  5, 28, 20, 12,  4
];
const pc2 = [
    14, 17, 11, 24,  1,  5,  3, 28, 15,  6, 21, 10,
    23, 19, 12,  4, 26,  8, 16,  7, 27, 20, 13,  2,
    41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
];
const shifts = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
const ip = [
    58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17,  9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7
];
const fp = [
    40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41,  9, 49, 17, 57, 25
];
const expansion = [
    32,  1,  2,  3,  4,  5,  4,  5,  6,  7,  8,  9,
     8,  9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32,  1
];
const sboxes = [
    [[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],[0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],[4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],[15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]],
    [[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],[3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],[0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],[13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]],
    [[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],[13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],[13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],[1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]],
    [[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],[13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],[10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],[3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]],
    [[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],[14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],[4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],[11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]],
    [[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],[10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],[9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],[4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]],
    [[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],[13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],[1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],[6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]],
    [[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],[1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2],[7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],[2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]]
];
const p = [
    16,  7, 20, 21, 29, 12, 28, 17,  1, 15, 23, 26,  5, 18, 31, 10,
     2,  8, 24, 14, 32, 27,  3,  9, 19, 13, 30,  6, 22, 11,  4, 25
];

function permute(src, map) {
    let out = 0;
    for (let i = 0; i < map.length; i++) {
        const bit = (src >> (64 - map[i])) & 1;
        out = (out << 1) | bit;
    }
    return out;
}

function generateKeys(keyBytes) {
    let keyBits = 0n;
    for (let i = 0; i < 8; i++) {
        keyBits = (keyBits << 8n) | BigInt(keyBytes[i] || 0);
    }
    let permKey = 0n;
    for (let i = 0; i < 56; i++) {
        const bit = (keyBits >> BigInt(64 - pc1[i])) & 1n;
        permKey = (permKey << 1n) | bit;
    }
    let c = Number((permKey >> 28n) & 0xfffffffn);
    let d = Number(permKey & 0xfffffffn);
    const subKeys = [];

    for (let i = 0; i < 16; i++) {
        const shift = shifts[i];
        c = ((c << shift) | (c >> (28 - shift))) & 0xfffffff;
        d = ((d << shift) | (d >> (28 - shift))) & 0xfffffff;
        const cd = (BigInt(c) << 28n) | BigInt(d);
        let subKey = 0n;
        for (let j = 0; j < 48; j++) {
            const bit = (cd >> BigInt(56 - pc2[j])) & 1n;
            subKey = (subKey << 1n) | bit;
        }
        subKeys.push(subKey);
    }
    return subKeys;
}

function desDecryptBlock(block, keys) {
    let bits = 0n;
    for (let i = 0; i < 8; i++) {
        bits = (bits << 8n) | BigInt(block[i]);
    }
    let ipVal = 0n;
    for (let i = 0; i < 64; i++) {
        const bit = (bits >> BigInt(64 - ip[i])) & 1n;
        ipVal = (ipVal << 1n) | bit;
    }

    let l = Number((ipVal >> 32n) & 0xffffffffn);
    let r = Number(ipVal & 0xffffffffn);

    for (let i = 15; i >= 0; i--) {
        const tempL = r;
        let eVal = 0n;
        for (let j = 0; j < 48; j++) {
            const bit = (BigInt(r) >> BigInt(32 - expansion[j])) & 1n;
            eVal = (eVal << 1n) | bit;
        }
        const xorVal = eVal ^ keys[i];
        let sOut = 0;
        for (let s = 0; s < 8; s++) {
            const shift = BigInt(42 - s * 6);
            const chunk = Number((xorVal >> shift) & 0x3Fn);
            const row = ((chunk & 0x20) >> 4) | (chunk & 0x01);
            const col = (chunk & 0x1E) >> 1;
            const val = sboxes[s][row][col];
            sOut = (sOut << 4) | val;
        }

        let pVal = 0;
        for (let j = 0; j < 32; j++) {
            const bit = (sOut >> (32 - p[j])) & 1;
            pVal = (pVal << 1) | bit;
        }

        r = (l ^ pVal) >>> 0;
        l = tempL;
    }

    const preFp = (BigInt(r) << 32n) | BigInt(l);
    let finalVal = 0n;
    for (let i = 0; i < 64; i++) {
        const bit = (preFp >> BigInt(64 - fp[i])) & 1n;
        finalVal = (finalVal << 1n) | bit;
    }

    const outBuf = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
        outBuf[i] = Number(finalVal & 0xffn);
        finalVal >>= 8n;
    }
    return outBuf;
}

function decryptJioSaavnUrl(b64Encrypted) {
    if (!b64Encrypted) return '';
    try {
        const encryptedBytes = Buffer.from(b64Encrypted, 'base64');
        const keyBytes = Buffer.from('38588589', 'utf8');
        const keys = generateKeys(keyBytes);

        let decryptedBytes = [];
        for (let i = 0; i < encryptedBytes.length; i += 8) {
            const block = encryptedBytes.slice(i, i + 8);
            if (block.length === 8) {
                const decBlock = desDecryptBlock(block, keys);
                for (let b of decBlock) decryptedBytes.push(b);
            }
        }

        // Apply PKCS7 unpadding
        const padLen = decryptedBytes[decryptedBytes.length - 1];
        if (padLen > 0 && padLen <= 8) {
            decryptedBytes = decryptedBytes.slice(0, decryptedBytes.length - padLen);
        }

        const rawUrl = Buffer.from(decryptedBytes).toString('utf8').trim();
        return rawUrl.replace(/_96\.mp4|_96\.m4a/, '_320.mp3');
    } catch (e) {
        return '';
    }
}

module.exports = { decryptJioSaavnUrl };
