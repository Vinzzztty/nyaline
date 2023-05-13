const {
    DisconnectReason,
    useSingleFileAuthState,
} = require("@adiwajshing/baileys");
const makeWASocket = require("@adiwajshing/baileys").default;
const axios = require("axios");

function generateID() {
    let characters = "0123456789";
    let id = "";

    for (let i = 0; i < 5; i++) {
        let randomIndex = Math.floor(Math.random() * characters.length);
        id += characters.charAt(randomIndex);
    }

    return id;
}

const startSock = () => {
    const { state, saveState } = useSingleFileAuthState("./auth.json");

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });

    // Mengecek Masalah Connection
    sock.ev.on("connection.update", function (update, connection2) {
        let _a, _b;
        let connection = update.connection,
            lastDisconnect = update.lastDisconnect;

        if (connection == "close") {
            if (
                ((_b =
                    (_a = lastDisconnect.error) === null || _a === void 0
                        ? void 0
                        : _a.output) === null || _b === void 0
                    ? void 0
                    : _b.statusCode) !== DisconnectReason.loggedOut
            ) {
                startSock();
            }
        } else {
            console.log("Connection Closed");
        }

        console.log("Connection Update", update);
    });

    sock.ev.on("creds.update", saveState);

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];

        // console.log(JSON.stringify(message));

        if (!msg.key.fromMe && m.type === "notify") {
            // Mendapatkan No HP
            let no_hp = msg.key.remoteJid;

            // Mendapatkan Message
            let pesan = msg.message.conversation;
            rubah = pesan.split("#");

            console.log(`No HP: ${no_hp}\nPesan: ${pesan}`);

            if (msg.key.remoteJid.includes("@s.whatsapp.net")) {
                if (msg.message) {
                    // Command CEK STATUS

                    if (
                        msg.message.conversation.toLowerCase() == "cek status"
                    ) {
                        axios
                            .get(
                                "https://script.google.com/macros/s/AKfycbw9VZTLKDU20-AsaEgYOwj-radNGbtzxc8QQdB9u6gGagCsodsuwRFgBHnQVaw0HoaLvw/exec?no_whatsapp=" +
                                    no_hp.replace("@s.whatsapp.net", "")
                            )
                            .then(async (response) => {
                                console.log(response.data);
                                const { success, data, message } =
                                    response.data;
                                let str;

                                if (success) {
                                    //str = `Halo kak ${data.nama},\n\n*Status Cucian Anda*\nNo Order: ${data.no_order}\nJenis Layanan: ${data.jenis_layanan}\nTotal Bayar: ${data.total_bayar}\n\nStatus: ${data.status}`;
                                    str = `*Hai, ${data.nama.toUpperCase()}*\n---------------------------------------\nStatus Keuangan anda:\n- Uang Pribadi: ${
                                        data.uang_pribadi
                                    }\n- Uang Jualan: ${
                                        data.uang_jualan
                                    }\n---------------------------------------\n*Total Uang: ${
                                        data.total_uang
                                    }*`;
                                    await sock.sendMessage(no_hp, {
                                        text: str,
                                    });
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                sock.sendMessage(msg.key.remoteJid, {
                                    text: `Silahkan gunakan Nomor WhatsApp yang benar`,
                                });
                            });
                    } else if (
                        pesan.toLowerCase() == "info" ||
                        pesan.toLowerCase() == "faq"
                    ) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `Hai 👋, Panggil Aku *NYALINE*.\n---------------------------------------\nSaya Bot Pintar yang terintegrasi dengan whatsapp yang memudahkan pelaku UMKM dalam mencatat keuangannya dan membagi keuangannya:\n*-uang pribadi*\n*-uang jualan*\n\n_Silahkan tulis kata:\n- *cek status* untuk keuangan anda.`,
                        });
                    } else if (msg.message.conversation.length > 12) {
                        const data = {
                            id_user: generateID(),
                            nama: rubah[1],
                            no_whatsapp: rubah[2],
                            uang_pribadi: rubah[3],
                            uang_jualan: rubah[4],
                            total_uang: parseInt(rubah[3]) + parseInt(rubah[4]),
                        };

                        axios
                            .post(
                                "https://script.google.com/macros/s/AKfycbw9VZTLKDU20-AsaEgYOwj-radNGbtzxc8QQdB9u6gGagCsodsuwRFgBHnQVaw0HoaLvw/exec?no_whatsapp=" +
                                    no_hp.replace("@s.whatsapp.net", ""),
                                data
                            )
                            .then(async (response) => {
                                console.log(
                                    "Data berhasil terdaftar\n",
                                    response.data
                                );

                                const { success, data, message } =
                                    response.data;
                                let str;
                            });
                        // send a list message!
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `Data Berhasil Terdaftar\n\nSilahkan ketik *"info"*`,
                        });
                    } else {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `Hai 👋, Panggil Aku *NYALINE*.\n---------------------------------------\nSaya Bot Pintar yang terintegrasi dengan whatsapp yang memudahkan pelaku UMKM dalam mencatat keuangannya dan membagi keuangannya:\n*-uang pribadi*\n*-uang jualan*\n\nKarena anda pertama kali. _Silahkan lakukan registrasi terlebih dahulu._\n---------------------------------------\n*Ketikkan: daftar#nama#no_wa#uang_pribadi#uang_hasil_jualan*\n_Contohnya: daftar#budi#62878567820#700000#800000_\n\nSetelah itu tekan *"kirim"* atau tanda *">"*`,
                        });
                    }
                }
            }
        }
    });
};

startSock();
