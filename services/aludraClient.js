const axios = require("axios");
const apimKey = "f871aa1d382a481d8616a9e4dfb86f81";
const apiKey =
  "vmQKox/Qx35HhsTTNX2MkCue2B7TEoGi04de+D8EfDvruOKvPuRQnPgK8s1VHyOOWZGspwK9hlEVfGaaPJgZt7TcG6gyXjjzc63wgGDwqxcR2R8hm63aKC5Mz8kuzKC2xQCAVmtphdgr6piRlBWKWXUvYoCSnSq8nmTU+kfAYL3NMWs1vTB2DJ0mPtAf8oQn+noEWRCK6I/FmI+RV/KXbXiG4bQy1HGakYKLAFvqDp4R0mpSHqDHz9LUIXYl+GXeVfWxqZUIujYddWe+q9dcrpAldcK757enH/jBB/kgf+/Wp1m104+2M+7sYg5EVkNhgwTz2LvDYAF6GZ7GI5OFAQ==";

const url = (mdl, path) =>
  `https://aludra-api-management.azure-api.net/${mdl}/prod/${path}`;

const headers = { "Ocp-Apim-Subscription-Key": apimKey, "Api-Key": apiKey };

const getUserProfile = async userId => {
  try {
    const { data: profile } = await axios.get(
      "https://jsonplaceholder.typicode.com/users/" + userId
    );
    return profile;
  } catch (error) {
    return Promise.reject({ message: "Could not find user" });
  }
};

const getProductByName = async productName => {
  try {
    const { data: response } = await axios.post(
      url("mdl04", "SearchProducts/Post"),
      { searchText: productName, pageNumber: 1, pageSize: 10 },
      { headers }
    );

    if (response.Status.Code !== 200) {
      return Promise.reject({
        messageCode: "PRODUCT_NOT_FOUND"
      });
    }

    return response.Data.map(({ Sku, ProductName, Price }) => ({
      Sku,
      ProductName,
      Price
    }));
  } catch (error) {
    return Promise.reject({
      messageCode: "PRODUCT_NOT_FOUND"
    });
  }
};

const getProductBySku = async sku => {
  try {
    const { data: response } = await axios.post(
      url("mdl04", "SearchProducts/Post"),
      { searchText: sku, pageNumber: 1, pageSize: 10 },
      { headers }
    );

    if (response.Status.Code !== 200) {
      return Promise.reject({
        messageCode: "SKU_NOT_FOUND"
      });
    }

    return response.Data.map(({ Sku, ProductName, Price }) => ({
      Sku,
      ProductName,
      Price
    }));
  } catch (error) {
    return Promise.reject({
      messageCode: "SKU_NOT_FOUND"
    });
  }
};

module.exports = { getUserProfile, getProductByName, getProductBySku };
