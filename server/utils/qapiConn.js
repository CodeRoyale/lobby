const fetch = require('node-fetch');

const getQuestions = async (noIds) => {
  let response = await fetch(`${process.env.QAPI_URL}random?noIds=${noIds}`, {
    method: 'GET',
    headers: {
      useQueryString: true,
      accept: 'application/json',
      Authorization: `Bearer ${process.env.QAPI_BEARER}`,
      lobbyID: `${process.env.LOBBY_ID}`,
    },
  });
  response = await response.json();
  return response.payload.data;
};

const getTestcase = async (id) => {
  let response = await fetch(
    `${`${process.env.QAPI_URL}getTestcase`}?id=${id}`,
    {
      method: 'GET',
      headers: {
        useQueryString: true,
        accept: 'application/json',
        Authorization: `Bearer ${process.env.QAPI_BEARER}`,
        lobbyID: `${process.env.LOBBY_ID}`,
      },
    }
  );
  response = await response.json();
  return response.payload.data[id];
};
module.exports = { getQuestions, getTestcase };
