import { useConfigs } from "src/store/configs";
import { ref } from "vue";
import { url } from "src/store/plugins";
import { api } from "src/boot/axios";
import { Payment, usePayments } from "src/store/payments";
import { useAppState } from "src/store/appState";

const appState = useAppState();
const configs = useConfigs();
let card;
const disableButton = ref(false);

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.onload = resolve;
        script.onerror = reject;
        script.src = src;
        document.head.append(script);
    });
};

async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");
    return card;
}

async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
        return tokenResult.token;
    } else {
        let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
        if (tokenResult.errors) {
            errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
        }

        throw new Error(errorMessage);
    }
}

async function useSquareCard() {
    await loadScript(
        useAppState().isDev
            ? "https://sandbox.web.squarecdn.com/v1/square.js"
            : "https://web.squarecdn.com/v1/square.js"
    );
    if (!window.Square) {
        throw new Error("Square.js failed to load properly");
    }
    let payments;
    let appId = configs.find("square_app_id").value;
    let locationId = appState.thisPointOfSale.square_location_id;
    try {
        payments = window.Square.payments(appId, locationId);
    } catch (e) {
        console.error("missing-credentials", e);
        return;
    }
    try {
        card = await initializeCard(payments);
        return card;
    } catch (e) {
        console.error("Initializing Card failed", e);
        return;
    }
}

async function createPayment() {
    const token = await tokenize(card);
    return new Promise((resolve, reject) => {
        api.post(url(usePayments()), {
            location_id: appState.thisPointOfSale.square_location_id,
            source_id: token,
        })
            .then(async (response) => {
                //some endpoint uses api resource and some don't
                let data = [];
                if ("data" in response.data) data = response.data.data;
                else data = response.data;

                const newPayment = new Payment(data);
                usePayments().list.push(newPayment);
                await usePayments().updateLists();
                await usePayments().updateRelated(newPayment);
                resolve(newPayment);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export { useSquareCard, createPayment, disableButton };
