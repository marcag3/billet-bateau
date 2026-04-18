import { useAppState } from "src/store/appState";
import { useConfigs } from "src/store/configs";

export default function (total) {
    const configs = useConfigs();
    // The URL where the Point of Sale app will send the transaction results.
    var callbackUrl = useAppState().baseURL + "/square-callback";

    // Your application ID
    var applicationId = configs.find("square_app_id").value;

    // The total and currency code should come from your transaction flow.
    // For now, we are hardcoding them.
    var transactionTotal = parseInt(Number(total) * 100);
    var currencyCode = "CAD";

    // The version of the Point of Sale SDK that you are using.
    var sdkVersion = "v2.0";

    function openURL() {
        // Configure the allowable tender types
        var tenderTypes = ["com.squareup.pos.TENDER_CARD", "com.squareup.pos.TENDER_CASH"].join(",");

        var posUrl = [
            "intent:#Intent",
            "action=com.squareup.pos.action.CHARGE",
            "package=com.squareup",
            "S.com.squareup.pos.WEB_CALLBACK_URI=" + callbackUrl,
            "S.com.squareup.pos.CLIENT_ID=" + applicationId,
            "S.com.squareup.pos.API_VERSION=" + sdkVersion,
            "i.com.squareup.pos.TOTAL_AMOUNT=" + transactionTotal,
            "S.com.squareup.pos.CURRENCY_CODE=" + currencyCode,
            "S.com.squareup.pos.TENDER_TYPES=" + tenderTypes,
            "end",
        ].join(";");
        window.open(posUrl);
    }

    return { openURL };
}
