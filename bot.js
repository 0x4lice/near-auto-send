const nearAPI = require("near-api-js");
const fs = require("fs");
const readline = require("readline");

// Path ke pk.txt dan wallet.txt
const PK_FILE = "pk.txt";
const WALLET_FILE = "wallet.txt";

// Load private key dari file
const privateKey = fs.readFileSync(PK_FILE, 'utf-8').trim(); // Pastikan formatnya ed25519:<private_key>

// Load daftar wallet penerima dari file
const wallets = fs.readFileSync(WALLET_FILE, 'utf-8').split("\n").map(wallet => wallet.trim()).filter(Boolean);

// Fungsi untuk mengirim NEAR
async function sendNear(senderAccount, receiverWallet, amount) {
    try {
        // Membuat transaksi
        const result = await senderAccount.sendMoney(receiverWallet, amount);
        console.log(`Berhasil mengirim ${amount / 10**24} NEAR ke ${receiverWallet}. TX: https://explorer.near.org/transactions/${result.transaction.hash}`);
    } catch (error) {
        console.log(`Gagal mengirim ke ${receiverWallet}: ${error.message}`);
    }
}

// Fungsi untuk meminta input jumlah NEAR dari pengguna
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
}

// Fungsi utama untuk melakukan pengiriman ke beberapa wallet
async function main() {
    const { connect, KeyPair, keyStores } = nearAPI;

    // Inisialisasi InMemoryKeyStore untuk menyimpan kunci
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(privateKey);  // Gunakan private key dari file pk.txt
    await keyStore.setKey("mainnet", "yourwallet.near", keyPair);  // Ganti dengan akun pengirim yang benar

    const config = {
        networkId: "mainnet",  // Ganti dengan "testnet" jika ingin uji coba
        keyStore, 
        nodeUrl: "https://rpc.mainnet.near.org",  // Gunakan "https://rpc.testnet.near.org" untuk testnet
        walletUrl: "https://wallet.mainnet.near.org", 
        helperUrl: "https://helper.mainnet.near.org", 
        explorerUrl: "https://explorer.mainnet.near.org"
    };

    // Hubungkan ke jaringan NEAR
    const near = await connect(config);
    const senderAccount = await near.account("yourwallet.near");  // Ganti dengan nama akun pengirim yang benar

    // Meminta input jumlah NEAR dari pengguna
    const amountInNear = parseFloat(await askQuestion("Masukkan jumlah NEAR yang ingin dikirim: "));
    const amount = nearAPI.utils.format.parseNearAmount(amountInNear.toString());  // Mengkonversi NEAR ke YoctoNEAR

    // Kirim NEAR ke setiap wallet penerima
    for (const wallet of wallets) {
        await sendNear(senderAccount, wallet, amount);
    }
}

main();
