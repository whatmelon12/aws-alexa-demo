const Alexa = require("ask-sdk-core");
const i18n = require("i18next");
const sprintf = require("i18next-sprintf-postprocessor");
// const converter = require("number-to-words");
const NumerosALetra = require("./utils/numerosALetras");
const numerosALetras = new NumerosALetra();
const Aludra = require("./services/aludraClient");
const { sendDirective } = require("./services/alexaClient");
const languageStrings = require("./i18n");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechText = requestAttributes.t("WELCOME_MESSAGE");
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const GetProfileIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "ProfileIntent"
    );
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const userId =
      handlerInput.requestEnvelope.request.intent.slots.userId.value;

    try {
      const { name } = await Aludra.getUserProfile(userId);
      const speechText = requestAttributes.t("GET_PROFILE_MESSAGE", name);
      return handlerInput.responseBuilder
        .speak(speechText)
        .withShouldEndSession(true)
        .getResponse();
    } catch (error) {
      const speechText = requestAttributes.t(
        error.messageCode || "ERROR_MESSAGE"
      );
      return handlerInput.responseBuilder
        .speak(speechText)
        .withShouldEndSession(true)
        .getResponse();
    }
  }
};

const GetProductPriceIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "ProductPriceIntent"
    );
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const productName =
      handlerInput.requestEnvelope.request.intent.slots.productName.value;
    try {
      const result = await Promise.all([
        Aludra.getProductByName(productName),
        sendDirective(
          {
            url: handlerInput.requestEnvelope.context.System.apiEndpoint,
            token: handlerInput.requestEnvelope.context.System.apiAccessToken,
            requestId: handlerInput.requestEnvelope.request.requestId
          },
          requestAttributes.t("PRODUCT_SEARCH_MESSAGE")
        )
      ]);
      const products = result[0];
      const index = Math.round(Math.random() * products.length);
      let speechText;

      if (products && products.length > 0) {
        speechText = requestAttributes.t(
          "PRODUCT_FOUND_MESSAGE",
          productName,
          products[index].ProductName.replace(/[^a-zA-Z ]/g, ""),
          numerosALetras.convertir(products[index].Price || 1, {
            currencyLabel: true
          })
        );
      } else {
        speechText = requestAttributes.t(
          "PRODUCT_NOT_FOUND_MESSAGE",
          productName
        );
      }

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(requestAttributes.t("REPROMPT_MESSAGE"))
        .getResponse();
    } catch (error) {
      const speechText = requestAttributes.t(
        error.messageCode || "ERROR_MESSAGE",
        productName
      );
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(requestAttributes.t("REPROMPT_MESSAGE"))
        .getResponse();
    }
  }
};

const GetSKUPriceIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "SKUPriceIntent"
    );
  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sku = handlerInput.requestEnvelope.request.intent.slots.sku.value;
    try {
      const products = await Aludra.getProductBySku(sku);
      let speechText;

      if (products && products.length > 0) {
        speechText = requestAttributes.t(
          "SKU_FOUND_MESSAGE",
          products[0].ProductName.replace(/[^a-zA-Z ]/g, ""),
          numerosALetras.convertir(products[0].Price || 1, {
            currencyLabel: true
          })
        );
      } else {
        speechText = requestAttributes.t("SKU_NOT_FOUND");
      }

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(requestAttributes.t("REPROMPT_MESSAGE"))
        .getResponse();
    } catch (error) {
      const speechText = requestAttributes.t(
        error.messageCode || "ERROR_MESSAGE"
      );
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(requestAttributes.t("REPROMPT_MESSAGE"))
        .getResponse();
    }
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${
        handlerInput.requestEnvelope.request.reason
      }`
    );
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t("ERROR_MESSAGE"))
      .withShouldEndSession(true)
      .getResponse();
  }
};

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      fallbackLng: "es-MX",
      resources: languageStrings
    });

    localizationClient.localize = function() {
      const args = arguments;
      let values = [];

      for (var i = 1; i < args.length; i++) {
        values.push(args[i]);
      }

      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: "sprintf",
        sprintf: values
      });

      return value;
    };

    handlerInput.attributesManager.setRequestAttributes({
      t: function(...args) {
        return localizationClient.localize(...args);
      }
    });
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GetProfileIntentHandler,
    GetProductPriceIntentHandler,
    GetSKUPriceIntentHandler,
    SessionEndedRequestHandler
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
