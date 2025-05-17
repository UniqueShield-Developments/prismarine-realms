const { Authflow } = require("prismarine-auth")
const { RealmAPI } = require("prismarine-realms")
process.stdin.setEncoding('utf8');
const authflow = new Authflow()
    ; (async () => {
        const { userXUID } = await authflow.getXboxToken();
        const mctokens = await authflow.getXboxToken("https://pocket.realms.minecraft.net/");
        const api = RealmAPI.from(mctokens, "bedrock")

        const realms = await api.getRealms();
        console.log("Available Realms:");
        realms.filter((i) => i.ownerUUID == userXUID).forEach((realm, idx) => {
            console.log(`${idx + 1}: ${realm.name} (ID: ${realm.id})`);
        });

        const pickRealm = () => new Promise(resolve => {
            process.stdout.write('Enter the number of the realm you want to select: ');
            process.stdin.once('data', answer => {
                const index = parseInt(answer.trim(), 10) - 1;
                if (index >= 0 && index < realms.length) {
                    resolve(realms[index]);
                } else {
                    console.log("Invalid selection.");
                    process.exit(1);
                }
            });
        });

        const selectedRealm = (await pickRealm()).id
        process.stdin.pause();
        api.uploadBehaviourPack(selectedRealm, "./bp")

    })()

