const https = require('https')

const planetsRequested = {}
const actorsRequested = {}

const requestApi = (url, callback) => https.get(url, response => {
  let data = ''
  response.on('data', chunk => data += chunk);
  response.on('end', () => callback(JSON.parse(data)));

}).on("error", (err) => {
  console.log("Error: " + err.message);
})


// request array of url in api and store result
const requestElement = (element, storage, storeKeys) => new Promise((resolve) => {
  const requestedElements = []
  // get object data, if not exists in storage... request element data and store it
  const _requestElement = (idx = 0) => {
    if (element[idx]) {
      if (!storage[element[idx]]) {
        requestApi(element[idx].replace('http', 'https'), data => {
          console.log('-------------------data', storeKeys, data);
          const storeData = storeKeys.map(key => data[key])
          storage[element[idx]] = storeData
          requestedElements.push(storeData)
          requestElement(++idx)
        })
      } else {
        requestedElements.push(storage[element[idx]])
        requestElement(++idx)
      }
    } else {
      resolve(requestedElements)
    }
  }
  _requestElement()
})


const parseFilmsData = data => {
  const planetKeys = ['name', 'terrain', 'gravity', 'diameter', 'population']
  const actorKeys = ['name', 'gender', 'hair_color', 'skin_color', 'eye_color', 'height', 'homeworld']

  return data.results.reduce(async (prev, actual) => {
    try {
      const { title, planets: _planets, characters } = actual // get parent objects
      const planets = await requestElement(_planets, planetsRequested, planetKeys)
      
      const actors = await requestElement(characters, actorsRequested, actorKeys)
      return [
        ...prev,
        {
          title,
          planets,
          actors
        }
      ]
    } catch (error) {
      console.error('error iterating' + error.message)
    }

  }, [])
}




const requestFilms = () => requestApi('https://swapi.dev/api/films/', parseFilmsData)

const runAPI = () => {
  requestFilms();
}

// https.createServer((req, res) => {
//   res.end(runAPI())
// })

runAPI();