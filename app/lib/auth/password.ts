import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return new Promise((resolve) => {
        const [salt, key] = hash.split(":");
        crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, derivedKey) => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(key === derivedKey.toString("hex"));
        });
    });
}
